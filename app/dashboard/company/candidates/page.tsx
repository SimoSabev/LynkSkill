"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Users, Search, Filter, Loader2, User, Mail, Briefcase, FolderOpen, Calendar, X, Send, Video, MapPin, Clock, Sparkles, ChevronDown, ChevronUp, History, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/lib/i18n"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { useAIMode } from "@/lib/ai-mode-context"
import { toast } from "sonner"

interface Candidate {
    id: string
    name: string
    email: string
    avatar?: string
    headline?: string
    bio?: string
    skills: string[]
    matchPercentage: number
    matchedSkills: string[]
    projectCount: number
    experienceCount: number
}

interface SessionCandidate {
    id: string
    candidateId: string
    name: string
    matchPercentage: number
    matchReasons: string[]
    matchedSkills: string[]
    avatar?: string
}

interface AISession {
    sessionId: string
    sessionName: string
    searchQuery: string
    requiredSkills: string[]
    createdAt: string
    candidates: SessionCandidate[]
}

interface CandidateDetailResponse {
    candidate?: {
        id: string
        name: string
        email: string
        avatar?: string
        headline?: string
        bio?: string
        skills?: string[]
        matchPercentage?: number
        matchedSkills?: string[]
        projects?: unknown[]
        experiences?: unknown[]
    }
    error?: string
}

function parseSkills(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
        )
    )
}

export default function CandidatesPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            }
        >
            <CandidatesPageContent />
        </Suspense>
    )
}

