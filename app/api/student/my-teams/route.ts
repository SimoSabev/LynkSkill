// app/api/student/my-teams/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/student/my-teams - Get all companies the student has accepted internships with
export async function GET() {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (user.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can access this endpoint" }, { status: 403 })
        }

        // Find all projects for this student (projects are created when student accepts offer)
        const projects = await prisma.project.findMany({
            where: { studentId: user.id },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                    }
                },
                internship: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Group by company to get unique teams
        const teamsMap = new Map<string, {
            companyId: string
            companyName: string
            companyLogo: string | null
            internships: Array<{
                id: string
                title: string
                projectId: string
            }>
        }>()

        for (const project of projects) {
            const existing = teamsMap.get(project.companyId)
            if (existing) {
                existing.internships.push({
                    id: project.internship.id,
                    title: project.internship.title,
                    projectId: project.id
                })
            } else {
                teamsMap.set(project.companyId, {
                    companyId: project.company.id,
                    companyName: project.company.name,
                    companyLogo: project.company.logo,
                    internships: [{
                        id: project.internship.id,
                        title: project.internship.title,
                        projectId: project.id
                    }]
                })
            }
        }

        const teams = Array.from(teamsMap.values())

        return NextResponse.json({ teams })
    } catch (error) {
        console.error("GET /api/student/my-teams error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
