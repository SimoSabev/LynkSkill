// app/api/cron/expire-internships/route.ts
// 
// This endpoint handles:
// 1. Sending notifications to company members when internships are about to expire
// 2. Deleting internships that have been expired for more than 7 days (grace period)
//
// Should be called periodically via a cron job (e.g., daily at midnight)
// Protected with a CRON_SECRET to prevent unauthorized access

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Permission, MemberStatus } from "@prisma/client"
import {
    notifyInternshipExpiringSoon,
    notifyInternshipExpired,
} from "@/lib/notifications"
import { getMemberPermissions } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Grace period: how many days after expiration before auto-deletion
const GRACE_PERIOD_DAYS = 7

// Warning thresholds (days before applicationEnd)
const WARNING_DAYS = [7, 3, 1]

export async function GET(req: Request) {
    // Verify cron secret (for production security)
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get("secret")

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const results = {
        notified: 0,
        deleted: 0,
        errors: [] as string[],
    }

    try {
        // ==========================================
        // STEP 1: Send expiration warnings
        // ==========================================
        for (const daysAhead of WARNING_DAYS) {
            const targetDate = new Date(now)
            targetDate.setDate(targetDate.getDate() + daysAhead)

            // Find internships whose applicationEnd falls on the target date
            const startOfDay = new Date(targetDate)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(targetDate)
            endOfDay.setHours(23, 59, 59, 999)

            const expiringInternships = await prisma.internship.findMany({
                where: {
                    applicationEnd: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            ownerId: true,
                            members: {
                                where: { status: MemberStatus.ACTIVE },
                                include: {
                                    customRole: {
                                        select: {
                                            id: true,
                                            name: true,
                                            permissions: true,
                                            color: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })

            for (const internship of expiringInternships) {
                try {
                    // Check if we already sent a notification for this internship + days combination
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            type: "INTERNSHIP_EXPIRING_SOON",
                            metadata: {
                                path: ["internshipId"],
                                equals: internship.id,
                            },
                            createdAt: {
                                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
                            },
                        },
                    })

                    if (existingNotification) continue // Already notified today

                    // Notify company members who have EDIT_INTERNSHIPS or DELETE_INTERNSHIPS permission
                    const membersToNotify = internship.company.members.filter((member) => {
                        const permissions = getMemberPermissions(member)
                        return (
                            permissions.includes(Permission.EDIT_INTERNSHIPS) ||
                            permissions.includes(Permission.DELETE_INTERNSHIPS) ||
                            permissions.includes(Permission.CREATE_INTERNSHIPS)
                        )
                    })

                    for (const member of membersToNotify) {
                        await notifyInternshipExpiringSoon(
                            member.userId,
                            internship.title,
                            internship.company.name,
                            daysAhead,
                            internship.id
                        )
                        results.notified++
                    }
                } catch (err) {
                    const errorMsg = `Failed to notify for internship ${internship.id}: ${err}`
                    console.error(errorMsg)
                    results.errors.push(errorMsg)
                }
            }
        }

        // ==========================================
        // STEP 2: Delete expired internships (past grace period)
        // ==========================================
        const graceCutoff = new Date(now)
        graceCutoff.setDate(graceCutoff.getDate() - GRACE_PERIOD_DAYS)
        // Set to end of that day
        graceCutoff.setHours(23, 59, 59, 999)

        const expiredInternships = await prisma.internship.findMany({
            where: {
                applicationEnd: {
                    lt: graceCutoff,
                },
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                        members: {
                            where: { status: MemberStatus.ACTIVE },
                            include: {
                                customRole: {
                                    select: {
                                        id: true,
                                        name: true,
                                        permissions: true,
                                        color: true,
                                    },
                                },
                            },
                        },
                    },
                },
                applications: {
                    select: { id: true },
                },
            },
        })

        for (const internship of expiredInternships) {
            try {
                // Delete related data in correct order to respect FK constraints
                // 1. Delete saved internships
                await prisma.savedInternship.deleteMany({
                    where: { internshipId: internship.id },
                })

                // 2. Delete test submissions
                await prisma.testSubmission.deleteMany({
                    where: { internshipId: internship.id },
                })

                // 3. Delete assignment files, then assignments
                await prisma.assignmentFile.deleteMany({
                    where: { assignment: { internshipId: internship.id } },
                })
                await prisma.assignment.deleteMany({
                    where: { internshipId: internship.id },
                })

                // 4. Delete experience files related to projects of this internship
                const projects = await prisma.project.findMany({
                    where: { internshipId: internship.id },
                    select: { id: true },
                })
                if (projects.length > 0) {
                    await prisma.experience.deleteMany({
                        where: { projectId: { in: projects.map((p) => p.id) } },
                    })
                }

                // 5. Delete projects
                await prisma.project.deleteMany({
                    where: { internshipId: internship.id },
                })

                // 6. Delete applications
                await prisma.application.deleteMany({
                    where: { internshipId: internship.id },
                })

                // 7. Finally delete the internship
                await prisma.internship.delete({
                    where: { id: internship.id },
                })

                // Notify company members about deletion
                const membersToNotify = internship.company.members.filter((member) => {
                    const permissions = getMemberPermissions(member)
                    return (
                        permissions.includes(Permission.EDIT_INTERNSHIPS) ||
                        permissions.includes(Permission.DELETE_INTERNSHIPS) ||
                        permissions.includes(Permission.CREATE_INTERNSHIPS)
                    )
                })

                for (const member of membersToNotify) {
                    await notifyInternshipExpired(
                        member.userId,
                        internship.title,
                        internship.company.name,
                        internship.id
                    )
                }

                results.deleted++
            } catch (err) {
                const errorMsg = `Failed to delete expired internship ${internship.id}: ${err}`
                console.error(errorMsg)
                results.errors.push(errorMsg)
            }
        }

        console.log(
            `[Cron] Expire internships: ${results.notified} notifications sent, ${results.deleted} deleted, ${results.errors.length} errors`
        )

        return NextResponse.json({
            success: true,
            ...results,
        })
    } catch (error) {
        console.error("[Cron] Expire internships error:", error)
        return NextResponse.json(
            { error: "Cron job failed", details: String(error) },
            { status: 500 }
        )
    }
}
