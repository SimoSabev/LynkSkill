import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { addMonths, addDays, startOfDay } from "date-fns"

// Zod schema for interview scheduling with practical date validation
const scheduleInterviewSchema = z.object({
    applicationId: z.string().min(1, "Application ID is required"),
    scheduledAt: z.string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .refine((val) => {
            const date = new Date(val)
            const now = new Date()
            return date > now
        }, "Interview cannot be scheduled in the past")
        .refine((val) => {
            const date = new Date(val)
            const maxDate = addMonths(new Date(), 3) // Max 3 months in the future
            return date <= maxDate
        }, "Interview must be scheduled within the next 3 months")
        .refine((val) => {
            const date = new Date(val)
            const minDate = addDays(startOfDay(new Date()), 1) // At least tomorrow
            return date >= minDate || date.toDateString() === new Date().toDateString()
        }, "Please schedule at least for today"),
    location: z.string().max(500, "Location too long").optional(),
    notes: z.string().max(1000, "Notes too long").optional()
})

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

        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: {
                companies: { select: { id: true } }
            }
        })

        if (!user || user.role !== "COMPANY") {
            return NextResponse.json({ error: "Only companies can schedule interviews" }, { status: 403 })
        }

        const body = await req.json()
        
        // Validate with Zod
        const validation = scheduleInterviewSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ 
                error: validation.error.issues[0].message 
            }, { status: 400 })
        }

        const { applicationId, scheduledAt, location, notes } = validation.data

        // Verify the application belongs to one of the user's companies
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: {
                    select: { companyId: true }
                },
                student: {
                    select: { id: true }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        const companyIds = user.companies.map(c => c.id)
        if (!companyIds.includes(application.internship.companyId)) {
            return NextResponse.json({ error: "You can only schedule interviews for your own company's applications" }, { status: 403 })
        }

        // Check if there's already an active interview for this application
        const existingInterview = await prisma.interview.findFirst({
            where: {
                applicationId,
                status: { in: ["SCHEDULED", "CONFIRMED"] }
            }
        })

        if (existingInterview) {
            return NextResponse.json({ error: "An interview is already scheduled for this application" }, { status: 400 })
        }

        const interview = await prisma.interview.create({
            data: {
                applicationId,
                scheduledAt: new Date(scheduledAt),
                location,
                notes
            },
            include: {
                application: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                profile: { select: { name: true } }
                            }
                        },
                        internship: {
                            select: {
                                title: true,
                                company: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        })

        // Create notification for student
        await prisma.notification.create({
            data: {
                userId: application.student.id,
                type: "INTERVIEW_SCHEDULED",
                title: "Interview Scheduled",
                message: `An interview has been scheduled for your application`,
                link: `/dashboard/student?tab=interviews`
            }
        })

        return NextResponse.json(interview, { status: 201 })
    } catch (error) {
        console.error("Error scheduling interview:", error)
        return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 })
    }
}
