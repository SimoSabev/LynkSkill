"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Send,
    Sparkles,
    Loader2,
    X,
    Minus,
    Plus,
    History,
    Trash2,
    MessageSquare,
    FileText,
    Target,
    Briefcase,
    User,
    Search,
    Users,
    Zap,
    BookOpen,
    PenLine,
    Star,
    TrendingUp,
    Lightbulb,
    Save,
    CheckCircle2,
    Keyboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAIMode } from "@/lib/ai-mode-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { MarkdownRenderer } from "./MarkdownRenderer"
import Image from "next/image"

// ─── Types ──────────────────────────────────────────────────────────────────

interface AIChatPanelProps {
    userType: "Student" | "Company"
}

interface QuickAction {
    icon: React.ElementType
    label: string
    prompt: string
    color: string
}

interface AIMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    metadata?: {
        type?: string
        data?: unknown
    }
}

interface ChatSession {
    id: string
    name: string
    createdAt: Date
    messages: AIMessage[]
    userType: "student" | "company"
}

interface InternshipMatch {
    id: string
    title: string
    company: string
    matchPercentage: number
    reasons: string[]
    skills: string[]
}

interface StudentMatch {
    id: string
    name: string
    email: string
    matchPercentage: number
    reasons: string[]
    skills: string[]
    portfolio?: {
        headline?: string
        about?: string
    }
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

function getQuickActions(activeTab: string, userType: "Student" | "Company"): QuickAction[] {
    const actions: QuickAction[] = []

    if (activeTab === "home") {
        actions.push(
            { icon: TrendingUp, label: "What should I do next?", prompt: "Based on my current dashboard activity, what should I prioritize next?", color: "from-blue-500 to-cyan-500" },
            { icon: Lightbulb, label: "Summarize my progress", prompt: "Give me a quick summary of my recent activity and progress on LynkSkill", color: "from-amber-500 to-orange-500" },
        )
    }

    if (userType === "Student") {
        switch (activeTab) {
            case "apps":
                actions.push(
                    { icon: FileText, label: "Audit my portfolio", prompt: "Review my portfolio and give me specific, actionable improvements I should make right now", color: "from-purple-500 to-pink-500" },
                    { icon: PenLine, label: "Write a headline", prompt: "Help me write a powerful professional headline that stands out to companies", color: "from-green-500 to-emerald-500" },
                    { icon: Star, label: "Suggest skills", prompt: "Based on current job market trends, what skills should I add to my profile?", color: "from-yellow-500 to-amber-500" },
                )
                break
            case "files":
                actions.push(
                    { icon: Target, label: "Application tips", prompt: "Give me tips to improve my applications and get more acceptance responses", color: "from-rose-500 to-pink-500" },
                    { icon: PenLine, label: "Follow up message", prompt: "Help me write a professional follow-up message for my pending applications", color: "from-violet-500 to-purple-500" },
                )
                break
            case "messages":
                actions.push(
                    { icon: PenLine, label: "Draft a reply", prompt: "Help me draft a professional and friendly reply to a company message", color: "from-blue-500 to-indigo-500" },
                    { icon: MessageSquare, label: "Communication tips", prompt: "Give me tips for professional communication with companies and recruiters", color: "from-teal-500 to-green-500" },
                )
                break
            case "interviews":
                actions.push(
                    { icon: BookOpen, label: "Interview prep", prompt: "Help me prepare for my upcoming interview. Give me common questions and how to answer them.", color: "from-orange-500 to-red-500" },
                    { icon: Lightbulb, label: "STAR method", prompt: "Teach me the STAR method for answering behavioral interview questions with examples", color: "from-cyan-500 to-blue-500" },
                )
                break
            case "saved":
                actions.push(
                    { icon: Search, label: "Find internships", prompt: "Based on my skills and interests, help me find the best internship matches", color: "from-indigo-500 to-purple-500" },
                    { icon: Target, label: "Compare saved", prompt: "Help me compare my saved internships and decide which ones to apply to", color: "from-pink-500 to-rose-500" },
                )
                break
            case "learn":
                actions.push(
                    { icon: TrendingUp, label: "Growth plan", prompt: "Create a professional growth plan based on my experience so far", color: "from-emerald-500 to-green-500" },
                    { icon: Star, label: "Highlight achievements", prompt: "Help me identify and articulate my key achievements from my experience", color: "from-amber-500 to-yellow-500" },
                )
                break
        }
    } else {
        switch (activeTab) {
            case "home":
                actions.push(
                    { icon: Users, label: "Find talent", prompt: "Help me find the best candidates for my open positions. What skills should I look for?", color: "from-violet-500 to-purple-500" },
                    { icon: TrendingUp, label: "Hiring insights", prompt: "Give me insights about current hiring trends and how to attract top student talent", color: "from-blue-500 to-cyan-500" },
                )
                break
            case "files":
                actions.push(
                    { icon: Target, label: "Screen applicants", prompt: "Help me evaluate and screen the current applications for my open positions", color: "from-rose-500 to-pink-500" },
                    { icon: Star, label: "Rank candidates", prompt: "Rank my current applicants by their fit for the role and explain why", color: "from-amber-500 to-yellow-500" },
                )
                break
            case "messages":
                actions.push(
                    { icon: PenLine, label: "Draft message", prompt: "Help me draft a professional and welcoming message to a candidate", color: "from-blue-500 to-indigo-500" },
                    { icon: MessageSquare, label: "Rejection template", prompt: "Help me write a kind and constructive rejection message for a candidate", color: "from-slate-500 to-gray-500" },
                )
                break
            case "interviews":
                actions.push(
                    { icon: BookOpen, label: "Interview questions", prompt: "Generate relevant and insightful interview questions for my open positions", color: "from-orange-500 to-red-500" },
                    { icon: Target, label: "Evaluation rubric", prompt: "Create an evaluation rubric for assessing candidates during interviews", color: "from-green-500 to-emerald-500" },
                )
                break
            case "team":
                actions.push(
                    { icon: Users, label: "Team insights", prompt: "Help me analyze my team's performance and suggest improvements", color: "from-green-500 to-emerald-500" },
                    { icon: Briefcase, label: "Assignment ideas", prompt: "Suggest meaningful assignments I can give to my interns to help them grow", color: "from-purple-500 to-indigo-500" },
                )
                break
            case "leaderboard":
                actions.push(
                    { icon: Search, label: "Search students", prompt: "I'm looking for talented students. Help me search based on specific skills.", color: "from-violet-500 to-purple-500" },
                )
                break
        }
    }

    // Always add a general action
    if (actions.length === 0) {
        actions.push(
            { icon: Sparkles, label: "How can you help?", prompt: "What can you help me with on LynkSkill?", color: "from-purple-500 to-violet-500" },
        )
    }

    return actions
}

// ─── Tab Label Mapping ──────────────────────────────────────────────────────

function getTabLabel(tab: string): string {
    const labels: Record<string, string> = {
        home: "Home",
        apps: "Portfolio",
        files: "Applications",
        learn: "My Experience",
        saved: "Saved",
        messages: "Messages",
        interviews: "Interviews",
        team: "Team",
        leaderboard: "Leaderboard",
        projects: "Assignments",
    }
    return labels[tab] || "Dashboard"
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AIChatPanel({ userType }: AIChatPanelProps) {
    const { t } = useTranslation()
    const {
        isAIMode,
        toggleAIMode,
        messages,
        addMessage,
        isLoading,
        setIsLoading,
        studentMatches,
        setStudentMatches,
        internshipMatches,
        setInternshipMatches,
        generatedPortfolio,
        setGeneratedPortfolio,
        chatPhase,
        setChatPhase,
        sendWelcomeMessage,
        welcomeSent,
        currentSessionId,
        sessions,
        startNewSession,
        loadSession,
        deleteSession,
        activeTab,
        isPanelMinimized,
        setPanelMinimized,
    } = useAIMode()

    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [showQuickActions, setShowQuickActions] = useState(true)
    const [showSessions, setShowSessions] = useState(false)
    const [isSavingPortfolio, setIsSavingPortfolio] = useState(false)
    const [portfolioSaved, setPortfolioSaved] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const userTypeLower = userType.toLowerCase() as "student" | "company"
    const quickActions = getQuickActions(activeTab, userType)
    const filteredSessions = sessions.filter((s: ChatSession) => s.userType === userTypeLower)

    // ─── Effects ────────────────────────────────────────────────────────

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isTyping])

