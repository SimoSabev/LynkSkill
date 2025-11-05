"use client"

import { Menu, PanelLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModeToggle } from "@/components/theme-toggle"
import { SignedIn, UserButton } from "@clerk/nextjs"

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
      <header className="sticky top-0 z-10 flex h-16 w-full items-center gap-3 border-b border-purple-500/20 bg-gradient-to-r from-background via-purple-950/10 to-background px-4 backdrop-blur-xl transition-all duration-500 animate-gradient-x">
        <Button
            variant="ghost"
            size="icon"
            className="md:hidden transition-all duration-300 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-110 active:scale-95"
            onClick={onToggleMobileMenu}
        >
          <Menu className="h-5 w-5 text-foreground transition-colors duration-300 hover:text-purple-400" />
        </Button>

        <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex transition-all duration-300 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-110 active:scale-95"
            onClick={onToggleSidebar}
        >
          <PanelLeft className="h-5 w-5 text-foreground transition-colors duration-300 hover:text-purple-400" />
        </Button>

        <div className="flex flex-1 w-full items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl font-semibold bg-clip-text text-foreground animate-gradient-x bg-[length:200%_auto] transition-all duration-500">
            LynkSkill&apos;s Dashboard
          </h1>

          <div className="flex items-center text-foreground gap-2 sm:gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-2xl transition-all duration-300 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-110 active:scale-95"
                  >
                    <ModeToggle />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-purple-950/90 border-purple-500/30 text-foreground backdrop-blur-sm">
                  Toggle theme
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <SignedIn>
              <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-md animate-pulse" />
                <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox:
                            "relative z-10 ring-2 ring-offset-background transition-all duration-300 hover:ring-purple-600 hover:ring-2 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:scale-110",
                        userButtonPopoverCard:
                            "bg-gray-900/95 backdrop-blur-sm border border-purple-500/30 text-white shadow-2xl shadow-purple-500/20",
                        userButtonPopoverActionButton:
                            "text-foreground hover:text-white hover:bg-purple-500/20 transition-all duration-300",
                        userButtonPopoverActionButtonText: "text-foreground",
                        userButtonPopoverFooter: "hidden",
                      },
                    }}
                />
              </div>
            </SignedIn>
          </div>
        </div>

        <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 8s ease infinite;
        }
      `}</style>
      </header>
  )
}
