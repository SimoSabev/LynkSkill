"use client"

import {useState} from "react"
import {Settings, X, Grid, FileText, Layers, Briefcase,} from "lucide-react"
import Image from "next/image"
import {Button} from "@/components/ui/button"
import {ScrollArea} from "@/components/ui/scroll-area"
import {cn} from "@/lib/utils"
import {SignedIn, UserButton} from "@clerk/nextjs"
import {HouseIcon} from "@/components/dashboard/home-icon"
import {BookOpenTextIcon} from "@/components/dashboard/portfolio-icon"
import {AnimateIcon} from "@/components/animate-ui/icons/icon";
import {ChartColumnIncreasing} from "@/components/animate-ui/icons/chart-column-increasing";
import {ClipboardList} from "@/components/animate-ui/icons/clipboard-list";
import {CheckCheck} from "@/components/animate-ui/icons/check-check";
import {UsersRound} from "@/components/animate-ui/icons/users-round";

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
                            {userType === "Company" ? companyName ?? "Loading..." : "Student"}
                        </h2>
                        <p className="text-xs text-foreground">
                            {userType === "Company" ? "Company Dashboard" : "Student Dashboard"}
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
                {/*<div className="relative">*/}
                {/*    <Search className="absolute left-3 top-3 h-4 w-4 text-foreground"/>*/}
                {/*    <Input type="search" placeholder="Search..."*/}
                {/*           className="w-full rounded-2xl bg-muted pl-9 pr-4 py-2"/>*/}
                {/*</div>*/}
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

                                <span>Home</span>
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
                                    <span>Portfolio</span>
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
                                    <span>Leaderboard</span>
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
                            <span>Applied</span>
                        </div>
                    </button>
                </AnimateIcon>
                    {/* Assignments - Always visible */}
                    <button
                        onClick={() => setActiveTab("projects")}
                        className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5"/>
                            <span>Assignments</span>
                        </div>
                    </button>

                    {/* My Experience - Always visible */}
                    <button
                        onClick={() => setActiveTab("learn")}
                        className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5"/>
                            <span>My Experience</span>
                        </div>
                    </button>
                </div>
            </ScrollArea>

            <div className="border-t p-3">
                <div className="space-y-1 text-foreground">
                    <button
                        className="flex w-full text-foreground items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted">
                        <Settings className="h-5 w-5"/>
                        <span>Settings</span>
                    </button>
                    <SignedIn>
                        <div className="flex items-center justify-start gap-3 sm:gap-4 ml-2">
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonPopoverCard:
                                            "bg-gray-900/95 backdrop-blur-sm border border-gray-700 text-white shadow-2xl",
                                        userButtonPopoverActionButton:
                                            "text-foreground hover:text-white hover:bg-gray-800 transition-colors",
                                        userButtonPopoverActionButtonText: "text-foreground",
                                        userButtonPopoverFooter: "hidden",
                                    },
                                }}
                            />
                            <div className="text-foreground text-sm font-semibold">User</div>
                        </div>
                    </SignedIn>
                </div>
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                {sidebarContent}
            </div>
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