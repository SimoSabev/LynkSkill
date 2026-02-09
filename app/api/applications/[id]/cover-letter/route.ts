// app/api/applications/[id]/cover-letter/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { Permission } from "@prisma/client"
import { checkPermission, getUserCompanyByClerkId } from "@/lib/permissions"
import { notifyCoverLetterReviewed } from "@/lib/notifications"

/**
 * GET /api/applications/[id]/cover-letter
 * Retrieve the cover letter for an application.
 * - Students can view their own cover letter.
 * - Company members with VIEW_APPLICATIONS can view any application's cover letter.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 })

        const application = await prisma.application.findUnique({
            where: { id },
            select: {
                id: true,
                studentId: true,
                coverLetter: true,
                coverLetterStatus: true,
                coverLetterGeneratedByAI: true,
                coverLetterReviewedBy: true,
                coverLetterReviewNote: true,
                coverLetterReviewedAt: true,
                internship: {
                    select: {
                        id: true,
                        title: true,
                        requiresCoverLetter: true,
                        companyId: true,
                        company: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        if (!application)
            return NextResponse.json({ error: "Application not found" }, { status: 404 })

        // Check access: student can view own, company members with permission can view
        if (user.role === "STUDENT") {
            if (application.studentId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        } else {
            // Company/TeamMember - check permission
            const membership = await getUserCompanyByClerkId(clerkId)
            if (!membership || membership.companyId !== application.internship.companyId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            const hasPermission = await checkPermission(
                membership.userId,
                membership.companyId,
                Permission.VIEW_APPLICATIONS
            )
            if (!hasPermission) {
                return NextResponse.json({ error: "No permission to view applications" }, { status: 403 })
            }
        }

        return NextResponse.json({
            coverLetter: application.coverLetter,
            coverLetterStatus: application.coverLetterStatus,
            coverLetterGeneratedByAI: application.coverLetterGeneratedByAI,
            coverLetterReviewNote: application.coverLetterReviewNote,
            coverLetterReviewedAt: application.coverLetterReviewedAt,
            requiresCoverLetter: application.internship.requiresCoverLetter,
            internshipTitle: application.internship.title,
            companyName: application.internship.company.name,
        })
    } catch (error) {
        console.error("GET cover-letter error:", error)
        return NextResponse.json({ error: "Failed to fetch cover letter" }, { status: 500 })
    }
}

/**
 * PATCH /api/applications/[id]/cover-letter
 * Two modes:
 * 1. Student updates their cover letter (while application is PENDING)
 * 2. Company reviews the cover letter (adds review note)
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const body = await req.json()

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 })

        const application = await prisma.application.findUnique({
            where: { id },
            select: {
                id: true,
                studentId: true,
                status: true,
                internship: {
                    select: {
                        id: true,
                        title: true,
                        companyId: true,
                        company: {
                            select: { name: true, ownerId: true }
                        }
                    }
                }
            }
        })

        if (!application)
            return NextResponse.json({ error: "Application not found" }, { status: 404 })

        // ========== STUDENT: Update cover letter ==========
        if (user.role === "STUDENT") {
            if (application.studentId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            if (application.status !== "PENDING") {
                return NextResponse.json(
                    { error: "Cannot edit cover letter after application has been processed" },
                    { status: 400 }
                )
            }

            const { coverLetter, coverLetterGeneratedByAI } = body

            if (coverLetter !== undefined && coverLetter !== null && coverLetter.trim().length > 5000) {
                return NextResponse.json(
                    { error: "Cover letter must be under 5000 characters" },
                    { status: 400 }
                )
            }

            const updated = await prisma.application.update({
                where: { id },
                data: {
                    coverLetter: coverLetter?.trim() || null,
                    coverLetterStatus: coverLetter?.trim() ? "SUBMITTED" : null,
                    coverLetterGeneratedByAI: Boolean(coverLetterGeneratedByAI),
                },
                select: {
                    coverLetter: true,
                    coverLetterStatus: true,
                    coverLetterGeneratedByAI: true,
                }
            })

            return NextResponse.json(updated)
        }

        // ========== COMPANY: Review cover letter ==========
        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership || membership.companyId !== application.internship.companyId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.REVIEW_COVER_LETTERS
        )
        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to review cover letters" },
                { status: 403 }
            )
        }

        const { reviewNote } = body

        const updated = await prisma.application.update({
            where: { id },
            data: {
                coverLetterStatus: "REVIEWED",
                coverLetterReviewedBy: user.id,
                coverLetterReviewNote: reviewNote?.trim() || null,
                coverLetterReviewedAt: new Date(),
            },
            select: {
                coverLetter: true,
                coverLetterStatus: true,
                coverLetterReviewNote: true,
                coverLetterReviewedAt: true,
            }
        })

        // Notify the student
        await notifyCoverLetterReviewed(
            application.studentId,
            application.internship.title,
            application.internship.company.name,
            application.id
        )

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PATCH cover-letter error:", error)
        return NextResponse.json({ error: "Failed to update cover letter" }, { status: 500 })
    }
}
