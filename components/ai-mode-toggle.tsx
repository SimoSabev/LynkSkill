"use client"

import { motion } from "framer-motion"
import { Sparkles, Zap } from "lucide-react"
import { useAIMode } from "@/lib/ai-mode-context"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

export function AIModeToggle() {
    const { isAIMode, toggleAIMode, isPanelMinimized, setPanelMinimized } = useAIMode()
    const { t } = useTranslation()

    const handleClick = () => {
        if (isAIMode && isPanelMinimized) {
            // If AI mode is on but panel is minimized, restore it
            setPanelMinimized(false)
        } else {
            toggleAIMode()
        }
    }

    return (
        <motion.button
            onClick={handleClick}
            className={cn(
                "relative group flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden",
                isAIMode
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 hover:border-violet-500/30"
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
        >
            {/* Subtle animated glow when active */}
            {isAIMode && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10"
                    animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ backgroundSize: "200% 200%" }}
                />
            )}

            <motion.div
                animate={isAIMode ? { rotate: [0, 360] } : { rotate: 0 }}
                transition={{ duration: 4, repeat: isAIMode ? Infinity : 0, ease: "linear" }}
                className="relative z-10"
            >
                {isAIMode ? (
                    <Zap className="h-3.5 w-3.5" />
                ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                )}
            </motion.div>

            <span className="relative z-10 whitespace-nowrap hidden sm:inline">
                {isAIMode ? "Linky AI" : t('aiMode.title')}
            </span>

            {/* Keyboard shortcut hint - only when inactive */}
            {!isAIMode && (
                <span className="relative z-10 hidden md:flex items-center gap-0.5 text-[9px] text-muted-foreground/60 font-mono">
                    <kbd className="px-1 py-0.5 rounded bg-background/50 border border-border/50">Ctrl+K</kbd>
                </span>
            )}

            {/* Status indicator when active */}
            {isAIMode && (
                <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}

            {/* Pulsing ring on first render when active */}
            {isAIMode && (
                <motion.div
                    className="absolute inset-0 rounded-xl border border-white/20"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}
        </motion.button>
    )
}
