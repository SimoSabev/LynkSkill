"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Video, 
    User, 
    Building2, 
    CheckCircle, 
    XCircle, 
    RefreshCw,
    Loader2,
    Sparkles,
    AlertCircle,
    Link2,
    Pencil
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { format, isPast, isToday, isTomorrow, differenceInHours } from "date-fns"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface Interview {
    id: string
    scheduledAt: string
    location: string | null
    notes: string | null
    status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
    application: {
        student: {
            id: string
            email: string
            profile: { name: string } | null
        }
        internship: {
            id: string
            title: string
            company: {
                id: string
                name: string
                logo: string | null
            }
        }
    }
}

interface InterviewsTabContentProps {
    userType: "Student" | "Company"
}

export function InterviewsTabContent({ userType }: InterviewsTabContentProps) {
    const { t } = useTranslation()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
    const [editLinkValue, setEditLinkValue] = useState("")

    const fetchInterviews = useCallback(async () => {
        try {
            const res = await fetch("/api/interviews")
            if (res.ok) {
                const data = await res.json()
                setInterviews(data)
            }
        } catch (error) {
            console.error("Error fetching interviews:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInterviews()
    }, [fetchInterviews])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchInterviews()
        setRefreshing(false)
    }

    const updateInterviewStatus = async (id: string, status: string) => {
        setUpdatingId(id)
        try {
            const res = await fetch(`/api/interviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                setInterviews(prev => prev.map(i => 
                    i.id === id ? { ...i, status: status as Interview["status"] } : i
                ))
                toast.success(`Interview ${status.toLowerCase()}`)
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to update interview")
            }
        } catch (error) {
            console.error("Error updating interview:", error)
            toast.error("Something went wrong")
        } finally {
            setUpdatingId(null)
        }
    }

    const updateMeetingLink = async (id: string) => {
        if (!editLinkValue.trim()) {
            toast.error("Please enter a meeting link")
            return
        }
        
        setUpdatingId(id)
        try {
            const res = await fetch(`/api/interviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location: editLinkValue.trim() })
            })

            if (res.ok) {
                setInterviews(prev => prev.map(i => 
                    i.id === id ? { ...i, location: editLinkValue.trim() } : i
                ))
                toast.success("Meeting link updated!")
                setEditingLinkId(null)
                setEditLinkValue("")
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to update meeting link")
            }
        } catch (error) {
            console.error("Error updating meeting link:", error)
            toast.error("Something went wrong")
        } finally {
            setUpdatingId(null)
        }
    }

    const startEditingLink = (interview: Interview) => {
        setEditingLinkId(interview.id)
        setEditLinkValue(interview.location || "")
    }

    const getStatusConfig = (status: Interview["status"]) => {
        switch (status) {
            case "SCHEDULED":
                return { 
                    label: t('interviews.scheduled'), 
                    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
                    icon: Calendar
                }
            case "CONFIRMED":
                return { 
                    label: t('interviews.confirmed'), 
                    color: "bg-green-500/10 text-green-600 border-green-500/30",
                    icon: CheckCircle
                }
            case "COMPLETED":
                return { 
                    label: t('common.completed'), 
                    color: "bg-gray-500/10 text-gray-600 border-gray-500/30",
                    icon: CheckCircle
                }
            case "CANCELLED":
                return { 
                    label: t('interviews.cancelled'), 
                    color: "bg-red-500/10 text-red-600 border-red-500/30",
                    icon: XCircle
                }
            case "RESCHEDULED":
                return { 
                    label: t('interviews.rescheduled'), 
                    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
                    icon: AlertCircle
                }
            default:
                return { 
                    label: status, 
                    color: "bg-gray-500/10 text-gray-600 border-gray-500/30",
                    icon: Calendar
                }
        }
    }

    const getTimeLabel = (date: Date) => {
        if (isToday(date)) return t('common.today')
        if (isTomorrow(date)) return t('interviews.tomorrow')
        return format(date, "EEEE, MMM d")
    }

    const isVideoCall = (location: string | null) => {
        if (!location) return true
        const lower = location.toLowerCase()
        return lower.includes("zoom") || lower.includes("meet") || lower.includes("teams") || lower.includes("video")
    }

    // Separate upcoming and past interviews
    const upcomingInterviews = interviews.filter(i => 
        !isPast(new Date(i.scheduledAt)) && !["CANCELLED", "COMPLETED"].includes(i.status)
    )
    const pastInterviews = interviews.filter(i => 
        isPast(new Date(i.scheduledAt)) || ["CANCELLED", "COMPLETED"].includes(i.status)
    )

    return (
        <section className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 backdrop-blur-sm shadow-xl md:shadow-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/5 border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm shadow-lg">
                                <Calendar className="h-5 w-5 md:h-7 md:w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                                {t('interviews.title')}
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                            {upcomingInterviews.length} {t('interviews.upcomingInterviews').toLowerCase()}
                        </p>
                    </div>

                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing || isLoading}
                        className="rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg bg-transparent"
                    >
                        <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${refreshing ? "animate-spin" : ""} mr-2`} />
                        {refreshing ? t('common.loading') : t('common.refresh')}
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="space-y-2">
                                <div className="h-5 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-20 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : interviews.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 rounded-2xl bg-muted/50 mb-4">
                            <Calendar className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{t('interviews.noInterviews')}</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {userType === "Student" 
                                ? t('interviews.noInterviewsStudentDescription')
                                : t('interviews.noInterviewsDescription')}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Upcoming Interviews */}
                    {upcomingInterviews.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-500" />
                                Upcoming Interviews
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {upcomingInterviews.map((interview) => {
                                    const scheduledDate = new Date(interview.scheduledAt)
                                    const statusConfig = getStatusConfig(interview.status)
                                    const StatusIcon = statusConfig.icon
                                    const hoursUntil = differenceInHours(scheduledDate, new Date())

                                    return (
                                        <motion.div
                                            key={interview.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Card className={cn(
                                                "border-2 transition-all hover:shadow-lg",
                                                hoursUntil <= 24 && hoursUntil > 0 && "border-blue-500/50 bg-blue-500/5"
                                            )}>
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <CardTitle className="text-lg">
                                                                {interview.application.internship.title}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                {userType === "Student" ? (
                                                                    <>
                                                                        <Building2 className="h-4 w-4" />
                                                                        {interview.application.internship.company.name}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <User className="h-4 w-4" />
                                                                        {interview.application.student.profile?.name || interview.application.student.email}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Badge className={cn("border", statusConfig.color)}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {/* Date & Time */}
                                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-blue-500" />
                                                            <span className="font-medium">{getTimeLabel(scheduledDate)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-blue-500" />
                                                            <span>{format(scheduledDate, "h:mm a")}</span>
                                                        </div>
                                                    </div>

                                                    {/* Location / Meeting Link */}
                                                    {editingLinkId === interview.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={editLinkValue}
                                                                onChange={(e) => setEditLinkValue(e.target.value)}
                                                                placeholder="https://zoom.us/j/... or address"
                                                                className="flex-1 h-9 text-sm rounded-lg"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updateMeetingLink(interview.id)}
                                                                disabled={updatingId === interview.id}
                                                                className="h-9"
                                                            >
                                                                {updatingId === interview.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    "Save"
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setEditingLinkId(null)}
                                                                className="h-9"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : interview.location ? (
                                                        <div className="flex items-center gap-2 text-sm group">
                                                            {isVideoCall(interview.location) ? (
                                                                <Video className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <MapPin className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span className="text-muted-foreground flex-1">{interview.location}</span>
                                                            {userType === "Company" && ["SCHEDULED", "CONFIRMED"].includes(interview.status) && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => startEditingLink(interview)}
                                                                    className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : userType === "Company" && ["SCHEDULED", "CONFIRMED"].includes(interview.status) ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => startEditingLink(interview)}
                                                            className="w-full border-dashed"
                                                        >
                                                            <Link2 className="h-4 w-4 mr-2" />
                                                            Add Meeting Link
                                                        </Button>
                                                    ) : null}

                                                    {/* Notes */}
                                                    {interview.notes && (
                                                        <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                                                            {interview.notes}
                                                        </p>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex gap-2 pt-2">
                                                        {userType === "Student" && interview.status === "SCHEDULED" && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => updateInterviewStatus(interview.id, "CONFIRMED")}
                                                                    disabled={updatingId === interview.id}
                                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                                >
                                                                    {updatingId === interview.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                    )}
                                                                    Confirm
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => updateInterviewStatus(interview.id, "RESCHEDULED")}
                                                                    disabled={updatingId === interview.id}
                                                                    className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"
                                                                >
                                                                    <Clock className="h-4 w-4 mr-1" />
                                                                    Reschedule
                                                                </Button>
                                                            </>
                                                        )}

                                                        {userType === "Company" && (
                                                            <>
                                                                {interview.status === "SCHEDULED" && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => updateInterviewStatus(interview.id, "CANCELLED")}
                                                                        disabled={updatingId === interview.id}
                                                                        className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Cancel
                                                                    </Button>
                                                                )}
                                                                {interview.status === "CONFIRMED" && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => updateInterviewStatus(interview.id, "COMPLETED")}
                                                                        disabled={updatingId === interview.id}
                                                                    >
                                                                        {updatingId === interview.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                                        )}
                                                                        Mark Complete
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Past Interviews */}
                    {pastInterviews.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Past Interviews
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 opacity-75">
                                {pastInterviews.slice(0, 4).map((interview) => {
                                    const scheduledDate = new Date(interview.scheduledAt)
                                    const statusConfig = getStatusConfig(interview.status)

                                    return (
                                        <Card key={interview.id} className="border-border/50">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{interview.application.internship.title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(scheduledDate, "MMM d, yyyy 'at' h:mm a")}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary" className={statusConfig.color}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}
