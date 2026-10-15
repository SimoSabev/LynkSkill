// app/api/projects/route.ts
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

// 🔥 Принуждаваме Node runtime (Prisma не работи на Edge)
export const runtime = "nodejs"
// Auth routes require dynamic rendering
export const dynamic = "force-dynamic"

// 🔥 Супер важно за Supabase pgBouncer – забранява prepared statements
process.env.PGSSLMODE = "require"
process.env.PGTZ = "UTC"
process.env.NEXT_PRISMA_DISABLE_WARNINGS = "true"

type SelectedProject = Prisma.ProjectGetPayload<{
    select: {
        id: true
        title: true
        createdAt: true
        internshipId: true
        studentId: true
        application: { select: { status: true } }
        internship: {
            select: {
                id: true
                title: true
                applicationStart: true
                applicationEnd: true
                startDate: true
                endDate: true
                company: { select: { name: true } }
                assignments: {
                    select: {
                        id: true
                        studentId: true
                        title: true
                        description: true
                        dueDate: true
                    }
                }
            }
        }
        student: {
            select: {
                email: true
                profile: { select: { name: true } }
            }
        }
    }
}>

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // 🔥 Взимаме user-а с минимални полета (по-бързо)
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true }
        })

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        // 🔥 MAIN QUERY — минимално необходимо, без излишни колони
        const projects = await prisma.project.findMany({
            where:
                user.role === "STUDENT"
                    ? { studentId: user.id }
                    : user.role === "COMPANY"
                        ? { company: { ownerId: user.id } }
                        : undefined,

            orderBy: { createdAt: "desc" },

            select: {
                id: true,
                title: true,
                createdAt: true,
                internshipId: true,
                studentId: true,
                application: { select: { status: true } },
                internship: {
                    select: {
                        id: true,
                        title: true,
                        applicationStart: true,
                        applicationEnd: true,
                        startDate: true,
                        endDate: true,
                        company: { select: { name: true } },
                        assignments: {
                            select: {
                                id: true,
                                studentId: true,
                                title: true,
                                description: true,
                                dueDate: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        email: true,
                        profile: { select: { name: true } }
                    }
                }
            }
        }) as SelectedProject[]

        if (projects.length === 0) return NextResponse.json([])

        // 🔥 Форматираме ultra-light обект за frontend
        const formatted = projects.map((p) => {
            const related = p.internship?.assignments?.find(a => a.studentId === p.studentId)

            return {
                id: p.id,
                title: p.title,
                createdAt: p.createdAt.toISOString(),
                status:
                    p.application?.status === "APPROVED"
                        ? "ONGOING"
                        : p.application?.status === "REJECTED"
                            ? "COMPLETED"
                            : "PENDING",

                internship: {
                    id: p.internship?.id ?? "",
                    title: p.internship?.title ?? "",
                    company: { name: p.internship?.company?.name ?? "" },
                    // Real internship period (not the application window)
                    startDate: p.internship?.startDate?.toISOString() ?? null,
                    endDate: p.internship?.endDate?.toISOString() ?? null,
                    applicationStart: p.internship?.applicationStart?.toISOString() ?? null,
                    applicationEnd: p.internship?.applicationEnd?.toISOString() ?? null
                },

                student: {
                    name: p.student?.profile?.name ?? p.student?.email ?? "",
                    email: p.student?.email ?? ""
                },

                assignment: related
                    ? {
                        id: related.id,
                        title: related.title,
                        description: related.description,
                        dueDate: related.dueDate.toISOString()
                    }
                    : null
            }
        })

        return NextResponse.json(formatted)
    } catch (err) {
        console.error("GET /api/projects error:", err)
        return NextResponse.json(
            { error: "Failed to fetch projects", details: `${err}` },
            { status: 500 }
        )
    }
}
