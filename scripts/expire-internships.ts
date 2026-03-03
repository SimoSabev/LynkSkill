/**
 * Script to check and handle expired internships
 * 
 * What it does:
 * 1. Sends notifications to company members when internships are expiring in 7, 3, or 1 days
 * 2. Deletes internships that have been expired for more than 7 days (grace period)
 * 3. Notifies company members about auto-deleted internships
 * 
 * Run manually:   npx tsx scripts/expire-internships.ts
 * Run via cron:    Add to your scheduler (e.g., daily at midnight)
 * Run via API:     GET /api/cron/expire-internships?secret=YOUR_CRON_SECRET
 * 
 * Environment variables:
 * - DATABASE_URL: Required, Prisma database connection
 * - CRON_SECRET: Optional, for securing the API endpoint
 */

import { prisma } from "../lib/prisma"
import { MemberStatus, Permission } from "@prisma/client"
import { DEFAULT_ROLE_PERMISSIONS } from "../lib/role-permissions"

// Grace period: how many days after expiration before auto-deletion
const GRACE_PERIOD_DAYS = 7

// Warning thresholds (days before applicationEnd)
const WARNING_DAYS = [7, 3, 1]

function getMemberPermissionsLocal(member: {
    defaultRole: string | null
    customRole: { permissions: Permission[] } | null
    extraPermissions: Permission[]
}): Permission[] {
    const permissions = new Set<Permission>()

    if (member.defaultRole && member.defaultRole in DEFAULT_ROLE_PERMISSIONS) {
        for (const perm of DEFAULT_ROLE_PERMISSIONS[member.defaultRole as keyof typeof DEFAULT_ROLE_PERMISSIONS]) {
            permissions.add(perm)
        }
    }

    if (member.customRole) {
        for (const perm of member.customRole.permissions) {
            permissions.add(perm)
        }
    }

    for (const perm of member.extraPermissions) {
        permissions.add(perm)
    }

    return Array.from(permissions)
}

