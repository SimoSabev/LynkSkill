// app/api/applications/me/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic" // Auth requires dynamic rendering

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

        // NOTE: Cleanup of expired applications moved to a separate cron/cleanup endpoint
        // to avoid slow queries on every GET request

        const applications = await prisma.application.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit results for better performance
            select: {
                id: true,
                createdAt: true,
                status: true,
                studentId: true,
                internshipId: true,
                coverLetter: true,
                coverLetterStatus: true,
                coverLetterGeneratedByAI: true,
                coverLetterReviewNote: true,
                coverLetterReviewedAt: true,
                internship: {
                    select: {
                        id: true,
                        title: true,
                        testAssignmentTitle: true,
                        requiresCoverLetter: true,
                        company: {
                            select: {
                                id: true,
                                name: true,
                                logo: true
                            }
                        }
                    }
                }
            }
        })

        // Get assignments separately for better query performance
        const studentAssignments = await prisma.assignment.findMany({
            where: { studentId: student.id },
            select: {
                id: true,
                title: true,
                internshipId: true,
                submissions: { select: { id: true }, take: 1 }
            }
        })

        const formatted = applications.map((app) => {
            const assignmentsForInternship = studentAssignments.filter(
                (a) => a.internshipId === app.internshipId
            )

            const hasUploadedFiles = assignmentsForInternship.some(
                (a) => a.submissions.length > 0
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
                project,
                requiresCoverLetter: Boolean(app.internship.requiresCoverLetter),
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
