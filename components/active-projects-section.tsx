"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Clock, Building2, ArrowRight, Calendar, User, Target, CheckCircle2, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type ApiProject = {
    id: string
    internship: {
        title: string
        company: { name: string }
        startDate: string | null
        endDate: string | null
    }
    student: { name: string; email: string }
    status: "ONGOING" | "COMPLETED"
    createdAt: string
}

interface ActiveProjectsSectionProps {
    setActiveTab: (tab: string) => void
}

export function ActiveProjectsSection({ setActiveTab }: ActiveProjectsSectionProps) {
    const [projects, setProjects] = useState<ApiProject[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/projects")
                const data = await res.json()
                if (Array.isArray(data)) {
                    setProjects(data)
                } else {
                    console.error("Unexpected response:", data)
                    setProjects([])
                }
            } catch (err) {
                console.error("Failed to fetch projects:", err)
                setProjects([])
            } finally {
                setIsLoading(false)
            }
        }

        load()
    }, [])

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
            {/* Banner stays unchanged */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Active Projects</h2>
                    <p className="text-sm text-muted-foreground">
                        {projects.length} projects • {projects.filter((p) => p.status === "ONGOING").length} active
                    </p>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-muted group" onClick={() => setActiveTab("projects")}>
                    View All
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-5">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-muted rounded-xl animate-pulse" />
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                                            <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                                        </div>
                                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-3 w-full bg-muted rounded animate-pulse" />
                                            <div className="flex gap-4">
                                                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                                                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                                                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
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
                                    onClick={() => setActiveTab("projects")}
                                    className="cursor-pointer"
                                >
                                    <Card className="hover:shadow-lg hover:shadow-[var(--application-shadow-light)] transition-all duration-300 group border-l-4 border-l-[var(--experience-accent)]">
                                        <CardContent className="p-4">
                                            <div className="space-y-4">
                                                {/* Header Section */}
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-12 w-12 ring-2 ring-[var(--experience-accent)]/20">
                                                        <AvatarFallback className="bg-gradient-to-br from-[var(--experience-accent)] to-[var(--experience-accent)]/80 text-white font-semibold">
                                                            {proj.internship.company?.name?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <h4 className="font-semibold text-base group-hover:text-[var(--experience-accent)] transition-colors leading-tight">
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

                                                        {/* Student Info */}
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                                            <User className="h-4 w-4" />
                                                            <span>{proj.student?.name || "Unknown Student"}</span>
                                                            <span className="text-muted-foreground/60">•</span>
                                                            <Calendar className="h-4 w-4" />
                                                            <span>Started {details.formattedStartDate}</span>
                                                        </div>

                                                        {/* Progress Section */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Target className="h-4 w-4 text-[var(--experience-accent)]" />
                                                                    <span className="text-sm font-medium">Progress</span>
                                                                </div>
                                                                {details.totalDays ? (
                                                                    <span className="text-sm font-semibold text-[var(--experience-accent)]">
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
                                                                            <span className="text-[var(--application-approved)] font-medium">
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
        </section>
    )
}
