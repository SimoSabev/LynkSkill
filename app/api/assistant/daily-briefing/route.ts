import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { determinePersonalityState } from "@/lib/ai/linky-personality"
import type { PersonalityState } from "@/lib/ai/linky-personality"

export async function POST(req: Request) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userType } = await req.json()

    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, role: true, profile: { select: { name: true } }, companies: { select: { id: true }, take: 1 }, companyMembership: { select: { companyId: true } } },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const firstName = user.profile?.name?.split(" ")[0] ?? "there"
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

    if (userType === "student" || user.role === "STUDENT") {
        return NextResponse.json(await buildStudentBriefing(user.id, firstName, timeGreeting))
    }

    const companyId = user.companies[0]?.id ?? user.companyMembership?.companyId
    if (companyId) {
        return NextResponse.json(await buildCompanyBriefing(companyId, firstName, timeGreeting))
    }

    return NextResponse.json({
        greeting: `${timeGreeting}, ${firstName}! I'm Linky, your AI assistant. How can I help?`,
        highlights: [],
        suggestedPrompt: "Tell me what you can do",
    })
}

async function buildStudentBriefing(userId: string, firstName: string, timeGreeting: string) {
    const [
        pendingApps,
        unreadNotifs,
        savedCount,
        upcomingInterview,
        aiProfile,
        recentRejections,
        recentApprovals,
        personality,
    ] = await Promise.all([
        prisma.application.count({ where: { studentId: userId, status: "PENDING" } }),
        prisma.notification.count({ where: { userId, read: false } }),
        prisma.savedInternship.count({ where: { userId } }),
        prisma.interview.findFirst({
            where: { application: { studentId: userId }, scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
            include: { application: { select: { internship: { select: { title: true } } } } },
            orderBy: { scheduledAt: "asc" },
        }),
        prisma.aIProfile.findUnique({ where: { studentId: userId }, include: { confidenceScore: true } }),
        prisma.application.count({
            where: { studentId: userId, status: "REJECTED", updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        prisma.application.count({
            where: { studentId: userId, status: "APPROVED", updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        determinePersonalityState(userId).catch(() => null),
    ])

    const score = aiProfile?.confidenceScore?.overallScore ?? 0
    const state: PersonalityState = personality?.state ?? "ENCOURAGING"
    const highlights: { icon: string; text: string; action?: string }[] = []

    // Adaptive greeting based on personality state
    const greeting = buildAdaptiveGreeting(state, firstName, timeGreeting, {
        score, recentApprovals, recentRejections, pendingApps, upcomingInterview,
    })

    // Priority order changes based on emotional state
    if (state === "CELEBRATING" && recentApprovals > 0) {
        highlights.push({
            icon: "🎉",
            text: `You got approved for ${recentApprovals} role${recentApprovals > 1 ? "s" : ""}! Let's prep for what's next.`,
            action: "Help me prepare for my upcoming role",
        })
    }

    if (upcomingInterview) {
        const dateStr = upcomingInterview.scheduledAt.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })
        highlights.push({
            icon: "📅",
            text: `Interview for "${upcomingInterview.application.internship.title}" on ${dateStr}`,
            action: `Help me prepare for my interview for ${upcomingInterview.application.internship.title}`,
        })
    }

    if (state === "EMPATHETIC" && recentRejections > 0) {
        highlights.push({
            icon: "💪",
            text: `${recentRejections} application${recentRejections > 1 ? "s" : ""} didn't work out — but I found new opportunities that fit you better.`,
            action: "Show me new matches that fit my profile",
        })
    }

    if (pendingApps > 0) {
        highlights.push({ icon: "📨", text: `${pendingApps} pending application${pendingApps > 1 ? "s" : ""} waiting for response` })
    }

    if (unreadNotifs > 0) {
        highlights.push({ icon: "🔔", text: `${unreadNotifs} unread notification${unreadNotifs > 1 ? "s" : ""}` })
    }

    if (savedCount > 0 && pendingApps === 0) {
        highlights.push({
            icon: "💼",
            text: `${savedCount} saved internship${savedCount > 1 ? "s" : ""} — want me to apply?`,
            action: "Apply to my saved internships",
        })
    }

    if (score < 50 && state !== "EMPATHETIC") {
        highlights.push({
            icon: "📊",
            text: `Your profile score is ${score}/100 — let's boost it with a quick chat!`,
            action: "Help me improve my profile score",
        })
    }

    // Adaptive suggested prompt
    const suggestedPrompt = state === "CELEBRATING"
        ? "What should I do next after getting approved?"
        : state === "EMPATHETIC"
        ? "Show me new matches that fit my profile"
        : state === "PROACTIVE"
        ? "Any new internships that match my skills?"
        : score < 30
        ? "Help me build my profile"
        : savedCount > 0
        ? "Apply to my best matching internship"
        : "What should I work on today?"

    return { greeting, highlights, suggestedPrompt }
}

function buildAdaptiveGreeting(
    state: PersonalityState,
    firstName: string,
    timeGreeting: string,
    ctx: { score: number; recentApprovals: number; recentRejections: number; pendingApps: number; upcomingInterview: unknown }
): string {
    switch (state) {
        case "CELEBRATING":
            return `${timeGreeting}, ${firstName}! Amazing news — you got approved! 🎉 Let's keep this momentum going.`
        case "EMPATHETIC":
            return `${timeGreeting}, ${firstName}. I know things have been tough, but I've been working on finding you better matches. Let's look at what's new.`
        case "ENCOURAGING":
            return `${timeGreeting}, ${firstName}! Welcome to LynkSkill 🚀 I'm Linky, and I'm here to help you find your perfect internship. Let's get started!`
        case "PROACTIVE":
            return `${timeGreeting}, ${firstName}! I've been keeping an eye on new opportunities for you. ${ctx.score >= 50 ? "Your profile is looking good" : "Let's catch up"} — there's some exciting stuff to check out.`
        case "COACHING":
            return `${timeGreeting}, ${firstName}! ${ctx.score >= 60 ? `Your profile score is ${ctx.score}/100 — solid 💪` : "Let's make today count 🚀"} ${ctx.pendingApps > 0 ? `You have ${ctx.pendingApps} app${ctx.pendingApps > 1 ? "s" : ""} pending.` : ""}`
    }
}

async function buildCompanyBriefing(companyId: string, firstName: string, timeGreeting: string) {
    const [
        pendingApps,
        activePostings,
        upcomingInterviews,
        recentStrongCandidates,
    ] = await Promise.all([
        prisma.application.count({ where: { internship: { companyId }, status: "PENDING" } }),
        prisma.internship.count({ where: { companyId, applicationEnd: { gte: new Date() } } }),
        prisma.interview.count({
            where: {
                application: { internship: { companyId } },
                scheduledAt: { gte: new Date(), lte: new Date(Date.now() + 48 * 60 * 60 * 1000) },
                status: "SCHEDULED",
            },
        }),
        prisma.candidateEvaluation.count({
            where: { companyId, matchPercentage: { gte: 80 }, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
    ])

    const highlights: { icon: string; text: string; action?: string }[] = []

    if (pendingApps > 0) {
        highlights.push({
            icon: "📋",
            text: `${pendingApps} pending application${pendingApps > 1 ? "s" : ""} to review`,
            action: "Rank my pending applications by fit",
        })
    }

    if (recentStrongCandidates > 0) {
        highlights.push({
            icon: "⭐",
            text: `${recentStrongCandidates} strong candidate${recentStrongCandidates > 1 ? "s" : ""} detected this week by Linky`,
        })
    }

    if (upcomingInterviews > 0) {
        highlights.push({ icon: "📅", text: `${upcomingInterviews} interview${upcomingInterviews > 1 ? "s" : ""} in the next 48 hours` })
    }

    if (activePostings === 0) {
        highlights.push({
            icon: "💡",
            text: "No active postings — tell me what you need and I'll draft one",
            action: "Help me create a new internship posting",
        })
    }

    const suggestedPrompt = pendingApps > 0
        ? "Rank all pending applications by fit"
        : activePostings === 0
        ? "Help me create a new internship posting"
        : "Search for React developers in Sofia"

    return {
        greeting: `${timeGreeting}, ${firstName}! ${pendingApps > 0 ? `You have ${pendingApps} applications waiting.` : "Your hiring pipeline is up to date."} 📊`,
        highlights,
        suggestedPrompt,
    }
}
