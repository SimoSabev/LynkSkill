"use client"

import {useEffect, useState} from "react"
import {motion, AnimatePresence} from "framer-motion"
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Separator} from "@/components/ui/separator"
import {
    Briefcase,
    MapPin,
    GraduationCap,
    DollarSign,
    FileText,
    Clock,
    Building2,
    ExternalLink,
    AlertCircle,
    Star,
    Calendar,
    Globe,
    ClipboardList,
    X,
} from "lucide-react"
import {format} from "date-fns"

interface CompanyRating {
    avgRating: number
    totalReviews: number
}

interface Internship {
    id: string
    title: string
    description: string
    qualifications?: string
    location: string
    paid: boolean
    salary?: number
    applicationStart: string
    applicationEnd: string
    testAssignmentTitle?: string
    testAssignmentDescription?: string
    testAssignmentDueDate?: string
    testAssignmentId?: string
    company: {
        id: string
        name: string
        location: string
        website: string | null
        logo: string | null
        description: string
    }
}

interface InternshipDetailsModalProps {
    internshipId: string | null
    open: boolean
    onClose: () => void
}

function SkeletonLine({
                          width = "w-full",
                          height = "h-4",
                          rounded = "rounded",
                          delay = 0,
                      }: {
    width?: string
    height?: string
    rounded?: string
    delay?: number
}) {
    return (
        <div
            role="status"
            aria-hidden="true"
            className={`${width} ${height} ${rounded} bg-muted animate-pulse`}
            style={{animationDelay: `${delay}ms`}}
        />
    )
}

function SkeletonLoader() {
    return (
        <div className="p-6 space-y-6" aria-busy="true" aria-label="Loading internship details">
            {/* Header */}
            <div className="flex items-start gap-4">
                <SkeletonLine width="w-14" height="h-14" rounded="rounded-xl" />
                <div className="flex-1 space-y-2">
                    <SkeletonLine width="w-3/4" height="h-6" rounded="rounded-md" />
                    <SkeletonLine width="w-1/2" height="h-4" rounded="rounded" delay={50} />
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 space-y-2">
                        <SkeletonLine width="w-16" height="h-3" delay={i * 30} />
                        <SkeletonLine width="w-24" height="h-5" delay={i * 50} />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-3">
                <SkeletonLine width="w-32" height="h-5" rounded="rounded-md" delay={180} />
                <SkeletonLine width="w-full" height="h-3" delay={200} />
                <SkeletonLine width="w-full" height="h-3" delay={230} />
                <SkeletonLine width="w-3/4" height="h-3" delay={260} />
            </div>
        </div>
    )
}

function ErrorState({onRetry}: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 space-y-4">
            <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive"/>
            </div>
            <div className="text-center space-y-1">
                <h3 className="font-semibold text-foreground">Failed to Load</h3>
                <p className="text-sm text-muted-foreground">There was an error loading the internship details.</p>
            </div>
            <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
            </Button>
        </div>
    )
}

export default function InternshipDetailsModal({internshipId, open, onClose}: InternshipDetailsModalProps) {
    const [internship, setInternship] = useState<Internship | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [companyRating, setCompanyRating] = useState<CompanyRating | null>(null)

    const fetchInternship = async () => {
        if (!internshipId) return

        setInternship(null)
        setLoading(true)
        setError(false)

        try {
            const res = await fetch(`/api/internships/${internshipId}`)
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setInternship(data)
            
            // Fetch company rating
            if (data.company?.id) {
                const ratingRes = await fetch(`/api/reviews?companyId=${data.company.id}`)
                if (ratingRes.ok) {
                    const ratingData = await ratingRes.json()
                    setCompanyRating({ 
                        avgRating: ratingData.avgRating || 0, 
                        totalReviews: ratingData.totalReviews || 0 
                    })
                }
            }
        } catch (err) {
            console.error("Error fetching internship:", err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && internshipId) {
            fetchInternship()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, internshipId])

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 gap-0 border-0">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <SkeletonLoader key="loading" />
                    ) : error ? (
                        <ErrorState key="error" onRetry={fetchInternship}/>
                    ) : internship ? (
                        <motion.div
                            key="content"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            className="flex flex-col max-h-[85vh]"
                        >
                            {/* Neon Gradient Header */}
                            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 p-6">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                                
                                <div className="relative z-10 flex items-start gap-4">
                                    <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                                        <Briefcase className="h-7 w-7 text-white"/>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <DialogTitle className="text-xl font-bold text-white leading-tight">
                                            {internship.title}
                                        </DialogTitle>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-4 w-4"/>
                                                {internship.company.name}
                                            </span>
                                            <span className="text-white/50">•</span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4"/>
                                                {internship.location}
                                            </span>
                                            {internship.paid && internship.salary && (
                                                <>
                                                    <span className="text-white/50">•</span>
                                                    <span className="flex items-center gap-1 font-semibold text-white">
                                                        <DollarSign className="h-4 w-4"/>
                                                        ${internship.salary}/mo
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white hover:bg-white/10 shrink-0"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Quick Info Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="h-3 w-3 text-purple-500"/>
                                            Compensation
                                        </p>
                                        <p className="font-bold text-sm">
                                            {internship.paid && internship.salary ? `$${internship.salary}/mo` : "Volunteer"}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-blue-500"/>
                                            Opens
                                        </p>
                                        <p className="font-bold text-sm">
                                            {format(new Date(internship.applicationStart), "MMM d")}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 space-y-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3 text-cyan-500"/>
                                            Deadline
                                        </p>
                                        <p className="font-bold text-sm">
                                            {format(new Date(internship.applicationEnd), "MMM d")}
                                        </p>
                                    </div>
                                    {companyRating && companyRating.totalReviews > 0 && (
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Star className="h-3 w-3 text-amber-500"/>
                                                Rating
                                            </p>
                                            <p className="font-bold text-sm flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500"/>
                                                {companyRating.avgRating.toFixed(1)}
                                                <span className="text-muted-foreground font-normal text-xs">({companyRating.totalReviews})</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Company Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-purple-500"/>
                                        About the Company
                                    </h3>
                                    <div className="p-4 rounded-xl border bg-gradient-to-br from-card to-card/80 hover:border-purple-500/30 transition-colors">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {internship.company.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50">
                                            <Badge variant="secondary" className="gap-1 text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                                <MapPin className="h-3 w-3"/>
                                                {internship.company.location}
                                            </Badge>
                                            {internship.company.website && (
                                                <a
                                                    href={internship.company.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                                                >
                                                    <Globe className="h-3 w-3"/>
                                                    Visit Website
                                                    <ExternalLink className="h-3 w-3"/>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                {/* Description Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500"/>
                                        About This Role
                                    </h3>
                                    <div className="p-4 rounded-xl bg-muted/30 border">
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {internship.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Qualifications */}
                                {internship.qualifications && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4 text-cyan-500"/>
                                            Qualifications
                                        </h3>
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {internship.qualifications}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Test Assignment */}
                                {internship.testAssignmentTitle && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-amber-500"/>
                                            Test Assignment
                                        </h3>
                                        <div className="p-4 rounded-xl border bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                                            <h4 className="font-semibold text-sm mb-2">{internship.testAssignmentTitle}</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {internship.testAssignmentDescription}
                                            </p>
                                            {internship.testAssignmentDueDate && (
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-500/20">
                                                    <Clock className="h-4 w-4 text-amber-600"/>
                                                    <span className="text-sm text-amber-600 dark:text-amber-400">
                                                        Due by {format(new Date(internship.testAssignmentDueDate), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
