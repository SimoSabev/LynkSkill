"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react"

// Generate unique session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// LocalStorage helpers
const CURRENT_SESSION_KEY = "lynkskill_current_session"

function getStoredCurrentSession() {
    if (typeof window === "undefined") return null
    return localStorage.getItem(CURRENT_SESSION_KEY)
}

function setStoredCurrentSession(sessionId: string) {
    if (typeof window === "undefined") return
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId)
}

function getStoredUserType(): "student" | "company" | null {
    if (typeof window === "undefined") return null
    const val = localStorage.getItem("lynkskill_ai_user_type")
    return (val === "student" || val === "company") ? val : null
}

function setStoredUserType(userType: "student" | "company") {
    if (typeof window === "undefined") return
    localStorage.setItem("lynkskill_ai_user_type", userType)
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIMessage {
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
        suggestions?: string[]
    }
}

export interface ChatSession {
    id: string
    name: string
    createdAt: Date
    messages: AIMessage[]
    userType: "student" | "company"
}

export interface ConfidenceScoreData {
    overallScore: number
    overall?: number // alias from calculateAndSaveConfidenceScore
    profileCompleteness: number
    profilingDepth: number
    endorsementQuality: number
    activityScore: number
}

interface AIModeContextType {
    // Core AI state
    isAIMode: boolean
    setAIMode: (open: boolean) => void
    openLinky: (prompt?: string) => void
    closeLinky: () => void
    toggleAIMode: () => void // backward compat

    // Messages
    messages: AIMessage[]
    addMessage: (message: Omit<AIMessage, "id" | "timestamp">) => void
    clearMessages: () => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    
    // AI message sending (registered by AIAgentView)
    sendMessage: ((text: string, isSilent?: boolean) => Promise<void>) | null
    registerSendMessage: (fn: ((text: string, isSilent?: boolean) => Promise<void>) | null) => void

    // Confidence Score (auto-updated)
    confidenceScore: ConfidenceScoreData | null
    refreshConfidenceScore: () => Promise<void>
    updateConfidenceFromStream: (score: ConfidenceScoreData) => void
    setConfidenceScore: React.Dispatch<React.SetStateAction<ConfidenceScoreData | null>>

    // Legacy state (used by older chat components)
    internshipMatches: unknown[]
    setInternshipMatches: (matches: unknown[]) => void
    studentMatches: unknown[]
    setStudentMatches: (matches: unknown[]) => void
    generatedPortfolio: Record<string, unknown> | null
    setGeneratedPortfolio: (portfolio: Record<string, unknown> | null) => void
    aiProfileData: Record<string, unknown> | null
    setAiProfileData: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
    profilingProgress: number
    setProfilingProgress: (progress: number) => void

    // Session management
    currentSessionId: string
    sessions: ChatSession[]
    startNewSession: (userType: "student" | "company") => void
    loadSession: (sessionId: string) => void
    deleteSession: (sessionId: string) => void
    refreshSessions: () => Promise<void>

    // Chat phase & welcome
    chatPhase: string
    setChatPhase: (phase: string) => void
    welcomeSent: boolean
    sendWelcomeMessage: (userType: "student" | "company") => void

    // Panel state
    activeTab: string
    setActiveTab: (tab: string) => void
    isPanelMinimized: boolean
    setPanelMinimized: (minimized: boolean) => void
}

const AIModeContext = createContext<AIModeContextType | undefined>(undefined)

export function AIModeProvider({ children }: { children: ReactNode }) {
    const [isAIMode, setIsAIModeState] = useState(false)
    const [messages, setMessages] = useState<AIMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [confidenceScore, setConfidenceScore] = useState<ConfidenceScoreData | null>(null)
    const [chatPhase, setChatPhase] = useState("intro")
    const [welcomeSent, setWelcomeSent] = useState(false)

    // Session management
    const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
        return getStoredCurrentSession() || generateSessionId()
    })
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentUserType, setCurrentUserType] = useState<"student" | "company">(
        () => getStoredUserType() || "student"
    )
    const isInitialized = useRef(false)
    
    // AI message sending callback (registered by AIAgentView)
    const [sendMessage, setSendMessage] = useState<((text: string, isSilent?: boolean) => Promise<void>) | null>(null)

    // Legacy state (backward compat for old chat components)
    const [internshipMatches, setInternshipMatches] = useState<unknown[]>([])
    const [studentMatches, setStudentMatches] = useState<unknown[]>([])
    const [generatedPortfolio, setGeneratedPortfolio] = useState<Record<string, unknown> | null>(null)
    const [aiProfileData, setAiProfileData] = useState<Record<string, unknown> | null>(null)
    const [profilingProgress, setProfilingProgress] = useState(0)

    // Panel state
    const [activeTab, setActiveTab] = useState("home")
    const [isPanelMinimized, setPanelMinimized] = useState(false)
    const pendingPromptRef = useRef<string | undefined>(undefined)

    // ─── AI Mode controls ────────────────────────────────────────────

    const setAIMode = useCallback((open: boolean) => {
        setIsAIModeState(open)
        if (!open) {
            // Reset state when closing
            setMessages([])
            setChatPhase("intro")
            setWelcomeSent(false)
            const nextId = generateSessionId()
            setCurrentSessionId(nextId)
            setStoredCurrentSession(nextId)
        }
    }, [])

    const toggleAIMode = useCallback(() => setAIMode(!isAIMode), [setAIMode, isAIMode])
const openLinky = useCallback((prompt?: string) => {
    // Check if prompt is actually an event object (common mistake)
    if (prompt && typeof prompt !== 'string') {
        // It's likely an event object, ignore it
        console.warn('openLinky called with non-string argument, ignoring')
        setIsAIModeState(true)
        return
    }
    setIsAIModeState(true)
    if (prompt) {
        // Store the prompt to be sent after the component mounts
        pendingPromptRef.current = prompt
    }
}, [sendMessage])

