"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Bookmark, MapPin, DollarSign, Timer, Building2, Briefcase, ArrowRight, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CardSkeleton } from "@/components/card-skeleton"
import { BookmarkButton } from "@/components/bookmark-button"
import InternshipDetailsModal from "@/components/internship-details-modal"
import ApplyButton from "@/components/ApplyBtn"
import { useDashboard } from "@/lib/dashboard-context"
import type { Internship } from "@/app/types"
import { useTranslation } from "@/lib/i18n"

interface Application {
    id: string
    internshipId: string
    status: "PENDING" | "APPROVED" | "REJECTED"
}

export function SavedInternshipsTab() {
    const { t } = useTranslation()
    const {
        internships: allInternships,
        applications,
        savedInternshipIds,
        isLoadingInternships,
        isLoadingSaved,
        mutateSavedInternships,
        mutateApplications
    } = useDashboard()

    const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null)
    const [open, setOpen] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // Filter to only show saved internships
    const savedInternshipsList = (allInternships as Internship[]).filter(
        internship => savedInternshipIds.has(internship.id)
    )

    const isLoading = isLoadingInternships || isLoadingSaved

    const handleRefresh = async () => {
        setRefreshing(true)
        await mutateSavedInternships()
        setRefreshing(false)
    }

    return (
        <section className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 backdrop-blur-sm shadow-xl md:shadow-2xl bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/5 border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-orange-500/10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm shadow-lg">
                                <Bookmark className="h-5 w-5 md:h-7 md:w-7 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                                {t('saved.title')}
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
                            {savedInternshipsList.length} {t('saved.title').toLowerCase()}
                        </p>
                    </div>

                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing || isLoading}
                        className="rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg bg-transparent"
                    >
                        <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${refreshing ? "animate-spin" : ""} mr-2`} />
                        {refreshing ? t('common.loading') : t('common.refresh')}
                    </Button>
                </div>
            </div>

            {/* Content */}
            {savedInternshipsList.length === 0 && !isLoading ? (
                <div className="text-center py-16 md:py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted/50 mb-4 md:mb-6">
                        <Bookmark className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg md:text-xl font-medium mb-2">{t('saved.noSaved')}</p>
                    <p className="text-muted-foreground text-sm">{t('saved.saveHint')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : savedInternshipsList.map((item) => {
                            const app = (applications as Application[]).find((a) => a.internshipId === item.id)

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    whileHover={{
                                        scale: 1.02,
                                        y: -4,
                                        transition: { duration: 0.3, ease: "easeOut" },
                                    }}
                                    className="group"
                                >
                                    <Card className="relative flex flex-col overflow-hidden rounded-2xl md:rounded-3xl border-2 border-border hover:border-yellow-500/50 transition-all duration-500 h-full bg-gradient-to-br from-card via-card to-card/95 shadow-lg hover:shadow-2xl backdrop-blur-sm">
                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <CardHeader className="pb-3 md:pb-4 pt-4 md:pt-5 px-4 md:px-6 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-600 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                                    <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                                </div>
                                                <BookmarkButton
                                                    internshipId={item.id}
                                                    isSaved={true}
                                                    onToggle={() => mutateSavedInternships()}
                                                    className="bg-muted/50 hover:bg-muted"
                                                />
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 flex flex-col w-full relative z-10 px-4 md:px-6 pb-3 md:pb-4 space-y-3 md:space-y-4">
                                            <div className="space-y-1.5 md:space-y-2">
                                                <CardTitle className="text-lg md:text-xl font-bold text-foreground group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors leading-tight">
                                                    {item.title}
                                                </CardTitle>

                                                {item.company && (
                                                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                                                        <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                                        <span className="font-medium truncate">{item.company.name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <CardDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                {item.description}
                                            </CardDescription>

                                            <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                                                {item.location && (
                                                    <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                                                        <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                                        <span className="truncate">{item.location}</span>
                                                    </div>
                                                )}

                                                {item.duration && (
                                                    <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                                                        <Timer className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
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
                                        </CardContent>

                                        <CardFooter className="w-full flex flex-col gap-2 p-3 md:p-4 relative z-10 border-t border-border/50">
                                            {app ? (
                                                <div className={`w-full text-center py-2 rounded-xl text-sm font-semibold ${
                                                    app.status === "APPROVED" ? "bg-green-500/20 text-green-600" :
                                                    app.status === "REJECTED" ? "bg-red-500/20 text-red-600" :
                                                    "bg-amber-500/20 text-amber-600"
                                                }`}>
                                                    {app.status === "PENDING" && "⏳ Applied - Pending"}
                                                    {app.status === "APPROVED" && "✅ Approved"}
                                                    {app.status === "REJECTED" && "❌ Rejected"}
                                                </div>
                                            ) : (
                                                <ApplyButton
                                                    internshipId={item.id}
                                                    onApplied={() => mutateApplications()}
                                                />
                                            )}
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                className="w-full rounded-xl py-4 md:py-5 text-sm md:text-base font-bold transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg border-2 hover:border-yellow-500 group bg-transparent"
                                                onClick={() => {
                                                    setSelectedInternship(item)
                                                    setOpen(true)
                                                }}
                                            >
                                                View Details
                                                <ArrowRight className="ml-2 h-3.5 w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )
                        })}
                </div>
            )}

            <InternshipDetailsModal
                open={open}
                onClose={() => setOpen(false)}
                internshipId={selectedInternship?.id || null}
            />
        </section>
    )
}
