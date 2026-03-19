import { prisma } from "@/lib/prisma"

interface SearchResult {
    sessionId: string
    sessionName: string
    sessionDate: string
    matchingSnippet: string
    role: string
    confidenceScore: number | null
}

// Search across all AI conversation logs for a user
export async function searchAcrossSessions(
    userId: string,
    query: string,
    limit = 10
): Promise<SearchResult[]> {
    if (!query.trim()) return []

    // Full-text search using ILIKE (PostgreSQL)
    const matches = await prisma.aIConversationLog.findMany({
        where: {
            userId,
            content: { contains: query, mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2, // Fetch more, then deduplicate by session
        select: {
            sessionId: true,
            role: true,
            content: true,
            createdAt: true,
        },
    })

    if (matches.length === 0) return []

    // Get confidence score for each session
    const aiProfile = await prisma.aIProfile.findUnique({
        where: { studentId: userId },
        include: { confidenceScore: { select: { overallScore: true, scoreHistory: true } } },
    })

    // Get session names (first user message per session)
    const sessionIds = [...new Set(matches.map((m: { sessionId: string }) => m.sessionId))]
    const sessionFirstMsgs = await Promise.all(
        sessionIds.map(async sid => {
            const first = await prisma.aIConversationLog.findFirst({
                where: { userId, sessionId: sid, role: "user" },
                orderBy: { createdAt: "asc" },
                select: { content: true, createdAt: true },
            })
            return { sessionId: sid, name: first?.content?.slice(0, 50) ?? "Chat", date: first?.createdAt }
        })
    )
    const sessionNameMap = new Map(sessionFirstMsgs.map(s => [s.sessionId, s]))

    // Build results, one per session (best match)
    const seen = new Set<string>()
    const results: SearchResult[] = []

    for (const match of matches) {
        if (seen.has(match.sessionId)) continue
        seen.add(match.sessionId)

        const sessionInfo = sessionNameMap.get(match.sessionId)
        const queryLower = query.toLowerCase()
        const contentLower = match.content.toLowerCase()
        const idx = contentLower.indexOf(queryLower)

        // Extract snippet around the match
        const start = Math.max(0, idx - 60)
        const end = Math.min(match.content.length, idx + query.length + 60)
        let snippet = match.content.slice(start, end)
        if (start > 0) snippet = "…" + snippet
        if (end < match.content.length) snippet = snippet + "…"

        results.push({
            sessionId: match.sessionId,
            sessionName: sessionInfo?.name ? (sessionInfo.name + (sessionInfo.name.length >= 50 ? "…" : "")) : "Chat",
            sessionDate: (sessionInfo?.date ?? match.createdAt).toLocaleDateString(),
            matchingSnippet: snippet,
            role: match.role,
            confidenceScore: aiProfile?.confidenceScore?.overallScore ?? null,
        })

        if (results.length >= limit) break
    }

    return results
}
