"use client"

import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
    Settings,
    X,
    MessageSquare,
    Calendar,
    Bookmark,
    Home,
    Briefcase,
    FileText,
    Award,
    Trophy,
    ChevronDown,
    Users,
    Building2,
    Sparkles,
    HelpCircle,
    LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SignedIn, useClerk } from "@clerk/nextjs"
import { LynkSkillUserButton } from "@/components/clerk-theme"
import { useTranslation } from "@/lib/i18n"
import { useAIMode } from "@/lib/ai-mode-context"
import { useNavigation } from "@/lib/navigation-context"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SidebarNavProps {
    userType: "Student" | "Company" | "TeamMember"
    isOpen: boolean
    isMobile?: boolean
    onClose?: () => void
    companyName?: string | null
    companyLogo?: string | null
    memberPermissions?: string[]
    userName?: string | null
    memberRole?: string | null
}

interface NavItem {
    label: string
    href: string
    icon: React.ReactNode
    badge?: number
    children?: NavItem[]
}

export function SidebarNav({
    userType,
    isOpen,
    isMobile = false,
    onClose,
    companyName,
    companyLogo,
    memberPermissions = [],
    userName,
    memberRole,
}: SidebarNavProps) {
    const { t } = useTranslation()
    const pathname = usePathname()
    const { signOut } = useClerk()
    const { isAIMode, toggleAIMode } = useAIMode()
    const { navigateTo } = useNavigation()
    const [openMenus, setOpenMenus] = useState<string[]>([])

    const basePath = userType === "Student" 
        ? "/dashboard/student" 
        : userType === "TeamMember" 
            ? "/dashboard/team-member" 
            : "/dashboard/company"

    const toggleMenu = (label: string) => {
        setOpenMenus(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        )
    }

    const studentNavItems: NavItem[] = [
        {
            label: t('navigation.home'),
            href: basePath,
            icon: <Home className="h-5 w-5" />,
        },
        {
            label: t('navigation.portfolio'),
            href: `${basePath}/portfolio`,
            icon: <Briefcase className="h-5 w-5" />,
        },
        {
            label: t('navigation.internships'),
            href: `${basePath}/internships`,
            icon: <Building2 className="h-5 w-5" />,
            children: [
                {
                    label: t('navigation.browse'),
                    href: `${basePath}/internships`,
                    icon: <Building2 className="h-4 w-4" />,
                },
                {
                    label: t('navigation.applied'),
                    href: `${basePath}/internships/applied`,
                    icon: <FileText className="h-4 w-4" />,
                },
                {
                    label: t('navigation.saved'),
                    href: `${basePath}/internships/saved`,
                    icon: <Bookmark className="h-4 w-4" />,
                },
            ],
        },
        {
            label: t('navigation.myExperience'),
            href: `${basePath}/experience`,
            icon: <Award className="h-5 w-5" />,
        },
        {
            label: t('navigation.messages'),
            href: `${basePath}/messages`,
            icon: <MessageSquare className="h-5 w-5" />,
        },
        {
            label: t('navigation.interviews'),
            href: `${basePath}/interviews`,
            icon: <Calendar className="h-5 w-5" />,
        },
        {
            label: t('navigation.help'),
            href: `${basePath}/help`,
            icon: <HelpCircle className="h-5 w-5" />,
        },
    ]

    const companyNavItems: NavItem[] = [
        {
            label: t('navigation.home'),
            href: basePath,
            icon: <Home className="h-5 w-5" />,
        },
        {
            label: t('navigation.internships'),
            href: `${basePath}/internships`,
            icon: <Briefcase className="h-5 w-5" />,
            children: [
                {
                    label: t('navigation.myInternships'),
                    href: `${basePath}/internships`,
                    icon: <Briefcase className="h-4 w-4" />,
                },
                {
                    label: t('navigation.createNew'),
                    href: `${basePath}/internships/create`,
                    icon: <FileText className="h-4 w-4" />,
                },
            ],
        },
        {
            label: t('navigation.applications'),
            href: `${basePath}/applications`,
            icon: <FileText className="h-5 w-5" />,
        },
        {
            label: t('navigation.leaderboard'),
            href: `${basePath}/leaderboard`,
            icon: <Trophy className="h-5 w-5" />,
        },
        {
            label: t('navigation.candidates'),
            href: `${basePath}/candidates`,
            icon: <Users className="h-5 w-5" />,
        },
        {
            label: t('navigation.team'),
            href: `${basePath}/team`,
            icon: <Users className="h-5 w-5" />,
        },
        {
            label: t('navigation.myExperience'),
            href: `${basePath}/experience`,
            icon: <Award className="h-5 w-5" />,
        },
        {
            label: t('navigation.messages'),
            href: `${basePath}/messages`,
            icon: <MessageSquare className="h-5 w-5" />,
        },
        {
            label: t('navigation.interviews'),
            href: `${basePath}/interviews`,
            icon: <Calendar className="h-5 w-5" />,
        },
        {
            label: t('navigation.help'),
            href: `${basePath}/help`,
            icon: <HelpCircle className="h-5 w-5" />,
        },
    ]

    // Team Member nav - permission-filtered version of company nav
    const hasPerm = (perm: string) => memberPermissions.includes(perm)
    
    const teamMemberNavItems: NavItem[] = [
        {
            label: t('navigation.home'),
            href: basePath,
            icon: <Home className="h-5 w-5" />,
        },
        // Show internships if they can create/edit or view applications
        ...(hasPerm("CREATE_INTERNSHIPS") || hasPerm("EDIT_INTERNSHIPS") || hasPerm("VIEW_APPLICATIONS") ? [{
            label: t('navigation.internships'),
            href: `${basePath}/internships`,
            icon: <Briefcase className="h-5 w-5" />,
            children: [
                ...(hasPerm("CREATE_INTERNSHIPS") || hasPerm("EDIT_INTERNSHIPS") ? [{
                    label: t('navigation.myInternships'),
                    href: `${basePath}/internships`,
                    icon: <Briefcase className="h-4 w-4" />,
                }] : []),
                ...(hasPerm("CREATE_INTERNSHIPS") ? [{
                    label: t('navigation.createNew'),
                    href: `${basePath}/internships/create`,
                    icon: <FileText className="h-4 w-4" />,
                }] : []),
            ],
        }] : []),
        // Applications - if they can view
        ...(hasPerm("VIEW_APPLICATIONS") || hasPerm("MANAGE_APPLICATIONS") ? [{
            label: t('navigation.applications'),
            href: `${basePath}/applications`,
            icon: <FileText className="h-5 w-5" />,
        }] : []),
        // Candidates - if they can view
        ...(hasPerm("VIEW_CANDIDATES") || hasPerm("SEARCH_CANDIDATES") ? [{
            label: t('navigation.candidates'),
            href: `${basePath}/candidates`,
            icon: <Users className="h-5 w-5" />,
        }] : []),
        // Experience
        ...(hasPerm("CREATE_ASSIGNMENTS") || hasPerm("GRADE_EXPERIENCES") ? [{
            label: t('navigation.myExperience'),
            href: `${basePath}/experience`,
            icon: <Award className="h-5 w-5" />,
        }] : []),
        // Messages - if they can view
        ...(hasPerm("VIEW_MESSAGES") || hasPerm("SEND_MESSAGES") ? [{
            label: t('navigation.messages'),
            href: `${basePath}/messages`,
            icon: <MessageSquare className="h-5 w-5" />,
        }] : []),
        // Interviews - if they can schedule/conduct
        ...(hasPerm("SCHEDULE_INTERVIEWS") || hasPerm("CONDUCT_INTERVIEWS") ? [{
            label: t('navigation.interviews'),
            href: `${basePath}/interviews`,
            icon: <Calendar className="h-5 w-5" />,
        }] : []),
        // Team - always visible so members can see their team
        {
            label: t('navigation.team'),
            href: `${basePath}/team`,
            icon: <Users className="h-5 w-5" />,
        },
        {
            label: t('navigation.help'),
            href: `${basePath}/help`,
            icon: <HelpCircle className="h-5 w-5" />,
        },
    ]

    const navItems = userType === "Student" 
        ? studentNavItems 
        : userType === "TeamMember" 
            ? teamMemberNavItems 
            : companyNavItems

    const isActive = (href: string) => {
        if (!pathname) return false
        if (href === basePath) {
            return pathname === basePath
        }
        return pathname.startsWith(href)
    }

    const renderNavItem = (item: NavItem, _depth: number = 0) => {
        const hasChildren = item.children && item.children.length > 0
        const active = isActive(item.href)
        const isMenuOpen = openMenus.includes(item.label)

        if (hasChildren) {
            return (
                <Collapsible
                    key={item.label}
                    open={isMenuOpen}
                    onOpenChange={() => toggleMenu(item.label)}
                >
                    <CollapsibleTrigger asChild>
                        <button
                            className={cn(
                                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                "hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10",
                                active && "bg-gradient-to-r from-purple-500/15 to-blue-500/15 text-purple-600 dark:text-purple-400"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "transition-colors",
                                    active ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                                )}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </div>
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                    isMenuOpen && "rotate-180"
                                )}
                            />
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 mt-1 space-y-1">
                        {item.children?.map((child) => (
                            <button
                                key={child.href}
                                onClick={() => {
                                    navigateTo(child.href)
                                    if (isMobile) onClose?.()
                                }}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                                    "hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10",
                                    isActive(child.href)
                                        ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 font-medium"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className={cn(
                                    isActive(child.href) && "text-purple-600 dark:text-purple-400"
                                )}>
                                    {child.icon}
                                </span>
                                <span>{child.label}</span>
                            </button>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )
        }

        return (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => {
                            navigateTo(item.href)
                            if (isMobile) onClose?.()
                        }}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            "hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10",
                            active
                                ? "bg-gradient-to-r from-purple-500/15 to-blue-500/15 text-purple-600 dark:text-purple-400 shadow-sm"
                                : "text-foreground"
                        )}
                    >
                        <span className={cn(
                            "transition-colors",
                            active ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                        )}>
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                                {item.badge}
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Go to {item.label}</p>
                </TooltipContent>
            </Tooltip>
        )
    }

    const sidebarContent = (
        <div className="flex h-full flex-col bg-background/95 backdrop-blur-xl border-r border-border/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Image
                            src={companyLogo || "/Linky-head-logo.png"}
                            alt="Logo"
                            width={44}
                            height={44}
                            className="rounded-xl object-cover ring-2 ring-purple-500/20"
                        />
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">
                            {userType === "Company" 
                                ? companyName ?? t('common.loading') 
                                : userType === "TeamMember" 
                                    ? userName ?? t('common.loading')
                                    : t('dashboard.student')}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {userType === "Company" 
                                ? t('dashboard.company') 
                                : userType === "TeamMember" 
                                    ? memberRole ?? t('team.member')
                                    : t('dashboard.student')}
                        </p>
                    </div>
                </div>
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* AI Mode Toggle */}
            <div className="px-3 py-4 border-b border-border/50">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={toggleAIMode}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-150",
                                isAIMode
                                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm"
                                    : "bg-muted/50 hover:bg-muted"
                            )}
                        >
                            <Sparkles className="h-5 w-5" />
                            <span>{t('aiMode.title')}</span>
                            <span className={cn(
                                "ml-auto text-xs px-2 py-0.5 rounded-full",
                                isAIMode
                                    ? "bg-white/20 text-white"
                                    : "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                            )}>
                                {isAIMode ? "ON" : "OFF"}
                            </span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{isAIMode ? "Disable AI assistance" : "Enable AI assistance"}</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <div className="space-y-1">
                    {navItems.map((item) => renderNavItem(item))}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-border/50 p-3 space-y-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => navigateTo(`${basePath}/settings`)}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                "hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10",
                                pathname?.includes("/settings") && "bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600"
                            )}
                        >
                            <Settings className="h-5 w-5 text-muted-foreground" />
                            <span>{t('navigation.settings')}</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Manage your preferences</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => navigateTo("/help")}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <HelpCircle className="h-5 w-5" />
                            <span>{t('navigation.help')}</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Get help and support</p>
                    </TooltipContent>
                </Tooltip>

                <div className="pt-2 border-t border-border/50">
                    <SignedIn>
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-3">
                                <LynkSkillUserButton />
                                <span className="text-sm font-medium">{t('dashboard.user')}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => signOut()}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </SignedIn>
                </div>
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                            onClick={onClose}
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: isOpen ? 0 : "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 left-0 z-50 w-72 bg-background md:hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {sidebarContent}
                </motion.div>
            </>
        )
    }

    return (
        <motion.div
            initial={false}
            animate={{ x: isOpen ? 0 : "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-30 hidden w-72 md:block shadow-xl"
        >
            {sidebarContent}
        </motion.div>
    )
}
