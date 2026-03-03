"use client"

import { useRouter } from "next/navigation"
import { Scale, FileText, Shield, AlertCircle, Users, Brain, Gavel, RefreshCw, ArrowLeft, Mail } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LandingThemeToggle } from "@/components/landing-theme-toggle"
import { motion } from "framer-motion"

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
    }),
}

export default function TermsPage() {
    const { t } = useTranslation()
    const router = useRouter()

    const sections = [
        {
            icon: FileText,
            title: t("terms.agreementToTerms"),
            content: t("terms.agreementToTermsText"),
            color: "purple",
        },
        {
            icon: Shield,
            title: t("terms.userResponsibilities"),
            color: "blue",
            subsections: [
                { title: t("terms.accountRegistration"), content: t("terms.accountRegistrationText") },
                {
                    title: t("terms.acceptableUse"),
                    list: [
                        t("terms.acceptableUse1"),
                        t("terms.acceptableUse2"),
                        t("terms.acceptableUse3"),
                        t("terms.acceptableUse4"),
                        t("terms.acceptableUse5"),
                    ],
                },
                { title: t("terms.companyVerification"), content: t("terms.companyVerificationText") },
                { title: t("terms.studentInformation"), content: t("terms.studentInformationText") },
            ],
        },
        { icon: Brain, title: t("terms.intellectualProperty"), content: t("terms.intellectualPropertyText"), color: "violet" },
        { icon: AlertCircle, title: t("terms.limitationOfLiability"), content: t("terms.limitationOfLiabilityText"), color: "amber" },
        { icon: Users, title: t("terms.termination"), content: t("terms.terminationText"), color: "red" },
        { icon: Gavel, title: t("terms.governingLaw"), content: t("terms.governingLawText"), color: "emerald" },
        { icon: RefreshCw, title: t("terms.changesToTerms"), content: t("terms.changesToTermsText"), color: "cyan" },
    ]

    const colorMap: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
        purple: { bg: "bg-purple-500/5", border: "border-purple-500/20 hover:border-purple-500/40", icon: "from-purple-600 to-purple-500 shadow-purple-500/25", glow: "bg-purple-500/10" },
        blue: { bg: "bg-blue-500/5", border: "border-blue-500/20 hover:border-blue-500/40", icon: "from-blue-600 to-blue-500 shadow-blue-500/25", glow: "bg-blue-500/10" },
        violet: { bg: "bg-violet-500/5", border: "border-violet-500/20 hover:border-violet-500/40", icon: "from-violet-600 to-violet-500 shadow-violet-500/25", glow: "bg-violet-500/10" },
        amber: { bg: "bg-amber-500/5", border: "border-amber-500/20 hover:border-amber-500/40", icon: "from-amber-600 to-amber-500 shadow-amber-500/25", glow: "bg-amber-500/10" },
        red: { bg: "bg-red-500/5", border: "border-red-500/20 hover:border-red-500/40", icon: "from-red-600 to-red-500 shadow-red-500/25", glow: "bg-red-500/10" },
        emerald: { bg: "bg-emerald-500/5", border: "border-emerald-500/20 hover:border-emerald-500/40", icon: "from-emerald-600 to-emerald-500 shadow-emerald-500/25", glow: "bg-emerald-500/10" },
        cyan: { bg: "bg-cyan-500/5", border: "border-cyan-500/20 hover:border-cyan-500/40", icon: "from-cyan-600 to-cyan-500 shadow-cyan-500/25", glow: "bg-cyan-500/10" },
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px]" />
            </div>

            {/* Top navigation bar */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        {t("common.back")}
                    </button>
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        <LandingThemeToggle />
                    </div>
                </div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 space-y-6"
                >
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5">
                        <Scale className="w-10 h-10 text-purple-500" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                            {t("terms.title")}
                        </h1>
                        <p className="text-muted-foreground text-base">{t("terms.lastUpdated")}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/50" />
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
                    </div>
                </motion.div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, i) => {
                        const colors = colorMap[section.color || "purple"]
                        const Icon = section.icon
                        return (
                            <motion.div
                                key={i}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                variants={fadeUp}
                                className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} transition-all duration-300`}
                            >
                                <div className={`absolute -top-12 -right-12 w-32 h-32 ${colors.glow} rounded-full blur-3xl`} />
                                <div className="relative z-10 p-6 md:p-8">
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className={`shrink-0 p-2.5 rounded-xl bg-gradient-to-br ${colors.icon} shadow-lg`}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground pt-1">{section.title}</h2>
                                    </div>

                                    {section.content && (
                                        <p className="text-muted-foreground leading-relaxed pl-[52px]">{section.content}</p>
                                    )}

                                    {section.subsections && (
                                        <div className="space-y-5 pl-[52px]">
                                            {section.subsections.map((sub, j) => (
                                                <div key={j}>
                                                    <h3 className="font-semibold text-base text-foreground mb-2">{sub.title}</h3>
                                                    {sub.content && (
                                                        <p className="text-muted-foreground leading-relaxed">{sub.content}</p>
                                                    )}
                                                    {sub.list && (
                                                        <ul className="space-y-2 mt-2">
                                                            {sub.list.map((item, k) => (
                                                                <li key={k} className="flex items-start gap-3 text-muted-foreground">
                                                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                                                                    <span className="leading-relaxed">{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {j < section.subsections!.length - 1 && (
                                                        <div className="h-px bg-border/50 mt-5" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}

                    {/* Contact card */}
                    <motion.div
                        custom={sections.length}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={fadeUp}
                        className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-purple-500/5 transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
                        <div className="relative z-10 p-6 md:p-8">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg shadow-purple-500/25">
                                    <Mail className="h-5 w-5 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-foreground">{t("terms.contactUs")}</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {t("terms.contactUsText")}{" "}
                                        <a href="mailto:lynkskillweb@gmail.com" className="text-purple-500 hover:text-purple-400 underline underline-offset-4 font-medium transition-colors">
                                            lynkskillweb@gmail.com
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-60" />
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
