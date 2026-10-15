// app/api/messages/[conversationId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { createNotification } from "@/lib/notifications"

export const dynamic = "force-dynamic"

// GET - Get messages for a conversation
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { conversationId } = await params

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get conversation and verify access
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                company: { select: { ownerId: true } }
            }
        })

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
        }

        // Check authorization
        const isStudent = user.id === conversation.studentId
        const isCompanyOwner = user.id === conversation.company.ownerId

        if (!isStudent && !isCompanyOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Get messages
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { name: true } }
                    }
                }
            }
        })

        // Mark messages as read
        const otherSenderType = isStudent ? "COMPANY" : "STUDENT"
        await prisma.message.updateMany({
            where: {
                conversationId,
                senderType: otherSenderType,
                read: false
            },
            data: { read: true }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error("Error fetching messages:", error)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }
}

// POST - Send a new message
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { conversationId } = await params
        const { content } = await req.json()

        if (!content || content.trim() === "") {
            return NextResponse.json({ error: "Message content required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true, profile: { select: { name: true } } }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get conversation and verify access
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                company: { select: { id: true, ownerId: true, name: true } },
                student: { select: { id: true, profile: { select: { name: true } } } },
                application: {
                    include: {
                        internship: { select: { title: true } }
                    }
                }
            }
        })

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
        }

        // Check authorization
        const isStudent = user.id === conversation.studentId
        const isCompanyOwner = user.id === conversation.company.ownerId

        if (!isStudent && !isCompanyOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: user.id,
                senderType: isStudent ? "STUDENT" : "COMPANY",
                content: content.trim()
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { name: true } }
                    }
                }
            }
        })

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        })

        // Send notification to the other party
        const recipientId = isStudent ? conversation.company.ownerId : conversation.studentId
        const senderName = isStudent 
            ? (user.profile?.name || "A student")
            : conversation.company.name

        await createNotification({
            userId: recipientId,
            type: "NEW_MESSAGE",
            title: "New Message",
            message: `${senderName} sent you a message about "${conversation.application.internship.title}"`,
            link: `/dashboard/${isStudent ? "company" : "student"}/messages?conversation=${conversationId}`
        })

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        console.error("Error sending message:", error)
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }
}
