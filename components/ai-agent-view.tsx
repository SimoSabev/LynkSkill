"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Send,
    Sparkles,
    Plus,
    Search,
    FileText,
    Briefcase,
    BookOpen,
    Users,
    Calendar,
    MessageSquare,
    Bookmark,
    BarChart3,
    Loader2,
    ChevronDown,
    History,
    Trash2,
    X,
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface ToolResultItem {
    tool: string
    cardType: string
    title: string
    data: unknown
    success?: boolean
    error?: string
}

interface AIAgentViewProps {
    userType: "Student" | "Company"
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

const STUDENT_QUICK_ACTIONS = [
    { icon: Search, label: "Find internships", prompt: "Show me available internships" },
    { icon: FileText, label: "My portfolio", prompt: "Show me my portfolio" },
    { icon: Briefcase, label: "My applications", prompt: "Show me my applications" },
    { icon: BarChart3, label: "Dashboard stats", prompt: "Show my dashboard overview" },
    { icon: Calendar, label: "Interviews", prompt: "Show my upcoming interviews" },
    { icon: Bookmark, label: "Saved internships", prompt: "Show my saved internships" },
    { icon: MessageSquare, label: "Messages", prompt: "Show my conversations" },
    { icon: BookOpen, label: "Assignments", prompt: "Show my assignments" },
]

const COMPANY_QUICK_ACTIONS = [
    { icon: Briefcase, label: "Our internships", prompt: "Show our internship postings" },
    { icon: Plus, label: "Create internship", prompt: "Help me create a new internship posting" },
    { icon: FileText, label: "Applications", prompt: "Show received applications" },
    { icon: Users, label: "Search candidates", prompt: "Help me search for candidates" },
    { icon: Calendar, label: "Interviews", prompt: "Show scheduled interviews" },
    { icon: BarChart3, label: "Dashboard stats", prompt: "Show our dashboard overview" },
    { icon: MessageSquare, label: "Messages", prompt: "Show our conversations" },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function AIAgentView({ userType }: AIAgentViewProps) {
    const {
        messages, addMessage, isLoading, setIsLoading,
        sessions, startNewSession, loadSession, deleteSession,
        sendWelcomeMessage, currentSessionId, toggleAIMode
    } = useAIMode()

    const [input, setInput] = useState("")
    const [showHistory, setShowHistory] = useState(false)
    const [showScrollDown, setShowScrollDown] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const ut = userType.toLowerCase() as "student" | "company"
    const quickActions = userType === "Student" ? STUDENT_QUICK_ACTIONS : COMPANY_QUICK_ACTIONS
    const personaDescriptor = userType === "Student" ? "student journey" : "company workflow"

    // Send welcome message on mount
    useEffect(() => {
        sendWelcomeMessage(ut)
    }, [sendWelcomeMessage, ut])

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isLoading])

