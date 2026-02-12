"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Home, Briefcase, FileText, Award, Trophy, Bookmark, MessageSquare, CalendarDays } from "lucide-react"
import { InternshipModal } from "@/components/internship-modal"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { DashboardHero } from "./dashboard-hero"
import { RecentInternshipsSection } from "./recent-internships-section"
import { RecentApplicationsSection } from "./recent-applications-section"
import { ActiveAssignmentsSection } from "./active-assignments-section"
import { CommunityHighlights } from "./community-highlights-section"
import { Portfolio } from "./portfolio"
import { ApplicationsTabContent } from "./apply-tab-content"
import { AssignmentsTabContent } from "./assignments-tab-content"
import MyExperienceTabContent from "./my-experience-tab-content"
import type { Internship } from "@/app/types"
// import {AnalyticsTabContent} from "@/components/analytics-tab-content";
import { LeaderboardTabContent } from "@/components/leaderboard-tab-content"
import { SavedInternshipsTab } from "@/components/saved-internships-tab"
import { MessagesTabContent } from "@/components/messages-tab-content"
import { InterviewsTabContent } from "@/components/interviews-tab-content"
import { MascotScene } from "@/components/MascotScene"
import { StudentAIChat } from "@/components/student-ai-chat"
import { CompanyAIChat } from "@/components/company-ai-chat"
import { TeamTabContent } from "@/components/team-tab-content"
import { useDashboard } from "@/lib/dashboard-context"
import { useAIMode } from "@/lib/ai-mode-context"
import { useTranslation } from "@/lib/i18n"

interface DashboardLayoutProps {
    userType: "Student" | "Company"
    children?: React.ReactNode
}

