"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileText, Clock as _Clock, AlertCircle, Upload, CheckCircle2,
    File, ArrowLeft, Shield, Trash2, ExternalLink,
    Loader2, AlertTriangle, PartyPopper, Info, Calendar
} from "lucide-react"
import { format, formatDistanceToNow, isPast, isValid, parseISO } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

// ---------- Types ----------
interface Assignment {
    id: string
    title: string
    description: string
    dueDate: string
    internshipTitle: string
    companyName: string
}

interface SubmittedFile {
    id: string
    name: string
    size: number
    url: string
    createdAt: string
}

// ---------- Helpers ----------
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'text/plain'
]
const MAX_FILE_SIZE = 25 * 1024 * 1024

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

const safeFormat = (dateValue: string | null | undefined, formatStr: string): string => {
    if (!dateValue) return "Not set"
    try {
        const date = parseISO(dateValue)
        if (!isValid(date)) return "Not set"
        return format(date, formatStr)
    } catch {
        return "Not set"
    }
}

const safeDistance = (dateValue: string | null | undefined): string => {
    if (!dateValue) return ""
    try {
        const date = parseISO(dateValue)
        if (!isValid(date)) return ""
        return formatDistanceToNow(date, { addSuffix: true })
    } catch {
        return ""
    }
}

const safeIsPast = (dateValue: string | null | undefined): boolean => {
    if (!dateValue) return false
    try {
        const date = parseISO(dateValue)
        if (!isValid(date)) return false
        return isPast(date)
    } catch {
        return false
    }
}

const getFileColorClass = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'text-red-500 bg-red-500/10'
    if (ext === 'doc' || ext === 'docx') return 'text-blue-500 bg-blue-500/10'
    if (ext === 'zip') return 'text-amber-500 bg-amber-500/10'
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'text-emerald-500 bg-emerald-500/10'
    if (ext === 'txt') return 'text-gray-500 bg-gray-500/10'
    return 'text-violet-500 bg-violet-500/10'
}

