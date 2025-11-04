"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { X, Sparkles } from "lucide-react"

interface AIMascotSceneProps {
    aiReply?: string
    portfolio?: unknown
    onClose: () => void
}

export default function AIMascotScene({ aiReply, onClose }: AIMascotSceneProps) {
    const [visible, setVisible] = useState(true)

    const handleClose = () => {
        setVisible(false)
        setTimeout(onClose, 400)
    }

    useEffect(() => {
        document.body.style.overflow = visible ? "hidden" : "auto"
        return () => {
            document.body.style.overflow = "auto"
        }
    }, [visible])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-card shadow-2xl border border-border/50"
                    >
                        <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{
                                background:
                                    "linear-gradient(90deg, var(--portfolio-hero-from), var(--portfolio-hero-to), var(--portfolio-hero-from))",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 3s linear infinite",
                            }}
                        />

                        {/* Header */}
                        <div className="relative bg-card border-b border-border/50 px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center relative"
                                    style={{
                                        background: "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                        boxShadow: "0 0 20px rgba(100, 80, 255, 0.3)",
                                    }}
                                >
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">AI Assistant</h2>
                                    <p className="text-xs text-muted-foreground">Powered by Linky</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleClose}
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full h-9 w-9"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-160px)] bg-background">
                            <div className="p-6 md:p-8 lg:p-10 space-y-8">
                                <motion.div
                                    className="flex justify-center"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.5 }}
                                >
                                    <motion.div
                                        animate={{
                                            y: [0, -8, 0],
                                            rotate: [0, 2, 0, -2, 0],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: "easeInOut",
                                        }}
                                        className="relative"
                                    >
                                        <div
                                            className="absolute inset-0 blur-3xl rounded-full scale-150 opacity-40"
                                            style={{
                                                background: "radial-gradient(circle, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                            }}
                                        />
                                        <div
                                            className="relative w-36 h-36 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-full p-4 border-2"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(100, 80, 255, 0.1), rgba(150, 100, 255, 0.1))",
                                                borderColor: "var(--portfolio-hero-from)",
                                                boxShadow: "0 0 30px rgba(100, 80, 255, 0.2)",
                                            }}
                                        >
                                            <Image
                                                src="/linky-mascot.png"
                                                alt="Linky AI Assistant"
                                                fill
                                                className="object-contain drop-shadow-lg p-2"
                                                priority
                                            />
                                        </div>
                                    </motion.div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="space-y-4"
                                >
                                    {/* Message label */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div
                                            className="w-2 h-2 rounded-full animate-pulse"
                                            style={{ backgroundColor: "var(--portfolio-hero-from)" }}
                                        />
                                        <span>Analysis & Recommendations</span>
                                    </div>

                                    {/* Message content */}
                                    <div className="relative group">
                                        <div
                                            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                background: "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                            }}
                                        />

                                        <div className="relative bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-sm">
                                            <div
                                                className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10"
                                                style={{
                                                    background: "linear-gradient(135deg, var(--portfolio-hero-from), transparent)",
                                                }}
                                            />

                                            <div className="relative prose prose-sm md:prose-base max-w-none dark:prose-invert">
                                                <div className="text-foreground/90 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                                    {aiReply || (
                                                        <div className="flex items-center gap-3 text-muted-foreground">
                                                            <div className="flex gap-1">
                                                                <div
                                                                    className="w-2 h-2 rounded-full animate-bounce"
                                                                    style={{
                                                                        backgroundColor: "var(--portfolio-hero-from)",
                                                                        animationDelay: "0ms",
                                                                    }}
                                                                />
                                                                <div
                                                                    className="w-2 h-2 rounded-full animate-bounce"
                                                                    style={{
                                                                        backgroundColor: "var(--portfolio-hero-to)",
                                                                        animationDelay: "150ms",
                                                                    }}
                                                                />
                                                                <div
                                                                    className="w-2 h-2 rounded-full animate-bounce"
                                                                    style={{
                                                                        backgroundColor: "var(--portfolio-hero-from)",
                                                                        animationDelay: "300ms",
                                                                    }}
                                                                />
                                                            </div>
                                                            <span>Analyzing your portfolio...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        <div className="bg-card border-t border-border/50 px-6 py-4 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Feedback generated by AI • Review carefully</p>
                            <Button
                                onClick={handleClose}
                                className="px-6 rounded-full font-medium shadow-sm text-white border-0"
                                style={{
                                    background: "linear-gradient(135deg, var(--portfolio-hero-from), var(--portfolio-hero-to))",
                                    boxShadow: "0 4px 15px rgba(100, 80, 255, 0.3)",
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
;<style jsx global>{`
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`}</style>
