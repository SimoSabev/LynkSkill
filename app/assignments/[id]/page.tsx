"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, AlertCircle, Upload, X, CheckCircle2, File, TrendingUp, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

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
    uploadedAt: Date
}

export default function AssignmentPage() {
    const params = useParams() as { id: string }
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const router = useRouter()

    useEffect(() => {
        async function fetchAssignment() {
            if (!params?.id) return
            try {
                const res = await fetch(`/api/assignments/${params.id}`)
                if (!res.ok) throw new Error("Failed to fetch assignment")
                const data = await res.json()
                setAssignment(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load assignment")
            } finally {
                setLoading(false)
            }
        }

        fetchAssignment()
    }, [params?.id])

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

    const handleFiles = (newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles])
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (files.length === 0) return
        setUploading(true)

        try {
            const formData = new FormData()
            files.forEach((file) => formData.append("files", file))

            const res = await fetch(`/api/assignments/${params.id}/upload`, {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const text = await res.text()
                console.error("❌ Upload failed:", res.status, res.statusText, text)
                throw new Error(`Upload failed (${res.status}): ${text}`)
            }

            const data = await res.json()
            console.log("✅ Upload success:", data)

            setUploadedFiles((prev) => [...prev, ...data.files])
            setFiles([])

            // ✅ Redirect to dashboard on success
            router.push("/dashboard/student")
        } catch (err) {
            console.error("🚨 Upload failed:", err)
            alert(err instanceof Error ? err.message : "Failed to upload files")
        } finally {
            setUploading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }

    const formatDate = (date: string | Date | undefined, formatString: string) => {
        if (!date) return "No date available"
        const dateObj = new Date(date)
        if (isNaN(dateObj.getTime())) return "Invalid date"
        return format(dateObj, formatString)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="relative overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-[var(--application-header-gradient-from)] to-[var(--application-header-gradient-to)] rounded-2xl p-8 shadow-[0_20px_50px_var(--application-shadow-medium)]">
                            <div className="flex items-center justify-between">
                                <div className="space-y-3">
                                    <div className="h-8 bg-white/20 animate-pulse rounded-lg w-64 backdrop-blur-sm"></div>
                                    <div className="h-4 bg-white/15 animate-pulse rounded-lg w-96 backdrop-blur-sm"></div>
                                </div>
                                <div className="h-6 bg-white/20 animate-pulse rounded-lg w-32 backdrop-blur-sm"></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {[...Array(2)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative overflow-hidden bg-gradient-to-br from-[var(--application-card-gradient-from)] to-[var(--application-card-gradient-to)] rounded-2xl p-6 shadow-[0_8px_30px_var(--application-shadow-light)] border border-border/50"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse"></div>
                                <div className="space-y-4">
                                    <div className="h-5 bg-muted/30 animate-pulse rounded-lg w-3/4"></div>
                                    <div className="h-4 bg-muted/20 animate-pulse rounded-lg w-1/2"></div>
                                    <div className="h-32 bg-muted/25 animate-pulse rounded-lg"></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !assignment) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                        <div className="relative mb-8">
                            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-lg border border-red-500/30">
                                <AlertCircle className="w-12 h-12 text-red-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">Error Loading Assignment</h3>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto">{error}</p>
                        <Button onClick={() => router.back()} variant="outline" className="mt-6 rounded-xl">
                            Go Back
                        </Button>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        className="relative group px-4 py-2 hover:bg-muted/50 rounded-xl transition-all duration-200"
                    >
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                <span className="text-purple-400">←</span>
                            </div>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Back</span>
                        </div>
                    </Button>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="relative overflow-hidden">
                        <div className="bg-gradient-to-r from-[var(--application-header-gradient-from)] to-[var(--application-header-gradient-to)] rounded-2xl p-8 shadow-[0_20px_50px_var(--application-shadow-medium)]">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                        <FileText className="h-8 w-8 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <h1 className="text-3xl font-bold tracking-tight text-white text-balance">{assignment.title}</h1>
                                        <p className="text-white/80 text-lg font-medium">
                                            For <span className="text-white font-semibold">{assignment.internshipTitle}</span> at{" "}
                                            <span className="text-white font-semibold">{assignment.companyName}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="rounded-2xl border border-border/50 bg-gradient-to-br from-[var(--application-card-gradient-from)] to-[var(--application-card-gradient-to)] backdrop-blur-sm shadow-[0_8px_30px_var(--application-shadow-light)]">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-xl">
                                    <FileText className="h-5 w-5 text-purple-400" />
                                </div>
                                Assignment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm">
                                <p className="text-card-foreground whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent border border-purple-500/20 p-5">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5"></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-lg">
                                        <Clock className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Due Date</p>
                                        <p className="text-lg font-semibold text-card-foreground">
                                            {formatDate(assignment.dueDate, "MMMM d, yyyy 'at' h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="rounded-2xl border border-border/50 bg-gradient-to-br from-[var(--application-card-gradient-from)] to-[var(--application-card-gradient-to)] backdrop-blur-sm shadow-[0_8px_30px_var(--application-shadow-light)]">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-xl">
                                    <Upload className="h-5 w-5 text-blue-400" />
                                </div>
                                Submit Your Work
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-2 font-medium">Upload your assignment files below</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Drag and drop area */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
                                    dragActive
                                        ? "border-purple-500 bg-purple-500/10"
                                        : "border-border bg-card/30 hover:border-purple-500/50 hover:bg-card/50"
                                }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileInput}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    id="file-upload"
                                />
                                <div className="text-center space-y-4">
                                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shadow-lg border border-purple-500/20">
                                        <Upload className="h-10 w-10 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-card-foreground mb-1">
                                            Drop your files here, or <span className="text-purple-400 font-semibold">browse</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">Support for PDF, DOC, DOCX, ZIP, and more</p>
                                    </div>
                                </div>
                            </div>

                            {/* Selected files list */}
                            <AnimatePresence>
                                {files.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                            <h4 className="text-sm font-semibold text-card-foreground">Selected Files ({files.length})</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {files.map((file, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 group hover:border-purple-500/30 transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                                            <File className="h-5 w-5 text-blue-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-card-foreground truncate">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(index)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={uploading}
                                            className="w-full h-12 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            style={{
                                                background: "linear-gradient(135deg, rgb(139, 92, 246), rgb(59, 130, 246))",
                                            }}
                                        >
                                            {uploading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Uploading...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Upload className="h-5 w-5" />
                                                    Submit Assignment
                                                </div>
                                            )}
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {uploadedFiles.length > 0 && (
                                <div className="pt-6 border-t border-border/50">
                                    <h4 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                                        <div className="p-1.5 bg-green-500/20 rounded-lg">
                                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                                        </div>
                                        Previously Submitted ({uploadedFiles.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {uploadedFiles.map((file) => (
                                            <motion.div
                                                key={file.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-lg bg-green-500/20">
                                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-card-foreground">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatFileSize(file.size)} • Uploaded{" "}
                                                            {formatDate(file.uploadedAt, "MMM d, yyyy 'at' h:mm a")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
