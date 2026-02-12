"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useTranslation } from "@/lib/i18n"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistanceToNow, isPast, isValid, parseISO, differenceInDays } from "date-fns"
import {
    FileText,
    Clock,
    X,
    CheckCircle2,
    Calendar,
    AlertTriangle,
    Download,
    Loader2,
    Search,
    Mail,
    FileCheck,
    Clock3,
    BarChart3,
    Eye,
    RefreshCw,
    AlertCircle
} from "lucide-react"

// ---------- Types ----------
interface Submission {
    id: string
    name: string
    size: number
    url: string
    createdAt: string
}

interface StudentProfile {
    name: string | null
}

interface Student {
    id: string
    email: string
    profile: StudentProfile | null
}

interface Assignment {
    id: string
    title: string
    description: string
    dueDate: string
    createdAt: string
    student: Student
    submissions: Submission[]
}

interface InternshipWithAssignments {
    id: string
    title: string
    testAssignmentTitle: string | null
    testAssignmentDescription: string | null
    assignments: Assignment[]
}

interface CompanyAssignmentProgressModalProps {
    open: boolean
    onClose: () => void
    onRefresh?: () => void
}

// ---------- Helpers ----------
const safeFormatDate = (dateValue: string | Date | null | undefined, formatStr: string): string => {
    if (!dateValue) return "Not set"
    try {
        const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue
        if (!isValid(date)) return "Not set"
        return format(date, formatStr)
    } catch {
        return "Not set"
    }
}

const safeFormatDistance = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return "Unknown"
    try {
        const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue
        if (!isValid(date)) return "Unknown"
        return formatDistanceToNow(date, { addSuffix: true })
    } catch {
        return "Unknown"
    }
}

const safeIsPast = (dateValue: string | Date | null | undefined): boolean => {
    if (!dateValue) return false
    try {
        const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue
        if (!isValid(date)) return false
        return isPast(date)
    } catch {
        return false
    }
}

