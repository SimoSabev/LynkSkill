"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Search,
  Users,
  FileText,
  Clock,
  Layers,
  Building2,
  Calendar,
  TrendingUp,
  Eye,
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { useTranslation } from "@/lib/i18n"

/* ----------------------------------------------------
   TYPES
---------------------------------------------------- */
type ApiProject = {
  id: string
  title: string
  createdAt: string
  status: "ONGOING" | "COMPLETED" | "PENDING"

  internship: {
    id: string
    title: string
    company: { name: string }
    startDate: string | null
    endDate: string | null
  }

  student: { name: string; email: string }

  assignment: {
    title: string
    description: string
    dueDate: string
  } | null
}

/* ----------------------------------------------------
   UTILS (SAFE)
---------------------------------------------------- */
function safeDate(input: string | null): Date | null {
  if (!input) return null
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

function computeProgress(start: string | null, end: string | null): number {
  const s = safeDate(start)
  const e = safeDate(end)

  if (!s || !e) return 0
  const now = Date.now()
  const pct = ((now - s.getTime()) / (e.getTime() - s.getTime())) * 100
  return Math.max(0, Math.min(100, pct))
}

/* ----------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------- */
export function AssignmentsTabContent() {
  const { t } = useTranslation()
  const router = useRouter()

  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ApiProject | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "recent">("all")
  const [navigating, setNavigating] = useState<string | null>(null)

  /* ----------------------------------------------------
     LOAD FUNCTION (VERY FAST & STABLE)
  ---------------------------------------------------- */
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const minDelay = new Promise(res => setTimeout(res, 200))

    try {
      const res = await fetch("/api/projects", { cache: "no-store" })
      const data = await res.json()

      if (!Array.isArray(data)) {
        setError(t("assignments.invalidApiResponse"))
        setProjects([])
      } else {
        setProjects(data)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("assignments.failedToLoad")
      )
    }

    await minDelay
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  /* ----------------------------------------------------
     MEMOIZED FILTERING
  ---------------------------------------------------- */
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase()

    const base = projects.filter(p =>
      [
        p.internship.title.toLowerCase(),
        p.internship.company.name.toLowerCase(),
        p.student.name.toLowerCase()
      ].some(x => x.includes(q))
    )

    if (filter === "recent") {
      const now = Date.now()
      return base.filter(p => {
        const created = safeDate(p.createdAt)
        if (!created) return false
        const diffDays = (now - created.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= 5
      })
    }

    return base
  }, [projects, searchQuery, filter])

  /* ----------------------------------------------------
     RENDER
  ---------------------------------------------------- */
  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-3xl animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )

  if (error)
    return (
      <div className="text-center py-12">
        <div className="text-destructive text-lg font-medium">Error: {error}</div>
        <Button onClick={handleRefresh} className="mt-4 rounded-2xl">
          {t('common.tryAgain')}
        </Button>
      </div>
    )

  if (filteredProjects.length === 0)
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">{t('assignments.noMatching')}</div>
      </div>
    )

  /* ----------------------------------------------------
     MAIN VIEW
  ---------------------------------------------------- */
  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          className="rounded-2xl"
          onClick={() => setFilter("all")}
        >
          <Layers className="mr-2 h-4 w-4" />
          {t('assignments.allAssignments')}
        </Button>

        <Button
          variant={filter === "recent" ? "default" : "outline"}
          className="rounded-2xl"
          onClick={() => setFilter("recent")}
        >
          <Clock className="mr-2 h-4 w-4" />
          {t('common.recent')}
        </Button>

        <div className="flex-1" />

        <div className="relative w-full md:w-auto mt-3 md:mt-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search') + '...'}
            className="w-full rounded-2xl pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-2xl"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Pending Assignments Banner */}
      {(() => {
        const pendingCount = filteredProjects.filter(p => {
          if (!p.assignment) return false
          const due = safeDate(p.assignment.dueDate)
          return due && due.getTime() > Date.now() && p.status !== "COMPLETED"
        }).length
        const overdueCount = filteredProjects.filter(p => {
          if (!p.assignment) return false
          const due = safeDate(p.assignment.dueDate)
          return due && due.getTime() <= Date.now() && p.status !== "COMPLETED"
        }).length

        if (pendingCount === 0 && overdueCount === 0) return null

        return (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-purple-500/10 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/15">
                <AlertTriangle className="h-5 w-5 text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {t('assignments.pendingTasksBanner') || "You have tasks that require your attention"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendingCount > 0 && (
                    <span className="text-violet-600 dark:text-violet-400 font-medium">
                      {pendingCount} {t('assignments.pending') || 'pending'}
                    </span>
                  )}
                  {pendingCount > 0 && overdueCount > 0 && " · "}
                  {overdueCount > 0 && (
                    <span className="text-red-500 font-medium">
                      {overdueCount} {t('assignments.overdue') || 'overdue'}
                    </span>
                  )}
                  {" — "}{t('assignments.completeToGetApproved') || "Complete these to get approved for your applications"}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })()}

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map(proj => {
          const progress = computeProgress(
            proj.internship.startDate,
            proj.internship.endDate
          )

          // Assignment urgency
          const hasDue = proj.assignment && proj.assignment.dueDate
          const dueDate = hasDue ? safeDate(proj.assignment!.dueDate) : null
          const isOverdue = dueDate ? dueDate.getTime() <= Date.now() && proj.status !== "COMPLETED" : false
          const isUrgent = dueDate && !isOverdue
            ? (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 3 && proj.status !== "COMPLETED"
            : false

          return (
            <motion.div
              key={proj.id}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card
                className={`group rounded-3xl cursor-pointer border-2 relative overflow-hidden transition-colors ${
                  isOverdue
                    ? "border-red-500/40 bg-red-500/[0.02]"
                    : isUrgent
                      ? "border-amber-500/40 bg-amber-500/[0.02]"
                      : ""
                }`}
                onClick={() => {
                  setNavigating(proj.id)
                  setTimeout(
                    () => router.push(`/assignments/${proj.internship.id}`),
                    300
                  )
                }}
              >
                {/* Quick View */}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setSelected(proj)
                  }}
                  className="absolute right-2 bottom-2 z-20 p-2 rounded-xl bg-background/70 border"
                  title={t("assignments.quickView")}
                >
                  <Eye className="w-4 h-4" />
                </button>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg">
                      {proj.internship.title}
                    </CardTitle>

                    <Badge
                      variant={
                        proj.status === "ONGOING" ? "secondary" : "default"
                      }
                      className="rounded-xl shrink-0"
                    >
                      {proj.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 relative z-10">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 mr-1.5 shrink-0" />
                    <span className="truncate">{proj.internship.company?.name ?? "Unknown"}</span>
                  </div>

                  {/* Assignment task notice */}
                  {proj.assignment && proj.status !== "COMPLETED" && (
                    <div className={`rounded-xl p-3 border ${
                      isOverdue
                        ? "bg-red-500/10 border-red-500/30"
                        : isUrgent
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-violet-500/10 border-violet-500/30"
                    }`}>
                      <div className="flex items-start gap-2">
                        {isOverdue ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${isOverdue ? "text-red-600 dark:text-red-400" : isUrgent ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"}`}>
                            {isOverdue
                              ? (t('assignments.taskOverdue') || "Task overdue!")
                              : (t('assignments.taskRequired') || "Task required for approval")}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {proj.assignment.title}
                          </p>
                          {dueDate && (
                            <p className={`text-[10px] mt-1 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {t('assignments.due') || "Due"}: {dueDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 ${isOverdue ? "text-red-400" : "text-violet-400"}`} />
                      </div>
                    </div>
                  )}

                  {proj.status === "COMPLETED" && proj.assignment && (
                    <div className="rounded-xl p-3 border bg-emerald-500/10 border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {t('assignments.taskCompleted') || "Task completed"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      <span>
                        {proj.internship.startDate
                          ? safeDate(proj.internship.startDate)!.toLocaleDateString()
                          : "N/A"}
                        {" — "}
                        {proj.internship.endDate
                          ? safeDate(proj.internship.endDate)!.toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-background/30">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-violet-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Navigation shimmer */}
                {navigating === proj.id && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-md flex items-center justify-center rounded-3xl z-50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('assignments.redirecting')}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ----------------------------------------------------
         MODAL
      ---------------------------------------------------- */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="rounded-3xl max-w-2xl border-2 bg-background">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/70 to-primary/40">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {t('assignments.assignmentDetails')}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {t('assignments.completeProjectInfo')}
                </p>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="space-y-6 relative z-10">
              {/* Internship info */}
              <div className="p-6 rounded-2xl border bg-accent/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1 uppercase">
                      {t('assignments.internshipPosition')}
                    </div>
                    <h3 className="text-xl font-bold mb-1">
                      {selected.internship.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selected.internship.company.name}</span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      selected.status === "ONGOING" ? "secondary" : "default"
                    }
                    className="rounded-xl px-3 py-1 text-sm"
                  >
                    {selected.status}
                  </Badge>
                </div>
              </div>

              {/* STUDENT + DATES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-accent/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('assignments.student')}
                    </div>
                  </div>
                  <div className="font-semibold text-lg">
                    {selected.student.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selected.student.email}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-accent/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('assignments.duration')}
                    </div>
                  </div>

                  <div className="font-semibold text-sm">
                    {selected.internship.startDate
                      ? safeDate(selected.internship.startDate)!.toLocaleDateString()
                      : "N/A"}
                  </div>

                  <div className="text-xs text-muted-foreground my-1">{t('assignments.to')}</div>

                  <div className="font-semibold text-sm">
                    {selected.internship.endDate
                      ? safeDate(selected.internship.endDate)!.toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-accent/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <div className="text-xs">{t('assignments.startedOn')}</div>
                  </div>

                  <div className="font-semibold">
                    {safeDate(selected.createdAt)!.toLocaleDateString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-accent/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <div className="text-xs">{t('assignments.progress')}</div>
                  </div>

                  <div className="font-semibold text-2xl">
                    {Math.round(
                      computeProgress(
                        selected.internship.startDate,
                        selected.internship.endDate
                      )
                    )}
                    %
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setSelected(null)}
              className="rounded-2xl px-6"
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
