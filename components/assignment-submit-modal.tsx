"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
    Sparkles,
    ExternalLink,
    Loader2,
    Shield,
    FileCheck,
    ArrowRight,
    Info
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
        }
    }, [open])

    // Validate files
    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `${file.name}: File type not allowed`
        }
        if (file.size > MAX_FILE_SIZE) {
            return `${file.name}: File too large (max 25MB)`
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

        setFileErrors(errors)
        setFiles(prev => [...prev, ...validFiles])
    }, [])

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
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    // Submit files
    const handleSubmit = async () => {
        if (files.length === 0 || !assignmentId) return
        setUploading(true)
        setUploadProgress(0)

        try {
            const formData = new FormData()
            files.forEach(file => formData.append("files", file))

            // Simulate progress for UX
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

    return (
        <Dialog open={open} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border bg-background">
                {/* Header */}
                <div className="relative overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 p-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        
                        <div className="relative flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-xl font-bold text-white">
                                    {loading ? "Loading..." : assignment?.title || "Assignment"}
                                </DialogTitle>
                                {assignment && (
                                    <p className="text-white/80 text-sm mt-1">
                                        {assignment.internshipTitle} • {assignment.companyName}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 py-4 bg-muted/30 border-b border-border">
                        {['details', 'upload', 'success'].map((s, i) => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center gap-2 ${
                                    step === s ? 'text-purple-500' : 
                                    ['details', 'upload', 'success'].indexOf(step) > i ? 'text-emerald-500' : 'text-muted-foreground'
                                }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        step === s ? 'bg-purple-500 text-white' :
                                        ['details', 'upload', 'success'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 'bg-muted'
                                    }`}>
                                        {['details', 'upload', 'success'].indexOf(step) > i ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    <span className="text-sm font-medium hidden sm:block">
                                        {s === 'details' ? 'Review' : s === 'upload' ? 'Upload' : 'Complete'}
                                    </span>
                                </div>
                                {i < 2 && <div className="w-8 h-0.5 bg-border" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                            <p className="text-red-500">{error}</p>
                            <Button onClick={onClose} variant="outline" className="mt-4">
                                Close
                            </Button>
                        </div>
                    ) : assignment ? (
                        <AnimatePresence mode="wait">
                            {/* Step 1: Details */}
                            {step === 'details' && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Due Date Alert */}
                                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                                        isOverdue 
                                            ? 'bg-red-500/10 border border-red-500/30' 
                                            : 'bg-amber-500/10 border border-amber-500/30'
                                    }`}>
                                        <Clock className={`h-5 w-5 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {isOverdue ? 'Assignment Overdue' : 'Due Date'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {safeFormatDate(assignment.dueDate, "MMMM d, yyyy 'at' h:mm a")} ({safeFormatDistance(assignment.dueDate)})
                                            </p>
                                        </div>
                                        {isOverdue && (
                                            <Badge variant="destructive" className="shrink-0">Overdue</Badge>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                            Assignment Description
                                        </h3>
                                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                {assignment.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Previous Submissions */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <FileCheck className="h-4 w-4 text-emerald-500" />
                                                Previous Submissions ({uploadedFiles.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {uploadedFiles.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                                                    >
                                                        <div className="p-2 rounded-lg bg-emerald-500/10">
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(file.size)} • Submitted {safeFormatDistance(file.createdAt)}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                        >
                                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <Button variant="outline" onClick={onClose} className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={() => setStep('upload')} 
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                                        >
                                            {uploadedFiles.length > 0 ? 'Submit More Files' : 'Submit Assignment'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Upload */}
                            {step === 'upload' && (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    {/* File Drop Zone */}
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                                            dragActive
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-border bg-muted/30 hover:border-purple-500/50'
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
                                            <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                                <Upload className="h-8 w-8 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    Drop files here or <span className="text-purple-500">browse</span>
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    PDF, DOC, DOCX, ZIP, PNG, JPG • Max 25MB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Errors */}
                                    {fileErrors.length > 0 && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                            {fileErrors.map((err, i) => (
                                                <p key={i} className="text-sm text-red-500">{err}</p>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Files */}
                                    {files.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-purple-500" />
                                                Selected Files ({files.length})
                                            </h4>
                                            {files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border group"
                                                >
                                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                                        <File className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <X className="h-4 w-4 text-red-500" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Progress */}
                                    {uploading && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Uploading...</span>
                                                <span className="font-medium">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Security Notice */}
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span>Files are encrypted and securely stored</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setStep('details')}
                                            disabled={uploading}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={files.length === 0 || uploading}
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Submit {files.length} File{files.length !== 1 ? 's' : ''}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Success */}
                            {step === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 space-y-6"
                                >
                                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">Submission Successful!</h3>
                                        <p className="text-muted-foreground mt-2">
                                            Your assignment has been submitted successfully.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                                        <p className="text-sm text-muted-foreground">
                                            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} submitted for review
                                        </p>
                                    </div>
                                    <Button onClick={onClose} className="w-full">
                                        Done
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}
