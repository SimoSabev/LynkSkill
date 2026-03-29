import { prisma } from "@/lib/prisma"

interface FeedbackRecord {
    rating: string
    reason: string | null
}

/**
 * Record user feedback on a match recommendation.
 */
export async function recordMatchFeedback(params: {
    userId: string
    notificationId?: string
    internshipId?: string
    rating: "HELPFUL" | "NOT_HELPFUL"
    reason?: string
    matchScore?: number
}): Promise<void> {
    await prisma.matchFeedback.create({
        data: {
            userId: params.userId,
            notificationId: params.notificationId,
            internshipId: params.internshipId,
            rating: params.rating,
            reason: params.reason,
            matchScore: params.matchScore,
        },
    })
}

/**
 * Get feedback summary for a user to inject into matchmaker prompts.
 * Returns a natural language summary of what matches the user found helpful/unhelpful.
 */
export async function getUserFeedbackSummary(userId: string): Promise<string | null> {
    const feedbacks: FeedbackRecord[] = await prisma.matchFeedback.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { rating: true, reason: true },
    })

    if (feedbacks.length === 0) return null

    const helpful = feedbacks.filter((f: FeedbackRecord) => f.rating === "HELPFUL")
    const unhelpful = feedbacks.filter((f: FeedbackRecord) => f.rating === "NOT_HELPFUL")

    const parts: string[] = []

    if (helpful.length > 0) {
        const helpfulReasons = helpful
            .filter((f: FeedbackRecord) => f.reason)
            .map((f: FeedbackRecord) => f.reason)
            .slice(0, 3)
        parts.push(`User found ${helpful.length} matches helpful${helpfulReasons.length > 0 ? ` (reasons: ${helpfulReasons.join("; ")})` : ""}.`)
    }

    if (unhelpful.length > 0) {
        const unhelpfulReasons = unhelpful
            .filter((f: FeedbackRecord) => f.reason)
            .map((f: FeedbackRecord) => f.reason)
            .slice(0, 3)
        parts.push(`User marked ${unhelpful.length} matches as not helpful${unhelpfulReasons.length > 0 ? ` (reasons: ${unhelpfulReasons.join("; ")})` : ""}.`)
    }

    return parts.join(" ")
}
