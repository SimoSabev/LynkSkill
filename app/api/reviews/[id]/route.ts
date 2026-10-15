import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateReviewSchema = z.object({
    rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5").optional(),
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters").optional(),
    content: z.string().min(10, "Review must be at least 10 characters").max(2000, "Review cannot exceed 2000 characters").optional(),
})

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Get a specific review
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        profile: { select: { name: true } }
                    }
                },
                company: {
                    select: { id: true, name: true, logo: true }
                },
                application: {
                    select: {
                        internship: {
                            select: { title: true }
                        }
                    }
                }
            }
        })

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 })
        }

        return NextResponse.json(review)
    } catch (error) {
        console.error("Error fetching review:", error)
        return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 })
    }
}

// PATCH - Update a review
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const user = await prisma.user.findUnique({
            where: { clerkId }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const review = await prisma.review.findUnique({
            where: { id }
        })

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 })
        }

        if (review.studentId !== user.id) {
            return NextResponse.json({ error: "You can only edit your own reviews" }, { status: 403 })
        }

        const validation = updateReviewSchema.safeParse(await req.json())
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
        }
        const { rating, title, content } = validation.data

        const updatedReview = await prisma.review.update({
            where: { id },
            data: {
                ...(rating && { rating }),
                ...(title && { title }),
                ...(content && { content })
            }
        })

        return NextResponse.json(updatedReview)
    } catch (error) {
        console.error("Error updating review:", error)
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
    }
}

// DELETE - Delete a review
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const user = await prisma.user.findUnique({
            where: { clerkId }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const review = await prisma.review.findUnique({
            where: { id }
        })

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 })
        }

        if (review.studentId !== user.id) {
            return NextResponse.json({ error: "You can only delete your own reviews" }, { status: 403 })
        }

        await prisma.review.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting review:", error)
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
    }
}
