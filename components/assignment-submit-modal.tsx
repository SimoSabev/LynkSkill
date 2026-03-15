"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useTranslation } from "@/lib/i18n"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistanceToNow, isPast, isValid, parseISO } from "date-fns"
import {
    FileText,
    Clock,
    Upload,
    X,
    CheckCircle2,
    File,
    AlertTriangle,
    ExternalLink,
    Loader2,
    Shield,
    FileCheck,
    ArrowRight,
    Info,
    Trash2,
    ArrowLeft,
    PartyPopper
} from "lucide-react"

// ---------- Types ----------
interface Assignment {
    id: string
    title: string
    description: string
    dueDate: string
    internshipTitle: string
    companyName: string
}

interface UploadedFile {
    id: string
    name: string
    size: number
    url: string
    createdAt: string
}

interface AssignmentSubmitModalProps {
    open: boolean
    onClose: () => void
    assignmentId: string | null
    onSubmitted?: () => void
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
    return 'text-purple-500 bg-purple-500/10'
}

// Allowed file types
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

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

// ---------- Component ----------
export function AssignmentSubmitModal({ 
    open, 
    onClose, 
    assignmentId,
    onSubmitted 
}: AssignmentSubmitModalProps) {
    const { t } = useTranslation()
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    const [files, setFiles] = useState<File[]>([])
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const [fileErrors, setFileErrors] = useState<string[]>([])
    
    const [step, setStep] = useState<'details' | 'upload' | 'success'>('details')

    // Fetch assignment details
    useEffect(() => {
        if (!assignmentId || !open) {
            setAssignment(null)
            setLoading(false)
            return
        }

        const fetchAssignment = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`/api/assignments/${assignmentId}`)
                if (!res.ok) throw new Error("Failed to fetch assignment")
                const data = await res.json()
                setAssignment(data)
                
                // Fetch existing submissions
                const submissionsRes = await fetch(`/api/assignments/${assignmentId}/submissions`)
                if (submissionsRes.ok) {
                    const submissionsData = await submissionsRes.json()
                    setUploadedFiles(submissionsData.files || [])
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load assignment")
            } finally {
                setLoading(false)
            }
        }

        fetchAssignment()
    }, [assignmentId, open])

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setStep('details')
            setFiles([])
            setFileErrors([])
            setUploadProgress(0)
            setError(null)
        }
    }, [open])

    // Validate files
    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `${file.name}: ${t("assignmentSubmit.fileTypeNotAllowed")}`
        }
        if (file.size > MAX_FILE_SIZE) {
            return `${file.name}: ${t("assignmentSubmit.fileTooLarge")}`
        }
        return null
    }

    // Handle file input
    const handleFiles = useCallback((newFiles: File[]) => {
        const errors: string[] = []
        const validFiles: File[] = []

        newFiles.forEach(file => {
            const error = validateFile(file)
            if (error) {
                errors.push(error)
            } else {
                validFiles.push(file)
            }
        })

        setFileErrors(prev => [...prev, ...errors])
        setFiles(prev => [...prev, ...validFiles])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
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

    // Submit files
    const handleSubmit = async () => {
        if (files.length === 0 || !assignmentId) return
        setUploading(true)
        setUploadProgress(0)
        setError(null)

        try {
            const formData = new FormData()
            files.forEach(file => formData.append("files", file))

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            const res = await fetch(`/api/assignments/${assignmentId}/upload`, {
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
            setUploadedFiles(prev => [...prev, ...data.files])
            setFiles([])
            setStep('success')
            onSubmitted?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload files")
        } finally {
            setUploading(false)
        }
    }

    const isOverdue = assignment?.dueDate ? safeIsPast(assignment.dueDate) : false
    const stepIndex = step === 'details' ? 0 : step === 'upload' ? 1 : 2
    const steps = ['details', 'upload', 'success'] as const

    return (
        <Dialog open={open} onOpenChange={() => { if (!uploading) onClose() }}>
            <DialogContent showCloseButton={false} className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl border-0 bg-background flex flex-col">
                {/* Header */}
                <div className="relative overflow-hidden shrink-0">
                    <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-6 pt-5 pb-4">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                        
                        <div className="relative flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-lg font-bold text-white truncate">
                                    {loading ? t("assignmentSubmit.loading") : assignment?.title || t("assignmentSubmit.assignment")}
                                </DialogTitle>
                                <DialogDescription className="text-white/70 text-sm mt-0.5 truncate">
                                    {assignment ? `${assignment.internshipTitle} • ${assignment.companyName}` : "\u00A0"}
                                </DialogDescription>
                            </div>
                            <button
                                onClick={() => { if (!uploading) onClose() }}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="px-6 py-3 bg-muted/30 border-b border-border">
                        <div className="flex items-center gap-1">
                            {steps.map((s, i) => (
                                <React.Fragment key={s}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                                            stepIndex === i 
                                                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30' 
                                                : stepIndex > i 
                                                    ? 'bg-emerald-500 text-white' 
                                                    : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {stepIndex > i ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                                        </div>
                                        <span className={`text-xs font-medium hidden sm:block ${
                                            stepIndex === i ? 'text-foreground' : 'text-muted-foreground'
                                        }`}>
                                            {s === 'details' ? t("assignmentSubmit.stepReview") : s === 'upload' ? t("assignmentSubmit.stepUpload") : t("assignmentSubmit.stepComplete")}
                                        </span>
                                    </div>
                                    {i < 2 && (
                                        <div className={`flex-1 h-0.5 rounded-full mx-1 transition-colors duration-300 ${
                                            stepIndex > i ? 'bg-emerald-500' : 'bg-border'
                                        }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                            <p className="text-sm text-muted-foreground">{t("assignmentSubmit.loading")}</p>
                        </div>
                    ) : error && step !== 'upload' ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-sm text-red-500 font-medium">{error}</p>
                            <Button onClick={onClose} variant="outline" className="mt-4 rounded-xl">
                                {t("assignmentSubmit.close")}
                            </Button>
                        </div>
                    ) : assignment ? (
                        <AnimatePresence mode="wait">
                            {/* Step 1: Details */}
                            {step === 'details' && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Due Date Card */}
                                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                                        isOverdue 
                                            ? 'bg-red-500/10 border border-red-500/20' 
                                            : 'bg-amber-500/8 border border-amber-500/20'
                                    }`}>
                                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                                            <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {isOverdue ? t("assignmentSubmit.assignmentOverdue") : t("assignmentSubmit.dueDate")}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {safeFormatDate(assignment.dueDate, "MMMM d, yyyy 'at' h:mm a")} ({safeFormatDistance(assignment.dueDate)})
                                            </p>
                                        </div>
                                        {isOverdue && (
                                            <Badge variant="destructive" className="shrink-0 text-[10px]">{t("assignmentSubmit.overdue")}</Badge>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <Info className="h-4 w-4 text-violet-500" />
                                            {t("assignmentSubmit.assignmentDescription")}
                                        </h3>
                                        <div className="p-4 rounded-xl bg-muted/40 border border-border">
                                            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                                {assignment.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Previous Submissions */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-2.5">
                                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <FileCheck className="h-4 w-4 text-emerald-500" />
                                                {t("assignmentSubmit.previousSubmissions")} ({uploadedFiles.length})
                                            </h3>
                                            <div className="space-y-1.5">
                                                {uploadedFiles.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/30 transition-colors"
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
                                                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 2: Upload */}
                            {step === 'upload' && (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* File Drop Zone */}
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                                            dragActive
                                                ? 'border-violet-500 bg-violet-500/8 scale-[1.01]'
                                                : 'border-border bg-muted/20 hover:border-violet-500/40 hover:bg-violet-500/5'
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
                                            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                                                dragActive 
                                                    ? 'bg-violet-500/20 scale-110' 
                                                    : 'bg-gradient-to-br from-violet-500/15 to-indigo-500/15'
                                            }`}>
                                                <Upload className={`h-7 w-7 transition-colors ${dragActive ? 'text-violet-500' : 'text-violet-400'}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {t("assignmentSubmit.dropFilesHere")} <span className="text-violet-500 font-semibold">{t("assignmentSubmit.browse")}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1.5">
                                                    {t("assignmentSubmit.allowedFileTypes")}
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
                                    {error && (
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                            <p className="text-xs text-red-500 flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3 shrink-0" />{error}
                                            </p>
                                        </div>
                                    )}

                                    {/* Selected Files */}
                                    <AnimatePresence>
                                        {files.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        {t("assignmentSubmit.selectedFiles")} ({files.length})
                                                    </h4>
                                                    <button
                                                        onClick={() => { setFiles([]); setFileErrors([]) }}
                                                        className="text-[11px] text-red-500 hover:text-red-600 font-medium"
                                                    >
                                                        {t("assignmentSubmit.clearAll")}
                                                    </button>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {files.map((file, index) => (
                                                        <motion.div
                                                            key={`${file.name}-${index}`}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 10 }}
                                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border group hover:border-violet-500/30 transition-colors"
                                                        >
                                                            <div className={`p-1.5 rounded-lg ${getFileIcon(file.name)}`}>
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

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
                                                    {t("assignmentSubmit.uploading")}
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

                                    {/* Security Notice */}
                                    {!uploading && (
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/30 text-[11px] text-muted-foreground">
                                            <Shield className="h-3.5 w-3.5 shrink-0" />
                                            <span>{t("assignmentSubmit.filesEncrypted")}</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 3: Success */}
                            {step === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center py-8 space-y-5"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                                        className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/20"
                                    >
                                        <PartyPopper className="h-10 w-10 text-emerald-500" />
                                    </motion.div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">{t("assignmentSubmit.submissionSuccessful")}</h3>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                                            {t("assignmentSubmit.submissionSuccessfulDesc")}
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            {t("assignmentSubmit.filesSubmittedForReview", { count: uploadedFiles.length })}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ) : null}
                </div>

                {/* Footer Actions */}
                {assignment && !loading && !error && (
                    <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/20">
                        {step === 'details' && (
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose} className="rounded-xl">
                                    {t("assignmentSubmit.cancel")}
                                </Button>
                                <Button 
                                    onClick={() => setStep('upload')} 
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20"
                                >
                                    {uploadedFiles.length > 0 ? t("assignmentSubmit.submitMoreFiles") : t("assignmentSubmit.submitAssignment")}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {step === 'upload' && (
                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => { setStep('details'); setFileErrors([]) }}
                                    disabled={uploading}
                                    className="rounded-xl gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    {t("assignmentSubmit.back")}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={files.length === 0 || uploading}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t("assignmentSubmit.uploading")}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            {t("assignmentSubmit.submitFilesCount", { count: files.length })}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                        {step === 'success' && (
                            <Button onClick={onClose} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white">
                                {t("assignmentSubmit.done")}
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
