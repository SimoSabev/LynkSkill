import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

export interface AINotification {
    type: string
    priority: "high" | "medium" | "low"
    message: string
    suggestedAction?: string // Tool name Linky should proactively call
    actionArgs?: Record<string, unknown> // Args for the suggested tool
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

    // 3. Unapplied saved internships — suggest Linky applies for them
    const applications = await prisma.application.findMany({
        where: { studentId: userId },
        select: { internshipId: true },
    })
    const appliedIds = new Set(applications.map(a => a.internshipId))
    const unapplied = savedInternships.filter(s => !appliedIds.has(s.internshipId))
    if (unapplied.length > 0) {
        const firstUnapplied = unapplied[0]
        out.push({
            type: "UNUSED_SAVED",
            priority: "medium",
            message: `They saved ${unapplied.length} internship(s) but haven't applied yet. Offer to apply for them: "Want me to apply to '${firstUnapplied.internship.title}' for you? I'll write the cover letter!"`,
            suggestedAction: "apply_to_internship",
            actionArgs: { internshipId: firstUnapplied.internshipId },
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

    // 6. Auto-apply status
    const autoApplyProfile = await prisma.aIProfile.findUnique({
        where: { studentId: userId },
        select: { autoApplyEnabled: true, autoApplyThreshold: true, autoApplyCount: true },
    })
    if (autoApplyProfile) {
        if (autoApplyProfile.autoApplyEnabled && autoApplyProfile.autoApplyCount > 0) {
            out.push({
                type: "AUTO_APPLY_ACTIVE",
                priority: "low",
                message: `Auto-apply is ON (threshold: ${autoApplyProfile.autoApplyThreshold}%). Linky has auto-applied ${autoApplyProfile.autoApplyCount} time(s). Mention this casually.`,
            })
        } else if (!autoApplyProfile.autoApplyEnabled && score >= 60) {
            out.push({
                type: "SUGGEST_AUTO_APPLY",
                priority: "low",
                message: `Their score is ${score}/100 — high enough for auto-apply. Suggest enabling it: "Want me to auto-apply when I find matches above 80%?"`,
                suggestedAction: "toggle_auto_apply",
                actionArgs: { enabled: true, threshold: 80 },
            })
        }
    }

    // 7. Profile visibility stats
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
    // 1. Unreviewed applications — offer to bulk-evaluate
    const pendingApps = await prisma.application.findMany({
        where: { internship: { companyId }, status: "PENDING" },
        include: { internship: { select: { id: true, title: true } } },
        take: 50,
    })
    if (pendingApps.length > 0) {
        // Group by internship for actionable suggestion
        const byInternship = new Map<string, { title: string; count: number }>()
        for (const app of pendingApps) {
            const existing = byInternship.get(app.internshipId)
            if (existing) {
                existing.count++
            } else {
                byInternship.set(app.internshipId, { title: app.internship.title, count: 1 })
            }
        }

        const topInternship = [...byInternship.entries()].sort((a, b) => b[1].count - a[1].count)[0]

        out.push({
            type: "UNREVIEWED_APPLICATIONS",
            priority: "high",
            message: `There are ${pendingApps.length} pending applications. "${topInternship[1].title}" has ${topInternship[1].count}. Offer: "Want me to rank all ${topInternship[1].count} candidates for '${topInternship[1].title}' by fit?"`,
            suggestedAction: "bulk_evaluate_applications",
            actionArgs: { internshipId: topInternship[0] },
        })
    }

    // 2. Positions without applicants — suggest searching for candidates
    const internshipsWithoutApps = await prisma.internship.findMany({
        where: {
            companyId,
            applicationEnd: { gte: new Date() },
            applications: { none: {} },
        },
        select: { id: true, title: true, skills: true },
        take: 3,
    })
    if (internshipsWithoutApps.length > 0) {
        const first = internshipsWithoutApps[0]
        const titles = internshipsWithoutApps.map(i => `"${i.title}"`).join(", ")
        out.push({
            type: "POSITION_WITHOUT_CANDIDATES",
            priority: "medium",
            message: `${titles} have no applicants yet. Offer: "Want me to search for students who match '${first.title}'?"`,
            suggestedAction: "search_candidates",
            actionArgs: { query: (first.skills || []).slice(0, 3).join(" ") || first.title },
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

    // 4. Recently auto-screened strong candidates
    const recentStrongMatches = await prisma.candidateEvaluation.findMany({
        where: {
            companyId,
            matchPercentage: { gte: 80 },
            sessionId: { startsWith: "auto_prescreen_" },
            createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        include: { candidate: { select: { profile: { select: { name: true } }, portfolio: { select: { fullName: true } } } } },
        take: 3,
        orderBy: { matchPercentage: "desc" },
    })
    if (recentStrongMatches.length > 0) {
        const names = recentStrongMatches.map(m => m.candidate.portfolio?.fullName ?? m.candidate.profile?.name ?? "A student").join(", ")
        out.push({
            type: "STRONG_CANDIDATES_DETECTED",
            priority: "high",
            message: `Linky's auto-screener found ${recentStrongMatches.length} strong candidate(s): ${names}. Suggest reviewing and approving.`,
        })
    }
}
