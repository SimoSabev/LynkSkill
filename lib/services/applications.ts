// lib/services/applications.ts
// Application business rules shared by the REST routes and the AI agent,
// so both paths enforce exactly the same authorization and invariants.
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { notifyApplicationStatusChange, notifyNewApplication, notifyNewAssignment } from "@/lib/notifications"

export type ServiceResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; status: number }

const fail = (error: string, status = 400) => ({ ok: false as const, error, status })

/** Application window: stored as calendar days (midnight UTC), end day inclusive. */
export function isApplicationWindowOpen(start: Date, end: Date, now = new Date()): boolean {
    const closesAt = new Date(end.getTime() + 24 * 60 * 60 * 1000)
    return now >= start && now < closesAt
}

/** A student applies to an internship (creates test assignment + notifications). */
export async function applyToInternship(studentUserId: string, internshipId: string) {
    const student = await prisma.user.findUnique({
        where: { id: studentUserId },
        select: { id: true, role: true, email: true, profile: { select: { name: true } } },
    })
    if (!student || student.role !== "STUDENT") return fail("Only students can apply", 403)

    const internship = await prisma.internship.findUnique({
        where: { id: internshipId },
        include: { company: { select: { ownerId: true, name: true } } },
    })
    if (!internship) return fail("Internship not found", 404)

    if (!isApplicationWindowOpen(internship.applicationStart, internship.applicationEnd)) {
        return fail("Applications for this internship are closed")
    }

    let application
    try {
        application = await prisma.application.create({
            data: { studentId: student.id, internshipId },
        })
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            return fail("You have already applied to this internship")
        }
        throw err
    }

    await notifyNewApplication(
        internship.company.ownerId,
        student.profile?.name || student.email,
        internship.title
    )

    const hasTest =
        internship.testAssignmentTitle &&
        internship.testAssignmentDescription &&
        internship.testAssignmentDueDate

    if (hasTest) {
        try {
            await prisma.assignment.create({
                data: {
                    internshipId,
                    studentId: student.id,
                    title: internship.testAssignmentTitle!,
                    description: internship.testAssignmentDescription!,
                    dueDate: internship.testAssignmentDueDate!,
                },
            })
            await notifyNewAssignment(
                student.id,
                internship.testAssignmentTitle!,
                internship.company.name,
                internship.testAssignmentDueDate!
            )
        } catch (err) {
            console.error("Failed to create test assignment:", err)
        }
    }

    return {
        ok: true as const,
        data: { ...application, internship: { id: internship.id, title: internship.title, company: { name: internship.company.name } }, hasTest: Boolean(hasTest) },
    }
}

/** A company approves/rejects an application for one of its own internships. */
export async function setApplicationStatus(
    companyUserId: string,
    applicationId: string,
    status: "APPROVED" | "REJECTED"
) {
    const user = await prisma.user.findUnique({
        where: { id: companyUserId },
        select: { role: true, companies: { select: { id: true } } },
    })
    if (!user || user.role !== "COMPANY") return fail("Only companies can approve/reject applications", 403)

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { internship: { include: { company: true } }, project: true },
    })
    if (!application) return fail("Application not found", 404)

    if (!user.companies.some((c) => c.id === application.internship.companyId)) {
        return fail("You can only manage applications for your own internships", 403)
    }

    if (status === "APPROVED" && application.internship.testAssignmentTitle) {
        const submitted = await prisma.assignment.count({
            where: {
                internshipId: application.internshipId,
                studentId: application.studentId,
                submissions: { some: {} },
            },
        })
        if (submitted === 0) {
            return fail("The student must upload the internship assignment before approval.")
        }
    }

    const updated = await prisma.application.update({
        where: { id: applicationId },
        data: { status },
        include: { internship: true, student: { select: { id: true, email: true, profile: { select: { name: true } } } } },
    })

    if (status === "APPROVED" && application.project === null) {
        await prisma.project.create({
            data: {
                title: updated.internship.title,
                description: updated.internship.description || "",
                internshipId: updated.internshipId,
                applicationId: updated.id,
                studentId: updated.studentId,
                companyId: updated.internship.companyId,
            },
        })
    }

    await notifyApplicationStatusChange(
        updated.studentId,
        updated.internship.title,
        application.internship.company.name,
        status
    )

    return { ok: true as const, data: updated }
}

/** A student withdraws one of their own PENDING applications. */
export async function withdrawApplication(studentUserId: string, applicationId: string) {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { internship: { select: { title: true } } },
    })
    if (!application) return fail("Application not found", 404)
    if (application.studentId !== studentUserId) return fail("Not your application", 403)
    if (application.status !== "PENDING") {
        return fail(`Cannot withdraw ${application.status.toLowerCase()} application`)
    }

    await prisma.$transaction([
        prisma.assignment.deleteMany({
            where: { internshipId: application.internshipId, studentId: studentUserId, submissions: { none: {} } },
        }),
        prisma.application.delete({ where: { id: applicationId } }),
    ])

    return { ok: true as const, data: { title: application.internship.title } }
}
