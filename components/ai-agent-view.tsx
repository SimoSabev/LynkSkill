"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Send, Sparkles, Plus, Search, FileText, Briefcase,
    Users, Calendar, MessageSquare, Bookmark,
    BarChart3, Loader2, ChevronDown, History, Trash2,
    X, Copy, Check, Zap, TrendingUp, Target, Brain,
    Shield, Activity, Bot, Wrench, CheckCircle2,
    ArrowUp, ArrowDown, Rocket, ToggleRight,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAIMode, type ConfidenceScoreData } from "@/lib/ai-mode-context"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { AgentActionCard } from "@/components/agent-action-card"
import { ClerkIdentityBadge, ClerkUserAvatar } from "@/components/clerk-identity-badge"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ToolResultItem {
    tool: string; cardType: string; title: string; data: unknown; success?: boolean; error?: string
}
interface StreamEvent {
    type: "tool_start" | "tool_end" | "reply" | "error" | "confidence_score"
    toolName?: string; toolTitle?: string; result?: ToolResultItem
    reply?: string; suggestions?: string[]; error?: string
}
interface AIAgentViewProps { userType: "Student" | "Company" }

// Track completed tool steps for the live execution display
interface ToolStep {
    name: string
    title: string
    status: "running" | "done" | "error"
    result?: ToolResultItem
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

const STUDENT_QUICK_ACTIONS = [
    { icon: Target,        label: "What should I do today?",   prompt: "What's the most important thing I should focus on today? Check my notifications, pending apps, and any new matches.", color: "from-violet-500 to-purple-500" },
    { icon: Search,        label: "Any new matches?",          prompt: "Are there any new internships that match my profile? Show me the best ones.", color: "from-blue-500 to-cyan-500" },
    { icon: Sparkles,      label: "Apply to something for me", prompt: "Find the best match for me right now and apply on my behalf. Surprise me!", color: "from-emerald-500 to-teal-500" },
    { icon: BarChart3,     label: "How am I doing?",           prompt: "How's my profile looking? Show me my confidence score and tell me what I can improve.", color: "from-indigo-500 to-blue-500" },
    { icon: FileText,      label: "Help me with my portfolio", prompt: "Review my portfolio and give me specific tips to make it stronger.", color: "from-orange-500 to-amber-500" },
    { icon: Briefcase,     label: "My applications",           prompt: "Show me all my applications and their statuses", color: "from-pink-500 to-rose-500" },
    { icon: Calendar,      label: "Upcoming interviews",       prompt: "Do I have any upcoming interviews? Help me prepare.", color: "from-green-500 to-emerald-500" },
    { icon: Bookmark,      label: "Saved internships",         prompt: "Show my saved internships — any I should apply to?", color: "from-yellow-500 to-orange-500" },
    { icon: ToggleRight,   label: "Auto-apply settings",       prompt: "Show my auto-apply settings. Should I turn it on or adjust my threshold?", color: "from-teal-500 to-cyan-500" },
]
const COMPANY_QUICK_ACTIONS = [
    { icon: Briefcase,     label: "Our internships",     prompt: "Show all our internship postings", color: "from-blue-500 to-cyan-500" },
    { icon: Plus,          label: "Create internship",   prompt: "Help me create a new internship posting step by step", color: "from-emerald-500 to-teal-500" },
    { icon: FileText,      label: "Applications",        prompt: "Show all received applications", color: "from-violet-500 to-purple-500" },
    { icon: BarChart3,     label: "Rank candidates",     prompt: "Rank all pending applications by AI fit score", color: "from-orange-500 to-amber-500" },
    { icon: Users,         label: "Search candidates",   prompt: "Help me search for talented candidates", color: "from-pink-500 to-rose-500" },
    { icon: Calendar,      label: "Interviews",          prompt: "Show all scheduled interviews", color: "from-green-500 to-emerald-500" },
    { icon: MessageSquare, label: "Messages",            prompt: "Show our conversations", color: "from-sky-500 to-blue-500" },
]

// ─── Confidence Score Widget ────────────────────────────────────────────────

function ConfidenceScoreWidget({ score }: { score: ConfidenceScoreData | null }) {
    if (!score) return null
    const overall = score.overallScore ?? score.overall ?? 0
    const getColor = (s: number) => s >= 70 ? "emerald" : s >= 40 ? "amber" : "rose"
    const color = getColor(overall)

    const breakdowns = [
        { label: "Profile", value: score.profileCompleteness, icon: FileText },
        { label: "Depth", value: score.profilingDepth, icon: Brain },
        { label: "Endorsements", value: score.endorsementQuality, icon: Shield },
        { label: "Activity", value: score.activityScore, icon: Activity },
    ]

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                        <TrendingUp className={`h-4 w-4 text-${color}-400`} />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Confidence</p>
                        <p className={`text-2xl font-black tabular-nums text-${color}-400 leading-none`}>{overall}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-white/40">out of 100</p>
                </div>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 mb-3 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r from-${color}-400 to-${color}-500`}
                    initial={{ width: 0 }}
                    animate={{ width: `${overall}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
            <div className="grid grid-cols-4 gap-2">
                {breakdowns.map(b => (
                    <div key={b.label} className="text-center">
                        <b.icon className="h-3 w-3 mx-auto mb-1 text-white/30" />
                        <div className="text-[10px] text-white/40">{b.label}</div>
                        <div className={`text-xs font-bold tabular-nums text-${getColor(b.value)}-400`}>{b.value}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

// ─── Animated Thinking Indicator ────────────────────────────────────────────

function ThinkingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3"
        >
            {/* Pulsing Linky avatar */}
            <div className="relative">
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-violet-500/30 blur-md"
                />
                <Image src="/Linky_head.png" alt="Linky" width={32} height={32} className="relative rounded-full ring-2 ring-violet-500/40" />
            </div>
            {/* Thinking bubble with animated dots */}
            <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] border border-white/10 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                    <span className="text-xs text-white/50 font-medium">Linky is thinking</span>
                    <div className="flex gap-0.5 ml-1">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                className="h-1.5 w-1.5 rounded-full bg-violet-400"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Score Change Animation ────────────────────────────────────────────────

interface ScoreChange { oldScore: number; newScore: number; delta: number }

function ScoreChangeCard({ change }: { change: ScoreChange }) {
    const isPositive = change.delta > 0
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="flex items-start gap-3"
        >
            <Image src="/Linky_head.png" alt="Linky" width={32} height={32} className="rounded-full mt-0.5 shrink-0 ring-1 ring-white/10" />
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: [0.95, 1.02, 1] }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                    "rounded-2xl rounded-tl-sm px-4 py-3 border backdrop-blur-sm",
                    isPositive
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-rose-500/10 border-rose-500/20"
                )}
            >
                <div className="flex items-center gap-2 mb-1">
                    {isPositive ? (
                        <motion.div
                            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Rocket className="h-4 w-4 text-emerald-400" />
                        </motion.div>
                    ) : (
                        <ArrowDown className="h-4 w-4 text-rose-400" />
                    )}
                    <span className={cn("text-xs font-bold", isPositive ? "text-emerald-400" : "text-rose-400")}>
                        Confidence Score {isPositive ? "Up" : "Down"}!
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm tabular-nums">{change.oldScore}</span>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 40 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className={cn("h-0.5 rounded-full", isPositive ? "bg-emerald-400" : "bg-rose-400")}
                    />
                    {isPositive ? <ArrowUp className="h-3 w-3 text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-rose-400" />}
                    <motion.span
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [0.5, 1.3, 1] }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className={cn("text-lg font-black tabular-nums", isPositive ? "text-emerald-400" : "text-rose-400")}
                    >
                        {change.newScore}
                    </motion.span>
                    <Badge className={cn(
                        "text-[10px] px-1.5 py-0",
                        isPositive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    )}>
                        {isPositive ? "+" : ""}{change.delta}
                    </Badge>
                </div>
                {isPositive && change.delta >= 5 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-[11px] text-emerald-400/70 mt-1"
                    >
                        {change.delta >= 15 ? "Amazing progress! 🔥🔥🔥" : change.delta >= 10 ? "Great improvement! 🎉" : "Nice boost! 💪"}
                    </motion.p>
                )}
            </motion.div>
        </motion.div>
    )
}

