

---

## 8. AI Frontend & Tools Upgrade Plan

> **Goal:** Upgrade the Linky AI agent frontend (`ai-agent-view.tsx`, `ai-chat-panel.tsx`, `agent-action-card.tsx`) to support streaming responses, live tool-call progress indicators, inline action buttons, suggested follow-up chips, and add 8 new tools + an improved system prompt — all without touching the database schema.

---

### What currently exists (baseline)

| File | What it does |
|---|---|
| `components/ai-agent-view.tsx` | Full-page agent view, fires `POST /api/assistant/agent`, waits for full JSON response |
| `components/ai-chat-panel.tsx` | Sliding panel version of same chat |
| `components/agent-action-card.tsx` | Renders typed cards (internship-list, portfolio, stats…) from tool results |
| `app/api/assistant/agent/route.ts` | Runs OpenAI tool loop, returns `{ reply, toolResults }` |
| `lib/agent-tools.ts` | Tool definitions + executors |
| `lib/ai/tool-registry.ts` | Permission/scope registry |
| `app/api/assistant/prompts.ts` | Portfolio audit prompts (older route) |

---

### STEP 1 — Make the agent route stream

Replace `app/api/assistant/agent/route.ts` so it emits **NDJSON** (one JSON object per line). The UI reads this stream and updates live — showing tool-call spinners as each tool fires and rendering the reply text as it arrives.

#### `app/api/assistant/agent/route.ts` — full replacement

```typescript
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { executeTool, type ToolResult } from "@/lib/agent-tools"
import { resolveEnhancedUserContext } from "@/lib/ai/user-context"
import { validateAndAuthorizeToolCall } from "@/lib/ai/authorize"
import { getToolsForContext, getToolDefinition } from "@/lib/ai/tool-registry"
import { Permission } from "@prisma/client"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: { context: { role: string; companyId?: string; companyRole?: string; permissions: Permission[] } }): string {
    const c = ctx.context
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

    if (c.role === "STUDENT") {
        base += `
STUDENT CAPABILITIES:
- Search & browse internships (filters: keyword, location, paid/unpaid)
- Get full internship details
- Apply to an internship (with optional cover letter)
- Generate an AI-written cover letter for a specific internship
- List my applications & their statuses
- Withdraw a pending application
- View & update my portfolio (headline, bio, skills, interests, links)
- Get personalised internship recommendations based on my skills
- Save / unsave internships
- List saved internships
- View & reply to messages
- View upcoming interviews
- View assignments
- View notifications
`
    } else if (c.companyId) {
        const role = c.companyRole ?? "member"
        const perms = c.permissions.map((p: Permission) => String(p).replace(/_/g, " ").toLowerCase())
        base += `
COMPANY CAPABILITIES (role: ${role}):
Permissions: ${perms.join(", ") || "none"}

