import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { addMonths } from "date-fns"
import { Permission } from "@prisma/client"
import { checkPermission, getUserCompanyByClerkId } from "@/lib/permissions"

// Zod schema for updating interview
const updateInterviewSchema = z.object({
    status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional(),
    scheduledAt: z.string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .refine((val) => {
            const date = new Date(val)
            return date > new Date()
        }, "Date must be in the future")
        .refine((val) => {
            const date = new Date(val)
            const maxDate = addMonths(new Date(), 3)
            return date <= maxDate
        }, "Date must be within 3 months")
        .optional(),
    location: z.string().max(500, "Location too long").optional(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    notes: z.string().max(1000, "Notes too long").optional()
})

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Get a specific interview
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        const interview = await prisma.interview.findUnique({
            where: { id },
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
                                    select: { id: true, name: true, logo: true, location: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 })
        }

        return NextResponse.json(interview)
    } catch (error) {
        console.error("Error fetching interview:", error)
        return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 })
    }
}

// PATCH - Update interview (reschedule, confirm, cancel, complete)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        
        // First get the user to determine if they're a student
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        student: { select: { id: true } },
                        internship: {
                            select: {
                                companyId: true,
                                title: true,
                                company: { select: { name: true, ownerId: true } }
                            }
                        }
                    }
                }
            }
        })

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 })
        }

        // Check authorization - student or company member with permission
        const isStudent = interview.application.student.id === user.id
        let isCompanyMember = false
        let hasInterviewPermission = false

        if (!isStudent) {
            const membership = await getUserCompanyByClerkId(clerkId)
            if (membership && membership.companyId === interview.application.internship.companyId) {
                isCompanyMember = true
                hasInterviewPermission = await checkPermission(
                    membership.userId,
                    membership.companyId,
                    Permission.SCHEDULE_INTERVIEWS
                )
            }
        }

        if (!isStudent && !isCompanyMember) {
            return NextResponse.json({ error: "Not authorized to modify this interview" }, { status: 403 })
        }

        const body = await req.json()
        
        // Validate with Zod
        const validation = updateInterviewSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ 
                error: validation.error.issues[0].message 
            }, { status: 400 })
        }

        const { status, scheduledAt, location, latitude, longitude, notes } = validation.data

        // Students can only confirm or request reschedule
        if (isStudent && status && !["CONFIRMED", "RESCHEDULED"].includes(status)) {
            return NextResponse.json({ error: "Students can only confirm or request reschedule" }, { status: 403 })
        }

        // Company members need permission to modify interviews
        if (isCompanyMember && !hasInterviewPermission) {
            return NextResponse.json({ error: "You don't have permission to modify interviews" }, { status: 403 })
        }

        const updateData: Record<string, unknown> = {}

        if (status) updateData.status = status
        if (scheduledAt && isCompanyMember) updateData.scheduledAt = new Date(scheduledAt)
        if (location !== undefined && isCompanyMember) updateData.location = location
        if (latitude !== undefined && isCompanyMember) updateData.latitude = latitude
        if (longitude !== undefined && isCompanyMember) updateData.longitude = longitude
        if (notes !== undefined) updateData.notes = notes

        const updatedInterview = await prisma.interview.update({
            where: { id },
            data: updateData,
            include: {
                application: {
                    include: {
                        student: {
                            select: { id: true, profile: { select: { name: true } } }
                        },
                        internship: {
                            select: { title: true, company: { select: { name: true, ownerId: true } } }
                        }
                    }
                }
            }
        })

        // Send notifications based on status change
        if (status) {
            const studentId = interview.application.student.id
            const companyOwnerId = interview.application.internship.company.ownerId

            if (status === "CONFIRMED" && isStudent) {
                // Notify company that student confirmed
                await prisma.notification.create({
                    data: {
                        userId: companyOwnerId,
                        type: "INTERVIEW_SCHEDULED",
                        title: "Interview Confirmed",
                        message: `Interview has been confirmed by the student`,
                        link: `/dashboard/company/interviews`
                    }
                })
            } else if (status === "CANCELLED") {
                // Notify the other party
                const notifyUserId = isStudent ? companyOwnerId : studentId
                await prisma.notification.create({
                    data: {
                        userId: notifyUserId,
                        type: "INTERVIEW_SCHEDULED",
                        title: "Interview Cancelled",
                        message: `Interview has been cancelled`,
                        link: isStudent ? `/dashboard/company/interviews` : `/dashboard/student/interviews`
                    }
                })
            } else if (status === "RESCHEDULED") {
                const notifyUserId = isStudent ? companyOwnerId : studentId
                await prisma.notification.create({
                    data: {
                        userId: notifyUserId,
                        type: "INTERVIEW_SCHEDULED",
                        title: "Interview Reschedule Requested",
                        message: `A reschedule has been requested for the interview`,
                        link: isStudent ? `/dashboard/company/interviews` : `/dashboard/student/interviews`
                    }
                })
            }
        }

        return NextResponse.json(updatedInterview)
    } catch (error) {
        console.error("Error updating interview:", error)
        return NextResponse.json({ error: "Failed to update interview" }, { status: 500 })
    }
}

// DELETE - Delete an interview
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Get membership and check permissions
        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership) {
            return NextResponse.json({ error: "Only company members can delete interviews" }, { status: 403 })
        }

        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.SCHEDULE_INTERVIEWS
        )
        if (!hasPermission) {
            return NextResponse.json({ error: "You don't have permission to delete interviews" }, { status: 403 })
        }

        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                application: {
                    include: {
                        student: { select: { id: true } },
                        internship: { select: { companyId: true, title: true } }
                    }
                }
            }
        })

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 })
        }

        if (interview.application.internship.companyId !== membership.companyId) {
            return NextResponse.json({ error: "Not authorized to delete this interview" }, { status: 403 })
        }

        // Notify student about cancellation
        await prisma.notification.create({
            data: {
                userId: interview.application.student.id,
                type: "INTERVIEW_SCHEDULED",
                title: "Interview Cancelled",
                message: `The interview for "${interview.application.internship.title}" has been cancelled`,
                link: `/dashboard/student/interviews`
            }
        })

        await prisma.interview.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting interview:", error)
        return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 })
    }
}