// ─── Auto-Apply Status Card ────────────────────────────────────────────────

function AutoApplyBanner({ enabled, threshold }: { enabled: boolean; threshold: number }) {
    if (!enabled) return null
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-5 mb-2"
        >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-[11px]">
                <ToggleRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400/80">
                    <span className="font-semibold text-emerald-400">Auto-Apply ON</span> — Linky applies when match ≥ {threshold}%
                </span>
            </div>
        </motion.div>
    )
}

// ─── Tool Execution Steps ───────────────────────────────────────────────────

function ToolExecutionSteps({ steps }: { steps: ToolStep[] }) {
    if (steps.length === 0) return null
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
        >
            <div className="relative">
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-violet-500/50"
                    style={{ width: 32, height: 32 }}
                />
                <Image src="/Linky_head.png" alt="Linky" width={32} height={32} className="rounded-full" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] border border-white/10 backdrop-blur-sm px-4 py-3 space-y-2 min-w-[200px]">
                <div className="flex items-center gap-1.5 mb-1">
                    <Wrench className="h-3 w-3 text-violet-400" />
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Executing</span>
                </div>
                {steps.map((step, i) => (
                    <motion.div
                        key={`${step.name}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2"
                    >
                        {step.status === "running" ? (
                            <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin shrink-0" />
                        ) : step.status === "done" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                            <X className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className={cn(
                            "text-xs truncate",
                            step.status === "running" ? "text-white/70" : step.status === "done" ? "text-white/50" : "text-rose-400/70"
                        )}>
                            {step.title}
                        </span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

// ─── Typewriter Text ────────────────────────────────────────────────────────

function TypewriterText({ text, speed = 12, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
    const [displayed, setDisplayed] = useState("")
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (!text) return
        let idx = 0
        setDisplayed("")
        setDone(false)
        const interval = setInterval(() => {
            idx++
            // Show chunks of characters for faster feel
            const chunk = Math.min(idx * 3, text.length)
            setDisplayed(text.slice(0, chunk))
            if (chunk >= text.length) {
                clearInterval(interval)
                setDone(true)
                onComplete?.()
            }
        }, speed)
        return () => clearInterval(interval)
    }, [text, speed, onComplete])

    return (
        <div className="relative">
            <MarkdownRenderer content={displayed} />
            {!done && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-text-bottom"
                />
            )}
        </div>
    )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SuggestionChips({ suggestions, onSelect }: { suggestions: string[]; onSelect: (s: string) => void }) {
    if (!suggestions?.length) return null
    return (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-1.5 mt-3 pl-11">
            {suggestions.map((s, i) => (
                <motion.button key={i} onClick={() => onSelect(s)}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-300 hover:bg-violet-500/15 hover:border-violet-500/40 transition-all hover:scale-105">
                    {s}
                </motion.button>
            ))}
        </motion.div>
    )
}

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-white/30 hover:text-white/60 shrink-0 mt-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AIAgentView({ userType }: AIAgentViewProps) {
    const {
        messages, addMessage, isLoading, setIsLoading,
        sessions, startNewSession, loadSession, deleteSession,
        refreshSessions, currentSessionId, closeLinky,
        confidenceScore, updateConfidenceFromStream, refreshConfidenceScore,
        registerSendMessage,
    } = useAIMode()
    const [input, setInput] = useState("")
    const [showHistory, setShowHistory] = useState(false)
    const [showScrollDown, setShowScrollDown] = useState(false)
    const [toolSteps, setToolSteps] = useState<ToolStep[]>([])
    const [isThinking, setIsThinking] = useState(false)
    const [latestMsgId, setLatestMsgId] = useState<string | null>(null)
    const [scoreChange, setScoreChange] = useState<ScoreChange | null>(null)
    const [autoApplyEnabled, setAutoApplyEnabled] = useState(false)
    const [autoApplyThreshold, setAutoApplyThreshold] = useState(80)
    const prevScoreRef = useRef<number | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const ut = userType.toLowerCase() as "student" | "company"
    const quickActions = userType === "Student" ? STUDENT_QUICK_ACTIONS : COMPANY_QUICK_ACTIONS

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading, toolSteps, isThinking])

    // Initialize prevScoreRef from current confidence score
    useEffect(() => {
        if (confidenceScore && prevScoreRef.current === null) {
            prevScoreRef.current = confidenceScore.overallScore ?? confidenceScore.overall ?? 0
        }
    }, [confidenceScore])

    // Fetch auto-apply settings on mount (students only)
    useEffect(() => {
        if (ut !== "student") return
        fetch("/api/assistant/auto-apply-settings")
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d) {
                    setAutoApplyEnabled(d.enabled ?? false)
                    setAutoApplyThreshold(d.threshold ?? 80)
                }
            })
            .catch(() => {})
    }, [ut])

    // ─── Stream-based send ────────────────────────────────────────

    const sendMessage = useCallback(async (text: string, isSilent = false) => {
        if (!isSilent) {
            addMessage({ role: "user", content: text })
        }
        setIsLoading(true)
        setIsThinking(true)
        setToolSteps([])

        try {
            const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))
            const res = await fetch("/api/assistant/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, conversationHistory: history, userType: ut, sessionId: currentSessionId, silent: isSilent })
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
                        if (ev.type === "tool_start") {
                            setIsThinking(false)
                            const title = ev.toolTitle ?? ev.toolName?.replace(/_/g, " ") ?? "Working"
                            setToolSteps(prev => [...prev, { name: ev.toolName ?? "", title, status: "running" }])
                        }
                        if (ev.type === "tool_end" && ev.result) {
                            collectedToolResults.push(ev.result)
                            setToolSteps(prev => prev.map(s =>
                                s.status === "running" && s.name === ev.toolName
                                    ? { ...s, status: ev.result?.success !== false ? "done" : "error", result: ev.result }
                                    : s
                            ))
                            // Track auto-apply state from tool results
                            if (ev.result.cardType === "auto-apply-settings" && ev.result.data) {
                                const d = ev.result.data as { enabled?: boolean; threshold?: number }
                                setAutoApplyEnabled(d.enabled ?? false)
                                setAutoApplyThreshold(d.threshold ?? 80)
                            }
                        }
                        if (ev.type === "reply") {
                            finalReply = ev.reply ?? ""
                            finalSuggestions = ev.suggestions ?? []
                        }
                        if (ev.type === "confidence_score" && ev.reply) {
                            try {
                                const scoreData = JSON.parse(ev.reply) as ConfidenceScoreData
                                const newOverall = scoreData.overallScore ?? scoreData.overall ?? 0
                                const oldScore = prevScoreRef.current
                                updateConfidenceFromStream({
                                    overallScore: newOverall,
                                    profileCompleteness: scoreData.profileCompleteness ?? 0,
                                    profilingDepth: scoreData.profilingDepth ?? 0,
                                    endorsementQuality: scoreData.endorsementQuality ?? 0,
                                    activityScore: scoreData.activityScore ?? 0,
                                })
                                // Show score change animation if score actually changed
                                if (oldScore !== null && oldScore !== newOverall) {
                                    setScoreChange({ oldScore, newScore: newOverall, delta: newOverall - oldScore })
                                    setTimeout(() => setScoreChange(null), 5000)
                                }
                                prevScoreRef.current = newOverall
                            } catch { /* ignore */ }
                        }
                        if (ev.type === "error") toast.error(ev.error ?? "Agent error")
                    } catch { /* skip malformed */ }
                }
            }

            const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            setLatestMsgId(msgId)
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
            refreshSessions().catch(() => {})
            refreshConfidenceScore().catch(() => {})
            setIsLoading(false)
            setIsThinking(false)
            setToolSteps([])
        }
    }, [messages, addMessage, setIsLoading, ut, currentSessionId, refreshSessions, updateConfidenceFromStream, refreshConfidenceScore])

    // Auto-greeting
    const triggeredSessions = useRef<Set<string>>(new Set())
    // Register sendMessage with context so openLinky can trigger it
    useEffect(() => {
        registerSendMessage(sendMessage)
        return () => registerSendMessage(null)
    }, [sendMessage, registerSendMessage])

    useEffect(() => {
        if (messages.length === 0 && !triggeredSessions.current.has(currentSessionId) && !isLoading) {
            triggeredSessions.current.add(currentSessionId)
            sendMessage("Hey Linky! Give me a natural, warm greeting based on my personality state and what you know about me. If I'm a COMPANY, give a concise business greeting with my most important pending action. If I'm a STUDENT: for new users, introduce yourself as my career sidekick in 2 sentences and ask what I'm studying or what kind of work excites me. For returning users, greet me by referencing something specific from our history, share my confidence score, and ask exactly 1 thought-provoking profiling question if my score is below 100. Keep it conversational — like a friend checking in, not a system prompt.", true)
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
        if (e.key === "Escape") closeLinky()
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
        <div className="relative flex h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl"
            style={{ background: "linear-gradient(145deg, rgba(15,10,30,0.97) 0%, rgba(20,12,40,0.98) 50%, rgba(10,8,25,0.99) 100%)" }}>

            {/* Ambient glow effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/8 rounded-full blur-[100px] pointer-events-none" />

            {/* History Sidebar */}
            <AnimatePresence>
                {showHistory && (
                    <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="flex-shrink-0 overflow-hidden border-r border-white/[0.06]">
                        <div className="flex h-full w-[280px] flex-col bg-white/[0.02]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">History</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white/60" onClick={() => setShowHistory(false)}><X className="h-3.5 w-3.5" /></Button>
                            </div>

                            {userType === "Student" && confidenceScore && (
                                <div className="px-3 pt-3">
                                    <ConfidenceScoreWidget score={confidenceScore} />
                                </div>
                            )}

                            <ScrollArea className="flex-1 min-h-0">
                                <div className="p-2 pr-4 space-y-1">
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-[11px] text-violet-400 font-medium hover:bg-violet-500/10 hover:text-violet-300"
                                        onClick={() => { startNewSession(ut); setShowHistory(false) }}>
                                        <Plus className="h-3.5 w-3.5" /> New chat
                                    </Button>
                                    <div className="space-y-0.5">
                                        {relevantSessions.map(s => (
                                            <div key={s.id} className="group flex items-center gap-1 px-1">
                                                <button onClick={() => { loadSession(s.id); setShowHistory(false) }}
                                                    className={cn(
                                                        "flex-1 text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors truncate",
                                                        s.id === currentSessionId ? "bg-violet-500/15 text-violet-300 font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                                    )}>
                                                    <MessageSquare className="h-3 w-3 inline mr-2 opacity-50" />{s.name}
                                                </button>
                                                <button onClick={() => deleteSession(s.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-rose-400 transition-all">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {relevantSessions.length === 0 && (
                                            <p className="text-[11px] text-white/20 text-center py-6">No past chats yet</p>
                                        )}
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
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl" onClick={() => setShowHistory(!showHistory)}>
                            <History className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <Image src="/Linky_head.png" alt="Linky" width={32} height={32} className="rounded-full ring-2 ring-violet-500/20" />
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f0a1e]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white/90 leading-none">Linky</p>
                                <p className="text-[10px] text-white/30 mt-0.5">AI Middleman · {userType}</p>
                            </div>
                        </div>
                        <Badge className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold">
                            <Zap className="h-2.5 w-2.5 mr-0.5" /> LIVE
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {userType === "Student" && confidenceScore && (
                            <motion.div
                                key={confidenceScore.overallScore}
                                initial={{ scale: 1.2, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm",
                                    (confidenceScore.overallScore ?? 0) >= 70
                                        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                        : (confidenceScore.overallScore ?? 0) >= 40
                                            ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                                            : "text-rose-400 border-rose-500/20 bg-rose-500/10"
                                )}
                            >
                                <TrendingUp className="h-3 w-3" />
                                {confidenceScore.overallScore ?? 0}
                            </motion.div>
                        )}
                        <ClerkIdentityBadge />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl" onClick={() => startNewSession(ut)}><Plus className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl" onClick={closeLinky}><X className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollContainerRef} onScroll={() => {
                    const el = scrollContainerRef.current
                    if (el) setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 100)
                }} className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                    {!hasMessages && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-8 py-8">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: "spring" }}>
                                <div className="relative">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl"
                                        style={{ width: 120, height: 120, top: -20, left: -20 }}
                                    />
                                    <Image src="/Linky_head.png" alt="Linky" width={80} height={80} className="relative drop-shadow-2xl" />
                                </div>
                            </motion.div>
                            <div className="text-center space-y-2">
                                <h3 className="font-black text-2xl text-white/90">
                                    Hey, I&apos;m Linky
                                </h3>
                                <p className="text-sm text-white/40 max-w-md leading-relaxed">
                                    {userType === "Student"
                                        ? "Your AI career agent. I find internships, apply for you, and build your profile — no boring forms, no cover letters."
                                        : "Your AI hiring manager. I draft postings, rank candidates with AI scores, and run your entire pipeline."}
                                </p>
                            </div>

                            {userType === "Student" && confidenceScore && (
                                <div className="w-full max-w-sm">
                                    <ConfidenceScoreWidget score={confidenceScore} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-xl">
                                {quickActions.slice(0, 6).map((a, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 * i, duration: 0.3 }}
                                        onClick={() => sendMessage(a.prompt)}
                                        className="group relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] text-xs text-left transition-all overflow-hidden"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-r ${a.color} opacity-0 group-hover:opacity-[0.06] transition-opacity`} />
                                        <a.icon className="h-4 w-4 text-white/40 shrink-0 group-hover:text-white/70 transition-colors" />
                                        <span className="text-white/60 group-hover:text-white/90 transition-colors truncate font-medium">{a.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, msgIdx) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn("group", msg.role === "user" ? "flex justify-end" : "flex justify-start")}
                        >
                            {msg.role === "assistant" && (
                                <div className="flex gap-3 max-w-[88%] flex-col">
                                    <div className="flex gap-3 items-start">
                                        <Image src="/Linky_head.png" alt="Linky" width={32} height={32} className="rounded-full mt-0.5 shrink-0 ring-1 ring-white/10" />
                                        <div className="flex-1 space-y-2.5 min-w-0">
                                            {msg.metadata?.toolResults && (msg.metadata.toolResults as ToolResultItem[]).length > 0 && (
                                                <div className="space-y-2">
                                                    {(msg.metadata.toolResults as ToolResultItem[]).map((tr, ti) => (
                                                        <AgentActionCard key={ti} result={tr} onAction={sendMessage} />
                                                    ))}
                                                </div>
                                            )}
                                            {msg.content && (
                                                <div className="flex items-start gap-1">
                                                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/[0.06] border border-white/[0.08] text-sm text-white/85 leading-relaxed backdrop-blur-sm">
                                                        {/* Typewriter for latest message only */}
                                                        {msg.id === latestMsgId && msgIdx === messages.length - 1 ? (
                                                            <TypewriterText text={msg.content} onComplete={() => setLatestMsgId(null)} />
                                                        ) : (
                                                            <MarkdownRenderer content={msg.content} />
                                                        )}
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
                                <div className="flex items-end gap-2.5 max-w-[80%]">
                                    <div className="rounded-2xl rounded-br-sm px-4 py-2.5 bg-gradient-to-br from-violet-600 to-violet-700 text-white text-sm shadow-lg shadow-violet-500/10">{msg.content}</div>
                                    <ClerkUserAvatar size={28} />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {/* Live status indicators */}
                    <AnimatePresence mode="wait">
                        {isLoading && isThinking && toolSteps.length === 0 && (
                            <ThinkingIndicator key="thinking" />
                        )}
                        {isLoading && toolSteps.length > 0 && (
                            <ToolExecutionSteps key="tools" steps={toolSteps} />
                        )}
                    </AnimatePresence>

                    {/* Score change celebration */}
                    <AnimatePresence>
                        {scoreChange && (
                            <ScoreChangeCard key="score-change" change={scoreChange} />
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll-to-bottom */}
                <AnimatePresence>
                    {showScrollDown && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                            className="absolute bottom-28 right-8 p-2.5 rounded-full shadow-xl bg-white/10 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/15 backdrop-blur-sm z-10 transition-colors">
                            <ChevronDown className="h-4 w-4" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Auto-apply banner for students */}
                {ut === "student" && (
                    <AnimatePresence>
                        <AutoApplyBanner enabled={autoApplyEnabled} threshold={autoApplyThreshold} />
                    </AnimatePresence>
                )}

                {/* Input Area */}
                <div className="border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-xl px-5 py-4">
                    {hasMessages && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {quickActions.slice(0, 4).map((a, i) => (
                                <button key={i} onClick={() => sendMessage(a.prompt)} disabled={isLoading}
                                    className="text-[11px] px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all disabled:opacity-30">
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-3 items-end">
                        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                            placeholder="Ask Linky anything…" rows={1} disabled={isLoading}
                            className="flex-1 resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 disabled:opacity-40 min-h-[44px] max-h-[120px] scrollbar-thin transition-all" />
                        <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon"
                            className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white shrink-0 shadow-lg shadow-violet-500/20 disabled:opacity-30 disabled:shadow-none transition-all">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-[10px] text-white/20 mt-2 text-center">
                        Enter to send · Shift+Enter for newline · Esc to close
                    </p>
                </div>
            </div>
        </div>
    )
}
