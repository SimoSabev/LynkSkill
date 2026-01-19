"use client"

import { motion } from "framer-motion"
import { useState, useMemo, useCallback } from "react"
import type { Internship } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CardSkeleton } from "@/components/card-skeleton"
import InternshipDetailsModal from "@/components/internship-details-modal"
import { Layers, Clock, RefreshCw, Trash2, MapPin, GraduationCap, DollarSign, Timer, BookOpen, Wrench, Building2, Briefcase, CheckCircle2, XCircle, Clock3, ArrowRight, Sparkles, Calendar, Search } from 'lucide-react'
import ApplyButton from "@/components/ApplyBtn"
import { BookmarkButton } from "@/components/bookmark-button"
import { InternshipFiltersComponent, type InternshipFilters } from "@/components/internship-filters"
import { useDashboard } from "@/lib/dashboard-context"
import { useTranslation } from "@/lib/i18n"

interface Application {
    id: string
    internshipId: string
    studentId: string
    status: "PENDING" | "APPROVED" | "REJECTED"
}

interface RecentAppsSectionProps {
    userType: "Student" | "Company"
    setActiveTab?: (tab: string) => void
}

export function RecentInternshipsSection({ userType, setActiveTab }: RecentAppsSectionProps) {
    const { t } = useTranslation()
    
    // Use centralized context - no more individual fetches
    const { 
        internships: contextInternships, 
        applications: contextApplications,
        isLoadingInternships,
        mutateInternships,
        mutateApplications,
        savedInternshipIds,
        mutateSavedInternships
    } = useDashboard()

    const [refreshing, setRefreshing] = useState(false)
    const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null)
    const [open, setOpen] = useState(false)
    const [filters, setFilters] = useState<InternshipFilters>({
        search: "",
        location: "all",
        paid: "all",
        minSalary: 0,
        maxSalary: 10000,
        skills: []
    })
    const [filter, setFilter] = useState<"all" | "recent">("all")
    const [displayCount, setDisplayCount] = useState(6)

    // Use context data instead of local state
    const internships = contextInternships as Internship[]
    const applications = contextApplications as Application[]
    const isLoading = isLoadingInternships

    // Extract unique locations from internships
    const uniqueLocations = useMemo(() => {
        const locs = new Set<string>()
        internships.forEach(i => {
            if (i.location) locs.add(i.location)
        })
        return Array.from(locs).sort()
    }, [internships])

    // Extract unique skills from internships
    const uniqueSkills = useMemo(() => {
        const skillsSet = new Set<string>()
        internships.forEach(i => {
            if (i.skills) {
                // Skills could be comma-separated or array
                const skillList = typeof i.skills === 'string' 
                    ? i.skills.split(',').map(s => s.trim())
                    : i.skills
                skillList.forEach((s: string) => {
                    if (s) skillsSet.add(s)
                })
            }
        })
        return Array.from(skillsSet).sort()
    }, [internships])

    // Memoized filter handler
    const handleFiltersChange = useCallback((newFilters: InternshipFilters) => {
        setFilters(newFilters)
        setDisplayCount(6) // Reset display count when filters change
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await Promise.all([mutateInternships(), mutateApplications()])
        setRefreshing(false)
    }

    // Apply all filters
    const filteredInternships = useMemo(() => {
        return internships.filter((internship) => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                const matchesSearch = 
                    internship.title.toLowerCase().includes(searchLower) ||
                    internship.description.toLowerCase().includes(searchLower) ||
                    internship.location?.toLowerCase().includes(searchLower) ||
                    internship.skills?.toLowerCase().includes(searchLower)
                if (!matchesSearch) return false
            }

            // Location filter
            if (filters.location !== "all") {
                const locLower = internship.location?.toLowerCase() || ""
                if (filters.location === "remote") {
                    if (!locLower.includes("remote")) return false
                } else if (!locLower.includes(filters.location.toLowerCase())) {
                    return false
                }
            }

            // Paid/Unpaid filter
            if (filters.paid !== "all") {
                if (filters.paid === "paid" && !internship.paid) return false
                if (filters.paid === "unpaid" && internship.paid) return false
            }

            // Salary range filter (only for paid internships)
            if (filters.paid !== "unpaid" && internship.paid && internship.salary) {
                const salary = Number(internship.salary)
                if (salary < filters.minSalary) return false
                if (filters.maxSalary < 10000 && salary > filters.maxSalary) return false
            }

            // Skills filter
            if (filters.skills.length > 0) {
                const internshipSkills = internship.skills?.toLowerCase() || ""
                const hasMatchingSkill = filters.skills.some(skill => 
                    internshipSkills.includes(skill.toLowerCase())
                )
                if (!hasMatchingSkill) return false
            }

            return true
        })
    }, [internships, filters])

    const now = Date.now()
    const finalInternships =
        filter === "recent"
            ? filteredInternships.filter((internship) => {
                const createdAt = new Date(internship.createdAt).getTime()
                const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24)
                return diffDays <= 5
            })
            : filteredInternships

    const displayedInternships = finalInternships.slice(0, displayCount)
    // hasMore can be used for "Load More" functionality
    const _hasMore = displayCount < finalInternships.length

    return (
        <section className="space-y-6 md:space-y-8">
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 backdrop-blur-sm shadow-xl md:shadow-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-blue-600/5 border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-blue-600/10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm shadow-lg">
                                <Briefcase className="h-5 w-5 md:h-7 md:w-7 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                                {userType === "Company" ? t('internships.myRecentInternships') : t('internships.recentInternships')}
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                            {finalInternships.length} {finalInternships.length === 1 ? t('internships.opportunityAvailable') : t('internships.opportunitiesAvailable')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
                <div className="flex gap-2 md:gap-3">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="lg"
                        className="flex-1 sm:flex-none rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                        onClick={() => setFilter("all")}
                    >
                        <Layers className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                        {t('common.all')}
                    </Button>

                    <Button
                        variant={filter === "recent" ? "default" : "outline"}
                        size="lg"
                        className="flex-1 sm:flex-none rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                        onClick={() => setFilter("recent")}
                    >
                        <Clock className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                        {t('common.recent')}
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing || isLoading}
                        className="rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg bg-transparent"
                    >
                        <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${refreshing ? "animate-spin" : ""} sm:mr-2`} />
                        <span className="hidden sm:inline">{refreshing ? t('common.loading') : t('common.refresh')}</span>
                    </Button>
                </div>
            </div>

            {/* Advanced Filters */}
            <InternshipFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                locations={uniqueLocations}
                allSkills={uniqueSkills}
            />

            {finalInternships.length === 0 && !isLoading ? (
                <div className="text-center py-16 md:py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted/50 mb-4 md:mb-6">
                        <Search className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg md:text-xl font-medium">{t('internships.noInternshipsFound')}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {isLoading
                            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                            : displayedInternships.map((item) => {
                                const app = applications.find((a) => a.internshipId === item.id)

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                        whileHover={{
                                            scale: 1.02,
                                            y: -4,
                                            transition: { duration: 0.3, ease: "easeOut" },
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group"
                                    >
                                        <Card className="relative flex flex-col overflow-hidden rounded-2xl md:rounded-3xl border-2 border-border hover:border-purple-500/50 transition-all duration-500 h-full bg-gradient-to-br from-card via-card to-card/95 shadow-lg hover:shadow-2xl backdrop-blur-sm">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <CardHeader className="pb-3 md:pb-4 pt-4 md:pt-5 px-4 md:px-6 relative z-10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                                        {userType === "Company" ? (
                                                            <Building2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                                        ) : (
                                                            <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                                        )}
                                                    </div>
                                                    {userType === "Company" && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.15 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={async () => {
                                                                const confirmDelete = window.confirm("Are you sure you want to delete this internship?");
                                                                if (!confirmDelete) return;
                                                        
                                                                try {
                                                                    const res = await fetch(`/api/internship/delete?id=${item.id}`, {
                                                                        method: "DELETE"
                                                                    });
                                                        
                                                                    const data = await res.json();
                                                                    if (data.error) throw new Error(data.error);
                                                        
                                                                    // Refresh UI
                                                                    window.dispatchEvent(
                                                                        new CustomEvent("internshipDeleted", {
                                                                            detail: item.id,
                                                                        })
                                                                    );
                                                                } catch (err) {
                                                                    console.error("Delete internship error:", err);
                                                                }
                                                            }}
                                                            className="p-1.5 md:p-2 rounded-lg md:rounded-xl cursor-pointer bg-destructive/10 hover:bg-destructive/20 transition-all duration-200 shadow-md hover:shadow-lg"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-destructive" />
                                                        </motion.button>
                                                    )}
                                                    {userType === "Student" && (
                                                        <BookmarkButton
                                                            internshipId={item.id}
                                                            isSaved={savedInternshipIds.has(item.id)}
                                                            onToggle={() => mutateSavedInternships()}
                                                            className="bg-muted/50 hover:bg-muted"
                                                        />
                                                    )}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="flex-1 flex flex-col w-full relative z-10 px-4 md:px-6 pb-3 md:pb-4 space-y-3 md:space-y-4">
                                                {/* Title & Company Group */}
                                                <div className="space-y-1.5 md:space-y-2">
                                                    <CardTitle className="text-lg md:text-xl font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                                                        {item.title}
                                                    </CardTitle>

                                                    {item.company && (
                                                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                                                            <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                            <span className="font-medium truncate">{item.company.name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Description - more compact */}
                                                <CardDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                    {item.description}
                                                </CardDescription>

                                                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                                                    {item.location && (
                                                        <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                            <span className="truncate">{item.location}</span>
                                                        </div>
                                                    )}

                                                    {item.duration && (
                                                        <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                                                            <Timer className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                            <span>{item.duration}</span>
                                                        </div>
                                                    )}

                                                    {item.paid && (
                                                        <div className="flex items-center gap-1.5 md:gap-2 text-green-600 dark:text-green-400 font-semibold">
                                                            <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                                                            <span>${item.salary ?? "Negotiable"}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {(item.qualifications || item.grade || item.skills) && (
                                                    <div className="space-y-1.5 md:space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-2.5 md:pt-3">
                                                        {item.qualifications && (
                                                            <div className="flex items-start gap-1.5 md:gap-2">
                                                                <GraduationCap className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                                <span className="line-clamp-2">{item.qualifications}</span>
                                                            </div>
                                                        )}

                                                        {item.grade && (
                                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                                <BookOpen className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                                <span>Grade {item.grade}</span>
                                                            </div>
                                                        )}

                                                        {item.skills && (
                                                            <div className="flex items-start gap-1.5 md:gap-2">
                                                                <Wrench className="h-3 w-3 md:h-3.5 md:w-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                                                <span className="line-clamp-2">{item.skills}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Application Progress */}
                                                {item.applicationStart && item.applicationEnd && (() => {
                                                    const start = new Date(item.applicationStart).getTime()
                                                    const end = new Date(item.applicationEnd).getTime()
                                                    const now = Date.now()
                                                    const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))

                                                    return (
                                                        <div className="space-y-1.5 md:space-y-2 pt-2 border-t border-border/50">
                                                            <div className="flex items-center gap-1.5 md:gap-2 text-xs text-muted-foreground">
                                                                <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                                <span className="font-medium text-[10px] md:text-xs">
                                                                    {new Date(item.applicationStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                                    {" – "}
                                                                    {new Date(item.applicationEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all ${
                                                                        progress < 70
                                                                            ? "bg-blue-500"
                                                                            : progress < 100
                                                                                ? "bg-yellow-500"
                                                                                : "bg-red-500"
                                                                    }`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })()}
                                            </CardContent>

                                            <CardFooter className="w-full flex flex-col gap-2 p-3 md:p-4 relative z-10 border-t border-border/50">
                                                {userType === "Student" ? (
                                                    <>
                                                        {app ? (
                                                            <Button
                                                                disabled
                                                                size="lg"
                                                                className="w-full rounded-xl py-4 md:py-5 text-sm md:text-base font-bold shadow-lg cursor-not-allowed"
                                                                variant={
                                                                    app.status === "APPROVED"
                                                                        ? "default"
                                                                        : app.status === "REJECTED"
                                                                            ? "destructive"
                                                                            : "outline"
                                                                }
                                                            >
                                                                {app.status === "PENDING" && (
                                                                    <>
                                                                        <Clock3 className="mr-2 h-4 w-4" />
                                                                        Applied
                                                                    </>
                                                                )}
                                                                {app.status === "APPROVED" && (
                                                                    <>
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                        Approved
                                                                    </>
                                                                )}
                                                                {app.status === "REJECTED" && (
                                                                    <>
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Rejected
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <div className="w-full flex flex-col gap-2">
                                                                <ApplyButton
                                                                    internshipId={item.id}
                                                                    goToPortfolioTab={() => setActiveTab?.("apps")}
                                                                    onApplied={() => {
                                                                        // Revalidate applications via SWR
                                                                        mutateApplications()
                                                                    }}
                                                                />

                                                                <Button
                                                                    size="lg"
                                                                    variant="outline"
                                                                    className="flex-1 rounded-xl py-4 md:py-5 text-sm md:text-base font-bold transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg border-2 hover:border-purple-500 group bg-transparent"
                                                                    onClick={() => {
                                                                        setSelectedInternship(item)
                                                                        setOpen(true)
                                                                    }}
                                                                >
                                                                    Details
                                                                    <ArrowRight className="ml-2 h-3.5 w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="lg"
                                                        className="w-full rounded-xl py-4 md:py-5 text-sm md:text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
                                                        onClick={() => {
                                                            setSelectedInternship(item)
                                                            setOpen(true)
                                                        }}
                                                    >
                                                        Manage
                                                        <ArrowRight className="ml-2 h-3.5 w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>

                                        <InternshipDetailsModal
                                            open={open}
                                            onClose={() => setOpen(false)}
                                            internshipId={selectedInternship?.id || null}
                                        />
                                    </motion.div>
                                )
                            })}
                    </div>

                    {!isLoading && finalInternships.length > 4 && (
                        <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 pt-4 md:pt-6">
                            {displayCount < finalInternships.length ? (
                                <>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => setDisplayCount((prev) => prev + 4)}
                                        className="rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 text-sm md:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-500 bg-transparent group"
                                    >
                                        See More
                                        <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>

                                    <Button
                                        size="lg"
                                        onClick={() => setDisplayCount(finalInternships.length)}
                                        className="rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 text-sm md:text-base font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white group"
                                    >
                                        See All ({finalInternships.length})
                                        <Sparkles className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => setDisplayCount(4)}
                                    className="rounded-xl md:rounded-2xl px-6 md:px-8 py-4 md:py-6 text-sm md:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-500 bg-transparent group"
                                >
                                    Show Less
                                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:-translate-x-1 transition-transform rotate-180" />
                                </Button>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    )
}
