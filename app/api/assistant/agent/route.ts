import { NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { executeTool, type ToolResult } from "@/lib/agent-tools"
import { resolveEnhancedUserContext } from "@/lib/ai/user-context"
import { validateAndAuthorizeToolCall } from "@/lib/ai/authorize"
import { getToolsForContext, getToolDefinition } from "@/lib/ai/tool-registry"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: {
    role: string
    companyId?: string
    companyRole?: string
    isCompanyOwner?: boolean
    permissions: string[]
}): string {
    const now = new Date().toLocaleString("en-GB", { timeZone: "Europe/Sofia" })

    let base = `You are Linky, the smart AI agent built into LynkSkill — a platform connecting Bulgarian students with real internship opportunities at top companies.

TODAY: ${now}

YOUR PERSONALITY:
- Warm, clear, direct — like a career-savvy older friend
- Use emoji sparingly (only when it adds meaning)
- When you complete an action, say what you did and suggest a logical next step
- NEVER fabricate data. Every fact must come from a tool result.
- Politely refuse to answer questions unrelated to LynkSkill, careers, internships, or professional development.

RESPONSE RULES:
- Use **bold** for names, titles, key facts
- Use bullet lists for multiple items
- After showing results always end with 2-3 short suggested next actions in this EXACT format:
  <suggestions>
  ["action text 1", "action text 2", "action text 3"]
  </suggestions>
- When a tool fails or returns empty, say so clearly and suggest alternatives.
`

    if (ctx.role === "STUDENT") {
        base += `
STUDENT CAPABILITIES:
- Search & browse internships (filters: keyword, location)
- Get personalised internship recommendations based on portfolio skills
- Generate an AI-written cover letter for a specific internship
- List my applications & their statuses
- Withdraw a pending application
- View my portfolio (headline, bio, skills, interests, links)
- List saved internships
- View & reply to messages
- View upcoming interviews
- View assignments
- View and clear notifications
`
    } else if (ctx.companyId) {
        const role = ctx.companyRole ?? "member"
        const perms = ctx.permissions
            .filter((p) => p !== "__OWNER__")
            .map((p) => p.replace(/_/g, " ").toLowerCase())
        base += `
COMPANY CAPABILITIES (role: ${role}):
Permissions: ${perms.join(", ") || "all (owner)"}

- List our internship postings
- Create a new internship posting (if permitted)
- Update an existing internship posting (if permitted)
- List received applications
- View full application details including student profile
- Search student candidates by skills / query (if permitted)
- View messages
- View assignments
- View and clear notifications
`
    }

    return base
}

// ─── Stream Event helpers ─────────────────────────────────────────────────────

interface StreamEvent {
    type: "tool_start" | "tool_end" | "reply" | "error"
    toolName?: string
    toolTitle?: string
    result?: ToolResult
    reply?: string
    suggestions?: string[]
    error?: string
}

function encodeEvent(ev: StreamEvent): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(ev) + "\n")
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

interface ReqBody {
    message: string
    conversationHistory?: { role: "user" | "assistant"; content: string }[]
    userType?: string
}

export async function POST(req: Request) {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: ReqBody
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 })
    }
    const { message, conversationHistory = [] } = body
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 })

    const ctxResult = await resolveEnhancedUserContext(clerkId)
    if (!ctxResult.success) return NextResponse.json({ error: "Context failed" }, { status: 403 })
    const ctx = ctxResult.context

    const tools = getToolsForContext({ userType: ctx.role, permissions: ctx.permissions })
    const systemPrompt = buildSystemPrompt(ctx)

    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = conversationHistory
        .slice(-20)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                    { role: "system", content: systemPrompt },
                    ...historyMessages,
                    { role: "user", content: message },
                ]

                let continueLoop = true
                const MAX_TOOL_ROUNDS = 6

                for (let round = 0; round < MAX_TOOL_ROUNDS && continueLoop; round++) {
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages,
                        tools: tools.length > 0 ? tools : undefined,
                        tool_choice: tools.length > 0 ? "auto" : undefined,
                        max_tokens: 1200,
                        temperature: 0.4,
                    })

                    const choice = completion.choices[0]

                    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
                        messages.push(choice.message)
                        const toolResultMessages: OpenAI.Chat.ChatCompletionToolMessageParam[] = []

                        for (const tc of choice.message.tool_calls) {
                            if (tc.type !== "function") continue
                            const toolName = tc.function.name
                            const toolDef = getToolDefinition(toolName)
                            const args = JSON.parse(tc.function.arguments || "{}")

                            controller.enqueue(
                                encodeEvent({
                                    type: "tool_start",
                                    toolName,
                                    toolTitle: toolDef?.description?.split(".")[0] ?? toolName.replace(/_/g, " "),
                                })
                            )

                            const authResult = await validateAndAuthorizeToolCall(toolName, args, ctx)
                            let toolResult: ToolResult

                            if (!authResult.allowed) {
                                toolResult = {
                                    tool: toolName,
                                    success: false,
                                    cardType: "error",
                                    title: "Permission denied",
                                    data: null,
                                    error: authResult.reason ?? "Not authorized",
                                }
                            } else {
                                try {
                                    toolResult = await executeTool(toolName, authResult.args, ctx)
                                } catch (err) {
                                    toolResult = {
                                        tool: toolName,
                                        success: false,
                                        cardType: "error",
                                        title: `Error running ${toolName}`,
                                        data: null,
                                        error: err instanceof Error ? err.message : "Unknown error",
                                    }
                                }
                            }

                            controller.enqueue(encodeEvent({ type: "tool_end", toolName, result: toolResult }))

                            toolResultMessages.push({
                                role: "tool",
                                tool_call_id: tc.id,
                                content: JSON.stringify({
                                    success: toolResult.success,
                                    data: toolResult.data,
                                    error: toolResult.error,
                                }),
                            })
                        }

                        messages.push(...toolResultMessages)
                    } else {
                        const raw = choice.message.content ?? ""
                        const suggestMatch = raw.match(/<suggestions>\s*(\[[\s\S]*?\])\s*<\/suggestions>/)
                        const reply = raw.replace(/<suggestions>[\s\S]*?<\/suggestions>/g, "").trim()
                        let suggestions: string[] = []
                        if (suggestMatch) {
                            try {
                                suggestions = JSON.parse(suggestMatch[1])
                            } catch {
                                /* ignore */
                            }
                        }
                        controller.enqueue(encodeEvent({ type: "reply", reply, suggestions }))
                        continueLoop = false
                    }
                }
            } catch (err) {
                controller.enqueue(
                    encodeEvent({
                        type: "error",
                        error: err instanceof Error ? err.message : "Internal error",
                    })
                )
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
        },
    })
}
