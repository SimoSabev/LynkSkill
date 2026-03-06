# Linky AI Mode Implementation

This file contains the full source code for the Linky AI Mode implementation, including context providers, frontend components, API routes, and backend tool definitions.

---

## 1. Context & State Management

### [lib/ai-mode-context.tsx](lib/ai-mode-context.tsx)
```tsx
"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react"

// Generate unique session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// LocalStorage keys
const SESSIONS_STORAGE_KEY = "lynkskill_ai_sessions"
const CURRENT_SESSION_KEY = "lynkskill_current_session"

// Helper to safely parse JSON from localStorage
function getStoredSessions(): ChatSession[] {
    if (typeof window === "undefined") return []
    try {
        const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)
        if (!stored) return []
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        return parsed.map((session: ChatSession) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            messages: session.messages.map((msg: AIMessage) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }))
        }))
    } catch {
        return []
    }
}

function getStoredCurrentSession(): { id: string; userType: "student" | "company" } | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(CURRENT_SESSION_KEY)
        if (!stored) return null
        return JSON.parse(stored)
    } catch {
        return null
    }
}

interface AIMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
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

interface AIModeContextType {
    isAIMode: boolean
    toggleAIMode: () => void
    messages: AIMessage[]
    addMessage: (message: Omit<AIMessage, "id" | "timestamp">) => void
    clearMessages: () => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    internshipMatches: InternshipMatch[]
    setInternshipMatches: (matches: InternshipMatch[]) => void
    studentMatches: StudentMatch[]
    setStudentMatches: (matches: StudentMatch[]) => void
    generatedPortfolio: Record<string, unknown> | null
    setGeneratedPortfolio: (portfolio: Record<string, unknown> | null) => void
    chatPhase: "intro" | "gathering" | "portfolio" | "matching" | "results"
    setChatPhase: (phase: "intro" | "gathering" | "portfolio" | "matching" | "results") => void
    sendWelcomeMessage: (userType: "student" | "company") => void
    welcomeSent: boolean
    // Session management
    currentSessionId: string
    sessions: ChatSession[]
    startNewSession: (userType: "student" | "company") => void
    loadSession: (sessionId: string) => void
    deleteSession: (sessionId: string) => void
    // Panel & tab tracking
    activeTab: string
    setActiveTab: (tab: string) => void
    isPanelMinimized: boolean
    setPanelMinimized: (minimized: boolean) => void
}

const AIModeContext = createContext<AIModeContextType | undefined>(undefined)

export function AIModeProvider({ children }: { children: ReactNode }) {
    const [isAIMode, setIsAIMode] = useState(false)
    const [messages, setMessages] = useState<AIMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [internshipMatches, setInternshipMatches] = useState<InternshipMatch[]>([])
    const [studentMatches, setStudentMatches] = useState<StudentMatch[]>([])
    const [generatedPortfolio, setGeneratedPortfolio] = useState<Record<string, unknown> | null>(null)
    const [chatPhase, setChatPhase] = useState<"intro" | "gathering" | "portfolio" | "matching" | "results">("intro")
    const [welcomeSent, setWelcomeSent] = useState(false)
    
    // Session management - initialize from localStorage
    const [currentSessionId, setCurrentSessionId] = useState(() => generateSessionId())
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentUserType, setCurrentUserType] = useState<"student" | "company">("student")
    const isInitialized = useRef(false)

    // Panel & tab tracking
    const [activeTab, setActiveTab] = useState("home")
    const [isPanelMinimized, setPanelMinimized] = useState(false)

    // Load sessions from localStorage on mount
    useEffect(() => {
        if (isInitialized.current) return
        isInitialized.current = true
        
        const storedSessions = getStoredSessions()
        if (storedSessions.length > 0) {
            setSessions(storedSessions)
        }
        
        const storedCurrentSession = getStoredCurrentSession()
        if (storedCurrentSession) {
            setCurrentSessionId(storedCurrentSession.id)
            setCurrentUserType(storedCurrentSession.userType)
        }
    }, [])

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (!isInitialized.current) return
        if (sessions.length > 0) {
            localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
        }
    }, [sessions])

    // Auto-save current session when messages change
    useEffect(() => {
        if (!isInitialized.current || messages.length === 0) return
        
        // Debounce the save to avoid too many writes
        const timeoutId = setTimeout(() => {
            setSessions(prev => {
                const existingIndex = prev.findIndex(s => s.id === currentSessionId)
                const sessionData: ChatSession = {
                    id: currentSessionId,
                    name: existingIndex >= 0 
                        ? prev[existingIndex].name 
                        : `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    createdAt: existingIndex >= 0 ? prev[existingIndex].createdAt : new Date(),
                    messages: [...messages],
                    userType: currentUserType
                }
                
                if (existingIndex >= 0) {
                    const updated = [...prev]
                    updated[existingIndex] = sessionData
                    return updated
                }
                return [sessionData, ...prev]
            })
            
            // Also save current session reference
            localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({
                id: currentSessionId,
                userType: currentUserType
            }))
        }, 1000) // 1 second debounce
        
        return () => clearTimeout(timeoutId)
    }, [messages, currentSessionId, currentUserType])

    // Save current session before switching
    const saveCurrentSession = useCallback((userType: "student" | "company") => {
        if (messages.length > 0) {
            setSessions(prev => {
                const existingIndex = prev.findIndex(s => s.id === currentSessionId)
                const sessionData: ChatSession = {
                    id: currentSessionId,
                    name: `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    createdAt: existingIndex >= 0 ? prev[existingIndex].createdAt : new Date(),
                    messages: [...messages],
                    userType
                }
                
                if (existingIndex >= 0) {
                    const updated = [...prev]
                    updated[existingIndex] = sessionData
                    return updated
                }
                return [sessionData, ...prev]
            })
        }
    }, [messages, currentSessionId])

    const toggleAIMode = useCallback(() => {
        setIsAIMode(prev => {
            if (!prev) {
                // Opening AI mode - restore from minimized if needed
                setPanelMinimized(false)
            }
            return !prev
        })
    }, [])

    const addMessage = useCallback((message: Omit<AIMessage, "id" | "timestamp">) => {
        const newMessage: AIMessage = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, newMessage])
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
        setChatPhase("intro")
        setWelcomeSent(false)
    }, [])

    const startNewSession = useCallback((userType: "student" | "company") => {
        // Save current session first
        saveCurrentSession(userType)
        
        // Create new session
        const newSessionId = generateSessionId()
        setCurrentSessionId(newSessionId)
        setCurrentUserType(userType)
        setMessages([])
        setChatPhase("intro")
        setWelcomeSent(false)
        setInternshipMatches([])
        setStudentMatches([])
        setGeneratedPortfolio(null)
        
        // Update localStorage with new session reference
        localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({
            id: newSessionId,
            userType
        }))
    }, [saveCurrentSession])

    const loadSession = useCallback((sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
            setCurrentSessionId(session.id)
            setCurrentUserType(session.userType)
            setMessages(session.messages)
            setChatPhase("results")
            setWelcomeSent(true)
            
            // Update localStorage
            localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({
                id: session.id,
                userType: session.userType
            }))
        }
    }, [sessions])

    const deleteSession = useCallback((sessionId: string) => {
        setSessions(prev => {
            const updated = prev.filter(s => s.id !== sessionId)
            // Update localStorage
            if (updated.length > 0) {
                localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated))
            } else {
                localStorage.removeItem(SESSIONS_STORAGE_KEY)
            }
            return updated
        })
        if (sessionId === currentSessionId) {
            const newSessionId = generateSessionId()
            setCurrentSessionId(newSessionId)
            setMessages([])
            setChatPhase("intro")
            setWelcomeSent(false)
            localStorage.removeItem(CURRENT_SESSION_KEY)
        }
    }, [currentSessionId])

    const sendWelcomeMessage = useCallback((userType: "student" | "company") => {
        if (welcomeSent) return
        
        setWelcomeSent(true)
        setCurrentUserType(userType)
        
        const welcomeContent = userType === "company" 
            ? "👋 Hello! I'm Linky, your AI Talent Scout here at LynkSkill! I'm here to help you find the perfect candidates for your team without manually creating job postings.\n\nJust describe what kind of talent you're looking for - the skills needed, the type of role, experience level, or any specific requirements. I'll search through our student database and find the best matches for you!\n\n💡 Try something like: \"I need a React developer\" or \"Looking for a design intern with Figma skills\""
            : "👋 Hey there! I'm Linky, your AI Career Assistant here at LynkSkill! 🚀\n\nI'm here to help you build an awesome professional portfolio and find the perfect internship match for your skills and interests.\n\nTell me about yourself - What's your name, what are you studying, and what kind of work excites you? The more you share, the better I can help you stand out!"
        
        const newMessage: AIMessage = {
            id: `msg-welcome-${Date.now()}`,
            role: "assistant",
            content: welcomeContent,
            timestamp: new Date(),
            metadata: { type: "question" }
        }
        
        setMessages([newMessage])
        setChatPhase("gathering")
    }, [welcomeSent])

    return (
        <AIModeContext.Provider value={{
            isAIMode,
            toggleAIMode,
            messages,
            addMessage,
            clearMessages,
            isLoading,
            setIsLoading,
            internshipMatches,
            setInternshipMatches,
            studentMatches,
            setStudentMatches,
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
            setActiveTab,
            isPanelMinimized,
            setPanelMinimized
        }}>
            {children}
        </AIModeContext.Provider>
    )
}

export function useAIMode() {
    const context = useContext(AIModeContext)
    if (!context) {
        throw new Error("useAIMode must be used within an AIModeProvider")
    }
    return context
}
```

---

## 2. Main AI UI Components

### [components/ai-agent-view.tsx](components/ai-agent-view.tsx)
```tsx
"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Send, Sparkles, Plus, Search, FileText, Briefcase, BookOpen, Users, Calendar, MessageSquare, Bookmark, BarChart3, Loader2, ChevronDown, History, Trash2, X,
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

    useEffect(() => {
        sendWelcomeMessage(ut)
    }, [sendWelcomeMessage, ut])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isLoading])

    const handleScroll = useCallback(() => {
        const el = scrollContainerRef.current
        if (!el) return
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
        setShowScrollDown(!isNearBottom)
    }, [])

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

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

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto"
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
        }
    }, [input])

    const hasMessages = messages.length > 1

    return (
        <div className="relative flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">
            <AnimatePresence>
                {showHistory && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 272, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
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

            <div className="flex flex-1 flex-col min-w-0">
                <header className="flex flex-col gap-3 px-4 py-3 border-b border-border/40 bg-background/60 backdrop-blur-sm flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowHistory(!showHistory)}>
                            <History className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative h-10 w-10 flex-shrink-0">
                                <Image src="/Linky_head.png" alt="Linky" width={40} height={40} className="rounded-full" />
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-base font-semibold">Linky AI</h1>
                                    <Badge className="text-[10px] bg-gradient-to-r from-violet-600 to-purple-600">
                                        <Sparkles className="h-3 w-3 mr-1" /> AI Agent
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Guiding your {personaDescriptor}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ClerkIdentityBadge size="sm" showSecondaryText={false} />
                        <Button variant="ghost" size="sm" onClick={toggleAIMode}>
                            <X className="h-3.5 w-3.5" /> Exit
                        </Button>
                    </div>
                </header>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
                    {!hasMessages ? (
                        <div className="flex flex-col items-center justify-center h-full px-4">
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                                <div className="relative mx-auto mb-5 h-20 w-20">
                                    <Image src="/Linky_head.png" alt="Linky" width={80} height={80} className="rounded-full" />
                                </div>
                                <h2 className="text-2xl font-bold">{userType === "Student" ? "Hey there! 👋" : "Welcome back! 👋"}</h2>
                                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                    {userType === "Student" ? "I'm Linky, your AI career assistant..." : "I'm Linky, your AI talent assistant..."}
                                </p>
                            </motion.div>
                            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl">
                                {quickActions.map(action => (
                                    <button key={action.label} onClick={() => handleQuickAction(action.prompt)} className="flex flex-col items-center p-3 rounded-xl bg-card border hover:bg-violet-500/5 transition-all">
                                        <action.icon className="h-4 w-4 text-violet-600 mb-2" />
                                        <span className="text-[11px] font-medium">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
                            {messages.map(msg => (
                                <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    {msg.role === "assistant" && (
                                        <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 mt-1">
                                            <Image src="/Linky_head.png" alt="Linky" width={28} height={28} />
                                        </div>
                                    )}
                                    <div className={cn("rounded-2xl px-4 py-2.5", msg.role === "user" ? "bg-violet-600 text-white" : "bg-card border")}>
                                        <MarkdownRenderer content={msg.content} />
                                        {msg.metadata?.toolResults?.map((res, i) => (
                                            <AgentActionCard key={i} result={res} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-violet-500" />}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-background/80">
                    <div className="max-w-3xl mx-auto relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full rounded-xl bg-muted/50 px-4 py-2.5 pr-11 border focus:ring-2 focus:ring-violet-500/20"
                            placeholder="Message Linky..."
                            rows={1}
                        />
                        <Button onClick={handleSend} disabled={!input.trim()} className="absolute right-1.5 bottom-1.5 h-7 w-7">
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
```

---

## 3. Tool Result Cards

### [components/agent-action-card.tsx](components/agent-action-card.tsx)
```tsx
"use client"

import React from "react"
import { motion } from "framer-motion"
import {
    MapPin, DollarSign, Clock, Briefcase, ExternalLink, CheckCircle2, XCircle, Building2, User, Users, Calendar, MessageSquare, Star, BookOpen, FileText, TrendingUp, Bookmark, ChevronRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ToolResult {
    tool: string
    cardType: string
    title: string
    data: unknown
    success?: boolean
    error?: string
}

export function AgentActionCard({ result }: { result: ToolResult }) {
    const { cardType, title, data, error } = result
    if (error && !result.success) return <div className="p-3 text-red-500 border rounded">{error}</div>

    switch (cardType) {
        case "internship-list": return <div className="space-y-2">{ (data as any[]).map(i => <div key={i.id} className="p-2 border rounded">{i.title} - {i.company}</div>)}</div>
        case "stats": return <div className="grid grid-cols-2 gap-2">{Object.entries(data as any).map(([k, v]) => <div key={k} className="p-2 border rounded text-center"><p className="text-xl font-bold">{v as any}</p><p className="text-xs uppercase">{k}</p></div>)}</div>
        case "action-success": return <div className="p-3 bg-green-500/10 text-green-600 rounded border border-green-500/20 font-medium">✅ {title}</div>
        default: return null
    }
}
```

---

## 4. Backend APIs

### [app/api/assistant/agent/route.ts](app/api/assistant/agent/route.ts)
```typescript
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { executeTool } from "@/lib/agent-tools"
import { resolveEnhancedUserContext } from "@/lib/ai/user-context"
import { validateAndAuthorizeToolCall } from "@/lib/ai/authorize"
import { getToolsForContext } from "@/lib/ai/tool-registry"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { message, conversationHistory, userType } = await req.json()
        const contextResult = await resolveEnhancedUserContext(clerkId)
        if (!contextResult.success) return NextResponse.json({ error: "Context failed" }, { status: 401 })
        
        const ctx = contextResult.context
        const tools = getToolsForContext({ userType, permissions: new Set(ctx.permissions) })
        const openaiMessages: any[] = [
            { role: "system", content: "You are Linky, a full-featured AI agent for LynkSkill..." },
            ...conversationHistory,
            { role: "user", content: message }
        ]

        const collectedResults: any[] = []
        let iterations = 0
        while (iterations < 5) {
            iterations++
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: openaiMessages,
                tools,
                tool_choice: "auto"
            })
            const msg = completion.choices[0].message
            if (!msg.tool_calls) return NextResponse.json({ reply: msg.content, toolResults: collectedResults })

            openaiMessages.push(msg)
            for (const tool of msg.tool_calls) {
                const args = JSON.parse(tool.function.arguments)
                const authResult = await validateAndAuthorizeToolCall(tool.function.name, args, ctx)
                if (authResult.allowed) {
                    const res = await executeTool(tool.function.name, authResult.args, ctx)
                    collectedResults.push(res)
                    openaiMessages.push({ role: "tool", tool_call_id: tool.id, content: JSON.stringify(res) })
                }
            }
        }
        return NextResponse.json({ reply: "Done", toolResults: collectedResults })
    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
```

---

## 5. Tool Definitions & Security

### [lib/ai/tool-registry.ts](lib/ai/tool-registry.ts)
```typescript
import { Permission } from "@prisma/client"
import { z } from "zod"

export const TOOL_REGISTRY: Record<string, any> = {
    search_internships: {
        audience: "STUDENT",
        permission: null,
        scope: "NONE",
        input: z.object({ query: z.string().optional(), location: z.string().optional() })
    },
    create_internship: {
        audience: "COMPANY",
        permission: Permission.CREATE_INTERNSHIPS,
        scope: "COMPANY_OWNED",
        input: z.object({ title: z.string(), description: z.string() })
    }
}

export function getToolsForContext({ userType, permissions }: any) {
    return Object.entries(TOOL_REGISTRY)
        .filter(([, def]: any) => (def.audience === "BOTH" || def.audience === userType.toUpperCase()))
        .map(([name, def]: any) => ({
            type: "function",
            function: { name, description: def.description, parameters: zodToJsonSchema(def.input) }
        }))
}
```

---

## 6. CSS Global Styles

### [app/globals.css](app/globals.css) (Relevant snippets)
```css
/* AI Mode Specific Styles */
.ai-gradient-text {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500;
}

.ai-panel-glass {
    @apply bg-background/80 backdrop-blur-xl border-l border-white/10 shadow-2xl;
}

.ai-bubble-user {
    @apply bg-violet-600 text-white rounded-2xl rounded-br-sm shadow-lg;
}

.ai-bubble-bot {
    @apply bg-muted/50 border border-border/50 rounded-2xl rounded-bl-sm;
}
```

---

## 7. Full Project Structure

This section documents the complete directory and file layout of the LynkSkill project.

```
LynkSkill/
|
+-- Root Config & Docs
|   +-- package.json                        # NPM dependencies & scripts
|   +-- next.config.ts                      # Next.js configuration
|   +-- tsconfig.json                       # TypeScript config (app)
|   +-- tsconfig.scripts.json               # TypeScript config (scripts)
|   +-- eslint.config.mjs                   # ESLint configuration
|   +-- postcss.config.mjs                  # PostCSS / Tailwind CSS setup
|   +-- middleware.ts                       # Clerk auth middleware (route protection)
|   +-- components.json                     # shadcn/ui component registry
|   +-- next-env.d.ts                       # Next.js TypeScript env declarations
|   +-- drop_types.sql                      # SQL helper to drop Supabase enum types
|   +-- README.md                           # General project readme
|   +-- Linky Ai.md                         # Linky AI implementation reference (this file)
|   +-- AI-MODE-EXECUTION-PLAN.md           # AI Mode feature execution plan
|   +-- UI-UX-IMPROVEMENT-PLAN.md           # UI/UX improvement roadmap
|
+-- app/                                    # Next.js App Router root
|   +-- layout.tsx                          # Root HTML layout (fonts, providers)
|   +-- page.tsx                            # Landing/home page
|   +-- globals.css                         # Global styles + AI Mode CSS tokens
|   +-- types.ts                            # Shared app-level TypeScript types
|   +-- robots.ts                           # robots.txt generation
|   +-- sitemap.ts                          # Sitemap XML generation
|   |
|   +-- api/                                # Next.js API Route Handlers
|   |   +-- applications/                   # Apply to internship, list applications
|   |   +-- assignments/                    # Assignment CRUD & submissions
|   |   +-- assistant/                      # Linky AI chat endpoint (streaming)
|   |   +-- candidates/                     # Company: browse & filter candidates
|   |   +-- check-user/                     # Verify user exists in DB
|   |   +-- cleanup/                        # Orphan data cleanup utilities
|   |   +-- companies/                      # Public company profile endpoints
|   |   +-- company/                        # Company-private data endpoints
|   |   +-- contact/                        # Contact form submission
|   |   +-- experience/                     # Student experience CRUD
|   |   +-- get-role/                       # Resolve current user role
|   |   +-- internship/                     # Single internship CRUD
|   |   +-- internships/                    # Internship listing & search
|   |   +-- interviews/                     # Schedule & manage interviews
|   |   +-- leaderboard/                    # Points & ranking data
|   |   +-- messages/                       # In-app messaging
|   |   +-- notifications/                  # Notification read/unread
|   |   +-- portfolio/                      # Student portfolio CRUD
|   |   +-- projects/                       # Portfolio project items
|   |   +-- public/                         # Publicly accessible profile data
|   |   +-- redirect-after-signin/          # Post-auth role redirect logic
|   |   +-- reviews/                        # Company/student reviews
|   |   +-- role/                           # Role assignment & switching
|   |   +-- saved-internships/              # Bookmark/unsave internships
|   |   +-- student/                        # Student-private data endpoints
|   |   +-- student-assignments/            # Student-side assignment actions
|   |   +-- sync-users/                     # Clerk DB user sync webhook
|   |   +-- upload-logo/                    # Company logo upload (Supabase storage)
|   |   +-- user/                           # Current user profile CRUD
|   |   +-- users/                          # Admin: list all users
|   |   +-- validate-eik/                   # Bulgarian company EIK validator
|   |
|   +-- dashboard/                          # Protected dashboard area
|   |   +-- student/                        # Student dashboard pages
|   |   |   +-- layout.tsx
|   |   |   +-- page.tsx                    # Student home overview
|   |   |   +-- internships/                # Browse & apply to internships
|   |   |   +-- interviews/                 # Upcoming interviews
|   |   |   +-- experience/                 # Add/edit work experience
|   |   |   +-- portfolio/                  # Manage portfolio & projects
|   |   |   +-- messages/                   # Inbox
|   |   |   +-- settings/                   # Account & notification settings
|   |   |   +-- help/                       # Help centre
|   |   |
|   |   +-- company/                        # Company dashboard pages
|   |   |   +-- layout.tsx
|   |   |   +-- page.tsx                    # Company home overview
|   |   |   +-- internships/                # Manage posted internships
|   |   |   +-- applications/               # Review incoming applications
|   |   |   +-- candidates/                 # Browse candidate pool
|   |   |   +-- interviews/                 # Schedule & track interviews
|   |   |   +-- invitations/                # Team invitations management
|   |   |   +-- leaderboard/                # Applicant ranking
|   |   |   +-- messages/                   # Inbox
|   |   |   +-- team/                       # Team member management
|   |   |   +-- experience/                 # Company experience records
|   |   |   +-- settings/                   # Company profile & settings
|   |   |   +-- help/                       # Help centre
|   |   |
|   |   +-- team-member/                    # Team-member (sub-account) pages
|   |       +-- layout.tsx
|   |       +-- page.tsx
|   |       +-- applications/
|   |       +-- candidates/
|   |       +-- experience/
|   |       +-- internships/
|   |       +-- interviews/
|   |       +-- messages/
|   |       +-- settings/
|   |       +-- team/
|   |
|   +-- onboarding/                         # New-user onboarding flow
|   |   +-- layout.tsx
|   |   +-- page.tsx
|   |   +-- _actions.ts                     # Server actions for onboarding steps
|   |
|   +-- assignments/[id]/                   # Public assignment detail page
|   +-- invitations/                        # Accept team invitation landing
|   +-- redirect-after-signin/              # Clerk post-sign-in redirect page
|   +-- help/                               # Public help / FAQ page
|   +-- privacy/                            # Privacy policy page
|   +-- terms/                              # Terms of service page
|
+-- components/                             # Reusable React components
|   |
|   +-- ui/                                 # shadcn/ui primitives
|   |   +-- accordion.tsx
|   |   +-- alert-dialog.tsx / alert.tsx
|   |   +-- avatar.tsx / badge.tsx
|   |   +-- button.tsx / card.tsx
|   |   +-- calendar.tsx / chart.tsx
|   |   +-- checkbox.tsx / collapsible.tsx
|   |   +-- dialog.tsx / dropdown-menu.tsx
|   |   +-- form.tsx / input.tsx / label.tsx
|   |   +-- popover.tsx / progress.tsx
|   |   +-- radio-group.tsx / scroll-area.tsx
|   |   +-- select.tsx / separator.tsx
|   |   +-- sheet.tsx / skeleton.tsx
|   |   +-- slider.tsx / switch.tsx
|   |   +-- tabs.tsx / textarea.tsx / tooltip.tsx
|   |
|   +-- landing/                            # Public landing page sections
|   |   +-- hero-section.tsx
|   |   +-- features-overview.tsx
|   |   +-- services-section.tsx / service-card.tsx
|   |   +-- how-it-works.tsx
|   |   +-- stats-section.tsx
|   |   +-- testimonials-section.tsx
|   |   +-- faq-section.tsx
|   |   +-- footer-cta.tsx
|   |
|   +-- dashboard/                          # Dashboard shell & layout pieces
|   |   +-- dashboard-shell.tsx
|   |   +-- dashboard-providers.tsx
|   |   +-- sidebar-nav.tsx
|   |   +-- page-transition.tsx
|   |   +-- home-content.tsx
|   |   +-- student.tsx                     # Student-specific dashboard wrapper
|   |   +-- company.tsx                     # Company-specific dashboard wrapper
|   |   +-- home-icon.tsx / portfolio-icon.tsx
|   |
|   +-- team/                               # Team management modals & UI
|   |   +-- index.ts
|   |   +-- member-list.tsx
|   |   +-- invite-member-modal.tsx
|   |   +-- edit-member-modal.tsx
|   |   +-- role-badge.tsx / roles-list.tsx
|   |   +-- pending-invitations.tsx
|   |   +-- ownership-transfer-section.tsx
|   |   +-- team-code-settings.tsx
|   |
|   +-- animate-ui/                         # Motion/animation primitives
|   |   +-- icons/
|   |   +-- primitives/
|   |
|   +-- [AI / Linky Components]
|   |   +-- ai-mode-toggle.tsx              # Toggle button switching AI mode on/off
|   |   +-- ai-chat-panel.tsx               # Sliding AI chat sidebar panel
|   |   +-- ai-agent-view.tsx               # Full-screen agent mode view
|   |   +-- agent-action-card.tsx           # Card for each agent tool result
|   |   +-- student-ai-chat.tsx             # Student-flavoured chat wrapper
|   |   +-- company-ai-chat.tsx             # Company-flavoured chat wrapper
|   |   +-- AIAssistant.tsx                 # Floating Linky assistant bubble
|   |   +-- AIMascotScene.tsx               # 3-D Linky mascot scene (AI mode)
|   |   +-- MascotScene.tsx                 # 3-D Linky mascot scene (general)
|   |
|   +-- [Internship & Application Components]
|   |   +-- internship-modal.tsx            # View internship details (student)
|   |   +-- internship-details-modal.tsx    # Extended details modal
|   |   +-- internship-manage-modal.tsx     # Create/edit internship (company)
|   |   +-- internship-filters.tsx          # Search filter bar
|   |   +-- apply-tab-content.tsx           # "Apply" tab in student dashboard
|   |   +-- ApplyBtn.tsx                    # One-click apply button
|   |   +-- cover-letter-modal.tsx          # Cover letter compose modal
|   |   +-- cover-letter-viewer.tsx         # Read-only cover letter viewer
|   |   +-- bookmark-button.tsx             # Save/unsave internship
|   |
|   +-- [Assignment Components]
|   |   +-- assignments-tab-content.tsx     # Assignments list tab
|   |   +-- assignment-submit-modal.tsx     # Submit assignment work
|   |   +-- active-assignments-section.tsx  # Dashboard active assignments widget
|   |   +-- company-assignment-progress-modal.tsx
|   |
|   +-- [Messaging & Notifications]
|   |   +-- messages-tab-content.tsx        # Messages inbox tab
|   |   +-- notification-bell.tsx           # Header notification bell
|   |   +-- schedule-interview-modal.tsx    # Schedule/reschedule interview
|   |
|   +-- [Profile & Portfolio]
|   |   +-- portfolio.tsx                   # Student portfolio display
|   |   +-- student-summary.tsx             # Student quick-summary card
|   |   +-- my-experience-tab-content.tsx   # Experience items tab
|   |   +-- review-modal.tsx                # Leave a review modal
|   |
|   +-- [Dashboard Layout & Navigation]
|   |   +-- dashboard-layout.tsx            # Top-level dashboard layout wrapper
|   |   +-- dashboard-header.tsx            # Top navigation bar
|   |   +-- dashboard-sidebar.tsx           # Left sidebar navigation
|   |   +-- dashboard-hero.tsx              # Dashboard hero / greeting banner
|   |   +-- navigation-loader.tsx           # Route-change loading indicator
|   |   +-- user-menu.tsx                   # Avatar dropdown menu
|   |
|   +-- [Landing & Marketing]
|   |   +-- hero-section.tsx                # Landing hero (top-level wrapper)
|   |   +-- hero-skeleton.tsx               # Hero loading skeleton
|   |   +-- landing-theme-toggle.tsx        # Light/dark toggle on landing
|   |   +-- community-highlights-section.tsx
|   |
|   +-- [Location & Maps]
|   |   +-- location-picker.tsx             # Map-based location input
|   |   +-- location-picker-map-events.tsx  # Leaflet event handlers
|   |
|   +-- [Utility / Shared]
|       +-- MarkdownRenderer.tsx            # Render markdown (AI responses etc.)
|       +-- file-upload.tsx                 # Drag-and-drop file uploader
|       +-- language-switcher.tsx           # EN/BG locale switcher
|       +-- theme-toggle.tsx / theme-provider.tsx
|       +-- error-boundary.tsx              # React error boundary
|       +-- clerk-identity-badge.tsx        # Clerk user identity chip
|       +-- clerk-theme.tsx                 # Clerk UI theme customisation
|       +-- redirect-after-sign-in.tsx
|       +-- pulsing-border-shader.tsx       # Animated shader border effect
|       +-- creative.tsx                    # Creative/decorative element
|       +-- BookOpenCheckIcon.tsx           # Custom icon
|       +-- leaderboard-tab-content.tsx
|       +-- interviews-tab-content.tsx
|       +-- saved-internships-tab.tsx
|       +-- team-tab-content.tsx
|       +-- recent-applications-section.tsx
|       +-- recent-internships-section.tsx
|       +-- company-policy-modal.tsx / student-policy-modal.tsx
|       +-- card-skeleton.tsx / list-skeleton.tsx / tutorial-skeleton.tsx
|
+-- lib/                                    # Server-side & shared utilities
|   +-- prisma.ts                           # Prisma client singleton
|   +-- openai.ts                           # OpenAI client + streaming helpers
|   +-- agent-tools.ts                      # Linky AI tool definitions (all tools)
|   +-- ai-mode-context.tsx                 # AI Mode React context & session state
|   +-- dashboard-context.tsx               # Dashboard data React context
|   +-- dashboard-data.tsx                  # Server-side dashboard data fetchers
|   +-- navigation-context.tsx              # Active-route navigation context
|   +-- settings-context.tsx                # User settings React context
|   +-- team-member-permissions-context.tsx # Team member role permissions context
|   +-- clerk.ts                            # Clerk server-side helpers
|   +-- company-code.ts                     # Company join-code generation/validation
|   +-- email.ts                            # Transactional email (Resend)
|   +-- file-utils.ts                       # File type/size validation helpers
|   +-- notifications.ts                    # Notification creation helpers
|   +-- permissions.ts                      # Role-based permission checks
|   +-- rate-limit.ts                       # API rate-limiting utility
|   +-- role-permissions.ts                 # Granular role permission matrix
|   +-- security.ts                         # Input sanitisation & security utils
|   +-- server-data.ts                      # Generic server data access helpers
|   +-- supabaseAdmin.ts                    # Supabase admin client (storage)
|   +-- cleanup-utils.ts                    # Orphan record cleanup helpers
|   +-- utils.ts                            # General utility functions (cn, etc.)
|   +-- validateEIK.ts                      # Bulgarian EIK validation logic
|   |
|   +-- ai/                                 # AI subsystem internals
|   |   +-- tool-registry.ts                # Maps tool names to handler functions
|   |   +-- authorize.ts                    # AI request auth & quota checks
|   |   +-- user-context.ts                 # Builds user context for prompts
|   |   +-- __tests__/                      # Unit tests for AI tools
|   |
|   +-- i18n/                               # Internationalisation
|       +-- index.tsx                       # i18n provider & useTranslation hook
|       +-- translations/                   # EN / BG translation JSON files
|
+-- hooks/                                  # Custom React hooks
|   +-- use-is-in-view.tsx                  # Intersection Observer hook
|
+-- pages/                                  # Legacy Next.js Pages Router (minimal)
|   +-- _app.tsx                            # Custom App wrapper
|   +-- sign-up.tsx                         # Sign-up page (Clerk)
|   +-- student-dashboard.tsx               # Legacy student dashboard page
|   +-- company-dashboard.tsx               # Legacy company dashboard page
|
+-- prisma/
|   +-- schema.prisma                       # Database schema (PostgreSQL via Supabase)
|
+-- types/
|   +-- globals.d.ts                        # Global TypeScript ambient declarations
|
+-- scripts/                                # One-off maintenance scripts
|   +-- syncVectors.ts                      # Sync embeddings to vector store
|   +-- backfill-company-codes.ts           # Backfill legacy company codes
|   +-- migrate-company-owners.ts           # Migrate ownership records
|
+-- plans/                                  # Strategy & planning documents
|   +-- team-member-code-system.md
|   +-- team-roles-workflow-diagrams.md
|   +-- google-indexing-ranking-strategy.md
|   +-- google-indexing-ranking-strategy-complete.md
|   +-- link-building-strategy.md
|   +-- link-building-strategy-part2.md
|   +-- link-building-strategy-complete.md
|   +-- on-page-content-optimization-strategy.md
|
+-- public/                                 # Static assets served at /
    +-- LynkSkill-logo.png / LynkSkill-logo-full.png
    +-- Linky-head-logo.png / Linky_head.png
    +-- linky-mascot.png / linky-mascot-boss.png
    +-- linky-mascot-left.png / linky-mascot-portfolio.png
    +-- opengrapgh.png / placeholder.png / raw.png
    +-- professional-man.jpg
    +-- professional-woman-designer.png / professional-woman-diverse.png
    +-- scenes/                             # 3-D scene assets for mascot animations
```

---

### Architecture Overview

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Auth** | Clerk | Authentication, sessions, user management |
| **Database** | PostgreSQL (Supabase) + Prisma ORM | Data persistence |
| **Storage** | Supabase Storage | File & image uploads |
| **AI** | OpenAI GPT-4o (streaming) | Linky AI chat & agent tools |
| **Styling** | Tailwind CSS + shadcn/ui | Component-based UI system |
| **Email** | Resend | Transactional emails |
| **i18n** | Custom hook + JSON translations | English / Bulgarian |
| **Roles** | Student · Company · Team Member | Three user types with distinct dashboards |

---

### Key Data Flow — Linky AI Chat

```
User message
    |
    v
components/[student|company]-ai-chat.tsx   (captures input)
    |
    v
lib/ai-mode-context.tsx                    (manages session & history)
    |
    v
POST /api/assistant                        (streaming API route)
    |
    v
lib/ai/tool-registry.ts                    (resolves tool calls)
    |
    v
lib/agent-tools.ts                         (executes Prisma queries / logic)
    |
    v
Streaming response
    |
    v
components/ai-chat-panel.tsx
    |
    v
components/MarkdownRenderer.tsx            (renders final output)
```
