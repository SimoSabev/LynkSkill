import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { executeTool, type ToolResult } from "@/lib/agent-tools"
import { resolveEnhancedUserContext } from "@/lib/ai/user-context"
import { validateAndAuthorizeToolCall } from "@/lib/ai/authorize"
import { verifyActionToken } from "@/lib/ai/action-confirmation"
import { getToolDefinition } from "@/lib/ai/tool-registry"
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit"

// POST /api/assistant/agent/confirm — runs an agent action the user explicitly confirmed.
// The token was issued by the agent route for this user; authorization is re-checked
// against the user's current role/permissions before executing.
export async function POST(req: Request) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rateLimit = checkRateLimit(`agent-confirm:${clerkId}`, { limit: 20, windowSeconds: 60 })
    if (!rateLimit.success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rateLimit) })
    }

    const body = await req.json().catch(() => null)
    const token = body?.token
    if (typeof token !== "string" || token.length > 8000) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    const ctxResult = await resolveEnhancedUserContext(clerkId)
    if (!ctxResult.success) return NextResponse.json({ error: "Context failed" }, { status: 403 })
    const ctx = ctxResult.context

    const action = verifyActionToken(token, ctx.userId)
    if (!action || !getToolDefinition(action.toolName)?.requiresConfirmation) {
        return NextResponse.json({ error: "This action has expired. Ask Linky again." }, { status: 400 })
    }

    const authResult = await validateAndAuthorizeToolCall(action.toolName, action.args, ctx)
    if (!authResult.allowed) {
        return NextResponse.json({ error: authResult.reason ?? "Not authorized" }, { status: 403 })
    }

    let result: ToolResult
    try {
        result = await executeTool(action.toolName, authResult.args, ctx)
    } catch (err) {
        console.error("[agent/confirm] tool failed:", err)
        result = {
            tool: action.toolName,
            success: false,
            cardType: "error",
            title: "Action failed",
            data: null,
            error: "Something went wrong. Please try again.",
        }
    }

    return NextResponse.json({ result })
}
