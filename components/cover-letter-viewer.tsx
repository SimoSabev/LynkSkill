"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    Sparkles,
    Loader2,
    X,
    CheckCircle2,
    Clock,
    MessageSquare,
    Send,
    Eye,
    Edit3,
    AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CoverLetterViewerProps {
    open: boolean
    onClose: () => void
    applicationId: string
    userType: "Student" | "Company"
    studentName?: string
    canReview?: boolean
}

interface CoverLetterData {
    coverLetter: string | null
    coverLetterStatus: "DRAFT" | "SUBMITTED" | "REVIEWED" | null
    coverLetterGeneratedByAI: boolean
    coverLetterReviewNote: string | null
    coverLetterReviewedAt: string | null
    requiresCoverLetter: boolean
    internshipTitle: string
    companyName: string
}

export function CoverLetterViewer({
    open,
    onClose,
    applicationId,
    userType,
    studentName,
    canReview = false,
}: CoverLetterViewerProps) {
    const [data, setData] = useState<CoverLetterData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    
    // Student edit mode
    const [isEditing, setIsEditing] = useState(false)
    const [editedLetter, setEditedLetter] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    
    // Company review mode
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [reviewNote, setReviewNote] = useState("")
    const [isReviewing, setIsReviewing] = useState(false)

    useEffect(() => {
        if (open && applicationId) {
            fetchCoverLetter()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, applicationId])

    const fetchCoverLetter = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch(`/api/applications/${applicationId}/cover-letter`)
            if (!res.ok) throw new Error("Failed to fetch")
            const result = await res.json()
            setData(result)
            setEditedLetter(result.coverLetter || "")
            setReviewNote(result.coverLetterReviewNote || "")
        } catch (err) {
            console.error("Error fetching cover letter:", err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveEdit = async () => {
        setIsSaving(true)
        try {
            const res = await fetch(`/api/applications/${applicationId}/cover-letter`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    coverLetter: editedLetter,
                    coverLetterGeneratedByAI: data?.coverLetterGeneratedByAI || false,
                }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to save")
            }

            const updated = await res.json()
            setData(prev => prev ? { ...prev, ...updated } : prev)
            setIsEditing(false)
            toast.success("Cover letter updated successfully")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save cover letter")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmitReview = async () => {
        setIsReviewing(true)
        try {
            const res = await fetch(`/api/applications/${applicationId}/cover-letter`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewNote }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Failed to submit review")
            }

            const updated = await res.json()
            setData(prev => prev ? { ...prev, ...updated } : prev)
            setShowReviewForm(false)
            toast.success("Cover letter review submitted")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to submit review")
        } finally {
            setIsReviewing(false)
        }
    }

    const getStatusBadge = () => {
        if (!data?.coverLetterStatus) return null

        const statusConfig = {
            DRAFT: { label: "Draft", icon: Edit3, className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
            SUBMITTED: { label: "Submitted", icon: Clock, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
            REVIEWED: { label: "Reviewed", icon: CheckCircle2, className: "bg-green-500/10 text-green-600 border-green-500/20" },
        }

        const config = statusConfig[data.coverLetterStatus]
        const StatusIcon = config.icon

        return (
            <Badge variant="outline" className={cn("gap-1.5 text-xs font-medium", config.className)}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 gap-0 border-0 rounded-2xl">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    {userType === "Company" && studentName
                                        ? `${studentName}'s Cover Letter`
                                        : "Cover Letter"
                                    }
                                </DialogTitle>
                                {data && (
                                    <p className="text-white/70 mt-1 text-sm">
                                        For <span className="text-white/90 font-medium">{data.internshipTitle}</span>
                                        {userType === "Student" && (
                                            <> at <span className="text-white/90 font-medium">{data.companyName}</span></>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                        >
                            <X className="h-4 w-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-full" />
                            <div className="h-4 bg-muted rounded w-5/6" />
                            <div className="h-4 bg-muted rounded w-2/3" />
                            <div className="h-4 bg-muted rounded w-full" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="p-3 rounded-full bg-destructive/10">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <p className="text-sm text-muted-foreground">Failed to load cover letter</p>
                            <Button variant="outline" size="sm" onClick={fetchCoverLetter}>
                                Try Again
                            </Button>
                        </div>
                    ) : !data?.coverLetter ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="p-4 rounded-full bg-muted/50">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-foreground mb-1">No Cover Letter</h3>
                                <p className="text-sm text-muted-foreground">
                                    {userType === "Student"
                                        ? "You didn't submit a cover letter with this application."
                                        : "The student did not include a cover letter."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Status and metadata */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {getStatusBadge()}
                                {data.coverLetterGeneratedByAI && (
                                    <Badge variant="outline" className="gap-1.5 text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                                        <Sparkles className="h-3 w-3" />
                                        AI-Generated
                                    </Badge>
                                )}
                            </div>

                            {/* Cover Letter Content */}
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Textarea
                                        value={editedLetter}
                                        onChange={(e) => setEditedLetter(e.target.value)}
                                        className="min-h-[280px] rounded-xl border-2 resize-none focus:border-purple-500 text-sm leading-relaxed"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {editedLetter.length.toLocaleString()} / 5,000 characters
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditedLetter(data.coverLetter || "")
                                                    setIsEditing(false)
                                                }}
                                                className="rounded-xl"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEdit}
                                                disabled={isSaving || editedLetter.length > 5000}
                                                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white gap-2"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                )}
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 rounded-xl border bg-card">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        {data.coverLetter.split("\n").map((paragraph, i) => (
                                            <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3 last:mb-0">
                                                {paragraph || <br />}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Review Note (if reviewed) */}
                            {data.coverLetterStatus === "REVIEWED" && data.coverLetterReviewNote && (
                                <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                            Reviewer Feedback
                                        </span>
                                        {data.coverLetterReviewedAt && (
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {new Date(data.coverLetterReviewedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {data.coverLetterReviewNote}
                                    </p>
                                </div>
                            )}

                            {/* Company Review Form */}
                            {userType === "Company" && canReview && showReviewForm && (
                                <div className="p-4 rounded-xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                                            Review Note (internal — not visible to student)
                                        </span>
                                    </div>
                                    <Textarea
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                        placeholder="Add your feedback about this cover letter for the team..."
                                        className="min-h-[100px] rounded-xl border-2 resize-none focus:border-purple-500 text-sm"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowReviewForm(false)}
                                            className="rounded-xl"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmitReview}
                                            disabled={isReviewing}
                                            className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2"
                                        >
                                            {isReviewing ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Send className="h-3.5 w-3.5" />
                                            )}
                                            Submit Review
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                {userType === "Student" && data.coverLetterStatus !== "REVIEWED" && !isEditing && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        className="gap-2 rounded-xl"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit Cover Letter
                                    </Button>
                                )}
                                {userType === "Company" && canReview && !showReviewForm && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowReviewForm(true)}
                                        className="gap-2 rounded-xl border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        {data.coverLetterStatus === "REVIEWED" ? "Update Review" : "Add Review"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
