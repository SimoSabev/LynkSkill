"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Older notifications were stored with "/dashboard/<role>?tab=<x>" links that no page reads.
const LEGACY_TAB_PATHS: Record<string, Record<string, string>> = {
    student: { applications: "internships/applied", experience: "experience", home: "internships", interviews: "interviews", messages: "messages", files: "interviews" },
    company: { applications: "applications", experience: "experience", interviews: "interviews", messages: "messages" },
}

function resolveNotificationLink(link: string): string {
    const match = link.match(/^\/dashboard\/(student|company)\?(.*)$/)
    if (!match) return link
    const [, role, query] = match
    const params = new URLSearchParams(query)
    const sub = LEGACY_TAB_PATHS[role]?.[params.get("tab") ?? ""]
    if (!sub) return `/dashboard/${role}`
    params.delete("tab")
    const rest = params.toString()
    return `/dashboard/${role}/${sub}${rest ? `?${rest}` : ""}`
}

interface Notification {
    id: string
    type: string
    title: string
    message: string
    link: string | null
    read: boolean
    createdAt: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [notificationId] })
            })
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Failed to mark notification as read:", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true })
            })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to mark all as read:", error)
        }
    }

    const openNotification = (notification: Notification) => {
        if (!notification.read) markAsRead(notification.id)
        setOpen(false)
        if (notification.link) router.push(resolveNotificationLink(notification.link))
    }

    const clearRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deleteAllRead: true })
            })
            setNotifications(prev => prev.filter(n => !n.read))
        } catch (error) {
            console.error("Failed to clear notifications:", error)
        }
    }

    const deleteNotification = async (notificationId: string) => {
        try {
            await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId })
            })
            const wasUnread = notifications.find(n => n.id === notificationId)?.read === false
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error("Failed to delete notification:", error)
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "APPLICATION_APPROVED":
                return "🎉"
            case "APPLICATION_REJECTED":
                return "📋"
            case "APPLICATION_SUBMITTED":
                return "📨"
            case "NEW_ASSIGNMENT":
                return "📝"
            case "ASSIGNMENT_SUBMITTED":
                return "✅"
            case "EXPERIENCE_GRADED":
                return "⭐"
            case "INTERNSHIP_DEADLINE":
                return "⏰"
            case "INTERVIEW_SCHEDULED":
            case "INTERVIEW_REMINDER":
                return "📅"
            case "NEW_MESSAGE":
                return "💬"
            default:
                return "🔔"
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}>
                    <Bell className="h-5 w-5" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Badge 
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-purple-500 hover:bg-purple-500"
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={markAllAsRead}
                            className="text-xs h-7"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-xl">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                {notification.link ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openNotification(notification)}
                                                        className="font-medium text-sm text-left hover:underline underline-offset-2"
                                                    >
                                                        {notification.title}
                                                    </button>
                                                ) : (
                                                    <p className="font-medium text-sm">
                                                        {notification.title}
                                                    </p>
                                                )}
                                                {!notification.read && (
                                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                                                    {notification.link && (
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                        >
                                                            <Link
                                                                href={resolveNotificationLink(notification.link)}
                                                                aria-label="Open"
                                                                onClick={() => {
                                                                    if (!notification.read) markAsRead(notification.id)
                                                                    setOpen(false)
                                                                }}
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {!notification.read && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6"
                                                            aria-label="Mark as read"
                                                            onClick={() => markAsRead(notification.id)}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                        aria-label="Delete notification"
                                                        onClick={() => deleteNotification(notification.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {notifications.some(n => n.read) && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                className="w-full text-sm"
                                onClick={clearRead}
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Clear read notifications
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