- List our internship postings
- View full internship details
- Create a new internship posting (if permitted)
- Update an existing internship posting (if permitted)
- List received applications (filter by internship or status)
- View full application details including student profile
- Accept / reject an application (if permitted)
- Schedule an interview (if permitted)
- Search student candidates by skills / query (if permitted)
- View & reply to messages
- View assignments
`
    }

    return base
}

// ─── Event helpers ────────────────────────────────────────────────────────────

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
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body: ReqBody = await req.json()
    const { message, conversationHistory = [] } = body

    const ctxResult = await resolveEnhancedUserContext(userId)
    if (!ctxResult.success) return NextResponse.json({ error: ctxResult.message }, { status: 403 })
    const ctx = ctxResult.context

    const tools = getToolsForContext({ userType: ctx.role, permissions: ctx.permissions })
    const systemPrompt = buildSystemPrompt(ctxResult)

    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = conversationHistory
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }))

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                    { role: "system", content: systemPrompt },
                    ...historyMessages,
                    { role: "user", content: message }
                ]

                let continueLoop = true
                const MAX_TOOL_ROUNDS = 6

                for (let round = 0; round < MAX_TOOL_ROUNDS && continueLoop; round++) {
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4o",
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
                            const toolName = tc.function.name
                            const toolDef = getToolDefinition(toolName)
                            const args = JSON.parse(tc.function.arguments || "{}")

                            controller.enqueue(encodeEvent({
                                type: "tool_start",
                                toolName,
                                toolTitle: toolDef?.description?.split(".")[0] ?? toolName.replace(/_/g, " ")
                            }))

                            const authResult = await validateAndAuthorizeToolCall(toolName, args, ctx)
                            let toolResult: ToolResult

                            if (authResult.denied) {
                                toolResult = {
                                    success: false,
                                    cardType: "error",
                                    title: "Permission denied",
                                    data: null,
                                    error: authResult.message
                                }
                            } else {
                                try {
                                    toolResult = await executeTool(toolName, args, {
                                        userId: ctx.userId,
                                        companyId: ctx.companyId ?? null,
                                        permissions: ctx.permissions,
                                        role: ctx.role,
                                        isCompanyOwner: ctx.isCompanyOwner,
                                    })
                                } catch (err) {
                                    toolResult = {
                                        success: false,
                                        cardType: "error",
                                        title: `Error running ${toolName}`,
                                        data: null,
                                        error: err instanceof Error ? err.message : "Unknown error"
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
                                    error: toolResult.error
                                })
                            })
                        }

                        messages.push(...toolResultMessages)
                    } else {
                        const raw = choice.message.content ?? ""
                        const suggestMatch = raw.match(/<suggestions>\s*(\[[\s\S]*?\])\s*<\/suggestions>/)
                        const reply = raw.replace(/<suggestions>[\s\S]*?<\/suggestions>/g, "").trim()
                        let suggestions: string[] = []
                        if (suggestMatch) {
                            try { suggestions = JSON.parse(suggestMatch[1]) } catch { /* ignore */ }
                        }
                        controller.enqueue(encodeEvent({ type: "reply", reply, suggestions }))
                        continueLoop = false
                    }
                }
            } catch (err) {
                controller.enqueue(encodeEvent({
                    type: "error",
                    error: err instanceof Error ? err.message : "Internal error"
                }))
            } finally {
                controller.close()
            }
        }
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
        }
    })
}
```

---

### STEP 2 — Replace `components/ai-agent-view.tsx`

Full rewrite — consumes the NDJSON stream, shows a live tool-call status bar, renders suggestion chips after each Linky reply, adds a copy button on hover, and passes an `onAction` callback into `AgentActionCard` so inline buttons can fire follow-up prompts.

