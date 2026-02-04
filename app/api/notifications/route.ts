// app/api/notifications/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/notifications - Get all notifications for current user
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit to last 50 notifications
            select: {
                id: true,
                type: true,
                title: true,
                message: true,
                link: true,
                metadata: true,
                read: true,
                createdAt: true,
            }
        })

        // Transform notifications to include metadata fields at top level for easy access
        const transformedNotifications = notifications.map((notification) => {
            const meta = notification.metadata as Record<string, unknown> | null
            return {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
                read: notification.read,
                createdAt: notification.createdAt,
                // Extract from metadata if available
                applicationId: meta?.applicationId as string | undefined,
                internshipTitle: meta?.internshipTitle as string | undefined,
                companyName: meta?.companyName as string | undefined,
                companyId: meta?.companyId as string | undefined,
                projectId: meta?.projectId as string | undefined,
            }
        })

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: { userId: user.id, read: false }
        })

        return NextResponse.json({ 
            notifications: transformedNotifications, 
            unreadCount 
        })
    } catch (error) {
        console.error("GET /api/notifications error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const body = await req.json()
        const { notificationIds, markAllRead } = body as { 
            notificationIds?: string[]
            markAllRead?: boolean 
        }

        if (markAllRead) {
            // Mark all notifications as read
            await prisma.notification.updateMany({
                where: { userId: user.id, read: false },
                data: { read: true }
            })
        } else if (notificationIds && notificationIds.length > 0) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: { 
                    id: { in: notificationIds },
                    userId: user.id 
                },
                data: { read: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("PATCH /api/notifications error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// DELETE /api/notifications - Delete old notifications
export async function DELETE(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const body = await req.json()
        const { notificationId, deleteAllRead } = body as { 
            notificationId?: string
            deleteAllRead?: boolean 
        }

        if (deleteAllRead) {
            // Delete all read notifications
            await prisma.notification.deleteMany({
                where: { userId: user.id, read: true }
            })
        } else if (notificationId) {
            // Delete specific notification
            await prisma.notification.delete({
                where: { 
                    id: notificationId,
                    userId: user.id 
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("DELETE /api/notifications error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
