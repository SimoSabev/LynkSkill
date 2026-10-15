"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { useTranslation } from '@/lib/i18n'
import { CoverLetterModal } from "@/components/cover-letter-modal"

type WindowState = { kind: "open" } | { kind: "closed" } | { kind: "notYetOpen"; opensAt: Date }

function getWindowState(applicationStart: number | null, applicationEnd: number | null): WindowState {
    const now = Date.now()
    if (applicationStart !== null && !Number.isNaN(applicationStart) && now < applicationStart) {
        return { kind: "notYetOpen", opensAt: new Date(applicationStart) }
    }
    if (applicationEnd !== null && !Number.isNaN(applicationEnd)) {
        // The end day is inclusive: applications close the day after the end date
        const endOfDay = new Date(applicationEnd)
        endOfDay.setHours(23, 59, 59, 999)
        if (now > endOfDay.getTime()) return { kind: "closed" }
    }
    return { kind: "open" }
}

interface ApplyButtonProps {
    internshipId: string
    internshipTitle?: string
    companyName?: string
    requiresCoverLetter?: boolean
    applicationStart?: string | Date | null
    applicationEnd?: string | Date | null
    onApplied?: () => void
}

export default function ApplyButton({ internshipId, internshipTitle, companyName, requiresCoverLetter, applicationStart, applicationEnd, onApplied }: ApplyButtonProps) {
    const [isApplying, setIsApplying] = useState(false)
    const [showIncompleteModal, setShowIncompleteModal] = useState(false)
    const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)
    const [_portfolioChecked, setPortfolioChecked] = useState(false)
    const router = useRouter()
    const { t } = useTranslation()
    // Computed after mount (depends on the current time) to avoid hydration mismatches
    const [windowState, setWindowState] = useState<WindowState>({ kind: "open" })
    const startKey = applicationStart ? new Date(applicationStart).getTime() : null
    const endKey = applicationEnd ? new Date(applicationEnd).getTime() : null

    useEffect(() => {
        setWindowState(getWindowState(startKey, endKey))
    }, [startKey, endKey])

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
            toast.error(t('apply.errorCheckingPortfolio'))
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
                toast.success(t('apply.applicationSubmitted'))
                onApplied?.()
            } else {
                const data = await res.json().catch(() => ({}))
                toast.error(data.error || t('apply.failedToApply'))
            }
        } catch (err) {
            console.error(err)
            toast.error(t('apply.errorApplying'))
        } finally {
            setIsApplying(false)
        }
    }

    if (windowState.kind !== "open") {
        return (
            <Button
                disabled
                size="lg"
                variant="outline"
                className="flex-1 w-full rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base py-2.5 sm:py-3"
            >
                <Clock className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">
                    {windowState.kind === "closed"
                        ? t('apply.applicationsClosed')
                        : t('apply.opensOn', { date: windowState.opensAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) })}
                </span>
            </Button>
        )
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
                        <span className="truncate">{t('apply.applying')}</span>
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="truncate">{t('apply.applyNow')}</span>
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
                            <DialogTitle className="text-lg sm:text-xl leading-tight">{t('apply.completePortfolioFirst')}</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm sm:text-base leading-relaxed pt-2">
                            {t('apply.completePortfolioDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowIncompleteModal(false)}
                            className="w-full sm:w-auto rounded-lg sm:rounded-xl py-2.5 sm:py-2"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                setShowIncompleteModal(false)
                                router.push('/dashboard/student/portfolio')
                            }}
                            className="w-full sm:w-auto rounded-lg sm:rounded-xl bg-gradient-to-r text-white from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 py-2.5 sm:py-2"
                        >
                            {t('apply.goToPortfolio')}
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
