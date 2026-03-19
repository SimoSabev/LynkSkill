import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

export interface AINotification {
    type: string
    priority: "high" | "medium" | "low"
    message: string
}

// Compute proactive nudges for the current user
export async function computeNotifications(
    userId: string,
    role: string,
    companyId?: string
): Promise<AINotification[]> {
    const notifications: AINotification[] = []

    if (role === "STUDENT") {
        await computeStudentNotifications(userId, notifications)
    } else if (companyId) {
        await computeCompanyNotifications(companyId, notifications)
    }

    return notifications.slice(0, 5) // Max 5 to keep prompt lean
}

async function computeStudentNotifications(userId: string, out: AINotification[]) {
    // 1. Incomplete profile check
    const [portfolio, aiProfile] = await Promise.all([
        prisma.portfolio.findUnique({ where: { studentId: userId }, select: { fullName: true, headline: true, bio: true, skills: true } }),
        prisma.aIProfile.findUnique({ where: { studentId: userId }, include: { confidenceScore: true } }),
    ])

    const score = aiProfile?.confidenceScore?.overallScore ?? 0
    if (score < 50) {
        out.push({
            type: "INCOMPLETE_PROFILE",
            priority: "high",
            message: `Their confidence score is only ${score}/100. Encourage them to continue profiling to boost it.`,
        })
    }

    if (!portfolio || !portfolio.headline || !portfolio.bio || !portfolio.skills?.length) {
        out.push({
            type: "INCOMPLETE_PORTFOLIO",
            priority: "medium",
            message: "Their portfolio is missing key info (headline, bio, or skills). Nudge them to fill it out.",
        })
    }

    // 2. Upcoming deadlines
    const savedInternships = await prisma.savedInternship.findMany({
        where: { userId },
        include: { internship: { select: { title: true, applicationEnd: true } } },
        take: 10,
    })
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    for (const saved of savedInternships) {
        if (saved.internship.applicationEnd <= threeDaysFromNow && saved.internship.applicationEnd > new Date()) {
            out.push({
                type: "DEADLINE_APPROACHING",
                priority: "high",
                message: `"${saved.internship.title}" closes on ${saved.internship.applicationEnd.toLocaleDateString()}! Remind them.`,
            })
        }
    }

    // 3. Unapplied saved internships
    const applications = await prisma.application.findMany({
        where: { studentId: userId },
        select: { internshipId: true },
    })
    const appliedIds = new Set(applications.map(a => a.internshipId))
    const unapplied = savedInternships.filter(s => !appliedIds.has(s.internshipId))
    if (unapplied.length > 0) {
        out.push({
            type: "UNUSED_SAVED",
            priority: "low",
            message: `They saved ${unapplied.length} internship(s) but haven't applied yet. Suggest applying.`,
        })
    }

    // 4. Stale profiling
    if (aiProfile && !aiProfile.profilingComplete) {
        const lastProfiling = aiProfile.lastProfilingAt
        if (!lastProfiling || (Date.now() - lastProfiling.getTime() > 14 * 24 * 60 * 60 * 1000)) {
            out.push({
                type: "STALE_PROFILING",
                priority: "medium",
                message: "It's been a while since their last profiling session. Suggest continuing to improve their score.",
            })
        }
    }

    // 5. Unread notifications
    const unreadNotifications = await prisma.notification.findMany({ 
        where: { userId, read: false },
        orderBy: { createdAt: "desc" },
        take: 10
    })
    
    if (unreadNotifications.length > 0) {
        // Specifically look for AI_MATCHMAKER notifications
        const matchmakerNotifs = unreadNotifications.filter(n => n.type === NotificationType.AI_MATCHMAKER)
        if (matchmakerNotifs.length > 0) {
            out.push({
                type: "RELEVANT_MATCHES",
                priority: "high",
                message: `They have ${matchmakerNotifs.length} new AI matchmaker notification(s). Encourage them to check out these high-quality opportunities.`,
            })
        } else if (unreadNotifications.length > 3) {
            out.push({
                type: "UNREAD_NOTIFICATIONS",
                priority: "low",
                message: `They have ${unreadNotifications.length} unread notifications. Mention this briefly.`,
            })
        }
    }

    // 6. Profile visibility stats
    const totalShown = await prisma.notification.count({
        where: { userId, type: NotificationType.AI_MATCHMAKER, title: { contains: "Profile Highlighted" } }
    })
    if (totalShown > 0) {
        out.push({
            type: "PROFILE_SHOWN_STATS",
            priority: "medium",
            message: `Their profile has been shown to companies ${totalShown} time(s). Congratulate them and encourage keeping it updated.`,
        })
    }
}

async function computeCompanyNotifications(companyId: string, out: AINotification[]) {
    // 1. Unreviewed applications
    const pendingApps = await prisma.application.count({
        where: { internship: { companyId }, status: "PENDING" },
    })
    if (pendingApps > 0) {
        out.push({
            type: "UNREVIEWED_APPLICATIONS",
            priority: "high",
            message: `There are ${pendingApps} pending application(s) waiting for review. Suggest reviewing them.`,
        })
    }

    // 2. Positions without applicants
    const internshipsWithoutApps = await prisma.internship.findMany({
        where: {
            companyId,
            applicationEnd: { gte: new Date() },
            applications: { none: {} },
        },
        select: { title: true },
        take: 3,
    })
    if (internshipsWithoutApps.length > 0) {
        const titles = internshipsWithoutApps.map(i => `"${i.title}"`).join(", ")
        out.push({
            type: "POSITION_WITHOUT_CANDIDATES",
            priority: "medium",
            message: `${titles} have no applicants yet. Suggest searching for matching candidates.`,
        })
    }

    // 3. Upcoming interviews
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const upcomingInterviews = await prisma.interview.findMany({
        where: {
            application: { internship: { companyId } },
            scheduledAt: { gte: new Date(), lte: tomorrow },
            status: "SCHEDULED",
        },
        include: { application: { select: { student: { select: { email: true } }, internship: { select: { title: true } } } } },
        take: 3,
    })
    for (const interview of upcomingInterviews) {
        out.push({
            type: "INTERVIEW_UPCOMING",
            priority: "high",
            message: `Interview for "${interview.application.internship.title}" is coming up at ${interview.scheduledAt.toLocaleString()}.`,
        })
    }
}
