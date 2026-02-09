// app/api/applications/company/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Permission } from "@prisma/client"
import { getUserCompanyByClerkId, checkPermission } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic" // Auth requires dynamic rendering

export async function GET() {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Get user's company membership
        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership)
            return NextResponse.json({ error: "Company not found" }, { status: 404 })

        // Check VIEW_APPLICATIONS permission
        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.VIEW_APPLICATIONS
        )
        if (!hasPermission)
            return NextResponse.json({ error: "You don't have permission to view applications" }, { status: 403 })

        const applications = await prisma.application.findMany({
            where: { internship: { companyId: membership.companyId } },
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
                requiresCoverLetter: Boolean(app.internship.requiresCoverLetter),
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
