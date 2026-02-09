// lib/security.ts
// Comprehensive security utilities for API routes

import { z } from "zod"

/**
 * Sanitize a string to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== "string") return ""
    
    return input
        // Remove HTML tags
        .replace(/<[^>]*>/g, "")
        // Escape HTML entities
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        // Remove null bytes
        .replace(/\x00/g, "")
        // Trim whitespace
        .trim()
}

/**
 * Sanitize a string for safe database storage
 * Less aggressive than XSS sanitization
 */
export function sanitizeForDb(input: string): string {
    if (!input || typeof input !== "string") return ""
    
    return input
        // Remove null bytes
        .replace(/\x00/g, "")
        // Remove control characters (except newlines and tabs)
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .trim()
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== "string") return null
    
    const sanitized = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(sanitized) || sanitized.length > 254) {
        return null
    }
    
    return sanitized
}

/**
 * Validate a Clerk ID format
 */
export function isValidClerkId(id: string): boolean {
    if (!id || typeof id !== "string") return false
    // Clerk user IDs start with "user_" and are followed by alphanumeric characters
    return /^user_[a-zA-Z0-9]+$/.test(id)
}

/**
 * Validate a UUID format
 */
export function isValidUUID(id: string): boolean {
    if (!id || typeof id !== "string") return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Validate a CUID format (used by Prisma)
 */
export function isValidCuid(id: string): boolean {
    if (!id || typeof id !== "string") return false
    // CUID format: starts with 'c' followed by 24 lowercase alphanumeric characters
    return /^c[a-z0-9]{24}$/.test(id) || /^[a-z0-9]{25}$/.test(id)
}

/**
 * Validate file name is safe
 */
export function sanitizeFileName(name: string): string {
    if (!name || typeof name !== "string") return "file"
    
    return name
        // Remove path traversal attempts
        .replace(/\.\./g, "")
        .replace(/[/\\]/g, "")
        // Only allow safe characters
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        // Limit length
        .slice(0, 100)
}

/**
 * Check if a file type is allowed
 */
export function isAllowedFileType(
    mimeType: string,
    allowedTypes: string[]
): boolean {
    if (!mimeType || typeof mimeType !== "string") return false
    return allowedTypes.includes(mimeType.toLowerCase())
}

/**
 * Validate file size is within limits
 */
export function isFileSizeValid(
    sizeBytes: number,
    maxSizeMB: number
): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024
    return sizeBytes > 0 && sizeBytes <= maxBytes
}

// Common Zod schemas for validation
export const schemas = {
    clerkId: z.string().regex(/^user_[a-zA-Z0-9]+$/, "Invalid user ID format"),
    
    uuid: z.string().uuid("Invalid UUID format"),
    
    cuid: z.string().regex(/^c?[a-z0-9]{24,25}$/, "Invalid ID format"),
    
    email: z.string().email("Invalid email format").max(254, "Email too long"),
    
    eik: z.string()
        .min(9, "EIK must be at least 9 digits")
        .max(13, "EIK cannot be more than 13 digits")
        .regex(/^\d+$/, "EIK must contain only digits"),
    
    companyName: z.string()
        .min(2, "Company name must be at least 2 characters")
        .max(200, "Company name too long")
        .transform(sanitizeForDb),
    
    description: z.string()
        .min(10, "Description must be at least 10 characters")
        .max(5000, "Description too long")
        .transform(sanitizeForDb),
    
    location: z.string()
        .min(2, "Location must be at least 2 characters")
        .max(200, "Location too long")
        .transform(sanitizeForDb),
    
    url: z.string().url("Invalid URL format").max(2000, "URL too long").optional().nullable(),
    
    dateOfBirth: z.string()
        .refine((val) => {
            const date = new Date(val)
            return !isNaN(date.getTime())
        }, "Invalid date format")
        .refine((val) => {
            const date = new Date(val)
            const today = new Date()
            return date <= today
        }, "Date cannot be in the future")
        .refine((val) => {
            const date = new Date(val)
            const hundredYearsAgo = new Date()
            hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100)
            return date >= hundredYearsAgo
        }, "Date too far in the past"),
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
} as const

/**
 * Add security headers to a Response
 */
export function withSecurityHeaders(
    response: Response,
    additionalHeaders?: Record<string, string>
): Response {
    const headers = new Headers(response.headers)
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value)
    })
    
    if (additionalHeaders) {
        Object.entries(additionalHeaders).forEach(([key, value]) => {
            headers.set(key, value)
        })
    }
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: Request, allowedOrigins: string[]): boolean {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    
    // If no origin header (same-origin request), allow
    if (!origin) return true
    
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) return true
    
    // Check referer as fallback
    if (referer) {
        try {
            const refererOrigin = new URL(referer).origin
            return allowedOrigins.includes(refererOrigin)
        } catch {
            return false
        }
    }
    
    return false
}
