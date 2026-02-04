"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Trash2, ExternalLink, CheckCircle, Loader2, Building2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface NotificationMetadata {
    applicationId?: string
    internshipTitle?: string
    companyName?: string
    companyId?: string
    projectId?: string
}

interface Notification extends NotificationMetadata {
    id: string
    type: string
    title: string
    message: string
    link: string | null
    read: boolean
    createdAt: string
}

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    
    // Action modal state
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [actionModalOpen, setActionModalOpen] = useState(false)
    const [accepting, setAccepting] = useState(false)

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

    const deleteNotification = async (notificationId: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
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

    // Handle notification click - show action modal or navigate
    const handleNotificationClick = (notification: Notification) => {
        console.log("Notification clicked:", notification) // Debug log
        console.log("Link value:", notification.link) // Debug log
        
        if (!notification.read) {
            markAsRead(notification.id)
        }
        
        // For approved applications, show the action modal
        if (notification.type === "APPLICATION_APPROVED" && notification.applicationId) {
            setSelectedNotification(notification)
            setActionModalOpen(true)
            setOpen(false) // Close dropdown
        } else if (notification.link) {
            // For other notifications with links, navigate directly
            console.log("Navigating to:", notification.link) // Debug log
            setOpen(false)
            router.push(notification.link)
        } else if (notification.type === "TEAM_INVITATION") {
            // Fallback for old team invitation notifications without links
            toast.info("Please check your email for the invitation link, or ask the company to resend the invitation.")
        } else {
            console.log("No link available for notification") // Debug log
        }
    }

    // Accept internship offer
    const acceptOffer = async () => {
        if (!selectedNotification?.applicationId) {
            toast.error("No application found")
            return
        }
        
        setAccepting(true)
        try {
            const res = await fetch("/api/applications/accept-offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    applicationId: selectedNotification.applicationId,
                    notificationId: selectedNotification.id
                })
            })
            
            const data = await res.json()
            
            if (res.ok) {
                toast.success("🎉 Congratulations! You've accepted the internship offer!")
                setActionModalOpen(false)
                fetchNotifications()
                
                // Navigate to the experience page with the company
                router.push("/dashboard/student/experience")
                
                // Force page reload to update sidebar with new team
                setTimeout(() => {
                    window.location.reload()
                }, 500)
            } else {
                toast.error(data.error || "Failed to accept offer")
            }
        } catch (error) {
            console.error("Accept offer error:", error)
            toast.error("Something went wrong")
        } finally {
            setAccepting(false)
        }
    }

    // Navigate to applications page to see details
    const viewDetails = () => {
        setActionModalOpen(false)
        router.push("/dashboard/student/internships/applied")
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
            case "TEAM_INVITATION":
                return "👥"
            case "TEAM_INVITATION_ACCEPTED":
                return "🤝"
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
        return date.toLocaleDateString()
    }

    // Check if notification has an actionable offer
    const isActionable = (notification: Notification) => {
        return notification.type === "APPLICATION_APPROVED" && notification.applicationId
    }

    // Check if notification is a team invitation that requires action
    const isTeamInvitation = (notification: Notification) => {
        return notification.type === "TEAM_INVITATION" && notification.link
    }

    // Check if notification has any link to navigate to
    const hasLink = (notification: Notification) => {
        return !!notification.link
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
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
                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
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
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "p-4 hover:bg-muted/50 transition-colors relative group cursor-pointer",
                                            !notification.read && "bg-primary/5",
                                            isActionable(notification) && "border-l-4 border-l-green-500",
                                            isTeamInvitation(notification) && "border-l-4 border-l-blue-500"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <span className="text-xl shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-medium text-sm">
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                
                                                {/* Action indicator for approved applications */}
                                                {isActionable(notification) && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                                                        <CheckCircle className="h-3 w-3" />
                                                        <span>Click to accept offer</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                    </div>
                                                )}
                                                
                                                {/* Action indicator for team invitations */}
                                                {isTeamInvitation(notification) && (
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                        <Building2 className="h-3 w-3" />
                                                        <span>Click to view invitation</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!notification.read && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-6 w-6"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    markAsRead(notification.id)
                                                                }}
                                                                title="Mark as read"
                                                            >
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                                            onClick={(e) => deleteNotification(notification.id, e)}
                                                            title="Delete"
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
                    {notifications.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                                <Button 
                                    variant="ghost" 
                                    className="w-full text-sm"
                                    onClick={() => {
                                        setOpen(false)
                                        router.push("/dashboard/student/internships/applied")
                                    }}
                                >
                                    View all applications
                                </Button>
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Accept Offer Modal */}
            <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <span className="text-3xl">🎉</span>
                            <span>Accept Internship Offer</span>
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            {selectedNotification?.message}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6">
                        {/* Company info card */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                                        {selectedNotification?.companyName || "Company"}
                                    </h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        {selectedNotification?.internshipTitle || "Internship Position"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                                <p className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Your application has been approved!</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Accept to join the team and start your journey</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Access your project workspace after accepting</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            onClick={acceptOffer}
                            disabled={accepting}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            size="lg"
                        >
                            {accepting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept Offer
                                </>
                            )}
                        </Button>
                        
                        <Button
                            variant="outline"
                            onClick={viewDetails}
                            className="flex-1"
                            size="lg"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
