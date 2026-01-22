"use client"

import { motion } from "framer-motion"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Building2, ArrowRight, Calendar, User, Target, CheckCircle2, AlertCircle, FileText, Eye, Upload, BarChart3, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useDashboard } from "@/lib/dashboard-context"
import { AssignmentSubmitModal } from "@/components/assignment-submit-modal"
import { CompanyAssignmentProgressModal } from "@/components/company-assignment-progress-modal"

type ApiProject = {
    id: string
    internship: {
        title: string
        company: { name: string }
        startDate: string | null
        endDate: string | null
    }
    student: { name: string; email: string }
    status: "ONGOING" | "COMPLETED" | "PENDING"
    createdAt: string
    assignment?: {
        id?: string
        title: string
        description: string
        dueDate: string
    } | null
}


interface ActiveProjectsSectionProps {
    setActiveTab?: (tab: string) => void
    userType?: "Student" | "Company"
}

export function ActiveAssignmentsSection({ setActiveTab, userType = "Student" }: ActiveProjectsSectionProps) {
    const router = useRouter()
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
    const [submitModalOpen, setSubmitModalOpen] = useState(false)
    const [progressModalOpen, setProgressModalOpen] = useState(false)
    
    const handleNavigateToProjects = () => {
        if (setActiveTab) {
            setActiveTab("projects")
        } else {
            const basePath = userType === "Student" ? "/dashboard/student" : "/dashboard/company"
            router.push(`${basePath}/experience`)
        }
    }
    
    // Use centralized context - no more individual fetches
    const { projects: contextProjects, isLoadingProjects } = useDashboard()

    // Transform context projects to match expected ApiProject type
    const projects = useMemo(() => {
        return contextProjects.map(p => ({
            id: p.id,
            internship: {
                title: p.internship.title,
                company: p.internship.company,
                startDate: p.internship.startDate ?? null,
                endDate: p.internship.endDate ?? null,
            },
            student: { 
                name: p.student.profile?.name || p.student.email, 
                email: p.student.email 
            },
            status: (p.application?.status === "APPROVED" ? "ONGOING" : "PENDING") as "ONGOING" | "COMPLETED" | "PENDING",
            createdAt: p.createdAt,
        })) as ApiProject[]
    }, [contextProjects])

    const isLoading = isLoadingProjects

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ONGOING":
                return "bg-[var(--application-pending)] text-[var(--application-pending-foreground)]"
            case "COMPLETED":
                return "bg-[var(--application-approved)] text-[var(--application-approved-foreground)]"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const getProjectDetails = (proj: ApiProject) => {
        const startDate = proj.internship.startDate ? new Date(proj.internship.startDate) : new Date(proj.createdAt)

        const endDate = proj.internship.endDate ? new Date(proj.internship.endDate) : null
        const now = new Date()

        let progress = 0
        let remainingDays: number | null = 0
        let totalDays: number | null = 0

        const daysSinceStart = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

        if (endDate) {
            const start = startDate.getTime()
            const end = endDate.getTime()
            const nowTime = now.getTime()

            // Calculate progress based on actual time elapsed (not just days)
            progress = Math.min(100, Math.max(0, ((nowTime - start) / (end - start)) * 100))

            // Calculate total and remaining days for display
            totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
            remainingDays = Math.max(0, Math.ceil((end - nowTime) / (1000 * 60 * 60 * 24)))
        } else {
            // No end date → assume open-ended internship
            totalDays = null
            remainingDays = null
            progress = 0 // could show "N/A" instead of progress bar
        }

        return {
            progress: parseFloat(progress.toFixed(2)),
            daysSinceStart,
            remainingDays,
            totalDays,
            formattedStartDate: startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            formattedEndDate: endDate ? endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null,
        }
    }

    return (
        <section className="space-y-4">
            {/* Enhanced Header with Gradient */}
            <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-transparent border border-purple-500/20">
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                Active Assignments
                                <Sparkles className="h-4 w-4 text-purple-500" />
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {projects.length} assignments • {projects.filter((p) => p.status === "ONGOING").length} active
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {userType === "Company" && (
                            <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                                onClick={() => setProgressModalOpen(true)}
                            >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Progress Dashboard
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="hover:bg-muted group" onClick={handleNavigateToProjects}>
                            View All
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-5 border-border/50 border-l-4 border-l-muted">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-muted/50 rounded-xl relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="h-5 w-52 bg-muted/50 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                            <div className="h-6 w-20 bg-muted/40 rounded-full relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                        </div>
                                        <div className="h-4 w-36 bg-muted/40 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                        <div className="space-y-2">
                                            <div className="h-2.5 w-full bg-muted/30 rounded-full relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                            <div className="flex gap-4">
                                                <div className="h-3 w-16 bg-muted/30 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                                <div className="h-3 w-20 bg-muted/30 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                                <div className="h-3 w-24 bg-muted/30 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <Card className="border-2 border-dashed border-muted p-8 text-center">
                    <div className="space-y-2">
                        <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
                        <div>
                            <h4 className="font-medium">No active projects</h4>
                            <p className="text-sm text-muted-foreground">Projects will appear here when applications are approved</p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {projects
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // newest first
                        .slice(0, 3)
                        .map((proj, index) => {
                            const details = getProjectDetails(proj)

                            return (
                                <motion.div
                                    key={proj.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="cursor-pointer"
                                >
                                    <Card className="hover:shadow-lg transition-all duration-300 group border border-border hover:border-purple-500/40 rounded-xl overflow-hidden">
                                        {/* Top accent bar */}
                                        <div className="h-1 bg-gradient-to-r from-purple-500/60 via-blue-500/60 to-purple-500/60" />
                                        <CardContent className="p-4">
                                            <div className="space-y-4">
                                                {/* Header Section */}
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-12 w-12 ring-2 ring-purple-500/20">
                                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
                                                            {proj.internship.company?.name?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <h4 className="font-semibold text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                                                                    {proj.internship.title}
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground font-medium">
                                                                    {proj.internship.company?.name || "Unknown Company"}
                                                                </p>
                                                            </div>
                                                            <Badge className={`text-xs font-medium ${getStatusColor(proj.status)} shadow-sm`}>
                                                                {proj.status === "ONGOING" ? (
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                )}
                                                                {proj.status}
                                                            </Badge>
                                                        </div>

                                                        {/* Assignment Info - Enhanced */}
                                                        {proj.assignment && (
                                                            <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent border border-purple-500/20">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm text-foreground flex items-center gap-2">
                                                                            <FileText className="h-4 w-4 text-purple-500" />
                                                                            {proj.assignment.title}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                            {proj.assignment.description}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                            Due: {new Date(proj.assignment.dueDate).toLocaleDateString("en-US", {
                                                                                month: "short",
                                                                                day: "numeric",
                                                                                year: "numeric"
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                    {userType === "Student" && proj.assignment.id && (
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setSelectedAssignmentId(proj.assignment?.id || null)
                                                                                setSubmitModalOpen(true)
                                                                            }}
                                                                            className="shrink-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                                                                        >
                                                                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                                                                            Submit
                                                                        </Button>
                                                                    )}
                                                                    {userType === "Company" && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setProgressModalOpen(true)
                                                                            }}
                                                                            className="shrink-0 border-purple-500/30 hover:bg-purple-500/10"
                                                                        >
                                                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                                            View
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Student Info */}
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                                                            <User className="h-4 w-4" />
                                                            <span>{proj.student?.name || "Unknown Student"}</span>
                                                            <span className="text-muted-foreground/60">•</span>
                                                            <Calendar className="h-4 w-4" />
                                                            <span>Started {details.formattedStartDate}</span>
                                                        </div>

                                                        {/* Progress Section */}
                                                        <div className="space-y-3 mt-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Target className="h-4 w-4 text-purple-500" />
                                                                    <span className="text-sm font-medium">Progress</span>
                                                                </div>
                                                                {details.totalDays ? (
                                                                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                                                        {details.progress}%
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs italic text-muted-foreground">Ongoing</span>
                                                                )}
                                                            </div>

                                                            {details.totalDays ? (
                                                                <div className="space-y-2">
                                                                    {/* Custom Progress Bar */}
                                                                    <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all duration-500 ${
                                                                                details.progress < 50
                                                                                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                                                                    : details.progress < 80
                                                                                        ? "bg-gradient-to-r from-purple-500 to-blue-500"
                                                                                        : details.progress < 100
                                                                                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                                                                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                                                                            }`}
                                                                            style={{ width: `${details.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    {/* Detailed Stats */}
                                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                        <div className="flex items-center gap-4">
                                                                          <span className="flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                              {details.daysSinceStart} days active
                                                                          </span>
                                                                            {proj.status === "ONGOING" && (
                                                                                <span className="flex items-center gap-1">
                                                                                  <Calendar className="h-3 w-3" />~{details.remainingDays} days remaining
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {proj.status === "COMPLETED" && (
                                                                            <span className="text-emerald-500 font-medium">
                                                                                Completed in {details.daysSinceStart} days
                                                                              </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-muted-foreground italic">
                                                                    Ongoing internship (no end date)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                </div>
            )}

            {/* Student Assignment Submit Modal */}
            <AssignmentSubmitModal
                open={submitModalOpen}
                onClose={() => {
                    setSubmitModalOpen(false)
                    setSelectedAssignmentId(null)
                }}
                assignmentId={selectedAssignmentId}
                onSubmitted={() => {
                    // Could trigger a refresh here if needed
                }}
            />

            {/* Company Progress Dashboard Modal */}
            <CompanyAssignmentProgressModal
                open={progressModalOpen}
                onClose={() => setProgressModalOpen(false)}
            />
        </section>
    )
}
