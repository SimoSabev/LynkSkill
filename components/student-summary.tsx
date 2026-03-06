"use client"

import { Award, Star, Building2, Trophy, ThumbsUp } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface Summary {
    totalExperiences?: number
    avgSkillScore?: number
    uniqueCompanies: number
    professionalScore?: number
    endorsements?: Record<string, number>
    // Legacy fields
    totalPoints: number
    avgGrade: number
    allRound: number
}

function formatNumber(num: number) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(1)
}


export function StudentSummary({ summary }: { summary: Summary | null }) {
    const { t } = useTranslation()

    if (!summary) return null

    // Use new metrics if available, fallback to legacy
    const skillScore = summary.avgSkillScore ?? Math.round((summary.avgGrade / 6) * 100)
    const totalExp = summary.totalExperiences ?? Math.round(summary.totalPoints / 20)
    const proScore = summary.professionalScore ?? summary.allRound
    const highlyRecommended = summary.endorsements?.['highly_recommend'] ?? 0

    const stats = [
        {
            label: t("studentSummary.experiences"),
            value: totalExp,
            icon: Award,
        },
        {
            label: t("studentSummary.skillScore"),
            value: `${skillScore}%`,
            icon: Star,
        },
        {
            label: t("studentSummary.companies"),
            value: summary.uniqueCompanies,
            icon: Building2,
        },
        ...(highlyRecommended > 0 ? [{
            label: t("studentSummary.topEndorsed"),
            value: highlyRecommended,
            icon: ThumbsUp,
        }] : []),
    ]

    return (
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-white/90">
            {/* Professional Score - Compact inline version */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-white">
                        {formatNumber(proScore)}

                    </div>
                    <div className="text-xs text-white/70">{t("studentSummary.professionalScore")}</div>
                </div>

            </div>

            {/* Vertical divider - hidden on small screens */}
            <div className="hidden sm:block h-8 w-px bg-white/20" />

            {/* Individual Stats - Compact inline version */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
