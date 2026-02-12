"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, XCircle } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "@/lib/i18n"

interface CompanyPolicyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companyId?: string | null
    onAccept: () => Promise<void>
    tosChecked: boolean
    privacyChecked: boolean
    onTosChange: (v: boolean) => void
    onPrivacyChange: (v: boolean) => void
}

export function CompanyPolicyModal({
                                       open,
                                       onOpenChange,
                                       companyId,
                                       onAccept,
                                       tosChecked,
                                       privacyChecked,
                                       onTosChange,
                                       onPrivacyChange,
                                   }: CompanyPolicyModalProps) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAccept = async () => {
        setError(null)

        if (!companyId || companyId === "null") {
            setError(t("policyModal.missingCompanyId"))
            return
        }

        try {
            setLoading(true)
            await onAccept()
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : t("policyModal.failedToSave"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => {/* Prevent dismissal - user must accept policies */}}>
            <DialogContent
                className="max-w-2xl border-border/50 shadow-2xl"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                <DialogHeader>
                    <div className="flex items-start gap-5 mb-4">
                        <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-950/30 rounded-2xl shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-800/50">
                            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 pt-1">
                            <DialogTitle className="text-3xl font-bold text-balance leading-tight mb-2">
                                {t("policyModal.companyTitle")}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t("policyModal.reviewPolicies")}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200/60 dark:border-amber-800/60 p-6 rounded-xl shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 dark:bg-amber-700/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative">
                            <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-50 font-medium">
                                {t("policyModal.companyBodyText")}{" "}
                                <span className="font-bold text-amber-900 dark:text-amber-100 underline decoration-amber-400/50 decoration-2 underline-offset-2">
                  {t("policyModal.article313")}
                </span>
                                .
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-start gap-4 p-5 rounded-xl border-2 border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={tosChecked}
                                    onChange={(e) => onTosChange(e.target.checked)}
                                    className="w-5 h-5 rounded-md border-2 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer"
                                />
                            </div>
                            <span className="text-sm leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors flex-1">
                {t("policyModal.readAcceptTerms")}{" "}
                                <a
                                    className="text-primary font-semibold underline decoration-primary/30 decoration-2 underline-offset-2 hover:decoration-primary/60 transition-colors"
                                    href="/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                  {t("policyModal.termsOfService")}
                </a>
              </span>
                        </label>

                        <label className="flex items-start gap-4 p-5 rounded-xl border-2 border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={privacyChecked}
                                    onChange={(e) => onPrivacyChange(e.target.checked)}
                                    className="w-5 h-5 rounded-md border-2 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer"
                                />
                            </div>
                            <span className="text-sm leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors flex-1">
                {t("policyModal.readAcceptPrivacy")}{" "}
                                <a
                                    className="text-primary font-semibold underline decoration-primary/30 decoration-2 underline-offset-2 hover:decoration-primary/60 transition-colors"
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                  {t("policyModal.privacyPolicy")}
                </a>
              </span>
                        </label>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-destructive font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t-2 border-border/50">
                        <Button
                            onClick={handleAccept}
                            disabled={!tosChecked || !privacyChecked || loading}
                            size="lg"
                            className="px-8 shadow-md text-background hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                    {t("policyModal.saving")}
                                </>
                            ) : (
                                t("policyModal.agreeAndContinue")
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