// ---------- Component ----------
export default function AssignmentPage() {
    const params = useParams() as { id: string }
    const router = useRouter()

    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [files, setFiles] = useState<File[]>([])
    const [fileErrors, setFileErrors] = useState<string[]>([])
    const [submissions, setSubmissions] = useState<SubmittedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    // Fetch assignment + submissions
    useEffect(() => {
        if (!params?.id) return

        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                const [assignRes, subRes] = await Promise.all([
                    fetch(`/api/assignments/${params.id}`),
                    fetch(`/api/assignments/${params.id}/submissions`)
                ])

                if (!assignRes.ok) throw new Error("Failed to fetch assignment")
                const assignData = await assignRes.json()
                setAssignment(assignData)

                if (subRes.ok) {
                    const subData = await subRes.json()
                    setSubmissions(subData.files || [])
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load assignment")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [params?.id])

    // File validation
    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `"${file.name}" — file type not allowed`
        }
        if (file.size > MAX_FILE_SIZE) {
            return `"${file.name}" — file too large (max 25MB)`
        }
        return null
    }

    const handleFiles = useCallback((newFiles: File[]) => {
        const errors: string[] = []
        const valid: File[] = []
        newFiles.forEach(f => {
            const err = validateFile(f)
            if (err) errors.push(err)
            else valid.push(f)
        })
        setFileErrors(prev => [...prev, ...errors])
        setFiles(prev => [...prev, ...valid])
    }, [])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
        else if (e.type === "dragleave") setDragActive(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(Array.from(e.target.files))
            e.target.value = ''
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setFileErrors([])
    }

    // Submit
    const handleSubmit = async () => {
        if (files.length === 0 || !params?.id) return
        setUploading(true)
        setUploadProgress(0)
        setUploadError(null)

        try {
            const formData = new FormData()
            files.forEach(file => formData.append("files", file))

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 8, 90))
            }, 200)

            const res = await fetch(`/api/assignments/${params.id}/upload`, {
                method: "POST",
                body: formData,
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (!res.ok) {
                const text = await res.text()
                throw new Error(`Upload failed: ${text}`)
            }

            const data = await res.json()
            setSubmissions(prev => [...prev, ...data.files])
            setFiles([])
            setSubmitted(true)
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Failed to upload files")
        } finally {
            setUploading(false)
        }
    }

    const isOverdue = assignment?.dueDate ? safeIsPast(assignment.dueDate) : false
    const hasExistingSubmissions = submissions.length > 0

    // ---------- Loading State ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-3xl mx-auto px-4 py-8 md:px-6 md:py-12">
                    <div className="rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-8">
                            <div className="space-y-3">
                                <div className="h-7 bg-white/20 animate-pulse rounded-lg w-2/3" />
                                <div className="h-4 bg-white/15 animate-pulse rounded-lg w-1/2" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 mt-6">
                        {[1, 2].map(i => (
                            <div key={i} className="rounded-2xl border border-border p-6 space-y-3">
                                <div className="h-5 bg-muted animate-pulse rounded-lg w-1/3" />
                                <div className="h-4 bg-muted/60 animate-pulse rounded-lg w-full" />
                                <div className="h-4 bg-muted/40 animate-pulse rounded-lg w-2/3" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ---------- Error State ----------
    if (error || !assignment) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Error Loading Assignment</h3>
                    <p className="text-muted-foreground mb-6">{error || "Assignment not found"}</p>
                    <Button onClick={() => router.back()} variant="outline" className="rounded-xl">
                        <ArrowLeft className="mr-2 h-4 w-4" />Go Back
                    </Button>
                </motion.div>
            </div>
        )
    }

    // ---------- Success State ----------
    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center max-w-lg"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/20 mb-8"
                    >
                        <PartyPopper className="h-12 w-12 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">Submission Successful!</h2>
                    <p className="text-muted-foreground mb-2 text-lg">
                        Your work for <span className="font-medium text-foreground">{assignment.title}</span> has been submitted.
                    </p>
                    <p className="text-sm text-muted-foreground mb-8">
                        The company will review your submission and update your application status accordingly.
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {submissions.length} file(s) submitted for review
                        </span>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            onClick={() => setSubmitted(false)}
                            className="rounded-xl"
                        >
                            Submit More Files
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard/student")}
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    // ---------- Main View ----------
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-10 space-y-6">
                {/* Back Button */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        size="sm"
                        className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="relative overflow-hidden rounded-2xl">
                        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-6 md:p-8">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                            <div className="relative">
                                <div className="flex items-start gap-4 md:gap-5">
                                    <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 shrink-0">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">
                                            {assignment.title}
                                        </h1>
                                        <p className="text-white/70 text-sm md:text-base">
                                            For <span className="text-white/90 font-medium">{assignment.internshipTitle}</span> at{" "}
                                            <span className="text-white/90 font-medium">{assignment.companyName}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badges */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {hasExistingSubmissions ? (
                                        <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 gap-1.5">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {submissions.length} file(s) submitted
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 gap-1.5">
                                            <AlertTriangle className="h-3 w-3" />
                                            Not yet submitted
                                        </Badge>
                                    )}
                                    {isOverdue && (
                                        <Badge className="bg-red-500/20 text-red-200 border-red-400/30 gap-1.5">
                                            <AlertCircle className="h-3 w-3" />
                                            Overdue
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Important Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <div className="flex gap-3 p-4 rounded-xl bg-violet-500/8 border border-violet-500/20">
                        <Info className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-foreground">This task is required for your application</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                You must submit your work before the company can approve or reject your application. Complete and upload your files below.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Assignment Details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-border bg-card overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-border bg-muted/20">
                        <h2 className="font-semibold text-foreground flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-violet-500/10">
                                <FileText className="h-4 w-4 text-violet-500" />
                            </div>
                            Assignment Details
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
                        </div>

                        <div className={`flex items-center gap-3 p-4 rounded-xl ${
                            isOverdue
                                ? 'bg-red-500/8 border border-red-500/20'
                                : 'bg-amber-500/8 border border-amber-500/20'
                        }`}>
                            <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                                <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {isOverdue ? 'Assignment Overdue' : 'Due Date'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {safeFormat(assignment.dueDate, "MMMM d, yyyy 'at' h:mm a")} ({safeDistance(assignment.dueDate)})
                                </p>
                            </div>
                            {isOverdue && (
                                <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Previous Submissions */}
                {submissions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-2xl border border-border bg-card overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-border bg-muted/20">
                            <h2 className="font-semibold text-foreground flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                                Submitted Files ({submissions.length})
                            </h2>
                        </div>
                        <div className="p-4 space-y-1.5">
                            {submissions.map((file, i) => (
                                <motion.div
                                    key={file.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/30 transition-colors group"
                                >
                                    <div className={`p-1.5 rounded-lg ${getFileColorClass(file.name)}`}>
                                        <File className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {formatFileSize(file.size)} • {safeDistance(file.createdAt)}
                                        </p>
                                    </div>
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors opacity-60 group-hover:opacity-100"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-border bg-card overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-border bg-muted/20">
                        <h2 className="font-semibold text-foreground flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-indigo-500/10">
                                <Upload className="h-4 w-4 text-indigo-500" />
                            </div>
                            {hasExistingSubmissions ? 'Submit More Files' : 'Submit Your Work'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 ml-[34px]">
                            Upload your assignment files below
                        </p>
                    </div>
                    <div className="p-6 space-y-5">
                        {/* Drop Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-xl p-8 md:p-10 transition-all duration-200 ${
                                dragActive
                                    ? 'border-violet-500 bg-violet-500/8 scale-[1.01]'
                                    : 'border-border bg-muted/10 hover:border-violet-500/40 hover:bg-violet-500/5'
                            }`}
                        >
                            <input
                                type="file"
                                multiple
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt"
                            />
                            <div className="text-center space-y-3">
                                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                                    dragActive
                                        ? 'bg-violet-500/20 scale-110'
                                        : 'bg-gradient-to-br from-violet-500/15 to-indigo-500/15'
                                }`}>
                                    <Upload className={`h-8 w-8 transition-colors ${dragActive ? 'text-violet-500' : 'text-violet-400'}`} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-foreground">
                                        Drop your files here, or <span className="text-violet-500 font-semibold">browse</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        PDF, DOC, DOCX, ZIP, PNG, JPG, TXT • Max 25MB per file
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* File Errors */}
                        <AnimatePresence>
                            {fileErrors.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1"
                                >
                                    {fileErrors.map((err, i) => (
                                        <p key={i} className="text-xs text-red-500 flex items-center gap-1.5">
                                            <AlertTriangle className="h-3 w-3 shrink-0" />{err}
                                        </p>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Upload Error */}
                        {uploadError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <p className="text-xs text-red-500 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3 w-3 shrink-0" />{uploadError}
                                </p>
                            </div>
                        )}

                        {/* Selected Files */}
                        <AnimatePresence>
                            {files.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Selected Files ({files.length})
                                        </h4>
                                        <button
                                            onClick={() => { setFiles([]); setFileErrors([]) }}
                                            className="text-[11px] text-red-500 hover:text-red-600 font-medium"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        {files.map((file, index) => (
                                            <motion.div
                                                key={`${file.name}-${index}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border group hover:border-violet-500/30 transition-colors"
                                            >
                                                <div className={`p-1.5 rounded-lg ${getFileColorClass(file.name)}`}>
                                                    <File className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Upload Progress */}
                                    {uploading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-2 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                                                    Uploading...
                                                </span>
                                                <span className="font-semibold text-violet-600 dark:text-violet-400">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Submit Button */}
                                    {!uploading && (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={files.length === 0}
                                            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/20 gap-2"
                                        >
                                            <Upload className="h-5 w-5" />
                                            Submit {files.length} File(s)
                                        </Button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Security Notice */}
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/20 text-[11px] text-muted-foreground">
                            <Shield className="h-3.5 w-3.5 shrink-0" />
                            <span>Files are encrypted and securely stored</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
