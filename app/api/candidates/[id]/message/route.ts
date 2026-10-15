import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

const MAX_MESSAGE_LENGTH = 2000

// Send a direct message/contact request to a candidate
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: candidateId } = await params
        const { message, subject } = await req.json()

        if (typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        if (message.trim().length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json(
                { error: `Message is too long (maximum ${MAX_MESSAGE_LENGTH} characters)` },
                { status: 400 }
            )
        }

        // Get the company user
        const companyUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true }
        })

        if (!companyUser || companyUser.role !== "COMPANY" || companyUser.companies.length === 0) {
            return NextResponse.json({ error: "Only companies can send messages to candidates" }, { status: 403 })
        }

        const company = companyUser.companies[0]

        // Get the candidate
        const candidate = await prisma.user.findUnique({
            where: { id: candidateId },
            include: { profile: true, portfolio: true }
        })

        if (!candidate || candidate.role !== "STUDENT") {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
        }

        // Create notification for the candidate (contact request)
        const notification = await prisma.notification.create({
            data: {
                userId: candidateId,
                type: "NEW_MESSAGE",
                title: (typeof subject === "string" && subject.trim() ? subject.trim() : `Message from ${company.name}`).slice(0, 150),
                message: message.trim(),
                link: "/dashboard/student/messages"
            }
        })

        return NextResponse.json({ 
            success: true, 
            notificationId: notification.id,
            message: "Message sent successfully! The candidate will be notified."
        })

    } catch (error) {
        console.error("Error sending message:", error)
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }
}
