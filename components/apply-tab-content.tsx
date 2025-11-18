"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Application, Portfolio } from "@/app/types"
import { Building2, User, Calendar, CheckCircle, XCircle, Clock, Eye, ExternalLink, Github, Linkedin, GraduationCap, Briefcase, Award, Star, Sparkles, TrendingUp, RefreshCw, Search, Layers, FileText, AlertCircle } from 'lucide-react'

interface ApplicationsTabContentProps {
  userType: "Student" | "Company"
}

export function ApplicationsTabContent({ userType }: ApplicationsTabContentProps) {

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [showCompany, setShowCompany] = useState<{
    company: {
      id: string
      name: string
      description?: string
      location?: string
      website?: string
      email?: string
    } | null
    internship: {
      id: string
      title: string
    } | null
  } | null>(null)


  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "recent">("all")

  const loadApplications = useCallback(async () => {
    setLoading(true)
    const url = userType === "Student" ? "/api/applications/me" : "/api/applications/company"

    const res = await fetch(url)
    if (res.ok) {
      const data: Application[] = await res.json()
      setApplications(data)
    }
    setLoading(false)
  }, [userType])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  async function handleRefresh() {
    setRefreshing(true)
    await loadApplications()
    setRefreshing(false)
  }

  async function updateApplication(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)))
    }
  }

  async function viewPortfolio(studentId: string) {
    const res = await fetch(`/api/portfolio/${studentId}`)
    if (res.ok) {
      const data: Portfolio = await res.json()
      setPortfolio(data)
      setShowPortfolio(true)
    }
  }

  if (loading) {
    return (
        <div className="space-y-8">
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--application-header-gradient-from)] to-[var(--application-header-gradient-to)] rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-8 bg-white/20 animate-pulse rounded-lg w-64 backdrop-blur-sm"></div>
                  <div className="h-4 bg-white/15 animate-pulse rounded-lg w-96 backdrop-blur-sm"></div>
                </div>
                <div className="h-6 bg-white/20 animate-pulse rounded-lg w-32 backdrop-blur-sm"></div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative overflow-hidden bg-gradient-to-br from-[var(--application-card-gradient-from)] to-[var(--application-card-gradient-to)] rounded-2xl p-6 shadow-[0_8px_30px_var(--application-shadow-light)] border border-border/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse"></div>
                  <div className="space-y-4">
                    <div className="h-5 bg-muted/30 animate-pulse rounded-lg w-3/4"></div>
                    <div className="h-4 bg-muted/20 animate-pulse rounded-lg w-1/2"></div>
                    <div className="h-8 bg-muted/25 animate-pulse rounded-full w-20"></div>
                  </div>
                </motion.div>
            ))}
          </div>
        </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          icon: CheckCircle,
          className:
              "bg-green-600 text-[var(--application-approved-foreground)] shadow-lg shadow-[var(--application-approved)]/25",
          label: "Approved",
          gradient: "from-green-500/20 to-emerald-500/20",
        }
      case "REJECTED":
        return {
          icon: XCircle,
          className:
              "bg-red-600 text-[var(--application-rejected-foreground)] shadow-lg shadow-[var(--application-rejected)]/25",
          label: "Rejected",
          gradient: "from-red-500/20 to-rose-500/20",
        }
      default:
        return {
          icon: Clock,
          className:
              "bg-[var(--application-pending)] text-[var(--application-pending-foreground)] shadow-lg shadow-[var(--application-pending)]/25",
          label: "Pending",
          gradient: "from-amber-500/20 to-orange-500/20",
        }
    }
  }

  // Helpers to safely render fields that may be string | object[]
  const renderField = (field: unknown) => {
    if (!field) return "—"

    if (typeof field === "string") return field
    if (Array.isArray(field)) {
      return (
          <ul className="list-disc pl-5 space-y-1">
            {field.map((item, idx) => {
              if (typeof item === "string") return <li key={idx}>{item}</li>
              if (typeof item === "object" && item !== null) {
                // Example: education objects
                interface EducationRecord {
                  degree?: string
                  school?: string
                  startYear?: string | number
                  endYear?: string | number
                }
                const obj = item as EducationRecord
                return (
                    <li key={idx}>
                      {obj.degree && <span className="font-medium">{obj.degree}</span>} {obj.school && `at ${obj.school}`}{" "}
                      {obj.startYear && obj.endYear && `(${obj.startYear}–${obj.endYear})`}
                    </li>
                )
              }
              return <li key={idx}>{String(item)}</li>
            })}
          </ul>
      )
    }

    if (typeof field === "object") {
      return <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(field, null, 2)}</pre>
    }

    return String(field)
  }

  const filteredApplications = applications.filter((application) => {
    const searchLower = searchQuery.toLowerCase()
    const internshipTitle = application.internship?.title?.toLowerCase() || ""
    const companyName = application.internship?.company?.name?.toLowerCase() || ""
    const studentName = application.student?.profile?.name?.toLowerCase() || ""
    const studentEmail = application.student?.email?.toLowerCase() || ""
    const status = application.status.toLowerCase()

    return (
        internshipTitle.includes(searchLower) ||
        companyName.includes(searchLower) ||
        studentName.includes(searchLower) ||
        studentEmail.includes(searchLower) ||
        status.includes(searchLower)
    )
  })

  const now = Date.now()
  const finalApplications =
      filter === "recent"
          ? filteredApplications.filter((app) => {
            const createdAt = new Date(app.createdAt || Date.now()).getTime()
            const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24)
            return diffDays <= 5
          })
          : filteredApplications

  return (
      <div className="space-y-8">

        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--application-header-gradient-from)] to-[var(--application-header-gradient-to)] rounded-2xl p-8 shadow-[0_20px_50px_var(--application-shadow-medium)]">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-3xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {userType === "Student" ? "My Applications" : "Received Applications"}
                  </h1>
                </div>
                <p className="text-white/80 font-medium">
                  {userType === "Student"
                      ? "Track your internship applications and their status"
                      : "Review and manage incoming applications"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">{applications.length}</div>
                <div className="text-white/70 text-sm font-medium">
                  {applications.length === 1 ? "Application" : "Applications"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button
              variant={filter === "all" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setFilter("all")}
          >
            <Layers className="mr-2 h-4 w-4" />
            All Applications
          </Button>

          <Button
              variant={filter === "recent" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setFilter("recent")}
          >
            <Clock className="mr-2 h-4 w-4" />
            Recent
          </Button>

          <div className="flex-1"></div>
          <div className="relative w-full md:w-auto mt-3 md:mt-0">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search applications..."
                className="w-full rounded-2xl pl-9 md:w-[250px] border-2 focus:border-primary transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="rounded-2xl"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {finalApplications.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-lg">
                  <Briefcase className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 bg-primary/20 rounded-full p-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {searchQuery
                    ? "No applications match your search"
                    : userType === "Student"
                        ? "No applications yet"
                        : "No applications received"}
              </h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {searchQuery ? (
                    <>
                      Try adjusting your search terms or{" "}
                      <button onClick={() => setSearchQuery("")} className="text-primary underline">
                        clear search
                      </button>
                    </>
                ) : userType === "Student" ? (
                    "Start applying to internships to see them here"
                ) : (
                    "Applications will appear here when students apply"
                )}
              </p>
            </motion.div>
        ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  {searchQuery
                      ? `Search Results (${finalApplications.length})`
                      : `${filter === "recent" ? "Recent " : ""}Applications (${finalApplications.length})`}
                </h2>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {finalApplications.map((app, index) => {
                    const statusConfig = getStatusConfig(app.status)
                    const StatusIcon = statusConfig.icon

                    return (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{
                              delay: index * 0.1,
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                            whileHover={{
                              y: -8,
                              scale: 1.02,
                              transition: { duration: 0.2, type: "spring", stiffness: 400 },
                            }}
                            className="group relative overflow-hidden bg-gradient-to-br from-[var(--application-card-gradient-from)] to-[var(--application-card-gradient-to)] rounded-2xl p-6 shadow-[0_8px_30px_var(--application-shadow-light)] hover:shadow-[0_20px_50px_var(--application-shadow-medium)] border border-border/50 transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex-1 space-y-2">
                                <h3 className="font-bold text-card-foreground text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                                  {app.internship?.title || "Untitled Position"}
                                </h3>
                                <div className="flex items-center text-muted-foreground text-sm">
                                  {userType === "Student" ? (
                                      <>
                                        <div className="p-1.5 bg-primary/10 rounded-lg mr-2">
                                          <Building2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium">
                                  {app.internship?.company?.name || "Unknown Company"}
                                </span>
                                      </>
                                  ) : (
                                      <>
                                        <div className="p-1.5 bg-primary/10 rounded-lg mr-2">
                                          <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium">
                                  {app.student?.profile?.name || app.student?.email || "Unknown Student"}
                                </span>
                                      </>
                                  )}
                                </div>
                              </div>
                              <div
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${statusConfig.className} backdrop-blur-sm`}
                              >
                                <StatusIcon className="w-4 h-4" />
                                {statusConfig.label}
                              </div>
                            </div>

                            <div className="flex items-center text-muted-foreground text-sm mb-6">
                              <div className="p-1.5 bg-muted/20 rounded-lg mr-2">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <span className="font-medium">
                          Applied {new Date(app.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                            </div>

                            <div className="space-y-3">
                              {userType === "Company" && (
                                  <>
                                    {app.status === "PENDING" && (
                                        <div className="space-y-3">
                                          {/* Warning message moved above buttons */}
                                          {!app.hasUploadedFiles && (
                                              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                                  Student must upload an assignment before you can review this application.
                                                </p>
                                              </div>
                                          )}

                                          {/* Action buttons in a single row */}
                                          <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                size="sm"
                                                disabled={!app.hasUploadedFiles}
                                                onClick={() => updateApplication(app.id, "APPROVED")}
                                                className={`font-semibold transition-all duration-200 ${
                                                    app.hasUploadedFiles
                                                        ? "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                                }`}
                                            >
                                              <CheckCircle className="w-4 h-4 mr-1.5" />
                                              Approve
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={!app.hasUploadedFiles}
                                                onClick={() => updateApplication(app.id, "REJECTED")}
                                                className={`font-semibold transition-all duration-200 ${
                                                    app.hasUploadedFiles
                                                        ? "border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                                        : "border-muted text-muted-foreground cursor-not-allowed"
                                                }`}
                                            >
                                              <XCircle className="w-4 h-4 mr-1.5" />
                                              Reject
                                            </Button>
                                          </div>
                                        </div>
                                    )}

                                    {/* View Portfolio button always visible for companies */}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => viewPortfolio(app.studentId)}
                                        className="w-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Student Portfolio
                                    </Button>
                                  </>
                              )}

                              {userType === "Student" && (
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                      onClick={() =>
                                          setShowCompany({
                                            company: app.internship?.company || null,
                                            internship: app.internship || null,
                                          })
                                      }
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Company Details
                                  </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
        )}


        <AnimatePresence>
          {showPortfolio && portfolio && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                  onClick={() => setShowPortfolio(false)}
              >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-background rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-border/20"
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gradient-to-r from-[var(--application-modal-gradient-from)] to-[var(--application-modal-gradient-to)] p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                          {portfolio.fullName?.charAt(0) ?? "?"}
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-3xl font-bold tracking-tight text-white">{portfolio.fullName}</h2>
                          {portfolio.headline && <p className="text-white/80 text-lg font-medium">{portfolio.headline}</p>}
                        </div>
                      </div>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPortfolio(false)}
                          className="rounded-full h-12 w-12 hover:bg-white/20 text-white hover:text-white transition-all duration-200"
                      >
                        <XCircle className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] bg-gradient-to-br from-background to-muted/20">
                    <div className="grid gap-8 md:grid-cols-2">
                      {/* Personal Info */}
                      <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            Personal Information
                          </h3>
                          <div className="space-y-3 text-sm">
                            {portfolio.age && (
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-3 text-muted-foreground" />
                                  <span className="font-medium">Age: {portfolio.age}</span>
                                </div>
                            )}
                            <div className="text-muted-foreground leading-relaxed">
                              {portfolio.bio || "No bio provided"}
                            </div>
                          </div>
                        </motion.div>

                        {/* Skills */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <Star className="w-5 h-5 text-primary" />
                            </div>
                            Skills
                          </h3>
                          {renderField(portfolio.skills)}
                        </motion.div>

                        {/* Links */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <ExternalLink className="w-5 h-5 text-primary" />
                            </div>
                            Links
                          </h3>
                          <div className="flex gap-3">
                            {portfolio.linkedin && (
                                <Button size="sm" variant="outline" asChild className="font-semibold bg-transparent">
                                  <a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="w-4 h-4 mr-2" />
                                    LinkedIn
                                  </a>
                                </Button>
                            )}
                            {portfolio.github && (
                                <Button size="sm" variant="outline" asChild className="font-semibold bg-transparent">
                                  <a href={portfolio.github} target="_blank" rel="noopener noreferrer">
                                    <Github className="w-4 h-4 mr-2" />
                                    GitHub
                                  </a>
                                </Button>
                            )}
                          </div>
                        </motion.div>
                      </div>

                      {/* Education & Experience */}
                      <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            Education
                          </h3>
                          {renderField(portfolio.education)}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <Briefcase className="w-5 h-5 text-primary" />
                            </div>
                            Projects
                          </h3>
                          {renderField(portfolio.projects)}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <Award className="w-5 h-5 text-primary" />
                            </div>
                            Certifications
                          </h3>
                          {renderField(portfolio.certifications)}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCompany && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                  onClick={() => setShowCompany(null)}
              >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-background rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border/20"
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gradient-to-r from-[var(--application-modal-gradient-from)] to-[var(--application-modal-gradient-to)] p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                          {showCompany.company?.name?.charAt(0) ?? "C"}
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-3xl font-bold tracking-tight text-white">{showCompany.company?.name}</h2>
                          {showCompany.company?.description && (
                              <p className="text-white/80 text-lg font-medium line-clamp-2">{showCompany.company?.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowCompany(null)}
                          className="rounded-full h-12 w-12 hover:bg-white/20 text-white hover:text-white transition-all duration-200"
                      >
                        <XCircle className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] bg-gradient-to-br from-background to-muted/20">
                    <div className="grid gap-8 md:grid-cols-2">
                      {/* Company Information */}
                      <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            Company Information
                          </h3>
                          <div className="space-y-4 text-sm">
                            {showCompany.company?.email && (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                                  <span className="font-medium text-muted-foreground">Email:</span>
                                  <span className="ml-2 text-foreground">{showCompany.company?.email}</span>
                                </div>
                            )}
                            {showCompany.company?.location && (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                                  <span className="font-medium text-muted-foreground">Location:</span>
                                  <span className="ml-2 text-foreground">{showCompany.company?.location}</span>
                                </div>
                            )}
                            {showCompany.company?.description && (
                                <div className="mt-4">
                                  <span className="font-medium text-muted-foreground block mb-2">About:</span>
                                  <p className="text-foreground leading-relaxed">{showCompany.company?.description}</p>
                                </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Additional Details */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            Company Details
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="bg-muted/30 rounded-xl p-4">
                              <p className="text-muted-foreground">
                                This company is actively seeking talented interns to join their team. Review the application
                                details and company information to learn more about this opportunity.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Links and Actions */}
                      <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <ExternalLink className="w-5 h-5 text-primary" />
                            </div>
                            Links & Resources
                          </h3>
                          <div className="space-y-3">
                            {showCompany.company?.website ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    className="w-full font-semibold bg-transparent border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground"
                                >
                                  <a
                                      href={showCompany.company?.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Visit Website
                                  </a>
                                </Button>
                            ) : (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                  No website available
                                </div>
                            )}
                          </div>
                        </motion.div>

                        {/* --- Application Status --- */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            Application Status
                          </h3>
                          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4">
                            <p className="text-sm text-foreground font-medium">
                              Your application has been submitted to this company. You&apos;ll be
                              notified of any status updates via email.
                            </p>
                          </div>
                        </motion.div>

                        {/* --- Internship Details + Assignment --- */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50"
                        >
                          <h3 className="font-bold text-card-foreground mb-4 flex items-center text-lg">
                            <div className="p-2 bg-primary/10 rounded-xl mr-3">
                              <Briefcase className="w-5 h-5 text-primary" />
                            </div>
                            Internship Details
                          </h3>

                          {showCompany && (
                              <>
                                {/* Replace with dynamic internship data */}
                                <p className="text-muted-foreground mb-3">
                                  {showCompany.company?.description ||
                                      "No internship description available."}
                                </p>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <div>
                                    <span className="font-medium text-foreground">Location:</span>{" "}
                                    {showCompany.company?.location || "Not specified"}
                                  </div>
                                </div>

                                {/* --- Assignment Link --- */}
                                <div className="mt-4">
                                  <Button
                                      onClick={() =>
                                          window.location.assign(`/assignments/${showCompany.internship?.id}`)
                                      }
                                      className="rounded-xl text-foreground px-4 py-2 text-sm font-semibold flex items-center justify-center w-full"
                                      style={{
                                        background:
                                            "linear-gradient(135deg, var(--internship-modal-gradient-from), var(--internship-modal-gradient-to))",
                                      }}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Assignment Page
                                  </Button>
                                </div>
                              </>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
