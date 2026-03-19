import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"

// ─── Save a conversation turn to the database ───────────────────────────
export async function saveConversationTurn(
    userId: string,
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    userType: "student" | "company",
    metadata?: Record<string, unknown>
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma as any).aIConversationLog.create({
        data: {
            userId,
            sessionId,
            userType,
            role,
            content,
            metadata: metadata ?? undefined,
        },
    })
}

// ─── Load history for a specific session ─────────────────────────────────
export async function loadSessionHistory(
    userId: string,
    sessionId: string,
    limit = 50
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma as any).aIConversationLog.findMany({
        where: { userId, sessionId },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: {
            id: true,
            role: true,
            content: true,
            metadata: true,
            userType: true,
            createdAt: true,
        },
    })
}

// ─── Load all sessions for a user (grouped) ──────────────────────────────
export async function loadUserSessions(userId: string) {
    // Get distinct sessions with their first and last message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessions = await (prisma as any).aIConversationLog.groupBy({
        by: ["sessionId", "userType"],
        where: { userId },
        _count: { id: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: "desc" } },
    }) as Array<{
        sessionId: string;
        userType: "student" | "company";
        _count: { id: number };
        _min: { createdAt: Date | null };
        _max: { createdAt: Date | null };
    }>

    // For each session, get the first user message for a name
    const enriched = await Promise.all(
        sessions.map(async (s) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const firstMsg = await (prisma as any).aIConversationLog.findFirst({
                where: { userId, sessionId: s.sessionId, role: "user" },
                orderBy: { createdAt: "asc" },
                select: { content: true },
            })
            return {
                id: s.sessionId,
                name: firstMsg
                    ? firstMsg.content.slice(0, 60) + (firstMsg.content.length > 60 ? "…" : "")
                    : `Chat ${s._min.createdAt?.toLocaleDateString() ?? ""}`,
                userType: s.userType,
                messageCount: s._count.id,
                createdAt: s._min.createdAt,
                lastMessageAt: s._max.createdAt,
            }
        })
    )

    return enriched
}

// ─── Delete a session ────────────────────────────────────────────────────
export async function deleteSession(userId: string, sessionId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma as any).aIConversationLog.deleteMany({
        where: { userId, sessionId },
    })
}

// ─── Load user memory (key facts for system prompt injection) ────────────
export async function loadUserMemory(userId: string): Promise<string | null> {
    // 1. Load AI Profile data (career goals, personality, skills, etc.)
    const aiProfile = await prisma.aIProfile.findUnique({
        where: { studentId: userId },
        include: { confidenceScore: true },
    })

    // 2. Load recent conversation topics (last 5 sessions, last message from each)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentSessions = await (prisma as any).aIConversationLog.groupBy({
        by: ["sessionId"],
        where: { userId },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: "desc" } },
        take: 5,
    }) as Array<{ sessionId: string }>

    const recentTopics: string[] = []
    for (const s of recentSessions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastUserMsg = await (prisma as any).aIConversationLog.findFirst({
            where: { userId, sessionId: s.sessionId, role: "user" },
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true },
        })
        if (lastUserMsg) {
            recentTopics.push(
                `- ${lastUserMsg.createdAt.toLocaleDateString()}: "${lastUserMsg.content.slice(0, 100)}"`
            )
        }
    }

    // 3. Build memory block
    const parts: string[] = []

    if (aiProfile) {
        if (aiProfile.careerGoals) {
            const goals = aiProfile.careerGoals as Record<string, unknown>
            parts.push(`Career goals: ${JSON.stringify(goals)}`)
        }
        if (aiProfile.personalityTraits) {
            const traits = aiProfile.personalityTraits as Record<string, unknown>
            parts.push(`Personality: ${JSON.stringify(traits)}`)
        }
        if (aiProfile.skillsAssessment) {
            const skills = aiProfile.skillsAssessment as Record<string, unknown>
            parts.push(`Skills: ${JSON.stringify(skills)}`)
        }
        if (aiProfile.confidenceScore) {
            parts.push(
                `Confidence Score: ${aiProfile.confidenceScore.overallScore}/100 (Profile: ${aiProfile.confidenceScore.profileCompleteness}, Profiling: ${aiProfile.confidenceScore.profilingDepth}, Endorsements: ${aiProfile.confidenceScore.endorsementQuality}, Activity: ${aiProfile.confidenceScore.activityScore})`
            )
        } else {
            parts.push(`Confidence Score: 0/100 (Not started)`)
        }
        parts.push(`Profiling status: ${aiProfile.profilingComplete ? "Complete" : `In progress (${aiProfile.questionsAnswered} questions answered)`}`)
    } else {
        parts.push(`Confidence Score: 0/100 (No profile found)`)
        parts.push(`Profiling status: Not started`)
    }

    if (recentTopics.length > 0) {
        parts.push(`Recent conversations:\n${recentTopics.join("\n")}`)
    }

    if (parts.length === 0) return null

    return parts.join("\n")
}

