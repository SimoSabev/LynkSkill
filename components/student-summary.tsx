"use client"

import { Award, Star, Building2, Trophy } from "lucide-react"

interface Summary {
    totalPoints: number
    avgGrade: number
    uniqueCompanies: number
    allRound: number
}

export function StudentSummary({ summary }: { summary: Summary | null }) {
    if (!summary) return null

    const stats = [
        {
            label: "Points",
            value: summary.totalPoints,
            icon: Award,
        },
        {
            label: "Avg Grade",
            value: summary.avgGrade.toFixed(1),
            icon: Star,
        },
        {
            label: "Companies",
            value: summary.uniqueCompanies,
            icon: Building2,
        },
    ]

    return (
        <div className="flex items-center gap-8 text-white/90">
            {/* All-Round Score - Compact inline version */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">{summary.allRound}</div>
                    <div className="text-xs text-white/70">All-Round Score</div>
                </div>
            </div>

            {/* Vertical divider */}
            <div className="h-8 w-px bg-white/20" />

            {/* Individual Stats - Compact inline version */}
            <div className="flex items-center gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                        <stat.icon className="h-4 w-4 text-white/80" />
                        <div>
                            <div className="text-lg font-semibold text-white">{stat.value}</div>
                            <div className="text-xs text-white/70">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
