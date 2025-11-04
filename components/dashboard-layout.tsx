"use client"

import type React from "react"
import {useState, useEffect} from "react"
import {motion, AnimatePresence} from "framer-motion"
import {Plus} from "lucide-react"
import {InternshipModal} from "@/components/internship-modal"
import {Button} from "@/components/ui/button"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Skeleton} from "@/components/ui/skeleton"
import {cn} from "@/lib/utils"
import {DashboardSidebar} from "./dashboard-sidebar"
import {DashboardHeader} from "./dashboard-header"
import {DashboardHero} from "./dashboard-hero"
import {RecentInternshipsSection} from "./recent-internships-section"
import {RecentApplicationsSection} from "./recent-applications-section"
import {ActiveAssignmentsSection} from "./active-assignments-section"
import {CommunityHighlights} from "./community-highlights-section"
import {Portfolio} from "./portfolio"
import {ApplicationsTabContent} from "./apply-tab-content"
import {AssignmentsTabContent} from "./assignments-tab-content"
import MyExperienceTabContent from "./my-experience-tab-content"
import {Internship} from "@/app/types"
// import {AnalyticsTabContent} from "@/components/analytics-tab-content";
import {LeaderboardTabContent} from "@/components/leaderboard-tab-content";
import {MascotScene} from "@/components/MascotScene"


interface DashboardLayoutProps {
    userType: "Student" | "Company"
    children?: React.ReactNode
}