```tsx
"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Send, Sparkles, Plus, Search, FileText, Briefcase,
    BookOpen, Users, Calendar, MessageSquare, Bookmark,
    BarChart3, Loader2, ChevronDown, History, Trash2,
    X, Copy, Check, Zap,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAIMode } from "@/lib/ai-mode-context"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { AgentActionCard } from "@/components/agent-action-card"
import { ClerkIdentityBadge, ClerkUserAvatar } from "@/components/clerk-identity-badge"
import { toast } from "sonner"

interface ToolResultItem {
    tool: string; cardType: string; title: string; data: unknown; success?: boolean; error?: string
}
interface StreamEvent {
    type: "tool_start" | "tool_end" | "reply" | "error"
    toolName?: string; toolTitle?: string; result?: ToolResultItem
    reply?: string; suggestions?: string[]; error?: string
}
interface AIAgentViewProps { userType: "Student" | "Company" }

const STUDENT_QUICK_ACTIONS = [
    { icon: Search,        label: "Find internships",    prompt: "Show me available internships that match my skills" },
    { icon: Sparkles,      label: "Recommendations",     prompt: "What internships would you recommend for me based on my portfolio?" },
    { icon: FileText,      label: "My portfolio",        prompt: "Show me my portfolio" },
    { icon: Briefcase,     label: "My applications",     prompt: "Show me all my applications and their statuses" },
    { icon: BarChart3,     label: "Dashboard overview",  prompt: "Give me a full dashboard overview" },
    { icon: Calendar,      label: "Interviews",          prompt: "Show my upcoming interviews" },
    { icon: Bookmark,      label: "Saved internships",   prompt: "Show my saved internships" },
    { icon: MessageSquare, label: "Messages",            prompt: "Show my recent conversations" },
    { icon: BookOpen,      label: "Assignments",         prompt: "Show my pending assignments" },
]
const COMPANY_QUICK_ACTIONS = [
    { icon: Briefcase,     label: "Our internships",     prompt: "Show all our internship postings" },
    { icon: Plus,          label: "Create internship",   prompt: "Help me create a new internship posting step by step" },
    { icon: FileText,      label: "Applications",        prompt: "Show all received applications" },
    { icon: Users,         label: "Search candidates",   prompt: "Help me search for talented candidates" },
    { icon: Calendar,      label: "Interviews",          prompt: "Show all scheduled interviews" },
    { icon: BarChart3,     label: "Dashboard overview",  prompt: "Show our company dashboard overview" },
    { icon: MessageSquare, label: "Messages",            prompt: "Show our conversations" },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolCallBar({ toolTitle }: { toolTitle: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/8 border border-violet-500/20 text-xs text-violet-600 dark:text-violet-400 w-fit">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{toolTitle}…</span>
        </motion.div>
    )
}

function SuggestionChips({ suggestions, onSelect }: { suggestions: string[]; onSelect: (s: string) => void }) {
    if (!suggestions?.length) return null
    return (
        <div className="flex flex-wrap gap-1.5 mt-2 pl-9">
            {suggestions.map((s, i) => (
                <button key={i} onClick={() => onSelect(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 hover:bg-violet-500/15 transition-colors">
                    {s}
                </button>
            ))}
        </div>
    )
}

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-foreground shrink-0 mt-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIAgentView({ userType }: AIAgentViewProps) {
    const { messages, addMessage, isLoading, setIsLoading, sessions, startNewSession, loadSession, deleteSession, sendWelcomeMessage, toggleAIMode } = useAIMode()
    const [input, setInput] = useState("")
    const [showHistory, setShowHistory] = useState(false)
    const [showScrollDown, setShowScrollDown] = useState(false)
    const [activeToolTitle, setActiveToolTitle] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const ut = userType.toLowerCase() as "student" | "company"
    const quickActions = userType === "Student" ? STUDENT_QUICK_ACTIONS : COMPANY_QUICK_ACTIONS

    useEffect(() => { sendWelcomeMessage(ut) }, [sendWelcomeMessage, ut])
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading])

    const sendMessage = useCallback(async (text: string) => {
        addMessage({ role: "user", content: text })
        setIsLoading(true)
        setActiveToolTitle(null)

        try {
            const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))
            const res = await fetch("/api/assistant/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, conversationHistory: history, userType: ut })
            })
            if (!res.ok || !res.body) throw new Error("Request failed")

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""
            const collectedToolResults: ToolResultItem[] = []
            let finalReply = ""
            let finalSuggestions: string[] = []

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() ?? ""

                for (const line of lines) {
                    if (!line.trim()) continue
                    try {
                        const ev: StreamEvent = JSON.parse(line)
                        if (ev.type === "tool_start") setActiveToolTitle(ev.toolTitle ?? ev.toolName ?? "Working")
                        if (ev.type === "tool_end" && ev.result) { collectedToolResults.push(ev.result); setActiveToolTitle(null) }
                        if (ev.type === "reply") { finalReply = ev.reply ?? ""; finalSuggestions = ev.suggestions ?? [] }
                        if (ev.type === "error") toast.error(ev.error ?? "Agent error")
                    } catch { /* skip malformed lines */ }
                }
            }

            addMessage({
                role: "assistant",
                content: finalReply || "Done.",
                metadata: {
                    type: "agent-response",
                    toolResults: collectedToolResults,
                    suggestions: finalSuggestions as unknown as undefined,
                }
            })
        } catch (err) {
            console.error(err)
            addMessage({ role: "assistant", content: "Sorry, something went wrong. Please try again." })
        } finally {
            setIsLoading(false)
            setActiveToolTitle(null)
        }
    }, [messages, addMessage, setIsLoading, ut])

    const handleSend = useCallback(() => {
        const t = input.trim()
        if (!t || isLoading) return
        setInput("")
        sendMessage(t)
    }, [input, isLoading, sendMessage])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
        if (e.key === "Escape") toggleAIMode()
    }

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto"
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
        }
    }, [input])

    const relevantSessions = sessions.filter(s => s.userType === ut)
    const hasMessages = messages.length > 1

    return (
        <div className="relative flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">

            {/* History Sidebar */}
            <AnimatePresence>
                {showHistory && (
                    <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 272, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="flex-shrink-0 overflow-hidden border-r border-border/40">
                        <div className="flex h-full w-[272px] flex-col bg-muted/20">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistory(false)}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs text-violet-600"
                                        onClick={() => { startNewSession(ut); setShowHistory(false) }}>
                                        <Plus className="h-3.5 w-3.5" /> New chat
                                    </Button>
                                    {relevantSessions.map(s => (
                                        <div key={s.id} className="group flex items-center gap-1">
                                            <button onClick={() => { loadSession(s.id); setShowHistory(false) }}
                                                className="flex-1 text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors truncate">
                                                <MessageSquare className="h-3 w-3 inline mr-1.5" />{s.name}
                                            </button>
                                            <button onClick={() => deleteSession(s.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Area */}
            <div className="flex flex-1 flex-col min-w-0">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setShowHistory(!showHistory)}>
                            <History className="h-4 w-4" />
                        </Button>
                        <Image src="/linky-mascot.png" alt="Linky" width={24} height={24} className="rounded-full" />
                        <div>
                            <p className="text-sm font-semibold leading-none">Linky</p>
                            <p className="text-[10px] text-muted-foreground">AI Agent · {userType}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-violet-600 border-violet-500/30 bg-violet-500/5">
                            <Zap className="h-2.5 w-2.5 mr-1" /> Live
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <ClerkIdentityBadge />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startNewSession(ut)}><Plus className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleAIMode}><X className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollContainerRef} onScroll={() => {
                    const el = scrollContainerRef.current
                    if (el) setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 100)
                }} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-border">

                    {!hasMessages && (
                        <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
                            <Image src="/linky-mascot.png" alt="Linky" width={72} height={72} className="opacity-90" />
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">Hi, I&apos;m Linky 👋</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    I can search internships, update your portfolio, manage applications and more — just ask!
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-lg">
                                {quickActions.slice(0, 6).map((a, i) => (
                                    <button key={i} onClick={() => sendMessage(a.prompt)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-card/80 hover:bg-muted/50 hover:border-violet-500/30 text-xs text-left transition-all group">
                                        <a.icon className="h-3.5 w-3.5 text-violet-500 shrink-0 group-hover:scale-110 transition-transform" />
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("group", msg.role === "user" ? "flex justify-end" : "flex justify-start")}>
                            {msg.role === "assistant" && (
                                <div className="flex gap-2 max-w-[85%] flex-col">
                                    <div className="flex gap-2 items-start">
                                        <Image src="/linky-mascot.png" alt="Linky" width={28} height={28} className="rounded-full mt-0.5 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            {msg.metadata?.toolResults && (msg.metadata.toolResults as ToolResultItem[]).length > 0 && (
                                                <div className="space-y-2">
                                                    {(msg.metadata.toolResults as ToolResultItem[]).map((tr, ti) => (
                                                        <AgentActionCard key={ti} result={tr} onAction={sendMessage} />
                                                    ))}
                                                </div>
                                            )}
                                            {msg.content && (
                                                <div className="flex items-start gap-1">
                                                    <div className="rounded-2xl rounded-tl-sm px-3 py-2 bg-muted/50 border border-border/40 text-sm">
                                                        <MarkdownRenderer content={msg.content} />
                                                    </div>
                                                    <CopyBtn text={msg.content} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <SuggestionChips
                                        suggestions={(msg.metadata as { suggestions?: string[] })?.suggestions ?? []}
                                        onSelect={sendMessage}
                                    />
                                </div>
                            )}
                            {msg.role === "user" && (
                                <div className="flex items-end gap-2 max-w-[85%]">
                                    <div className="rounded-2xl rounded-br-sm px-3 py-2 bg-violet-600 text-white text-sm">{msg.content}</div>
                                    <ClerkUserAvatar size={28} />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Live tool-call bar */}
                    <AnimatePresence>
                        {isLoading && activeToolTitle && (
                            <div className="flex gap-2 items-start pl-2">
                                <Image src="/linky-mascot.png" alt="Linky" width={28} height={28} className="rounded-full shrink-0" />
                                <ToolCallBar toolTitle={activeToolTitle} />
                            </div>
                        )}
                        {isLoading && !activeToolTitle && (
                            <div className="flex gap-2 items-center pl-11 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                            </div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll-to-bottom */}
                <AnimatePresence>
                    {showScrollDown && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                            className="absolute bottom-24 right-6 p-2 rounded-full shadow-lg bg-background border border-border/60 text-muted-foreground hover:text-foreground">
                            <ChevronDown className="h-4 w-4" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Input */}
                <div className="border-t border-border/40 bg-background/80 backdrop-blur-sm px-4 py-3">
                    {hasMessages && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {quickActions.slice(0, 4).map((a, i) => (
                                <button key={i} onClick={() => sendMessage(a.prompt)} disabled={isLoading}
                                    className="text-[11px] px-2.5 py-1 rounded-full border border-border/40 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2 items-end">
                        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                            placeholder="Ask Linky anything…" rows={1} disabled={isLoading}
                            className="flex-1 resize-none rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50 min-h-[40px] max-h-[120px] scrollbar-thin" />
                        <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon"
                            className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shrink-0">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                        Enter to send · Shift+Enter for newline · Esc to close
                    </p>
                </div>
            </div>
        </div>
    )
}
```

