"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@clerk/nextjs"
import { useAIMode } from "@/lib/ai-mode-context"
import { useTranslation } from "@/lib/i18n"
import {
    Target,
    User,
    GraduationCap,
    Bot,
    Sparkles,
    Activity,
    Award,
    LineChart,
    Brain,
    HeartPulse,
    Database,
    FileText,
    Code
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ConfidenceScore {
    overallScore: number
    profileCompleteness: number
    profilingDepth: number
    endorsementQuality: number
    activityScore: number
}

interface AIProfile {
    studentId: string
    personalInfo: Record<string, any> | null
    careerGoals: Record<string, any> | null
    personalityTraits: Record<string, any> | null
    skillsAssessment: Record<string, any> | null
    educationDetails: Record<string, any> | null
    availability: Record<string, any> | null
    preferences: Record<string, any> | null
    profilingComplete: boolean
    confidenceScore: ConfidenceScore | null
}

export function Portfolio({ userType }: { userType: "Student" | "Company" }) {
    const { t } = useTranslation()
    const { user } = useUser()
    const { toggleAIMode, isAIMode } = useAIMode()

    const [aiProfile, setAiProfile] = useState<AIProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const displayName = user?.fullName || t("portfolio.professionalPortfolio")

    useEffect(() => {
        async function fetchPortfolio() {
            try {
                const res = await fetch("/api/portfolio")
                if (res.ok) {
                    const data = await res.json()
                    setAiProfile(data.aiProfile || null)
                }
            } catch (err) {
                console.error("Error fetching portfolio:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchPortfolio()
    }, [isAIMode]) // Re-fetch when AI mode is toggled, to get fresh data

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">Loading AI Profile...</p>
                </div>
            </div>
        )
    }

    const score = aiProfile?.confidenceScore?.overallScore || 0
    const scoreColor = score >= 80 ? "text-green-500" : score >= 50 ? "text-violet-500" : "text-orange-500"
    const scoreGradient = score >= 80 ? "from-green-500 to-emerald-500" : score >= 50 ? "from-violet-500 to-purple-500" : "from-orange-500 to-red-500"

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* HERO & Confidence Score Gauge */}
            <div className="relative pt-12 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
                
                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold mb-6">
                            <Sparkles className="h-4 w-4" />
                            AI Middleman Profiler
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">
                            {displayName}&apos;s Profile
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {aiProfile?.profilingComplete 
                                ? "Your AI Profile is complete. Matches will be prioritized based on your high Confidence Score."
                                : "Keep chatting with your AI Profiler to uncover deeper insights and boost your Confidence Score."}
                        </p>
                    </motion.div>

                    {/* Radial Score Display */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center rounded-full bg-card/50 backdrop-blur-xl border-4 border-card shadow-2xl overflow-hidden"
                    >
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                className="fill-transparent stroke-muted stroke-[8]"
                            />
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                strokeDasharray="283%"
                                strokeDashoffset={`${283 - (283 * score) / 100}%`}
                                className={cn("fill-transparent stroke-[8] transition-all duration-1000 ease-out", scoreColor)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="flex flex-col items-center z-10">
                            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                Confidence Score
                            </span>
                            <span className={cn("text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-br", scoreGradient)}>
                                {score}%
                            </span>
                        </div>
                    </motion.div>

                    {userType === "Student" && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-10"
                        >
                            <Button 
                                size="lg" 
                                onClick={toggleAIMode}
                                className={cn(
                                    "rounded-2xl px-8 h-14 text-lg font-bold shadow-xl transition-all duration-300 hover:scale-105",
                                    "bg-gradient-to-r hover:opacity-90 text-white",
                                    scoreGradient
                                )}
                            >
                                <Bot className="h-6 w-6 mr-2" />
                                {score === 0 ? "Start Your Profiling" : "Continue Profiling"}
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8">
                {/* Score Breakdown */}
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Target className="h-6 w-6 text-violet-500" />
                    Score Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                    <ScoreCard 
                        title="Profile Completeness" 
                        icon={<FileText />} 
                        score={aiProfile?.confidenceScore?.profileCompleteness || 0} 
                        color="bg-blue-500" 
                    />
                    <ScoreCard 
                        title="Profiling Depth" 
                        icon={<Brain />} 
                        score={aiProfile?.confidenceScore?.profilingDepth || 0} 
                        color="bg-purple-500" 
                    />
                    <ScoreCard 
                        title="Endorsements" 
                        icon={<Award />} 
                        score={aiProfile?.confidenceScore?.endorsementQuality || 0} 
                        color="bg-amber-500" 
                    />
                    <ScoreCard 
                        title="Activity" 
                        icon={<Activity />} 
                        score={aiProfile?.confidenceScore?.activityScore || 0} 
                        color="bg-emerald-500" 
                    />
                </div>

                {/* AI Extracted Data Sections */}
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Database className="h-6 w-6 text-violet-500" />
                    AI Profile Insights
                </h3>
                
                {(!aiProfile || score === 0) ? (
                    <Card className="border-dashed border-2 bg-transparent">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <h4 className="text-xl font-semibold mb-2">No Profile Data Yet</h4>
                            <p className="text-muted-foreground max-w-sm">
                                Start your profiling session with the AI Middleman to automatically generate your detailed profile insights.
                            </p>
                            {userType === "Student" && (
                                <Button onClick={toggleAIMode} variant="outline" className="mt-6 rounded-xl">
                                    Start Chatting Now
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {aiProfile.personalInfo && Object.keys(aiProfile.personalInfo).length > 0 && (
                            <InsightCard title="Personal & Lifestyle" icon={<User className="text-sky-500"/>} data={aiProfile.personalInfo} />
                        )}
                        {aiProfile.careerGoals && Object.keys(aiProfile.careerGoals).length > 0 && (
                            <InsightCard title="Career Goals" icon={<Target className="text-rose-500"/>} data={aiProfile.careerGoals} />
                        )}
                        {aiProfile.personalityTraits && Object.keys(aiProfile.personalityTraits).length > 0 && (
                            <InsightCard title="Personality Traits" icon={<HeartPulse className="text-pink-500"/>} data={aiProfile.personalityTraits} />
                        )}
                        {aiProfile.skillsAssessment && Object.keys(aiProfile.skillsAssessment).length > 0 && (
                            <SkillsCard data={aiProfile.skillsAssessment} />
                        )}
                        {aiProfile.educationDetails && Object.keys(aiProfile.educationDetails).length > 0 && (
                            <InsightCard title="Education & Setup" icon={<GraduationCap className="text-blue-500"/>} data={aiProfile.educationDetails} />
                        )}
                        {aiProfile.preferences && Object.keys(aiProfile.preferences).length > 0 && (
                            <InsightCard title="Preferences" icon={<LineChart className="text-emerald-500"/>} data={aiProfile.preferences} />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function ScoreCard({ title, icon, score, color }: { title: string, icon: React.ReactNode, score: number, color: string }) {
    return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-colors">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-muted rounded-lg">
                        <div className="[&>svg]:h-5 [&>svg]:w-5 text-muted-foreground">
                            {icon}
                        </div>
                    </div>
                    <span className="text-2xl font-black">{score}%</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">{title}</p>
                {/* Changed the indicator logic slightly to avoid passing a non-standard prop */}
                <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
                    <div className={cn("h-full", color)} style={{ width: `${score}%` }} />
                </div>
            </CardContent>
        </Card>
    )
}

function InsightCard({ title, icon, data }: { title: string, icon: React.ReactNode, data: Record<string, any> }) {
    if (Object.keys(data).length === 0) return null
    return (
        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-sm font-medium">
                                {Array.isArray(value) ? value.join(", ") : String(value)}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function SkillsCard({ data }: { data: Record<string, any> }) {
    if (Object.keys(data).length === 0) return null
    return (
        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border/50 lg:col-span-2">
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Code className="text-violet-500" />
                    AI Assessed Skills
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Technical Skills</p>
                        <div className="flex flex-wrap gap-2">
                            {(data.technical || []).map((skill: string) => (
                                <Badge key={skill} variant="default" className="bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 border-violet-500/20">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Soft Skills</p>
                        <div className="flex flex-wrap gap-2">
                            {(data.soft || []).map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border-transparent">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}