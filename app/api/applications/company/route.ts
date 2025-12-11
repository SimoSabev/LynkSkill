// app/api/applications/company/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const companyUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        })
        if (!companyUser)
            return NextResponse.json({ error: "Company user not found" }, { status: 404 })

        const company = await prisma.company.findFirst({
            where: { ownerId: companyUser.id },
            select: { id: true },
        })
        if (!company)
            return NextResponse.json({ error: "Company not found" }, { status: 404 })

        const applications = await prisma.application.findMany({
            where: { internship: { companyId: company.id } },
            include: {
                internship: {
                    include: {
                        company: true,
                        assignments: true
                    },
                },
                student: {
                    include: {
                        profile: true,
                        assignments: {
                            include: {
                                submissions: true
                            }
                        }
                    },
                },
            },
            orderBy: { createdAt: "desc" },
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
                        title: assignmentsForInternship[0].title,
                    }
                    : null

            return {
                ...app,
                hasUploadedFiles,
                assignmentRequired,
                project,
            }
        })



        return NextResponse.json(formatted)
    } catch (err) {
        console.error("Error fetching company applications:", err)
        return NextResponse.json(
            { error: "Failed to fetch company applications" },
            { status: 500 }
        )
    }
}
