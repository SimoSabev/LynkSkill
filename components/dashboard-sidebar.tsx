"use client"

import {Settings, X, MessageSquare, Calendar, Bookmark, Users, Building2, ChevronDown, ChevronRight} from "lucide-react"
import Image from "next/image"
import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {cn} from "@/lib/utils"
import {SignedIn} from "@clerk/nextjs"
import {LynkSkillUserButton} from "@/components/clerk-theme"
import {AnimateIcon} from "@/components/animate-ui/icons/icon";
import {ChartColumnIncreasing} from "@/components/animate-ui/icons/chart-column-increasing";
import {ClipboardList} from "@/components/animate-ui/icons/clipboard-list";
import {CheckCheck} from "@/components/animate-ui/icons/check-check";
import {UsersRound} from "@/components/animate-ui/icons/users-round";
import {ClipboardCheck} from "@/components/animate-ui/icons/clipboard-check";
import {useTranslation} from "@/lib/i18n";
import {useEffect, useState} from "react";

interface StudentTeam {
    companyId: string
    companyName: string
    companyLogo: string | null
    internships: Array<{
        id: string
        title: string
        projectId: string
    }>
}

interface DashboardSidebarProps {
    userType: "Student" | "Company"
    isOpen: boolean
    isMobile?: boolean
    onClose?: () => void
    companyName?: string | null
    companyLogo?: string | null
    setActiveTab: (tab: string) => void
}

