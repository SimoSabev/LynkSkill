"use client"

import { Bell, Cloud, Menu, MessageSquare, PanelLeft } from "lucide-react"
import { UserMenu } from "./user-menu"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModeToggle } from "@/components/theme-toggle"
import {SignedIn, UserButton} from "@clerk/nextjs";

interface DashboardHeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onToggleMobileMenu: () => void
  notifications?: number
  userType: "Student" | "Company"
}

export function DashboardHeader({
  sidebarOpen,
  onToggleSidebar,
  onToggleMobileMenu,
  notifications = 5,
  userType,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileMenu}>
        <Menu className="h-5 w-5 text-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="hidden md:flex" onClick={onToggleSidebar}>
        <PanelLeft className="h-5 w-5 text-foreground" />
      </Button>
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Designali Creative</h1>
        <div className="flex items-center text-foreground gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl">
                  <Cloud className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cloud Storage</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Messages</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {notifications}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl">
                  <ModeToggle />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <SignedIn>
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <UserButton
                  appearance={{
                    elements: {
                      // userButtonAvatarBox:
                      //     "w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-black transition-all duration-300 hover:ring-purple-400",
                      userButtonPopoverCard:
                          "bg-gray-900/95 backdrop-blur-sm border border-gray-700 text-white shadow-2xl",
                      userButtonPopoverActionButton:
                          "text-foreground hover:text-white hover:bg-gray-800 transition-colors",
                      userButtonPopoverActionButtonText: "text-foreground",
                      userButtonPopoverFooter: "hidden",
                    },
                  }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
