"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { motion, AnimatePresence } from "framer-motion"
import type { Internship } from "@/app/types"
import {
    Briefcase,
    MapPin,
    FileText,
    GraduationCap,
    DollarSign,
    CheckCircle,
    CalendarIcon,
    Save,
    Users,
    Clock,
    Eye,
    Edit3,
    X,
    Building2,
    Timer,
    ScrollText,
    Award,
    Sparkles,
    ArrowRight,
    UserCheck,
    UserX,
    Mail,
    ChevronRight,
} from "lucide-react"
import { format, formatDistanceToNow, isValid, parseISO, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"

// Safe date formatting helper
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

const safeFormatDistance = (dateValue: string | Date | number | null | undefined): string => {
    if (!dateValue) return "Unknown"
    try {
        const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue)
        if (!isValid(date)) return "Unknown"
        return formatDistanceToNow(date, { addSuffix: true })
    } catch {
        return "Unknown"
    }
}

interface Application {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    createdAt: string
    student: {
        id: string
        name: string | null
        email: string
    }
}

interface InternshipManageModalProps {
    open: boolean
    onClose: () => void
    internship: Internship | null
    onUpdate?: () => void
}

export function InternshipManageModal({ open, onClose, internship, onUpdate }: InternshipManageModalProps) {
    const [activeView, setActiveView] = useState<"overview" | "applications" | "edit">("overview")
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [applications, setApplications] = useState<Application[]>([])
    
    // Form state - using Date objects for date pickers
    const [formValues, setFormValues] = useState({
        title: "",
        description: "",
        location: "",
        qualifications: "",
        salary: "",
        paid: false,
        requiresCoverLetter: false,
        duration: "",
        skills: "",
        applicationStart: undefined as Date | undefined,
        applicationEnd: undefined as Date | undefined,
    })

    // Today's date for validation
    const today = useMemo(() => startOfDay(new Date()), [])

    // Date validation - disable past dates
    const disableStartDate = useCallback(
        (date: Date) => startOfDay(date) < today,
        [today]
    )

    // Date validation - disable dates before start date and past dates
    const disableEndDate = useCallback(
        (date: Date) => {
            const d = startOfDay(date)
            if (d < today) return true
            if (formValues.applicationStart && d < startOfDay(formValues.applicationStart)) return true
            return false
        },
        [formValues.applicationStart, today]
    )

    // Load internship data into form
    useEffect(() => {
        if (internship) {
            // Handle skills that might be array or string
            const skillsValue = Array.isArray(internship.skills) 
                ? internship.skills.join(", ") 
                : (internship.skills || "")
            
            setFormValues({
                title: internship.title || "",
                description: internship.description || "",
                location: internship.location || "",
                qualifications: internship.qualifications || "",
                salary: internship.salary?.toString() || "",
                paid: internship.paid || false,
                requiresCoverLetter: (internship as any).requiresCoverLetter || false,
                duration: internship.duration || "",
                skills: skillsValue,
                applicationStart: internship.applicationStart ? parseISO(internship.applicationStart) : undefined,
                applicationEnd: internship.applicationEnd ? parseISO(internship.applicationEnd) : undefined,
            })
        }
    }, [internship])

    // Fetch applications for this internship
    useEffect(() => {
        if (open && internship?.id) {
            setIsLoading(true)
            fetch(`/api/applications?internshipId=${internship.id}`)
                .then(res => res.json())
                .then(data => {
                    setApplications(Array.isArray(data) ? data : [])
                })
                .catch(console.error)
                .finally(() => setIsLoading(false))
        }
    }, [open, internship?.id])

    // Reset view when modal closes
    useEffect(() => {
        if (!open) {
            setActiveView("overview")
        }
    }, [open])

    const updateField = useCallback(<K extends keyof typeof formValues>(key: K, value: typeof formValues[K]) => {
        setFormValues(prev => ({ ...prev, [key]: value }))
    }, [])

    const handleSave = async () => {
        if (!internship) return
        setIsSaving(true)
        
        try {
            const res = await fetch(`/api/internships/${internship.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formValues.title,
                    description: formValues.description,
                    location: formValues.location,
                    qualifications: formValues.qualifications || null,
                    paid: formValues.paid,
                    salary: formValues.paid && formValues.salary ? parseFloat(formValues.salary) : null,
                    requiresCoverLetter: formValues.requiresCoverLetter,
                    duration: formValues.duration || null,
                    skills: formValues.skills || null,
                    applicationStart: formValues.applicationStart?.toISOString().split("T")[0] || null,
                    applicationEnd: formValues.applicationEnd?.toISOString().split("T")[0] || null,
                }),
            })

            if (res.ok) {
                setActiveView("overview")
                onUpdate?.()
            } else {
                const err = await res.json()
                alert(err.message || "Failed to update internship")
            }
        } catch (error) {
            console.error(error)
            alert("Failed to update internship")
        } finally {
            setIsSaving(false)
        }
    }

    const handleApplicationAction = async (applicationId: string, action: "APPROVED" | "REJECTED") => {
        try {
            const res = await fetch(`/api/applications/${applicationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action }),
            })

            if (res.ok) {
                setApplications(prev => 
                    prev.map(app => app.id === applicationId ? { ...app, status: action } : app)
                )
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleClose = () => {
        setActiveView("overview")
        onClose()
    }

    if (!internship) return null

    const pendingCount = applications.filter(a => a.status === "PENDING").length
    const approvedCount = applications.filter(a => a.status === "APPROVED").length
    const rejectedCount = applications.filter(a => a.status === "REJECTED").length

    // Parse skills array - handle both string and array formats
    const skillsArray = Array.isArray(internship.skills) 
        ? internship.skills 
        : typeof internship.skills === 'string' 
            ? internship.skills.split(",").map(s => s.trim()).filter(Boolean) 
            : []

    // Calculate days remaining for application
    const daysRemaining = internship.applicationEnd 
        ? Math.max(0, Math.ceil((new Date(internship.applicationEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden p-0 gap-0 border-0 bg-gradient-to-b from-background to-background/95 rounded-3xl shadow-2xl">
                {/* Dynamic Gradient Header based on internship data */}
                <div className="relative overflow-hidden">
                    {/* Subtle gradient background - less flashy */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
                    
                    <div className="relative z-10 p-8">
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/20"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>

                        {/* Header Content */}
                        <div className="flex items-start gap-5">
                            {/* Company Icon/Avatar */}
                            <div className="relative">
                                <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                                    <Building2 className="h-10 w-10 text-white" />
                                </div>
                                {internship.paid && (
                                    <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white shadow-lg">
                                        <DollarSign className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Title & Meta */}
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
                                    {internship.title}
                                </DialogTitle>
                                <div className="flex flex-wrap items-center gap-3 text-white/80">
                                    {internship.company?.name && (
                                        <span className="flex items-center gap-1.5 text-sm">
                                            <Briefcase className="h-4 w-4" />
                                            {internship.company.name}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-sm">
                                        <MapPin className="h-4 w-4" />
                                        {internship.location}
                                    </span>
                                    {internship.duration && (
                                        <span className="flex items-center gap-1.5 text-sm">
                                            <Timer className="h-4 w-4" />
                                            {internship.duration}
                                        </span>
                                    )}
                                </div>

                                {/* Skills Tags */}
                                {skillsArray.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {skillsArray.slice(0, 4).map((skill, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 text-xs font-medium rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {skillsArray.length > 4 && (
                                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/70">
                                                +{skillsArray.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Cards Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                            {/* Total Applicants */}
                            <button 
                                className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all group text-left"
                                onClick={() => setActiveView("applications")}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Users className="h-5 w-5 text-white/80" />
                                    <ChevronRight className="h-4 w-4 text-white/50 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                <p className="text-3xl font-bold text-white">{applications.length}</p>
                                <p className="text-xs text-white/60 mt-1">Total Applicants</p>
                            </button>

                            {/* Pending */}
                            <div className="p-4 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 hover:bg-amber-500/25 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <Clock className="h-5 w-5 text-amber-300" />
                                    {pendingCount > 0 && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-amber-100">{pendingCount}</p>
                                <p className="text-xs text-amber-200/60 mt-1">Pending Review</p>
                            </div>

                            {/* Approved */}
                            <div className="p-4 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30">
                                <div className="flex items-center justify-between mb-2">
                                    <CheckCircle className="h-5 w-5 text-emerald-300" />
                                </div>
                                <p className="text-3xl font-bold text-emerald-100">{approvedCount}</p>
                                <p className="text-xs text-emerald-200/60 mt-1">Approved</p>
                            </div>

                            {/* Days Remaining or Salary */}
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                                <div className="flex items-center justify-between mb-2">
                                    {internship.paid ? (
                                        <DollarSign className="h-5 w-5 text-cyan-300" />
                                    ) : (
                                        <CalendarIcon className="h-5 w-5 text-white/80" />
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    {internship.paid && internship.salary 
                                        ? `$${internship.salary.toLocaleString()}`
                                        : daysRemaining !== null 
                                            ? daysRemaining 
                                            : "—"
                                    }
                                </p>
                                <p className="text-xs text-white/60 mt-1">
                                    {internship.paid ? "Monthly Salary" : "Days Left to Apply"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 px-6 py-3 border-b bg-muted/30">
                    {[
                        { id: "overview", label: "Overview", icon: Eye },
                        { id: "applications", label: "Applications", icon: Users, badge: pendingCount },
                        { id: "edit", label: "Edit Details", icon: Edit3 },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as typeof activeView)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                                activeView === tab.id
                                    ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-primary border border-purple-500/30"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.badge ? (
                                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                                    {tab.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto max-h-[45vh]">
                    <AnimatePresence mode="wait">
                        {activeView === "overview" && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-6 space-y-6"
                            >
                                {/* Quick Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                                        <CalendarIcon className="h-5 w-5 text-purple-500 mb-2" />
                                        <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                                        <p className="font-semibold text-sm">
                                            {safeFormatDate(internship.applicationStart, "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                                        <CalendarIcon className="h-5 w-5 text-blue-500 mb-2" />
                                        <p className="text-xs text-muted-foreground mb-1">End Date</p>
                                        <p className="font-semibold text-sm">
                                            {safeFormatDate(internship.applicationEnd, "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
                                        <Timer className="h-5 w-5 text-cyan-500 mb-2" />
                                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                        <p className="font-semibold text-sm">{internship.duration || "Flexible"}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                                        <DollarSign className="h-5 w-5 text-emerald-500 mb-2" />
                                        <p className="text-xs text-muted-foreground mb-1">Compensation</p>
                                        <p className="font-semibold text-sm">
                                            {internship.paid ? `$${internship.salary}/month` : "Unpaid"}
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5 text-purple-500" />
                                        Description
                                    </h3>
                                    <div className="p-5 rounded-2xl bg-muted/50 border text-sm leading-relaxed text-muted-foreground">
                                        {internship.description || "No description provided."}
                                    </div>
                                </div>

                                {/* Qualifications */}
                                {internship.qualifications && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2 text-lg">
                                            <GraduationCap className="h-5 w-5 text-blue-500" />
                                            Qualifications
                                        </h3>
                                        <div className="p-5 rounded-2xl bg-muted/50 border text-sm leading-relaxed text-muted-foreground">
                                            {internship.qualifications}
                                        </div>
                                    </div>
                                )}

                                {/* Posted Date */}
                                <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                                        Posted {safeFormatDistance(internship.createdAt)}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="gap-2 text-primary hover:text-primary/80"
                                        onClick={() => setActiveView("edit")}
                                    >
                                        Edit Internship
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {activeView === "applications" && (
                            <motion.div
                                key="applications"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-6"
                            >
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="p-5 rounded-2xl bg-muted/30 animate-pulse border">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-muted" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-1/3 bg-muted rounded" />
                                                        <div className="h-3 w-1/4 bg-muted rounded" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : applications.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-5 border border-purple-500/30">
                                            <Users className="h-10 w-10 text-purple-500" />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">No Applications Yet</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                            When students apply for this internship, their applications will appear here for you to review.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Filter Pills */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-sm text-muted-foreground">Filter:</span>
                                            <div className="flex gap-1">
                                                {[
                                                    { label: "All", count: applications.length },
                                                    { label: "Pending", count: pendingCount },
                                                    { label: "Approved", count: approvedCount },
                                                    { label: "Rejected", count: rejectedCount },
                                                ].map(filter => (
                                                    <button
                                                        key={filter.label}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/50 hover:bg-muted transition-colors"
                                                    >
                                                        {filter.label} ({filter.count})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {applications.map((app, index) => (
                                            <motion.div
                                                key={app.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group p-5 rounded-2xl bg-gradient-to-r from-card to-card/80 border hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {/* Avatar */}
                                                        <div className="relative">
                                                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                                                {(app.student.name || app.student.email)[0].toUpperCase()}
                                                            </div>
                                                            <div className={cn(
                                                                "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center",
                                                                app.status === "PENDING" && "bg-amber-500",
                                                                app.status === "APPROVED" && "bg-emerald-500",
                                                                app.status === "REJECTED" && "bg-red-500"
                                                            )}>
                                                                {app.status === "PENDING" && <Clock className="h-3 w-3 text-white" />}
                                                                {app.status === "APPROVED" && <CheckCircle className="h-3 w-3 text-white" />}
                                                                {app.status === "REJECTED" && <X className="h-3 w-3 text-white" />}
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div>
                                                            <p className="font-semibold text-base">{app.student.name || "Student"}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                                <Mail className="h-3.5 w-3.5" />
                                                                {app.student.email}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Applied {safeFormatDistance(app.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        {app.status === "PENDING" ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 rounded-xl"
                                                                    onClick={() => handleApplicationAction(app.id, "REJECTED")}
                                                                >
                                                                    <UserX className="h-4 w-4" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl shadow-lg shadow-emerald-500/20"
                                                                    onClick={() => handleApplicationAction(app.id, "APPROVED")}
                                                                >
                                                                    <UserCheck className="h-4 w-4" />
                                                                    Approve
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Badge className={cn(
                                                                "px-4 py-2 text-sm font-medium rounded-xl",
                                                                app.status === "APPROVED" 
                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                                                                    : "bg-red-500/10 text-red-600 border-red-500/30"
                                                            )}>
                                                                {app.status === "APPROVED" ? (
                                                                    <><CheckCircle className="h-4 w-4 mr-1.5" /> Approved</>
                                                                ) : (
                                                                    <><X className="h-4 w-4 mr-1.5" /> Rejected</>
                                                                )}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeView === "edit" && (
                            <motion.div
                                key="edit"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-6 space-y-6"
                            >
                                {/* Basic Info Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Briefcase className="h-4 w-4 text-purple-500" />
                                            Job Title
                                        </Label>
                                        <Input
                                            value={formValues.title}
                                            onChange={e => updateField("title", e.target.value)}
                                            placeholder="e.g., Software Engineering Intern"
                                            className="h-12 rounded-xl border-2 focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            Location
                                        </Label>
                                        <Input
                                            value={formValues.location}
                                            onChange={e => updateField("location", e.target.value)}
                                            placeholder="e.g., New York, NY or Remote"
                                            className="h-12 rounded-xl border-2 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Duration & Skills Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <CalendarIcon className="h-4 w-4 text-cyan-500" />
                                            Applications Open
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full h-12 justify-start rounded-xl border-2 transition-all hover:border-cyan-500",
                                                        !formValues.applicationStart && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formValues.applicationStart ? (
                                                        format(formValues.applicationStart, "PPP")
                                                    ) : (
                                                        <span>Pick start date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formValues.applicationStart}
                                                    onSelect={(date) => updateField("applicationStart", date)}
                                                    initialFocus
                                                    disabled={disableStartDate}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <CalendarIcon className="h-4 w-4 text-purple-500" />
                                            Applications Close
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full h-12 justify-start rounded-xl border-2 transition-all hover:border-purple-500",
                                                        !formValues.applicationEnd && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formValues.applicationEnd ? (
                                                        format(formValues.applicationEnd, "PPP")
                                                    ) : (
                                                        <span>Pick end date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formValues.applicationEnd}
                                                    onSelect={(date) => updateField("applicationEnd", date)}
                                                    initialFocus
                                                    disabled={disableEndDate}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Duration & Skills Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Timer className="h-4 w-4 text-cyan-500" />
                                            Duration (Optional)
                                        </Label>
                                        <Input
                                            value={formValues.duration}
                                            onChange={e => updateField("duration", e.target.value)}
                                            placeholder="e.g., 3 months, 6 months"
                                            className="h-12 rounded-xl border-2 focus:border-cyan-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Award className="h-4 w-4 text-purple-500" />
                                            Skills (comma separated)
                                        </Label>
                                        <Input
                                            value={formValues.skills}
                                            onChange={e => updateField("skills", e.target.value)}
                                            placeholder="e.g., React, Node.js, Python"
                                            className="h-12 rounded-xl border-2 focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                        <FileText className="h-4 w-4 text-purple-500" />
                                        Description
                                    </Label>
                                    <Textarea
                                        value={formValues.description}
                                        onChange={e => updateField("description", e.target.value)}
                                        placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                                        className="min-h-[120px] rounded-xl border-2 focus:border-purple-500 resize-none transition-colors"
                                    />
                                </div>

                                {/* Qualifications */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                        <GraduationCap className="h-4 w-4 text-blue-500" />
                                        Qualifications
                                    </Label>
                                    <Textarea
                                        value={formValues.qualifications}
                                        onChange={e => updateField("qualifications", e.target.value)}
                                        placeholder="List required or preferred qualifications..."
                                        className="min-h-[80px] rounded-xl border-2 focus:border-blue-500 resize-none transition-colors"
                                    />
                                </div>

                                {/* Compensation Section */}
                                <div className="p-5 rounded-2xl border-2 space-y-4 bg-gradient-to-r from-emerald-500/5 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="paid"
                                            checked={formValues.paid}
                                            onCheckedChange={val => updateField("paid", !!val)}
                                            className="h-5 w-5 rounded-md"
                                        />
                                        <div>
                                            <Label htmlFor="paid" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                                This is a Paid Internship
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">Enable to set monthly compensation</p>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {formValues.paid && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-3 border-t border-dashed">
                                                    <Label className="text-sm font-medium mb-2 block">Monthly Salary (USD)</Label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            value={formValues.salary}
                                                            onChange={e => updateField("salary", e.target.value)}
                                                            placeholder="e.g., 1500"
                                                            className="h-12 pl-10 rounded-xl border-2 focus:border-emerald-500 transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Cover Letter Requirement */}
                                <div className="p-5 rounded-2xl border-2 space-y-2 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="requiresCoverLetter"
                                            checked={formValues.requiresCoverLetter}
                                            onCheckedChange={val => updateField("requiresCoverLetter", !!val)}
                                            className="h-5 w-5 rounded-md"
                                        />
                                        <div>
                                            <Label htmlFor="requiresCoverLetter" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <ScrollText className="h-4 w-4 text-indigo-500" />
                                                Require Cover Letter
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Students must write a cover letter when applying
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-6 border-t">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setActiveView("overview")}
                                        className="text-muted-foreground"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="min-w-[140px] h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2 rounded-xl shadow-lg shadow-purple-500/20"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
