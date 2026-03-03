"use client"

import { AnimatePresence } from "framer-motion"
import { useState, useMemo, useCallback } from "react"
import type { Internship } from "@/app/types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { InternshipCardSkeleton } from "@/components/card-skeleton"
import InternshipDetailsModal from "@/components/internship-details-modal"
import { InternshipManageModal } from "@/components/internship-manage-modal"
import { Layers, Clock, RefreshCw, Trash2, MapPin, Euro, Building2, Briefcase, CheckCircle2, XCircle, Clock3, ArrowRight, Sparkles, Search, Eye, Zap, Settings, Calendar, AlertTriangle } from 'lucide-react'
import ApplyButton from "@/components/ApplyBtn"
import { BookmarkButton } from "@/components/bookmark-button"
import { InternshipFiltersComponent, type InternshipFilters } from "@/components/internship-filters"
import { useDashboard } from "@/lib/dashboard-context"
import { useTranslation } from "@/lib/i18n"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"

interface Application {
    id: string
    internshipId: string
    studentId: string
    status: "PENDING" | "APPROVED" | "REJECTED"
}

interface RecentAppsSectionProps {
    userType: "Student" | "Company"
    setActiveTab?: (tab: string) => void
}

export function RecentInternshipsSection({ userType, setActiveTab: _setActiveTab }: RecentAppsSectionProps) {
    const { t } = useTranslation()
    
    // Use centralized context - no more individual fetches
    const { 
        internships: contextInternships, 
        applications: contextApplications,
        isLoadingInternships,
        mutateInternships,
        mutateApplications,
        savedInternshipIds,
        mutateSavedInternships
    } = useDashboard()

    const [refreshing, setRefreshing] = useState(false)
    const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null)
    const [open, setOpen] = useState(false)
    const [manageOpen, setManageOpen] = useState(false)
    const [filters, setFilters] = useState<InternshipFilters>({
        search: "",
        location: "all",
        paid: "all",
        minSalary: 0,
        maxSalary: 10000,
        skills: []
    })
    const [filter, setFilter] = useState<"all" | "recent">("all")
    const [displayCount, setDisplayCount] = useState(6)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
    const [renewModalOpen, setRenewModalOpen] = useState(false)
    const [renewTarget, setRenewTarget] = useState<Internship | null>(null)
    const [renewDate, setRenewDate] = useState<Date | undefined>(undefined)
    const [renewing, setRenewing] = useState(false)

    // Use context data instead of local state
    const internships = contextInternships as Internship[]
    const applications = contextApplications as Application[]
    const isLoading = isLoadingInternships

    // Delete internship handler with toast instead of confirm
    const handleDeleteInternship = async (internship: Internship) => {
        if (pendingDeleteId === internship.id) {
            // Second click - actually delete
            try {
                const res = await fetch(`/api/internship/delete?id=${internship.id}`, { method: "DELETE" })
                const data = await res.json()
                if (data.error) {
                    toast.error(data.error)
                    return
                }
                toast.success(t("recentInternships.deletedSuccessfully", { title: internship.title }))
                window.dispatchEvent(new CustomEvent("internshipDeleted", { detail: internship.id }))
                mutateInternships()
            } catch (err) {
                console.error("Delete internship error:", err)
                toast.error(t("recentInternships.failedToDelete"))
            } finally {
                setPendingDeleteId(null)
            }
        } else {
            // First click - show confirmation toast
            setPendingDeleteId(internship.id)
            toast.warning(t("recentInternships.confirmDelete", { title: internship.title }), {
                duration: 3000,
                onDismiss: () => setPendingDeleteId(null),
                onAutoClose: () => setPendingDeleteId(null),
            })
        }
    }

    const openRenewModal = (internship: Internship) => {
        setRenewTarget(internship)
        const d = new Date()
        d.setDate(d.getDate() + 30)
        setRenewDate(d)
        setRenewModalOpen(true)
    }

    const handleRenew = async () => {
        if (!renewTarget || !renewDate) return
        setRenewing(true)
        try {
            const res = await fetch("/api/internships/renew", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    internshipId: renewTarget.id,
                    newEndDate: renewDate.toISOString(),
                }),
            })
            if (res.ok) {
                toast.success(t("recentInternships.renewedSuccessfully", { title: renewTarget.title }))
                setRenewModalOpen(false)
                setRenewTarget(null)
                setRenewDate(undefined)
                mutateInternships()
                window.dispatchEvent(new CustomEvent("internshipRenewed"))
            } else {
                const data = await res.json()
                toast.error(data.error || t("expiringBanner.failedToRenew"))
            }
        } catch {
            toast.error(t("expiringBanner.failedToRenew"))
        } finally {
            setRenewing(false)
        }
    }

    // Extract unique locations from internships
    const uniqueLocations = useMemo(() => {
        const locs = new Set<string>()
        internships.forEach(i => {
            if (i.location) locs.add(i.location)
        })
        return Array.from(locs).sort()
    }, [internships])

    // Extract unique skills from internships
    const uniqueSkills = useMemo(() => {
        const skillsSet = new Set<string>()
        internships.forEach(i => {
            if (i.skills) {
                // Skills could be comma-separated or array
                const skillList = typeof i.skills === 'string' 
                    ? i.skills.split(',').map(s => s.trim())
                    : i.skills
                skillList.forEach((s: string) => {
                    if (s) skillsSet.add(s)
                })
            }
        })
        return Array.from(skillsSet).sort()
    }, [internships])

    // Memoized filter handler
    const handleFiltersChange = useCallback((newFilters: InternshipFilters) => {
        setFilters(newFilters)
        setDisplayCount(6) // Reset display count when filters change
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await Promise.all([mutateInternships(), mutateApplications()])
        setRefreshing(false)
    }

    // Apply all filters
    const filteredInternships = useMemo(() => {
        // Helper function to get skills as lowercase string
        const getSkillsString = (skills: string | string[] | undefined | null): string => {
            if (!skills) return ""
            if (Array.isArray(skills)) return skills.join(',').toLowerCase()
            return skills.toLowerCase()
        }

        return internships.filter((internship) => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                const skillsString = getSkillsString(internship.skills)
                const matchesSearch = 
                    internship.title.toLowerCase().includes(searchLower) ||
                    internship.description.toLowerCase().includes(searchLower) ||
                    internship.location?.toLowerCase().includes(searchLower) ||
                    skillsString.includes(searchLower)
                if (!matchesSearch) return false
            }

            // Location filter
            if (filters.location !== "all") {
                const locLower = internship.location?.toLowerCase() || ""
                if (filters.location === "remote") {
                    if (!locLower.includes("remote")) return false
                } else if (!locLower.includes(filters.location.toLowerCase())) {
                    return false
                }
            }

            // Paid/Unpaid filter
            if (filters.paid !== "all") {
                if (filters.paid === "paid" && !internship.paid) return false
                if (filters.paid === "unpaid" && internship.paid) return false
            }

            // Salary range filter (only for paid internships)
            if (filters.paid !== "unpaid" && internship.paid && internship.salary) {
                const salary = Number(internship.salary)
                if (salary < filters.minSalary) return false
                if (filters.maxSalary < 10000 && salary > filters.maxSalary) return false
            }

            // Skills filter
            if (filters.skills.length > 0) {
                const internshipSkills = getSkillsString(internship.skills)
                const hasMatchingSkill = filters.skills.some(skill => 
                    internshipSkills.includes(skill.toLowerCase())
                )
                if (!hasMatchingSkill) return false
            }

            return true
        })
    }, [internships, filters])

    const now = Date.now()
    
    // Filter out expired internships for students (they shouldn't see them)
    // Companies can still see their expired internships with an indicator
    // Internships expire the day AFTER the end date (e.g., ends 22nd = expires on 23rd)
    const nonExpiredInternships = useMemo(() => {
        if (userType === "Company") return filteredInternships // Companies see all their internships
        return filteredInternships.filter((internship) => {
            if (!internship.applicationEnd) return true // No end date = always visible
            const endDate = new Date(internship.applicationEnd)
            // Set to end of the end date day (23:59:59) so it expires the next day
            endDate.setHours(23, 59, 59, 999)
            return endDate.getTime() >= now // Only show if not expired
        })
    }, [filteredInternships, userType, now])
    
    const finalInternships =
        filter === "recent"
            ? nonExpiredInternships.filter((internship) => {
                const createdAt = new Date(internship.createdAt).getTime()
                const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24)
                return diffDays <= 5
            })
            : nonExpiredInternships

    const displayedInternships = finalInternships.slice(0, displayCount)
    // hasMore can be used for "Load More" functionality
    const _hasMore = displayCount < finalInternships.length

    return (
        <section className="space-y-6">
            {/* Neon Gradient Header Section */}
            <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-cyan-500/10 border border-purple-500/20 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
                                <Briefcase className="h-6 w-6 text-white" />
                            </div>
                            {userType === "Company" ? t('internships.myRecentInternships') : t('internships.recentInternships')}
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            {finalInternships.length} {finalInternships.length === 1 ? t('internships.opportunityAvailable') : t('internships.opportunitiesAvailable')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl border border-purple-500/20 bg-background/80 backdrop-blur-sm p-1 shadow-lg">
                            <Button
                                variant={filter === "all" ? "default" : "ghost"}
                                size="sm"
                                className={`rounded-lg px-4 text-sm font-medium transition-all ${filter === "all" ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg" : ""}`}
                                onClick={() => setFilter("all")}
                            >
                                <Layers className="mr-1.5 h-4 w-4" />
                                {t('common.all')}
                            </Button>
                            <Button
                                variant={filter === "recent" ? "default" : "ghost"}
                                size="sm"
                                className={`rounded-lg px-4 text-sm font-medium transition-all ${filter === "recent" ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg" : ""}`}
                                onClick={() => setFilter("recent")}
                            >
                                <Zap className="mr-1.5 h-4 w-4" />
                                {t('common.recent')}
                            </Button>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={refreshing || isLoading}
                            className="rounded-xl border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            <span className="sr-only sm:not-sr-only sm:ml-2">{refreshing ? t('common.loading') : t('common.refresh')}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <InternshipFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                locations={uniqueLocations}
                allSkills={uniqueSkills}
            />

            {finalInternships.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-muted/50 p-4 mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{t('internships.noInternshipsFound')}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {t("recentInternships.tryAdjustingFilters")}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <AnimatePresence mode="popLayout">
                            {isLoading
                                ? Array.from({ length: 6 }).map((_, i) => <InternshipCardSkeleton key={i} />)
                                : displayedInternships.map((item, _index) => {
                                    const app = applications.find((a) => a.internshipId === item.id)
                                    const endDate = item.applicationEnd ? new Date(item.applicationEnd) : null
                                    const startTime = item.applicationStart ? new Date(item.applicationStart).getTime() : null
                                    const currentTime = Date.now()
                                    
                                    // Get end time - set to end of day so it expires the NEXT day
                                    let endTime: number | null = null
                                    if (endDate) {
                                        const endOfDay = new Date(endDate)
                                        endOfDay.setHours(23, 59, 59, 999)
                                        endTime = endOfDay.getTime()
                                    }
                                    
                                    // Check if internship is expired (the day after end date)
                                    const isExpired = endTime ? currentTime > endTime : false
                                    
                                    // Calculate days left (can be negative if expired)
                                    const daysLeft = endTime 
                                        ? Math.ceil((endTime - currentTime) / (1000 * 60 * 60 * 24))
                                        : null
                                    
                                    // Calculate progress percentage for the date range
                                    let progressPercent = 0
                                    if (startTime && endTime) {
                                        const totalDuration = endTime - startTime
                                        const elapsed = currentTime - startTime
                                        progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
                                        if (isExpired) progressPercent = 100
                                    }
                                    
                                    // Handle skills - could be string or array
                                    const skillsArray = Array.isArray(item.skills) 
                                        ? item.skills.filter(Boolean)
                                        : typeof item.skills === 'string' 
                                            ? item.skills.split(',').map(s => s.trim()).filter(Boolean) 
                                            : []

                                    return (
                                        <div
                                            key={item.id}
                                            className="group"
                                        >
                                            {/* Clean Card Design - Less Flashy */}
                                            <div className={`relative h-full bg-card dark:bg-slate-900/50 rounded-2xl border transition-colors duration-150 overflow-hidden ${
                                                isExpired 
                                                    ? "border-red-500/40 opacity-75" 
                                                    : "border-border hover:border-purple-500/30"
                                            }`}>
                                                {/* Expired overlay for company view */}
                                                {isExpired && userType === "Company" && (
                                                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-xs font-semibold shadow-lg">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {t("recentInternships.expired")}
                                                    </div>
                                                )}
                                                {/* Subtle gradient overlay on hover */}
                                                <div className={`absolute inset-0 transition-opacity duration-300 ${
                                                    isExpired 
                                                        ? "bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 opacity-100" 
                                                        : "bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100"
                                                }`} />

                                                <div className="relative z-10 p-6 space-y-4">
                                                    {/* Header with company and actions */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500/80 to-blue-500/80 flex items-center justify-center shadow-sm">
                                                                <Building2 className="h-7 w-7 text-white" />
                                                            </div>
                                                            <div className="min-w-0 space-y-1">
                                                                <h3 className="font-bold text-lg text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                                                                    {item.title}
                                                                </h3>
                                                                {item.company && (
                                                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                                        <Briefcase className="h-3.5 w-3.5" />
                                                                        {item.company.name}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {userType === "Student" && (
                                                                <BookmarkButton
                                                                    internshipId={item.id}
                                                                    isSaved={savedInternshipIds.has(item.id)}
                                                                    onToggle={() => mutateSavedInternships()}
                                                                    className="h-10 w-10 rounded-lg hover:bg-muted transition-colors"
                                                                />
                                                            )}
                                                            {userType === "Company" && (
                                                                <button
                                                                    onClick={() => handleDeleteInternship(item)}
                                                                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                                                                        pendingDeleteId === item.id 
                                                                            ? "text-red-500 bg-red-500/20 animate-pulse" 
                                                                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                                    }`}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {item.description}
                                                    </p>

                                                    {/* Date Range Indicator with Progress Bar */}
                                                    {(item.applicationStart || item.applicationEnd) && (
                                                        <div className={`rounded-lg border overflow-hidden ${
                                                            isExpired 
                                                                ? "bg-red-500/10 border-red-500/30" 
                                                                : "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20"
                                                        }`}>
                                                            <div className="flex items-center gap-2 px-3 py-2">
                                                                <Calendar className={`h-4 w-4 shrink-0 ${isExpired ? "text-red-500" : "text-purple-500"}`} />
                                                                <span className="text-xs font-medium text-foreground">
                                                                    {item.applicationStart 
                                                                        ? new Date(item.applicationStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                                        : t("recentInternships.now")
                                                                    }
                                                                </span>
                                                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                <span className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-foreground"}`}>
                                                                    {item.applicationEnd 
                                                                        ? new Date(item.applicationEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                                                        : t("recentInternships.open")
                                                                    }
                                                                </span>
                                                                {isExpired ? (
                                                                    <span className="ml-auto text-[10px] font-semibold text-red-500 flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        {t("recentInternships.closed")}
                                                                    </span>
                                                                ) : daysLeft !== null && daysLeft <= 3 && daysLeft > 0 ? (
                                                                    <span className="ml-auto text-[10px] font-semibold text-amber-500 flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {t("recentInternships.daysLeft", { days: daysLeft ?? 0 })}
                                                                    </span>
                                                                ) : daysLeft !== null && daysLeft > 3 ? (
                                                                    <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                                                                        {t("recentInternships.daysLeft", { days: daysLeft })}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            {/* Progress Bar */}
                                                            {startTime && endTime && (
                                                                <div className="h-1.5 w-full bg-muted/30">
                                                                    <div 
                                                                        className={`h-full transition-all duration-500 ${
                                                                            isExpired 
                                                                                ? "bg-red-500" 
                                                                                : progressPercent >= 80 
                                                                                    ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                                                                                    : "bg-gradient-to-r from-purple-500 to-blue-500"
                                                                        }`}
                                                                        style={{ width: `${progressPercent}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Info Grid - Key details at a glance */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                                                            <MapPin className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                                                            <p className="text-xs font-medium text-foreground truncate">{item.location || t("internships.remote")}</p>
                                                            <p className="text-[10px] text-muted-foreground">{t("internships.location")}</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                                                            <Euro className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                                                            <p className="text-xs font-medium text-foreground">{item.paid ? `€${item.salary || t("common.paid")}` : t("common.unpaid")}</p>
                                                            <p className="text-[10px] text-muted-foreground">{t("internships.salary")}</p>
                                                        </div>
                                                        <div className={`p-2.5 rounded-lg text-center ${isExpired ? "bg-red-500/10" : "bg-muted/50"}`}>
                                                            <Clock className={`h-4 w-4 mx-auto mb-1 ${isExpired ? "text-red-500" : "text-emerald-500"}`} />
                                                            <p className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-foreground"}`}>
                                                                {isExpired ? t("recentInternships.expired") : daysLeft !== null ? t("recentInternships.daysShort", { days: daysLeft }) : t("recentInternships.open")}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">{isExpired ? t("recentInternships.closed") : t("recentInternships.timeLeft")}</p>
                                                        </div>
                                                    </div>

                                                    {/* Skills Tags */}
                                                    {skillsArray.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {skillsArray.slice(0, 4).map((skill, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {skillsArray.length > 4 && (
                                                                <span className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                                                                    +{skillsArray.length - 4}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="relative z-10 px-6 pb-6 pt-3 flex gap-2 border-t border-border">
                                                    {userType === "Student" ? (
                                                        <>
                                                            {app ? (
                                                                <div className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold ${
                                                                    app.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" :
                                                                    app.status === "REJECTED" ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30" :
                                                                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                                                }`}>
                                                                    {app.status === "PENDING" && <><Clock3 className="h-4 w-4" />{t("common.applied")}</>}
                                                                    {app.status === "APPROVED" && <><CheckCircle2 className="h-4 w-4" />{t("common.approved")}</>}
                                                                    {app.status === "REJECTED" && <><XCircle className="h-4 w-4" />{t("recentInternships.notSelected")}</>}
                                                                </div>
                                                            ) : (
                                                                <ApplyButton
                                                                    internshipId={item.id}
                                                                    internshipTitle={item.title}
                                                                    companyName={item.company?.name || ""}
                                                                    requiresCoverLetter={(item as { requiresCoverLetter?: boolean }).requiresCoverLetter}
                                                                    onApplied={() => mutateApplications()}
                                                                />
                                                            )}
                                                            <Button
                                                                size="default"
                                                                variant="outline"
                                                                className="shrink-0 h-11 w-11 p-0 rounded-xl hover:bg-muted transition-colors"
                                                                onClick={() => {
                                                                    setSelectedInternship(item)
                                                                    setOpen(true)
                                                                }}
                                                            >
                                                                <Eye className="h-5 w-5 text-muted-foreground" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="flex gap-2 w-full">
                                                            {isExpired && (
                                                                <Button
                                                                    size="default"
                                                                    variant="outline"
                                                                    className="gap-1.5 h-11 rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                                                                    onClick={() => openRenewModal(item)}
                                                                >
                                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                                    {t("recentInternships.renew")}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="default"
                                                                className="flex-1 gap-2 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                                                                onClick={() => {
                                                                    setSelectedInternship(item)
                                                                    setManageOpen(true)
                                                                }}
                                                            >
                                                                <Settings className="h-4 w-4" />
                                                                {t("recentInternships.manage")}
                                                                <ArrowRight className="h-4 w-4 ml-auto" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details Modal for Students */}
                                            <InternshipDetailsModal
                                                open={open && selectedInternship?.id === item.id}
                                                onClose={() => setOpen(false)}
                                                internshipId={selectedInternship?.id || null}
                                            />
                                        </div>
                                    )
                                })}
                        </AnimatePresence>
                    </div>

                    {!isLoading && finalInternships.length > displayCount && (
                        <div className="flex justify-center pt-6">
                            <Button
                                variant="outline"
                                onClick={() => setDisplayCount((prev) => prev + 6)}
                                className="gap-2 rounded-xl px-6 py-5 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 shadow-lg"
                            >
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                {t("common.loadMore")}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Manage Modal for Companies */}
            <InternshipManageModal
                open={manageOpen}
                onClose={() => setManageOpen(false)}
                internship={selectedInternship}
                onUpdate={() => mutateInternships()}
            />

            {/* Renew Modal */}
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
                            {t("expiringBanner.chooseNewEndDate")} &quot;{renewTarget?.title}&quot;
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {renewTarget && (
                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{renewTarget.title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {t("expiringBanner.currentEnd")}: {renewTarget.applicationEnd ? format(new Date(renewTarget.applicationEnd), "MMM d, yyyy") : "—"}
                                    {renewTarget.applicationEnd && (
                                        <span className="text-amber-500 font-medium">
                                            ({formatDistanceToNow(new Date(renewTarget.applicationEnd), { addSuffix: true })})
                                        </span>
                                    )}
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
                            onClick={handleRenew}
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
        </section>
    )
}
