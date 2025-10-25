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

        // Find the application and its relations
        const application = await prisma.application.findUnique({
            where: { id },
            include: { internship: true, student: true },
        })
        if (!application)
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            )

        // ✅ Check if the student uploaded any assignment files
        const assignment = await prisma.assignment.findFirst({
            where: {
                internshipId: application.internshipId,
                studentId: application.studentId,
            },
            include: { submissions: true },
        })

        const hasUploadedFiles =
            assignment && assignment.submissions && assignment.submissions.length > 0

        if (!hasUploadedFiles) {
            return NextResponse.json(
                {
                    error:
                        "The student has not uploaded any assignment files. You cannot approve or reject yet.",
                },
                { status: 400 }
            )
        }

        // ✅ Update application status
        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status },
            include: { internship: true, student: true },
        })

        // ✅ If approved, create project (if not exists)
        if (status === "APPROVED") {
            const existingProject = await prisma.project.findUnique({
                where: { applicationId: updatedApplication.id },
            })

            if (!existingProject) {
                await prisma.project.create({
                    data: {
                        title: updatedApplication.internship.title,
                        description: updatedApplication.internship.description,
                        internshipId: updatedApplication.internshipId,
                        applicationId: updatedApplication.id,
                        studentId: updatedApplication.studentId,
                        companyId: updatedApplication.internship.companyId,
                    },
                })
            }
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
