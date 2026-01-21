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
        type?: "portfolio" | "match" | "question" | "search"
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
            if (prev) {
                // Resetting when turning off
                setMessages([])
                setChatPhase("intro")
                setInternshipMatches([])
                setStudentMatches([])
                setGeneratedPortfolio(null)
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
            deleteSession
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
