"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Mail, Calendar, Briefcase, FolderOpen, MapPin, Globe, Loader2, User, TrendingUp, Star, History, Sparkles, Clock, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface EvaluationSession {
    sessionId: string
    sessionName: string | null
    searchQuery: string | null
    requiredSkills: string[]
    createdAt: string
    matchPercentage: number
    matchReasons: string[]
    matchedSkills: string[]
}

interface CandidateProfile {
    id: string
    name: string
    email: string
    avatar?: string
    headline?: string
    bio?: string
    skills: string[]
    interests: string[]
    experience?: string
    // Evaluation data from AI mode
    matchPercentage?: number
    matchReasons?: string[]
    matchedSkills?: string[]
    // Evaluation history from AI sessions
    evaluationHistory?: EvaluationSession[]
    projects: Array<{
        id: string
        title: string
        description: string
        technologies?: string[]
    }>
    experiences: Array<{
        id: string
        title: string
        company: string
        description?: string
        startDate: string
        endDate?: string
    }>
}

export default function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedSession, setSelectedSession] = useState<EvaluationSession | null>(null)

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const response = await fetch(`/api/candidates/${id}`)
                const data = await response.json()
                
                if (data.candidate) {
                    setCandidate(data.candidate)
                    // Auto-select the most recent evaluation if available
                    if (data.candidate.evaluationHistory?.length > 0) {
                        setSelectedSession(data.candidate.evaluationHistory[0])
                    }
                }
            } catch (error) {
                console.error("Error fetching candidate:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCandidate()
    }, [id])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        )
    }

    if (!candidate) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-2">Candidate not found</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    const getMatchColor = (percentage: number) => {
        if (percentage >= 80) return "from-green-500 to-emerald-500"
        if (percentage >= 60) return "from-blue-500 to-indigo-500"
        if (percentage >= 40) return "from-yellow-500 to-orange-500"
        return "from-gray-500 to-slate-500"
    }

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="rounded-xl"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Candidates
            </Button>

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/5 border border-violet-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-violet-500/30 shadow-lg">
                            {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-3xl font-bold">
                                {candidate.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        {candidate.matchPercentage !== undefined && candidate.matchPercentage > 0 && (
                            <div className={cn(
                                "absolute -bottom-2 -right-2 px-2 py-1 rounded-lg text-white text-xs font-bold bg-gradient-to-r shadow-lg",
                                getMatchColor(candidate.matchPercentage)
                            )}>
                                {candidate.matchPercentage}%
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold">{candidate.name}</h1>
                            {candidate.matchPercentage !== undefined && candidate.matchPercentage >= 60 && (
                                <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Top Match
                                </Badge>
                            )}
                        </div>
                        {candidate.headline && (
                            <p className="text-lg text-muted-foreground mt-1">{candidate.headline}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="text-muted-foreground">
                                <Mail className="h-3 w-3 mr-1" />
                                {candidate.email}
                            </Badge>
                            {candidate.matchPercentage !== undefined && candidate.matchPercentage > 0 && (
                                <Badge variant="outline" className="text-violet-600 dark:text-violet-400 border-violet-500/30">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Match Score: {candidate.matchPercentage}%
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600"
                            onClick={() => router.push(`/dashboard/company/candidates?message=${id}`)}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Message
                        </Button>
                        <Button 
                            variant="outline"
                            className="rounded-xl border-green-500/30 text-green-600 hover:bg-green-500/10"
                            onClick={() => router.push(`/dashboard/company/candidates?interview=${id}`)}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Interview
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* About */}
                    {candidate.bio && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-violet-500" />
                                    About
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{candidate.bio}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Projects */}
                    {candidate.projects.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FolderOpen className="h-5 w-5 text-violet-500" />
                                    Projects ({candidate.projects.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {candidate.projects.map((project) => (
                                    <div key={project.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                                        <h4 className="font-semibold">{project.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                                        {project.technologies && project.technologies.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {project.technologies.map((tech) => (
                                                    <Badge key={tech} variant="outline" className="text-xs">
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Experience */}
                    {candidate.experiences.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-violet-500" />
                                    Experience ({candidate.experiences.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {candidate.experiences.map((exp) => (
                                    <div key={exp.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                                        <h4 className="font-semibold">{exp.title}</h4>
                                        <p className="text-sm text-violet-600 dark:text-violet-400">{exp.company}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                                        </p>
                                        {exp.description && (
                                            <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Match Analysis - Same as AI Mode */}
                    {candidate.matchPercentage !== undefined && candidate.matchPercentage > 0 && (
                        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-violet-500" />
                                    Match Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Overall Score</span>
                                    <div className={cn(
                                        "px-3 py-1 rounded-lg text-white font-bold bg-gradient-to-r",
                                        getMatchColor(selectedSession?.matchPercentage ?? candidate.matchPercentage ?? 0)
                                    )}>
                                        {selectedSession?.matchPercentage ?? candidate.matchPercentage}%
                                    </div>
                                </div>
                                
                                {((selectedSession?.matchReasons ?? candidate.matchReasons) || []).length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2">Why this match?</p>
                                        <div className="space-y-1">
                                            {(selectedSession?.matchReasons ?? candidate.matchReasons ?? []).map((reason, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                                    {reason}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {((selectedSession?.matchedSkills ?? candidate.matchedSkills) || []).length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2">Matched Skills</p>
                                        <div className="flex flex-wrap gap-1">
                                            {(selectedSession?.matchedSkills ?? candidate.matchedSkills ?? []).map((skill) => (
                                                <Badge 
                                                    key={skill} 
                                                    className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedSession?.searchQuery && (
                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Search Query</p>
                                        <p className="text-sm italic text-muted-foreground">&quot;{selectedSession.searchQuery}&quot;</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Evaluation History */}
                    {candidate.evaluationHistory && candidate.evaluationHistory.length > 0 && (
                        <Card className="border-violet-500/20 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-pink-500/5">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="h-5 w-5 text-purple-500" />
                                    AI Search History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {candidate.evaluationHistory.map((session, index) => (
                                    <motion.div
                                        key={session.sessionId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => setSelectedSession(session)}
                                        className={cn(
                                            "p-3 rounded-xl border cursor-pointer transition-all duration-300",
                                            selectedSession?.sessionId === session.sessionId
                                                ? "border-violet-500/50 bg-violet-500/10"
                                                : "border-border/50 bg-card/50 hover:border-violet-500/30 hover:bg-violet-500/5"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Sparkles className="h-3 w-3 text-violet-500" />
                                                    <span className="text-xs font-medium truncate">
                                                        {session.sessionName || "AI Search"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "flex-shrink-0 px-2 py-0.5 rounded-lg text-white text-xs font-bold bg-gradient-to-r",
                                                getMatchColor(session.matchPercentage)
                                            )}>
                                                {session.matchPercentage}%
                                            </div>
                                        </div>
                                        
                                        {session.requiredSkills && session.requiredSkills.length > 0 && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <Search className="h-3 w-3 text-muted-foreground" />
                                                <div className="flex flex-wrap gap-1">
                                                    {session.requiredSkills.slice(0, 3).map((skill) => (
                                                        <Badge key={skill} variant="outline" className="text-xs py-0 h-5">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {session.requiredSkills.length > 3 && (
                                                        <Badge variant="outline" className="text-xs py-0 h-5">
                                                            +{session.requiredSkills.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Skills */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="text-base">Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill) => {
                                    const currentMatchedSkills = selectedSession?.matchedSkills ?? candidate.matchedSkills ?? []
                                    return (
                                        <Badge 
                                            key={skill} 
                                            variant="outline"
                                            className={cn(
                                                "border-violet-500/30 bg-violet-500/5",
                                                currentMatchedSkills.includes(skill) && "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                                            )}
                                        >
                                            {skill}
                                        </Badge>
                                    )
                                })}
                                {candidate.skills.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No skills listed</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interests */}
                    {candidate.interests.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base">Interests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.interests.map((interest) => (
                                        <Badge 
                                            key={interest} 
                                            variant="outline"
                                            className="border-purple-500/30 bg-purple-500/5"
                                        >
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