// ─── Extract insights from conversation and store in AIProfile ───────────
export async function extractAndStoreInsights(
    userId: string,
    recentMessages: { role: string; content: string }[]
) {
    try {
        // Only extract if there are enough user messages
        const userMessages = recentMessages.filter((m) => m.role === "user")
        if (userMessages.length < 2) return

        const conversationText = recentMessages
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n")

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Extract key facts about the student from this conversation. Return ONLY valid JSON:
{
  "careerGoals": { "shortTerm": "...", "longTerm": "...", "dreamJob": "...", "industries": ["..."] } | null,
  "personalityTraits": { "workStyle": "...", "teamPreference": "...", "communication": "..." } | null,
  "skillsMentioned": ["skill1", "skill2"] | null,
  "topicsDiscussed": ["topic1", "topic2"]
}
Only include fields where the student explicitly provided information. Return null for fields with no data. Be concise.`,
                },
                { role: "user", content: conversationText },
            ],
            max_tokens: 400,
            temperature: 0.1,
        })

        const raw = completion.choices[0].message.content ?? ""
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return

        const insights = JSON.parse(jsonMatch[0])

        // Upsert into AIProfile
        const existing = await prisma.aIProfile.findUnique({
            where: { studentId: userId },
        })

        if (existing) {
            const updateData: Record<string, unknown> = {}
            if (insights.careerGoals) {
                updateData.careerGoals = {
                    ...(existing.careerGoals as Record<string, unknown> ?? {}),
                    ...(insights.careerGoals as Record<string, unknown>),
                }
            }
            if (insights.personalityTraits) {
                updateData.personalityTraits = {
                    ...(existing.personalityTraits as Record<string, unknown> ?? {}),
                    ...(insights.personalityTraits as Record<string, unknown>),
                }
            }
            if (insights.skillsMentioned) {
                const existingSkills = existing.skillsAssessment as Record<string, unknown> ?? {}
                const existingTechnical = (existingSkills.technical as string[]) ?? []
                const merged = [...new Set([...existingTechnical, ...insights.skillsMentioned])]
                updateData.skillsAssessment = { ...existingSkills, technical: merged }
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.aIProfile.update({
                    where: { studentId: userId },
                    data: updateData,
                })
            }
        } else {
            // Create new AIProfile with extracted data
            await prisma.aIProfile.create({
                data: {
                    studentId: userId,
                    careerGoals: insights.careerGoals ?? undefined,
                    personalityTraits: insights.personalityTraits ?? undefined,
                    skillsAssessment: insights.skillsMentioned
                        ? { technical: insights.skillsMentioned }
                        : undefined,
                },
            })
        }
    } catch (error) {
        // Fire-and-forget — log but don't crash
        console.error("[ai-memory] Failed to extract insights:", error)
    }
}
