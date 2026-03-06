"use client"

import React from "react"
import { motion } from "framer-motion"
import {
    MapPin, DollarSign, Clock, Briefcase, ExternalLink,
    CheckCircle2, XCircle, Building2, User, Users,
    Calendar, MessageSquare, Star, BookOpen, FileText,
    TrendingUp, Bookmark, ChevronRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ToolResult {
    tool: string
    cardType: string
    title: string
    data: unknown
    success?: boolean
    error?: string
}

interface AgentActionCardProps {
    result: ToolResult
}

// ─── Main Dispatcher ────────────────────────────────────────────────────────

export function AgentActionCard({ result }: AgentActionCardProps) {
    const { cardType, title, data, error } = result

    if (error && !result.success) {
        return <ErrorCard title={title} error={error} />
    }

    switch (cardType) {
        case "internship-list":
            return <InternshipListCard title={title} items={data as InternshipItem[]} />
        case "internship-detail":
            return <InternshipDetailCard data={data as InternshipDetail} />
        case "application-list":
            return <ApplicationListCard title={title} items={data as ApplicationItem[]} />
        case "candidate-list":
            return <CandidateListCard title={title} items={data as CandidateItem[]} />
        case "interview-list":
            return <InterviewListCard title={title} items={data as InterviewItem[]} />
        case "conversation-list":
            return <ConversationListCard title={title} items={data as ConversationItem[]} />
        case "assignment-list":
            return <AssignmentListCard title={title} items={data as AssignmentItem[]} />
        case "portfolio-view":
            return <PortfolioCard data={data as PortfolioData} />
        case "stats":
            return <StatsCard title={title} data={data as Record<string, number | string>} />
        case "action-success":
            return <SuccessCard title={title} data={data as Record<string, unknown>} />
        case "error":
            return <ErrorCard title={title} error={error || "Unknown error"} />
        default:
            return null
    }
}

// ─── Card Wrapper ───────────────────────────────────────────────────────────

function CardWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "rounded-xl border border-border/40 bg-card/90 backdrop-blur-sm overflow-hidden shadow-sm",
                className
            )}
        >
            {children}
        </motion.div>
    )
}

function CardTitle({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-muted/20">
            <Icon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-semibold flex-1 text-foreground">{title}</span>
            {badge && (
                <Badge className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                    {badge}
                </Badge>
            )}
        </div>
    )
}

// ─── Internship List Card ───────────────────────────────────────────────────

interface InternshipItem {
    id: string
    title: string
    company: string
    companyLogo?: string
    location: string
    paid: boolean
    salary?: number | null
    description?: string
    applicationEnd?: string
    applicationsCount?: number
    requiresCoverLetter?: boolean
}

function InternshipListCard({ title, items }: { title: string; items: InternshipItem[] }) {
    if (!items || items.length === 0) {
        return <EmptyCard icon={Briefcase} message="No internships found" />
    }

    return (
        <CardWrapper>
            <CardTitle icon={Briefcase} title={title} badge={`${items.length}`} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 8).map((item) => (
                    <div key={item.id} className="px-3 py-2.5 hover:bg-muted/20 transition-colors group">
                        <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {item.company}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {item.location}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {item.paid ? (
                                    <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        <DollarSign className="h-3 w-3 mr-0.5" />
                                        {item.salary ? `${item.salary}/mo` : "Paid"}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">Unpaid</Badge>
                                )}
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        {item.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
                    </div>
                ))}
            </div>
            {items.length > 8 && (
                <div className="px-3 py-1.5 text-center text-[10px] text-muted-foreground bg-muted/20">
                    +{items.length - 8} more
                </div>
            )}
        </CardWrapper>
    )
}

// ─── Internship Detail Card ─────────────────────────────────────────────────

interface InternshipDetail {
    id: string
    title: string
    company: string
    description?: string
    qualifications?: string
    location: string
    paid: boolean
    salary?: number | null
    applicationStart?: string
    applicationEnd?: string
    applicationsCount?: number
    requiresCoverLetter?: boolean
}

function InternshipDetailCard({ data }: { data: InternshipDetail }) {
    return (
        <CardWrapper>
            <CardTitle icon={Briefcase} title={data.title} />
            <div className="p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {data.company}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {data.location}
                    </span>
                    {data.paid && data.salary && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            ${data.salary}/mo
                        </Badge>
                    )}
                    {data.requiresCoverLetter && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <FileText className="h-3 w-3 mr-0.5" /> Cover Letter Required
                        </Badge>
                    )}
                </div>
                {data.description && (
                    <p className="text-xs text-muted-foreground line-clamp-4">{data.description}</p>
                )}
                {data.applicationEnd && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Deadline: {new Date(data.applicationEnd).toLocaleDateString()}
                    </p>
                )}
            </div>
        </CardWrapper>
    )
}