export function DashboardLayout({ userType }: DashboardLayoutProps) {
    const { t } = useTranslation()
    const { isAIMode } = useAIMode()
    const [activeTab, setActiveTab] = useState("home")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [showMascot, setShowMascot] = useState(false)

    // Use centralized context instead of local state + multiple fetches
    const { 
        user, 
        company, 
        internships: contextInternships, 
        isInitialLoading,
        mutateInternships 
    } = useDashboard()

    // Derived state from context
    const companyName = company?.name ?? null
    const companyLogo = company?.logo ?? null
    const userName = user?.profile?.name ?? null

    // Local state for internships that can be mutated (for create/update/delete)
    const [, setLocalInternships] = useState<Internship[]>([])
    
    // Sync context internships to local state
    useEffect(() => {
        if (contextInternships.length > 0) {
            setLocalInternships(contextInternships as Internship[])
        }
    }, [contextInternships])

    // TEMPORARILY DISABLED: Mascot intro scene
    // To re-enable, uncomment the condition below
    useEffect(() => {
        // if (user && !user.introShown) {
        //     setShowMascot(true)
        // }
    }, [user])

    function handleCreateInternship(newInternship: Internship) {
        setLocalInternships((prev) => [newInternship, ...prev])
        // Also update the context cache
        mutateInternships()
    }

    // ✅ Listen for internship events from children
    useEffect(() => {
        function handleDeleted(e: Event) {
            const customEvent = e as CustomEvent<string>
            setLocalInternships((prev) => prev.filter((i) => i.id !== customEvent.detail))
        }

        function handleUpdated(e: Event) {
            const customEvent = e as CustomEvent<Internship>
            setLocalInternships((prev) => prev.map((i) => (i.id === customEvent.detail.id ? customEvent.detail : i)))
        }

        function handleNavigateToTab(e: Event) {
            const customEvent = e as CustomEvent<string>
            setActiveTab(customEvent.detail)
        }

        window.addEventListener("internshipDeleted", handleDeleted)
        window.addEventListener("internshipUpdated", handleUpdated)
        window.addEventListener("navigateToTab", handleNavigateToTab)

        return () => {
            window.removeEventListener("internshipDeleted", handleDeleted)
            window.removeEventListener("internshipUpdated", handleUpdated)
            window.removeEventListener("navigateToTab", handleNavigateToTab)
        }
    }, [])


    if (isInitialLoading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-background">

                {/* Sidebar Skeleton */}
                <div className="fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background md:block">
                    <div className="flex h-full flex-col">
                        <div className="p-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-2xl" />
                                <div>
                                    <Skeleton className="h-4 w-20 mb-1" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        </div>
                        <div className="px-3 py-2">
                            <Skeleton className="h-10 w-full rounded-2xl" />
                        </div>
                        <div className="flex-1 px-3 py-2 space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-2xl" />
                            ))}
                        </div>
                        <div className="border-t p-3 space-y-2">
                            <Skeleton className="h-10 w-full rounded-2xl" />
                            <Skeleton className="h-10 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="min-h-screen md:pl-64">
                    {/* Header Skeleton */}
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
                        <Skeleton className="h-8 w-8 rounded md:hidden" />
                        <Skeleton className="h-8 w-8 rounded hidden md:block" />
                        <div className="flex flex-1 items-center justify-between">
                            <Skeleton className="h-6 w-48" />
                            <div className="flex items-center gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-8 rounded-2xl" />
                                ))}
                                <Skeleton className="h-9 w-9 rounded-full" />
                            </div>
                        </div>
                    </header>

                    {/* Main Content Skeleton */}
                    <main className="flex-1 p-4 md:p-6">
                        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <Skeleton className="h-12 w-full max-w-[600px] rounded-2xl" />
                            <div className="hidden md:flex gap-2">
                                <Skeleton className="h-10 w-32 rounded-2xl" />
                                <Skeleton className="h-10 w-32 rounded-2xl" />
                            </div>
                        </div>
                        <div className="space-y-8">
                            <Skeleton className="h-48 w-full rounded-3xl" />
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-48" />
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-64 w-full rounded-3xl" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">

            {/* Sidebar - Mobile */}
            <DashboardSidebar
                userType={userType}
                isOpen={mobileMenuOpen}
                isMobile
                onClose={() => setMobileMenuOpen(false)}
                companyName={companyName}
                companyLogo={companyLogo}
                setActiveTab={setActiveTab}
            />

            {/* Sidebar - Desktop */}
            <DashboardSidebar
                userType={userType}
                isOpen={sidebarOpen}
                isMobile={false}
                companyName={companyName}
                companyLogo={companyLogo}
                setActiveTab={setActiveTab}
            />

            {/* Main Content */}
            <div className={cn("min-h-screen transition-all duration-300 ease-in-out", sidebarOpen ? "md:pl-64" : "md:pl-0")}>
                <DashboardHeader
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onToggleMobileMenu={() => setMobileMenuOpen(true)}
                    userType={userType}
                />

                <main className="flex-1 p-4 md:p-6 text-foreground">
                    <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <motion.div
                                className="hidden md:block relative"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <TabsList className="relative h-auto gap-1 border border-border/50 p-1 rounded-xl bg-muted/50">
                                    <TabsTrigger
                                        value="home"
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    >
                                        <Home className="h-4 w-4" />
                                        <span className="relative">
                                            {t('navigation.home')}
                                        </span>
                                    </TabsTrigger>

                                    {userType === "Student" ? (
                                        <TabsTrigger
                                            value="apps"
                                            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        >
                                            <Briefcase className="h-4 w-4" />
                                            <span>{t('navigation.portfolio')}</span>
                                        </TabsTrigger>
                                    ) : (
                                        <TabsTrigger
                                            value="leaderboard"
                                            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        >
                                            <Trophy className="h-4 w-4" />
                                            <span>{t('navigation.leaderboard')}</span>
                                        </TabsTrigger>
                                    )}

                                    <TabsTrigger
                                        value="files"
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span>{t('navigation.applied')}</span>
                                    </TabsTrigger>

                                    {/* <TabsTrigger
                                        value="projects"
                                        className="group cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:scale-105 data-[state=active]:scale-105"
                                    >
                                        <ClipboardList className="h-4 w-4 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]" />
                                        <span>Assignments</span>
                                    </TabsTrigger> */}

                                    <TabsTrigger
                                        value="learn"
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    >
                                        <Award className="h-4 w-4" />
                                        <span>{t('navigation.myExperience')}</span>
                                    </TabsTrigger>

                                    {userType === "Student" && (
                                        <TabsTrigger
                                            value="saved"
                                            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        >
                                            <Bookmark className="h-4 w-4" />
                                            <span>{t('navigation.saved')}</span>
                                        </TabsTrigger>
                                    )}

                                    <TabsTrigger
                                        value="messages"
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{t('navigation.messages')}</span>
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="interviews"
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    >
                                        <CalendarDays className="h-4 w-4" />
                                        <span>{t('navigation.interviews')}</span>
                                    </TabsTrigger>
                                </TabsList>
                            </motion.div>

                            <div className="md:hidden w-full">
                                <div
                                    className="w-full overflow-x-auto scrollbar-hide"
                                    style={{
                                        scrollbarWidth: "none",
                                        msOverflowStyle: "none",
                                        WebkitOverflowScrolling: "touch",
                                    }}
                                >
                                    <TabsList className="flex w-full min-w-full h-auto border border-border/50 p-1 rounded-xl bg-muted/50">
                                        <TabsTrigger
                                            value="home"
                                            className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                        >
                                            <Home className="h-4 w-4" />
                                            <span className="whitespace-nowrap text-center">{t('navigation.home')}</span>
                                        </TabsTrigger>

                                        {userType === "Student" ? (
                                            <TabsTrigger
                                                value="apps"
                                                className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                            >
                                                <Briefcase className="h-4 w-4" />
                                                <span className="whitespace-nowrap text-center">{t('navigation.portfolio')}</span>
                                            </TabsTrigger>
                                        ) : (
                                            <TabsTrigger
                                                value="leaderboard"
                                                className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                            >
                                                <Trophy className="h-4 w-4" />
                                                <span className="whitespace-nowrap text-center">{t('navigation.leaderboard')}</span>
                                            </TabsTrigger>
                                        )}

                                        <TabsTrigger
                                            value="files"
                                            className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span className="whitespace-nowrap text-center">{t('navigation.applied')}</span>
                                        </TabsTrigger>

                                        <TabsTrigger
                                            value="learn"
                                            className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                        >
                                            <Award className="h-4 w-4" />
                                            <span className="whitespace-nowrap text-center">{t('navigation.myExperience')}</span>
                                        </TabsTrigger>

                                        {userType === "Student" && (
                                            <TabsTrigger
                                                value="saved"
                                                className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                            >
                                                <Bookmark className="h-4 w-4" />
                                                <span className="whitespace-nowrap text-center">{t('navigation.saved')}</span>
                                            </TabsTrigger>
                                        )}

                                        <TabsTrigger
                                            value="messages"
                                            className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="whitespace-nowrap text-center">{t('navigation.messages')}</span>
                                        </TabsTrigger>

                                        <TabsTrigger
                                            value="interviews"
                                            className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg font-medium text-[10px] leading-tight transition-colors duration-150 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground flex-1 min-w-0"
                                        >
                                            <CalendarDays className="h-4 w-4" />
                                            <span className="whitespace-nowrap text-center">{t('navigation.interviews')}</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>

                            <div className="hidden lg:flex gap-2">
                                {userType === "Company" && (
                                    <Button
                                        className="rounded-xl font-semibold transition-colors duration-150"
                                        onClick={() => setModalOpen(true)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Internship
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Modal */}
                        <InternshipModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateInternship} />

                        {/* AI Mode Content */}
                        <AnimatePresence mode="wait">
                            {isAIMode ? (
                                <motion.div
                                    key="ai-mode"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="min-h-[calc(100vh-200px)]"
                                >
                                    {userType === "Student" ? (
                                        <StudentAIChat />
                                    ) : (
                                        <CompanyAIChat />
                                    )}
                                </motion.div>
                            ) : (
                                <div
                                    key={activeTab}
                                >
                                    <TabsContent value="home" className="space-y-8 mt-0">
                                        <DashboardHero userType={userType} />
                                        <RecentInternshipsSection userType={userType} setActiveTab={setActiveTab} />
                                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                            <RecentApplicationsSection userType={userType} setActiveTab={setActiveTab} />
                                            <ActiveAssignmentsSection setActiveTab={setActiveTab} />
                                        </div>
                                        <CommunityHighlights setActiveTab={setActiveTab} />
                                    </TabsContent>

                                    {userType === "Student" ? (
                                        <TabsContent value="apps" className="space-y-8 mt-0">
                                            <Portfolio userType={userType} />
                                        </TabsContent>
                                    ) : (
                                        <TabsContent value="leaderboard" className="space-y-8 mt-0">
                                            <LeaderboardTabContent />
                                        </TabsContent>
                                    )}

                                    <TabsContent value="files" className="space-y-8 mt-0">
                                        <ApplicationsTabContent userType={userType} />
                                    </TabsContent>

                                    <TabsContent value="projects" className="space-y-8 mt-0">
                                        <AssignmentsTabContent />
                                    </TabsContent>

                                    <TabsContent value="learn" className="space-y-8 mt-0">
                                        <MyExperienceTabContent />
                                    </TabsContent>

                                    {userType === "Student" && (
                                        <TabsContent value="saved" className="space-y-8 mt-0">
                                            <SavedInternshipsTab />
                                        </TabsContent>
                                    )}

                                    <TabsContent value="messages" className="space-y-8 mt-0">
                                        <MessagesTabContent userType={userType} />
                                    </TabsContent>

                                    <TabsContent value="interviews" className="space-y-8 mt-0">
                                        <InterviewsTabContent userType={userType} />
                                    </TabsContent>

                                    {userType === "Company" && (
                                        <TabsContent value="team" className="space-y-8 mt-0">
                                            <TeamTabContent />
                                        </TabsContent>
                                    )}
                                </div>
                            )}
                        </AnimatePresence>
                    </Tabs>
                </main>
            </div>
            {showMascot && (
                <MascotScene
                    mascotUrl="/linky-mascot.png"
                    steps={
                        userType === "Student"
                            ? [
                                `👋 Hi <strong>${userName || "Student"}</strong>, I am <strong>Linky</strong>, your guide in <em>LynkSkill</em>.`,
                                `✨ You made the <strong>best choice</strong> choosing <em>LynkSkill</em> for your professional growth.`,
                                `🚀 So let me guide you through it.`,
                                `📁 First, here you have to <strong>make your portfolio</strong> so you can start applying.`,
                                `💼 After it is done, here you can <strong>apply to the businesses</strong>.`,
                                `🕓 Once you have applied, here you can see if you are <em>pending</em>, <em>accepted</em> or <em>not</em>.`,
                                `📚 After you have been approved, this section <strong>"Assignments"</strong> is the place where you see the tasks that you start with a company.`,
                                `🌟 Finally, this section <strong>"My Experience"</strong> is where you document your journey and receive points.`,
                            ]
                            : [
                                `👋 Hi <strong>${companyName || "Company"}</strong>, I am <strong>Linky</strong>, your guide in <em>LynkSkill</em>.`,
                                `🏢 You made the <strong>best choice</strong> choosing <em>LynkSkill</em> for finding the next generation that will inherit your profession.`,
                                `🚀 So let me guide you through it.`,
                                `📝 First, from here you <strong>create an internship</strong> so students can see you.`,
                                `📥 After that, this is the tab where you can <strong>see students who applied</strong> and decide to accept or reject them.<br/><br/><em>P.S. If you gave them a test, they must complete it before you can decide.</em>`,
                                `🧩 Here you can track any assignments you gave to students.`,
                                `🎓 On the <strong>"My Experience"</strong> tab, you can see which students have tagged you with pictures and videos of your work together. You can validate and accept if they really worked with you — or reject if not. Then you'll <strong>grade them</strong> based on their performance.`,
                            ]
                    }
                    onFinish={async () => {
                        setShowMascot(false)
                        await fetch("/api/user/intro-shown", { method: "POST" })
                    }}
                    setActiveTab={setActiveTab}
                    userType={userType}
                />
            )}
        </div>
    )
}

