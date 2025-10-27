import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { Project, Internship, Company, Application, User, Profile } from "@prisma/client"

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch user (Student or Company owner)
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 🧹 AUTO-CLEANUP: Delete projects if test assignment deadline passed and no submission
        try {
            const now = new Date()

            const expiredProjects = await prisma.project.findMany({
                where: {
                    internship: {
                        testAssignmentDueDate: { lt: now }, // deadline passed
                    },
                },
                include: {
                    internship: true,
                    student: true,
                },
            })

            let deletedCount = 0

            for (const project of expiredProjects) {
                const submissionExists = await prisma.testSubmission.findFirst({
                    where: {
                        internshipId: project.internshipId,
                        studentId: project.studentId,
                    },
                })

                if (!submissionExists) {
                    await prisma.project.delete({
                        where: { id: project.id },
                    })
                    deletedCount++
                }
            }

            if (deletedCount > 0) {
                console.log(`🧹 Auto-deleted ${deletedCount} expired projects with no submissions.`)
            }
        } catch (cleanupErr) {
            console.warn("⚠️ Cleanup skipped:", cleanupErr)
        }

        // ✅ Define type for projects with relations
        type ProjectWithRelations = Project & {
            internship: (Internship & { company: Company | null }) | null
            student: (User & { profile: Profile | null }) | null
            application: Application | null
        }

        let projects: ProjectWithRelations[] = []

        // Fetch projects differently depending on role
        if (user.role === "STUDENT") {
            projects = await prisma.project.findMany({
                where: { studentId: user.id },
                include: {
                    internship: { include: { company: true } },
                    student: { include: { profile: true } },
                    application: true,
                },
                orderBy: { createdAt: "desc" },
            })
        } else if (user.role === "COMPANY") {
            projects = await prisma.project.findMany({
                where: {
                    company: { ownerId: user.id },
                },
                include: {
                    internship: { include: { company: true } },
                    student: { include: { profile: true } },
                    application: true,
                },
                orderBy: { createdAt: "desc" },
            })
        }

        // ✅ Format response
        const formatted = projects.map((p) => ({
            id: p.id,
            title: p.title,
            internship: {
                id: p.internship?.id ?? "",
                title: p.internship?.title ?? "(no title)",
                company: {
                    name: p.internship?.company?.name ?? "(no company)",
                },
                startDate: p.internship?.applicationStart
                    ? new Date(p.internship.applicationStart).toISOString()
                    : null,
                endDate: p.internship?.applicationEnd
                    ? new Date(p.internship.applicationEnd).toISOString()
                    : null,
            },
            student: {
                name: p.student?.profile?.name ?? p.student?.email ?? "Unknown",
                email: p.student?.email ?? "",
            },
            status: p.application?.status ?? "PENDING",
            createdAt: p.createdAt.toISOString(),
        }))

        return NextResponse.json(formatted)
    } catch (err) {
        console.error("GET /api/projects error:", err)
        return NextResponse.json(
            { error: "Failed to fetch projects", details: String(err) },
            { status: 500 },
        )
    }
}
