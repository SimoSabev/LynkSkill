"use client"

import {useEffect, useState} from "react"
import {motion, AnimatePresence} from "framer-motion"
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
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
            className={`${width} ${height} ${rounded} bg-muted/50`}
            style={{animation: "pulse 600ms ease-in-out infinite", animationDelay: `${delay}ms`}}
        />
    )
}

function SkeletonLoader() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading internship details">
            {/* Header Skeleton */}
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted/50 animate-[pulse_600ms_ease-in-out_infinite]"/>
                    <div className="flex-1 space-y-2">
                        <SkeletonLine width="w-3/4" height="h-6" rounded="rounded-md" delay={0}/>
                        <div className="flex gap-3">
                            <SkeletonLine width="w-24" height="h-4" rounded="rounded" delay={60}/>
                            <SkeletonLine width="w-20" height="h-4" rounded="rounded" delay={120}/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Info Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                        <SkeletonLine width="w-28" height="h-4" rounded="rounded" delay={i * 50}/>
                        <SkeletonLine width="w-20" height="h-5" rounded="rounded-md" delay={i * 80}/>
                    </div>
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted/50 rounded animate-[pulse_600ms_ease-in-out_infinite]"/>
                    <SkeletonLine width="w-32" height="h-5" rounded="rounded-md" delay={180}/>
                </div>

                <div className="space-y-2">
                    <SkeletonLine width="w-full" height="h-3" rounded="rounded" delay={200}/>
                    <SkeletonLine width="w-full" height="h-3" rounded="rounded" delay={260}/>
                    <SkeletonLine width="w-3/4" height="h-3" rounded="rounded" delay={320}/>
                    <SkeletonLine width="w-11/12" height="h-3" rounded="rounded" delay={380}/>
                </div>
            </div>
        </div>
    )
}

