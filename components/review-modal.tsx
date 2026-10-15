"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Star, 
    X, 
    Loader2, 
    Building2,
    Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface ReviewModalProps {
    open: boolean
    onClose: () => void
    applicationId: string
    companyName: string
    internshipTitle: string
    onSuccess?: () => void
}

export function ReviewModal({ 
    open, 
    onClose, 
    applicationId, 
    companyName, 
    internshipTitle,
    onSuccess 
}: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { t } = useTranslation()

    // Start with a clean form every time the modal opens or targets another application
    useEffect(() => {
        if (open) {
            setRating(0)
            setHoverRating(0)
            setTitle("")
            setContent("")
        }
    }, [open, applicationId])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting) onClose()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [open, isSubmitting, onClose])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (rating === 0) {
            toast.error("Please select a rating")
            return
        }
        
        if (!title.trim()) {
            toast.error("Please enter a review title")
            return
        }
        
        if (!content.trim()) {
            toast.error("Please enter your review")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId,
                    rating,
                    title: title.trim(),
                    content: content.trim()
                })
            })

            if (res.ok) {
                toast.success(t('reviewModal.submitSuccess'))
                onSuccess?.()
                onClose()
                setRating(0)
                setTitle("")
                setContent("")
            } else {
                const data = await res.json().catch(() => null)
                toast.error(
                    (data && typeof data.error === "string" && data.error) ||
                        `${t('reviewModal.failedToSubmit')} (${res.status})`,
                )
            }
        } catch (error) {
            console.error("Error submitting review:", error)
            toast.error(t('errors.somethingWentWrong'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const ratingLabels = ["", t('reviewModal.poor'), t('reviewModal.fair'), t('reviewModal.good'), t('reviewModal.veryGood'), t('reviewModal.excellent')]

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-modal-title"
                        className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="relative p-6 border-b border-border bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 rounded-full"
                                onClick={onClose}
                                aria-label={t('common.close')}
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                    <Star className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <h2 id="review-modal-title" className="text-xl font-bold text-foreground">{t('reviewModal.leaveReview')}</h2>
                                    <p className="text-sm text-muted-foreground">{t('reviewModal.shareExperience')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Company Info */}
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{companyName}</p>
                                    <p className="text-sm text-muted-foreground">{internshipTitle}</p>
                                </div>
                            </div>

                            {/* Star Rating */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">{t('reviewModal.yourRating')}</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                aria-label={`${star}/5`}
                                                aria-pressed={rating === star}
                                                className="p-1 transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={cn(
                                                        "h-8 w-8 transition-colors",
                                                        (hoverRating || rating) >= star
                                                            ? "text-amber-500 fill-amber-500"
                                                            : "text-muted-foreground/30"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {(hoverRating || rating) > 0 && (
                                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                            {ratingLabels[hoverRating || rating]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Review Title */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">{t('reviewModal.reviewTitle')}</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Summarize your experience..."
                                    className="rounded-xl"
                                    maxLength={100}
                                />
                            </div>

                            {/* Review Content */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">{t('reviewModal.yourReview')}</label>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={t('reviewModal.reviewPlaceholder')}
                                    className="rounded-xl min-h-[120px] resize-none"
                                    maxLength={1000}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {content.length}/1000 characters
                                </p>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting || rating === 0 || !title.trim() || !content.trim()}
                                className="w-full rounded-xl h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <Sparkles className="h-5 w-5 mr-2" />
                                )}
                                {isSubmitting ? t('reviewModal.submitting') : t('reviewModal.submitReview')}
                            </Button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
