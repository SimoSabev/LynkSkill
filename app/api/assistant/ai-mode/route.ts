import { NextRequest, NextResponse } from "next/server"
import type OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { openai, isOpenAIConfigured } from "@/lib/openai"
import { runTool, toolsFor, type AgentArtifacts, type AgentContext } from "@/lib/ai/agent-tools"

// "Linky" - tool-calling agent for students and companies.
// The model decides which tools to call; every tool runs as the signed-in user
// through the same service layer as the REST API (lib/services/*).

type ChatPhase = "intro" | "gathering" | "portfolio" | "matching" | "results"
const VALID_PHASES: ChatPhase[] = ["intro", "gathering", "portfolio", "matching", "results"]

interface ConversationMessage {
    role: "user" | "assistant"
    content: string
}

const MODEL = process.env.OPENAI_AGENT_MODEL || "gpt-4.1-mini"
const MAX_MESSAGE_CHARS = 4000
const MAX_HISTORY_MESSAGES = 30
const MAX_TOOL_ROUNDS = 6

// Best-effort per-instance limiter (serverless instances don't share memory).
// For a hard global limit use the Upstash Ratelimit already in dependencies.
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 20
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(userId)
    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        return true
    }
    if (entry.count >= RATE_LIMIT_MAX) return false
    entry.count++
    return true
}

function systemPrompt(role: AgentContext["role"], name: string | null): string {
    const today = new Date().toISOString().slice(0, 10)
    const shared = `You are Linky, the AI assistant of LynkSkill - a Bulgarian platform connecting students (16+) with internships.
Today is ${today}. The user's name: ${name || "unknown"}.

LANGUAGE: Always reply in the language the user writes in (Bulgarian or English). Default to Bulgarian if unclear.

HOW YOU WORK:
- You have tools that read and change real data on LynkSkill as this user. Use them instead of guessing. Never invent ids, internships, candidates, dates or numbers - only use what tools return.
- Call read tools freely and proactively (several in one turn if useful). Pick the right tool yourself; don't ask the user for ids - look them up.
- WRITE ACTIONS (anything that applies, saves to a profile, publishes, approves/rejects, schedules, sends, withdraws): first state exactly what you will do in one short sentence and ask "Да продължа ли?" / "Shall I go ahead?". Only call the tool with confirmed=true when the user's LATEST message clearly says yes to that exact action. If the user's request is itself an explicit, specific command ("apply to X", "approve Maria's application"), that counts as confirmation.
- If a tool returns an error, explain it plainly and suggest the next step.
- Search results are displayed as cards in the UI automatically - don't repeat every field; summarize the top 2-3 and why they fit.
- Be concise: short paragraphs or bullet points, markdown allowed, occasional emoji. No filler.
- You cannot upload files for the user. For test assignments point them to the upload_link.`

    if (role === "COMPANY") {
        return `${shared}

YOU HELP A COMPANY recruit interns. You can: summarize the company dashboard, list/create internships, search and rank candidates, open candidate profiles, review applications (incl. test submission status), approve/reject, schedule interviews and contact candidates.
When asked to find talent: if the request is very vague, ask at most ONE clarifying question; otherwise search immediately with search_candidates using concrete skills.
When creating an internship, collect the required fields conversationally (title, description, location, paid/salary, application window), propose sensible defaults, show a summary and ask for confirmation.`
    }

    return `${shared}

YOU HELP A STUDENT find and land internships. You can: read their profile, draft and save their portfolio, search and explain internships, apply, bookmark, track applications/assignments/interviews, confirm interviews and withdraw pending applications.
Start by calling get_my_profile when you need context. If the portfolio is thin, interview them briefly (skills, interests, education, projects, goals - one or two questions at a time), then call draft_portfolio, and offer to save it.
Proactively suggest the next best step (e.g. a pending test assignment due soon, an interview to confirm, a strong match to apply to).`
}

function sanitizeHistory(raw: unknown): ConversationMessage[] {
    if (!Array.isArray(raw)) return []
    return raw
        .filter((m): m is ConversationMessage => {
            const msg = m as ConversationMessage
            return (msg?.role === "user" || msg?.role === "assistant") && typeof msg.content === "string" && msg.content.trim() !== ""
        })
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        if (!isOpenAIConfigured()) {
            return NextResponse.json({ error: "AI is not configured" }, { status: 503 })
        }

        // Role comes from the DB, never from the client
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true, profile: { select: { name: true } }, companies: { select: { id: true }, take: 1 } },
        })
        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (!checkRateLimit(userId)) {
            return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
        }

        const body = await req.json().catch(() => ({}))
        const message = body?.message
        if (typeof message !== "string" || !message.trim() || message.length > MAX_MESSAGE_CHARS) {
            return NextResponse.json({ error: `Message is required (max ${MAX_MESSAGE_CHARS} characters)` }, { status: 400 })
        }
        const phase: ChatPhase = VALID_PHASES.includes(body?.phase) ? body.phase : "intro"
        const history = sanitizeHistory(body?.conversationHistory)

        const ctx: AgentContext = {
            userId: dbUser.id,
            role: dbUser.role,
            companyId: dbUser.companies[0]?.id ?? null,
        }
        const artifacts: AgentArtifacts = { actions: [] }
        const tools = toolsFor(ctx.role)

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt(ctx.role, dbUser.profile?.name ?? null) },
            ...history,
            { role: "user", content: message },
        ]

        let reply = ""
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            const completion = await openai.chat.completions.create({
                model: MODEL,
                messages,
                tools,
                // On the last round force a text answer
                tool_choice: round === MAX_TOOL_ROUNDS ? "none" : "auto",
                temperature: 0.4,
                max_tokens: 1200,
            })

            const choice = completion.choices[0]?.message
            if (!choice) break

            const toolCalls = (choice.tool_calls ?? []).filter((c) => c.type === "function")
            if (toolCalls.length === 0) {
                reply = choice.content?.trim() || ""
                break
            }

            messages.push({ role: "assistant", content: choice.content ?? null, tool_calls: toolCalls })
            const results = await Promise.all(
                toolCalls.map(async (call) => ({
                    id: call.id,
                    result: await runTool(ctx, call.function.name, call.function.arguments, artifacts),
                }))
            )
            for (const { id, result } of results) {
                messages.push({ role: "tool", tool_call_id: id, content: JSON.stringify(result).slice(0, 20_000) })
            }
        }

        if (!reply) {
            reply = "Извинявай, не успях да довърша това. Опитай да го формулираш по друг начин. / Sorry, I couldn't complete that - please try rephrasing."
        }

        // Response contract consumed by components/{student,company}-ai-chat.tsx
        const matches = ctx.role === "COMPANY" ? artifacts.studentMatches : artifacts.internshipMatches
        const newPhase: ChatPhase = matches?.length
            ? "results"
            : artifacts.portfolioDraft
                ? "portfolio"
                : phase === "intro" && history.length > 0
                    ? "gathering"
                    : phase

        return NextResponse.json({
            reply,
            phase: newPhase,
            ...(matches?.length ? { matches, type: ctx.role === "COMPANY" ? "search_complete" : "matches_found" } : {}),
            ...(artifacts.portfolioDraft ? { portfolio: artifacts.portfolioDraft, type: "portfolio_generated" } : {}),
            actions: artifacts.actions,
        })
    } catch (error) {
        console.error("AI Mode API Error:", error)
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
    }
}
