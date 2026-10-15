"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { format } from "date-fns"
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
import { useDashboard } from "@/lib/dashboard-context"
import { useTranslation } from "@/lib/i18n"

function formatAppliedDate(value: string | number | Date | undefined | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  // Fixed format (no locale-dependent toLocaleDateString) to avoid hydration mismatches
  return format(d, "dd MMM yyyy")
}

interface RecentApplicationsSectionProps {
  userType: "Student" | "Company"
  setActiveTab?: (tab: string) => void   // 👈 optional callback from parent (legacy)
}

export function RecentApplicationsSection({
                                            userType,
                                            setActiveTab,
                                          }: RecentApplicationsSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  
  // Use centralized context - no more individual fetches
  const { applications: contextApplications, isLoadingApplications } = useDashboard()

  // Sort and take max 3 from context data
  const applications = useMemo(() => {
    return [...contextApplications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3) as Application[]
  }, [contextApplications])

  const isLoading = isLoadingApplications

  const openApplications = () => {
    if (setActiveTab) {
      setActiveTab("files")
    } else if (userType === "Student") {
      router.push("/dashboard/student/internships/applied")
    } else {
      router.push(
          pathname?.startsWith("/dashboard/team-member")
              ? "/dashboard/team-member/applications"
              : "/dashboard/company/applications"
      )
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
      case "APPROVED":
        return {
          icon: CheckCircle,
          className:
              "bg-[var(--experience-success)] text-[var(--experience-approved-foreground)] shadow-lg shadow-[var(--experience-approved)]/25",
          label: t("common.approved"),
        }
      case "rejected":
      case "REJECTED":
        return {
          icon: XCircle,
          className:
              "bg-[var(--experience-error)] text-[var(--experience-rejected-foreground)] shadow-lg shadow-[var(--experience-rejected)]/25",
          label: t("common.rejected"),
        }
      default:
        return {
          icon: Clock,
          className:
              "bg-[var(--experience-warning)] text-[var(--experience-pending-foreground)] shadow-lg shadow-[var(--experience-warning)]/25",
          label: t("common.pending"),
        }
    }
  }

  if (isLoading) {
    return (
        <div
            className="relative overflow-hidden bg-card rounded-2xl p-6 border border-border shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-primary/50" />
              </div>
              <div className="space-y-1">
                <div className="h-5 w-40 bg-muted/40 rounded-md" />
                <div className="h-3 w-28 bg-muted/30 rounded-md" />
              </div>
            </div>
            <div className="h-8 w-12 bg-muted/40 rounded-lg" />
          </div>

          {/* Skeleton cards */}
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className="relative overflow-hidden bg-muted/20 rounded-xl p-4 border border-border/30"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-muted/50 rounded-md" />
                        <div className="h-4 w-1/2 bg-muted/40 rounded-md" />
                      </div>
                      <div className="h-7 w-20 bg-muted/50 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-4 w-28 bg-muted/30 rounded-md" />
                      <div className="h-9 w-24 bg-muted/40 rounded-xl" />
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
    )
  }

  return (
      <div
          className="relative overflow-hidden bg-card rounded-2xl p-6 border border-border shadow-sm"
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
                      ? t("recentApplications.recentApplications")
                      : t("recentApplications.latestApplications")}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {userType === "Student"
                      ? t("recentApplications.yourLatestSubmissions")
                      : t("recentApplications.newestIncoming")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary mb-1">
                {applications.length}
              </div>
              <div className="text-muted-foreground text-xs font-medium">
                {applications.length === 1 ? t("recentApplications.application") : t("recentApplications.applications")}
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {applications.length === 0 ? (
            <div
                className="text-center py-8"
            >
              <div className="relative mb-4">
                <div className="bg-muted/40 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 bg-primary/20 rounded-full p-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium">
                {t("recentApplications.noRecentApplications")}
              </p>
            </div>
        ) : (
            <div className="space-y-3">
                {applications.map((app) => {
                  const statusConfig = getStatusConfig(app.status)
                  const StatusIcon = statusConfig.icon

                  return (
                      <div
                          key={app.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${app.internship?.title ?? t("recentApplications.unknownInternship")} - ${statusConfig.label}`}
                          onClick={openApplications}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              openApplications()
                            }
                          }}
                          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group relative overflow-hidden bg-card rounded-xl p-4 shadow-sm hover:shadow-md border border-border/50 hover:border-primary/20 transition-colors duration-150"
                      >
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="font-bold text-card-foreground text-base line-clamp-1 group-hover:text-primary transition-colors duration-150">
                                  {app.internship?.title ?? t("recentApplications.unknownInternship")}
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
                                    t("recentApplications.unknownCompany")}
                              </span>
                                    </>
                                ) : (
                                    <>
                                      <div className="p-1 bg-muted/20 rounded-md">
                                        <User className="w-3 h-3 text-muted-foreground" />
                                      </div>
                                      <span className="font-medium text-muted-foreground">
                                {app.student?.profile?.name ||
                                    app.student?.name ||
                                    app.student?.email ||
                                    t("recentApplications.unknownStudent")}
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
                          {t("recentApplications.appliedOn")}{" "}
                                {formatAppliedDate(app.createdAt)}
                        </span>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                  )
                })}
            </div>
        )}
      </div>
  )
}