function ErrorState({onRetry}: { onRetry: () => void }) {
    return (
        <motion.div
            initial={{scale: 0.95, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{type: "spring", duration: 0.3, bounce: 0.3}}
            className="flex flex-col items-center justify-center py-12 space-y-4"
        >
            <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-10 w-10 text-red-400"/>
            </div>
            <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-foreground">Failed to Load Internship</h3>
                <p className="text-sm text-muted-foreground">There was an error loading the internship details.</p>
            </div>
            <Button onClick={onRetry} variant="outline" className="mt-2 bg-transparent">
                Try Again
            </Button>
        </motion.div>
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
            <DialogContent
                className="rounded-xl max-w-3xl max-h-[90vh] overflow-hidden p-0 border border-border bg-background shadow-2xl">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                            transition={{duration: 0.15, ease: "easeOut"}}
                            className="p-6 sm:p-8"
                        >
                            <SkeletonLoader/>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            transition={{type: "spring", duration: 0.3, bounce: 0.25}}
                            className="p-6 sm:p-8"
                        >
                            <ErrorState onRetry={fetchInternship}/>
                        </motion.div>
                    ) : internship ? (
                        <motion.div
                            key="content"
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                            transition={{type: "spring", duration: 0.4, bounce: 0.2}}
                            className="bg-background"
                        >
                            <div className="relative overflow-hidden border-b border-border p-6 sm:p-8 bg-background">
                                {/* Neon gradient overlay */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/10 opacity-80"/>
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-600/10 to-blue-600/20"/>

                                {/* Animated gradient border effect */}
                                <div
                                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-60"/>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 p-2">
                                        <div
                                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 shadow-lg shadow-purple-500/20">
                                            <Briefcase className="h-7 w-7 text-purple-400"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <DialogTitle
                                                className="text-xl sm:text-2xl font-semibold text-foreground mb-1 truncate leading-tight">
                                                {internship.title}
                                            </DialogTitle>
                                            <div
                                                className="flex flex-wrap items-center gap-3 sm:gap-4 text-muted-foreground text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4"/>
                                                    <span>{internship.location}</span>
                                                </div>
                                                {internship.paid && internship.salary && (
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="h-4 w-4"/>
                                                        <span
                                                            className="font-medium text-foreground">${internship.salary}/month</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Company Info Card */}
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.1, duration: 0.3}}
                                    className="p-4 sm:p-5 rounded-lg bg-muted/50 border border-border relative overflow-hidden group"
                                >
                                    {/* Subtle gradient on hover */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                                    <div className="relative flex items-start gap-4">
                                        <div
                                            className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                                            <Building2 className="h-5 w-5 text-blue-400"/>
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-base font-semibold text-foreground">{internship.company.name}</h3>
                                                {companyRating && companyRating.totalReviews > 0 && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                            {companyRating.avgRating.toFixed(1)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({companyRating.totalReviews} review{companyRating.totalReviews !== 1 ? "s" : ""})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{internship.company.description}</p>
                                            <div
                                                className="flex flex-wrap gap-3 sm:gap-4 text-sm text-muted-foreground pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5"/>
                                                    <span>{internship.company.location}</span>
                                                </div>
                                                {internship.company.website && (
                                                    <a
                                                        href={/^https?:\/\//i.test(internship.company.website) ? internship.company.website : `https://${internship.company.website}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5"/>
                                                        <span>Visit Website</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Info Grid */}
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.15, duration: 0.3}}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    <div
                                        className="p-4 rounded-lg bg-muted/50 border border-border relative overflow-hidden group">
                                        <div
                                            className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                        <div className="relative flex items-center gap-2.5 mb-3">
                                            <div
                                                className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                                                <Clock className="h-4 w-4 text-purple-400"/>
                                            </div>
                                            <h3 className="text-sm font-medium text-foreground">Application Period</h3>
                                        </div>
                                        <div className="relative space-y-0.5 ml-8">
                                            <p className="text-foreground font-medium text-sm">
                                                {format(new Date(internship.applicationStart), "MMM d, yyyy")}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                to {format(new Date(internship.applicationEnd), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className="p-4 rounded-lg bg-muted/50 border border-border relative overflow-hidden group">
                                        <div
                                            className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                                        <div className="relative flex items-center gap-2.5 mb-3">
                                            <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                                                <DollarSign className="h-4 w-4 text-blue-400"/>
                                            </div>
                                            <h3 className="text-sm font-medium text-foreground">Compensation</h3>
                                        </div>
                                        <div className="relative ml-8">
                                            {internship.paid && internship.salary ? (
                                                <>
                                                    <p className="text-foreground font-semibold text-base">${internship.salary}</p>
                                                    <p className="text-muted-foreground text-xs">per month</p>
                                                </>
                                            ) : (
                                                <p className="text-muted-foreground font-medium text-sm">Unpaid</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* About Section */}
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.2, duration: 0.3}}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-400"/>
                                        <h3 className="text-base font-semibold text-foreground">About This Role</h3>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                        <p className="text-foreground/90 leading-relaxed text-sm text-pretty">{internship.description}</p>
                                    </div>
                                </motion.div>

                                {/* Qualifications */}
                                {internship.qualifications && (
                                    <motion.div
                                        initial={{opacity: 0, y: 10}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{delay: 0.25, duration: 0.3}}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4 text-purple-400"/>
                                            <h3 className="text-base font-semibold text-foreground">Qualifications</h3>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                            <p className="text-foreground/90 leading-relaxed text-sm text-pretty">
                                                {internship.qualifications}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Test Assignment */}
                                {internship.testAssignmentTitle && (
                                    <motion.div
                                        initial={{opacity: 0, y: 10}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{delay: 0.3, duration: 0.3}}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-emerald-400"/>
                                            <h3 className="text-base font-semibold text-foreground">Test Assignment</h3>
                                        </div>

                                        <div
                                            className="p-4 rounded-lg bg-muted/50 border border-border space-y-4 relative overflow-hidden">
                                            <div
                                                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50"/>
                                            <div className="relative">
                                                <h4 className="text-sm font-medium text-foreground mb-2">{internship.testAssignmentTitle}</h4>
                                                <p className="text-foreground/90 leading-relaxed text-sm text-pretty">
                                                    {internship.testAssignmentDescription}
                                                </p>
                                            </div>
                                            {internship.testAssignmentDueDate && (
                                                <div
                                                    className="relative flex items-center gap-2 pt-3 border-t border-border">
                                                    <Clock className="h-4 w-4 text-muted-foreground"/>
                                                    <span className="text-sm text-muted-foreground">
                                                        Due by {format(new Date(internship.testAssignmentDueDate), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
