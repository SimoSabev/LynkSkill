"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Home, Briefcase, FileText, ClipboardList, Award, Trophy } from "lucide-react"
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
import { MascotScene } from "@/components/MascotScene"

interface DashboardLayoutProps {
    userType: "Student" | "Company"
    children?: React.ReactNode
}

export function DashboardLayout({ userType, children }: DashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState("home")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [internships, setInternships] = useState<Internship[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [companyName, setCompanyName] = useState<string | null>(null)
    const [companyLogo, setCompanyLogo] = useState<string | null>(null)
    const [showMascot, setShowMascot] = useState(false)
    const [mascotMessage, setMascotMessage] = useState("")
    const [userName, setUserName] = useState<string | null>(null)

    useEffect(() => {
        async function checkIntro() {
            const res = await fetch("/api/user/me")
            if (res.ok) {
                const data = await res.json()

                if (!data.introShown) {
                    if (data.role === "STUDENT") {
                        const username = data.profile?.name || "Student"
                        setUserName(username)
                    } else if (data.role === "COMPANY") {
                        const companyRes = await fetch("/api/company/me")
                        if (companyRes.ok) {
                            const company = await companyRes.json()
                            setCompanyName(company.name)
                        }
                    }

                    setShowMascot(true)
                }
            }
        }

        checkIntro()
    }, [])

    // ✅ Fetch internships
    useEffect(() => {
        async function loadInternships() {
            const res = await fetch("/api/internships")
            if (res.ok) {
                const data: Internship[] = await res.json()
                setInternships(data)
            }
        }

        loadInternships()
    }, [])

    function handleCreateInternship(newInternship: Internship) {
        setInternships((prev) => [newInternship, ...prev])
    }

    // ✅ Fetch company info
    useEffect(() => {
        async function loadCompany() {
            try {
                const res = await fetch("/api/company/me")
                if (res.ok) {
                    const data = await res.json()
                    setCompanyName(data.name)
                    setCompanyLogo(data.logo)
                }
            } catch (err) {
                console.error("Error loading company:", err)
            }
        }

        if (userType === "Company") {
            loadCompany()
        }
    }, [userType])

    // ✅ Listen for internship events from children
    useEffect(() => {
        function handleDeleted(e: Event) {
            const customEvent = e as CustomEvent<string>
            setInternships((prev) => prev.filter((i) => i.id !== customEvent.detail))
        }

        function handleUpdated(e: Event) {
            const customEvent = e as CustomEvent<Internship>
            setInternships((prev) => prev.map((i) => (i.id === customEvent.detail.id ? customEvent.detail : i)))
        }

        window.addEventListener("internshipDeleted", handleDeleted)
        window.addEventListener("internshipUpdated", handleUpdated)

        return () => {
            window.removeEventListener("internshipDeleted", handleDeleted)
            window.removeEventListener("internshipUpdated", handleUpdated)
        }
    }, [])

    // ✅ Fake loading animation
    useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoading(false), 1000)
        return () => clearTimeout(timer)
    }, [])

    if (isInitialLoading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-background">
                {/* Animated gradient background */}
                <motion.div
                    className="absolute inset-0 -z-10 opacity-20"
                    animate={{
                        background: [
                            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
                            "radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
                            "radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
                            "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)",
                        ],
                    }}
                    transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />

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
            <motion.div
                className="fixed inset-0 -z-10 opacity-20 pointer-events-none"
                animate={{
                    background: [
                        "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.4) 0%, rgba(53, 71, 125, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                        "radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.4) 0%, rgba(81, 45, 168, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                        "radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.4) 0%, rgba(32, 119, 188, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                        "radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.4) 0%, rgba(53, 71, 125, 0.3) 50%, rgba(0, 0, 0, 0) 100%)",
                    ],
                }}
                transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

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
                                <TabsList className="relative h-auto backdrop-blur-xl border border-purple-500/20 p-1.5 rounded-2xl shadow-lg overflow-hidden bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10">
                                    {/* Animated gradient background */}
                                    <motion.div
                                        className="absolute inset-0 opacity-30"
                                        animate={{
                                            background: [
                                                "linear-gradient(90deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.2) 100%)",
                                                "linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(59, 130, 246, 0.2) 100%)",
                                                "linear-gradient(90deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.2) 100%)",
                                            ],
                                        }}
                                        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                    />

                                    <TabsTrigger
                                        value="home"
                                        className="group cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:scale-105 data-[state=active]:scale-105"
                                    >
                                        <Home className="h-4 w-4 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]" />
                                        <span className="relative">
                                            Home
                                            {/*<span className="absolute inset-0 blur-sm opacity-0 group-data-[state=active]:opacity-100 bg-gradient-to-r from-purple-400 to-blue-400 transition-opacity duration-300" />*/}
                                        </span>
                                    </TabsTrigger>

                                    {userType === "Student" ? (
                                        <TabsTrigger
                                            value="apps"
                                            className="group cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:scale-105 data-[state=active]:scale-105"
                                        >
                                            <Briefcase className="h-4 w-4 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]" />
                                            <span>Portfolio</span>
                                        </TabsTrigger>
                                    ) : (
                                        <TabsTrigger
                                            value="leaderboard"
                                            className="group cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:scale-105 data-[state=active]:scale-105"
                                        >
                                            <Trophy className="h-4 w-4 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]" />
                                            <span>Leaderboard</span>
                                        </TabsTrigger>
                                    )}

                                    <TabsTrigger
                                        value="files"
                                        className="group cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:scale-105 data-[state=active]:scale-105"
                                    >
                                        <FileText className="h-4 w-4 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]" />
                                        <span>Applied</span>
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="projects"
                                        className="group cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:scale-105 data-[state=active]:scale-105"
                                    >
                                        <ClipboardList className="h-4 w-4 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]" />
                                        <span>Assignments</span>
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="learn"
                                        className="group cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-purple-500/10 hover:scale-105 data-[state=active]:scale-105"
                                    >
                                        <Award className="h-4 w-4 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)] group-hover:drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]" />
                                        <span>My Experience</span>
                                    </TabsTrigger>
                                </TabsList>
                            </motion.div>

                            <div className="md:hidden w-full">
                                <motion.div
                                    className="w-full overflow-x-auto scrollbar-hide"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        scrollbarWidth: "none",
                                        msOverflowStyle: "none",
                                        WebkitOverflowScrolling: "touch",
                                    }}
                                >
                                    <TabsList className="relative flex w-full min-w-full h-auto backdrop-blur-xl border border-purple-500/20 p-1.5 rounded-2xl shadow-lg overflow-visible bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10">
                                        {/* Animated gradient background */}
                                        <motion.div
                                            className="absolute inset-0 opacity-30 rounded-2xl"
                                            animate={{
                                                background: [
                                                    "linear-gradient(90deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.2) 100%)",
                                                    "linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(59, 130, 246, 0.2) 100%)",
                                                    "linear-gradient(90deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.2) 100%)",
                                                ],
                                            }}
                                            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                        />

                                        <TabsTrigger
                                            value="home"
                                            className="group relative flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-semibold text-[10px] leading-tight transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground flex-1 min-w-0 active:scale-95 hover:bg-purple-500/10"
                                        >
                                            <Home className="h-5 w-5 flex-shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]" />
                                            <span className="whitespace-nowrap text-center">Home</span>
                                        </TabsTrigger>

                                        {userType === "Student" ? (
                                            <TabsTrigger
                                                value="apps"
                                                className="group relative flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-semibold text-[10px] leading-tight transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground flex-1 min-w-0 active:scale-95 hover:bg-purple-500/10"
                                            >
                                                <Briefcase className="h-5 w-5 flex-shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]" />
                                                <span className="whitespace-nowrap text-center">Portfolio</span>
                                            </TabsTrigger>
                                        ) : (
                                            <TabsTrigger
                                                value="leaderboard"
                                                className="group relative flex flex-col items-center justify-center gap-1 px-2.5 py-2.5 rounded-xl font-semibold text-[10px] leading-tight transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground flex-1 min-w-0 active:scale-95 hover:bg-purple-500/10"
                                            >
                                                <Trophy className="h-5 w-5 flex-shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]" />
                                                <span className="whitespace-nowrap text-center">Board</span>
                                            </TabsTrigger>
                                        )}

                                        <TabsTrigger
                                            value="files"
                                            className="group relative flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-semibold text-[10px] leading-tight transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground flex-1 min-w-0 active:scale-95 hover:bg-purple-500/10"
                                        >
                                            <FileText className="h-5 w-5 flex-shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]" />
                                            <span className="whitespace-nowrap text-center">Applied</span>
                                        </TabsTrigger>

                                        <TabsTrigger
                                            value="projects"
                                            className="group relative flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-semibold text-[10px] leading-tight transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground flex-1 min-w-0 active:scale-95 hover:bg-purple-500/10"
                                        >
                                            <ClipboardList className="h-5 w-5 flex-shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]" />
                                            <span className="whitespace-nowrap text-center">Tasks</span>
                                        </TabsTrigger>

                                        <TabsTrigger
                                            value="learn"
                                            className="group relative flex flex-col items-center justify-center gap-1 px-2.5 py-2.5 rounded-xl font-semibold text-[10px] leading-tight transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 data-[state=inactive]:text-muted-foreground flex-1 min-w-0 active:scale-95 hover:bg-purple-500/10"
                                        >
                                            <Award className="h-5 w-5 flex-shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]" />
                                            <span className="whitespace-nowrap text-center">Journey</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </motion.div>
                            </div>

                            <div className="hidden lg:flex gap-2">
                                {userType === "Company" && (
                                    <Button
                                        className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 font-semibold group"
                                        onClick={() => setModalOpen(true)}
                                    >
                                        <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                                        New Internship
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Modal */}
                        <InternshipModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateInternship} />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
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
                            </motion.div>
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
                                `🌟 Finally, this section <strong>"My Experience"</strong> is where you document your journey and receive points using the formula:<br/><br/><code>{points from approved documentation} + {grade converted to points} × {number of companies that have accepted your documentation}</code>.`,
                            ]
                            : [
                                `👋 Hi <strong>${companyName || "Company"}</strong>, I am <strong>Linky</strong>, your guide in <em>LynkSkill</em>.`,
                                `🏢 You made the <strong>best choice</strong> choosing <em>LynkSkill</em> for finding the next generation that will inherit your profession.`,
                                `🚀 So let me guide you through it.`,
                                `📝 First, from here you <strong>create an internship</strong> so students can see you.`,
                                `📥 After that, this is the tab where you can <strong>see students who applied</strong> and decide to accept or reject them.<br/><br/><em>P.S. If you gave them a test, they must complete it before you can decide.</em>`,
                                `🧩 Here is the <strong>"Assignments"</strong> tab where you can track any assignments you gave to students.`,
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
