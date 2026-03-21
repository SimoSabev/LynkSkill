"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, MessageCircle } from "lucide-react"

interface BriefingData {
    greeting: string
    highlights: { icon: string; text: string; action?: string }[]
    suggestedPrompt: string
}

interface LinkyDailyBriefingProps {
    userType: "Student" | "Company"
    onOpenLinky?: (prompt?: string) => void
}

export function LinkyDailyBriefing({ userType, onOpenLinky }: LinkyDailyBriefingProps) {
    const [briefing, setBriefing] = useState<BriefingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBriefing()
    }, [userType])

    async function fetchBriefing() {
        try {
            const res = await fetch("/api/assistant/daily-briefing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userType: userType.toLowerCase() }),
            })
            if (res.ok) {
                const data = await res.json()
                setBriefing(data)
            }
        } catch {
            // Fallback briefing
            setBriefing({
                greeting: userType === "Student"
                    ? "Hey! Ready to find your next opportunity? 🚀"
                    : "Good to see you! Let's find your next star intern. ⭐",
                highlights: [],
                suggestedPrompt: userType === "Student"
                    ? "Find me internships that match my skills"
                    : "Show me my pending applications",
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-indigo-600/10 border border-purple-500/20 p-6 animate-pulse">
                <div className="h-6 w-48 bg-purple-500/20 rounded mb-3" />
                <div className="h-4 w-72 bg-purple-500/10 rounded" />
            </div>
        )
    }

    if (!briefing) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-indigo-600/10 border border-purple-500/20 p-6"
        >
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1 space-y-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            Linky&apos;s Daily Briefing
                        </h3>
                        <p className="text-sm text-zinc-300 mt-1">{briefing.greeting}</p>
                    </div>

                    {briefing.highlights.length > 0 && (
                        <ul className="space-y-2">
                            {briefing.highlights.map((h, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <span>{h.icon}</span>
                                    <span>{h.text}</span>
                                    {h.action && onOpenLinky && (
                                        <button
                                            onClick={() => onOpenLinky(h.action)}
                                            className="ml-auto text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1"
                                        >
                                            Let Linky handle it <ArrowRight className="h-3 w-3" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        onClick={() => onOpenLinky?.(briefing.suggestedPrompt)}
                        className="mt-2 flex items-center gap-2 rounded-xl bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition-colors"
                    >
                        <MessageCircle className="h-4 w-4" />
                        {briefing.suggestedPrompt}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
