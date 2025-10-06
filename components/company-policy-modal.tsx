"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, XCircle } from "lucide-react"
import { useState } from "react"

interface CompanyPolicyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companyId?: string | null
    onAccept: () => void
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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAccept = async () => {
        setError(null)

        if (!companyId || companyId === "null") {
            setError("Missing company ID")
            return
        }

        try {
            setLoading(true)
            const res = await fetch("/api/company/accept-policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId,
                    tosAccepted: true,
                    privacyAccepted: true,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data?.error || "Failed to save")
                return
            }

            onOpenChange(false)
            onAccept()
        } catch (err) {
            console.error(err)
            setError("Network error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl border-border/50 shadow-2xl">
                <DialogHeader>
                    <div className="flex items-start gap-5 mb-4">
                        <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-950/30 rounded-2xl shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-800/50">
                            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 pt-1">
                            <DialogTitle className="text-3xl font-bold text-balance leading-tight mb-2">
                                Company Registration Policy
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Please review and accept our policies to continue
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200/60 dark:border-amber-800/60 p-6 rounded-xl shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 dark:bg-amber-700/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative">
                            <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-50 font-medium">
                                By continuing, you declare that the provided company information and EIK are accurate and correspond to
                                a legally registered entity. Providing false or misleading data is punishable under{" "}
                                <span className="font-bold text-amber-900 dark:text-amber-100 underline decoration-amber-400/50 decoration-2 underline-offset-2">
                  Article 313 of the Bulgarian Penal Code
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
                I have read and accept the{" "}
                                <a
                                    className="text-primary font-semibold underline decoration-primary/30 decoration-2 underline-offset-2 hover:decoration-primary/60 transition-colors"
                                    href="/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                  Terms of Service
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
                I have read and accept the{" "}
                                <a
                                    className="text-primary font-semibold underline decoration-primary/30 decoration-2 underline-offset-2 hover:decoration-primary/60 transition-colors"
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                  Privacy Policy
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
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="px-6 hover:bg-accent/50 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAccept}
                            disabled={!tosChecked || !privacyChecked || loading}
                            size="lg"
                            className="px-8 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "I Understand and Agree"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
