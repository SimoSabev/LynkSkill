"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@clerk/nextjs"
import { FileUpload } from "@/components/file-upload"
import { toast } from "sonner"
import {
    User,
    Briefcase,
    GraduationCap,
    Code,
    Award,
    LinkIcon,
    Plus,
    X,
    Edit3,
    Save,
    Heart,
    Zap,
    Target,
    Coffee,
    Music,
    Camera,
    Gamepad2,
    Book,
    Plane,
    Palette,
    Dumbbell,
    MapPin,
    Calendar,
    ExternalLink,
    FileText,
    ImageIcon,
    Download,
    Cpu,
    Database,
    Globe,
    Layers,
    Terminal,
    Box,
    Cloud,
    GitBranch,
    Sparkles,
    Paintbrush,
    Settings,
    AlertCircle,
    Bot,
} from "lucide-react"
import AIMascotScene from "./AIMascotScene"
import { useTranslation } from "@/lib/i18n"

interface FileAttachment {
    id: string
    name: string
    url: string
    type: string
    size: number
    path?: string
}

interface Education {
    school: string
    degree: string
    startYear: number
    endYear?: number
    attachments?: FileAttachment[]
}

interface Project {
    title: string
    description: string
    link?: string
    techStack?: string[]
    attachments?: FileAttachment[]
}

interface Certification {
    name: string
    authority: string
    issuedAt: string
    expiresAt?: string
    attachments?: FileAttachment[]
}

interface PortfolioData {
    fullName?: string
    headline?: string
    age?: number
    bio?: string
    skills: string[]
    interests: string[]
    experience?: string
    education: Education[]
    projects: Project[]
    certifications: Certification[]
    linkedin?: string
    github?: string
    portfolioUrl?: string
    needsApproval: boolean
    approvedBy?: string
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
    // AI Mode tracking
    aiModeSessionId?: string
    aiGeneratedAt?: string
    aiGeneratedFields?: string[]
}

const PREDEFINED_SKILLS = [
    { name: "JavaScript", icon: <Code className="h-4 w-4" /> },
    { name: "React", icon: <Layers className="h-4 w-4" /> },
    { name: "Node.js", icon: <Terminal className="h-4 w-4" /> },
    { name: "Python", icon: <Cpu className="h-4 w-4" /> },
    { name: "TypeScript", icon: <Code className="h-4 w-4" /> },
    { name: "Next.js", icon: <Zap className="h-4 w-4" /> },
    { name: "Vue.js", icon: <Layers className="h-4 w-4" /> },
    { name: "Angular", icon: <Box className="h-4 w-4" /> },
    { name: "PHP", icon: <Globe className="h-4 w-4" /> },
    { name: "Java", icon: <Coffee className="h-4 w-4" /> },
    { name: "C++", icon: <Zap className="h-4 w-4" /> },
    { name: "Go", icon: <Terminal className="h-4 w-4" /> },
    { name: "Rust", icon: <Settings className="h-4 w-4" /> },
    { name: "Swift", icon: <Sparkles className="h-4 w-4" /> },
    { name: "Kotlin", icon: <Code className="h-4 w-4" /> },
    { name: "SQL", icon: <Database className="h-4 w-4" /> },
    { name: "MongoDB", icon: <Database className="h-4 w-4" /> },
    { name: "PostgreSQL", icon: <Database className="h-4 w-4" /> },
    { name: "Docker", icon: <Box className="h-4 w-4" /> },
    { name: "AWS", icon: <Cloud className="h-4 w-4" /> },
    { name: "Git", icon: <GitBranch className="h-4 w-4" /> },
    { name: "GraphQL", icon: <Globe className="h-4 w-4" /> },
    { name: "Machine Learning", icon: <Cpu className="h-4 w-4" /> },
    { name: "UI/UX Design", icon: <Paintbrush className="h-4 w-4" /> },
    { name: "DevOps", icon: <Settings className="h-4 w-4" /> },
]

const PREDEFINED_INTERESTS = [
    { name: "Photography", icon: <Camera className="h-4 w-4" /> },
    { name: "Music", icon: <Music className="h-4 w-4" /> },
    { name: "Gaming", icon: <Gamepad2 className="h-4 w-4" /> },
    { name: "Reading", icon: <Book className="h-4 w-4" /> },
    { name: "Travel", icon: <Plane className="h-4 w-4" /> },
    { name: "Art", icon: <Palette className="h-4 w-4" /> },
    { name: "Fitness", icon: <Dumbbell className="h-4 w-4" /> },
    { name: "Cooking", icon: <Coffee className="h-4 w-4" /> },
    { name: "Technology", icon: <Zap className="h-4 w-4" /> },
    { name: "Sports", icon: <Target className="h-4 w-4" /> },
]

const validateYear = (year: number, fieldName: string): string | null => {
    const currentYear = new Date().getFullYear()
    if (!year || isNaN(year)) return `${fieldName} is required`
    if (year < 1950) return `${fieldName} cannot be before 1950`
    if (year > currentYear + 10) return `${fieldName} cannot be more than 10 years in the future`
    return null
}

