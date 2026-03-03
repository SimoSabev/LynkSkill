"use client"

import { useState, useRef, useEffect } from "react"
import AIMascotScene from "./AIMascotScene"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { useTranslation } from "@/lib/i18n"

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: number
}

interface AIAssistantProps {
    portfolio: {
        fullName?: string
        headline?: string | null
        bio?: string | null
        skills?: string | null
        projects?: string | null
        experience?: string | null
        education?: string | null
        linkedin?: string | null
        github?: string | null
        portfolioUrl?: string | null
    }
    studentId?: string
}

type AssistantMode = 'audit' | 'chat'

export default function AIAssistant({ portfolio, studentId }: AIAssistantProps) {
    const { t } = useTranslation()
    const [mode, setMode] = useState<AssistantMode>('audit')
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [showMascot, setShowMascot] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [currentReply, setCurrentReply] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleGenerateAudit = async () => {
        setLoading(true)
        setShowMascot(true)
        setCurrentReply(t("aiAssistant.analyzingPortfolio"))

        try {
            // Validate required fields
            if (!portfolio?.fullName) {
                setCurrentReply(t("aiAssistant.provideFullName"))
                setLoading(false)
                return
            }

            const payload = JSON.stringify({
                type: "portfolio-audit",
                portfolio: {
                    fullName: portfolio.fullName,
                    headline: portfolio.headline || null,
                    bio: portfolio.bio || null,
                    skills: portfolio.skills || null,
                    projects: portfolio.projects || null,
                    experience: portfolio.experience || null,
                    education: portfolio.education || null,
                    linkedin: portfolio.linkedin || null,
                    github: portfolio.github || null,
                    portfolioUrl: portfolio.portfolioUrl || null,
                },
                studentId: studentId || portfolio.fullName
            })

            // Validate payload size (max 10KB)
            if (payload.length > 10240) {
                setCurrentReply(t("aiAssistant.dataTooLarge"))
                setLoading(false)
                return
            }

            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
            })

            const data = await res.json()

            if (data.reply) {
                setCurrentReply(data.reply)

                // Add assistant message to chat history
                const assistantMessage: ChatMessage = {
                    id: `msg-${Date.now()}`,
                    role: "assistant",
                    content: data.reply,
                    timestamp: Date.now()
                }
                setMessages([assistantMessage])

                // Switch to chat mode after successful audit
                setMode('chat')
            } else if (data.error) {
                setCurrentReply(data.error)
            } else {
                setCurrentReply(t("aiAssistant.noValidResponse"))
            }
        } catch (err) {
            console.error("AI error:", err)
            setCurrentReply(t("aiAssistant.somethingWentWrongReport"))
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async () => {
        const message = inputValue.trim()
        if (!message || loading) return

        // Add user message to chat
        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: message,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setLoading(true)
        setShowMascot(true)
        setCurrentReply(t("aiAssistant.thinking"))

        try {
            const payload = JSON.stringify({
                type: "chat",
                message,
                portfolio: {
                    fullName: portfolio.fullName,
                    headline: portfolio.headline || null,
                    bio: portfolio.bio || null,
                    skills: portfolio.skills || null,
                    projects: portfolio.projects || null,
                    experience: portfolio.experience || null,
                    education: portfolio.education || null,
                    linkedin: portfolio.linkedin || null,
                    github: portfolio.github || null,
                    portfolioUrl: portfolio.portfolioUrl || null,
                },
                studentId: studentId || portfolio.fullName
            })

            // Validate payload size (max 10KB)
            if (payload.length > 10240) {
                setCurrentReply(t("aiAssistant.messageTooLarge"))
                setLoading(false)
                return
            }

            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
            })

            const data = await res.json()

            if (data.reply) {
                setCurrentReply(data.reply)

                // Add assistant message to chat history
                const assistantMessage: ChatMessage = {
                    id: `msg-${Date.now()}`,
                    role: "assistant",
                    content: data.reply,
                    timestamp: Date.now()
                }
                setMessages(prev => [...prev, assistantMessage])
            } else if (data.error) {
                setCurrentReply(data.error)
            } else {
                setCurrentReply(t("aiAssistant.noValidResponse"))
            }
        } catch (err) {
            console.error("AI error:", err)
            setCurrentReply(t("aiAssistant.somethingWentWrong"))
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleResetAudit = () => {
        setMode('audit')
        setMessages([])
        setCurrentReply("")
        setShowMascot(false)
    }

    return (
        <div className="p-6 border rounded-xl max-w-xl mx-auto mt-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t("aiAssistant.portfolioAssistant")}</h2>
                {mode === 'chat' && (
                    <button
                        onClick={handleResetAudit}
                        className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                        {t("aiAssistant.generateNewAudit")}
                    </button>
                )}
            </div>

            {mode === 'audit' ? (
                // Initial state - Show audit generation button
                <div className="text-center">
                    <button
                        onClick={handleGenerateAudit}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-2xl font-semibold disabled:opacity-50 transition-all hover:scale-105"
                        disabled={loading}
                    >
                        {loading ? t("aiAssistant.generatingReport") : t("aiAssistant.generatePortfolioReport")}
                    </button>
                    <p className="text-sm text-muted-foreground mt-3">
                        {t("aiAssistant.comprehensiveAnalysis")}
                    </p>
                </div>
            ) : (
                // Chat mode - Show chat interface
                <div className="flex flex-col space-y-4">
                    {/* Chat messages display */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {messages.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                {t("aiAssistant.noMessagesYet")}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                                msg.role === 'user'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <MarkdownRenderer content={msg.content} />
                                            ) : (
                                                <div className="text-sm whitespace-pre-wrap break-words">
                                                    {msg.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Chat input */}
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t("aiAssistant.askLinky")}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-purple-700 transition-colors"
                            disabled={loading || !inputValue.trim()}
                        >
                            {loading ? "..." : t("aiAssistant.send")}
                        </button>
                    </div>
                </div>
            )}

            {/* Show the mascot overlay */}
            {showMascot && (
                <AIMascotScene
                    aiReply={currentReply || t("aiAssistant.thinking")}
                    onClose={() => setShowMascot(false)}
                />
            )}
        </div>
    )
}