async function main() {
    console.log("🔄 Starting internship expiration check...")
    console.log(`   Grace period: ${GRACE_PERIOD_DAYS} days`)
    console.log(`   Warning days: ${WARNING_DAYS.join(", ")}`)
    console.log("")

    const now = new Date()
    let notified = 0
    let deleted = 0
    let errors = 0

    // ==========================================
    // STEP 1: Send expiration warnings
    // ==========================================
    console.log("📢 Checking for expiring internships...")

    for (const daysAhead of WARNING_DAYS) {
        const targetDate = new Date(now)
        targetDate.setDate(targetDate.getDate() + daysAhead)

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

        if (expiringInternships.length > 0) {
            console.log(`   Found ${expiringInternships.length} internship(s) expiring in ${daysAhead} day(s)`)
        }

        for (const internship of expiringInternships) {
            try {
                // Check for duplicate notifications in last 24h
                const existingNotification = await prisma.notification.findFirst({
                    where: {
                        type: "INTERNSHIP_EXPIRING_SOON",
                        metadata: {
                            path: ["internshipId"],
                            equals: internship.id,
                        },
                        createdAt: {
                            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                        },
                    },
                })

                if (existingNotification) {
                    console.log(`   ⏭️  Already notified about "${internship.title}" today`)
                    continue
                }

                const membersToNotify = internship.company.members.filter((member) => {
                    const permissions = getMemberPermissionsLocal(member)
                    return (
                        permissions.includes(Permission.EDIT_INTERNSHIPS) ||
                        permissions.includes(Permission.DELETE_INTERNSHIPS) ||
                        permissions.includes(Permission.CREATE_INTERNSHIPS)
                    )
                })

                for (const member of membersToNotify) {
                    await prisma.notification.create({
                        data: {
                            userId: member.userId,
                            type: "INTERNSHIP_EXPIRING_SOON",
                            title: "Internship Expiring Soon ⚠️",
                            message: `Your internship "${internship.title}" at ${internship.company.name} will expire in ${daysAhead} day${daysAhead > 1 ? "s" : ""}. Renew it to keep it active.`,
                            link: "/dashboard/company/internships",
                            metadata: {
                                internshipId: internship.id,
                                internshipTitle: internship.title,
                                companyName: internship.company.name,
                                daysRemaining: daysAhead,
                            },
                        },
                    })
                    notified++
                }

                console.log(`   ✅ Notified ${membersToNotify.length} member(s) about "${internship.title}" (${daysAhead}d left)`)
            } catch (err) {
                console.error(`   ❌ Failed to notify about "${internship.title}":`, err)
                errors++
            }
        }
    }

    // ==========================================
    // STEP 2: Delete expired internships (past grace period)
    // ==========================================
    console.log("")
    console.log("🗑️  Checking for expired internships past grace period...")

    const graceCutoff = new Date(now)
    graceCutoff.setDate(graceCutoff.getDate() - GRACE_PERIOD_DAYS)
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
            applications: { select: { id: true } },
        },
    })

    if (expiredInternships.length === 0) {
        console.log("   No expired internships to delete")
    } else {
        console.log(`   Found ${expiredInternships.length} expired internship(s) to delete`)
    }

    for (const internship of expiredInternships) {
        try {
            console.log(`   Deleting "${internship.title}" (expired ${internship.applicationEnd.toISOString()})...`)

            // Delete related data in correct order
            await prisma.savedInternship.deleteMany({ where: { internshipId: internship.id } })
            await prisma.testSubmission.deleteMany({ where: { internshipId: internship.id } })
            await prisma.assignmentFile.deleteMany({ where: { assignment: { internshipId: internship.id } } })
            await prisma.assignment.deleteMany({ where: { internshipId: internship.id } })

            const projects = await prisma.project.findMany({
                where: { internshipId: internship.id },
                select: { id: true },
            })
            if (projects.length > 0) {
                await prisma.experience.deleteMany({
                    where: { projectId: { in: projects.map((p) => p.id) } },
                })
            }
            await prisma.project.deleteMany({ where: { internshipId: internship.id } })
            await prisma.application.deleteMany({ where: { internshipId: internship.id } })
            await prisma.internship.delete({ where: { id: internship.id } })

            // Notify company members
            const membersToNotify = internship.company.members.filter((member) => {
                const permissions = getMemberPermissionsLocal(member)
                return (
                    permissions.includes(Permission.EDIT_INTERNSHIPS) ||
                    permissions.includes(Permission.DELETE_INTERNSHIPS) ||
                    permissions.includes(Permission.CREATE_INTERNSHIPS)
                )
            })

            for (const member of membersToNotify) {
                await prisma.notification.create({
                    data: {
                        userId: member.userId,
                        type: "INTERNSHIP_EXPIRED",
                        title: "Internship Expired & Removed",
                        message: `Your internship "${internship.title}" at ${internship.company.name} has expired and been automatically removed.`,
                        link: "/dashboard/company/internships",
                        metadata: {
                            internshipId: internship.id,
                            internshipTitle: internship.title,
                            companyName: internship.company.name,
                        },
                    },
                })
            }

            console.log(`   ✅ Deleted "${internship.title}" + notified ${membersToNotify.length} member(s)`)
            deleted++
        } catch (err) {
            console.error(`   ❌ Failed to delete "${internship.title}":`, err)
            errors++
        }
    }

    // ==========================================
    // Summary
    // ==========================================
    console.log("")
    console.log("📊 Summary:")
    console.log(`   Notifications sent: ${notified}`)
    console.log(`   Internships deleted: ${deleted}`)
    console.log(`   Errors: ${errors}`)
    console.log("")

    await prisma.$disconnect()
    process.exit(errors > 0 ? 1 : 0)
}

main().catch((err) => {
    console.error("Fatal error:", err)
    process.exit(1)
})
