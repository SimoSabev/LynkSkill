import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, role: true, companies: { select: { id: true }, take: 1 }, companyMembership: { select: { companyId: true } } },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    if (user.role === "STUDENT") {
        return NextResponse.json(await buildStudentDigest(user.id, oneWeekAgo))
    }

    const companyId = user.companies[0]?.id ?? user.companyMembership?.companyId
    if (companyId) {
        return NextResponse.json(await buildCompanyDigest(companyId, oneWeekAgo))
    }

    return NextResponse.json({ digest: [], summary: "No activity this week." })
}

async function buildStudentDigest(userId: string, since: Date) {
    const [
        applicationsThisWeek,
        statusChanges,
        newMatches,
        scoreHistory,
        autoApplied,
    ] = await Promise.all([
        prisma.application.count({
            where: { studentId: userId, createdAt: { gte: since } },
        }),
        prisma.application.findMany({
            where: { studentId: userId, updatedAt: { gte: since }, status: { not: "PENDING" } },
            include: { internship: { select: { title: true, company: { select: { name: true } } } } },
            take: 10,
        }),
        prisma.notification.findMany({
            where: { userId, createdAt: { gte: since }, title: { contains: "Match" } },
            select: { title: true, message: true, createdAt: true },
            take: 10,
            orderBy: { createdAt: "desc" },
        }),
        prisma.aIProfile.findUnique({
            where: { studentId: userId },
            select: { confidenceScore: { select: { overallScore: true, scoreHistory: true } } },
        }),
        prisma.aIProfile.findUnique({
            where: { studentId: userId },
            select: { autoApplyCount: true, autoApplyEnabled: true },
        }),
    ])

    const currentScore = scoreHistory?.confidenceScore?.overallScore ?? 0

    const digest = []

    if (applicationsThisWeek > 0) {
        digest.push({
            icon: "📨",
            category: "Applications",
            text: `You applied to ${applicationsThisWeek} internship${applicationsThisWeek > 1 ? "s" : ""} this week`,
        })
    }

    for (const sc of statusChanges) {
        const emoji = sc.status === "ACCEPTED" ? "🎉" : sc.status === "REJECTED" ? "😔" : "📋"
        digest.push({
            icon: emoji,
            category: "Status Update",
            text: `${sc.internship.title} at ${sc.internship.company.name}: ${sc.status.toLowerCase()}`,
        })
    }

    if (newMatches.length > 0) {
        digest.push({
            icon: "🎯",
            category: "AI Matches",
            text: `Linky found ${newMatches.length} new match${newMatches.length > 1 ? "es" : ""} for you`,
        })
    }

    if (autoApplied?.autoApplyEnabled && (autoApplied.autoApplyCount ?? 0) > 0) {
        digest.push({
            icon: "🤖",
            category: "Auto-Apply",
            text: `Linky auto-applied to ${autoApplied.autoApplyCount} internship${(autoApplied.autoApplyCount ?? 0) > 1 ? "s" : ""} total`,
        })
    }

    digest.push({
        icon: "📊",
        category: "Confidence Score",
        text: `Current score: ${currentScore}/100`,
    })

    return {
        digest,
        summary: digest.length > 1
            ? `This week: ${applicationsThisWeek} applications, ${statusChanges.length} updates, ${newMatches.length} new matches`
            : "Quiet week — let Linky find some opportunities for you!",
        score: currentScore,
    }
}

async function buildCompanyDigest(companyId: string, since: Date) {
    const [
        newApplications,
        approvedThisWeek,
        rejectedThisWeek,
        interviewsScheduled,
        strongCandidates,
    ] = await Promise.all([
        prisma.application.count({
            where: { internship: { companyId }, createdAt: { gte: since } },
        }),
        prisma.application.count({
            where: { internship: { companyId }, status: "ACCEPTED", updatedAt: { gte: since } },
        }),
        prisma.application.count({
            where: { internship: { companyId }, status: "REJECTED", updatedAt: { gte: since } },
        }),
        prisma.interview.count({
            where: { application: { internship: { companyId } }, createdAt: { gte: since } },
        }),
        prisma.candidateEvaluation.count({
            where: { companyId, matchPercentage: { gte: 80 }, createdAt: { gte: since } },
        }),
    ])

    const digest = []

    if (newApplications > 0) {
        digest.push({ icon: "📋", category: "Applications", text: `${newApplications} new application${newApplications > 1 ? "s" : ""} received` })
    }
    if (approvedThisWeek > 0) {
        digest.push({ icon: "✅", category: "Approved", text: `${approvedThisWeek} candidate${approvedThisWeek > 1 ? "s" : ""} approved` })
    }
    if (rejectedThisWeek > 0) {
        digest.push({ icon: "❌", category: "Rejected", text: `${rejectedThisWeek} candidate${rejectedThisWeek > 1 ? "s" : ""} rejected` })
    }
    if (interviewsScheduled > 0) {
        digest.push({ icon: "📅", category: "Interviews", text: `${interviewsScheduled} interview${interviewsScheduled > 1 ? "s" : ""} scheduled` })
    }
    if (strongCandidates > 0) {
        digest.push({ icon: "⭐", category: "AI Screening", text: `${strongCandidates} strong candidate${strongCandidates > 1 ? "s" : ""} detected by Linky` })
    }

    return {
        digest,
        summary: `This week: ${newApplications} applications, ${approvedThisWeek} approved, ${interviewsScheduled} interviews`,
    }
}
