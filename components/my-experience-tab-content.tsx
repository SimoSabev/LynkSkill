"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import {
  Upload,
  Building2,
  FileImage,
  FileVideo,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Download,
  Sparkles,
  Users,
  RefreshCw,
  Search,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Eye,
  DownloadCloud,
  Star,
  TrendingUp,
  Target,
  ThumbsUp,
  MessageSquare,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StudentSummary } from "@/components/student-summary"
import { useTranslation } from "@/lib/i18n"

type Experience = {
  id: string
  status: string
  mediaUrls: string[]
  grade: number | null
  skillsRating: number | null
  impactRating: number | null
  growthRating: number | null
  recommendation: string | null
  endorsementNote: string | null
  createdAt: string
  updatedAt: string
  student?: { id: string; email: string }
  company?: { id: string; name: string; logo: string | null }
}

type Company = { id: string; name: string; logo: string | null }

type Summary = {
  totalExperiences: number
  avgSkillScore: number
  uniqueCompanies: number
  professionalScore: number
  endorsements?: Record<string, number>
  // Legacy fields
  totalPoints: number
  avgGrade: number
  allRound: number
}

type Project = {
  id: string
  title: string
  description?: string
  companyId: string
}

interface ExperienceTabContentProps {
  highlightProjectId?: string | null
}

