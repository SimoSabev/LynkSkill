"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
    AlertTriangle,
    Clock,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Calendar,
    Trash2,
    Sparkles,
    Timer,
    Building2,
    MapPin,
    Users,
    X,
    CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { useTranslation } from "@/lib/i18n"

interface ExpiringInternship {
    id: string
    title: string
    description: string
    location: string
    paid: boolean
    salary: number | null
    applicationStart: string
    applicationEnd: string
    createdAt: string
    skills: string[]
    company: { name: string }
    _count: { applications: number }
}

interface ExpiringInternshipsData {
    expiringSoon: ExpiringInternship[]
    expired: ExpiringInternship[]
    totalExpiring: number
    totalExpired: number
}

export function ExpiringInternshipsBanner() {
    const { t } = useTranslation()
    const [data, setData] = useState<ExpiringInternshipsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [renewModalOpen, setRenewModalOpen] = useState(false)
    const [selectedInternship, setSelectedInternship] = useState<ExpiringInternship | null>(null)
    const [renewDate, setRenewDate] = useState<Date | undefined>(undefined)
    const [renewing, setRenewing] = useState(false)
    const [quickRenewingId, setQuickRenewingId] = useState<string | null>(null)

    const fetchExpiring = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/internships/expiring")
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error("Failed to fetch expiring internships:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchExpiring()
    }, [fetchExpiring])

    const handleQuickRenew = async (internship: ExpiringInternship, days: number) => {
        setQuickRenewingId(internship.id)
        try {
            const res = await fetch("/api/internships/renew", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    internshipId: internship.id,
                    extensionDays: days,
                }),
            })
            const json = await res.json()
            if (!res.ok) {
                toast.error(json.error || t("expiringBanner.failedToRenew"))
                return
            }
            toast.success(t("expiringBanner.renewedFor", { title: internship.title, days: String(days) }), {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            })
            fetchExpiring()
            window.dispatchEvent(new CustomEvent("internshipRenewed"))
        } catch {
            toast.error(t("expiringBanner.failedToRenew"))
        } finally {
            setQuickRenewingId(null)
        }
    }

    const handleCustomRenew = async () => {
        if (!selectedInternship || !renewDate) return
        setRenewing(true)
        try {
            const res = await fetch("/api/internships/renew", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    internshipId: selectedInternship.id,
                    newEndDate: renewDate.toISOString(),
                }),
            })
            const json = await res.json()
            if (!res.ok) {
                toast.error(json.error || t("expiringBanner.failedToRenew"))
                return
            }
            toast.success(t("expiringBanner.renewedUntil", { title: selectedInternship.title, date: format(renewDate, "MMM d, yyyy") }), {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            })
            setRenewModalOpen(false)
            setSelectedInternship(null)
            setRenewDate(undefined)
            fetchExpiring()
            window.dispatchEvent(new CustomEvent("internshipRenewed"))
        } catch {
            toast.error(t("expiringBanner.failedToRenew"))
        } finally {
            setRenewing(false)
        }
    }

    const openRenewModal = (internship: ExpiringInternship) => {
        setSelectedInternship(internship)
        const defaultDate = new Date()
        defaultDate.setDate(defaultDate.getDate() + 30)
        setRenewDate(defaultDate)
        setRenewModalOpen(true)
    }

    const getStatus = (internship: ExpiringInternship) => {
        const endDate = new Date(internship.applicationEnd)
        const now = new Date()
        const diffMs = endDate.getTime() - now.getTime()
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        const isExpired = daysLeft <= 0
        const daysExpiredAgo = Math.abs(daysLeft)
        const graceDaysLeft = 7 - daysExpiredAgo
        return { endDate, daysLeft, isExpired, daysExpiredAgo, graceDaysLeft }
    }

    if (dismissed || loading) return null
    if (!data || (data.totalExpiring === 0 && data.totalExpired === 0)) return null

    const totalCount = data.totalExpiring + data.totalExpired
    const allInternships = [...data.expired, ...data.expiringSoon]

    const getDescriptionText = () => {
        if (data.totalExpired > 0 && data.totalExpiring > 0) {
            return t("expiringBanner.expiredAndExpiring", {
                expired: String(data.totalExpired),
                expiring: String(data.totalExpiring),
            })
        }
        if (data.totalExpired > 0) {
            return t("expiringBanner.expiredOnly", {
                count: String(data.totalExpired),
                label: data.totalExpired === 1 ? t("expiringBanner.internship") : t("expiringBanner.internships"),
            })
        }
        return t("expiringBanner.expiringOnly", {
            count: String(data.totalExpiring),
            label: data.totalExpiring === 1 ? t("expiringBanner.internship") : t("expiringBanner.internships"),
        })
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 shadow-lg"
            >
                {/* Background glow effects */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />

                {/* Main banner content */}
                <div className="relative z-10 p-4 md:p-6">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-base md:text-lg text-foreground">
                                    {t("expiringBanner.title")}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-xs"
                                >
                                    {totalCount} {totalCount === 1 ? t("expiringBanner.internship") : t("expiringBanner.internships")}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {getDescriptionText()}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpanded(!expanded)}
                                className="gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            >
                                {expanded ? (
                                    <>{t("expiringBanner.hide")} <ChevronUp className="h-4 w-4" /></>
                                ) : (
                                    <>{t("expiringBanner.review")} <ChevronDown className="h-4 w-4" /></>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDismissed(true)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Expanded list */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 space-y-3 pt-4 border-t border-amber-500/20">
                                    {allInternships.map((internship) => {
                                        const status = getStatus(internship)
                                        const isRenewing = quickRenewingId === internship.id

                                        return (
                                            <motion.div
                                                key={internship.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className={cn(
                                                    "relative rounded-xl border p-4 transition-all",
                                                    status.isExpired
                                                        ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
                                                        : status.daysLeft <= 3
                                                        ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                                                        : "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40"
                                                )}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-semibold text-sm text-foreground truncate">
                                                                {internship.title}
                                                            </h4>
                                                            {status.isExpired ? (
                                                                <Badge className="bg-red-500/90 text-white text-[10px] px-1.5 py-0 border-0">
                                                                    <Trash2 className="h-2.5 w-2.5 mr-1" />
                                                                    {t("expiringBanner.expired")} · {t("expiringBanner.graceDaysLeft", { days: String(Math.max(0, status.graceDaysLeft)) })}
                                                                </Badge>
                                                            ) : status.daysLeft <= 1 ? (
                                                                <Badge className="bg-red-500/80 text-white text-[10px] px-1.5 py-0 border-0">
                                                                    <Timer className="h-2.5 w-2.5 mr-1" />
                                                                    {t("expiringBanner.expiresToday")}
                                                                </Badge>
                                                            ) : status.daysLeft <= 3 ? (
                                                                <Badge className="bg-amber-500/80 text-white text-[10px] px-1.5 py-0 border-0">
                                                                    <Clock className="h-2.5 w-2.5 mr-1" />
                                                                    {t("expiringBanner.daysLeft", { days: String(status.daysLeft) })}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-orange-500/40 text-orange-600 dark:text-orange-400 text-[10px] px-1.5 py-0">
                                                                    <Clock className="h-2.5 w-2.5 mr-1" />
                                                                    {t("expiringBanner.daysLeft", { days: String(status.daysLeft) })}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {internship.location}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {internship._count.applications} {internship._count.applications !== 1 ? t("expiringBanner.applicants") : t("expiringBanner.applicant")}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {t("expiringBanner.ends")} {format(status.endDate, "MMM d, yyyy")}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quick actions */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isRenewing}
                                                                onClick={() => handleQuickRenew(internship, 14)}
                                                                className="h-8 px-2.5 text-xs rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                                                            >
                                                                {isRenewing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <>+14d</>}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isRenewing}
                                                                onClick={() => handleQuickRenew(internship, 30)}
                                                                className="h-8 px-2.5 text-xs rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                                                            >
                                                                {isRenewing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <>+30d</>}
                                                            </Button>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            onClick={() => openRenewModal(internship)}
                                                            className="h-8 gap-1.5 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25"
                                                        >
                                                            <RefreshCw className="h-3 w-3" />
                                                            {t("expiringBanner.renew")}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Grace period progress bar */}
                                                {status.isExpired && (
                                                    <div className="mt-3 space-y-1">
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                            <span>{t("expiringBanner.gracePeriod")}</span>
                                                            <span className="text-red-500 font-medium">
                                                                {status.graceDaysLeft > 0
                                                                    ? t("expiringBanner.daysUntilDelete", { days: String(status.graceDaysLeft) })
                                                                    : t("expiringBanner.willBeDeletedSoon")}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.max(0, Math.min(100, ((7 - status.graceDaysLeft) / 7) * 100))}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-60" />
            </motion.div>

            {/* Renewal Modal */}
            <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                                <RefreshCw className="h-4 w-4 text-white" />
                            </div>
                            {t("expiringBanner.renewInternship")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("expiringBanner.chooseNewEndDate")} &quot;{selectedInternship?.title}&quot;
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedInternship && (
                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{selectedInternship.title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {t("expiringBanner.currentEnd")}: {format(new Date(selectedInternship.applicationEnd), "MMM d, yyyy")}
                                    <span className="text-amber-500 font-medium">
                                        ({formatDistanceToNow(new Date(selectedInternship.applicationEnd), { addSuffix: true })})
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t("expiringBanner.quickExtend")}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { days: 14, label: t("expiringBanner.twoWeeks") },
                                    { days: 30, label: t("expiringBanner.oneMonth") },
                                    { days: 60, label: t("expiringBanner.twoMonths") },
                                ].map(({ days, label }) => {
                                    const d = new Date()
                                    d.setDate(d.getDate() + days)
                                    return (
                                        <Button
                                            key={days}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRenewDate(d)}
                                            className={cn(
                                                "h-10 text-xs rounded-lg transition-all",
                                                renewDate && Math.abs(renewDate.getTime() - d.getTime()) < 86400000
                                                    ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                                    : "hover:border-purple-500/40"
                                            )}
                                        >
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            {label}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t("expiringBanner.pickDate")}</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-lg h-10",
                                            !renewDate && "text-muted-foreground"
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {renewDate ? format(renewDate, "MMMM d, yyyy") : t("expiringBanner.selectDate")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarPicker
                                        mode="single"
                                        selected={renewDate}
                                        onSelect={setRenewDate}
                                        disabled={(date) => date <= new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {renewDate && (
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t("expiringBanner.newDeadline")}: <strong>{format(renewDate, "MMMM d, yyyy")}</strong>
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRenewModalOpen(false)} className="rounded-lg">
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={handleCustomRenew}
                            disabled={!renewDate || renewing}
                            className="rounded-lg gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25"
                        >
                            {renewing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    {t("expiringBanner.renewing")}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4" />
                                    {t("expiringBanner.renewInternship")}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