// ─── Application List Card ──────────────────────────────────────────────────

interface ApplicationItem {
    id: string
    status: string
    internshipTitle: string
    companyName?: string
    studentName?: string
    createdAt?: string
    hasCoverLetter?: boolean
}

function ApplicationListCard({ title, items }: { title: string; items: ApplicationItem[] }) {
    if (!items || items.length === 0) {
        return <EmptyCard icon={FileText} message="No applications found" />
    }

    const statusColor = (s: string) => {
        switch (s) {
            case "APPROVED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            case "REJECTED": return "bg-red-500/10 text-red-500 border-red-500/20"
            default: return "bg-amber-500/10 text-amber-500 border-amber-500/20"
        }
    }

    return (
        <CardWrapper>
            <CardTitle icon={FileText} title={title} badge={`${items.length}`} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 8).map((item) => (
                    <div key={item.id} className="px-3 py-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.internshipTitle}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {item.companyName || item.studentName}
                                {item.createdAt && ` · ${new Date(item.createdAt).toLocaleDateString()}`}
                            </p>
                        </div>
                        <Badge className={cn("text-[10px] px-1.5 py-0 flex-shrink-0", statusColor(item.status))}>
                            {item.status}
                        </Badge>
                    </div>
                ))}
            </div>
        </CardWrapper>
    )
}

// ─── Candidate List Card ────────────────────────────────────────────────────

interface CandidateItem {
    id: string
    name: string
    email: string
    headline?: string
    skills: string[]
    matchScore: number
    reasons: string[]
    projectCount?: number
}

