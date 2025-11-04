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
} from "lucide-react"
import {format} from "date-fns"

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

/* Small reusable skeleton line with faster pulse and optional stagger */
function SkeletonLine({width = "w-full", height = "h-4", rounded = "rounded", delay = 0}: {
    width?: string
    height?: string
    rounded?: string
    delay?: number
}) {
    return (
        <div
            role="status"
            aria-hidden="true"
            className={`${width} ${height} ${rounded} bg-slate-800/60`}
            style={{animation: "pulse 800ms ease-in-out infinite", animationDelay: `${delay}ms`}}
        />
    )
}

function SkeletonLoader() {
    // faster, staggered placeholders, approximates content structure
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading internship details">
            {/* Header Skeleton */}
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-slate-800/60 animate-[pulse_800ms_ease-in-out_infinite]"/>
                    <div className="flex-1 space-y-2">
                        <SkeletonLine width="w-3/4" height="h-6" rounded="rounded-md" delay={0}/>
                        <div className="flex gap-3">
                            <SkeletonLine width="w-24" height="h-4" rounded="rounded" delay={80}/>
                            <SkeletonLine width="w-20" height="h-4" rounded="rounded" delay={160}/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Info Cards Skeleton */}
            <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-2">
                        <SkeletonLine width="w-28" height="h-4" rounded="rounded" delay={i * 60}/>
                        <SkeletonLine width="w-20" height="h-5" rounded="rounded-md" delay={i * 100}/>
                    </div>
                ))}
            </div>

            {/* Content Skeleton with more lines and subtle variation */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-slate-800/60 rounded animate-[pulse_800ms_ease-in-out_infinite]"/>
                    <SkeletonLine width="w-32" height="h-5" rounded="rounded-md" delay={200}/>
                </div>

                <div className="space-y-2">
                    <SkeletonLine width="w-full" height="h-3" rounded="rounded" delay={240}/>
                    <SkeletonLine width="w-full" height="h-3" rounded="rounded" delay={320}/>
                    <SkeletonLine width="w-3/4" height="h-3" rounded="rounded" delay={400}/>
                    <SkeletonLine width="w-11/12" height="h-3" rounded="rounded" delay={480}/>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                        <SkeletonLine width="w-full" height="h-20" rounded="rounded-md" delay={560}/>
                        <SkeletonLine width="w-full" height="h-20" rounded="rounded-md" delay={640}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ErrorState({onRetry}: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="p-3 rounded-full bg-red-500/10">
                <AlertCircle className="h-10 w-10 text-red-400"/>
            </div>
            <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-slate-200">Failed to Load Internship</h3>
                <p className="text-sm text-slate-400">There was an error loading the internship details.</p>
            </div>
            <Button onClick={onRetry} variant="outline" className="mt-2 bg-transparent">
                Try Again
            </Button>
        </div>
    )
}

