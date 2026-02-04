// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { notifyApplicationStatusChange } from "@/lib/notifications"
import { Permission } from "@prisma/client"
import { checkPermission, getUserCompanyByClerkId } from "@/lib/permissions"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const { status } = await req.json()

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        // Get membership and check permissions
        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership) {
            return NextResponse.json(
                { error: "Company membership not found" },
                { status: 404 }
            )
        }

        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.MANAGE_APPLICATIONS
        )
        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to manage applications" },
                { status: 403 }
            )
        }

        // ======================================================
        // 1) Load the application + internship + project
        // ======================================================
        const data = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: {
                    include: { company: true }
                },
                student: true,
                project: true,   // IMPORTANT for project creation check
            },
        })

        if (!data)
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            )

        // ======================================================
        // 1.5) Verify application belongs to user's company
        // ======================================================
        if (data.internship.companyId !== membership.companyId) {
            return NextResponse.json(
                { error: "You can only manage applications for your own internships" },
                { status: 403 }
            )
        }

        // ======================================================
        // 2) Check assignment upload ONLY IF internship requires it
        // ======================================================
        const assignmentRequired = Boolean(data.internship.testAssignmentTitle)

        if (assignmentRequired && status === "APPROVED") {
            const assignments = await prisma.assignment.findMany({
                where: {
                    internshipId: data.internshipId,
                    studentId: data.studentId,
                },
                include: {
                    submissions: { select: { id: true } },
                },
            })

            const hasUploadedFiles = assignments.some(
                (a: { submissions: { id: string }[] }) => a.submissions.length > 0
            )

            if (!hasUploadedFiles) {
                return NextResponse.json(
                    {
                        error:
                            "The student must upload the internship assignment before approval.",
                    },
                    { status: 400 }
                )
            }
        }

        // ======================================================
        // 3) Update application status
        // ======================================================
        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status },
            include: {
                internship: true,
                student: true,
            },
        })

        // ======================================================
        // 4) Create project if APPROVED and no project exists
        // ======================================================
        if (status === "APPROVED" && data.project === null) {
            await prisma.project.create({
                data: {
                    title: updatedApplication.internship.title,
                    description: updatedApplication.internship.description || "",
                    internshipId: updatedApplication.internshipId,
                    applicationId: updatedApplication.id,
                    studentId: updatedApplication.studentId,
                    companyId: updatedApplication.internship.companyId,
                },
            })
        }

        // ======================================================
        // 5) Send notification to student about status change
        // ======================================================
        const company = await prisma.company.findFirst({
            where: { id: updatedApplication.internship.companyId },
            select: { name: true, id: true }
        })
        
        await notifyApplicationStatusChange(
            updatedApplication.studentId,
            updatedApplication.internship.title,
            company?.name || "Company",
            status as "APPROVED" | "REJECTED",
            updatedApplication.id,  // applicationId
            company?.id             // companyId
        )

        return NextResponse.json(updatedApplication)
    } catch (error) {
        console.error("Error updating application:", error)
        return NextResponse.json(
            { error: "Failed to update application" },
            { status: 500 }
        )
    }
}