const closeLinky = useCallback(() => {
        setIsAIModeState(false)
        setMessages([])
        setChatPhase("intro")
        setWelcomeSent(false)
        const nextId = generateSessionId()
        setCurrentSessionId(nextId)
        setStoredCurrentSession(nextId)
    }, [])

    // ─── Confidence Score ────────────────────────────────────────────

    const refreshConfidenceScore = useCallback(async () => {
        try {
            const res = await fetch("/api/confidence-score")
            if (!res.ok) return
            const data = await res.json()
            setConfidenceScore({
                overallScore: data.overallScore ?? data.overall ?? 0,
                profileCompleteness: data.profileCompleteness ?? 0,
                profilingDepth: data.profilingDepth ?? 0,
                endorsementQuality: data.endorsementQuality ?? 0,
                activityScore: data.activityScore ?? 0,
            })
        } catch {
            // Silently fail — score will show as null
        }
    }, [])

    const updateConfidenceFromStream = useCallback((score: ConfidenceScoreData) => {
        setConfidenceScore(score)
    }, [])

    // Fetch confidence score on mount
    useEffect(() => {
        refreshConfidenceScore()
    }, [refreshConfidenceScore])

    // ─── Messages ────────────────────────────────────────────────────

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
        const nextId = generateSessionId()
        setCurrentSessionId(nextId)
        setStoredCurrentSession(nextId)
    }, [])

    // Handle prompt when opening Linky
    useEffect(() => {
        if (isAIMode && pendingPromptRef.current && sendMessage) {
            const prompt = pendingPromptRef.current
            pendingPromptRef.current = undefined
            // Use setTimeout to ensure the component is fully mounted
            setTimeout(() => {
                sendMessage(prompt, false)
            }, 100)
        }
    }, [isAIMode, sendMessage])

    // ─── Sessions ────────────────────────────────────────────────────

    const refreshSessions = useCallback(async () => {
        try {
            const res = await fetch("/api/ai-sessions")
            const data = await res.json()
            const sessionsList = data.sessions || (Array.isArray(data) ? data : [])
            setSessions(sessionsList.map((s: { id: string, name: string, createdAt: string, userType: "student" | "company" }) => ({
                id: s.id,
                name: s.name,
                createdAt: new Date(s.createdAt),
                messages: [],
                userType: s.userType || "student"
            })))
        } catch (err) {
            console.error("Failed to fetch sessions", err)
        }
    }, [])

    const startNewSession = useCallback((userType: "student" | "company") => {
        const newSessionId = generateSessionId()
        setCurrentSessionId(newSessionId)
        setStoredCurrentSession(newSessionId)
        setCurrentUserType(userType)
        setStoredUserType(userType)
        setMessages([])
        setChatPhase("intro")
        setWelcomeSent(false)
    }, [])

    const loadSession = useCallback(async (sessionId: string) => {
        try {
            const res = await fetch(`/api/ai-sessions?sessionId=${sessionId}`)
            if (!res.ok) throw new Error("Failed to load session")
            const data = await res.json()

            setCurrentSessionId(sessionId)
            setStoredCurrentSession(sessionId)
            const ut = data.userType || "student"
            setCurrentUserType(ut)
            setStoredUserType(ut)
            setMessages(data.messages.map((m: { id: string, role: "user" | "assistant", content: string, createdAt: string, metadata?: AIMessage["metadata"] }) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt),
                metadata: m.metadata || {}
            })))
            setChatPhase("results")
            setWelcomeSent(true)
        } catch (err) {
            console.error(err)
        }
    }, [])

    const deleteSession = useCallback(async (sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        if (sessionId === currentSessionId) {
            startNewSession(currentUserType)
        }

        try {
            await fetch(`/api/ai-sessions`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId })
            })
        } catch (err) {
            console.error("Failed to delete session", err)
        }
    }, [currentSessionId, currentUserType, startNewSession])

    const sendWelcomeMessage = useCallback((userType: "student" | "company") => {
        if (welcomeSent) return
        setWelcomeSent(true)
        setCurrentUserType(userType)
        setStoredUserType(userType)
        setChatPhase(userType === "student" ? "profiling" : "gathering")
    }, [welcomeSent])

    // Load sessions on mount
    useEffect(() => {
        if (isInitialized.current) return
        isInitialized.current = true
        refreshSessions().then(() => {
            const stored = getStoredCurrentSession()
            if (stored) {
                loadSession(stored)
            }
        })
    }, [refreshSessions, loadSession])

    const registerSendMessage = useCallback((fn: ((text: string, isSilent?: boolean) => Promise<void>) | null) => {
        setSendMessage(() => fn)
    }, [])

    return (
        <AIModeContext.Provider value={{
            isAIMode,
            setAIMode,
            openLinky,
            closeLinky,
            toggleAIMode,
            messages,
            addMessage,
            clearMessages,
            isLoading,
            setIsLoading,
            confidenceScore,
            refreshConfidenceScore,
            updateConfidenceFromStream,
            setConfidenceScore,
            internshipMatches,
            setInternshipMatches,
            studentMatches,
            setStudentMatches,
            generatedPortfolio,
            setGeneratedPortfolio,
            aiProfileData,
            setAiProfileData,
            profilingProgress,
            setProfilingProgress,
            currentSessionId,
            sessions,
            startNewSession,
            loadSession,
            deleteSession,
            refreshSessions,
            chatPhase,
            setChatPhase,
            welcomeSent,
            sendWelcomeMessage,
            activeTab,
            setActiveTab,
            isPanelMinimized,
            setPanelMinimized,
            sendMessage,
            registerSendMessage
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
