import { NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { Permission } from "@prisma/client"
import { executeTool, type ToolResult } from "@/lib/agent-tools"
import {
    resolveEnhancedUserContext,
    type EnhancedUserContext,
} from "@/lib/ai/user-context"
import { validateAndAuthorizeToolCall, type DenialResponse } from "@/lib/ai/authorize"
import {
    getToolsForContext,
    getToolDefinition,
    type ToolFilterContext,
} from "@/lib/ai/tool-registry"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// ─── Dynamic System Prompt Builder ──────────────────────────────────────────

function buildSystemPrompt(ctx: EnhancedUserContext): string {
    let prompt = `You are Linky, the AI Agent for LynkSkill — a platform connecting students with internship opportunities and companies with talented candidates.

You are a FULL-FEATURED agent that can perform real actions on the platform. You have tools to help users accomplish tasks efficiently.

PERSONALITY:
- Friendly, encouraging, and professional
- Be concise but thorough
- Proactive — suggest next steps after completing actions

GUIDELINES:
1. When showing results, summarize key details and offer follow-up actions
2. NEVER make up or fabricate data — only show real results from tools
3. If a tool returns an error, explain it clearly and suggest alternatives
4. If you don't have a tool for something, explain what you can help with instead
5. If a tool call is denied due to permissions, relay the denial message to the user clearly

FORMATTING:
- Use **bold** for important info
- Use bullet points for lists
- Keep responses focused and actionable
- After showing results, suggest 2-3 relevant follow-up actions

RESTRICTION: Only answer questions related to LynkSkill, careers, internships, portfolios, and professional development. Politely redirect off-topic questions.`

    // Add role-specific capabilities
    if (ctx.role === "STUDENT") {
        prompt += `

As a STUDENT user, you can help with:
- Searching and browsing available internships
- Viewing internship details
- Applying to internships (with optional cover letter)
- Viewing application statuses
- Viewing and updating your portfolio (bio, skills, headline, etc.)
- Checking interview schedule
- Viewing and replying to messages
- Viewing assignments and tasks
- Saving/bookmarking internships`
    } else if (ctx.companyId) {
        const roleLabel = ctx.companyRole
            ? ctx.companyRole.replace(/_/g, " ").toLowerCase()
            : ctx.customRoleName ?? "member"

        prompt += `

As a ${roleLabel} of a company, you can help with company tasks.`

        if (ctx.permissions.length > 0) {
            const permLabels = ctx.permissions.map((p: Permission) =>
                String(p).replace(/_/g, " ").toLowerCase()
            )
            prompt += `
Your current permissions: ${permLabels.join(", ")}.`
        }

        prompt += `

Available company capabilities (based on your permissions):
- Listing your company's internships
- Creating new internship postings (if permitted)
- Viewing and managing received applications (if permitted)
- Searching for student candidates (if permitted)
- Scheduling interviews (if permitted)
- Viewing and replying to messages
- Viewing assignments`
    } else {
        // Company/Team member without a company
        prompt += `

You appear to be a company user but are not currently associated with a company. You can:
- View general information
- Join or create a company to unlock full capabilities`
    }

    return prompt
}

// ─── Audit Logging ──────────────────────────────────────────────────────────

/**
 * Log write operations for audit trail.
 * Currently logs to console. When an AuditLog model is added to Prisma,
 * this will persist to the database.
 */
async function logAudit(
    ctx: EnhancedUserContext,
    toolName: string,
    args: Record<string, unknown>,
    result: unknown
) {
    const auditEntry = {
        actorUserId: ctx.userId,
        companyId: ctx.companyId ?? null,
        action: toolName,
        targetId: (args.id as string) || (args.internshipId as string) || (args.applicationId as string) || null,
        details: JSON.stringify({
            args,
            result: truncateForAudit(result),
        }),
        timestamp: new Date().toISOString(),
    }

    console.log("[Audit]", JSON.stringify(auditEntry))

    // TODO: Persist to database when AuditLog model is available
    // await prisma.auditLog.create({ data: auditEntry })
}

/**
 * Truncate large result objects for audit storage.
 */
function truncateForAudit(result: unknown): unknown {
    const str = JSON.stringify(result)
    if (str && str.length > 500) {
        return str.substring(0, 500) + "...[truncated]"
    }
    return result
}

// ─── POST Handler ───────────────────────────────────────────────────────────

interface ConversationMessage {
    role: "user" | "assistant"
    content: string
}

export async function POST(req: Request) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { message, conversationHistory, userType } = body as {
            message: string
            conversationHistory: ConversationMessage[]
            userType: "student" | "company"
        }

        // ── Resolve enhanced user context ────────────────────────────────
        const contextResult = await resolveEnhancedUserContext(clerkId)
        if (!contextResult.success) {
            return NextResponse.json(
                { error: contextResult.message },
                { status: contextResult.error === "USER_NOT_FOUND" ? 404 : 401 }
            )
        }
        const ctx = contextResult.context

        // ── Build dynamic system prompt based on user's permissions ──────
        const systemPrompt = buildSystemPrompt(ctx)

        // Build message history for OpenAI
        const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content
            })),
            { role: "user", content: message }
        ]

        // ── Get filtered tools for the user's context ───────────────────
        const filterCtx: ToolFilterContext = {
            userType,
            permissions: new Set(ctx.permissions),
        }
        const tools = getToolsForContext(filterCtx)

        // Collect tool results for the client to render as cards
        const collectedToolResults: ToolResult[] = []

        // Function calling loop (max 5 iterations to prevent infinite loops)
        let iterations = 0
        const MAX_ITERATIONS = 5

        while (iterations < MAX_ITERATIONS) {
            iterations++

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: openaiMessages,
                tools,
                tool_choice: "auto",
                temperature: 0.7,
                max_tokens: 2000,
            })

            const choice = completion.choices[0]
            if (!choice) break

            const assistantMessage = choice.message

            // If no tool calls, we're done — return the final response
            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
                return NextResponse.json({
                    reply: assistantMessage.content || "I'm not sure how to help with that. Could you rephrase?",
                    toolResults: collectedToolResults
                })
            }

            // Add assistant's message (with tool calls) to the conversation
            openaiMessages.push(assistantMessage)

            // ── Execute each tool call with authorization ────────────────
            for (const toolCall of assistantMessage.tool_calls) {
                if (toolCall.type !== "function") continue

                const funcName = toolCall.function.name
                let rawArgs: Record<string, unknown> = {}

                try {
                    rawArgs = JSON.parse(toolCall.function.arguments || "{}")
                } catch {
                    rawArgs = {}
                }

                console.log(`[Agent] Tool call: ${funcName}`, rawArgs)

                // ── Pre-execution authorization ─────────────────────────
                const authResult = await validateAndAuthorizeToolCall(
                    funcName,
                    rawArgs,
                    ctx
                )

                if (!authResult.allowed) {
                    // Authorization denied — return standardized denial
                    const denial = authResult.denial
                    console.warn(`[Agent] Tool denied: ${funcName}`, denial.type, denial.message)

                    collectedToolResults.push({
                        success: false,
                        cardType: "permission-denied",
                        title: "Action Not Permitted",
                        data: {
                            type: denial.type,
                            deniedTool: denial.deniedTool,
                            reply: denial.reply,
                            suggestion: denial.suggestion,
                            requiredPermission: denial.requiredPermission,
                            validationErrors: denial.validationErrors,
                        },
                        error: denial.message,
                    })

                    // Feed the denial back to OpenAI so it can inform the user
                    openaiMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: buildDenialToolResponse(denial),
                    })
                    continue
                }

                // ── Execute the authorized tool ─────────────────────────
                // Use the parsed & validated args from the authorization layer
                const authorizedArgs = authResult.args

                // Inject context values into args where needed
                const enrichedArgs = injectContextIntoArgs(authorizedArgs, ctx)

                const result = await executeTool(funcName, enrichedArgs, {
                    clerkId: ctx.clerkId,
                    userId: ctx.userId,
                    role: ctx.role,
                    companyId: ctx.companyId,
                })
                collectedToolResults.push(result)

                // ── Audit logging for write operations ──────────────────
                const toolDef = getToolDefinition(funcName)
                if (toolDef?.isWrite) {
                    await logAudit(ctx, funcName, enrichedArgs, result)
                }

                // Create a concise summary for OpenAI (not the full data)
                const toolResponseContent = result.success
                    ? `Tool "${funcName}" succeeded: ${result.title}. ${summarizeResult(result)}`
                    : `Tool "${funcName}" failed: ${result.error || "Unknown error"}`

                // Add tool result to conversation
                openaiMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolResponseContent,
                })
            }

            // Continue loop — OpenAI will process tool results and either call more tools or respond
        }

        // If we hit max iterations, force a response
        return NextResponse.json({
            reply: "I've completed the requested actions. Let me know if you need anything else!",
            toolResults: collectedToolResults
        })

    } catch (error) {
        console.error("Agent API Error:", error)
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        )
    }
}