export function DashboardLayout({userType, children}: DashboardLayoutProps) {
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
            setInternships(prev => prev.filter(i => i.id !== customEvent.detail))
        }

        function handleUpdated(e: Event) {
            const customEvent = e as CustomEvent<Internship>
            setInternships(prev => prev.map(i => i.id === customEvent.detail.id ? customEvent.detail : i))
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
                    transition={{duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear"}}
                />

                {/* Sidebar Skeleton */}
                <div className="fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background md:block">
                    <div className="flex h-full flex-col">
                        <div className="p-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-2xl"/>
                                <div>
                                    <Skeleton className="h-4 w-20 mb-1"/>
                                    <Skeleton className="h-3 w-24"/>
                                </div>
                            </div>
                        </div>
                        <div className="px-3 py-2">
                            <Skeleton className="h-10 w-full rounded-2xl"/>
                        </div>
                        <div className="flex-1 px-3 py-2 space-y-2">
                            {Array.from({length: 6}).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-2xl"/>
                            ))}
                        </div>
                        <div className="border-t p-3 space-y-2">
                            <Skeleton className="h-10 w-full rounded-2xl"/>
                            <Skeleton className="h-10 w-full rounded-2xl"/>
                        </div>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="min-h-screen md:pl-64">
                    {/* Header Skeleton */}
                    <header
                        className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
                        <Skeleton className="h-8 w-8 rounded md:hidden"/>
                        <Skeleton className="h-8 w-8 rounded hidden md:block"/>
                        <div className="flex flex-1 items-center justify-between">
                            <Skeleton className="h-6 w-48"/>
                            <div className="flex items-center gap-3">
                                {Array.from({length: 4}).map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-8 rounded-2xl"/>
                                ))}
                                <Skeleton className="h-9 w-9 rounded-full"/>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Skeleton */}
                    <main className="flex-1 p-4 md:p-6">
                        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <Skeleton className="h-12 w-full max-w-[600px] rounded-2xl"/>
                            <div className="hidden md:flex gap-2">
                                <Skeleton className="h-10 w-32 rounded-2xl"/>
                                <Skeleton className="h-10 w-32 rounded-2xl"/>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <Skeleton className="h-48 w-full rounded-3xl"/>
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-48"/>
                                <div
                                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {Array.from({length: 3}).map((_, i) => (
                                        <Skeleton key={i} className="h-64 w-full rounded-3xl"/>
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
            {/* Background animation */}
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
                transition={{duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear"}}
            />

            {/* Sidebar - Mobile */}
            <DashboardSidebar
                userType={userType}
                isOpen={mobileMenuOpen}
                isMobile
                onClose={() => setMobileMenuOpen(false)}
                companyName={companyName}
                companyLogo={companyLogo}
                setActiveTab={setActiveTab}   // 👈 pass state
            />

            {/* Sidebar - Desktop */}

            <DashboardSidebar
                userType={userType}
                isOpen={sidebarOpen}
                isMobile={false}
                companyName={companyName}
                companyLogo={companyLogo}
                setActiveTab={setActiveTab}   // 👈 pass state
            />

            {/* Main Content */}
            <div
                className={cn("min-h-screen transition-all duration-300 ease-in-out", sidebarOpen ? "md:pl-64" : "md:pl-0")}>
                <DashboardHeader
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onToggleMobileMenu={() => setMobileMenuOpen(true)}
                    userType={userType}
                />

                <main className="flex-1 p-4 md:p-6 text-foreground">
                    <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <TabsList className="grid w-full max-w-[900px] grid-cols-5 rounded-2xl p-1">
                                <TabsTrigger value="home"
                                             className="rounded-xl cursor-pointer data-[state=active]:rounded-xl">
                                    Home
                                </TabsTrigger>
                                {userType === "Student" ? (
                                    <TabsTrigger value="apps"
                                                 className="rounded-xl cursor-pointer data-[state=active]:rounded-xl">
                                        Portfolio
                                    </TabsTrigger>
                                ) : (
                                    <TabsTrigger value="leaderboard"
                                                 className="rounded-xl cursor-pointer data-[state=active]:rounded-xl">
                                        Leaderboard
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="files"
                                             className="rounded-xl cursor-pointer data-[state=active]:rounded-xl">
                                    Applied
                                </TabsTrigger>
                                <TabsTrigger value="projects"
                                             className="rounded-xl cursor-pointer data-[state=active]:rounded-xl">
                                    Assignments
                                </TabsTrigger>
                                <TabsTrigger value="learn"
                                             className="rounded-xl cursor-pointer data-[state=active]:rounded-xl">
                                    My Experience
                                </TabsTrigger>
                                {/*<TabsTrigger value="analytics"*/}
                                {/*             className="rounded-xl cursor-pointer data-[state=active]:rounded-xl">*/}
                                {/*    Analytics*/}
                                {/*</TabsTrigger>*/}
                            </TabsList>
                            <div className="hidden md:flex gap-2">
                                {/*<Button variant="outline" className="rounded-2xl bg-transparent">*/}
                                {/*    <Download className="mr-2 h-4 w-4"/>*/}
                                {/*    Install App*/}
                                {/*</Button>*/}
                                {userType === "Company" && (
                                    <Button className="rounded-2xl" onClick={() => setModalOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        New Internship
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Modal */}
                        <InternshipModal open={modalOpen} onClose={() => setModalOpen(false)}
                                         onCreate={handleCreateInternship}/>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{opacity: 0, y: 10}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -10}}
                                transition={{duration: 0.2}}
                            >
                                <TabsContent value="home" className="space-y-8 mt-0">
                                    <DashboardHero userType={userType}/>
                                    <RecentInternshipsSection userType={userType} setActiveTab={setActiveTab}/>
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        <RecentApplicationsSection userType={userType} setActiveTab={setActiveTab}/>
                                        <ActiveAssignmentsSection setActiveTab={setActiveTab}/>
                                    </div>
                                    <CommunityHighlights setActiveTab={setActiveTab}/>
                                </TabsContent>

                                {userType === "Student" ? (
                                    <TabsContent value="apps" className="space-y-8 mt-0">
                                        <Portfolio userType={userType}/>
                                    </TabsContent>
                                ) : (
                                    <TabsContent value="leaderboard" className="space-y-8 mt-0">
                                        <LeaderboardTabContent/>
                                    </TabsContent>
                                )}

                                <TabsContent value="files" className="space-y-8 mt-0">
                                    <ApplicationsTabContent userType={userType}/>
                                </TabsContent>

                                <TabsContent value="projects" className="space-y-8 mt-0">
                                    <AssignmentsTabContent/>
                                </TabsContent>

                                <TabsContent value="learn" className="space-y-8 mt-0">
                                    <MyExperienceTabContent/>
                                </TabsContent>

                                {/*<TabsContent value="analytics" className="space-y-8 mt-0">*/}
                                {/*    <AnalyticsTabContent userType={userType} />*/}
                                {/*</TabsContent>*/}
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
                                `🎓 On the <strong>"My Experience"</strong> tab, you can see which students have tagged you with pictures and videos of your work together. You can validate and accept if they really worked with you — or reject if not. Then you’ll <strong>grade them</strong> based on their performance.`,
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
