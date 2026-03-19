import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { resolveEnhancedUserContext } from "@/lib/ai/user-context"
import {
    loadUserSessions,
    loadSessionHistory,
    deleteSession,
} from "@/lib/ai/ai-memory"

// GET /api/ai-sessions — List all sessions or load a specific session
export async function GET(req: Request) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ctxResult = await resolveEnhancedUserContext(clerkId)
    if (!ctxResult.success) return NextResponse.json({ error: "Context failed" }, { status: 403 })

    const url = new URL(req.url)
    const sessionId = url.searchParams.get("sessionId")

    if (sessionId) {
        // Load messages for a specific session
        const messages = await loadSessionHistory(ctxResult.context.userId, sessionId)
        return NextResponse.json({ messages })
    }

    // List all sessions
    const sessions = await loadUserSessions(ctxResult.context.userId)
    return NextResponse.json({ sessions })
}

// DELETE /api/ai-sessions — Delete a session
export async function DELETE(req: Request) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ctxResult = await resolveEnhancedUserContext(clerkId)
    if (!ctxResult.success) return NextResponse.json({ error: "Context failed" }, { status: 403 })

    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })

    await deleteSession(ctxResult.context.userId, sessionId)
    return NextResponse.json({ success: true })
}
