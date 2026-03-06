"use client"

import { useState, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Sparkles,
    Send,
    Loader2,
    X,
    Eye,
    Edit3,
    Wand2,
    AlertCircle,
    SkipForward,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface CoverLetterModalProps {
    open: boolean
    onClose: () => void
    internshipId: string
    internshipTitle: string
    companyName: string
    requiresCoverLetter: boolean
    onSubmit: (coverLetter: string | null, generatedByAI: boolean) => void
}

export function CoverLetterModal({
    open,
    onClose,
    internshipId,
    internshipTitle,
    companyName,
    requiresCoverLetter,
    onSubmit,
}: CoverLetterModalProps) {
    const { t } = useTranslation()
    const [coverLetter, setCoverLetter] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedByAI, setGeneratedByAI] = useState(false)
    const [view, setView] = useState<"write" | "preview">("write")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const characterCount = coverLetter.length
    const maxChars = 5000
    const isOverLimit = characterCount > maxChars

    const handleGenerateAI = useCallback(async () => {
        setIsGenerating(true)
        try {
            const res = await fetch("/api/assistant/cover-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ internshipId }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to generate cover letter")
            }

            const data = await res.json()
            setCoverLetter(data.coverLetter)
            setGeneratedByAI(true)
            setView("write")
            toast.success(t("coverLetter.generatedSuccess"))
        } catch (error) {
            console.error("AI generation error:", error)
            toast.error(error instanceof Error ? error.message : t("coverLetter.failedToGenerate"))
        } finally {
            setIsGenerating(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [internshipId])

    const handleSubmit = async () => {
        if (requiresCoverLetter && !coverLetter.trim()) {
            toast.error(t("coverLetter.requiredError"))
            return
        }

        if (isOverLimit) {
            toast.error(t("coverLetter.exceedsLimit"))
            return
        }

        setIsSubmitting(true)
        try {
            onSubmit(coverLetter.trim() || null, generatedByAI)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = () => {
        if (requiresCoverLetter) {
            toast.error("A cover letter is required for this application")
            return
        }
        onSubmit(null, false)
    }

    const handleClose = () => {
        setCoverLetter("")
        setGeneratedByAI(false)
        setView("write")
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent showCloseButton={false} className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 border-0 rounded-2xl flex flex-col">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    {t("coverLetter.title")}
                                </DialogTitle>
                                <DialogDescription className="text-white/70 mt-1 text-sm">
                                    {t("coverLetter.forPosition")} <span className="text-white/90 font-medium">{internshipTitle}</span> {t("coverLetter.atCompany")}{" "}
                                    <span className="text-white/90 font-medium">{companyName}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {requiresCoverLetter && (
                                <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-xs">
                                    {t("coverLetter.required")}
                                </Badge>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setView("write")}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                view === "write"
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            {t("coverLetter.write")}
                        </button>
                        <button
                            onClick={() => setView("preview")}
                            disabled={!coverLetter.trim()}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                view === "preview"
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                                !coverLetter.trim() && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            {t("coverLetter.preview")}
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        className="gap-2 rounded-xl border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {t("coverLetter.generating")}
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-3.5 w-3.5" />
                                {t("coverLetter.generateWithAI")}
                            </>
                        )}
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                    {view === "write" ? (
                        <div className="space-y-3">
                            <Textarea
                                value={coverLetter}
                                onChange={(e) => {
                                    setCoverLetter(e.target.value)
                                    if (generatedByAI && e.target.value !== coverLetter) {
                                        // Still mark as AI-generated even if edited
                                    }
                                }}
                                placeholder={t("coverLetter.placeholder")}
                                className={cn(
                                    "min-h-[280px] rounded-xl border-2 resize-none transition-colors text-sm leading-relaxed",
                                    isOverLimit
                                        ? "border-red-500 focus:border-red-500"
                                        : "focus:border-purple-500"
                                )}
                            />

                            {/* Footer info */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-3">
                                    {generatedByAI && (
                                        <Badge variant="secondary" className="gap-1 text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                            <Sparkles className="h-3 w-3" />
                                            {t("coverLetter.aiGenerated")}
                                        </Badge>
                                    )}
                                </div>
                                <span className={cn(isOverLimit && "text-red-500 font-medium")}>
                                    {characterCount.toLocaleString()} / {maxChars.toLocaleString()} {t("coverLetter.characters")}
                                </span>
                            </div>

                            {isOverLimit && (
                                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 rounded-xl">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{t("coverLetter.exceedsLimitLong").replace("{max}", maxChars.toLocaleString())}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-6 rounded-xl border bg-card">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {coverLetter.split("\n").map((paragraph, i) => (
                                        <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3 last:mb-0">
                                            {paragraph || <br />}
                                        </p>
                                    ))}
                                </div>
                            </div>
                            {generatedByAI && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl">
                                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                    <span>{t("coverLetter.aiIndicator")}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <DialogFooter className="flex-row justify-between items-center gap-3 px-6 py-4 border-t bg-muted/20">
                    <div>
                        {!requiresCoverLetter && (
                            <Button
                                variant="ghost"
                                onClick={handleSkip}
                                className="text-muted-foreground hover:text-foreground gap-2"
                            >
                                <SkipForward className="h-4 w-4" />
                                {t("coverLetter.skip")}
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="rounded-xl"
                        >
                            {t("internshipDetails.cancel")}
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isOverLimit || (requiresCoverLetter && !coverLetter.trim())}
                            className="gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("coverLetter.submitting")}
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    {coverLetter.trim() ? t("coverLetter.applyWithCoverLetter") : t("coverLetter.applyWithoutCoverLetter")}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