const validateCustomText = (text: string): string | null => {
    if (!text || text.trim().length === 0) return "Cannot be empty"
    if (text.length > 50) return "Maximum 50 characters"

    const inappropriateWords = ["badword1", "badword2"]
    const lowerText = text.toLowerCase()
    for (const word of inappropriateWords) {
        if (lowerText.includes(word)) {
            return "Inappropriate content detected"
        }
    }

    if (!/^[a-zA-Z0-9\s\-.+#/]+$/.test(text)) {
        return "Only letters, numbers, and basic punctuation allowed"
    }

    return null
}

const AttachmentDisplay = ({ attachments }: { attachments?: FileAttachment[] }) => {
    if (!attachments || attachments.length === 0) return null

    return (
        <div className="mt-4 space-y-2">
            <h5 className="text-sm font-semibold text-muted-foreground">Attachments:</h5>
            <div className="flex flex-wrap gap-2">
                {attachments.map((file) => (
                    <motion.a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-2 bg-accent/50 rounded-xl border border-border hover:bg-accent transition-colors"
                    >
                        {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                        ) : (
                            <FileText className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm font-medium truncate max-w-32">{file.name}</span>
                        <Download className="h-3 w-3 text-muted-foreground" />
                    </motion.a>
                ))}
            </div>
        </div>
    )
}

export function Portfolio({ userType }: { userType: "Student" | "Company" }) {
    const { t } = useTranslation()
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    // activeSection tracks which portfolio section is being edited
    const [, setActiveSection] = useState<string | null>(null)

    const [customSkillInput, setCustomSkillInput] = useState("")
    const [customInterestInput, setCustomInterestInput] = useState("")
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    //AI Assistant State
    const [aiReply, setAiReply] = useState<string | null>(null)
    const [loadingAi, setLoadingAi] = useState(false)
    const [showMascot, setShowMascot] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    const { user } = useUser()

    useEffect(() => {
        async function fetchPortfolio() {
            const res = await fetch("/api/portfolio")
            if (res.ok) {
                const data = await res.json()
                setPortfolio({
                    ...data,
                    skills: data.skills ?? [],
                    interests: data.interests ?? [],
                    education: data.education ?? [],
                    projects: data.projects ?? [],
                    certifications: data.certifications ?? [],
                })
            } else {
                setPortfolio({
                    fullName: "John Doe",
                    headline: "Full Stack Developer",
                    age: 15,
                    bio: "Passionate developer with experience in modern web technologies. I love creating innovative solutions and learning new technologies.",
                    skills: ["JavaScript", "React", "Node.js", "TypeScript"],
                    interests: ["Technology", "Photography", "Travel"],
                    education: [
                        {
                            school: "University of Technology",
                            degree: "Bachelor of Computer Science",
                            startYear: 2020,
                            endYear: 2024,
                            attachments: [],
                        },
                    ],
                    projects: [
                        {
                            title: "E-commerce Platform",
                            description: "A full-stack e-commerce solution built with React and Node.js",
                            link: "https://github.com/johndoe/ecommerce",
                            attachments: [],
                        },
                    ],
                    certifications: [
                        {
                            name: "AWS Certified Developer",
                            authority: "Amazon Web Services",
                            issuedAt: "2024-01-15",
                            attachments: [],
                        },
                    ],
                    linkedin: "https://linkedin.com/in/johndoe",
                    github: "https://github.com/johndoe",
                    portfolioUrl: "https://johndoe.dev",
                    needsApproval: false,
                    approvalStatus: "APPROVED",
                })
            }
            setLoading(false)
        }

        fetchPortfolio()
    }, [])

    async function handleSave() {
        const errors: Record<string, string> = {}

        portfolio?.education.forEach((edu, i) => {
            const startError = validateYear(edu.startYear, "Start year")
            if (startError) errors[`education-${i}-start`] = startError

            if (edu.endYear) {
                const endError = validateYear(edu.endYear, "End year")
                if (endError) errors[`education-${i}-end`] = endError

                if (!startError && !endError && edu.endYear < edu.startYear) {
                    errors[`education-${i}-end`] = "End year must be after start year"
                }
            }
        })

        portfolio?.certifications.forEach((cert, i) => {
            const issuedDate = new Date(cert.issuedAt)
            if (isNaN(issuedDate.getTime())) {
                errors[`cert-${i}-issued`] = "Invalid date format"
            } else if (issuedDate > new Date()) {
                errors[`cert-${i}-issued`] = "Issue date cannot be in the future"
            }

            if (cert.expiresAt) {
                const expiresDate = new Date(cert.expiresAt)
                if (isNaN(expiresDate.getTime())) {
                    errors[`cert-${i}-expires`] = "Invalid date format"
                } else if (expiresDate < issuedDate) {
                    errors[`cert-${i}-expires`] = "Expiry date must be after issue date"
                }
            }
        })

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors)
            toast.error("Please fix validation errors before saving")
            return
        }

        setValidationErrors({})

        try {
            const res = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(portfolio),
            })

            if (res.ok) {
                setIsEditing(false)
                setActiveSection(null)
                toast.success("Portfolio saved successfully!")
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to save portfolio")
            }
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Failed to save portfolio")
        }
    }

    const toggleSkill = (skillName: string) => {
        setPortfolio((prev) => {
            if (!prev) return prev
            const skills = prev.skills.includes(skillName)
                ? prev.skills.filter((s) => s !== skillName)
                : [...prev.skills, skillName]
            return { ...prev, skills }
        })
    }

    const toggleInterest = (interestName: string) => {
        setPortfolio((prev) => {
            if (!prev) return prev
            const interests = prev.interests.includes(interestName)
                ? prev.interests.filter((i) => i !== interestName)
                : [...prev.interests, interestName]
            return { ...prev, interests }
        })
    }

    const handleAddCustomSkill = () => {
        const error = validateCustomText(customSkillInput)
        if (error) {
            setValidationErrors({ ...validationErrors, customSkill: error })
            return
        }

        if (portfolio && !portfolio.skills.includes(customSkillInput.trim())) {
            setPortfolio((prev) => ({
                ...prev!,
                skills: [...prev!.skills, customSkillInput.trim()],
            }))
            setCustomSkillInput("")
            setValidationErrors({ ...validationErrors, customSkill: "" })
        }
    }

    const handleAddCustomInterest = () => {
        const error = validateCustomText(customInterestInput)
        if (error) {
            setValidationErrors({ ...validationErrors, customInterest: error })
            return
        }

        if (portfolio && !portfolio.interests.includes(customInterestInput.trim())) {
            setPortfolio((prev) => ({
                ...prev!,
                interests: [...prev!.interests, customInterestInput.trim()],
            }))
            setCustomInterestInput("")
            setValidationErrors({ ...validationErrors, customInterest: "" })
        }
    }

    const removeSkill = (skill: string) => {
        setPortfolio((prev) => ({
            ...prev!,
            skills: prev!.skills.filter((s) => s !== skill),
        }))
    }

    const removeInterest = (interest: string) => {
        setPortfolio((prev) => ({
            ...prev!,
            interests: prev!.interests.filter((i) => i !== interest),
        }))
    }

    // AI FUNCTION - Available for future AI recommendations feature
    const _getAiRecommendations = async () => {
        if (!portfolio) return
        setLoadingAi(true)
        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Give constructive portfolio improvement tips for this student: ${JSON.stringify(portfolio, null, 2)}`,
                }),
            })
            const data = await res.json()
            setAiReply(data.reply)
        } catch (err) {
            console.error("AI error:", err)
            setAiReply("Something went wrong while getting recommendations.")
        }
        setLoadingAi(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8 space-y-8">
                    <div className="h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20  rounded-3xl animate-pulse" />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-card/60 rounded-3xl animate-pulse shadow-sm" />
                    ))}
                </div>
            </div>
        )
    }

    const displayName = user?.fullName || portfolio?.fullName || "Professional Portfolio"

    return (
        <div className="min-h-screen bg-background">
            <div className="relative">
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative min-h-[600px] p-10 overflow-hidden"
                >
                    <div className="absolute rounded-3xl inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 ">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 0],
                            }}
                            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
                            className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                rotate: [0, -90, 0],
                            }}
                            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
                            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/30 rounded-full blur-3xl"
                        />
                    </div>

                    <div className="container mx-auto px-4 py-16 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-white space-y-6"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    className="h-32 w-32 rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center border-4 border-white/30 shadow-2xl"
                                >
                                    <User className="h-16 w-16" />
                                </motion.div>

                                <div className="space-y-4">
                                    <h1 className="text-6xl font-bold text-balance leading-tight">{displayName}</h1>
                                    <p className="text-2xl font-semibold text-white/95">
                                        {portfolio?.headline || "Professional Portfolio"}
                                    </p>

                                    <div className="flex flex-wrap gap-3 pt-4">
                                        {portfolio?.age && (
                                            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                                                <Calendar className="h-5 w-5" />
                                                <span className="font-semibold">{portfolio.age} years old</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                                            <MapPin className="h-5 w-5" />
                                            <span className="font-semibold">Available</span>
                                        </div>
                                        {portfolio?.needsApproval && (
                                            <Badge
                                                variant={
                                                    portfolio.approvalStatus === "APPROVED"
                                                        ? "default"
                                                        : portfolio.approvalStatus === "PENDING"
                                                            ? "secondary"
                                                            : "destructive"
                                                }
                                                className="rounded-2xl text-base px-6 py-3 bg-white/20 border-white/30 font-bold"
                                            >
                                                {portfolio.approvalStatus}
                                            </Badge>
                                        )}
                                        {portfolio?.aiModeSessionId && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center gap-2 bg-gradient-to-r from-violet-500/30 to-purple-500/30 backdrop-blur-md px-5 py-3 rounded-2xl border border-violet-400/40 cursor-pointer hover:border-violet-400/60 transition-colors"
                                                title={`Generated from AI Mode session on ${portfolio.aiGeneratedAt ? new Date(portfolio.aiGeneratedAt).toLocaleDateString() : 'Unknown date'}`}
                                            >
                                                <Bot className="h-5 w-5 text-violet-200" />
                                                <span className="font-semibold text-violet-100">AI Generated</span>
                                                <Sparkles className="h-4 w-4 text-violet-200" />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="bg-white/15 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white/20 text-white"
                                    >
                                        <Code className="h-8 w-8 mb-3" />
                                        <div className="text-3xl font-bold">{portfolio?.skills?.length || 0}</div>
                                        <div className="text-white/80 font-medium">{t('portfolio.skills')}</div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="bg-white/15 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white/20 text-white"
                                    >
                                        <Briefcase className="h-8 w-8 mb-3" />
                                        <div className="text-3xl font-bold">{portfolio?.projects?.length || 0}</div>
                                        <div className="text-white/80 font-medium">Projects</div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="bg-white/15 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white/20 text-white"
                                    >
                                        <Award className="h-8 w-8 mb-3" />
                                        <div className="text-3xl font-bold">{portfolio?.certifications?.length || 0}</div>
                                        <div className="text-white/80 font-medium">Certificates</div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        className="bg-white/15 backdrop-blur-xl rounded-[1.5rem] p-6 border border-white/20 text-white"
                                    >
                                        <GraduationCap className="h-8 w-8 mb-3" />
                                        <div className="text-3xl font-bold">{portfolio?.education?.length || 0}</div>
                                        <div className="text-white/80 font-medium">Education</div>
                                    </motion.div>
                                </div>

                                {userType === "Student" && (
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                                            className="w-full rounded-[1.5rem] bg-white text-purple-600 hover:bg-white/90 px-8 py-8 font-bold text-xl shadow-2xl hover:shadow-white/50 transition-all duration-300"
                                            size="lg"
                                        >
                                            {isEditing ? (
                                                <>
                                                    <Save className="mr-3 h-6 w-6" />
                                                    Save All Changes
                                                </>
                                            ) : (
                                                <>
                                                    <Edit3 className="mr-3 h-6 w-6" />
                                                    Edit Portfolio
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                )}
                                {/*AI RECCOMMENDATION BUTTON*/}
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={async () => {
                                            if (!portfolio || isGenerating) return
                                            setIsGenerating(true)
                                            try {
                                                // Convert portfolio data to match backend expectations
                                                const portfolioPayload = {
                                                    fullName: portfolio?.fullName || user?.fullName || "Student",
                                                    headline: portfolio?.headline || null,
                                                    bio: portfolio?.bio || null,
                                                    skills: portfolio?.skills?.join(", ") || null,
                                                    projects: portfolio?.projects?.map(p =>
                                                        `${p.title}: ${p.description}${p.link ? ` (${p.link})` : ""}${p.techStack ? ` [${p.techStack.join(", ")}]` : ""}`
                                                    ).join("\n\n") || null,
                                                    experience: portfolio?.experience || null,
                                                    education: portfolio?.education?.map(e =>
                                                        `${e.school} - ${e.degree}${e.startYear ? ` (${e.startYear}${e.endYear ? `-${e.endYear}` : "-Present"})` : ""}`
                                                    ).join("\n") || null,
                                                    linkedin: portfolio?.linkedin || null,
                                                    github: portfolio?.github || null,
                                                    portfolioUrl: portfolio?.portfolioUrl || null,
                                                }

                                                const res = await fetch("/api/assistant", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        type: "portfolio-audit",
                                                        portfolio: portfolioPayload,
                                                        studentId: user?.id
                                                    }),
                                                })
                                                const data = await res.json()
                                                setAiReply(data.reply)
                                                setShowMascot(true)
                                            } catch (err) {
                                                console.error("AI error:", err)
                                                setAiReply("Something went wrong while getting recommendations.")
                                                setShowMascot(true)
                                            } finally {
                                                setIsGenerating(false)
                                            }
                                        }}
                                        disabled={loadingAi || isGenerating}
                                        className="w-full mt-4 rounded-[1.5rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-8 font-bold text-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
                                        size="lg"
                                    >
                                        <Sparkles className="mr-3 h-6 w-6" />
                                        {loadingAi || isGenerating ? "Thinking..." : "Ask Linky for Feedback"}
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                <div className="container mx-auto px-4 mt-20 relative z-20">
                    <div className="space-y-8">
                        {/* AI Mode Session Info Banner */}
                        {portfolio?.aiModeSessionId && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl rounded-[2rem] shadow-lg border-2 border-violet-500/30 overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            AI Mode Generated Portfolio
                                            <Sparkles className="h-4 w-4" />
                                        </h3>
                                        <p className="text-white/80 text-sm">
                                            Some parts of this portfolio were created with help from Linky, your AI Career Assistant
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-card/50 rounded-xl p-4 border border-violet-500/20">
                                            <p className="text-xs text-muted-foreground mb-1">Session ID</p>
                                            <p className="font-mono text-sm text-violet-600 dark:text-violet-400 truncate">
                                                {portfolio.aiModeSessionId}
                                            </p>
                                        </div>
                                        <div className="bg-card/50 rounded-xl p-4 border border-violet-500/20">
                                            <p className="text-xs text-muted-foreground mb-1">Generated On</p>
                                            <p className="font-medium text-sm">
                                                {portfolio.aiGeneratedAt 
                                                    ? new Date(portfolio.aiGeneratedAt).toLocaleString() 
                                                    : "Unknown"}
                                            </p>
                                        </div>
                                        <div className="bg-card/50 rounded-xl p-4 border border-violet-500/20">
                                            <p className="text-xs text-muted-foreground mb-1">AI Generated Fields</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(portfolio.aiGeneratedFields || []).map((field, i) => (
                                                    <Badge 
                                                        key={i} 
                                                        variant="secondary" 
                                                        className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                                    >
                                                        {field}
                                                    </Badge>
                                                ))}
                                                {(!portfolio.aiGeneratedFields || portfolio.aiGeneratedFields.length === 0) && (
                                                    <span className="text-sm text-muted-foreground">None tracked</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid lg:grid-cols-3 gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:col-span-2 bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-border overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <User className="h-6 w-6" />
                                        </div>
                                        About Me
                                    </h2>
                                </div>
                                <div className="p-8">
                                    {isEditing ? (
                                        <Textarea
                                            placeholder="Write a compelling bio..."
                                            value={portfolio?.bio || ""}
                                            onChange={(e) => setPortfolio((prev) => ({ ...prev!, bio: e.target.value }))}
                                            className="min-h-40 rounded-[1.5rem] border-2 text-lg"
                                        />
                                    ) : (
                                        <p className="text-muted-foreground leading-relaxed text-lg">
                                            {portfolio?.bio || "No bio added yet. Share your story!"}
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-border overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <LinkIcon className="h-6 w-6" />
                                        </div>
                                        Links
                                    </h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="LinkedIn URL"
                                                value={portfolio?.linkedin || ""}
                                                onChange={(e) =>
                                                    setPortfolio((prev) => ({
                                                        ...prev!,
                                                        linkedin: e.target.value,
                                                    }))
                                                }
                                                className="rounded-xl"
                                            />
                                            <Input
                                                placeholder="GitHub URL"
                                                value={portfolio?.github || ""}
                                                onChange={(e) =>
                                                    setPortfolio((prev) => ({
                                                        ...prev!,
                                                        github: e.target.value,
                                                    }))
                                                }
                                                className="rounded-xl"
                                            />
                                            <Input
                                                placeholder="Portfolio URL"
                                                value={portfolio?.portfolioUrl || ""}
                                                onChange={(e) =>
                                                    setPortfolio((prev) => ({
                                                        ...prev!,
                                                        portfolioUrl: e.target.value,
                                                    }))
                                                }
                                                className="rounded-xl"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {portfolio?.linkedin && (
                                                <motion.a
                                                    href={portfolio.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    whileHover={{ scale: 1.05, x: 5 }}
                                                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all"
                                                >
                                                    <LinkIcon className="h-5 w-5" />
                                                    <span className="font-semibold">LinkedIn</span>
                                                    <ExternalLink className="h-4 w-4 ml-auto" />
                                                </motion.a>
                                            )}
                                            {portfolio?.github && (
                                                <motion.a
                                                    href={portfolio.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    whileHover={{ scale: 1.05, x: 5 }}
                                                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all"
                                                >
                                                    <Code className="h-5 w-5" />
                                                    <span className="font-semibold">GitHub</span>
                                                    <ExternalLink className="h-4 w-4 ml-auto" />
                                                </motion.a>
                                            )}
                                            {portfolio?.portfolioUrl && (
                                                <motion.a
                                                    href={portfolio.portfolioUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    whileHover={{ scale: 1.05, x: 5 }}
                                                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all"
                                                >
                                                    <Globe className="h-5 w-5" />
                                                    <span className="font-semibold">Portfolio</span>
                                                    <ExternalLink className="h-4 w-4 ml-auto" />
                                                </motion.a>
                                            )}
                                            {!portfolio?.linkedin && !portfolio?.github && !portfolio?.portfolioUrl && (
                                                <div className="text-center py-8">
                                                    <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                                    <p className="text-muted-foreground text-sm">No links yet</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-border overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Code className="h-6 w-6" />
                                    </div>
                                    Technical Skills
                                </h2>
                            </div>
                            <div className="p-8">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {PREDEFINED_SKILLS.map((skill) => (
                                                <motion.button
                                                    key={skill.name}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => toggleSkill(skill.name)}
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        portfolio?.skills.includes(skill.name)
                                                            ? "border-purple-500 bg-gradient-to-r from-purple-500/10 to-blue-500/10 shadow-lg"
                                                            : "border-border hover:border-purple-400"
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        {skill.icon}
                                                        <span className="text-xs font-semibold">{skill.name}</span>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-muted-foreground">Add Custom Skill</h4>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g., Figma, Photoshop..."
                                                    value={customSkillInput}
                                                    onChange={(e) => setCustomSkillInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomSkill()}
                                                    className="rounded-xl"
                                                />
                                                <Button onClick={handleAddCustomSkill} className="rounded-xl">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {validationErrors.customSkill && (
                                                <div className="flex items-center gap-2 text-destructive text-sm">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {validationErrors.customSkill}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {portfolio?.skills?.length ? (
                                            portfolio.skills.map((skill, i) => (
                                                <motion.div
                                                    key={skill}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    whileHover={{ scale: 1.1, y: -5 }}
                                                    className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-4 rounded-xl shadow-lg hover:shadow-2xl transition-all relative group"
                                                >
                                                    {isEditing && (
                                                        <button
                                                            onClick={() => removeSkill(skill)}
                                                            className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-3 w-3 text-white" />
                                                        </button>
                                                    )}
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        {PREDEFINED_SKILLS.find((s) => s.name === skill)?.icon || <Code className="h-5 w-5" />}
                                                        <span className="font-bold text-sm">{skill}</span>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center py-12">
                                                <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">No skills added yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-border overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Heart className="h-6 w-6" />
                                    </div>
                                    Interests & Hobbies
                                </h2>
                            </div>
                            <div className="p-8">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
                                            {PREDEFINED_INTERESTS.map((interest) => (
                                                <motion.button
                                                    key={interest.name}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => toggleInterest(interest.name)}
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        portfolio?.interests.includes(interest.name)
                                                            ? "border-purple-500 bg-gradient-to-r from-purple-500/10 to-blue-500/10 shadow-lg"
                                                            : "border-border hover:border-purple-400"
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        {interest.icon}
                                                        <span className="text-xs font-semibold text-center">{interest.name}</span>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-muted-foreground">Add Custom Interest</h4>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g., Hiking, Volunteering..."
                                                    value={customInterestInput}
                                                    onChange={(e) => setCustomInterestInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomInterest()}
                                                    className="rounded-xl"
                                                />
                                                <Button onClick={handleAddCustomInterest} className="rounded-xl">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {validationErrors.customInterest && (
                                                <div className="flex items-center gap-2 text-destructive text-sm">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {validationErrors.customInterest}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {portfolio?.interests?.length ? (
                                            portfolio.interests.map((interest, i) => (
                                                <motion.div
                                                    key={interest}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    whileHover={{ scale: 1.1 }}
                                                    className="bg-gradient-to-br from-purple-600 to-blue-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all relative group"
                                                >
                                                    {isEditing && (
                                                        <button
                                                            onClick={() => removeInterest(interest)}
                                                            className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-3 w-3 text-white" />
                                                        </button>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        {PREDEFINED_INTERESTS.find((int) => int.name === interest)?.icon || (
                                                            <Heart className="h-4 w-4" />
                                                        )}
                                                        <span className="font-bold text-sm">{interest}</span>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="w-full text-center py-12">
                                                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">No interests added yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-border overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    Projects
                                </h2>
                            </div>
                            <div className="p-8">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {(portfolio?.projects || []).map((proj, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-6 border-2 rounded-[1.25rem] bg-accent/50 border-border space-y-4 hover:shadow-lg transition-all duration-300"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-semibold text-accent-foreground">Project #{i + 1}</h4>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setPortfolio((prev) => ({
                                                                ...prev!,
                                                                projects: (prev?.projects || []).filter((_, idx) => idx !== i),
                                                            }))
                                                        }
                                                        className="rounded-xl"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Input
                                                    placeholder="Project Title"
                                                    value={proj.title || ""}
                                                    onChange={(e) => {
                                                        const copy = [...(portfolio?.projects || [])]
                                                        copy[i].title = e.target.value
                                                        setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                                    }}
                                                    className="rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500"
                                                />
                                                <Textarea
                                                    placeholder="Project Description"
                                                    value={proj.description || ""}
                                                    onChange={(e) => {
                                                        const copy = [...(portfolio?.projects || [])]
                                                        copy[i].description = e.target.value
                                                        setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                                    }}
                                                    className="rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500"
                                                />
                                                <Input
                                                    placeholder="Project Link (optional)"
                                                    value={proj.link || ""}
                                                    onChange={(e) => {
                                                        const copy = [...(portfolio?.projects || [])]
                                                        copy[i].link = e.target.value
                                                        setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                                    }}
                                                    className="rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500"
                                                />
                                                <div className="space-y-3">
                                                    <h5 className="font-medium text-accent-foreground">
                                                        Attach Files (screenshots, demos, documentation)
                                                    </h5>
                                                    <FileUpload
                                                        section="projects"
                                                        attachments={proj.attachments ?? []}
                                                        onAttachmentsChange={(newAttachments) => {
                                                            const copy = [...(portfolio?.projects || [])]
                                                            copy[i].attachments = newAttachments
                                                            setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                                        }}
                                                        maxFiles={10}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                        <Button
                                            onClick={() =>
                                                setPortfolio((prev) => ({
                                                    ...prev!,
                                                    projects: [
                                                        ...(prev?.projects || []),
                                                        { title: "", description: "", link: "", attachments: [] },
                                                    ],
                                                }))
                                            }
                                            className="w-full rounded-xl border-2 border-dashed"
                                            variant="outline"
                                        >
                                            <Plus className="mr-2 h-5 w-5" />
                                            Add Project
                                        </Button>
                                    </div>
                                ) : portfolio?.projects?.length ? (
                                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                        {portfolio.projects.map((proj, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                whileHover={{ scale: 1.02, y: -5 }}
                                                className="break-inside-avoid bg-gradient-to-br from-accent to-accent/50 p-6 rounded-[1.5rem] shadow-xl border-2 border-border hover:shadow-2xl transition-all"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                                                        <Briefcase className="h-6 w-6 text-white" />
                                                    </div>
                                                    {proj.link && (
                                                        <motion.a
                                                            href={proj.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            whileHover={{ scale: 1.1 }}
                                                            className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg"
                                                        >
                                                            <ExternalLink className="h-4 w-4 text-white" />
                                                        </motion.a>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-xl mb-2">{proj.title}</h4>
                                                <p className="text-muted-foreground leading-relaxed">{proj.description}</p>
                                                <AttachmentDisplay attachments={proj.attachments} />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No projects added yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-border overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <GraduationCap className="h-6 w-6" />
                                        </div>
                                        Education
                                    </h2>
                                </div>
                                <div className="p-8">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            {(portfolio?.education || []).map((edu, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="p-6 border-2 rounded-[1.25rem] bg-accent/50 border-border space-y-4 hover:shadow-lg transition-all duration-300"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-semibold text-accent-foreground">Education #{i + 1}</h4>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                setPortfolio((prev) => ({
                                                                    ...prev!,
                                                                    education: (prev?.education || []).filter((_, idx) => idx !== i),
                                                                }))
                                                            }
                                                            className="rounded-xl"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            placeholder="School/University"
                                                            value={edu.school || ""}
                                                            onChange={(e) =>
                                                                setPortfolio((prev) => {
                                                                    const copy = [...(prev?.education || [])]
                                                                    copy[i].school = e.target.value
                                                                    return { ...prev!, education: copy }
                                                                })
                                                            }
                                                            className="rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500"
                                                        />
                                                        <Input
                                                            placeholder="Degree/Program"
                                                            value={edu.degree || ""}
                                                            onChange={(e) =>
                                                                setPortfolio((prev) => {
                                                                    const copy = [...(prev?.education || [])]
                                                                    copy[i].degree = e.target.value
                                                                    return { ...prev!, education: copy }
                                                                })
                                                            }
                                                            className="rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500"
                                                        />
                                                        <div className="space-y-1">
                                                            <Input
                                                                placeholder="Start Year"
                                                                type="number"
                                                                value={edu.startYear || ""}
                                                                onChange={(e) =>
                                                                    setPortfolio((prev) => {
                                                                        const copy = [...(prev?.education || [])]
                                                                        copy[i].startYear = Number(e.target.value)
                                                                        return { ...prev!, education: copy }
                                                                    })
                                                                }
                                                                className={`rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500 ${
                                                                    validationErrors[`education-${i}-start`] ? "border-destructive" : ""
                                                                }`}
                                                            />
                                                            {validationErrors[`education-${i}-start`] && (
                                                                <div className="flex items-center gap-1 text-destructive text-xs">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {validationErrors[`education-${i}-start`]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Input
                                                                placeholder="End Year (or leave empty if current)"
                                                                type="number"
                                                                value={edu.endYear || ""}
                                                                onChange={(e) =>
                                                                    setPortfolio((prev) => {
                                                                        const copy = [...(prev?.education || [])]
                                                                        copy[i].endYear = Number(e.target.value)
                                                                        return { ...prev!, education: copy }
                                                                    })
                                                                }
                                                                className={`rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500 ${
                                                                    validationErrors[`education-${i}-end`] ? "border-destructive" : ""
                                                                }`}
                                                            />
                                                            {validationErrors[`education-${i}-end`] && (
                                                                <div className="flex items-center gap-1 text-destructive text-xs">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {validationErrors[`education-${i}-end`]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h5 className="font-medium text-accent-foreground">
                                                            Attach Files (transcripts, certificates, etc.)
                                                        </h5>
                                                        <FileUpload
                                                            section="education"
                                                            attachments={edu.attachments ?? []}
                                                            onAttachmentsChange={(newAttachments) => {
                                                                const copy = [...(portfolio?.education || [])]
                                                                copy[i].attachments = newAttachments
                                                                setPortfolio((prev) => ({ ...prev!, education: copy }))
                                                            }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            ))}
                                            <Button
                                                onClick={() =>
                                                    setPortfolio((prev) => ({
                                                        ...prev!,
                                                        education: [
                                                            ...(prev?.education || []),
                                                            {
                                                                school: "",
                                                                degree: "",
                                                                startYear: new Date().getFullYear(),
                                                                attachments: [],
                                                            },
                                                        ],
                                                    }))
                                                }
                                                className="w-full rounded-xl border-2 border-dashed"
                                                variant="outline"
                                            >
                                                <Plus className="mr-2 h-5 w-5" />
                                                Add Education
                                            </Button>
                                        </div>
                                    ) : portfolio?.education?.length ? (
                                        <div className="space-y-4">
                                            {portfolio.education.map((edu, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    whileHover={{ x: 5 }}
                                                    className="relative pl-6 border-l-4 border-purple-500"
                                                >
                                                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full border-4 border-card"></div>
                                                    <div className="bg-accent/50 p-5 rounded-xl">
                                                        <h4 className="font-bold text-lg mb-1">{edu.degree}</h4>
                                                        <p className="text-muted-foreground font-semibold">{edu.school}</p>
                                                        <p className="text-muted-foreground text-sm">
                                                            {edu.startYear} - {edu.endYear || "Present"}
                                                        </p>
                                                        <AttachmentDisplay attachments={edu.attachments} />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No education added yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-border overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Award className="h-6 w-6" />
                                        </div>
                                        Certifications
                                    </h2>
                                </div>
                                <div className="p-8">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            {(portfolio?.certifications || []).map((cert, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="p-6 border-2 rounded-[1.25rem] bg-accent/50 border-border space-y-4 hover:shadow-lg transition-all duration-300"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-semibold text-accent-foreground">Certification #{i + 1}</h4>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                setPortfolio((prev) => ({
                                                                    ...prev!,
                                                                    certifications: (prev?.certifications || []).filter((_, idx) => idx !== i),
                                                                }))
                                                            }
                                                            className="rounded-xl"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                            placeholder="Certification Name"
                                                            value={cert.name || ""}
                                                            onChange={(e) => {
                                                                const copy = [...(portfolio?.certifications || [])]
                                                                copy[i].name = e.target.value
                                                                setPortfolio((prev) => ({
                                                                    ...prev!,
                                                                    certifications: copy,
                                                                }))
                                                            }}
                                                            className="rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500"
                                                        />
                                                        <Input
                                                            placeholder="Issuing Authority"
                                                            value={cert.authority || ""}
                                                            onChange={(e) => {
                                                                const copy = [...(portfolio?.certifications || [])]
                                                                copy[i].authority = e.target.value
                                                                setPortfolio((prev) => ({
                                                                    ...prev!,
                                                                    certifications: copy,
                                                                }))
                                                            }}
                                                            className="rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500"
                                                        />
                                                        <div className="space-y-1">
                                                            <Input
                                                                placeholder="Issue Date (YYYY-MM-DD)"
                                                                value={cert.issuedAt || ""}
                                                                onChange={(e) => {
                                                                    const copy = [...(portfolio?.certifications || [])]
                                                                    copy[i].issuedAt = e.target.value
                                                                    setPortfolio((prev) => ({
                                                                        ...prev!,
                                                                        certifications: copy,
                                                                    }))
                                                                }}
                                                                className={`rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500 ${
                                                                    validationErrors[`cert-${i}-issued`] ? "border-destructive" : ""
                                                                }`}
                                                            />
                                                            {validationErrors[`cert-${i}-issued`] && (
                                                                <div className="flex items-center gap-1 text-destructive text-xs">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {validationErrors[`cert-${i}-issued`]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Input
                                                                placeholder="Expiry Date (optional)"
                                                                value={cert.expiresAt || ""}
                                                                onChange={(e) => {
                                                                    const copy = [...(portfolio?.certifications || [])]
                                                                    copy[i].expiresAt = e.target.value
                                                                    setPortfolio((prev) => ({
                                                                        ...prev!,
                                                                        certifications: copy,
                                                                    }))
                                                                }}
                                                                className={`rounded-[1.25rem] border-2 focus:ring-2 focus:ring-purple-500 ${
                                                                    validationErrors[`cert-${i}-expires`] ? "border-destructive" : ""
                                                                }`}
                                                            />
                                                            {validationErrors[`cert-${i}-expires`] && (
                                                                <div className="flex items-center gap-1 text-destructive text-xs">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {validationErrors[`cert-${i}-expires`]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h5 className="font-medium text-accent-foreground">
                                                            Attach Files (certificates, badges, etc.)
                                                        </h5>
                                                        <FileUpload
                                                            section="certifications"
                                                            attachments={cert.attachments ?? []}
                                                            onAttachmentsChange={(newAttachments) => {
                                                                const copy = [...(portfolio?.certifications || [])]
                                                                copy[i].attachments = newAttachments
                                                                setPortfolio((prev) => ({
                                                                    ...prev!,
                                                                    certifications: copy,
                                                                }))
                                                            }}
                                                            maxFiles={5}
                                                        />
                                                    </div>
                                                </motion.div>
                                            ))}
                                            <Button
                                                onClick={() =>
                                                    setPortfolio((prev) => ({
                                                        ...prev!,
                                                        certifications: [
                                                            ...(prev?.certifications || []),
                                                            { name: "", authority: "", issuedAt: "", attachments: [] },
                                                        ],
                                                    }))
                                                }
                                                className="w-full rounded-xl border-2 border-dashed"
                                                variant="outline"
                                            >
                                                <Plus className="mr-2 h-5 w-5" />
                                                Add Certification
                                            </Button>
                                        </div>
                                    ) : portfolio?.certifications?.length ? (
                                        <div className="space-y-4">
                                            {portfolio.certifications.map((cert, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    whileHover={{ scale: 1.05 }}
                                                    className="bg-gradient-to-br from-accent to-accent/50 p-5 rounded-xl shadow-lg border-2 border-border"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <Award className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-lg mb-1">{cert.name}</h4>
                                                            <p className="text-muted-foreground font-semibold text-sm">{cert.authority}</p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {cert.issuedAt}
                                                                {cert.expiresAt && ` • Expires: ${cert.expiresAt}`}
                                                            </p>
                                                            <AttachmentDisplay attachments={cert.attachments} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No certifications added yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
            {showMascot && (
                <AIMascotScene
                    portfolio={portfolio ?? undefined}
                    aiReply={aiReply ?? "No reply yet."}
                    onClose={() => setShowMascot(false)}
                />
            )}
        </div>
    )
}