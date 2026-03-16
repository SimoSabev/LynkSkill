"use client"

import { motion } from "framer-motion"
import { Sparkles, Zap } from "lucide-react"
import { useAIMode } from "@/lib/ai-mode-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

export function AIModeToggle() {
    const { isAIMode, toggleAIMode } = useAIMode()
    const { t: _t } = useTranslation()

    return (
        <motion.button
            onClick={toggleAIMode}
            className={cn(
                "relative group flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-500 overflow-hidden",
                isAIMode
                    ? "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 hover:from-purple-500/20 hover:via-violet-500/20 hover:to-indigo-500/20 border border-purple-500/30"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Animated background glow */}
            {isAIMode && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-violet-400/20 to-indigo-400/20"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}

            {/* Sparkle particles when active */}
            {isAIMode && (
                <>
                    <motion.div
                        className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full"
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                            y: [0, -10, -20],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: 0,
                        }}
                    />
                    <motion.div
                        className="absolute bottom-2 right-4 w-1 h-1 bg-white rounded-full"
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.2, 0],
                            y: [0, -8, -16],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: 0.5,
                        }}
                    />
                    <motion.div
                        className="absolute top-2 right-8 w-0.5 h-0.5 bg-white rounded-full"
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.3, 0],
                            y: [0, -12, -24],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: 1,
                        }}
                    />
                </>
            )}

            <motion.div
                animate={isAIMode ? { rotate: [0, 360] } : { rotate: 0 }}
                transition={{ duration: 3, repeat: isAIMode ? Infinity : 0, ease: "linear" }}
                className="relative z-10"
            >
                {isAIMode ? (
                    <Zap className="h-4 w-4" />
                ) : (
                    <Sparkles className="h-4 w-4" />
                )}
            </motion.div>

            <span className="relative z-10 whitespace-nowrap font-extrabold tracking-wide">
                AI Profiler
            </span>

            {/* Status badge: Beta or ON */}
            {isAIMode ? (
                <span className="relative z-10 px-1.5 py-0.5 text-[10px] font-bold leading-none uppercase tracking-wider rounded-md bg-green-500 text-white shadow-sm">
                    ON
                </span>
            ) : (
                <span className="relative z-10 px-1.5 py-0.5 text-[10px] font-bold leading-none uppercase tracking-wider rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-sm">
                    Beta
                </span>
            )}

            {/* Pulsing ring when active */}
            {isAIMode && (
                <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/30"
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </motion.button>
    )
}