export default function ExperienceTabContent({ highlightProjectId }: ExperienceTabContentProps = {}) {
  const { t } = useTranslation()
  const { user } = useUser()
  const role = user?.publicMetadata?.role as "STUDENT" | "COMPANY" | undefined
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string>("")
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)
  const [companyId, setCompanyId] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "recent">("all")

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "safe" | "danger">("idle")

  const [viewAllFilesExp, setViewAllFilesExp] = useState<Experience | null>(null)

  const [bulkDownloadExp, setBulkDownloadExp] = useState<Experience | null>(null)
  const [bulkScanProgress, setBulkScanProgress] = useState(0)
  const [bulkScanStatus, setBulkScanStatus] = useState<"idle" | "scanning" | "safe" | "danger">("idle")

  const [fileSizeError, setFileSizeError] = useState<string | null>(null)

  // Endorsement form state
  const [endorsementData, setEndorsementData] = useState<{
    skillsRating: number | null
    impactRating: number | null
    growthRating: number | null
    recommendation: string | null
    endorsementNote: string
  }>({
    skillsRating: null,
    impactRating: null,
    growthRating: null,
    recommendation: null,
    endorsementNote: ""
  })
  
  // approvingExpId is used for tracking approval state in UI
  const [, setApprovingExpId] = useState<string | null>(null)

  const handleDownloadClick = (url: string) => {
    setSelectedFile(url)
    setScanProgress(0)
    setScanStatus("idle")
  }

  const MAX_TOTAL_SIZE = 50 * 1024 * 1024

  const validateFiles = (fileList: FileList) => {
    const totalSize = Array.from(fileList).reduce((sum, file) => sum + file.size, 0)
    if (totalSize > MAX_TOTAL_SIZE) {
      setFileSizeError("Total file size cannot exceed 50 MB. Please remove some files.")
      return false
    }
    return true
  }

  const startScan = () => {
    setScanStatus("scanning")
    let progress = 0
    const interval = setInterval(() => {
      progress += 20
      setScanProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        const safe = Math.random() > 0.1
        setScanStatus(safe ? "safe" : "danger")
      }
    }, 500)
  }

  const confirmDownload = () => {
    if (selectedFile && scanStatus === "safe") {
      window.open(selectedFile, "_blank")
      setSelectedFile(null)
    }
  }

  const startBulkScan = () => {
    setBulkScanStatus("scanning")
    let progress = 0
    const interval = setInterval(() => {
      progress += 15
      setBulkScanProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        const safe = Math.random() > 0.05
        setBulkScanStatus(safe ? "safe" : "danger")
      }
    }, 600)
  }

  const confirmBulkDownload = () => {
    if (bulkDownloadExp && bulkScanStatus === "safe") {
      bulkDownloadExp.mediaUrls.forEach((url, index) => {
        setTimeout(() => {
          window.open(url, "_blank")
        }, index * 300)
      })
      setBulkDownloadExp(null)
      setBulkScanProgress(0)
      setBulkScanStatus("idle")
    }
  }

  const loadExperiences = useCallback(async () => {
    if (!role) return
    setLoading(true)
    try {
      const res = await fetch("/api/experience")
      if (!res.ok) throw new Error("Failed to load experiences")
      const data = await res.json()

      if (Array.isArray(data)) {
        setExperiences(data)
        setSummary(null)
      } else {
        setExperiences(Array.isArray(data.experiences) ? data.experiences : [])
        setSummary(data.summary || null)
      }
    } catch (err) {
      console.error(err)
      setExperiences([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    loadExperiences()
  }, [loadExperiences])

  // Show welcome message when student comes from accepted offer
  useEffect(() => {
    if (highlightProjectId && role === "STUDENT") {
      // Show a toast or welcome message
      const timer = setTimeout(() => {
        // This will help the user understand they're now in their project workspace
        const element = document.getElementById(`project-${highlightProjectId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          element.classList.add("ring-2", "ring-green-500", "ring-offset-2")
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-green-500", "ring-offset-2")
          }, 3000)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [highlightProjectId, role])

  async function handleRefresh() {
    setRefreshing(true)
    await loadExperiences()
    setRefreshing(false)
  }

  useEffect(() => {
    if (role !== "STUDENT") return
    const fetchApprovedCompanies = async () => {
      try {
        const res = await fetch("/api/companies/approved")
        if (!res.ok) throw new Error("Failed to load approved companies")
        const data = await res.json()
        setCompanies(data)
      } catch (err) {
        console.error(err)
        setCompanies([])
      }
    }
    fetchApprovedCompanies()
  }, [role])

  useEffect(() => {
    if (!companyId) {
      setProjects([])
      setProjectId("")
      return
    }

    const fetchApprovedProjects = async () => {
      setProjectsLoading(true)
      setProjectsError(null)
      try {
        const res = await fetch(`/api/projects/approved?companyId=${companyId}`)
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || `Failed to load projects (${res.status})`)
        }
        const data = await res.json()

        if (!Array.isArray(data)) throw new Error("Invalid response format")
        setProjects(data)

        // Reset project selection when company changes
        setProjectId("")
      } catch (err) {
        console.error("Error fetching approved projects:", err)
        setProjectsError(err instanceof Error ? err.message : "Failed to load projects")
        setProjects([])
        setProjectId("")
      } finally {
        setProjectsLoading(false)
      }
    }

    fetchApprovedProjects()
  }, [companyId])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) {
      if (validateFiles(e.dataTransfer.files)) {
        setFiles(e.dataTransfer.files)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (validateFiles(e.target.files)) {
        setFiles(e.target.files)
      } else {
        e.target.value = ""
      }
    }
  }

  const removeFile = (index: number) => {
    if (files) {
      const dt = new DataTransfer()
      Array.from(files).forEach((file, i) => {
        if (i !== index) dt.items.add(file)
      })
      setFiles(dt.files.length > 0 ? dt.files : null)
    }
  }

  const handleUpload = async () => {
    if (!files || !companyId || !projectId) {
      alert("Please select company, project and files")
      return
    }

    setLoading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append("companyId", companyId)
      formData.append("projectId", projectId)
      Array.from(files).forEach((file) => formData.append("files", file))

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const res = await fetch("/api/experience", { method: "POST", body: formData })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const newExp = await res.json()
      setExperiences((prev) => [newExp, ...prev])
      setFiles(null)
      setCompanyId("")
      setProjectId("")
      setUploadProgress(0)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, action: "approve" | "reject", endorsement?: {
    skillsRating?: number | null
    impactRating?: number | null
    growthRating?: number | null
    recommendation?: string | null
    endorsementNote?: string
  }) => {
    try {
      const requestBody = {
        status: action === "approve" ? "approved" : "rejected",
        ...(action === "approve" && endorsement ? {
          skillsRating: endorsement.skillsRating,
          impactRating: endorsement.impactRating,
          growthRating: endorsement.growthRating,
          recommendation: endorsement.recommendation,
          endorsementNote: endorsement.endorsementNote || null,
        } : {}),
      }
      
      console.log("Sending endorsement:", requestBody)
      
      const res = await fetch(`/api/experience/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        console.error("API error:", data)
        alert(data.error || "Action failed")
        return
      }
      
      setExperiences((prev) => prev.map((exp) => (exp.id === data.id ? data : exp)))

      // Reset endorsement form
      setEndorsementData({
        skillsRating: null,
        impactRating: null,
        growthRating: null,
        recommendation: null,
        endorsementNote: ""
      })
      setApprovingExpId(null)
    } catch (err) {
      console.error("Network error:", err)
      alert("Action failed - please check your connection")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-[var(--experience-success)] text-white"
      case "pending":
        return "bg-[var(--experience-warning)] text-white"
      case "rejected":
        return "bg-[var(--experience-error)] text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getFileIcon = (url: string) =>
      url.match(/\.(mp4|mov|avi)$/i) ? <FileVideo className="h-4 w-4" /> : <FileImage className="h-4 w-4" />

  const filteredExperiences = experiences.filter((experience) => {
    const searchLower = searchQuery.toLowerCase()
    const companyName = experience.company?.name?.toLowerCase() || ""
    const studentEmail = experience.student?.email?.toLowerCase() || ""
    const status = experience.status.toLowerCase()

    return companyName.includes(searchLower) || studentEmail.includes(searchLower) || status.includes(searchLower)
  })

  const now = Date.now()
  const finalExperiences =
      filter === "recent"
          ? filteredExperiences.filter((exp) => {
            const createdAt = new Date(exp.createdAt).getTime()
            const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24)
            return diffDays <= 5
          })
          : filteredExperiences

  if (!role) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--experience-accent)]/30 border-t-[var(--experience-accent)]" />
            <span className="text-muted-foreground">{t('common.loading')}</span>
          </div>
        </div>
    )
  }

  return (
      <div className="space-y-8">
        {/* Welcome Banner for newly accepted internship */}
        {highlightProjectId && role === "STUDENT" && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-lg"
          >
            <div className="absolute inset-0 bg-[url('/patterns/confetti.svg')] opacity-10" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">🎉 {t('experience.welcomeInternship')}</h3>
                <p className="text-white/90">
                  {t('experience.welcomeInternshipDesc')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Section */}
        <section>
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--experience-hero-gradient-from)] to-[var(--experience-hero-gradient-to)] p-8 text-white relative"
          >
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">
                  {role === "STUDENT" ? t('experience.title') : t('experience.verifyExperience')}
                </h2>
                <p className="max-w-[600px] text-white/90">
                  {role === "STUDENT"
                      ? t('experience.noExperienceDescription')
                      : t('experience.companyFeedback')}
                </p>
                {summary && role === "STUDENT" && <StudentSummary summary={summary} />}
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-medium">{experiences.length} {t('experience.title')}</span>
                </div>
                {role === "COMPANY" && (
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="text-sm font-medium">
                    {experiences.filter((exp) => exp.status === "pending").length} {t('experience.pending')}
                  </span>
                    </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button
              variant={filter === "all" ? "default" : "outline"}
              className="rounded-2xl text-background"
              onClick={() => setFilter("all")}
          >
            <Layers className="mr-2 h-4 w-4" />
            {t('experience.allExperiences')}
          </Button>

          <Button
              variant={filter === "recent" ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setFilter("recent")}
          >
            <Clock className="mr-2 h-4 w-4" />
            {t('experience.recent')}
          </Button>

          <div className="flex-1"></div>
          <div className="relative w-full md:w-auto mt-3 md:mt-0">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={t('experience.searchPlaceholder')}
                className="w-full rounded-2xl pl-9 md:w-[250px] border-2 focus:border-[var(--experience-accent)] transition-colors"
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
            {refreshing ? t('experience.refreshing') : t('experience.refresh')}
          </Button>
        </div>

        {/* Upload Section - Students Only */}
        {role === "STUDENT" && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--experience-accent)] text-white text-sm font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold">{t('experience.uploadExperience')}</h3>
              </div>

              <Card className="overflow-hidden rounded-3xl border-2 border-[var(--experience-step-border)] bg-[var(--experience-step-background)]">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[var(--experience-accent)]" />
                    {t('experience.selectCompanyProject')}
                  </CardTitle>
                  <CardDescription>
                    {t('experience.selectCompanyProjectDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[var(--experience-accent)]" />
                      {t('experience.companyApprovedOnly')}
                    </label>
                    {companies.length === 0 ? (
                        <div className="p-4 rounded-xl bg-muted/50 border border-[var(--experience-step-border)]">
                          <p className="text-sm text-muted-foreground">
                            {t('experience.noApprovedCompanies')}
                          </p>
                        </div>
                    ) : (
                        <Select
                            value={companyId}
                            onValueChange={(value) => {
                              setCompanyId(value)
                              setProjectId("")
                            }}
                        >
                          <SelectTrigger className="w-full h-auto rounded-2xl border-2 border-[var(--experience-step-border)] bg-background px-5 py-3.5 text-sm font-medium hover:border-[var(--experience-accent)]/50 focus:border-[var(--experience-accent)] focus:ring-4 focus:ring-[var(--experience-accent)]/10 transition-all shadow-sm group">
                            <div className="flex items-center gap-3 w-full">
                              <SelectValue placeholder={t('experience.selectCompanyPlaceholder')} className="text-left flex-1" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-2 border-[var(--experience-step-border)] bg-background shadow-2xl shadow-[var(--experience-accent)]/10">
                            {companies.map((c) => (
                                <SelectItem
                                    key={c.id}
                                    value={c.id}
                                    className="rounded-xl my-1 mx-1 px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 focus:bg-gradient-to-r focus:from-purple-500/10 focus:to-blue-500/10 transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                      <Building2 className="h-3.5 w-3.5 text-purple-500" />
                                    </div>
                                    <span className="font-medium">{c.name}</span>
                                  </div>
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    )}
                  </div>

                  {companyId && (
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4 text-[var(--experience-accent)]" />
                          {t('experience.projectApproved')}
                        </label>
                        {projectsLoading ? (
                            <div className="p-4 rounded-xl bg-muted/50 border border-[var(--experience-step-border)]">
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--experience-accent)]/30 border-t-[var(--experience-accent)]" />
                                <p className="text-sm text-muted-foreground">{t('experience.loadingProjects')}</p>
                              </div>
                            </div>
                        ) : projectsError ? (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-500 font-medium">{projectsError}</p>
                              </div>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="p-4 rounded-xl bg-muted/50 border border-[var(--experience-step-border)]">
                              <p className="text-sm text-muted-foreground">
                                {t('experience.noApprovedProjects')}
                              </p>
                            </div>
                        ) : (
                            <Select value={projectId} onValueChange={(value) => setProjectId(value)}>
                              <SelectTrigger className="w-full h-auto rounded-2xl border-2 border-[var(--experience-step-border)] bg-background px-5 py-3.5 text-sm font-medium hover:border-[var(--experience-accent)]/50 focus:border-[var(--experience-accent)] focus:ring-4 focus:ring-[var(--experience-accent)]/10 transition-all shadow-sm group">
                                <div className="flex items-center gap-3 w-full">
                                  <SelectValue placeholder={t('experience.selectProjectPlaceholder')} className="text-left flex-1" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-2 border-[var(--experience-step-border)] bg-background shadow-2xl shadow-[var(--experience-accent)]/10">
                                {projects.map((p) => (
                                    <SelectItem
                                        key={p.id}
                                        value={p.id}
                                        className="rounded-xl my-1 mx-1 px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 focus:bg-gradient-to-r focus:from-purple-500/10 focus:to-blue-500/10 transition-all"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                          <Layers className="h-3.5 w-3.5 text-purple-500" />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{p.title}</span>
                                          {p.description && (
                                              <span className="text-xs text-muted-foreground line-clamp-1">{p.description}</span>
                                          )}
                                        </div>
                                      </div>
                                    </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        )}
                      </div>
                  )}

                  {/* File Upload Zone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('experience.files')}</label>
                    <div
                        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                            dragActive
                                ? "border-[var(--experience-upload-zone-active)] bg-[var(--experience-upload-zone-active)]/10"
                                : "border-[var(--experience-step-border)] bg-[var(--experience-upload-zone)] hover:bg-[var(--experience-upload-zone-hover)]"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                      <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/*,video/*,.pdf,.doc,.docx"
                      />
                      <div className="space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-[var(--experience-accent)]/10 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('experience.dropFiles')}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('experience.supportedFormats')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Files */}
                  {files && files.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('experience.selectedFiles')} ({files.length})</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {Array.from(files).map((file, index) => (
                              <div
                                  key={index}
                                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-[var(--experience-step-border)]"
                              >
                                <div className="flex items-center gap-3">
                                  {getFileIcon(file.name)}
                                  <div>
                                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                  </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeFile(index)}
                                    className="h-8 w-8 p-0 hover:bg-[var(--experience-error)]/10 hover:text-[var(--experience-error)]"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Upload Progress */}
                  {loading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{t('experience.uploading')}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                  )}

                  {/* Upload Button */}
                  <Button
                      onClick={handleUpload}
                      disabled={loading || !companyId || !projectId || !files}
                      className="w-full rounded-2xl bg-[var(--experience-button-primary)] hover:bg-[var(--experience-button-primary-hover)] text-white py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          {t('experience.uploadingExperience')}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {t('experience.shareExperience')}
                        </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </section>
        )}

        {/* Experiences List */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--experience-accent)] text-white text-sm font-bold">
              {role === "STUDENT" ? "2" : "1"}
            </div>
            <h3 className="text-xl font-semibold">{role === "STUDENT" ? t('experience.yourExperiences') : t('experience.studentSubmissions')}</h3>
          </div>

          {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          ) : finalExperiences.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-[var(--experience-step-border)] p-12 text-center">
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {searchQuery
                          ? t('experience.noSearchMatch')
                          : role === "STUDENT"
                              ? t('experience.noExperiencesYet')
                              : t('experience.noSubmissionsYet')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? (
                          <>
                            {t('experience.tryAdjustingSearch')}{" "}
                            <button onClick={() => setSearchQuery("")} className="text-primary underline">
                              {t('experience.clearSearch')}
                            </button>
                          </>
                      ) : role === "STUDENT" ? (
                          t('experience.uploadFirstExperience')
                      ) : (
                          t('experience.submissionsWillAppear')
                      )}
                    </p>
                  </div>
                </div>
              </Card>
          ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    {searchQuery
                        ? `${t('experience.searchResults')} (${finalExperiences.length})`
                        : `${filter === "recent" ? t('experience.recent') + " " : ""}${t('experience.title')} (${finalExperiences.length})`}
                  </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {finalExperiences.map((exp, index) => (
                      <motion.div
                          key={exp.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          whileTap={{ scale: 0.98 }}
                      >
                        <Card className="overflow-hidden rounded-3xl border border-[var(--experience-card-shadow)] bg-gradient-to-br from-[var(--experience-card-gradient-from)] to-[var(--experience-card-gradient-to)] hover:shadow-[var(--experience-card-shadow-hover)] transition-all duration-300 group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-[var(--experience-accent)]/20">
                                  <AvatarFallback className="bg-[var(--experience-accent)]/10 text-[var(--experience-accent)] font-semibold">
                                    {role === "STUDENT"
                                        ? exp.company?.name?.charAt(0) || "?"
                                        : exp.student?.email?.charAt(0).toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base group-hover:text-[var(--experience-accent)] transition-colors">
                                    {role === "STUDENT"
                                        ? exp.company?.name || t('experience.unknownCompany')
                                        : exp.student?.email || t('experience.unknownStudent')}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : t('experience.recently')}
                                  </CardDescription>
                                </div>
                              </div>
                              <Badge className={`rounded-xl text-xs ${getStatusColor(exp.status)}`}>
                                {exp.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                                {exp.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                {exp.status === "rejected" && <AlertCircle className="h-3 w-3 mr-1" />}
                                {exp.status}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {exp.mediaUrls.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{t('experience.mediaFiles')}</span>
                                    <Badge variant="outline" className="rounded-xl text-xs">
                                      {exp.mediaUrls.length} {exp.mediaUrls.length === 1 ? t('experience.file') : t('experience.filesPlural')}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    {exp.mediaUrls.slice(0, 4).map((url, i) => (
                                        <div key={i} className="relative group/media">
                                          {url.endsWith(".mp4") || url.endsWith(".mov") ? (
                                              <div className="aspect-square rounded-xl bg-gradient-to-br from-[var(--experience-accent)]/20 to-[var(--experience-accent)]/10 flex items-center justify-center border border-[var(--experience-step-border)]">
                                                <FileVideo className="h-6 w-6 text-[var(--experience-accent)]" />
                                              </div>
                                          ) : (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                  src={url || "/placeholder.svg"}
                                                  alt={`Experience ${i + 1}`}
                                                  className="aspect-square w-full object-cover rounded-xl border border-[var(--experience-step-border)]"
                                              />
                                          )}
                                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/media:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                                onClick={() => handleDownloadClick(url)}
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                    ))}
                                  </div>

                                  <div className="flex gap-2">
                                    {exp.mediaUrls.length > 4 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 rounded-xl text-xs bg-transparent"
                                            onClick={() => setViewAllFilesExp(exp)}
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          {t('experience.viewAll')} ({exp.mediaUrls.length})
                                        </Button>
                                    )}
                                    {exp.mediaUrls.length > 1 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={`${exp.mediaUrls.length > 4 ? "flex-1" : "w-full"} rounded-xl text-xs`}
                                            onClick={() => {
                                              setBulkDownloadExp(exp)
                                              setBulkScanProgress(0)
                                              setBulkScanStatus("idle")
                                            }}
                                        >
                                          <DownloadCloud className="h-3 w-3 mr-1" />
                                          {t('experience.downloadAll')}
                                        </Button>
                                    )}
                                  </div>
                                </div>
                            )}
                            {/* Company Actions */}
                            {role === "COMPANY" && exp.status === "pending" && (
                                <div className="pt-2">
                                  <Dialog
                                      onOpenChange={(open) => {
                                        if (open) {
                                          setApprovingExpId(exp.id)
                                          setEndorsementData({
                                            skillsRating: null,
                                            impactRating: null,
                                            growthRating: null,
                                            recommendation: null,
                                            endorsementNote: ""
                                          })
                                        } else {
                                          setApprovingExpId(null)
                                          setEndorsementData({
                                            skillsRating: null,
                                            impactRating: null,
                                            growthRating: null,
                                            recommendation: null,
                                            endorsementNote: ""
                                          })
                                        }
                                      }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                          size="sm"
                                          className="w-full bg-[var(--experience-success)] hover:bg-[var(--experience-success)]/90 text-white rounded-2xl"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        {t('experience.endorseApprove')}
                                      </Button>
                                    </DialogTrigger>

                                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-[var(--experience-step-border)] bg-gradient-to-br from-[var(--experience-card-gradient-from)] to-[var(--experience-card-gradient-to)]">
                                      <DialogHeader className="space-y-3">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[var(--experience-hero-gradient-from)] to-[var(--experience-hero-gradient-to)] flex items-center justify-center">
                                          <ThumbsUp className="h-8 w-8 text-white" />
                                        </div>
                                        <DialogTitle className="text-2xl text-center">{t('experience.professionalEndorsement')}</DialogTitle>
                                        <p className="text-sm text-muted-foreground text-center">
                                          {t('experience.evaluateStudent')}
                                        </p>
                                      </DialogHeader>

                                      <div className="space-y-6 py-4">
                                        {/* Skills Rating */}
                                        <div className="space-y-3">
                                          <label className="text-sm font-semibold flex items-center gap-2">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            {t('experience.technicalSkills')}
                                          </label>
                                          <p className="text-xs text-muted-foreground">{t('experience.technicalSkillsDesc')}</p>
                                          <div className="grid grid-cols-5 gap-2">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setEndorsementData(prev => ({ ...prev, skillsRating: value }))}
                                                    className={`
                                                      relative p-3 rounded-xl border-2 transition-all duration-200
                                                      flex flex-col items-center justify-center gap-1
                                                      hover:scale-105
                                                      ${endorsementData.skillsRating === value
                                                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                                                        : "border-[var(--experience-step-border)] hover:border-yellow-500/50"
                                                      }
                                                    `}
                                                >
                                                  <span className="text-lg font-bold">{value}</span>
                                                  <span className="text-[10px] text-muted-foreground">
                                                    {value === 1 && t('experience.ratingBasic')}
                                                    {value === 2 && t('experience.ratingFair')}
                                                    {value === 3 && t('experience.ratingGood')}
                                                    {value === 4 && t('experience.ratingGreat')}
                                                    {value === 5 && t('experience.ratingExpert')}
                                                  </span>
                                                </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Impact Rating */}
                                        <div className="space-y-3">
                                          <label className="text-sm font-semibold flex items-center gap-2">
                                            <Target className="h-4 w-4 text-blue-500" />
                                            {t('experience.projectImpact')}
                                          </label>
                                          <p className="text-xs text-muted-foreground">{t('experience.projectImpactDesc')}</p>
                                          <div className="grid grid-cols-5 gap-2">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setEndorsementData(prev => ({ ...prev, impactRating: value }))}
                                                    className={`
                                                      relative p-3 rounded-xl border-2 transition-all duration-200
                                                      flex flex-col items-center justify-center gap-1
                                                      hover:scale-105
                                                      ${endorsementData.impactRating === value
                                                        ? "border-blue-500 bg-blue-500/10 text-blue-600"
                                                        : "border-[var(--experience-step-border)] hover:border-blue-500/50"
                                                      }
                                                    `}
                                                >
                                                  <span className="text-lg font-bold">{value}</span>
                                                  <span className="text-[10px] text-muted-foreground">
                                                    {value === 1 && t('experience.impactLow')}
                                                    {value === 2 && t('experience.impactSome')}
                                                    {value === 3 && t('experience.impactGood')}
                                                    {value === 4 && t('experience.impactHigh')}
                                                    {value === 5 && t('experience.impactMajor')}
                                                  </span>
                                                </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Growth Rating */}
                                        <div className="space-y-3">
                                          <label className="text-sm font-semibold flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            {t('experience.growthAdaptability')}
                                          </label>
                                          <p className="text-xs text-muted-foreground">{t('experience.growthAdaptabilityDesc')}</p>
                                          <div className="grid grid-cols-5 gap-2">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setEndorsementData(prev => ({ ...prev, growthRating: value }))}
                                                    className={`
                                                      relative p-3 rounded-xl border-2 transition-all duration-200
                                                      flex flex-col items-center justify-center gap-1
                                                      hover:scale-105
                                                      ${endorsementData.growthRating === value
                                                        ? "border-green-500 bg-green-500/10 text-green-600"
                                                        : "border-[var(--experience-step-border)] hover:border-green-500/50"
                                                      }
                                                    `}
                                                >
                                                  <span className="text-lg font-bold">{value}</span>
                                                  <span className="text-[10px] text-muted-foreground">
                                                    {value === 1 && t('experience.growthLittle')}
                                                    {value === 2 && t('experience.growthSome')}
                                                    {value === 3 && t('experience.growthGood')}
                                                    {value === 4 && t('experience.growthStrong')}
                                                    {value === 5 && t('experience.growthRapid')}
                                                  </span>
                                                </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Recommendation */}
                                        <div className="space-y-3">
                                          <label className="text-sm font-semibold flex items-center gap-2">
                                            <ThumbsUp className="h-4 w-4 text-purple-500" />
                                            {t('experience.wouldRecommend')}
                                          </label>
                                          <div className="grid grid-cols-2 gap-3">
                                            {[
                                              { value: "highly_recommend", label: t('experience.highlyRecommend'), emoji: "🌟", color: "emerald" },
                                              { value: "recommend", label: t('experience.recommend'), emoji: "👍", color: "blue" },
                                              { value: "neutral", label: t('experience.neutral'), emoji: "😐", color: "gray" },
                                              { value: "not_recommend", label: t('experience.notRecommend'), emoji: "👎", color: "red" },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setEndorsementData(prev => ({ ...prev, recommendation: option.value }))}
                                                    className={`
                                                      p-4 rounded-xl border-2 transition-all duration-200
                                                      flex items-center gap-3
                                                      hover:scale-[1.02]
                                                      ${endorsementData.recommendation === option.value
                                                        ? option.color === "emerald" ? "border-emerald-500 bg-emerald-500/10"
                                                          : option.color === "blue" ? "border-blue-500 bg-blue-500/10"
                                                          : option.color === "gray" ? "border-gray-500 bg-gray-500/10"
                                                          : "border-red-500 bg-red-500/10"
                                                        : "border-[var(--experience-step-border)] hover:border-purple-500/50"
                                                      }
                                                    `}
                                                >
                                                  <span className="text-2xl">{option.emoji}</span>
                                                  <span className="font-medium text-sm">{option.label}</span>
                                                </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Endorsement Note */}
                                        <div className="space-y-3">
                                          <label className="text-sm font-semibold flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-[var(--experience-accent)]" />
                                            {t('experience.feedbackNote')}
                                          </label>
                                          <Textarea
                                              placeholder={t('experience.feedbackPlaceholder')}
                                              value={endorsementData.endorsementNote}
                                              onChange={(e) => setEndorsementData(prev => ({ ...prev, endorsementNote: e.target.value }))}
                                              className="rounded-xl border-2 border-[var(--experience-step-border)] resize-none min-h-[80px]"
                                          />
                                        </div>

                                        {/* Summary Preview */}
                                        {endorsementData.skillsRating && endorsementData.impactRating && endorsementData.growthRating && endorsementData.recommendation && (
                                            <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--experience-hero-gradient-from)]/10 to-[var(--experience-hero-gradient-to)]/10 border border-[var(--experience-accent)]/20">
                                              <p className="text-sm font-semibold text-[var(--experience-accent)] mb-2">{t('experience.endorsementSummary')}</p>
                                              <div className="grid grid-cols-4 gap-3 text-center">
                                                <div>
                                                  <p className="text-2xl font-bold">{endorsementData.skillsRating}/5</p>
                                                  <p className="text-xs text-muted-foreground">{t('experience.skills')}</p>
                                                </div>
                                                <div>
                                                  <p className="text-2xl font-bold">{endorsementData.impactRating}/5</p>
                                                  <p className="text-xs text-muted-foreground">{t('experience.impact')}</p>
                                                </div>
                                                <div>
                                                  <p className="text-2xl font-bold">{endorsementData.growthRating}/5</p>
                                                  <p className="text-xs text-muted-foreground">{t('experience.growth')}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xl">
                                                    {endorsementData.recommendation === "highly_recommend" && "🌟"}
                                                    {endorsementData.recommendation === "recommend" && "👍"}
                                                    {endorsementData.recommendation === "neutral" && "😐"}
                                                    {endorsementData.recommendation === "not_recommend" && "👎"}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">{t('experience.rec')}</p>
                                                </div>
                                              </div>
                                            </div>
                                        )}
                                      </div>

                                      <DialogFooter className="flex gap-3 sm:gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-2xl border-2 bg-transparent"
                                            onClick={() => {
                                              const closeButton = document.querySelector<HTMLButtonElement>(
                                                  '[data-state="open"] button[aria-label="Close"]',
                                              )
                                              if (closeButton) closeButton.click()
                                            }}
                                        >
                                          {t('experience.cancel')}
                                        </Button>

                                        <Button
                                            disabled={!endorsementData.skillsRating || !endorsementData.impactRating || !endorsementData.growthRating || !endorsementData.recommendation}
                                            onClick={async () => {
                                              await handleAction(exp.id, "approve", endorsementData)
                                              // Close the dialog after successful approval
                                              const closeButton = document.querySelector<HTMLButtonElement>(
                                                  '[data-state="open"] button[aria-label="Close"]',
                                              )
                                              if (closeButton) closeButton.click()
                                            }}
                                            className="flex-1 rounded-2xl bg-gradient-to-r from-[var(--experience-hero-gradient-from)] to-[var(--experience-hero-gradient-to)] hover:opacity-90 text-white font-semibold disabled:opacity-50"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          {t('experience.submitEndorsement')}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleAction(exp.id, "reject")}
                                      className="w-full mt-2 rounded-2xl"
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {t('experience.reject')}
                                  </Button>
                                </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                  ))}
                </div>
              </>
          )}
        </section>

        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl border-2 border-[var(--experience-step-border)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[var(--experience-accent)]" />
                {t('experience.downloadFile')}
              </DialogTitle>
              <DialogDescription>
                {t('experience.downloadScanDesc')}
              </DialogDescription>
            </DialogHeader>

            {scanStatus === "idle" && (
                <div className="space-y-4 py-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-[var(--experience-step-border)]">
                    <p className="text-sm text-muted-foreground mb-1">{t('experience.fileLabel')}:</p>
                    <p className="text-sm font-medium break-all">{selectedFile?.split("/").pop()}</p>
                  </div>
                  <Button
                      onClick={startScan}
                      className="w-full rounded-2xl bg-[var(--experience-accent)] hover:bg-[var(--experience-accent)]/90"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {t('experience.startSecurityScan')}
                  </Button>
                </div>
            )}

            {scanStatus === "scanning" && (
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-[var(--experience-accent)]/10 flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-[var(--experience-accent)] animate-pulse" />
                    </div>
                    <p className="text-sm font-medium">{t('experience.scanningThreats')}</p>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">{scanProgress}% {t('experience.complete')}</p>
                </div>
            )}

            {scanStatus === "safe" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-green-600 mb-1">{t('experience.fileIsSafe')}</p>
                    <p className="text-xs text-muted-foreground">{t('experience.noThreatsDetected')}</p>
                  </div>
                </div>
            )}

            {scanStatus === "danger" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-600 mb-1">{t('experience.warningSuspicious')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('experience.harmfulContentWarning')}
                    </p>
                  </div>
                </div>
            )}

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setSelectedFile(null)} className="flex-1 rounded-2xl">
                {t('experience.cancel')}
              </Button>
              {scanStatus === "safe" && (
                  <Button
                      onClick={confirmDownload}
                      className="flex-1 rounded-2xl bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('experience.download')}
                  </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewAllFilesExp} onOpenChange={() => setViewAllFilesExp(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] rounded-3xl border-2 border-[var(--experience-step-border)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--experience-accent)]" />
                {t('experience.allMediaFiles')} ({viewAllFilesExp?.mediaUrls.length || 0})
              </DialogTitle>
              <DialogDescription>
                {role === "STUDENT"
                    ? `${t('experience.experienceWith')} ${viewAllFilesExp?.company?.name || t('experience.unknownCompany')}`
                    : `${t('experience.experienceFrom')} ${viewAllFilesExp?.student?.email || t('experience.unknownStudent')}`}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[50vh] py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {viewAllFilesExp?.mediaUrls.map((url, i) => (
                    <div key={i} className="relative group/media">
                      {url.endsWith(".mp4") || url.endsWith(".mov") ? (
                          <div className="aspect-square rounded-xl bg-gradient-to-br from-[var(--experience-accent)]/20 to-[var(--experience-accent)]/10 flex flex-col items-center justify-center border border-[var(--experience-step-border)] p-4">
                            <FileVideo className="h-8 w-8 text-[var(--experience-accent)] mb-2" />
                            <p className="text-xs text-center text-muted-foreground break-all px-2">
                              {url.split("/").pop()?.substring(0, 20)}...
                            </p>
                          </div>
                      ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                              src={url || "/placeholder.svg"}
                              alt={`Media ${i + 1}`}
                              className="aspect-square w-full object-cover rounded-xl border border-[var(--experience-step-border)]"
                          />
                      )}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/media:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                            onClick={() => handleDownloadClick(url)}
                        >
                          <Download className="h-5 w-5 mr-2" />
                          {t('experience.download')}
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                        #{i + 1}
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setViewAllFilesExp(null)} className="flex-1 rounded-2xl">
                {t('experience.close')}
              </Button>
              <Button
                  onClick={() => {
                    if (viewAllFilesExp) {
                      setBulkDownloadExp(viewAllFilesExp)
                      setBulkScanProgress(0)
                      setBulkScanStatus("idle")
                      setViewAllFilesExp(null)
                    }
                  }}
                  className="flex-1 rounded-2xl bg-[var(--experience-accent)] hover:bg-[var(--experience-accent)]/90"
              >
                <DownloadCloud className="h-4 w-4 mr-2" />
                {t('experience.downloadAll')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!bulkDownloadExp} onOpenChange={() => setBulkDownloadExp(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl border-2 border-[var(--experience-step-border)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DownloadCloud className="h-5 w-5 text-[var(--experience-accent)]" />
                {t('experience.downloadAllFiles')}
              </DialogTitle>
              <DialogDescription>
                {t('experience.scanningFiles', { count: bulkDownloadExp?.mediaUrls.length || 0 })}
              </DialogDescription>
            </DialogHeader>

            {bulkScanStatus === "idle" && (
                <div className="space-y-4 py-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-[var(--experience-step-border)]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{t('experience.filesToDownload')}:</p>
                      <Badge variant="outline" className="rounded-xl">
                        {bulkDownloadExp?.mediaUrls.length || 0} {t('experience.filesPlural')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('experience.allFilesScanned')}
                    </p>
                  </div>
                  <Button
                      onClick={startBulkScan}
                      className="w-full rounded-2xl bg-[var(--experience-accent)] hover:bg-[var(--experience-accent)]/90"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {t('experience.startBulkScan')}
                  </Button>
                </div>
            )}

            {bulkScanStatus === "scanning" && (
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-[var(--experience-accent)]/10 flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-[var(--experience-accent)] animate-pulse" />
                    </div>
                    <p className="text-sm font-medium">{t('experience.scanningNFiles', { count: bulkDownloadExp?.mediaUrls.length || 0 })}</p>
                  </div>
                  <Progress value={bulkScanProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">{bulkScanProgress}% {t('experience.complete')}</p>
                </div>
            )}

            {bulkScanStatus === "safe" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-green-600 mb-1">{t('experience.allFilesSafe')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('experience.noThreatsInFiles', { count: bulkDownloadExp?.mediaUrls.length || 0 })}
                    </p>
                  </div>
                </div>
            )}

            {bulkScanStatus === "danger" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-600 mb-1">{t('experience.warningSuspiciousDetected')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('experience.someFilesHarmful')}
                    </p>
                  </div>
                </div>
            )}

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                  variant="outline"
                  onClick={() => {
                    setBulkDownloadExp(null)
                    setBulkScanProgress(0)
                    setBulkScanStatus("idle")
                  }}
                  className="flex-1 rounded-2xl"
              >
                {t('experience.cancel')}
              </Button>
              {bulkScanStatus === "safe" && (
                  <Button
                      onClick={confirmBulkDownload}
                      className="flex-1 rounded-2xl bg-green-600 hover:bg-green-700 text-white"
                  >
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    {t('experience.downloadAll')}
                  </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!fileSizeError} onOpenChange={() => setFileSizeError(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('experience.fileSizeLimitExceeded')}</DialogTitle>
              <DialogDescription>{fileSizeError}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setFileSizeError(null)}>{t('experience.ok')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
