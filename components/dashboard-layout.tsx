"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Plus } from "lucide-react"
import { InternshipModal } from "@/components/internship-modal"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { DashboardHero } from "./dashboard-hero"
import { RecentAppsSection } from "./recent-apps-section"
import { RecentFilesSection } from "./recent-files-section"
import { ActiveProjectsSection } from "./active-projects-section"
import { CommunityHighlightsSection } from "./community-highlights-section"
import { AppsTabContent } from "./apps-tab-content"
import { FilesTabContent } from "./files-tab-content"
import { ProjectsTabContent } from "./projects-tab-content"
import { LearnTabContent } from "./learn-tab-content"
import { Internship } from "@/app/types"

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

  // ✅ Fake loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isInitialLoading) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
          {/* Skeleton loader ... (keep your existing code here) */}
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
            transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        {/* Sidebar - Mobile */}
        <DashboardSidebar
            userType={userType}
            isOpen={mobileMenuOpen}
            isMobile={true}
            onClose={() => setMobileMenuOpen(false)}
            companyName={companyName}
            companyLogo={companyLogo}
        />

        {/* Sidebar - Desktop */}
        <DashboardSidebar
            userType={userType}
            isOpen={sidebarOpen}
            isMobile={false}
            companyName={companyName}
            companyLogo={companyLogo}
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
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <TabsList className="grid w-full max-w-[600px] grid-cols-5 rounded-2xl p-1">
                <TabsTrigger value="home" className="rounded-xl data-[state=active]:rounded-xl">
                  Home
                </TabsTrigger>
                <TabsTrigger value="apps" className="rounded-xl data-[state=active]:rounded-xl">
                  Apps
                </TabsTrigger>
                <TabsTrigger value="files" className="rounded-xl data-[state=active]:rounded-xl">
                  Files
                </TabsTrigger>
                <TabsTrigger value="projects" className="rounded-xl data-[state=active]:rounded-xl">
                  Projects
                </TabsTrigger>
                <TabsTrigger value="learn" className="rounded-xl data-[state=active]:rounded-xl">
                  Learn
                </TabsTrigger>
              </TabsList>
              <div className="hidden md:flex gap-2">
                <Button variant="outline" className="rounded-2xl bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Install App
                </Button>
                {userType === "Company" && (
                    <Button className="rounded-2xl" onClick={() => setModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
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
                  <RecentAppsSection userType={userType} internships={internships} />
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <RecentFilesSection userType={userType}/>
                    <ActiveProjectsSection />
                  </div>
                  <CommunityHighlightsSection />
                </TabsContent>

                <TabsContent value="apps" className="space-y-8 mt-0">
                  <AppsTabContent userType={userType} />
                </TabsContent>

                <TabsContent value="files" className="space-y-8 mt-0">
                  <FilesTabContent />
                </TabsContent>

                <TabsContent value="projects" className="space-y-8 mt-0">
                  <ProjectsTabContent />
                </TabsContent>

                <TabsContent value="learn" className="space-y-8 mt-0">
                  <LearnTabContent />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
