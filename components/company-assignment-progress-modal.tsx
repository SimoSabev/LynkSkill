"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useTranslation } from "@/lib/i18n"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
    AlertCircle,
    ArrowLeft,
    File,
    ChevronRight,
    Users
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

const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'text-red-500 bg-red-500/10'
    if (ext === 'doc' || ext === 'docx') return 'text-blue-500 bg-blue-500/10'
    if (ext === 'zip') return 'text-amber-500 bg-amber-500/10'
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'text-emerald-500 bg-emerald-500/10'
    return 'text-violet-500 bg-violet-500/10'
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
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    
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
            setLastUpdated(new Date())
            if (data.length > 0 && !selectedInternship) {
                setSelectedInternship(data[0].id)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assignments")
        } finally {
            setLoading(false)
        }
    }, [selectedInternship])

    // Silent background refresh (no loading spinner)
    const silentRefresh = React.useCallback(async () => {
        try {
            const res = await fetch('/api/assignments/company')
            if (!res.ok) return
            const data = await res.json()
            setInternships(data)
            setLastUpdated(new Date())
        } catch {
            // Silent fail for background polling
        }
    }, [])

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, fetchData])

    // Auto-poll every 15 seconds when modal is open
    useEffect(() => {
        if (!open) return
        const interval = setInterval(silentRefresh, 15000)
        return () => clearInterval(interval)
    }, [open, silentRefresh])

    // Reset detail view when modal closes
    useEffect(() => {
        if (!open) {
            setSelectedAssignment(null)
            setSearchQuery("")
            setStatusFilter('all')
            setLastUpdated(null)
        }
    }, [open])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchData()
        setLastUpdated(new Date())
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
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesSearch = 
                    assignment.title.toLowerCase().includes(query) ||
                    assignment.student.email.toLowerCase().includes(query) ||
                    (assignment.student.profile?.name?.toLowerCase().includes(query) ?? false)
                if (!matchesSearch) return false
            }

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

    // ---------- Detail View ----------
    const renderDetailView = () => {
        if (!selectedAssignment) return null

        const hasSubmissions = selectedAssignment.submissions.length > 0
        const isOverdue = safeIsPast(selectedAssignment.dueDate)

        return (
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
            >
                {/* Detail Header */}
                <div className="px-4 py-3 border-b border-border bg-muted/10 shrink-0">
                    <button
                        onClick={() => setSelectedAssignment(null)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("assignmentProgress.backToList")}
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                            hasSubmissions
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                : isOverdue
                                    ? 'bg-gradient-to-br from-red-500 to-orange-600'
                                    : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                        }`}>
                            {(selectedAssignment.student.profile?.name || selectedAssignment.student.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate">
                                {selectedAssignment.student.profile?.name || t("assignmentProgress.unknownStudent")}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />{selectedAssignment.student.email}
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
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Assignment Info Card */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                        <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{t("assignmentProgress.assignmentLabel")}</p>
                            <p className="font-semibold text-foreground">{selectedAssignment.title}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{t("assignmentProgress.descriptionLabel")}</p>
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{selectedAssignment.description}</p>
                        </div>
                        <div className="flex items-center gap-6 pt-1">
                            <div>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{t("assignmentProgress.dueDateLabel")}</p>
                                <p className={`text-sm font-medium mt-0.5 ${isOverdue ? 'text-red-500' : ''}`}>
                                    {safeFormatDate(selectedAssignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{t("assignmentProgress.createdLabel")}</p>
                                <p className="text-sm font-medium mt-0.5">{safeFormatDistance(selectedAssignment.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Submissions */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-violet-500" />
                            {t("assignmentProgress.submissions")} ({selectedAssignment.submissions.length})
                        </h4>
                        {selectedAssignment.submissions.length === 0 ? (
                            <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                                <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                                    <Clock3 className="h-6 w-6 text-amber-500" />
                                </div>
                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t("assignmentProgress.noSubmissionsYet")}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t("assignmentProgress.awaitingStudent")}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedAssignment.submissions.map((file, i) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/30 transition-colors group"
                                    >
                                        <div className={`p-1.5 rounded-lg ${getFileIcon(file.name)}`}>
                                            <File className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {formatFileSize(file.size)} • {safeFormatDistance(file.createdAt)}
                                            </p>
                                        </div>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-colors opacity-70 group-hover:opacity-100"
                                        >
                                            <Download className="h-3.5 w-3.5 text-violet-500" />
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        )
    }

    // ---------- List View ----------
    const renderListView = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
        >
            {currentInternship ? (
                <>
                    {/* Stats Bar */}
                    <div className="px-3 py-2.5 md:px-4 md:py-3 border-b border-border bg-muted/10 shrink-0">
                        <div className="grid grid-cols-4 gap-2 md:gap-3">
                            {[
                                { value: stats.total, label: t("assignmentProgress.total"), color: 'bg-muted/50', textColor: 'text-foreground', labelColor: 'text-muted-foreground' },
                                { value: stats.submitted, label: t("assignmentProgress.submittedLabel"), color: 'bg-emerald-500/10', textColor: 'text-emerald-600 dark:text-emerald-400', labelColor: 'text-emerald-600/70 dark:text-emerald-400/70' },
                                { value: stats.pending, label: t("assignmentProgress.pendingLabel"), color: 'bg-amber-500/10', textColor: 'text-amber-600 dark:text-amber-400', labelColor: 'text-amber-600/70 dark:text-amber-400/70' },
                                { value: stats.overdue, label: t("assignmentProgress.overdueLabel"), color: 'bg-red-500/10', textColor: 'text-red-600 dark:text-red-400', labelColor: 'text-red-600/70 dark:text-red-400/70' }
                            ].map(({ value, label, color, textColor, labelColor }) => (
                                <div key={label} className={`p-2 md:p-3 rounded-xl ${color} text-center`}>
                                    <p className={`text-lg md:text-2xl font-bold ${textColor}`}>{value}</p>
                                    <p className={`text-[9px] md:text-xs truncate ${labelColor}`}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="px-3 py-2 md:px-4 md:py-3 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
                        <div className="relative flex-1 sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("assignmentProgress.searchStudents")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-xl"
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto shrink-0">
                            {(['all', 'submitted', 'pending', 'overdue'] as const).map(status => (
                                <Button
                                    key={status}
                                    size="sm"
                                    variant={statusFilter === status ? 'default' : 'ghost'}
                                    onClick={() => setStatusFilter(status)}
                                    className={`rounded-lg text-xs capitalize whitespace-nowrap ${
                                        statusFilter === status 
                                            ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm' 
                                            : ''
                                    }`}
                                >
                                    {t(`assignmentProgress.filter_${status}`)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Assignment List */}
                    <div className="flex-1 overflow-y-auto p-3 md:p-4">
                        {filteredAssignments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                                    <Search className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">{t("assignmentProgress.noMatchingAssignments")}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredAssignments.map((assignment, index) => {
                                    const hasSubmissions = assignment.submissions.length > 0
                                    const isOverdue = safeIsPast(assignment.dueDate)
                                    const daysUntilDue = safeDifferenceInDays(assignment.dueDate)

                                    return (
                                        <motion.div
                                            key={assignment.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={`p-3 md:p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md group ${
                                                hasSubmissions 
                                                    ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/40' 
                                                    : isOverdue
                                                        ? 'bg-red-500/5 border-red-500/15 hover:border-red-500/40'
                                                        : 'bg-card border-border hover:border-violet-500/40'
                                            }`}
                                            onClick={() => setSelectedAssignment(assignment)}
                                        >
                                            <div className="flex items-center gap-3 md:gap-4">
                                                {/* Student Avatar */}
                                                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                                                    hasSubmissions 
                                                        ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                                                        : isOverdue
                                                            ? 'bg-gradient-to-br from-red-500 to-orange-600'
                                                            : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                                                }`}>
                                                    {(assignment.student.profile?.name || assignment.student.email).charAt(0).toUpperCase()}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-sm text-foreground truncate">
                                                            {assignment.student.profile?.name || t("assignmentProgress.unknownStudent")}
                                                        </h4>
                                                        <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${
                                                            hasSubmissions
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                                : isOverdue
                                                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                        }`}>
                                                            {hasSubmissions ? t("assignmentProgress.submittedBadge")
                                                                : isOverdue ? t("assignmentProgress.overdueBadge")
                                                                : t("assignmentProgress.pendingBadge")}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1 truncate">
                                                            <FileText className="h-3 w-3 shrink-0" />
                                                            {assignment.title}
                                                        </span>
                                                        <span className="flex items-center gap-1 shrink-0">
                                                            <Calendar className="h-3 w-3" />
                                                            {safeFormatDate(assignment.dueDate, "MMM d")}
                                                        </span>
                                                        {!hasSubmissions && !isOverdue && daysUntilDue <= 3 && (
                                                            <span className="flex items-center gap-1 text-amber-500 shrink-0">
                                                                <Clock className="h-3 w-3" />
                                                                {t("assignmentProgress.daysLeft", { count: daysUntilDue })}
                                                            </span>
                                                        )}
                                                        {hasSubmissions && (
                                                            <span className="flex items-center gap-1 text-emerald-500 shrink-0">
                                                                <FileCheck className="h-3 w-3" />
                                                                {t("assignmentProgress.filesCount", { count: assignment.submissions.length })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t("assignmentProgress.selectInternship")}</p>
                </div>
            )}
        </motion.div>
    )

    return (
        <Dialog open={open} onOpenChange={() => { if (!loading) onClose() }}>
            <DialogContent showCloseButton={false} className="w-[95vw] !max-w-7xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl border-0 bg-background flex flex-col">
                {/* Header */}
                <div className="relative overflow-hidden shrink-0">
                    <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-4 md:px-6 md:py-5">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                        
                        <div className="relative flex items-center gap-3 md:gap-4">
                            <div className="hidden sm:flex p-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-base md:text-lg font-bold text-white truncate">
                                    {t("assignmentProgress.dashboardTitle")}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <DialogDescription className="text-white/70 text-xs md:text-sm truncate">
                                        {t("assignmentProgress.dashboardSubtitle")}
                                    </DialogDescription>
                                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Live
                                    </span>
                                    {lastUpdated && (
                                        <span className="hidden md:inline text-[10px] text-white/50">
                                            {safeFormatDistance(lastUpdated)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                            <p className="text-sm text-muted-foreground">{t("assignmentProgress.loading")}</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-sm text-red-500 font-medium">{error}</p>
                            <Button onClick={handleRefresh} variant="outline" className="mt-4 rounded-xl">
                                {t("assignmentProgress.tryAgain")}
                            </Button>
                        </div>
                    ) : internships.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-bold text-lg">{t("assignmentProgress.noAssignmentsYet")}</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                {t("assignmentProgress.noAssignmentsDesc")}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
                            {/* Sidebar */}
                            <div className="lg:w-56 xl:w-64 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 shrink-0">
                                <div className="p-3">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                                        {t("assignmentProgress.internships")}
                                    </p>
                                    <div className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-2 lg:pb-0">
                                        {internships.map(internship => {
                                            const assignmentCount = internship.assignments.length
                                            const submittedCount = internship.assignments.filter(a => a.submissions.length > 0).length
                                            const progress = assignmentCount > 0 ? (submittedCount / assignmentCount) * 100 : 0
                                            
                                            return (
                                                <button
                                                    key={internship.id}
                                                    onClick={() => { setSelectedInternship(internship.id); setSelectedAssignment(null) }}
                                                    className={`min-w-[180px] lg:min-w-0 w-full p-3 rounded-xl text-left transition-all shrink-0 ${
                                                        selectedInternship === internship.id
                                                            ? 'bg-violet-500/10 border border-violet-500/30 shadow-sm'
                                                            : 'hover:bg-muted border border-transparent'
                                                    }`}
                                                >
                                                    <p className="font-medium text-sm truncate">{internship.title}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                            {submittedCount}/{assignmentCount} {t("assignmentProgress.submitted")}
                                                        </span>
                                                        {assignmentCount > 0 && (
                                                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[40px]">
                                                                <motion.div
                                                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    transition={{ duration: 0.5 }}
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

                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                                <AnimatePresence mode="wait">
                                    {selectedAssignment ? (
                                        <React.Fragment key="detail">{renderDetailView()}</React.Fragment>
                                    ) : (
                                        <React.Fragment key="list">{renderListView()}</React.Fragment>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
