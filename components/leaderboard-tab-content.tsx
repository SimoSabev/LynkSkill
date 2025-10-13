"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Trophy, Award, Medal, TrendingUp, Building2, GraduationCap, Sparkles } from "lucide-react"

interface StudentRank {
    id: string
    name: string
    email: string
    imageUrl?: string
    totalPoints: number
    avgGrade: number
    uniqueCompanies: number
    allRound: number
}

export function LeaderboardTabContent() {
    const [students, setStudents] = useState<StudentRank[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStudents() {
            try {
                const res = await fetch("/api/leaderboard")
                const data = await res.json()
                setStudents(data)
            } catch (err) {
                console.error("Failed to fetch leaderboard", err)
            } finally {
                setLoading(false)
            }
        }
        loadStudents()
    }, [])

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full rounded-2xl" />
                    ))}
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (students.length === 0) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
                    <p className="text-muted-foreground max-w-md">
                        The leaderboard will populate as students complete assignments and earn points.
                    </p>
                </div>
            </div>
        )
    }

    const topThree = students.slice(0, 3)
    const restOfStudents = students.slice(3)

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-6 w-6 text-yellow-500" />
            case 2:
                return <Award className="h-6 w-6 text-slate-400" />
            case 3:
                return <Medal className="h-6 w-6 text-amber-600" />
            default:
                return null
        }
    }

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "from-yellow-400/30 via-amber-400/20 to-yellow-500/30 border-yellow-500/40 shadow-yellow-500/20"
            case 2:
                return "from-slate-300/30 via-slate-400/20 to-slate-500/30 border-slate-400/40 shadow-slate-400/20"
            case 3:
                return "from-orange-400/30 via-amber-500/20 to-orange-500/30 border-orange-500/40 shadow-orange-500/20"
            default:
                return "from-background to-background border-border/40"
        }
    }

    const getPodiumOrder = (rank: number) => {
        switch (rank) {
            case 1:
                return "order-2 md:order-2"
            case 2:
                return "order-1 md:order-1"
            case 3:
                return "order-3 md:order-3"
            default:
                return ""
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="space-y-8 sm:space-y-12 lg:space-y-16">
                {/* Top 3 Podium */}
                {topThree.length > 0 && (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="text-center space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">Top Performers</h2>
                                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground">Celebrating our highest achievers</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
                            {[topThree[1], topThree[0], topThree[2]].map((student, visualIndex) => {
                                if (!student) return null
                                const actualRank = students.findIndex((s) => s.id === student.id) + 1
                                const isFirst = actualRank === 1

                                return (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: visualIndex * 0.15, type: "spring", stiffness: 100 }}
                                        className={`w-full ${getPodiumOrder(actualRank)} ${isFirst ? "md:scale-105" : ""}`}
                                    >
                                        <Card
                                            className={`bg-gradient-to-br ${getRankColor(
                                                actualRank,
                                            )} backdrop-blur-sm border-2 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
                                                isFirst ? "shadow-xl" : "shadow-lg"
                                            }`}
                                        >
                                            <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    {getRankIcon(actualRank)}
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-base sm:text-lg font-bold px-3 py-1 ${
                                                            isFirst ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" : ""
                                                        }`}
                                                    >
                                                        #{actualRank}
                                                    </Badge>
                                                </div>

                                                <div className="flex justify-center">
                                                    <div
                                                        className={`${
                                                            isFirst ? "w-28 h-28 sm:w-32 sm:h-32" : "w-24 h-24 sm:w-28 sm:h-28"
                                                        } rounded-full ring-4 ${
                                                            actualRank === 1
                                                                ? "ring-yellow-500/60 shadow-lg shadow-yellow-500/30"
                                                                : actualRank === 2
                                                                    ? "ring-slate-400/60 shadow-lg shadow-slate-400/30"
                                                                    : "ring-orange-500/60 shadow-lg shadow-orange-500/30"
                                                        } overflow-hidden transition-all duration-300`}
                                                    >
                                                        <img
                                                            src={student.imageUrl || "/placeholder.svg?height=128&width=128"}
                                                            alt={student.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-center space-y-1 px-2">
                                                    <h3
                                                        className={`${isFirst ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"} font-bold text-balance line-clamp-2`}
                                                    >
                                                        {student.name}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground truncate px-2">{student.email}</p>
                                                </div>

                                                <div className="w-full space-y-3 sm:space-y-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="font-medium">Points</span>
                              </span>
                                                            <span className="font-bold text-base sm:text-lg">{student.totalPoints}</span>
                                                        </div>
                                                        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full ${
                                                                    actualRank === 1
                                                                        ? "bg-yellow-500"
                                                                        : actualRank === 2
                                                                            ? "bg-slate-400"
                                                                            : "bg-orange-500"
                                                                } transition-all duration-500`}
                                                                style={{
                                                                    width: `${Math.min((student.totalPoints / (topThree[0]?.totalPoints || 1)) * 100, 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="font-medium">Avg Grade</span>
                            </span>
                                                        <span className="font-semibold text-sm sm:text-base">{student.avgGrade}%</span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="font-medium">Companies</span>
                            </span>
                                                        <span className="font-semibold text-sm sm:text-base">{student.uniqueCompanies}</span>
                                                    </div>
                                                </div>

                                                <div className="w-full pt-4 border-t border-border/50">
                                                    <div className="text-center space-y-1">
                                                        <p className="text-xs text-muted-foreground font-medium">All-Round Score</p>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <p
                                                                className={`${isFirst ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"} font-bold bg-gradient-to-r ${
                                                                    actualRank === 1
                                                                        ? "from-yellow-600 to-amber-600"
                                                                        : actualRank === 2
                                                                            ? "from-slate-600 to-slate-700"
                                                                            : "from-orange-600 to-amber-700"
                                                                } bg-clip-text text-transparent`}
                                                            >
                                                                {student.allRound}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Rest of the Rankings */}
                {restOfStudents.length > 0 && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                            <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground">Other Top Students</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        </div>

                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {restOfStudents.map((student, index) => {
                                const actualRank = index + 4
                                return (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/40 hover:border-primary/30">
                                            <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4 h-full flex flex-col">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="font-bold text-sm shrink-0">
                                                        #{actualRank}
                                                    </Badge>
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 ring-border/50 shrink-0">
                                                        <img
                                                            src={student.imageUrl || "/placeholder.svg?height=48&width=48"}
                                                            alt={student.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm sm:text-base truncate">{student.name}</h4>
                                                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm flex-1">
                                                    <div className="space-y-1 bg-muted/30 rounded-lg p-2 sm:p-3">
                                                        <p className="text-muted-foreground text-xs font-medium">Points</p>
                                                        <p className="font-bold text-sm sm:text-base">{student.totalPoints}</p>
                                                    </div>
                                                    <div className="space-y-1 bg-muted/30 rounded-lg p-2 sm:p-3">
                                                        <p className="text-muted-foreground text-xs font-medium">Avg Grade</p>
                                                        <p className="font-semibold text-sm sm:text-base">{student.avgGrade}%</p>
                                                    </div>
                                                    <div className="space-y-1 bg-muted/30 rounded-lg p-2 sm:p-3">
                                                        <p className="text-muted-foreground text-xs font-medium">Companies</p>
                                                        <p className="font-semibold text-sm sm:text-base">{student.uniqueCompanies}</p>
                                                    </div>
                                                    <div className="space-y-1 bg-primary/10 rounded-lg p-2 sm:p-3 border border-primary/20">
                                                        <p className="text-muted-foreground text-xs font-medium">All-Round</p>
                                                        <p className="font-bold text-primary text-sm sm:text-base">{student.allRound}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
