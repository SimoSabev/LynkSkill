"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react"
import { useTranslation } from "@/lib/i18n"

// Generate unique session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// LocalStorage keys
const SESSIONS_STORAGE_KEY = "lynkskill_ai_sessions"
const CURRENT_SESSION_KEY = "lynkskill_current_session"

// Helper to safely parse JSON from localStorage
// Generation: Session ID helper remains if needed

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
        suggestions?: string[]
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
    aiProfileData: Record<string, unknown> | null
    setAiProfileData: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
    confidenceScore: number
    setConfidenceScore: React.Dispatch<React.SetStateAction<number>>
    profilingProgress: number
    setProfilingProgress: (progress: number) => void
    chatPhase: "intro" | "gathering" | "portfolio" | "matching" | "results" | "profiling" | "deepDive" | "complete"
    setChatPhase: (phase: "intro" | "gathering" | "portfolio" | "matching" | "results" | "profiling" | "deepDive" | "complete") => void
    sendWelcomeMessage: (userType: "student" | "company") => void
    welcomeSent: boolean
    // Session management
    currentSessionId: string
    sessions: ChatSession[]
    startNewSession: (userType: "student" | "company") => void
    loadSession: (sessionId: string) => void
    deleteSession: (sessionId: string) => void
    refreshSessions: () => Promise<void>
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
    const [aiProfileData, setAiProfileData] = useState<Record<string, unknown> | null>(null)
    const [confidenceScore, setConfidenceScore] = useState<number>(0)
    const [profilingProgress, setProfilingProgress] = useState<number>(0)
    const [chatPhase, setChatPhase] = useState<"intro" | "gathering" | "portfolio" | "matching" | "results" | "profiling" | "deepDive" | "complete">("intro")
    const [welcomeSent, setWelcomeSent] = useState(false)
    
    // Session management - initialize from localStorage
    const [currentSessionId, setCurrentSessionId] = useState(() => generateSessionId())
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentUserType, setCurrentUserType] = useState<"student" | "company">("student")
    const isInitialized = useRef(false)

    // Panel & tab tracking
    const [activeTab, setActiveTab] = useState("home")
    const [isPanelMinimized, setPanelMinimized] = useState(false)

    // Translation hook at component level
    const { t } = useTranslation()

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
    }, [setSessions])

    // Load sessions from API on mount
    useEffect(() => {
        if (isInitialized.current) return
        isInitialized.current = true
        refreshSessions()
    }, [refreshSessions])

    const toggleAIMode = useCallback(() => {
        setIsAIMode(prev => {
            if (prev) {
                // Resetting when turning off
                setMessages([])
                setChatPhase("intro")
                setWelcomeSent(false)
                setCurrentSessionId(generateSessionId())
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
        setCurrentSessionId(generateSessionId())
    }, [])

    const startNewSession = useCallback((userType: "student" | "company") => {
        const newSessionId = generateSessionId()
        setCurrentSessionId(newSessionId)
        setCurrentUserType(userType)
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
            setCurrentUserType(data.userType || "student")
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
        
        // Note: The dynamic AI welcome is now securely triggered by the ai-agent-view component natively on load.
        // We only update phase state here!
        setChatPhase(userType === "student" ? "profiling" : "gathering")
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
            aiProfileData,
            setAiProfileData,
            confidenceScore,
            setConfidenceScore,
            profilingProgress,
            setProfilingProgress,
            chatPhase,
            setChatPhase,
            sendWelcomeMessage,
            welcomeSent,
            currentSessionId,
            sessions,
            startNewSession,
            loadSession,
            deleteSession,
            refreshSessions,
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
