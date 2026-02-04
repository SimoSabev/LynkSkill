"use client"

import { Menu, PanelLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModeToggle } from "@/components/theme-toggle"
import { SignedIn } from "@clerk/nextjs"
import { LynkSkillUserButton } from "@/components/clerk-theme"
import { NotificationBell } from "@/components/notification-bell"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AIModeToggle } from "@/components/ai-mode-toggle"
import { useTranslation } from "@/lib/i18n"

interface DashboardHeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onToggleMobileMenu: () => void
  notifications?: number
  userType: "Student" | "Company"
}

export function DashboardHeader({
                                  sidebarOpen: _sidebarOpen,
                                  onToggleSidebar,
                                  onToggleMobileMenu,
                                  notifications: _notifications = 5,
                                  userType: _userType,
                                }: DashboardHeaderProps) {
  const { t } = useTranslation()
  
  return (
      <header className="sticky top-0 z-10 flex h-16 w-full items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
        <Button
            variant="ghost"
            size="icon"
            className="md:hidden transition-colors duration-150 hover:bg-muted"
            onClick={onToggleMobileMenu}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>

        <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex transition-colors duration-150 hover:bg-muted"
            onClick={onToggleSidebar}
        >
          <PanelLeft className="h-5 w-5 text-foreground" />
        </Button>

        <div className="flex flex-1 w-full items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            {t('dashboard.title')}
          </h1>

          <div className="flex items-center text-foreground gap-2 sm:gap-3">
            <AIModeToggle />
            
            <NotificationBell />
            
            <LanguageSwitcher />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl transition-colors duration-150 hover:bg-muted"
                  >
                    <ModeToggle />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('dashboard.toggleTheme')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <SignedIn>
              <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <LynkSkillUserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>
  )
}