export default function InternshipDetailsModal({internshipId, open, onClose}: InternshipDetailsModalProps) {
    const [internship, setInternship] = useState<Internship | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const fetchInternship = async () => {
        if (!internshipId) return

        // Clear previous data immediately so skeleton renders right away
        setInternship(null)
        setLoading(true)
        setError(false)

        try {
            const res = await fetch(`/api/internships/${internshipId}`)
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setInternship(data)
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
    }, [open, internshipId])

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="rounded-xl max-w-3xl max-h-[90vh] overflow-hidden p-0 border border-slate-800/80 bg-slate-950 shadow-2xl">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.12}}
                            className="p-8"
                        >
                            <SkeletonLoader/>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.12}}
                            className="p-8"
                        >
                            <ErrorState onRetry={fetchInternship}/>
                        </motion.div>
                    ) : internship ? (
                        <motion.div
                            key="content"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.18}}
                            className="bg-slate-950"
                        >
                            <div
                                className="relative overflow-hidden border-b border-slate-800/80 p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-blue-600/5 to-transparent"/>

                                <div className="relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                            <Briefcase className="h-7 w-7 text-purple-400"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <DialogTitle
                                                className="text-2xl font-semibold text-slate-100 mb-3 text-balance leading-tight">
                                                {internship.title}
                                            </DialogTitle>
                                            <div className="flex flex-wrap items-center gap-4 text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-slate-500"/>
                                                    <span className="text-sm">{internship.location}</span>
                                                </div>
                                                {internship.paid && internship.salary && (
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="h-4 w-4 text-slate-500"/>
                                                        <span
                                                            className="text-sm font-medium text-slate-300">${internship.salary}/month</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                                <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                            <Building2 className="h-5 w-5 text-blue-400"/>
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <h3 className="text-base font-semibold text-slate-200">{internship.company.name}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed">{internship.company.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-500 pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5"/>
                                                    <span>{internship.company.location}</span>
                                                </div>
                                                {internship.company.website && (
                                                    <a
                                                        href={internship.company.website}
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div
                                                className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                                                <Clock className="h-4 w-4 text-purple-400"/>
                                            </div>
                                            <h3 className="text-sm font-medium text-slate-300">Application Period</h3>
                                        </div>
                                        <div className="space-y-0.5 ml-8">
                                            <p className="text-slate-200 font-medium text-sm">
                                                {format(new Date(internship.applicationStart), "MMM d, yyyy")}
                                            </p>
                                            <p className="text-slate-500 text-xs">
                                                to {format(new Date(internship.applicationEnd), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                                                <DollarSign className="h-4 w-4 text-blue-400"/>
                                            </div>
                                            <h3 className="text-sm font-medium text-slate-300">Compensation</h3>
                                        </div>
                                        <div className="ml-8">
                                            {internship.paid && internship.salary ? (
                                                <>
                                                    <p className="text-slate-200 font-semibold text-base">${internship.salary}</p>
                                                    <p className="text-slate-500 text-xs">per month</p>
                                                </>
                                            ) : (
                                                <p className="text-slate-400 font-medium text-sm">Unpaid</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-400"/>
                                        <h3 className="text-base font-semibold text-slate-200">About This Role</h3>
                                    </div>
                                    <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80">
                                        <p className="text-slate-300 leading-relaxed text-sm text-pretty">{internship.description}</p>
                                    </div>
                                </div>

                                {internship.qualifications && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4 text-purple-400"/>
                                            <h3 className="text-base font-semibold text-slate-200">Qualifications</h3>
                                        </div>
                                        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80">
                                            <p className="text-slate-300 leading-relaxed text-sm text-pretty">{internship.qualifications}</p>
                                        </div>
                                    </div>
                                )}
                                {internship.testAssignmentTitle && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-emerald-400"/>
                                                <h3 className="text-base font-semibold text-slate-200">Test
                                                    Assignment</h3>
                                            </div>
                                            {/*<Button*/}
                                            {/*    onClick={() => {*/}
                                            {/*        // If the backend provides a specific testAssignmentId, use it; fallback to internship.id if needed*/}
                                            {/*        const assignmentId = internship.testAssignmentId || internship.id;*/}
                                            {/*        window.location.href = `/assignments/${assignmentId}`;*/}
                                            {/*    }}*/}
                                            {/*    className="rounded-xl text-foreground px-4 py-2 text-sm"*/}
                                            {/*    style={{*/}
                                            {/*        background: "linear-gradient(135deg, var(--internship-modal-gradient-from), var(--internship-modal-gradient-to))",*/}
                                            {/*    }}*/}
                                            {/*>*/}
                                            {/*    <FileText className="h-4 w-4 mr-2" />*/}
                                            {/*    View Assignment Page*/}
                                            {/*</Button>*/}
                                        </div>

                                        <div
                                            className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-300 mb-2">{internship.testAssignmentTitle}</h4>
                                                <p className="text-slate-300 leading-relaxed text-sm text-pretty">
                                                    {internship.testAssignmentDescription}
                                                </p>
                                            </div>
                                            {internship.testAssignmentDueDate && (
                                                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                                                    <Clock className="h-4 w-4 text-slate-500"/>
                                                    <span className="text-sm text-slate-400">
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