---

### STEP 3 — Update `AgentActionCard` — add `onAction` prop + 3 new card types

**In `components/agent-action-card.tsx`:**

1. Update the props interface and dispatcher:

```tsx
// Change AgentActionCardProps:
interface AgentActionCardProps {
    result: ToolResult
    onAction?: (prompt: string) => void   // NEW
}

// Update the switch dispatcher to pass onAction:
export function AgentActionCard({ result, onAction }: AgentActionCardProps) {
    const { cardType, title, data, error } = result
    if (error && !result.success) return <ErrorCard title={title} error={error} />
    switch (cardType) {
        case "internship-list":      return <InternshipListCard title={title} items={data as InternshipItem[]} onAction={onAction} />
        case "internship-detail":    return <InternshipDetailCard data={data as InternshipDetail} onAction={onAction} />
        case "application-list":     return <ApplicationListCard title={title} items={data as ApplicationItem[]} onAction={onAction} />
        case "candidate-list":       return <CandidateListCard title={title} items={data as CandidateItem[]} onAction={onAction} />
        case "interview-list":       return <InterviewListCard title={title} items={data as InterviewItem[]} />
        case "conversation-list":    return <ConversationListCard title={title} items={data as ConversationItem[]} />
        case "assignment-list":      return <AssignmentListCard title={title} items={data as AssignmentItem[]} />
        case "portfolio-view":       return <PortfolioCard data={data as PortfolioData} onAction={onAction} />
        case "stats":                return <StatsCard title={title} data={data as Record<string, number | string>} />
        case "action-success":       return <SuccessCard title={title} data={data as Record<string, unknown>} />
        case "cover-letter":         return <CoverLetterCard data={data as CoverLetterData} onAction={onAction} />
        case "notification-list":    return <NotificationListCard title={title} items={data as NotificationItem[]} />
        case "application-detail":   return <ApplicationDetailCard data={data as ApplicationDetailData} onAction={onAction} />
        case "error":                return <ErrorCard title={title} error={error || "Unknown error"} />
        default:                     return null
    }
}
```

