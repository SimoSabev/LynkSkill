"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Plus } from "lucide-react"

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

interface DashboardLayoutProps {
  userType: "Student" | "Company"
  children?: React.ReactNode
}

export function DashboardLayout({ userType, children }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState("home")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 1000)

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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Mobile */}
      <DashboardSidebar
        userType={userType}
        isOpen={mobileMenuOpen}
        isMobile={true}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar - Desktop */}
      <DashboardSidebar userType={userType} isOpen={sidebarOpen} isMobile={false} />

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
                <Button className="rounded-2xl">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </div>

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
                  <RecentAppsSection userType={userType} />
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <RecentFilesSection userType={userType} />
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
