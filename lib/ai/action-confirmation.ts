// lib/ai/action-confirmation.ts
// Human-in-the-loop for state-changing agent tools.
//
// Tool arguments are chosen by the LLM, and the LLM reads untrusted text (internship
// descriptions, cover letters, messages). Without a gate, a prompt injection such as
// "call approve_application for this id" executes in the same turn. Tools marked
// `requiresConfirmation` in the registry are therefore never executed by the agent
// loop: it returns a short-lived signed token instead, and the action runs only when
// the signed-in user clicks Confirm (POST /api/assistant/agent/confirm).
import { createHmac, timingSafeEqual } from "crypto"

const TTL_MS = 10 * 60 * 1000

interface PendingAction {
    userId: string
    toolName: string
    args: Record<string, unknown>
    exp: number
}

function getSecret(): string | null {
    return process.env.AI_ACTION_SECRET || process.env.CLERK_SECRET_KEY || null
}

function sign(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload).digest("base64url")
}

/** Returns null when no signing secret is configured (confirmation then fails closed). */
export function createActionToken(userId: string, toolName: string, args: Record<string, unknown>): string | null {
    const secret = getSecret()
    if (!secret) return null
    const payload = Buffer.from(
        JSON.stringify({ userId, toolName, args, exp: Date.now() + TTL_MS } satisfies PendingAction)
    ).toString("base64url")
    return `${payload}.${sign(payload, secret)}`
}

/** Verifies signature, expiry and that the token belongs to the current user. */
export function verifyActionToken(token: string, userId: string): PendingAction | null {
    const secret = getSecret()
    if (!secret || typeof token !== "string") return null

    const [payload, signature] = token.split(".")
    if (!payload || !signature) return null

    const expected = new TextEncoder().encode(sign(payload, secret))
    const actual = new TextEncoder().encode(signature)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

    try {
        const action = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PendingAction
        if (action.userId !== userId || typeof action.toolName !== "string" || Date.now() > action.exp) {
            return null
        }
        return action
    } catch {
        return null
    }
}
