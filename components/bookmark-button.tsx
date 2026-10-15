"use client"

import { useEffect, useState } from "react"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"

interface BookmarkButtonProps {
    internshipId: string
    isSaved: boolean
    onToggle?: (saved: boolean) => void
    variant?: "icon" | "button"
    className?: string
}

export function BookmarkButton({
    internshipId,
    isSaved: initialSaved,
    onToggle,
    variant = "icon",
    className
}: BookmarkButtonProps) {
    const [isSaved, setIsSaved] = useState(initialSaved)
    const [isLoading, setIsLoading] = useState(false)
    const { t } = useTranslation()

    // Re-sync when the saved list loads/changes asynchronously in the parent
    useEffect(() => {
        setIsSaved(initialSaved)
    }, [initialSaved])

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        setIsLoading(true)
        
        try {
            if (isSaved) {
                // Remove bookmark
                const res = await fetch("/api/saved-internships", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ internshipId })
                })
                
                if (res.ok) {
                    setIsSaved(false)
                    onToggle?.(false)
                    toast.success(t('bookmarks.removedFromSaved'))
                } else {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.error || t('errors.somethingWentWrong'))
                }
            } else {
                // Add bookmark
                const res = await fetch("/api/saved-internships", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ internshipId })
                })
                
                if (res.ok) {
                    setIsSaved(true)
                    onToggle?.(true)
                    toast.success(t('bookmarks.savedToBookmarks'))
                } else {
                    const data = await res.json().catch(() => ({}))
                    if (data.error === "Already saved") {
                        // Server already has it saved: treat as success
                        setIsSaved(true)
                        onToggle?.(true)
                    } else {
                        throw new Error(data.error || t('bookmarks.failedToSave'))
                    }
                }
            }
        } catch (error) {
            console.error("Bookmark toggle error:", error)
            toast.error(error instanceof Error && error.message ? error.message : t('errors.somethingWentWrong'))
        } finally {
            setIsLoading(false)
        }
    }

    if (variant === "icon") {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                disabled={isLoading}
                aria-label={isSaved ? t('bookmarks.removeFromSavedLabel') : t('bookmarks.saveInternshipLabel')}
                aria-pressed={isSaved}
                className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    isSaved && "text-yellow-500 hover:text-yellow-600",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isSaved ? "saved" : "not-saved"}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {isSaved ? (
                                <BookmarkCheck className="h-4 w-4 fill-current" />
                            ) : (
                                <Bookmark className="h-4 w-4" />
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </Button>
        )
    }

    return (
        <Button
            variant={isSaved ? "secondary" : "outline"}
            onClick={handleToggle}
            disabled={isLoading}
            className={cn("gap-2", className)}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
                <>
                    <BookmarkCheck className="h-4 w-4 fill-current" />
                    {t('bookmarks.saved')}
                </>
            ) : (
                <>
                    <Bookmark className="h-4 w-4" />
                    {t('common.save')}
                </>
            )}
        </Button>
    )
}