2. Add inline action buttons to `InternshipListCard` rows (add just before closing `</div>` of each row):

```tsx
// At the bottom of each row inside InternshipListCard, after item.description block:
{onAction && (
    <div className="flex gap-1.5 mt-1.5 flex-wrap">
        <button onClick={() => onAction(`Apply to internship ${item.id}`)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
            Apply
        </button>
        <button onClick={() => onAction(`Save internship ${item.id}`)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/30 hover:bg-muted transition-colors">
            Save
        </button>
        <button onClick={() => onAction(`Tell me more about internship ${item.id} at ${item.company}`)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/30 hover:bg-muted transition-colors">
            Details
        </button>
        <button onClick={() => onAction(`Generate a cover letter for internship ${item.id}`)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            Cover letter
        </button>
    </div>
)}
```

3. Add the three new card components at the bottom of the file:

```tsx
// ─── Cover Letter Card ───────────────────────────────────────────────────────

interface CoverLetterData { internshipId: string; internshipTitle: string; company: string; letter: string }

function CoverLetterCard({ data, onAction }: { data: CoverLetterData; onAction?: (p: string) => void }) {
    const [copied, setCopied] = useState(false)
    return (
        <CardWrapper>
            <CardTitle icon={FileText} title={`Cover Letter — ${data.internshipTitle}`} />
            <div className="p-3 space-y-2">
                <p className="text-[11px] text-muted-foreground">{data.company}</p>
                <div className="rounded-lg bg-muted/40 border border-border/30 p-2.5 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {data.letter}
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { navigator.clipboard.writeText(data.letter); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 hover:bg-violet-500/20 transition-colors flex items-center gap-1">
                        {copied ? <><CheckCircle2 className="h-3 w-3" /> Copied</> : <><FileText className="h-3 w-3" /> Copy</>}
                    </button>
                    {onAction && (
                        <button onClick={() => onAction(`Apply to internship ${data.internshipId} with cover letter: ${data.letter.slice(0, 300)}`)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                            Apply with this letter
                        </button>
                    )}
                </div>
            </div>
        </CardWrapper>
    )
}

// ─── Notification List Card ──────────────────────────────────────────────────

interface NotificationItem { id: string; type: string; message: string; read: boolean; createdAt: string }

function NotificationListCard({ title, items }: { title: string; items: NotificationItem[] }) {
    if (!items?.length) return <EmptyCard icon={MessageSquare} message="No notifications" />
    const unread = items.filter(n => !n.read).length
    return (
        <CardWrapper>
            <CardTitle icon={MessageSquare} title={title} badge={unread > 0 ? `${unread} unread` : undefined} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 10).map(n => (
                    <div key={n.id} className={cn("px-3 py-2", !n.read && "bg-violet-500/3")}>
                        <div className="flex items-start gap-2">
                            {!n.read && <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />}
                            <div className={cn("flex-1", n.read && "pl-3.5")}>
                                <p className="text-xs">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </CardWrapper>
    )
}

// ─── Application Detail Card ─────────────────────────────────────────────────

interface ApplicationDetailData {
    id: string; status: string; coverLetter?: string; appliedAt: string
    student: { name?: string; email?: string; headline?: string; skills?: string; bio?: string }
}

function ApplicationDetailCard({ data, onAction }: { data: ApplicationDetailData; onAction?: (p: string) => void }) {
    return (
        <CardWrapper>
            <CardTitle icon={User} title={data.student.name ?? "Applicant"} badge={data.status} />
            <div className="p-3 space-y-2">
                {data.student.email && <p className="text-xs text-muted-foreground">{data.student.email}</p>}
                {data.student.headline && <p className="text-xs font-medium">{data.student.headline}</p>}
                {data.student.skills && (
                    <div className="flex flex-wrap gap-1">
                        {data.student.skills.split(",").slice(0, 6).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{s.trim()}</Badge>
                        ))}
                    </div>
                )}
                {data.coverLetter && (
                    <div className="rounded-lg bg-muted/40 border border-border/30 p-2 text-xs max-h-24 overflow-y-auto">
                        {data.coverLetter}
                    </div>
                )}
                {onAction && data.status === "PENDING" && (
                    <div className="flex gap-2">
                        <button onClick={() => onAction(`Approve application ${data.id}`)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                            Approve
                        </button>
                        <button onClick={() => onAction(`Reject application ${data.id}`)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
                            Reject
                        </button>
                        <button onClick={() => onAction(`Schedule interview for application ${data.id}`)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                            Schedule interview
                        </button>
                    </div>
                )}
            </div>
        </CardWrapper>
    )
}
```

