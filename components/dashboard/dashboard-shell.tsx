"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { Menu, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModeToggle } from "@/components/theme-toggle"
import { SignedIn } from "@clerk/nextjs"
import { LynkSkillUserButton } from "@/components/clerk-theme"
import { NotificationBell } from "@/components/notification-bell"
import { LanguageSwitcher } from "@/components/language-switcher"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { StudentAIChat } from "@/components/student-ai-chat"
import { CompanyAIChat } from "@/components/company-ai-chat"
import { MascotScene } from "@/components/MascotScene"
import { useDashboard } from "@/lib/dashboard-context"
import { useAIMode } from "@/lib/ai-mode-context"
import { useTranslation } from "@/lib/i18n"
import { useSettings } from "@/lib/settings-context"
import { useTeamMemberPermissions } from "@/lib/team-member-permissions-context"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// Page transition variants - optimized for speed
const pageVariants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
    exit: {
        opacity: 0,
    },
}

const pageTransition = {
    duration: 0.15,
    ease: "easeOut" as const,
}

interface DashboardShellProps {
    children: React.ReactNode
    userType: "Student" | "Company" | "TeamMember"
    memberPermissions?: string[]
}

export function DashboardShell({ children, userType, memberPermissions = [] }: DashboardShellProps) {
    const { t } = useTranslation()
    const { isAIMode } = useAIMode()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showMascot, setShowMascot] = useState(false)
    
    // Get settings for animations - use optional call since context may not be wrapped
    const settingsContext = useSettings()
    const animationsEnabled = settingsContext?.settings?.animationsEnabled ?? true

    const {
        user,
        company,
        isInitialLoading,
    } = useDashboard()

    const companyName = company?.name ?? null
    const companyLogo = company?.logo ?? null
    const userName = user?.profile?.name ?? null
    const { role: memberRole } = useTeamMemberPermissions()

    // Check if intro should be shown
    useEffect(() => {
        if (user && !user.introShown) {
            setShowMascot(true)
        }
    }, [user])

    if (isInitialLoading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-background">
                <motion.div
                    className="absolute inset-0 -z-10 opacity-20"
                    animate={{
                        background: [
                            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
                            "radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
                            "radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
                        ],
                    }}
                    transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />

                {/* Sidebar Skeleton */}
                <div className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-background md:block">
                    <div className="flex h-full flex-col">
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-11 w-11 rounded-xl" />
                                <div>
                                    <Skeleton className="h-4 w-24 mb-1" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        </div>
                        <div className="p-3 border-b">
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <div className="flex-1 p-3 space-y-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-xl" />
                            ))}
                        </div>
                        <div className="border-t p-3 space-y-2">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="min-h-screen md:pl-72">
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
                        <Skeleton className="h-8 w-8 rounded md:hidden" />
                        <Skeleton className="h-8 w-8 rounded hidden md:block" />
                        <div className="flex flex-1 items-center justify-between">
                            <Skeleton className="h-6 w-48" />
                            <div className="flex items-center gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-8 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-6">
                        <div className="space-y-6">
                            <Skeleton className="h-48 w-full rounded-3xl" />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            {/* Animated Background */}
            <motion.div
                className="fixed inset-0 -z-10 opacity-20 pointer-events-none"
                animate={{
                    background: [
                        "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.4) 0%, rgba(53, 71, 125, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                        "radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.4) 0%, rgba(81, 45, 168, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                        "radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.4) 0%, rgba(32, 119, 188, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                    ],
                }}
                transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

            {/* Sidebar - Mobile */}
            <SidebarNav
                userType={userType}
                isOpen={mobileMenuOpen}
                isMobile
                onClose={() => setMobileMenuOpen(false)}
                companyName={companyName}
                companyLogo={companyLogo}
                memberPermissions={memberPermissions}
                userName={userName}
                memberRole={memberRole || null}
            />

            {/* Sidebar - Desktop */}
            <SidebarNav
                userType={userType}
                isOpen={sidebarOpen}
                isMobile={false}
                companyName={companyName}
                companyLogo={companyLogo}
                memberPermissions={memberPermissions}
                userName={userName}
                memberRole={memberRole || null}
            />

            {/* Main Content */}
            <div className={cn(
                "min-h-screen transition-[padding] duration-150 ease-in-out",
                sidebarOpen ? "md:pl-72" : "md:pl-0"
            )}>
                {/* Header */}
                <header className="sticky top-0 z-10 flex h-16 w-full items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden rounded-xl hover:bg-primary/10"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex rounded-xl hover:bg-purple-500/10"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <PanelLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex flex-1 w-full items-center justify-between gap-2">
                        <h1 className="text-lg sm:text-xl font-semibold">
                            {t('dashboard.title')}
                        </h1>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <NotificationBell />
                            <LanguageSwitcher />

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-xl hover:bg-purple-500/10"
                                        >
                                            <ModeToggle />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-purple-950/90 border-purple-500/30">
                                        {t('dashboard.toggleTheme')}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <SignedIn>
                                <div className="flex items-center relative">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-md animate-pulse" />
                                    <LynkSkillUserButton />
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 p-4 md:p-6">
                    <AnimatePresence mode="wait">
                        {isAIMode ? (
                            <motion.div
                                key="ai-mode"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="min-h-[calc(100vh-120px)]"
                            >
                                {userType === "Student" ? (
                                    <StudentAIChat />
                                ) : userType === "Company" ? (
                                    <CompanyAIChat />
                                ) : (
                                    <CompanyAIChat />
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key={pathname}
                                initial={animationsEnabled ? "initial" : false}
                                animate="animate"
                                exit={animationsEnabled ? "exit" : undefined}
                                variants={pageVariants}
                                transition={pageTransition}
                            >
                                {children}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Mascot Scene */}
            {showMascot && (
                <MascotScene
                    mascotUrl="/linky-mascot.png"
                    steps={
                        userType === "Student"
                            ? [
                                `👋 Hi <strong>${userName || "Student"}</strong>, I am <strong>Linky</strong>, your guide in <em>LynkSkill</em>.`,
                                `✨ You made the <strong>best choice</strong> choosing <em>LynkSkill</em> for your professional growth.`,
                                `🚀 Let me show you around!`,
                                `📁 Start by creating your <strong>Portfolio</strong> to showcase your skills.`,
                                `💼 Browse <strong>Internships</strong> and apply to opportunities that match your interests.`,
                                `📚 Track your <strong>Experience</strong> and earn points for your achievements.`,
                                `✨ Try <strong>AI Mode</strong> to get personalized recommendations!`,
                            ]
                            : userType === "TeamMember"
                            ? [
                                `👋 Hi <strong>${userName || "Team Member"}</strong>, I am <strong>Linky</strong>, your guide in <em>LynkSkill</em>.`,
                                `🏢 Welcome to <strong>${companyName || "your company"}</strong>'s team on LynkSkill!`,
                                `🚀 Let me show you around!`,
                                `🔑 Your dashboard shows only the tools your role has access to.`,
                                `📋 Use the sidebar to navigate to your available features.`,
                                `✨ Try <strong>AI Mode</strong> for smart assistance!`,
                            ]
                            : [
                                `👋 Hi <strong>${companyName || "Company"}</strong>, I am <strong>Linky</strong>, your guide in <em>LynkSkill</em>.`,
                                `🏢 Welcome to LynkSkill for finding top talent!`,
                                `🚀 Let me show you around!`,
                                `📝 Create <strong>Internships</strong> to attract students.`,
                                `📥 Review <strong>Applications</strong> from interested candidates.`,
                                `🏆 Check the <strong>Leaderboard</strong> to find top performers.`,
                                `✨ Try <strong>AI Mode</strong> to find perfect candidates automatically!`,
                            ]
                    }
                    onFinish={async () => {
                        setShowMascot(false)
                        await fetch("/api/user/intro-shown", { method: "POST" })
                    }}
                    userType={userType === "TeamMember" ? "Company" : userType}
                />
            )}
        </div>
    )
}
