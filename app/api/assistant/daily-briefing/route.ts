import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

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
    ])

    const score = aiProfile?.confidenceScore?.overallScore ?? 0
    const highlights: { icon: string; text: string; action?: string }[] = []

    if (upcomingInterview) {
        const dateStr = upcomingInterview.scheduledAt.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })
        highlights.push({
            icon: "📅",
            text: `Interview for "${upcomingInterview.application.internship.title}" on ${dateStr}`,
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

    if (score < 50) {
        highlights.push({
            icon: "📊",
            text: `Your profile score is ${score}/100 — let's boost it with a quick chat!`,
            action: "Help me improve my profile score",
        })
    }

    const suggestedPrompt = score < 30
        ? "Help me build my profile"
        : savedCount > 0
        ? "Apply to my best matching internship"
        : "Find me an internship that matches my skills"

    return {
        greeting: `${timeGreeting}, ${firstName}! ${score >= 60 ? "Your profile is looking solid 💪" : "Let's make today count 🚀"}`,
        highlights,
        suggestedPrompt,
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
