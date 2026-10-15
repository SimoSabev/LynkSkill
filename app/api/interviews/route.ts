import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { scheduleInterview, scheduleInterviewSchema } from "@/lib/services/interviews"

// GET - Fetch interviews for current user
export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: {
                companies: { select: { id: true } }
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const upcoming = searchParams.get("upcoming") === "true"

        let whereClause: Record<string, unknown> = {}

        if (user.role === "STUDENT") {
            // Get interviews for student's applications
            whereClause = {
                application: {
                    studentId: user.id
                }
            }
        } else {
            // Get interviews for company's internships
            const companyIds = user.companies.map(c => c.id)
            whereClause = {
                application: {
                    internship: {
                        companyId: { in: companyIds }
                    }
                }
            }
        }

        if (status) {
            const allowed = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"]
            if (!allowed.includes(status)) {
                return NextResponse.json({ error: "Invalid status filter" }, { status: 400 })
            }
            whereClause.status = status
        }

        if (upcoming) {
            whereClause.scheduledAt = { gte: new Date() }
            whereClause.status = { in: ["SCHEDULED", "CONFIRMED"] }
        }

        const interviews = await prisma.interview.findMany({
            where: whereClause,
            include: {
                application: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                email: true,
                                profile: { select: { name: true } }
                            }
                        },
                        internship: {
                            select: {
                                id: true,
                                title: true,
                                company: {
                                    select: { id: true, name: true, logo: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { scheduledAt: "asc" }
        })

        return NextResponse.json(interviews)
    } catch (error) {
        console.error("Error fetching interviews:", error)
        return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 })
    }
}

// POST - Schedule a new interview
export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const validation = scheduleInterviewSchema.safeParse(await req.json().catch(() => ({})))
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
        }

        const result = await scheduleInterview(user.id, validation.data)
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status })
        }

        return NextResponse.json(result.data, { status: 201 })
    } catch (error) {
        console.error("Error scheduling interview:", error)
        return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 })
    }
}
