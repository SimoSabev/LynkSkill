import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { recordMatchFeedback } from "@/lib/ai/match-feedback"

export async function POST(req: Request) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await req.json()
    const { notificationId, internshipId, rating, reason, matchScore } = body

    if (!rating || !["HELPFUL", "NOT_HELPFUL"].includes(rating)) {
        return NextResponse.json({ error: "rating must be HELPFUL or NOT_HELPFUL" }, { status: 400 })
    }

    await recordMatchFeedback({
        userId: user.id,
        notificationId,
        internshipId,
        rating,
        reason,
        matchScore,
    })

    return NextResponse.json({ success: true })
}
