"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Briefcase, Calendar, MapPin, Euro, Clock, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InternshipModal } from "@/components/internship-modal"
import { useTranslation } from "@/lib/i18n"
import { useDashboard } from "@/lib/dashboard-context"
import type { Internship } from "@/app/types"
import { format } from "date-fns"
import Link from "next/link"

export default function CreateInternshipPage() {
    const { t } = useTranslation()
    const [modalOpen, setModalOpen] = useState(true)
    const { internships, isLoadingInternships, mutateInternships } = useDashboard()

    const handleCreate = () => {
        mutateInternships()
        setModalOpen(false)
    }

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return "N/A"
        return format(new Date(date), "MMM d, yyyy")
    }

    const getStatusBadge = (internship: Internship) => {
        const now = new Date()
        const appStart = internship.applicationStart ? new Date(internship.applicationStart) : null
        const appEnd = internship.applicationEnd ? new Date(internship.applicationEnd) : null

        if (appEnd && now > appEnd) {
            return <Badge variant="secondary" className="bg-gray-500/20 text-gray-600 dark:text-gray-400">Closed</Badge>
        }
        if (appStart && now < appStart) {
            return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 dark:text-blue-400">Upcoming</Badge>
        }
        return <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Active</Badge>
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-blue-500/5 border border-purple-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-lg">
                            <Briefcase className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{t('navigation.createNew')}</h1>
                            <p className="text-muted-foreground">Create a new internship opportunity</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setModalOpen(true)}
                        size="lg"
                        className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Internship
                    </Button>
                </div>
            </motion.div>

            {/* History Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                            <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold">Creation History</h2>
                            <p className="text-sm text-muted-foreground">Your previously created internships</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                        {internships.length} {internships.length === 1 ? 'internship' : 'internships'}
                    </Badge>
                </div>

                {isLoadingInternships ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="pb-3">
                                    <div className="h-6 bg-muted rounded w-3/4" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                    <div className="h-4 bg-muted rounded w-2/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : internships.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                                <Sparkles className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No internships yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first internship to start receiving applications</p>
                            <Button onClick={() => setModalOpen(true)} variant="outline" className="rounded-xl">
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Internship
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {internships.map((internship, index) => (
                                <motion.div
                                    key={internship.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="group hover:shadow-lg hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                    {internship.title}
                                                </CardTitle>
                                                {getStatusBadge(internship)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate">{internship.location || "Remote"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                                <span>{formatDate(internship.applicationStart)} - {formatDate(internship.applicationEnd)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Euro className="h-4 w-4 flex-shrink-0" />
                                                {internship.paid ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {internship.salary ? `€${internship.salary}/month` : "Paid"}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">Unpaid</span>
                                                )}
                                            </div>
                                            <div className="pt-2">
                                                <Link href="/dashboard/company/internships">
                                                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-purple-500/10 rounded-lg">
                                                        View Details
                                                        <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            <InternshipModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onCreate={handleCreate}
            />
        </div>
    )
}