    // Send welcome when opened for the first time
    useEffect(() => {
        if (isAIMode && !welcomeSent) {
            sendWelcomeMessage(userTypeLower)
        }
    }, [isAIMode, welcomeSent, sendWelcomeMessage, userTypeLower])

    // Focus input when panel opens
    useEffect(() => {
        if (isAIMode && !isPanelMinimized) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isAIMode, isPanelMinimized])

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault()
                if (!isAIMode) {
                    toggleAIMode()
                } else if (isPanelMinimized) {
                    setPanelMinimized(false)
                } else {
                    inputRef.current?.focus()
                }
            }
            // Escape to minimize
            if (e.key === "Escape" && isAIMode && !isPanelMinimized) {
                setPanelMinimized(true)
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [isAIMode, isPanelMinimized, toggleAIMode, setPanelMinimized])

    // ─── Handlers ───────────────────────────────────────────────────────

    // Parse search criteria from company AI responses
    const parseMessageForSearch = (text: string): { cleanText: string; searchCriteria: { skills: string[]; roleType: string; field: string } | null } => {
        const jsonPatterns = [
            /\{\s*"type"\s*:\s*"ready_for_search"[^}]*\}\}?/g,
            /\{"type":\s*"ready_for_search"[\s\S]*?\}\}/g,
        ]
        let cleanText = text
        let searchCriteria = null

        for (const regex of jsonPatterns) {
            const matches = text.match(regex)
            if (matches) {
                for (const match of matches) {
                    try {
                        const jsonData = JSON.parse(match)
                        if (jsonData.type === "ready_for_search" && jsonData.criteria) {
                            searchCriteria = {
                                skills: jsonData.criteria.skills || [],
                                roleType: jsonData.criteria.roleType || "",
                                field: jsonData.criteria.field || "",
                            }
                            cleanText = cleanText.replace(match, "").trim()
                        }
                    } catch {
                        try {
                            const fixedMatch = match.replace(/,\s*\}/, "}").replace(/,\s*\]/, "]")
                            const jsonData = JSON.parse(fixedMatch)
                            if (jsonData.type === "ready_for_search" && jsonData.criteria) {
                                searchCriteria = {
                                    skills: jsonData.criteria.skills || [],
                                    roleType: jsonData.criteria.roleType || "",
                                    field: jsonData.criteria.field || "",
                                }
                                cleanText = cleanText.replace(match, "").trim()
                            }
                        } catch {
                            cleanText = cleanText.replace(match, "").trim()
                        }
                    }
                }
            }
        }
        cleanText = cleanText.replace(/\{"type"[^}]*\}\}?/g, "").trim()
        return { cleanText, searchCriteria }
    }

    // Save evaluation results (company)
    const saveEvaluationResults = useCallback(async (
        matches: Array<{ id: string; matchPercentage: number; reasons: string[]; skills: string[] }>,
        searchQuery: string,
        requiredSkills: string[]
    ) => {
        try {
            const response = await fetch("/api/candidates/evaluations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    sessionName: `AI Search - ${new Date().toLocaleString()}`,
                    searchQuery,
                    requiredSkills,
                    candidates: matches.map(m => ({
                        id: m.id,
                        matchPercentage: m.matchPercentage,
                        reasons: m.reasons,
                        skills: m.skills,
                    })),
                }),
            })
            const data = await response.json()
            if (data.success) {
                console.log(`Saved ${data.evaluationsCount} evaluations`)
            }
        } catch (error) {
            console.error("Error saving evaluations:", error)
        }
    }, [currentSessionId])

    // Save portfolio (student)
    const handleSavePortfolio = async () => {
        if (!generatedPortfolio) return
        setIsSavingPortfolio(true)
        try {
            const response = await fetch("/api/portfolio/ai-save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    headline: generatedPortfolio.headline,
                    about: generatedPortfolio.about,
                    skills: generatedPortfolio.skills,
                    interests: generatedPortfolio.interests,
                    sessionId: currentSessionId,
                }),
            })
            const data = await response.json()
            if (data.success) {
                setPortfolioSaved(true)
                toast.success(t("ai.portfolioSavedToProfile"))
            } else {
                toast.error(data.error || t("ai.failedToSavePortfolio"))
            }
        } catch {
            toast.error(t("ai.failedToSavePortfolio"))
        } finally {
            setIsSavingPortfolio(false)
        }
    }

    // Submit message
    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputValue.trim() || isLoading) return

        const userMessage = inputValue.trim()
        setInputValue("")
        setShowQuickActions(false)

        addMessage({ role: "user", content: userMessage })
        setIsLoading(true)
        setIsTyping(true)

        try {
            const response = await fetch("/api/assistant/ai-mode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: messages.map((m: AIMessage) => ({ role: m.role, content: m.content })),
                    phase: chatPhase,
                    userType: userTypeLower,
                }),
            })

            const data = await response.json()

            if (data.error) {
                addMessage({ role: "assistant", content: t("ai.errorEncountered") })
            } else {
                const isCompany = userTypeLower === "company"
                const replyContent = isCompany
                    ? parseMessageForSearch(data.reply).cleanText
                    : data.reply

                addMessage({
                    role: "assistant",
                    content: replyContent,
                    metadata: { type: data.type, data: data.data },
                })

                if (data.phase) setChatPhase(data.phase)
                if (data.portfolio) setGeneratedPortfolio(data.portfolio)
                if (data.matches && data.matches.length > 0) {
                    if (isCompany) {
                        setStudentMatches(data.matches)
                        setChatPhase("results")
                        const allSkills: string[] = [...new Set(data.matches.flatMap((m: { skills?: string[] }) => m.skills || []))] as string[]
                        saveEvaluationResults(data.matches, userMessage, allSkills)
                        toast.success(t("ai.foundCandidates", { count: data.matches.length }))
                    } else {
                        setInternshipMatches(data.matches)
                    }
                }
            }
        } catch (error) {
            console.error("AI Mode error:", error)
            addMessage({ role: "assistant", content: t("ai.connectionTrouble") })
        } finally {
            setIsLoading(false)
            setIsTyping(false)
        }
    }

    const handleQuickAction = (prompt: string) => {
        setInputValue(prompt)
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }

    const handleNewChat = () => {
        startNewSession(userTypeLower)
        setStudentMatches([])
        setInternshipMatches([])
        setGeneratedPortfolio(null)
        setPortfolioSaved(false)
        setShowQuickActions(true)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const getMatchColor = (percentage: number) => {
        if (percentage >= 80) return "from-green-500 to-emerald-500"
        if (percentage >= 60) return "from-blue-500 to-indigo-500"
        if (percentage >= 40) return "from-yellow-500 to-orange-500"
        return "from-gray-500 to-slate-500"
    }

    // ─── Don't render if AI mode is off ─────────────────────────────────

    if (!isAIMode) return null

    // ─── Minimized Bubble ───────────────────────────────────────────────

    if (isPanelMinimized) {
        return (
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPanelMinimized(false)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
            >
                <div className="relative">
                    <Image src="/Linky_head.png" alt="Linky" width={28} height={28} />
                    {messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                    )}
                </div>
            </motion.button>
        )
    }

    // ─── Full Panel ─────────────────────────────────────────────────────

    return (
        <>
            {/* Mobile backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setPanelMinimized(true)}
            />

            {/* Panel */}
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "fixed top-0 right-0 z-50 h-full flex flex-col",
                    "w-full sm:w-[420px] lg:w-[440px]",
                    "bg-background/95 backdrop-blur-xl",
                    "border-l border-border/50",
                    "shadow-2xl shadow-violet-500/5",
                )}
            >
                {/* ── Gradient top border ── */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80">
                    <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                            <Image src="/Linky_head.png" alt="Linky" width={22} height={22} className="relative z-10" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                Linky AI
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                    Beta
                                </span>
                            </h3>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Viewing: {getTabLabel(activeTab)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={handleNewChat}
                            title="New chat"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => setShowSessions(!showSessions)}
                            title="Chat history"
                        >
                            <History className="h-4 w-4" />
                            {filteredSessions.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {filteredSessions.length}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => setPanelMinimized(true)}
                            title="Minimize (Esc)"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500"
                            onClick={toggleAIMode}
                            title="Close AI"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Sessions Drawer ── */}
                <AnimatePresence>
                    {showSessions && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b border-border/50 overflow-hidden bg-muted/30"
                        >
                            <div className="p-3 max-h-60 overflow-y-auto">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                                    Chat History
                                </p>
                                {filteredSessions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">No previous chats</p>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredSessions.map((session: ChatSession) => (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group text-sm",
                                                    session.id === currentSessionId
                                                        ? "bg-violet-500/10 border border-violet-500/20"
                                                        : "hover:bg-muted/50"
                                                )}
                                                onClick={() => {
                                                    loadSession(session.id)
                                                    setShowSessions(false)
                                                }}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-xs truncate">{session.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {session.messages.length} msgs · {new Date(session.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        deleteSession(session.id)
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Quick Actions ── */}
                <AnimatePresence>
                    {showQuickActions && messages.length <= 1 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b border-border/50 overflow-hidden"
                        >
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap className="h-3 w-3 text-violet-500" />
                                        Quick Actions · {getTabLabel(activeTab)}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => setShowQuickActions(false)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {quickActions.map((action, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => handleQuickAction(action.prompt)}
                                            className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-muted/50 transition-all group"
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform",
                                                action.color
                                            )}>
                                                <action.icon className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                                                {action.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Chat Messages ── */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4 space-y-4">
                        {/* Messages */}
                        <AnimatePresence>
                            {messages.map((message: AIMessage) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-2.5",
                                        message.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                            <Image src="/Linky_head.png" alt="Linky" width={16} height={16} />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                                        message.role === "user"
                                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm"
                                            : "bg-muted/50 border border-border/50 rounded-bl-sm"
                                    )}>
                                        {message.role === "assistant" ? (
                                            <div className="text-sm prose-sm max-w-none">
                                                <MarkdownRenderer content={message.content} />
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                        )}
                                    </div>
                                    {message.role === "user" && (
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                            <User className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Typing indicator */}
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-2.5"
                            >
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Image src="/Linky_head.png" alt="Linky" width={16} height={16} />
                                </div>
                                <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-violet-500"
                                                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            />
                                        ))}
                                        <span className="text-[10px] text-muted-foreground ml-1">Thinking...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Results Cards ── */}

                        {/* Student: Portfolio */}
                        {userTypeLower === "student" && generatedPortfolio && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-violet-500" />
                                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">Portfolio Generated</p>
                                </div>
                                {Boolean(generatedPortfolio.headline) && (
                                    <p className="text-sm font-medium mb-1">{String(generatedPortfolio.headline)}</p>
                                )}
                                {Boolean(generatedPortfolio.skills) && Array.isArray(generatedPortfolio.skills) && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {(generatedPortfolio.skills as string[]).slice(0, 5).map((skill, i) => (
                                            <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5">{skill}</Badge>
                                        ))}
                                        {(generatedPortfolio.skills as string[]).length > 5 && (
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">+{(generatedPortfolio.skills as string[]).length - 5}</Badge>
                                        )}
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    className={cn(
                                        "w-full rounded-lg text-xs h-8",
                                        portfolioSaved
                                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/20"
                                            : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                                    )}
                                    onClick={handleSavePortfolio}
                                    disabled={isSavingPortfolio || portfolioSaved}
                                >
                                    {isSavingPortfolio ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> :
                                        portfolioSaved ? <CheckCircle2 className="h-3 w-3 mr-1.5" /> :
                                            <Save className="h-3 w-3 mr-1.5" />}
                                    {portfolioSaved ? "Saved to Profile" : "Save to Profile"}
                                </Button>
                            </motion.div>
                        )}

                        {/* Student: Internship Matches */}
                        {userTypeLower === "student" && internshipMatches.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Briefcase className="h-4 w-4 text-violet-500" />
                                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                        {internshipMatches.length} Matches Found
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {internshipMatches.slice(0, 4).map((match: InternshipMatch) => (
                                        <div key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium truncate">{match.title}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{match.company}</p>
                                            </div>
                                            <div className={cn("px-1.5 py-0.5 rounded text-white text-[10px] font-bold bg-gradient-to-r", getMatchColor(match.matchPercentage))}>
                                                {match.matchPercentage}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Company: Student Matches */}
                        {userTypeLower === "company" && studentMatches.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-violet-500" />
                                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                        {studentMatches.length} Candidates Found
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {studentMatches.slice(0, 4).map((match: StudentMatch) => (
                                        <div key={match.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
                                            <Avatar className="h-7 w-7 border border-violet-500/20">
                                                <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-bold">
                                                    {match.name?.charAt(0) || "S"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{match.name}</p>
                                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                                    {(match.skills || []).slice(0, 2).map((skill: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="text-[9px] py-0 px-1 h-4">{skill}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className={cn("px-1.5 py-0.5 rounded text-white text-[10px] font-bold bg-gradient-to-r", getMatchColor(match.matchPercentage))}>
                                                {match.matchPercentage}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* ── Input Area ── */}
                <div className="border-t border-border/50 p-3 bg-background/80">
                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <Textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    userTypeLower === "student"
                                        ? "Ask Linky anything..."
                                        : "Describe the talent you need..."
                                }
                                className="min-h-[42px] max-h-[120px] rounded-xl border-border/50 bg-muted/30 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/40 text-sm pr-8 resize-none"
                                disabled={isLoading}
                                rows={1}
                            />
                            <div className="absolute right-2 bottom-2 text-[9px] text-muted-foreground/50 pointer-events-none">
                                <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30 font-mono">⏎</kbd>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            size="icon"
                            className="h-[42px] w-[42px] rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:shadow-none flex-shrink-0 transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                    <div className="flex items-center justify-between mt-2 px-1">
                        <p className="text-[9px] text-muted-foreground/50">
                            Linky can make mistakes. Verify important info.
                        </p>
                        <p className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
                            <Keyboard className="h-2.5 w-2.5" />
                            <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30 font-mono text-[8px]">Ctrl</kbd>
                            <span>+</span>
                            <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/30 font-mono text-[8px]">K</kbd>
                        </p>
                    </div>
                </div>
            </motion.div>
        </>
    )
}
