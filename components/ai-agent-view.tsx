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

// ─── Types ──────────────────────────────────────────────────────────────────

interface ToolResultItem {
    tool: string; cardType: string; title: string; data: unknown; success?: boolean; error?: string
}
interface StreamEvent {
    type: "tool_start" | "tool_end" | "reply" | "error"
    toolName?: string; toolTitle?: string; result?: ToolResultItem
    reply?: string; suggestions?: string[]; error?: string
}
interface AIAgentViewProps { userType: "Student" | "Company" }

// ─── Quick Actions ──────────────────────────────────────────────────────────

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

// ─── Sub-components ─────────────────────────────────────────────────────────

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

// ─── Main Component ─────────────────────────────────────────────────────────

export function AIAgentView({ userType }: AIAgentViewProps) {
    const { messages, addMessage, isLoading, setIsLoading, sessions, startNewSession, loadSession, deleteSession, refreshSessions, currentSessionId, toggleAIMode } = useAIMode()
    const [input, setInput] = useState("")
    const [showHistory, setShowHistory] = useState(false)
    const [showScrollDown, setShowScrollDown] = useState(false)
    const [activeToolTitle, setActiveToolTitle] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const ut = userType.toLowerCase() as "student" | "company"
    const quickActions = userType === "Student" ? STUDENT_QUICK_ACTIONS : COMPANY_QUICK_ACTIONS

    // (Moved to after sendMessage declaration)
    
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading])

    // ─── Stream-based send ────────────────────────────────────────

    const sendMessage = useCallback(async (text: string, isSilent = false) => {
        if (!isSilent) {
            addMessage({ role: "user", content: text })
        }
        setIsLoading(true)
        setActiveToolTitle(null)

        try {
            const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))
            const res = await fetch("/api/assistant/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, conversationHistory: history, userType: ut, sessionId: currentSessionId })
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
                    suggestions: finalSuggestions,
                }
            })
        } catch (err) {
            console.error(err)
            addMessage({ role: "assistant", content: "Sorry, something went wrong. Please try again." })
            } finally {
                if (messages.length === 0) {
                    refreshSessions().catch(() => {})
                }
                setIsLoading(false)
                setActiveToolTitle(null)
            }
    }, [messages, addMessage, setIsLoading, ut, currentSessionId, refreshSessions])

    const triggeredSessions = useRef<Set<string>>(new Set())
    
    useEffect(() => { 
        if (messages.length === 0 && !triggeredSessions.current.has(currentSessionId) && !isLoading) {
            triggeredSessions.current.add(currentSessionId)
            sendMessage("Hello! Please review my memory block and give me a highly personalized greeting. If I am a COMPANY, give me a business greeting. If I am a STUDENT and my Confidence Score is below 100, tell me my exact score and immediately ask exactly 1 deep, thought-provoking question to uncover my potential and continue my profiling seamlessly! If my score is 100, just greet me normally.", true)
        }
    }, [messages.length, isLoading, currentSessionId, sendMessage])

    const handleSend = useCallback(() => {
        const t = input.trim()
        if (!t || isLoading) return
        setInput("")
        sendMessage(t, false)
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

    // ─── Render ─────────────────────────────────────────────────────

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
                             <ScrollArea className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                <div className="p-2 space-y-1">
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-[11px] text-violet-600 font-medium hover:bg-violet-500/10"
                                        onClick={() => { startNewSession(ut); setShowHistory(false) }}>
                                        <Plus className="h-3.5 w-3.5" /> New chat
                                    </Button>
                                    <div className="space-y-0.5">
                                        {relevantSessions.map(s => (
                                            <div key={s.id} className="group flex items-center gap-1 px-1">
                                                <button onClick={() => { loadSession(s.id); setShowHistory(false) }}
                                                    className={cn(
                                                        "flex-1 text-left px-2 py-1.5 rounded-md text-[11px] transition-colors truncate",
                                                        s.id === currentSessionId ? "bg-violet-500/10 text-violet-600 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                                    )}>
                                                    <MessageSquare className="h-3 w-3 inline mr-2 opacity-70" />{s.name}
                                                </button>
                                                <button onClick={() => deleteSession(s.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
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
                        <Image src="/Linky_head.png" alt="Linky" width={24} height={24} className="rounded-full" />
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
                            <Image src="/Linky_head.png" alt="Linky" width={72} height={72} className="opacity-90" />
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
                                        <Image src="/Linky_head.png" alt="Linky" width={28} height={28} className="rounded-full mt-0.5 shrink-0" />
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
                                <Image src="/Linky_head.png" alt="Linky" width={28} height={28} className="rounded-full shrink-0" />
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