export function DashboardSidebar({
                                     userType,
                                     isOpen,
                                     isMobile = false,
                                     onClose,
                                     companyName,
                                     setActiveTab,
                                 }: DashboardSidebarProps) {
    const { t } = useTranslation();
    const [myTeams, setMyTeams] = useState<StudentTeam[]>([])
    const [teamsExpanded, setTeamsExpanded] = useState(true)
    const [loadingTeams, setLoadingTeams] = useState(false)

    // Fetch student's teams when component mounts
    useEffect(() => {
        if (userType === "Student") {
            const fetchTeams = async () => {
                setLoadingTeams(true)
                try {
                    const res = await fetch("/api/student/my-teams")
                    if (res.ok) {
                        const data = await res.json()
                        setMyTeams(data.teams || [])
                    }
                } catch (error) {
                    console.error("Failed to fetch teams:", error)
                } finally {
                    setLoadingTeams(false)
                }
            }
            fetchTeams()
        }
    }, [userType])

    const sidebarContent = (
        <div className="flex h-full flex-col border-r text-foreground">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <Image
                        src="/Linky-head-logo.png"
                        alt="Company Logo"
                        width={40}
                        height={40}
                        className="rounded-2xl object-cover"
                    />
                    <div>
                        <h2 className="font-semibold">
                            {userType === "Company" ? companyName ?? t('common.loading') : t('dashboard.student')}
                        </h2>
                        <p className="text-xs text-foreground">
                            {userType === "Company" ? t('dashboard.companyDashboard') : t('dashboard.studentDashboard')}
                        </p>
                    </div>
                </div>
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5 text-foreground"/>
                    </Button>
                )}
            </div>

            <div className="px-3 py-2">
            </div>

            <ScrollArea className="flex-1 px-3 py-2">
                <div className="space-y-1">
                    {/* Home - Always visible */}
                    <AnimateIcon animateOnHover>
                        <button
                            onClick={() => setActiveTab("home")}
                            className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <ChartColumnIncreasing/>
                                <span>{t('navigation.home')}</span>
                            </div>
                        </button>
                    </AnimateIcon>

                    {/* Portfolio - Only for Students */}
                    {userType === "Student" && (
                        <AnimateIcon animateOnHover>
                            <button
                                onClick={() => setActiveTab("apps")}
                                className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <ClipboardList/>
                                    <span>{t('navigation.portfolio')}</span>
                                </div>
                            </button>
                        </AnimateIcon>
                    )}

                    {/* Leaderboard - Only for Companies */}
                    {userType === "Company" && (
                        <AnimateIcon animateOnHover>
                            <button
                                onClick={() => setActiveTab("leaderboard")}
                                className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <UsersRound />
                                    <span>{t('navigation.leaderboard')}</span>
                                </div>
                            </button>
                        </AnimateIcon>
                    )}

                    {/* Team Management - Only for Companies */}
                    {userType === "Company" && (
                        <AnimateIcon animateOnHover>
                            <button
                                onClick={() => setActiveTab("team")}
                                className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <span>{t('navigation.team') || 'Team'}</span>
                                </div>
                            </button>
                        </AnimateIcon>
                    )}

                    {/* Applied - Always visible */}
                    <AnimateIcon animateOnHover>
                        <button
                            onClick={() => setActiveTab("files")}
                            className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCheck/>
                                <span>{t('navigation.applied')}</span>
                            </div>
                        </button>
                    </AnimateIcon>

                    {/* My Experience - Always visible */}
                    <AnimateIcon animateOnHover>
                        <button
                            onClick={() => setActiveTab("learn")}
                            className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <ClipboardCheck/>
                                <span>{t('navigation.myExperience')}</span>
                            </div>
                        </button>
                    </AnimateIcon>

                    {/* Saved - Only for Students */}
                    {userType === "Student" && (
                        <AnimateIcon animateOnHover>
                            <button
                                onClick={() => setActiveTab("saved")}
                                className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Bookmark className="h-5 w-5"/>
                                    <span>{t('navigation.saved')}</span>
                                </div>
                            </button>
                        </AnimateIcon>
                    )}

                    {/* Messages - Always visible */}
                    <AnimateIcon animateOnHover>
                        <button
                            onClick={() => setActiveTab("messages")}
                            className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5"/>
                                <span>{t('navigation.messages')}</span>
                            </div>
                        </button>
                    </AnimateIcon>

                    {/* Interviews - Always visible */}
                    <AnimateIcon animateOnHover>
                        <button
                            onClick={() => setActiveTab("interviews")}
                            className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5"/>
                                <span>{t('navigation.interviews')}</span>
                            </div>
                        </button>
                    </AnimateIcon>

                    {/* My Teams - Only for Students who have accepted offers */}
                    {userType === "Student" && myTeams.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <button
                                onClick={() => setTeamsExpanded(!teamsExpanded)}
                                className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{t('navigation.myTeams') || 'My Teams'}</span>
                                </div>
                                {teamsExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                            
                            {teamsExpanded && (
                                <div className="mt-1 space-y-1">
                                    {myTeams.map((team) => (
                                        <div key={team.companyId} className="ml-2">
                                            <button
                                                onClick={() => setActiveTab("learn")}
                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                                            >
                                                {team.companyLogo ? (
                                                    <Image
                                                        src={team.companyLogo}
                                                        alt={team.companyName}
                                                        width={24}
                                                        height={24}
                                                        className="rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {team.companyName.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex-1 text-left">
                                                    <span className="font-medium text-foreground">{team.companyName}</span>
                                                    <p className="text-xs text-muted-foreground">
                                                        {team.internships.length} {team.internships.length === 1 ? 'project' : 'projects'}
                                                    </p>
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Loading state for teams */}
                    {userType === "Student" && loadingTeams && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                <span>Loading teams...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="border-t p-3">
                <div className="space-y-1 text-foreground">
                    <button
                        className="flex w-full text-foreground items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted">
                        <Settings className="h-5 w-5"/>
                        <span>{t('navigation.settings')}</span>
                    </button>
                    <SignedIn>
                        <div className="flex items-center justify-start gap-3 sm:gap-4 ml-2">
                            <LynkSkillUserButton />
                            <div className="text-foreground text-sm font-semibold">{t('dashboard.user')}</div>
                        </div>
                    </SignedIn>
                </div>
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <>
                {/* Backdrop */}
                {isOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                        onClick={onClose} // Close when clicking outside
                    />
                )}

                {/* Sidebar */}
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
                        isOpen ? "translate-x-0" : "-translate-x-full",
                    )}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                    {sidebarContent}
                </div>
            </>
        )
    }

    return (
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:block",
                isOpen ? "translate-x-0" : "-translate-x-full",
            )}
        >
            {sidebarContent}
        </div>
    )
}
