"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CoverLetterModal } from "@/components/cover-letter-modal"

interface ApplyButtonProps {
    internshipId: string
    internshipTitle?: string
    companyName?: string
    requiresCoverLetter?: boolean
    onApplied?: () => void
}

export default function ApplyButton({ internshipId, internshipTitle, companyName, requiresCoverLetter, onApplied }: ApplyButtonProps) {
    const [isApplying, setIsApplying] = useState(false)
    const [showIncompleteModal, setShowIncompleteModal] = useState(false)
    const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)
    const [portfolioChecked, setPortfolioChecked] = useState(false)
    const router = useRouter()

    const handleApply = async () => {
        setIsApplying(true)

        try {
            // Check if portfolio has at least one field completed
            const portfolioRes = await fetch("/api/portfolio")
            if (portfolioRes.ok) {
                const portfolio = await portfolioRes.json()

                // Check if at least one meaningful field is filled
                const hasContent =
                    portfolio.bio ||
                    portfolio.headline ||
                    (portfolio.skills && portfolio.skills.length > 0) ||
                    (portfolio.interests && portfolio.interests.length > 0) ||
                    (portfolio.education && portfolio.education.length > 0) ||
                    (portfolio.projects && portfolio.projects.length > 0) ||
                    (portfolio.certifications && portfolio.certifications.length > 0) ||
                    portfolio.linkedin ||
                    portfolio.github ||
                    portfolio.portfolioUrl

                if (!hasContent) {
                    setShowIncompleteModal(true)
                    setIsApplying(false)
                    return
                }
            }

            // Portfolio is OK — open cover letter modal
            setPortfolioChecked(true)
            setShowCoverLetterModal(true)
            setIsApplying(false)
        } catch (err) {
            console.error(err)
            alert("An error occurred while checking your portfolio")
            setIsApplying(false)
        }
    }

    const handleCoverLetterSubmit = async (coverLetter: string | null, generatedByAI: boolean) => {
        setIsApplying(true)
        setShowCoverLetterModal(false)

        try {
            const res = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    internshipId,
                    coverLetter,
                    coverLetterGeneratedByAI: generatedByAI,
                }),
            })

            if (res.ok) {
                onApplied?.()
            } else {
                const data = await res.json()
                alert(data.error || "Failed to apply")
            }
        } catch (err) {
            console.error(err)
            alert("An error occurred while applying")
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <>
            <Button
                onClick={handleApply}
                disabled={isApplying}
                size="lg"
                className="flex-1 w-full rounded-xl sm:rounded-2xl font-semibold sm:font-bold text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-md transition-colors duration-150 py-2.5 sm:py-3"
            >
                {isApplying ? (
                    <>
                        <Loader2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin shrink-0" />
                        <span className="truncate">Applying...</span>
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="truncate">Apply Now</span>
                    </>
                )}
            </Button>

            <Dialog open={showIncompleteModal} onOpenChange={setShowIncompleteModal}>
                <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] mx-4 rounded-xl sm:rounded-2xl">
                    <DialogHeader>
                        <div className="flex items-start sm:items-center gap-3 mb-2">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <DialogTitle className="text-lg sm:text-xl leading-tight">Complete Your Portfolio First</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm sm:text-base leading-relaxed pt-2">
                            Before applying to internships, you need to add at least some information to your portfolio. This helps
                            companies learn more about you and increases your chances of getting accepted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowIncompleteModal(false)}
                            className="w-full sm:w-auto rounded-lg sm:rounded-xl py-2.5 sm:py-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowIncompleteModal(false)
                                router.push('/dashboard/student/portfolio')
                            }}
                            className="w-full sm:w-auto rounded-lg sm:rounded-xl bg-gradient-to-r text-foreground from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 py-2.5 sm:py-2"
                        >
                            Go to Portfolio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cover Letter Modal */}
            <CoverLetterModal
                open={showCoverLetterModal}
                onClose={() => {
                    setShowCoverLetterModal(false)
                    setPortfolioChecked(false)
                }}
                internshipId={internshipId}
                internshipTitle={internshipTitle || "this internship"}
                companyName={companyName || "the company"}
                requiresCoverLetter={requiresCoverLetter || false}
                onSubmit={handleCoverLetterSubmit}
            />
        </>
    )
}
