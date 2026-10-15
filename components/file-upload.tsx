"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, X, File, ImageIcon, FileText, Download, AlertCircle } from "lucide-react"
import { validateFile, formatFileSize, uploadFile, deleteFile, MAX_FILE_SIZE_MB, type FileAttachment } from "@/lib/file-utils"

interface FileUploadProps {
    section: "projects" | "education" | "certifications"
    attachments: FileAttachment[]
    onAttachmentsChange: (attachments: FileAttachment[]) => void
    maxFiles?: number
    className?: string
}

export function FileUpload({
                               section,
                               attachments,
                               onAttachmentsChange,
                               maxFiles = 5,
                               className = "",
                           }: FileUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (files: FileList) => {
        if (attachments.length + files.length > maxFiles) {
            setError(`Maximum ${maxFiles} files allowed`)
            return
        }

        setError(null)
        setUploading(true)
        setUploadProgress(0)

        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                const validation = validateFile(file)
                if (!validation.valid) {
                    throw new Error(validation.error)
                }

                const attachment = await uploadFile(file, section)
                setUploadProgress(((index + 1) / files.length) * 100)
                return attachment
            })

            const newAttachments = await Promise.all(uploadPromises)
            onAttachmentsChange([...attachments, ...newAttachments])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed")
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const handleRemoveFile = async (index: number) => {
        const attachment = attachments[index]

        try {
            if (attachment.path) {
                await deleteFile(attachment.path)
            }

            const newAttachments = attachments.filter((_, i) => i !== index)
            onAttachmentsChange(newAttachments)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed")
        }
    }

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith("image/")) {
            return <ImageIcon className="h-4 w-4" />
        }
        if (fileType === "application/pdf") {
            return <FileText className="h-4 w-4" />
        }
        return <File className="h-4 w-4" />
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Upload Area */}
            <div
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add("border-primary")
                }}
                onDragLeave={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove("border-primary")
                }}
                onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove("border-primary")
                    const files = e.dataTransfer.files
                    if (files.length > 0) {
                        handleFileSelect(files)
                    }
                }}
            >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold text-lg mb-2">Upload Files</h4>
                <p className="text-muted-foreground mb-4">Drag and drop files here, or click to browse</p>
                <p className="text-sm text-muted-foreground">
                    Supports images, PDFs, and documents (max {MAX_FILE_SIZE_MB}MB each, {maxFiles} files total)
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleFileSelect(e.target.files)
                        }
                    }}
                    className="hidden"
                />
            </div>

            {/* Upload Progress */}
            <AnimatePresence>
                {uploading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Uploading...</span>
                            <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl"
                    >
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">{error}</span>
                        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attached Files */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                    >
                        <h5 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Attached Files ({attachments.length}/{maxFiles})
                        </h5>
                        <div className="space-y-2">
                            {attachments.map((attachment, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center gap-3 p-3 bg-accent rounded-xl border border-border"
                                >
                                    <div className="flex-shrink-0">{getFileIcon(attachment.type)}</div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{attachment.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs">
                                                {attachment.type.split("/")[1]?.toUpperCase() || "FILE"}
                                            </Badge>
                                            {attachment.size && (
                                                <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(attachment.url, "_blank")}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Download className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveFile(index)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