---

### STEP 4 — Add 8 new tools to `lib/agent-tools.ts`

#### 4a — Add tool definitions

Add to `STUDENT_ONLY_TOOLS`:

```typescript
{
    type: "function",
    function: {
        name: "generate_cover_letter",
        description: "Generate a personalised AI cover letter for a specific internship based on the student's portfolio. Use when the student asks for help writing a cover letter.",
        parameters: {
            type: "object",
            properties: {
                internshipId: { type: "string", description: "The internship ID to generate the cover letter for" }
            },
            required: ["internshipId"]
        }
    }
},
{
    type: "function",
    function: {
        name: "get_internship_recommendations",
        description: "Get personalised internship recommendations ranked by match to the student's skills and interests. Use when the student asks what to apply to or wants recommendations.",
        parameters: {
            type: "object",
            properties: {
                limit: { type: "number", description: "How many recommendations to return (default 5, max 10)" }
            }
        }
    }
},
{
    type: "function",
    function: {
        name: "withdraw_application",
        description: "Withdraw (cancel) a pending application. Only works for PENDING applications.",
        parameters: {
            type: "object",
            properties: {
                applicationId: { type: "string", description: "The application ID to withdraw" }
            },
            required: ["applicationId"]
        }
    }
},
```

Add to `COMPANY_ONLY_TOOLS`:

```typescript
{
    type: "function",
    function: {
        name: "update_internship",
        description: "Update an existing internship posting. Only include fields that need changing.",
        parameters: {
            type: "object",
            properties: {
                internshipId: { type: "string", description: "The internship ID to update" },
                title: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
                paid: { type: "boolean" },
                salary: { type: "number" },
                qualifications: { type: "string" },
                applicationEnd: { type: "string", description: "New deadline YYYY-MM-DD" }
            },
            required: ["internshipId"]
        }
    }
},
{
    type: "function",
    function: {
        name: "get_application_details",
        description: "Get full details of a specific application including student profile and cover letter. Use when the company wants to review a specific applicant in depth.",
        parameters: {
            type: "object",
            properties: {
                applicationId: { type: "string", description: "The application ID" }
            },
            required: ["applicationId"]
        }
    }
},
```