function CandidatesPageContent() {
    const { t } = useTranslation()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isAIMode, toggleAIMode } = useAIMode()
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [sessions, setSessions] = useState<AISession[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingSessions, setIsLoadingSessions] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
    const [activeTab, setActiveTab] = useState("sessions")
    const [skillFilter, setSkillFilter] = useState<string[]>([])
    const [skillFilterInput, setSkillFilterInput] = useState("")
    const [filtersOpen, setFiltersOpen] = useState(false)
    
    // Modal states
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
    const [messageModalOpen, setMessageModalOpen] = useState(false)
    const [interviewModalOpen, setInterviewModalOpen] = useState(false)
    const [isSending, setIsSending] = useState(false)
    
    // Message form
    const [messageSubject, setMessageSubject] = useState("")
    const [messageContent, setMessageContent] = useState("")
    
    // Interview form
    const [interviewDate, setInterviewDate] = useState("")
    const [interviewTime, setInterviewTime] = useState("")
    const [interviewDuration, setInterviewDuration] = useState("30")
    const [interviewType, setInterviewType] = useState("video")
    const [interviewPosition, setInterviewPosition] = useState("")
    const [interviewNotes, setInterviewNotes] = useState("")

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchCandidates = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (debouncedSearch) params.set("search", debouncedSearch)
            if (skillFilter.length > 0) params.set("skills", skillFilter.join(","))
            
            const response = await fetch(`/api/candidates?${params.toString()}`)
            const data = await response.json()
            
            if (Array.isArray(data.candidates)) {
                const list: Candidate[] = data.candidates
                // The API scores candidates against the requested skills; only keep those matching at least one
                setCandidates(
                    skillFilter.length > 0
                        ? list.filter((c) => (c.matchedSkills?.length ?? 0) > 0)
                        : list
                )
            }
        } catch (error) {
            console.error("Error fetching candidates:", error)
        } finally {
            setIsLoading(false)
        }
    }, [debouncedSearch, skillFilter])

    const fetchSessions = useCallback(async () => {
        setIsLoadingSessions(true)
        try {
            const response = await fetch("/api/candidates/evaluations")
            const data = await response.json()
            
            if (data.sessions) {
                setSessions(data.sessions)
                // Auto-expand the first session
                if (data.sessions.length > 0) {
                    setExpandedSessions(new Set([data.sessions[0].sessionId]))
                }
            }
        } catch (error) {
            console.error("Error fetching AI sessions:", error)
        } finally {
            setIsLoadingSessions(false)
        }
    }, [])

    useEffect(() => {
        fetchCandidates()
    }, [fetchCandidates])

    useEffect(() => {
        fetchSessions()
    }, [fetchSessions])

    const toggleSession = (sessionId: string) => {
        setExpandedSessions(prev => {
            const newSet = new Set(prev)
            if (newSet.has(sessionId)) {
                newSet.delete(sessionId)
            } else {
                newSet.add(sessionId)
            }
            return newSet
        })
    }

    const formatSessionDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getMatchColor = (percentage: number) => {
        if (percentage >= 80) return "from-green-500 to-emerald-500"
        if (percentage >= 60) return "from-blue-500 to-cyan-500"
        if (percentage >= 40) return "from-yellow-500 to-orange-500"
        return "from-gray-500 to-slate-500"
    }

    const openMessageModal = (candidate: Candidate) => {
        setSelectedCandidate(candidate)
        setMessageSubject(`Opportunity at our company`)
        setMessageContent("")
        setMessageModalOpen(true)
    }

    const openInterviewModal = (candidate: Candidate) => {
        setSelectedCandidate(candidate)
        setInterviewDate("")
        setInterviewTime("")
        setInterviewDuration("30")
        setInterviewType("video")
        setInterviewPosition("")
        setInterviewNotes("")
        setInterviewModalOpen(true)
    }

    // Deep links from the candidate profile page: ?message=<id> / ?interview=<id>
    const messageParam = searchParams?.get("message") ?? null
    const interviewParam = searchParams?.get("interview") ?? null
    const handledDeepLinkRef = useRef<string | null>(null)

    useEffect(() => {
        const candidateId = messageParam || interviewParam
        const action: "message" | "interview" | null = messageParam ? "message" : interviewParam ? "interview" : null
        if (!candidateId || !action) {
            handledDeepLinkRef.current = null
            return
        }
        if (isLoading) return

        const key = `${action}:${candidateId}`
        if (handledDeepLinkRef.current === key) return
        handledDeepLinkRef.current = key

        const openFor = (candidate: Candidate) => {
            setActiveTab("all")
            if (action === "message") {
                openMessageModal(candidate)
            } else {
                openInterviewModal(candidate)
            }
            // Clear the query param so closing the modal doesn't reopen it
            router.replace("/dashboard/company/candidates", { scroll: false })
        }

        const existing = candidates.find((c) => c.id === candidateId)
        if (existing) {
            openFor(existing)
            return
        }

        ;(async () => {
            try {
                const res = await fetch(`/api/candidates/${encodeURIComponent(candidateId)}`)
                const data: CandidateDetailResponse = await res.json().catch(() => ({}))
                if (!res.ok || !data.candidate) {
                    toast.error(data.error || "Candidate not found")
                    return
                }
                const c = data.candidate
                openFor({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    avatar: c.avatar,
                    headline: c.headline,
                    bio: c.bio,
                    skills: c.skills ?? [],
                    matchPercentage: c.matchPercentage ?? 0,
                    matchedSkills: c.matchedSkills ?? [],
                    projectCount: c.projects?.length ?? 0,
                    experienceCount: c.experiences?.length ?? 0,
                })
            } catch (error) {
                console.error("Error loading candidate:", error)
                toast.error("Failed to load candidate")
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageParam, interviewParam, isLoading, candidates])

    const openAIAssistant = () => {
        if (!isAIMode) toggleAIMode()
        router.push("/dashboard/company")
    }

    const applySkillFilter = () => {
        setSkillFilter(parseSkills(skillFilterInput))
        setActiveTab("all")
        setFiltersOpen(false)
    }

    const clearSkillFilter = () => {
        setSkillFilter([])
        setSkillFilterInput("")
        setFiltersOpen(false)
    }

    const handleSendMessage = async () => {
        if (!selectedCandidate || !messageContent.trim()) return
        
        setIsSending(true)
        try {
            const response = await fetch(`/api/candidates/${selectedCandidate.id}/message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: messageSubject,
                    message: messageContent
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(`Message sent to ${selectedCandidate.name}. They will see it in their notifications.`)
                setMessageModalOpen(false)
            } else {
                toast.error(data.error || "Failed to send message")
            }
        } catch (error) {
            console.error("Error sending message:", error)
            toast.error("Failed to send message")
        } finally {
            setIsSending(false)
        }
    }

    const handleSendInterview = async () => {
        if (!selectedCandidate || !interviewDate || !interviewTime) return
        
        setIsSending(true)
        try {
            const scheduledAt = new Date(`${interviewDate}T${interviewTime}`)
            
            const response = await fetch(`/api/candidates/${selectedCandidate.id}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scheduledAt: scheduledAt.toISOString(),
                    duration: parseInt(interviewDuration),
                    type: interviewType,
                    positionTitle: interviewPosition,
                    notes: interviewNotes,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(`Interview invitation notification sent to ${selectedCandidate.name}.`)
                setInterviewModalOpen(false)
            } else {
                toast.error(data.error || "Failed to send invitation")
            }
        } catch (error) {
            console.error("Error sending invitation:", error)
            toast.error("Failed to send invitation")
        } finally {
            setIsSending(false)
        }
    }

    const viewProfile = (candidateId: string) => {
        router.push(`/dashboard/company/candidates/${candidateId}`)
    }

    // Get minimum date (today)
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/5 border border-violet-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                        <Users className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">{t('navigation.candidates')}</h1>
                        <p className="text-muted-foreground">Browse and search for potential candidates</p>
                    </div>
                </div>
            </motion.div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search candidates by name, skills..." 
                        className="pl-10 rounded-xl border-violet-500/20 focus:border-violet-500/40"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="rounded-xl border-violet-500/30 hover:bg-violet-500/10">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {skillFilter.length > 0 && (
                                <Badge className="ml-2 h-5 px-1.5 bg-violet-600 text-white border-0">
                                    {skillFilter.length}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 rounded-xl">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="candidate-skill-filter">Required skills</Label>
                                <Input
                                    id="candidate-skill-filter"
                                    value={skillFilterInput}
                                    onChange={(e) => setSkillFilterInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            applySkillFilter()
                                        }
                                    }}
                                    placeholder="e.g. React, TypeScript"
                                    className="rounded-xl"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Comma-separated. Shows candidates with at least one matching skill, ranked by match.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={clearSkillFilter}>
                                    Clear
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600"
                                    onClick={applySkillFilter}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {skillFilter.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 -mt-2">
                    <span className="text-sm text-muted-foreground">Filtering by:</span>
                    {skillFilter.map((skill) => (
                        <Badge key={skill} variant="outline" className="border-violet-500/30 bg-violet-500/10 gap-1">
                            {skill}
                            <button
                                type="button"
                                aria-label={`Remove ${skill} filter`}
                                className="ml-0.5 rounded-full hover:text-violet-600"
                                onClick={() => {
                                    const next = skillFilter.filter((s) => s !== skill)
                                    setSkillFilter(next)
                                    setSkillFilterInput(next.join(", "))
                                }}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Tabs for Sessions vs All Candidates */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-violet-500/10 p-1 rounded-xl">
                    <TabsTrigger 
                        value="sessions" 
                        className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Sessions ({sessions.length})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="all" 
                        className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        All Candidates ({candidates.length})
                    </TabsTrigger>
                </TabsList>

                {/* AI Sessions Tab */}
                <TabsContent value="sessions" className="space-y-4">
                    {isLoadingSessions ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <Card className="border-dashed border-2 border-violet-500/20">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 rounded-2xl bg-violet-500/10 mb-4">
                                    <Sparkles className="h-10 w-10 text-violet-500" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No AI search sessions yet</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Use the AI assistant to search for candidates. Each search session will be saved here with all matching candidates.
                                </p>
                                <Button 
                                    className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600"
                                    onClick={openAIAssistant}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Open AI Assistant
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session, sessionIndex) => (
                                <motion.div
                                    key={session.sessionId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: sessionIndex * 0.1 }}
                                >
                                    <Card className="border-border/50 overflow-hidden">
                                        {/* Session Header */}
                                        <div 
                                            className="p-4 cursor-pointer hover:bg-violet-500/5 transition-colors"
                                            onClick={() => toggleSession(session.sessionId)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                                                        <Sparkles className="h-5 w-5 text-violet-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">{session.sessionName}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <History className="h-3 w-3" />
                                                            {formatSessionDate(session.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10">
                                                        {session.candidates.length} candidate{session.candidates.length !== 1 ? "s" : ""}
                                                    </Badge>
                                                    {expandedSessions.has(session.sessionId) ? (
                                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Search Query & Skills */}
                                            {session.searchQuery && (
                                                <p className="mt-2 text-sm text-muted-foreground italic">
                                                    &quot;{session.searchQuery}&quot;
                                                </p>
                                            )}
                                            {session.requiredSkills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {session.requiredSkills.slice(0, 6).map((skill) => (
                                                        <Badge key={skill} variant="outline" className="text-xs border-violet-500/30">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {session.requiredSkills.length > 6 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{session.requiredSkills.length - 6} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Session Candidates (Expanded) */}
                                        <AnimatePresence>
                                            {expandedSessions.has(session.sessionId) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t border-border/50"
                                                >
                                                    <div className="p-4 bg-violet-500/5">
                                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                            {session.candidates
                                                                .sort((a, b) => b.matchPercentage - a.matchPercentage)
                                                                .map((candidate) => (
                                                                <Card 
                                                                    key={candidate.id} 
                                                                    className="border-border/50 hover:border-violet-500/30 transition-all hover:shadow-md cursor-pointer"
                                                                    onClick={() => viewProfile(candidate.candidateId)}
                                                                >
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <Avatar className="h-10 w-10 border-2 border-violet-500/30">
                                                                                {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
                                                                                <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-600 font-bold">
                                                                                    {candidate.name.charAt(0)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="font-medium truncate">{candidate.name}</h4>
                                                                                <Badge 
                                                                                    className={cn(
                                                                                        "text-xs text-white border-0 bg-gradient-to-r",
                                                                                        getMatchColor(candidate.matchPercentage)
                                                                                    )}
                                                                                >
                                                                                    {candidate.matchPercentage}% Match
                                                                                </Badge>
                                                                            </div>
                                                                        </div>

                                                                        {/* Match Reasons */}
                                                                        {candidate.matchReasons.length > 0 && (
                                                                            <div className="text-xs text-muted-foreground mb-2">
                                                                                {candidate.matchReasons.slice(0, 2).map((reason, i) => (
                                                                                    <p key={i} className="truncate">• {reason}</p>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Matched Skills */}
                                                                        {candidate.matchedSkills.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {candidate.matchedSkills.slice(0, 3).map((skill) => (
                                                                                    <Badge 
                                                                                        key={skill} 
                                                                                        variant="outline" 
                                                                                        className="text-xs border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                                                                                    >
                                                                                        ✓ {skill}
                                                                                    </Badge>
                                                                                ))}
                                                                                {candidate.matchedSkills.length > 3 && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        +{candidate.matchedSkills.length - 3}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* All Candidates Tab */}
                <TabsContent value="all">
                    {/* Candidates Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : candidates.length === 0 ? (
                <Card className="border-dashed border-2 border-violet-500/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-2xl bg-violet-500/10 mb-4">
                            <Users className="h-10 w-10 text-violet-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
                        <p className="text-muted-foreground max-w-md">
                            {searchTerm || skillFilter.length > 0
                                ? `No candidates match your ${searchTerm ? `search "${searchTerm}"` : "search"}${skillFilter.length > 0 ? ` and skill filter (${skillFilter.join(", ")})` : ""}. Try different criteria.`
                                : "No students have registered yet. Check back later!"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {candidates.map((candidate, index) => (
                        <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="border-border/50 hover:border-violet-500/30 transition-all hover:shadow-lg group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-violet-500/30">
                                            {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
                                            <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-600 font-bold">
                                                {candidate.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">{candidate.name}</CardTitle>
                                            {candidate.headline && (
                                                <p className="text-sm text-muted-foreground truncate">{candidate.headline}</p>
                                            )}
                                            <Badge 
                                                className={cn(
                                                    "mt-1 text-white border-0 bg-gradient-to-r",
                                                    getMatchColor(candidate.matchPercentage)
                                                )}
                                            >
                                                {candidate.matchPercentage}% Match
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Stats */}
                                    <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
                                        {candidate.projectCount > 0 && (
                                            <span className="flex items-center gap-1">
                                                <FolderOpen className="h-3 w-3" />
                                                {candidate.projectCount} project{candidate.projectCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {candidate.experienceCount > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                {candidate.experienceCount} experience{candidate.experienceCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {candidate.skills.slice(0, 4).map((skill) => (
                                            <Badge 
                                                key={skill} 
                                                variant="outline" 
                                                className={cn(
                                                    "text-xs",
                                                    candidate.matchedSkills.includes(skill) && "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                                )}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                        {candidate.skills.length > 4 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{candidate.skills.length - 4}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                                                onClick={() => viewProfile(candidate.id)}
                                            >
                                                <User className="h-3.5 w-3.5 mr-1.5" />
                                                View Profile
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="rounded-xl border-violet-500/30 hover:bg-violet-500/10"
                                                onClick={() => openMessageModal(candidate)}
                                            >
                                                <Mail className="h-3.5 w-3.5 mr-1.5" />
                                                Message
                                            </Button>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="w-full rounded-xl border-green-500/30 hover:bg-green-500/10 text-green-600 dark:text-green-400"
                                            onClick={() => openInterviewModal(candidate)}
                                        >
                                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                            Invite to Interview
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
                </TabsContent>
            </Tabs>

            {/* Message Modal */}
            <AnimatePresence>
                {messageModalOpen && selectedCandidate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setMessageModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-violet-500/10">
                                        <Mail className="h-5 w-5 text-violet-500" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold">Send Message</h2>
                                        <p className="text-sm text-muted-foreground">to {selectedCandidate.name}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setMessageModalOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input 
                                        value={messageSubject}
                                        onChange={(e) => setMessageSubject(e.target.value)}
                                        placeholder="Subject of your message"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Message</Label>
                                    <Textarea 
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        placeholder="Write your message here..."
                                        className="rounded-xl min-h-[150px] resize-none"
                                        maxLength={2000}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{messageContent.length}/2000</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 p-4 border-t border-border">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setMessageModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600"
                                    onClick={handleSendMessage}
                                    disabled={!messageContent.trim() || isSending}
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    Send Message
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interview Modal */}
            <AnimatePresence>
                {interviewModalOpen && selectedCandidate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setInterviewModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-green-500/10">
                                        <Calendar className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold">Invite to Interview</h2>
                                        <p className="text-sm text-muted-foreground">{selectedCandidate.name}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setInterviewModalOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="p-4 space-y-4">
                                <p className="text-sm text-muted-foreground rounded-xl bg-muted/50 p-3">
                                    The candidate will receive a notification with your proposed interview details.
                                    This does not create a scheduled interview in their calendar.
                                </p>
                                <div className="space-y-2">
                                    <Label>Position Title</Label>
                                    <Input 
                                        value={interviewPosition}
                                        onChange={(e) => setInterviewPosition(e.target.value)}
                                        placeholder="e.g., Frontend Developer Intern"
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input 
                                            type="date"
                                            value={interviewDate}
                                            onChange={(e) => setInterviewDate(e.target.value)}
                                            min={today}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input 
                                            type="time"
                                            value={interviewTime}
                                            onChange={(e) => setInterviewTime(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Duration</Label>
                                        <Select value={interviewDuration} onValueChange={setInterviewDuration}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="45">45 minutes</SelectItem>
                                                <SelectItem value="60">1 hour</SelectItem>
                                                <SelectItem value="90">1.5 hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Interview Type</Label>
                                        <Select value={interviewType} onValueChange={setInterviewType}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="video">
                                                    <span className="flex items-center gap-2">
                                                        <Video className="h-3.5 w-3.5" /> Video Call
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="in-person">
                                                    <span className="flex items-center gap-2">
                                                        <MapPin className="h-3.5 w-3.5" /> In-Person
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="phone">
                                                    <span className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5" /> Phone Call
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes (optional)</Label>
                                    <Textarea 
                                        value={interviewNotes}
                                        onChange={(e) => setInterviewNotes(e.target.value)}
                                        placeholder="Any additional information for the candidate..."
                                        className="rounded-xl min-h-[80px] resize-none"
                                        maxLength={2000}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-2 p-4 border-t border-border">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setInterviewModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    onClick={handleSendInterview}
                                    disabled={!interviewDate || !interviewTime || isSending}
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    Send Invitation Notification
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
