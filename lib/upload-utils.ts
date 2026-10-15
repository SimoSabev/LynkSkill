// lib/upload-utils.ts
// Server-side upload validation shared by all storage routes.
import slugify from "slugify"

export const UPLOAD_MIME_TYPES = {
    images: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    documents: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
        "application/x-zip-compressed",
        "text/plain",
    ],
    videos: ["video/mp4", "video/webm", "video/quicktime"],
    // Typical homework deliverables. Deliberately excludes text/html, image/svg+xml
    // and JS: those would be served as active content from the public bucket URL.
    archivesAndData: [
        "application/x-rar-compressed",
        "application/vnd.rar",
        "application/x-7z-compressed",
        "application/gzip",
        "application/x-tar",
        "application/json",
        "text/csv",
        "text/markdown",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
} as const

const MB = 1024 * 1024

export interface UploadRule {
    allowed: readonly string[]
    maxBytes: number
}

export const UPLOAD_RULES = {
    logo: { allowed: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * MB },
    portfolio: { allowed: [...UPLOAD_MIME_TYPES.images, ...UPLOAD_MIME_TYPES.documents], maxBytes: 5 * MB },
    assignment: {
        allowed: [
            ...UPLOAD_MIME_TYPES.images,
            ...UPLOAD_MIME_TYPES.documents,
            ...UPLOAD_MIME_TYPES.archivesAndData,
            ...UPLOAD_MIME_TYPES.videos,
        ],
        maxBytes: 50 * MB,
    },
    experienceFile: { allowed: [...UPLOAD_MIME_TYPES.images, ...UPLOAD_MIME_TYPES.documents], maxBytes: 10 * MB },
    experienceVideo: { allowed: UPLOAD_MIME_TYPES.videos, maxBytes: 100 * MB },
} satisfies Record<string, UploadRule>

export const MAX_FILES_PER_REQUEST = 10

export function validateUpload(file: File, rule: UploadRule): string | null {
    if (!rule.allowed.includes(file.type)) {
        return `File type not allowed: ${file.name}`
    }
    if (file.size === 0) {
        return `File is empty: ${file.name}`
    }
    if (file.size > rule.maxBytes) {
        return `File too large: ${file.name} (max ${Math.round(rule.maxBytes / MB)}MB)`
    }
    return null
}

/**
 * Produces a storage-safe file name: no path separators, no "..",
 * lowercase slug + short extension.
 */
export function safeStorageName(name: string): string {
    const lastDot = name.lastIndexOf(".")
    const base = lastDot > 0 ? name.slice(0, lastDot) : name
    const ext = lastDot > 0 ? name.slice(lastDot + 1) : ""
    const safeBase = slugify(base, { lower: true, strict: true }).slice(0, 80) || "file"
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)
    return safeExt ? `${safeBase}.${safeExt}` : safeBase
}

/** Restricts a free-form path segment (e.g. "section") to [a-z0-9-]. */
export function safeSegment(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "misc"
}