Add to `COMMON_TOOLS`:

```typescript
{
    type: "function",
    function: {
        name: "list_notifications",
        description: "List the user's recent notifications (unread first). Use when the user asks about notifications or what's new.",
        parameters: {
            type: "object",
            properties: {
                unreadOnly: { type: "boolean", description: "true to return only unread notifications" }
            }
        }
    }
},
{
    type: "function",
    function: {
        name: "mark_notifications_read",
        description: "Mark all notifications as read. Use when the user wants to clear notifications.",
        parameters: { type: "object", properties: {}, required: [] }
    }
},
{
    type: "function",
    function: {
        name: "start_conversation",
        description: "Start a new message conversation with another user. Use when a student wants to message a company or vice versa.",
        parameters: {
            type: "object",
            properties: {
                recipientUserId: { type: "string", description: "The user ID to start the conversation with" },
                initialMessage: { type: "string", description: "The first message to send" }
            },
            required: ["recipientUserId", "initialMessage"]
        }
    }
},
```

#### 4b — Add executeTool switch cases

Add these cases inside the `switch (toolName)` block in the `executeTool` function:

```typescript
case "generate_cover_letter": {
    const { internshipId } = args as { internshipId: string }
    const [internship, student] = await Promise.all([
        prisma.internship.findUnique({
            where: { id: internshipId },
            select: { title: true, description: true, qualifications: true, company: { select: { name: true } } }
        }),
        prisma.student.findUnique({
            where: { userId: ctx.userId },
            select: { fullName: true, bio: true, skills: true, experience: true }
        })
    ])
    if (!internship || !student) return { success: false, cardType: "error", title: "Not found", data: null, error: "Internship or student profile not found" }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
            role: "user",
            content: `Write a concise, compelling cover letter (max 200 words) for ${student.fullName ?? "this student"} applying to "${internship.title}" at ${internship.company?.name ?? "this company"}.

Student bio: ${student.bio ?? "N/A"}
Skills: ${student.skills ?? "N/A"}
Experience: ${student.experience ?? "N/A"}
Job description: ${internship.description?.slice(0, 400) ?? "N/A"}
Requirements: ${internship.qualifications?.slice(0, 300) ?? "N/A"}