function CandidateListCard({ title, items }: { title: string; items: CandidateItem[] }) {
    if (!items || items.length === 0) {
        return <EmptyCard icon={Users} message="No candidates found" />
    }

    return (
        <CardWrapper>
            <CardTitle icon={User} title={title} badge={`${items.length}`} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 6).map((item) => (
                    <div key={item.id} className="px-3 py-2.5">
                        <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{item.name}</p>
                                {item.headline && (
                                    <p className="text-[11px] text-muted-foreground truncate">{item.headline}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <Star className="h-3 w-3 text-amber-400" />
                                <span className="text-xs font-semibold">{item.matchScore}%</span>
                            </div>
                        </div>
                        {item.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.skills.slice(0, 5).map(skill => (
                                    <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">{skill}</Badge>
                                ))}
                                {item.skills.length > 5 && (
                                    <span className="text-[10px] text-muted-foreground">+{item.skills.length - 5}</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </CardWrapper>
    )
}

// ─── Interview List Card ────────────────────────────────────────────────────

interface InterviewItem {
    id: string
    scheduledAt: string
    location?: string
    status: string
    internshipTitle: string
    companyName?: string
    studentName?: string
}

function InterviewListCard({ title, items }: { title: string; items: InterviewItem[] }) {
    if (!items || items.length === 0) {
        return <EmptyCard icon={Calendar} message="No interviews found" />
    }

    return (
        <CardWrapper>
            <CardTitle icon={Calendar} title={title} badge={`${items.length}`} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 6).map((item) => (
                    <div key={item.id} className="px-3 py-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.internshipTitle}</p>
                            <p className="text-[11px] text-muted-foreground">
                                {new Date(item.scheduledAt).toLocaleString()}
                                {item.location && ` · ${item.location}`}
                            </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">{item.status}</Badge>
                    </div>
                ))}
            </div>
        </CardWrapper>
    )
}

// ─── Conversation List Card ─────────────────────────────────────────────────

interface ConversationItem {
    id: string
    studentName?: string
    companyName?: string
    lastMessage?: string
    lastMessageAt?: string
}

function ConversationListCard({ title, items }: { title: string; items: ConversationItem[] }) {
    if (!items || items.length === 0) {
        return <EmptyCard icon={MessageSquare} message="No conversations found" />
    }

    return (
        <CardWrapper>
            <CardTitle icon={MessageSquare} title={title} badge={`${items.length}`} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 6).map((item) => (
                    <div key={item.id} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium flex-1 truncate">{item.studentName || item.companyName}</p>
                            {item.lastMessageAt && (
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {new Date(item.lastMessageAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        {item.lastMessage && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.lastMessage}</p>
                        )}
                    </div>
                ))}
            </div>
        </CardWrapper>
    )
}

// ─── Assignment List Card ───────────────────────────────────────────────────

interface AssignmentItem {
    id: string
    title: string
    description?: string
    dueDate?: string
    internshipTitle?: string
    companyName?: string
    studentName?: string
}

function AssignmentListCard({ title, items }: { title: string; items: AssignmentItem[] }) {
    if (!items || items.length === 0) {
        return <EmptyCard icon={BookOpen} message="No assignments found" />
    }

    return (
        <CardWrapper>
            <CardTitle icon={BookOpen} title={title} badge={`${items.length}`} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 6).map((item) => (
                    <div key={item.id} className="px-3 py-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            {item.internshipTitle && <span>{item.internshipTitle}</span>}
                            {item.dueDate && (
                                <span className="flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </CardWrapper>
    )
}

// ─── Portfolio Card ─────────────────────────────────────────────────────────

interface PortfolioData {
    empty?: boolean
    message?: string
    fullName?: string
    headline?: string
    bio?: string
    skills?: string[]
    interests?: string[]
    experience?: string
    education?: string
    linkedin?: string
    github?: string
    approvalStatus?: string
}

function PortfolioCard({ data }: { data: PortfolioData }) {
    if (data.empty) {
        return <EmptyCard icon={User} message={data.message || "No portfolio yet"} />
    }

    return (
        <CardWrapper>
            <CardTitle icon={User} title={data.fullName || "Your Portfolio"} />
            <div className="p-3 space-y-2">
                {data.headline && (
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{data.headline}</p>
                )}
                {data.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{data.bio}</p>
                )}
                {data.skills && data.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {data.skills.slice(0, 10).map(skill => (
                            <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">{skill}</Badge>
                        ))}
                        {data.skills.length > 10 && (
                            <span className="text-[10px] text-muted-foreground">+{data.skills.length - 10}</span>
                        )}
                    </div>
                )}
                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    {data.education && <span>🎓 {data.education}</span>}
                    {data.linkedin && (
                        <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-primary transition-colors">
                            <ExternalLink className="h-3 w-3" /> LinkedIn
                        </a>
                    )}
                    {data.github && (
                        <a href={data.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-primary transition-colors">
                            <ExternalLink className="h-3 w-3" /> GitHub
                        </a>
                    )}
                </div>
            </div>
        </CardWrapper>
    )
}

// ─── Stats Card ─────────────────────────────────────────────────────────────

const STAT_ICONS: Record<string, React.ElementType> = {
    applications: FileText,
    totalApplications: FileText,
    pendingApplications: Clock,
    upcomingInterviews: Calendar,
    savedInternships: Bookmark,
    conversations: MessageSquare,
    assignments: BookOpen,
    internships: Briefcase,
    portfolioStatus: User,
}

function StatsCard({ title, data }: { title: string; data: Record<string, number | string> }) {
    return (
        <CardWrapper>
            <CardTitle icon={TrendingUp} title={title} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border/30">
                {Object.entries(data).map(([key, value]) => {
                    const Icon = STAT_ICONS[key] || TrendingUp
                    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
                    return (
                        <div key={key} className="bg-card/80 p-2.5 text-center">
                            <Icon className="h-4 w-4 mx-auto text-violet-500 dark:text-violet-400 mb-1" />
                            <p className="text-base font-bold">{value}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                        </div>
                    )
                })}
            </div>
        </CardWrapper>
    )
}

// ─── Success Card ───────────────────────────────────────────────────────────

function SuccessCard({ title, data }: { title: string; data: Record<string, unknown> }) {
    return (
        <CardWrapper className="border-emerald-500/20">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-500">{title}</span>
            </div>
            {data && Object.keys(data).length > 0 && (
                <div className="px-3 py-2 space-y-0.5">
                    {Object.entries(data).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object").map(([key, value]) => (
                        <p key={key} className="text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">
                                {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}:
                            </span>{" "}
                            {String(value)}
                        </p>
                    ))}
                </div>
            )}
        </CardWrapper>
    )
}

// ─── Error Card ─────────────────────────────────────────────────────────────

function ErrorCard({ title, error }: { title: string; error: string }) {
    return (
        <CardWrapper className="border-red-500/20">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs font-semibold text-red-500">{title}</span>
            </div>
            <p className="px-3 py-2 text-[11px] text-muted-foreground">{error}</p>
        </CardWrapper>
    )
}

// ─── Empty Card ─────────────────────────────────────────────────────────────

function EmptyCard({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
    return (
        <CardWrapper>
            <div className="flex flex-col items-center justify-center py-6 px-4">
                <Icon className="h-6 w-6 text-violet-400/30 mb-2" />
                <p className="text-xs text-muted-foreground">{message}</p>
            </div>
        </CardWrapper>
    )
}
