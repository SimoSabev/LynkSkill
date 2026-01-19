"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useNavigation } from "@/lib/navigation-context"
import { Loader2 } from "lucide-react"

export function NavigationLoader() {
    const { isNavigating } = useNavigation()

    return (
        <AnimatePresence>
            {isNavigating && (
                <>
                    {/* Top progress bar */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 z-[100] origin-left"
                    />
                    
                    {/* Content overlay with spinner */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-background/50 backdrop-blur-[2px] z-[99] flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-xl opacity-50" />
                                <div className="relative p-4 rounded-full bg-background border shadow-xl">
                                    <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                                </div>
                            </div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-sm font-medium text-muted-foreground"
                            >
                                Loading...
                            </motion.p>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
