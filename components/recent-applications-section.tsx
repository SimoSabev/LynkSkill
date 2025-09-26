"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Building2,
  User,
  Sparkles,
} from "lucide-react"
import type { Application } from "@/app/types"

interface RecentApplicationsSectionProps {
  userType: "Student" | "Company"
  setActiveTab: (tab: string) => void   // 👈 callback from parent
}

export function RecentApplicationsSection({
                                            userType,
                                            setActiveTab,
                                          }: RecentApplicationsSectionProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch(
            userType === "Student"
                ? "/api/applications/me"
                : "/api/applications/company"
        )
        if (!res.ok) throw new Error("Failed to load apps")
        const data = await res.json()

        // sort by date (newest first) and take max 3
        const sorted = data
            .sort(
                (a: Application, b: Application) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 3)

        setApplications(sorted)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApps()
  }, [userType])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
      case "APPROVED":
        return {
          icon: CheckCircle,
          className:
              "bg-[var(--experience-success)] text-[var(--experience-approved-foreground)] shadow-lg shadow-[var(--experience-approved)]/25",
          label: "Approved",
        }
      case "rejected":
      case "REJECTED":
        return {
          icon: XCircle,
          className:
              "bg-[var(--experience-error)] text-[var(--experience-rejected-foreground)] shadow-lg shadow-[var(--experience-rejected)]/25",
          label: "Rejected",
        }
      default:
        return {
          icon: Clock,
          className:
              "bg-[var(--experience-warning)] text-[var(--experience-pending-foreground)] shadow-lg shadow-[var(--experience-warning)]/25",
          label: "Pending",
        }
    }
  }

  if (isLoading) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden bg-gradient-to-br from-[var(--application-card-gradient-from)] to-[var(--application-card-gradient-to)] rounded-2xl p-6 shadow-[0_8px_30px_var(--application-shadow-light)] border border-border/50"
        >
          {/* Skeleton header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-card-foreground">
                {userType === "Student"
                    ? "Recent Applications"
                    : "Latest Applications"}
              </h2>
            </div>
            <div className="h-6 bg-muted/30 animate-pulse rounded-lg w-16"></div>
          </div>

          {/* Skeleton cards */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative overflow-hidden bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl p-4 border border-border/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-5 bg-muted/30 animate-pulse rounded-lg w-3/4"></div>
                    <div className="h-4 bg-muted/20 animate-pulse rounded-lg w-1/2"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-muted/25 animate-pulse rounded-full w-20"></div>
                      <div className="h-4 bg-muted/20 animate-pulse rounded-lg w-24"></div>
                    </div>
                  </div>
                </motion.div>
            ))}
          </div>
        </motion.div>
    )
  }

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden bg-gradient-to-br from-[var(--application-card-gradient-from)] to-[var(--application-card-gradient-to)] rounded-2xl p-6 shadow-[0_8px_30px_var(--application-shadow-light)] hover:shadow-[0_20px_50px_var(--application-shadow-medium)] transition-all duration-300"
      >
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-xl"></div>
          <div className="relative p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">
                  {userType === "Student"
                      ? "Recent Applications"
                      : "Latest Applications"}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {userType === "Student"
                      ? "Your latest submissions"
                      : "Newest incoming applications"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary mb-1">
                {applications.length}
              </div>
              <div className="text-muted-foreground text-xs font-medium">
                {applications.length === 1 ? "Application" : "Applications"}
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {applications.length === 0 ? (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
            >
              <div className="relative mb-4">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-lg">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 bg-primary/20 rounded-full p-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium">
                No recent applications
              </p>
            </motion.div>
        ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {applications.map((app, index) => {
                  const statusConfig = getStatusConfig(app.status)
                  const StatusIcon = statusConfig.icon

                  return (
                      <motion.div
                          key={app.id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.98 }}
                          transition={{
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          whileHover={{
                            y: -2,
                            scale: 1.01,
                            transition: {
                              duration: 0.2,
                              type: "spring",
                              stiffness: 400,
                            },
                          }}
                          onClick={() => setActiveTab("files")} // 👈 switch tab on click
                          className="cursor-pointer group relative overflow-hidden bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-xl p-4 shadow-[0_4px_20px_var(--application-shadow-light)] hover:shadow-[0_8px_30px_var(--application-shadow-medium)] border border-border/30 hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="font-bold text-card-foreground text-base line-clamp-1 group-hover:text-primary transition-colors duration-200">
                                  {app.internship?.title ?? "Unknown Internship"}
                                </h3>
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                {userType === "Student" ? (
                                    <>
                                      <div className="p-1 bg-muted/20 rounded-md">
                                        <Building2 className="w-3 h-3 text-muted-foreground" />
                                      </div>
                                      <span className="font-medium text-muted-foreground">
                                {app.internship?.company?.name ??
                                    "Unknown Company"}
                              </span>
                                    </>
                                ) : (
                                    <>
                                      <div className="p-1 bg-muted/20 rounded-md">
                                        <User className="w-3 h-3 text-muted-foreground" />
                                      </div>
                                      <span className="font-medium text-muted-foreground">
                                {app.student?.name ??
                                    app.student?.email ??
                                    "Unknown Student"}
                              </span>
                                    </>
                                )}
                              </div>
                            </div>

                            <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.className} backdrop-blur-sm`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className="p-1 bg-muted/20 rounded-md">
                                <Calendar className="w-3 h-3" />
                              </div>
                              <span className="font-medium">
                          Applied{" "}
                                {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
        )}
      </motion.div>
  )
}
