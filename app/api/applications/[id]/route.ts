// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const { status } = await req.json()

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        // ======================================================
        // 1) Load the application + internship + project
        // ======================================================
        const data = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: true,
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
        // 2) Check assignment upload ONLY IF internship requires it
        // ======================================================
        const assignmentRequired = Boolean(data.internship.testAssignmentTitle)

        if (assignmentRequired) {
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
                a => a.submissions.length > 0
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

        return NextResponse.json(updatedApplication)
    } catch (error) {
        console.error("Error updating application:", error)
        return NextResponse.json(
            { error: "Failed to update application" },
            { status: 500 }
        )
    }
}