    // Track scroll position
    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current
        if (!el) return
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
        setShowScrollDown(!isNearBottom)
    }, [])

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    // ─── Send Message ─────────────────────────────────────────────

    const sendMessageToAgent = useCallback(async (text: string) => {
        addMessage({ role: "user", content: text })
        setIsLoading(true)

        try {
            const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))

            const res = await fetch("/api/assistant/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, conversationHistory: history, userType: ut })
            })

            if (!res.ok) throw new Error("Request failed")
            const data = await res.json()

            addMessage({
                role: "assistant",
                content: data.reply || "I couldn't process that request.",
                metadata: { type: "agent-response", toolResults: data.toolResults || [] }
            })
        } catch {
            addMessage({
                role: "assistant",
                content: "Sorry, something went wrong. Please try again.",
                metadata: { type: "agent-response" }
            })
        } finally {
            setIsLoading(false)
        }
    }, [messages, addMessage, setIsLoading, ut])

    const handleSend = useCallback(() => {
        const trimmed = input.trim()
        if (!trimmed || isLoading) return
        setInput("")
        sendMessageToAgent(trimmed)
    }, [input, isLoading, sendMessageToAgent])

    const handleQuickAction = useCallback((prompt: string) => {
        if (isLoading) return
        sendMessageToAgent(prompt)
    }, [isLoading, sendMessageToAgent])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
        if (e.key === "Escape") {
            toggleAIMode()
        }
    }

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto"
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
        }
    }, [input])

    const hasMessages = messages.length > 1

    // ─── Render ───────────────────────────────────────────────────

    return (
        <div className="relative flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">

            {/* ── History Sidebar ── */}
            <AnimatePresence>
                {showHistory && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 272, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-shrink-0 overflow-hidden border-r border-border/40"
                    >
                        <div className="flex h-full w-[272px] flex-col bg-muted/20">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setShowHistory(false)}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="p-2.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2 text-xs h-8 rounded-lg border-dashed border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/5 hover:border-violet-500/50"
                                    onClick={() => startNewSession(ut)}
                                >
                                    <Plus className="h-3 w-3" />
                                    New conversation
                                </Button>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="px-2.5 pb-2 space-y-0.5">
                                    {sessions.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground/60 text-center py-8">No previous chats</p>
                                    ) : (
                                        sessions.map(s => (
                                            <div
                                                key={s.id}
                                                className={cn(
                                                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-all duration-150",
                                                    s.id === currentSessionId
                                                        ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                                                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                                                )}
                                                onClick={() => loadSession(s.id)}
                                            >
                                                <MessageSquare className="h-3 w-3 flex-shrink-0 opacity-60" />
                                                <span className="flex-1 truncate">{s.name}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                                >
                                                    <Trash2 className="h-3 w-3 text-muted-foreground/60 hover:text-destructive" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ── Main Chat ── */}
            <div className="flex flex-1 flex-col min-w-0">

                {/* ── Header ── */}
                <header className="flex flex-col gap-3 px-4 py-3 border-b border-border/40 bg-background/60 backdrop-blur-sm flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => setShowHistory(!showHistory)}
                            aria-label={showHistory ? "Hide chat history" : "Show chat history"}
                        >
                            <History className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative h-10 w-10 flex-shrink-0">
                                <Image
                                    src="/Linky_head.png"
                                    alt="Linky AI assistant"
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                    priority
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-base font-semibold leading-none">Linky AI</h1>
                                    <Badge className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 shadow-sm">
                                        <Sparkles className="h-3 w-3 mr-1" aria-hidden />
                                        AI Agent
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Guiding your {personaDescriptor}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <ClerkIdentityBadge
                            size="sm"
                            showSecondaryText={false}
                            className="w-full sm:w-auto"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                            onClick={toggleAIMode}
                        >
                            <X className="h-3.5 w-3.5" aria-hidden />
                            <span>Exit</span>
                        </Button>
                    </div>
                </header>

                {/* ── Chat Body ── */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto overscroll-contain scroll-smooth"
                    onScroll={handleScroll}
                >
                    {!hasMessages ? (
                        /* ── Welcome State ── */
                        <div className="flex flex-col items-center justify-center h-full px-4">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="text-center max-w-md"
                            >
                                <div className="relative mx-auto mb-5 h-20 w-20">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 blur-xl" />
                                    <Image
                                        src="/Linky_head.png"
                                        alt="Linky"
                                        width={80}
                                        height={80}
                                        className="relative rounded-full ring-2 ring-violet-500/20"
                                    />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {userType === "Student" ? "Hey there! 👋" : "Welcome back! 👋"}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
                                    {userType === "Student"
                                        ? "I'm Linky, your AI career assistant. Find internships, manage your portfolio, track applications — all through conversation."
                                        : "I'm Linky, your AI talent assistant. Post internships, review applications, find candidates — all through conversation."}
                                </p>
                            </motion.div>

                            {/* Quick Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.5 }}
                                className="mt-8 w-full max-w-xl"
                            >
                                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 text-center mb-3">Quick actions</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {quickActions.map((action, i) => (
                                        <motion.button
                                            key={action.label}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 + i * 0.03 }}
                                            onClick={() => handleQuickAction(action.prompt)}
                                            className={cn(
                                                "group flex flex-col items-center gap-2 p-3 rounded-xl",
                                                "bg-card/60 border border-border/40",
                                                "hover:border-violet-500/30 hover:bg-violet-500/5 hover:shadow-sm",
                                                "transition-all duration-200 text-center"
                                            )}
                                            aria-label={action.label}
                                        >
                                            <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                                                <action.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground leading-tight">{action.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        /* ── Messages ── */
                        <div
                            className="max-w-3xl mx-auto px-4 py-5 space-y-5"
                            role="log"
                            aria-live="polite"
                            aria-label="Conversation with Linky AI"
                        >
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                                    >
                                        {/* Assistant avatar */}
                                        {msg.role === "assistant" && (
                                            <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 mt-1 ring-1 ring-border/50">
                                                <Image src="/Linky_head.png" alt="Linky" width={28} height={28} />
                                            </div>
                                        )}

                                        <div className={cn("min-w-0", msg.role === "user" ? "max-w-[80%]" : "max-w-[88%]")}>
                                            {/* Bubble */}
                                            <div className={cn(
                                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                                msg.role === "user"
                                                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm shadow-sm"
                                                    : "bg-card border border-border/40 rounded-bl-sm"
                                            )}>
                                                {msg.role === "assistant" ? (
                                                    <MarkdownRenderer content={msg.content} className="text-sm" />
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                )}
                                            </div>

                                            {/* Tool Result Cards */}
                                            {msg.metadata?.toolResults && msg.metadata.toolResults.length > 0 && (
                                                <div className="mt-2.5 space-y-2">
                                                    {(msg.metadata.toolResults as ToolResultItem[]).map((result, idx) => (
                                                        <AgentActionCard key={`${msg.id}-tool-${idx}`} result={result} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* User avatar */}
                                        {msg.role === "user" && (
                                            <ClerkUserAvatar
                                                size="xs"
                                                className="mt-1 shadow-sm"
                                                ariaLabel="Your avatar"
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Typing indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-2.5"
                                >
                                    <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 mt-1 ring-1 ring-border/50">
                                        <Image src="/Linky_head.png" alt="Linky" width={28} height={28} />
                                    </div>
                                    <div className="bg-card border border-border/40 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                                        <span className="text-sm text-muted-foreground">Thinking…</span>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} className="h-1" />
                        </div>
                    )}
                </div>

                {/* Scroll-to-bottom */}
                <AnimatePresence>
                    {showScrollDown && hasMessages && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute bottom-[5.5rem] left-1/2 -translate-x-1/2 z-10"
                        >
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-lg border border-border/50"
                                onClick={scrollToBottom}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Input Bar ── */}
                <div className="flex-shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-sm px-4 py-3">
                    <div className="max-w-3xl mx-auto flex items-end gap-2">
                        <div className="relative flex-1 min-w-0">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isLoading ? "Linky is thinking…" : "Message Linky…"}
                                rows={1}
                                disabled={isLoading}
                                className={cn(
                                    "w-full resize-none rounded-xl bg-muted/50 px-4 py-2.5 pr-11 text-sm",
                                    "border border-border/50 placeholder:text-muted-foreground/40",
                                    "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-all max-h-[120px]"
                                )}
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "absolute right-1.5 bottom-1.5 h-7 w-7 rounded-lg transition-all",
                                    input.trim()
                                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm hover:shadow-md"
                                        : "bg-transparent text-muted-foreground/40 hover:bg-transparent"
                                )}
                            >
                                <Send className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    <div className="max-w-3xl mx-auto flex items-center justify-between mt-1.5 px-1">
                        <p className="text-[10px] text-muted-foreground/40">
                            <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[9px] font-mono">↵</kbd> send · <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[9px] font-mono">⇧↵</kbd> new line · <kbd className="px-1 py-0.5 rounded bg-muted/60 text-[9px] font-mono">esc</kbd> exit
                        </p>
                        <p className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                            Powered by <span className="font-semibold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">LynkSkill</span> ✨
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
