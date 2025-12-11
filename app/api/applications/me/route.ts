// app/api/applications/me/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const student = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        })

        if (!student)
            return NextResponse.json({ error: "Student not found" }, { status: 404 })

        // Delete expired test-only applications
        await prisma.application.deleteMany({
            where: {
                internship: {
                    testAssignmentDueDate: { lt: new Date() }
                }
            }
        })

        const applications = await prisma.application.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: "desc" },
            include: {
                internship: {
                    include: {
                        company: {
                            select: {
                                id: true,
                                name: true,
                                logo: true
                            }
                        },
                        assignments: true
                    }
                },
                student: {
                    include: {
                        assignments: {
                            include: {
                                submissions: true
                            }
                        }
                    }
                }
            }
        })

        const formatted = applications.map((app: typeof applications[0]) => {
            const assignmentsForInternship = app.student.assignments.filter(
                (a: { internshipId: string }) => a.internshipId === app.internshipId
            )

            const hasUploadedFiles = assignmentsForInternship.some(
                (a: { submissions: { id: string }[] }) => a.submissions.length > 0
            )

            const assignmentRequired = Boolean(app.internship.testAssignmentTitle)

            const project =
                assignmentsForInternship.length > 0
                    ? {
                        id: assignmentsForInternship[0].id,
                        title: assignmentsForInternship[0].title
                    }
                    : null

            return {
                ...app,
                hasUploadedFiles,
                assignmentRequired,
                project
            }
        })


        return NextResponse.json(formatted)
    } catch (err) {
        console.error("GET /api/applications/me error:", err)
        return NextResponse.json(
            { error: "Failed to fetch applications" },
            { status: 500 }
        )
    }
}
