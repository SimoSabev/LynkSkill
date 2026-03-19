"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
    MapPin, DollarSign, Clock, Briefcase, ExternalLink,
    CheckCircle2, XCircle, Building2, User, Users, Search,
    Calendar, MessageSquare, Star, BookOpen, FileText,
    TrendingUp, Bookmark, ChevronRight, Bell, History
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
    onAction?: (prompt: string) => void
}

// ─── Main Dispatcher ────────────────────────────────────────────────────────

export function AgentActionCard({ result, onAction }: AgentActionCardProps) {
    const { cardType, title, data, error } = result

    if (error && !result.success) {
        return <ErrorCard title={title} error={error} />
    }

    switch (cardType) {
        case "internship-list":
            return <InternshipListCard title={title} items={data as InternshipItem[]} onAction={onAction} />
        case "internship-detail":
            return <InternshipDetailCard data={data as InternshipDetail} onAction={onAction} />
        case "application-list":
            return <ApplicationListCard title={title} items={data as ApplicationItem[]} onAction={onAction} />
        case "candidate-list":
            return <CandidateListCard title={title} items={data as CandidateItem[]} onAction={onAction} />
        case "interview-list":
            return <InterviewListCard title={title} items={data as InterviewItem[]} />
        case "conversation-list":
            return <ConversationListCard title={title} items={data as ConversationItem[]} />
        case "assignment-list":
            return <AssignmentListCard title={title} items={data as AssignmentItem[]} />
        case "portfolio-view":
            return <PortfolioCard data={data as PortfolioData} onAction={onAction} />
        case "stats":
            return <StatsCard title={title} data={data as Record<string, number | string>} />
        case "action-success":
            return <SuccessCard title={title} data={data as Record<string, unknown>} />
        case "session-search-results":
            return <SessionSearchResultsCard title={title} items={data as SessionSearchResultItem[]} onAction={onAction} />
        case "cover-letter":
            return <CoverLetterCard data={data as CoverLetterData} onAction={onAction} />
        case "notification-list":
            return <NotificationListCard title={title} items={data as NotificationItem[]} />
        case "application-detail":
            return <ApplicationDetailCard data={data as ApplicationDetailData} onAction={onAction} />
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

// ─── Action Button Helper ───────────────────────────────────────────────────

function ActionBtn({ label, onClick, variant = "default" }: { label: string; onClick: () => void; variant?: "default" | "primary" | "success" | "danger" }) {
    const variants = {
        default: "bg-muted/60 text-muted-foreground border-border/30 hover:bg-muted",
        primary: "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20",
        success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
        danger: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    }
    return (
        <button onClick={onClick}
            className={cn("text-[10px] px-2 py-0.5 rounded-full border transition-colors", variants[variant])}>
            {label}
        </button>
    )
}

// ─── Internship List Card ───────────────────────────────────────────────────

interface InternshipItem {
    id: string
    title: string
    company: string
    companyLogo?: string
    location: string
    paid?: boolean
    salary?: number | null
    description?: string
    applicationEnd?: string
    applicationsCount?: number
    requiresCoverLetter?: boolean
}

function InternshipListCard({ title, items, onAction }: { title: string; items: InternshipItem[]; onAction?: (p: string) => void }) {
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
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                    {item.company && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {item.company}
                                        </span>
                                    )}
                                    {item.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {item.location}
                                        </span>
                                    )}
                                    {item.applicationEnd && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Due: {new Date(item.applicationEnd).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {item.paid ? (
                                    <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        <DollarSign className="h-3 w-3 mr-0.5" />
                                        {item.salary ? `${item.salary}/mo` : "Paid"}
                                    </Badge>
                                ) : item.paid === false ? (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">Unpaid</Badge>
                                ) : null}
                                {item.requiresCoverLetter && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        <FileText className="h-3 w-3 mr-0.5" /> CL
                                    </Badge>
                                )}
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        {item.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
                        {onAction && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                <ActionBtn label="Apply" variant="primary" onClick={() => onAction(`Apply to internship ${item.id}`)} />
                                <ActionBtn label="Save" onClick={() => onAction(`Save internship ${item.id}`)} />
                                <ActionBtn label="Details" onClick={() => onAction(`Tell me more about internship ${item.id} at ${item.company}`)} />
                                <ActionBtn label="Cover letter" variant="success" onClick={() => onAction(`Generate a cover letter for internship ${item.id}`)} />
                            </div>
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

function InternshipDetailCard({ data, onAction }: { data: InternshipDetail; onAction?: (p: string) => void }) {
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
                {data.qualifications && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Requirements:</span> {data.qualifications}</p>
                )}
                {data.applicationEnd && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Deadline: {new Date(data.applicationEnd).toLocaleDateString()}
                    </p>
                )}
                {onAction && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                        <ActionBtn label="Apply" variant="primary" onClick={() => onAction(`Apply to internship ${data.id}`)} />
                        <ActionBtn label="Generate cover letter" variant="success" onClick={() => onAction(`Generate a cover letter for internship ${data.id}`)} />
                    </div>
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

function ApplicationListCard({ title, items, onAction }: { title: string; items: ApplicationItem[]; onAction?: (p: string) => void }) {
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
                    <div key={item.id} className="px-3 py-2">
                        <div className="flex items-center gap-2">
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
                        {onAction && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                <ActionBtn label="View details" variant="primary" onClick={() => onAction(`Show details of application ${item.id}`)} />
                                {item.status === "PENDING" && (
                                    <ActionBtn label="Withdraw" variant="danger" onClick={() => onAction(`Withdraw application ${item.id}`)} />
                                )}
                            </div>
                        )}
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
    email?: string
    headline?: string
    skills: string[]
    matchScore?: number
    reasons?: string[]
    projectCount?: number
}

function CandidateListCard({ title, items, onAction }: { title: string; items: CandidateItem[]; onAction?: (p: string) => void }) {
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
                            {item.matchScore != null && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Star className="h-3 w-3 text-amber-400" />
                                    <span className="text-xs font-semibold">{item.matchScore}%</span>
                                </div>
                            )}
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
                        {onAction && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                <ActionBtn label="View profile" variant="primary" onClick={() => onAction(`Tell me more about candidate ${item.name}`)} />
                                <ActionBtn label="Message" onClick={() => onAction(`Start a conversation with user ${item.id}`)} />
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
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                            {item.internshipTitle && <span>{item.internshipTitle}</span>}
                            {item.companyName && <span>· {item.companyName}</span>}
                            {item.dueDate && (
                                <span className="flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        {item.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        )}
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
    education?: unknown
    linkedin?: string
    github?: string
    approvalStatus?: string
}

function PortfolioCard({ data, onAction }: { data: PortfolioData; onAction?: (p: string) => void }) {
    if (data.empty) {
        return <EmptyCard icon={User} message={data.message || "No portfolio yet"} />
    }

    return (
        <CardWrapper>
            <CardTitle icon={User} title={data.fullName || "Your Portfolio"} badge={data.approvalStatus} />
            <div className="p-3 space-y-2">
                {data.headline && (
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{data.headline}</p>
                )}
                {data.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{data.bio}</p>
                )}
                {data.skills && data.skills.length > 0 && (
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                            {data.skills.slice(0, 10).map(skill => (
                                <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">{skill}</Badge>
                            ))}
                            {data.skills.length > 10 && (
                                <span className="text-[10px] text-muted-foreground">+{data.skills.length - 10}</span>
                            )}
                        </div>
                    </div>
                )}
                {data.interests && data.interests.length > 0 && (
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Interests</p>
                        <div className="flex flex-wrap gap-1">
                            {data.interests.slice(0, 6).map(interest => (
                                <Badge key={interest} className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20">{interest}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                {data.experience && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Experience:</span> {data.experience}</p>
                )}
                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
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
                {onAction && (
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                        <ActionBtn label="Get recommendations" variant="primary" onClick={() => onAction("What internships would you recommend for me based on my portfolio?")} />
                    </div>
                )}
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
    saved: Bookmark,
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

// ─── Cover Letter Card ──────────────────────────────────────────────────────

interface CoverLetterData {
    internshipId: string
    internshipTitle: string
    company: string
    letter: string
}

function CoverLetterCard({ data, onAction }: { data: CoverLetterData; onAction?: (p: string) => void }) {
    const [copied, setCopied] = useState(false)
    return (
        <CardWrapper>
            <CardTitle icon={FileText} title={`Cover Letter — ${data.internshipTitle}`} />
            <div className="p-3 space-y-2">
                <p className="text-[11px] text-muted-foreground">{data.company}</p>
                <div className="rounded-lg bg-muted/40 border border-border/30 p-2.5 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {data.letter}
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(data.letter)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 hover:bg-violet-500/20 transition-colors flex items-center gap-1"
                    >
                        {copied ? <><CheckCircle2 className="h-3 w-3" /> Copied</> : <><FileText className="h-3 w-3" /> Copy</>}
                    </button>
                    {onAction && (
                        <button
                            onClick={() => onAction(`Apply to internship ${data.internshipId} with this cover letter`)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        >
                            Apply with this letter
                        </button>
                    )}
                </div>
            </div>
        </CardWrapper>
    )
}

// ─── Notification List Card ─────────────────────────────────────────────────

interface NotificationItem {
    id: string
    type: string
    message: string
    read: boolean
    createdAt: string
}

function NotificationListCard({ title, items }: { title: string; items: NotificationItem[] }) {
    if (!items?.length) return <EmptyCard icon={Bell} message="No notifications" />
    const unread = items.filter(n => !n.read).length
    return (
        <CardWrapper>
            <CardTitle icon={Bell} title={title} badge={unread > 0 ? `${unread} unread` : undefined} />
            <div className="divide-y divide-border/30">
                {items.slice(0, 10).map(n => (
                    <div key={n.id} className={cn("px-3 py-2", !n.read && "bg-violet-500/5")}>
                        <div className="flex items-start gap-2">
                            {!n.read && <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />}
                            <div className={cn("flex-1", n.read && "pl-3.5")}>
                                <p className="text-xs">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </CardWrapper>
    )
}

// ─── Application Detail Card ────────────────────────────────────────────────

interface ApplicationDetailData {
    id: string
    status: string
    coverLetter?: string
    appliedAt: string
    student: { name?: string; email?: string; headline?: string; skills?: string[]; bio?: string }
}

function ApplicationDetailCard({ data, onAction }: { data: ApplicationDetailData; onAction?: (p: string) => void }) {
    return (
        <CardWrapper>
            <CardTitle icon={User} title={data.student.name ?? "Applicant"} badge={data.status} />
            <div className="p-3 space-y-2">
                {data.student.email && <p className="text-xs text-muted-foreground">{data.student.email}</p>}
                {data.student.headline && <p className="text-xs font-medium">{data.student.headline}</p>}
                {data.student.skills && data.student.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {data.student.skills.slice(0, 6).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                        ))}
                    </div>
                )}
                {data.student.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{data.student.bio}</p>
                )}
                {data.coverLetter && (
                    <div className="rounded-lg bg-muted/40 border border-border/30 p-2 text-xs max-h-24 overflow-y-auto">
                        {data.coverLetter}
                    </div>
                )}
                <p className="text-[10px] text-muted-foreground">Applied: {new Date(data.appliedAt).toLocaleDateString()}</p>
                {onAction && data.status === "PENDING" && (
                    <div className="flex gap-2 flex-wrap">
                        <ActionBtn label="Approve" variant="success" onClick={() => onAction(`Approve application ${data.id}`)} />
                        <ActionBtn label="Reject" variant="danger" onClick={() => onAction(`Reject application ${data.id}`)} />
                        <ActionBtn label="Schedule interview" variant="primary" onClick={() => onAction(`Schedule interview for application ${data.id}`)} />
                    </div>
                )}
            </div>
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

// ─── Session Search Results Card ──────────────────────────────────────────────

interface SessionSearchResultItem {
    sessionId: string
    sessionName: string
    sessionDate: string
    snippet: string
    role: string
    confidenceScore: number | null
    sourceLabel: string
}

function SessionSearchResultsCard({ title, items, onAction }: { title: string; items: SessionSearchResultItem[]; onAction?: (p: string) => void }) {
    if (!items || items.length === 0) {
        return <EmptyCard icon={Search} message="No previous conversations found" />
    }

    return (
        <CardWrapper>
            <CardTitle icon={History} title={title} badge={`${items.length}`} />
            <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                {items.map((item, i) => (
                    <div key={`${item.sessionId}-${i}`} className="px-3 py-2.5 hover:bg-muted/10 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/5 text-violet-600 border-violet-500/20 font-normal">
                                {item.sourceLabel}
                            </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground italic border-l-2 border-violet-500/30 pl-2 py-0.5">
                            &quot;...{item.snippet}...&quot;
                        </div>
                        {onAction && (
                            <div className="mt-2">
                                <ActionBtn label="Load this session" variant="primary" onClick={() => onAction(`Load session ${item.sessionId}`)} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
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