const safeDifferenceInDays = (dateValue: string | Date | null | undefined): number => {
    if (!dateValue) return 0
    try {
        const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue
        if (!isValid(date)) return 0
        return differenceInDays(date, new Date())
    } catch {
        return 0
    }
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

// ---------- Component ----------
export function CompanyAssignmentProgressModal({ 
    open, 
    onClose,
    onRefresh
}: CompanyAssignmentProgressModalProps) {
    const { t } = useTranslation()
    const [internships, setInternships] = useState<InternshipWithAssignments[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    
    const [selectedInternship, setSelectedInternship] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'pending' | 'overdue'>('all')
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

    // Fetch assignments data
    const fetchData = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/assignments/company')
            if (!res.ok) throw new Error("Failed to fetch assignments")
            const data = await res.json()
            setInternships(data)
            if (data.length > 0 && !selectedInternship) {
                setSelectedInternship(data[0].id)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assignments")
        } finally {
            setLoading(false)
        }
    }, [selectedInternship])

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, fetchData])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchData()
        setRefreshing(false)
        onRefresh?.()
    }

    // Get current internship data
    const currentInternship = useMemo(() => {
        return internships.find(i => i.id === selectedInternship)
    }, [internships, selectedInternship])

    // Filter assignments
    const filteredAssignments = useMemo(() => {
        if (!currentInternship) return []
        
        return currentInternship.assignments.filter(assignment => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesSearch = 
                    assignment.title.toLowerCase().includes(query) ||
                    assignment.student.email.toLowerCase().includes(query) ||
                    (assignment.student.profile?.name?.toLowerCase().includes(query) ?? false)
                if (!matchesSearch) return false
            }

            // Status filter
            const hasSubmissions = assignment.submissions.length > 0
            const isOverdue = safeIsPast(assignment.dueDate)
            
            if (statusFilter === 'submitted' && !hasSubmissions) return false
            if (statusFilter === 'pending' && (hasSubmissions || isOverdue)) return false
            if (statusFilter === 'overdue' && (!isOverdue || hasSubmissions)) return false

            return true
        })
    }, [currentInternship, searchQuery, statusFilter])

    // Calculate stats
    const stats = useMemo(() => {
        if (!currentInternship) return { total: 0, submitted: 0, pending: 0, overdue: 0 }
        
        const total = currentInternship.assignments.length
        const submitted = currentInternship.assignments.filter(a => a.submissions.length > 0).length
        const overdue = currentInternship.assignments.filter(a => 
            a.submissions.length === 0 && safeIsPast(a.dueDate)
        ).length
        const pending = total - submitted - overdue

        return { total, submitted, pending, overdue }
    }, [currentInternship])

    return (
        <Dialog open={open} onOpenChange={() => onClose()}>
            <DialogContent showCloseButton={false} className="w-[95vw] !max-w-7xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl border-border bg-background">
                {/* Header */}
                <div className="relative overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 p-4 md:p-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent" />
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                        
                        <div className="relative flex items-center gap-3 md:gap-4">
                            <div className="hidden sm:flex p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
                                <BarChart3 className="h-6 w-6 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-base md:text-xl font-bold text-white truncate">
                                    {t("assignmentProgress.dashboardTitle")}
                                </DialogTitle>
                                <p className="text-white/60 text-xs md:text-sm mt-1 truncate">
                                    {t("assignmentProgress.dashboardSubtitle")}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="text-white/70 hover:text-white hover:bg-white/10"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col h-[calc(90vh-80px)] md:h-[calc(90vh-100px)] overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                            <p className="text-red-500">{error}</p>
                            <Button onClick={handleRefresh} variant="outline" className="mt-4">
                                {t("assignmentProgress.tryAgain")}
                            </Button>
                        </div>
                    ) : internships.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg">{t("assignmentProgress.noAssignmentsYet")}</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                {t("assignmentProgress.noAssignmentsDesc")}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                            {/* Sidebar - Internship List (horizontal scroll on mobile/tablet, vertical sidebar on desktop) */}
                            <div className="lg:w-56 xl:w-64 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 shrink-0">
                                <div className="p-3">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                                        {t("assignmentProgress.internships")}
                                    </p>
                                    <div className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-2 lg:pb-0">
                                        {internships.map(internship => {
                                            const assignmentCount = internship.assignments.length
                                            const submittedCount = internship.assignments.filter(a => a.submissions.length > 0).length
                                            
                                            return (
                                                <button
                                                    key={internship.id}
                                                    onClick={() => setSelectedInternship(internship.id)}
                                                    className={`min-w-[180px] lg:min-w-0 w-full p-3 rounded-xl text-left transition-all shrink-0 ${
                                                        selectedInternship === internship.id
                                                            ? 'bg-purple-500/10 border border-purple-500/30'
                                                            : 'hover:bg-muted border border-transparent'
                                                    }`}
                                                >
                                                    <p className="font-medium text-sm truncate">{internship.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {submittedCount}/{assignmentCount} {t("assignmentProgress.submitted")}
                                                        </span>
                                                        {assignmentCount > 0 && (
                                                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[40px]">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                    style={{ width: `${(submittedCount / assignmentCount) * 100}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {currentInternship ? (
                                    <>
                                        {/* Stats Bar */}
                                        <div className="px-3 py-2 md:px-4 md:py-3 border-b border-border bg-muted/10">
                                            <div className="grid grid-cols-4 gap-2 md:gap-3">
                                                <div className="p-2 md:p-3 rounded-xl bg-muted/50 text-center">
                                                    <p className="text-lg md:text-2xl font-bold text-foreground">{stats.total}</p>
                                                    <p className="text-[9px] md:text-xs text-muted-foreground truncate">{t("assignmentProgress.total")}</p>
                                                </div>
                                                <div className="p-2 md:p-3 rounded-xl bg-emerald-500/10 text-center">
                                                    <p className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.submitted}</p>
                                                    <p className="text-[9px] md:text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">{t("assignmentProgress.submittedLabel")}</p>
                                                </div>
                                                <div className="p-2 md:p-3 rounded-xl bg-amber-500/10 text-center">
                                                    <p className="text-lg md:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                                                    <p className="text-[9px] md:text-xs text-amber-600/70 dark:text-amber-400/70 truncate">{t("assignmentProgress.pendingLabel")}</p>
                                                </div>
                                                <div className="p-2 md:p-3 rounded-xl bg-red-500/10 text-center">
                                                    <p className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
                                                    <p className="text-[9px] md:text-xs text-red-600/70 dark:text-red-400/70 truncate">{t("assignmentProgress.overdueLabel")}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Filters */}
                                        <div className="px-3 py-2 md:px-4 md:py-3 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                            <div className="relative flex-1 sm:max-w-sm">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={t("assignmentProgress.searchStudents")}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-9 rounded-xl"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
                                                {(['all', 'submitted', 'pending', 'overdue'] as const).map(status => (
                                                    <Button
                                                        key={status}
                                                        size="sm"
                                                        variant={statusFilter === status ? 'default' : 'ghost'}
                                                        onClick={() => setStatusFilter(status)}
                                                        className={`rounded-lg text-xs capitalize whitespace-nowrap ${
                                                            statusFilter === status 
                                                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                                                                : ''
                                                        }`}
                                                    >
                                                        {t(`assignmentProgress.filter_${status}`)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Assignment List */}
                                        <div className="flex-1 overflow-y-auto p-4">
                                            {filteredAssignments.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <Search className="h-8 w-8 text-muted-foreground mb-3" />
                                                    <p className="text-muted-foreground">{t("assignmentProgress.noMatchingAssignments")}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <AnimatePresence>
                                                        {filteredAssignments.map((assignment, index) => {
                                                            const hasSubmissions = assignment.submissions.length > 0
                                                            const isOverdue = safeIsPast(assignment.dueDate)
                                                            const daysUntilDue = safeDifferenceInDays(assignment.dueDate)

                                                            return (
                                                                <motion.div
                                                                    key={assignment.id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    transition={{ delay: index * 0.02 }}
                                                                    className={`p-3 md:p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                                                                        hasSubmissions 
                                                                            ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' 
                                                                            : isOverdue
                                                                                ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                                                                : 'bg-card border-border hover:border-purple-500/40'
                                                                    }`}
                                                                    onClick={() => setSelectedAssignment(assignment)}
                                                                >
                                                                    <div className="flex items-start gap-3 md:gap-4">
                                                                        {/* Student Avatar */}
                                                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base ${
                                                                            hasSubmissions 
                                                                                ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                                                                                : isOverdue
                                                                                    ? 'bg-gradient-to-br from-red-500 to-orange-600'
                                                                                    : 'bg-gradient-to-br from-purple-500 to-blue-600'
                                                                        }`}>
                                                                            {(assignment.student.profile?.name || assignment.student.email).charAt(0).toUpperCase()}
                                                                        </div>

                                                                        {/* Content */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div>
                                                                                    <h4 className="font-semibold text-foreground">
                                                                                        {assignment.student.profile?.name || t("assignmentProgress.unknownStudent")}
                                                                                    </h4>
                                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                                        <Mail className="h-3 w-3" />
                                                                                        {assignment.student.email}
                                                                                    </p>
                                                                                </div>
                                                                                <Badge className={`shrink-0 ${
                                                                                    hasSubmissions
                                                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                                                        : isOverdue
                                                                                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                                                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                                                }`}>
                                                                                    {hasSubmissions ? (
                                                                                        <><CheckCircle2 className="h-3 w-3 mr-1" />{t("assignmentProgress.submittedBadge")}</>
                                                                                    ) : isOverdue ? (
                                                                                        <><AlertCircle className="h-3 w-3 mr-1" />{t("assignmentProgress.overdueBadge")}</>
                                                                                    ) : (
                                                                                        <><Clock3 className="h-3 w-3 mr-1" />{t("assignmentProgress.pendingBadge")}</>
                                                                                    )}
                                                                                </Badge>
                                                                            </div>

                                                                            {/* Assignment Info */}
                                                                            <div className="mt-2 md:mt-3 p-2 rounded-lg bg-muted/30">
                                                                                <p className="text-xs md:text-sm font-medium">{assignment.title}</p>
                                                                                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 text-xs text-muted-foreground">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Calendar className="h-3 w-3" />
                                                                                        {t("assignmentProgress.due")}: {safeFormatDate(assignment.dueDate, "MMM d, yyyy")}
                                                                                    </span>
                                                                                    {!hasSubmissions && !isOverdue && (
                                                                                        <span className={`flex items-center gap-1 ${
                                                                                            daysUntilDue <= 3 ? 'text-amber-500' : ''
                                                                                        }`}>
                                                                                            <Clock className="h-3 w-3" />
                                                                                            {t("assignmentProgress.daysLeft", { count: daysUntilDue })}
                                                                                        </span>
                                                                                    )}
                                                                                    {hasSubmissions && (
                                                                                        <span className="flex items-center gap-1 text-emerald-500">
                                                                                            <FileCheck className="h-3 w-3" />
                                                                                            {t("assignmentProgress.filesCount", { count: assignment.submissions.length })}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <Button size="sm" variant="ghost" className="shrink-0">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </motion.div>
                                                            )
                                                        })}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">{t("assignmentProgress.selectInternship")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Assignment Detail Modal */}
                <AnimatePresence>
                    {selectedAssignment && (
                        <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
                            <DialogContent className="max-w-lg rounded-2xl">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                                            selectedAssignment.submissions.length > 0
                                                ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                                : safeIsPast(selectedAssignment.dueDate)
                                                    ? 'bg-gradient-to-br from-red-500 to-orange-600'
                                                    : 'bg-gradient-to-br from-purple-500 to-blue-600'
                                        }`}>
                                            {(selectedAssignment.student.profile?.name || selectedAssignment.student.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <DialogTitle className="text-lg font-bold">
                                                {selectedAssignment.student.profile?.name || t("assignmentProgress.unknownStudent")}
                                            </DialogTitle>
                                            <p className="text-sm text-muted-foreground">{selectedAssignment.student.email}</p>
                                        </div>
                                    </div>

                                    {/* Assignment Details */}
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("assignmentProgress.assignmentLabel")}</p>
                                            <p className="font-medium">{selectedAssignment.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("assignmentProgress.descriptionLabel")}</p>
                                            <p className="text-sm text-muted-foreground">{selectedAssignment.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t("assignmentProgress.dueDateLabel")}</p>
                                                <p className="text-sm font-medium">{safeFormatDate(selectedAssignment.dueDate, "MMM d, yyyy 'at' h:mm a")}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t("assignmentProgress.createdLabel")}</p>
                                                <p className="text-sm font-medium">{safeFormatDistance(selectedAssignment.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submissions */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <FileCheck className="h-4 w-4 text-purple-500" />
                                            {t("assignmentProgress.submissions")} ({selectedAssignment.submissions.length})
                                        </h4>
                                        {selectedAssignment.submissions.length === 0 ? (
                                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                                <Clock3 className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                                                <p className="text-sm text-amber-600 dark:text-amber-400">{t("assignmentProgress.noSubmissionsYet")}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedAssignment.submissions.map(file => (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                                                    >
                                                        <div className="p-2 rounded-lg bg-emerald-500/10">
                                                            <FileText className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(file.size)} • {safeFormatDistance(file.createdAt)}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                                                        >
                                                            <Download className="h-4 w-4 text-purple-500" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button onClick={() => setSelectedAssignment(null)} className="w-full">
                                        {t("assignmentProgress.close")}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