Be specific, professional, enthusiastic. No placeholders.`
        }],
        max_tokens: 400,
        temperature: 0.6
    })
    const letter = completion.choices[0].message.content ?? ""
    return {
        success: true,
        cardType: "cover-letter",
        title: `Cover Letter for ${internship.title}`,
        data: { internshipId, internshipTitle: internship.title, company: internship.company?.name, letter }
    }
}

case "get_internship_recommendations": {
    const { limit = 5 } = args as { limit?: number }
    const student = await prisma.student.findUnique({
        where: { userId: ctx.userId },
        select: { skills: true, interests: true }
    })
    const skillsArr = (student?.skills ?? "").split(",").map((s: string) => s.trim()).filter(Boolean)
    const internships = await prisma.internship.findMany({
        where: {
            applicationStatus: "OPEN",
            ...(skillsArr.length > 0 ? {
                OR: skillsArr.slice(0, 5).map((sk: string) => ({
                    OR: [
                        { qualifications: { contains: sk, mode: "insensitive" as const } },
                        { description: { contains: sk, mode: "insensitive" as const } }
                    ]
                }))
            } : {})
        },
        take: Math.min(limit, 10),
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, location: true, paid: true, salary: true, company: { select: { name: true } } }
    })
    return {
        success: true,
        cardType: "internship-list",
        title: `Top ${internships.length} Recommendations for You`,
        data: internships.map((i) => ({
            id: i.id, title: i.title, company: i.company?.name ?? "", location: i.location, paid: i.paid, salary: i.salary
        }))
    }
}

case "withdraw_application": {
    const { applicationId } = args as { applicationId: string }
    const application = await prisma.application.findFirst({
        where: { id: applicationId, studentId: ctx.userId, status: "PENDING" }
    })
    if (!application) return { success: false, cardType: "error", title: "Cannot withdraw", data: null, error: "Application not found or not in PENDING status" }
    await prisma.application.delete({ where: { id: applicationId } })
    return { success: true, cardType: "action-success", title: "Application withdrawn", data: { applicationId, message: "Your application has been withdrawn." } }
}

case "update_internship": {
    const { internshipId, ...updates } = args as { internshipId: string; [key: string]: unknown }
    const ok = await checkPermission(ctx.userId, Permission.MANAGE_INTERNSHIPS)
    if (!ok) return { success: false, cardType: "error", title: "Permission denied", data: null, error: "MANAGE_INTERNSHIPS permission required" }
    const updated = await prisma.internship.update({
        where: { id: internshipId, companyId: ctx.companyId ?? undefined },
        data: updates as Record<string, unknown>
    })
    return { success: true, cardType: "action-success", title: "Internship updated", data: { id: updated.id, title: updated.title } }
}

case "get_application_details": {
    const { applicationId } = args as { applicationId: string }
    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            student: { select: { fullName: true, headline: true, skills: true, bio: true, user: { select: { email: true } } } },
            internship: { select: { title: true, companyId: true } }
        }
    })
    if (!app || app.internship?.companyId !== ctx.companyId) {
        return { success: false, cardType: "error", title: "Not found", data: null, error: "Application not found" }
    }
    return {
        success: true,
        cardType: "application-detail",
        title: `Application — ${app.internship?.title ?? ""}`,
        data: {
            id: app.id, status: app.status, coverLetter: app.coverLetter, appliedAt: app.createdAt,
            student: {
                name: app.student?.fullName, email: app.student?.user?.email,
                headline: app.student?.headline, skills: app.student?.skills, bio: app.student?.bio
            }
        }
    }
}

case "list_notifications": {
    const { unreadOnly = false } = args as { unreadOnly?: boolean }
    const notifications = await prisma.notification.findMany({
        where: { userId: ctx.userId, ...(unreadOnly ? { read: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, type: true, message: true, read: true, createdAt: true }
    })
    return {
        success: true,
        cardType: "notification-list",
        title: unreadOnly ? "Unread Notifications" : "Recent Notifications",
        data: notifications
    }
}

case "mark_notifications_read": {
    await prisma.notification.updateMany({
        where: { userId: ctx.userId, read: false },
        data: { read: true }
    })
    return { success: true, cardType: "action-success", title: "Notifications cleared", data: { message: "All notifications marked as read." } }
}

case "start_conversation": {
    const { recipientUserId, initialMessage } = args as { recipientUserId: string; initialMessage: string }
    const existing = await prisma.conversation.findFirst({
        where: { participants: { every: { userId: { in: [ctx.userId, recipientUserId] } } } }
    })
    const conv = existing ?? await prisma.conversation.create({
        data: { participants: { create: [{ userId: ctx.userId }, { userId: recipientUserId }] } }
    })
    await prisma.message.create({
        data: { conversationId: conv.id, senderId: ctx.userId, content: initialMessage }
    })
    return { success: true, cardType: "action-success", title: "Message sent", data: { conversationId: conv.id, message: initialMessage } }
}
```

---

### STEP 5 — Add `suggestions` to `AIMessage` metadata in `lib/ai-mode-context.tsx`

Find the `AIMessage` interface and add one field:

```typescript
// BEFORE:
metadata?: {
    type?: "portfolio" | "match" | "question" | "search" | "agent-response"
    data?: unknown
    toolResults?: Array<{
        tool: string
        cardType: string
        title: string
        data: unknown
        success?: boolean
        error?: string
    }>
}

// AFTER:
metadata?: {
    type?: "portfolio" | "match" | "question" | "search" | "agent-response"
    data?: unknown
    toolResults?: Array<{
        tool: string
        cardType: string
        title: string
        data: unknown
        success?: boolean
        error?: string
    }>
    suggestions?: string[]   // ← follow-up suggestion chips
}
```

---

### Summary of all files to change

| File | What to do |
|---|---|
| `app/api/assistant/agent/route.ts` | **Full rewrite** — streaming NDJSON, improved system prompt with today's date + language |
| `components/ai-agent-view.tsx` | **Full rewrite** — stream consumer, tool-call bar, suggestion chips, copy button, quick-action chips in input |
| `components/agent-action-card.tsx` | Add `onAction` prop, inline action buttons on internship rows, add `CoverLetterCard`, `NotificationListCard`, `ApplicationDetailCard` |
| `lib/agent-tools.ts` | Add 8 new tool defs + their `executeTool` switch cases |
| `lib/ai/tool-registry.ts` | Add permission/scope entries for the 8 new tools (see patterns already in file) |
| `lib/ai-mode-context.tsx` | Add `suggestions?: string[]` to `AIMessage.metadata` |

> **No Prisma schema changes required. No new API routes needed.**