// ─── Helper: Build denial response for OpenAI tool message ──────────────────

function buildDenialToolResponse(denial: DenialResponse): string {
    let response = `Tool "${denial.deniedTool}" was DENIED (${denial.type}): ${denial.reply}`
    if (denial.suggestion) {
        response += ` Suggestion: ${denial.suggestion}`
    }
    return response
}

// ─── Helper: Inject context values into tool arguments ──────────────────────

/**
 * For tools that need companyId or userId injected into their arguments
 * (e.g., company-scoped tools that need companyId for DB queries),
 * this function enriches the args with context values.
 */
function injectContextIntoArgs(
    args: Record<string, unknown>,
    ctx: EnhancedUserContext
): Record<string, unknown> {
    const enriched = { ...args }

    // Always inject userId for traceability
    if (!enriched.userId) {
        enriched.userId = ctx.userId
    }

    // Inject companyId for company users
    if (ctx.companyId && !enriched.companyId) {
        enriched.companyId = ctx.companyId
    }

    return enriched
}

// ─── Helper: Summarize tool results for OpenAI context ──────────────────────

function summarizeResult(result: ToolResult): string {
    const data = result.data as Record<string, unknown>
    if (!data) return ""

    if (Array.isArray(data)) {
        const items = data.slice(0, 5)
        if (result.cardType === "internship-list") {
            return `Found ${data.length} internships: ${items.map((i: Record<string, unknown>) => `"${i.title}" at ${i.company} (${i.location})`).join(", ")}${data.length > 5 ? "..." : ""}`
        }
        if (result.cardType === "application-list") {
            return `Found ${data.length} applications: ${items.map((a: Record<string, unknown>) => `${a.internshipTitle} - ${a.status}`).join(", ")}`
        }
        if (result.cardType === "candidate-list") {
            return `Found ${data.length} candidates: ${items.map((c: Record<string, unknown>) => `${c.name} (score: ${c.matchScore}%)`).join(", ")}`
        }
        if (result.cardType === "interview-list") {
            return `Found ${data.length} interviews: ${items.map((i: Record<string, unknown>) => `${i.internshipTitle} on ${i.scheduledAt}`).join(", ")}`
        }
        if (result.cardType === "conversation-list") {
            return `Found ${data.length} conversations: ${items.map((c: Record<string, unknown>) => `with ${c.studentName || c.companyName}`).join(", ")}`
        }
        if (result.cardType === "assignment-list") {
            return `Found ${data.length} assignments: ${items.map((a: Record<string, unknown>) => `"${a.title}"`).join(", ")}`
        }
        return `Found ${data.length} items`
    }

    if (result.cardType === "stats") {
        return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(", ")
    }

    if (result.cardType === "portfolio-view") {
        if (data.empty) return "No portfolio created yet"
        return `Portfolio: ${data.headline || "No headline"}, ${(data.skills as string[])?.length || 0} skills`
    }

    if (result.cardType === "action-success") {
        return JSON.stringify(data)
    }

    return JSON.stringify(data).substring(0, 200)
}
