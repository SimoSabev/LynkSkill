"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
    Award,
    Bell,
    BookOpen,
    Bookmark,
    Brush,
    Camera,
    ChevronDown,
    Cloud,
    Code,
    Crown,
    Download,
    FileText,
    Grid,
    Heart,
    Home,
    ImageIcon,
    Layers,
    LayoutGrid,
    Lightbulb,
    Menu,
    MessageSquare,
    Palette,
    PanelLeft,
    Play,
    Plus,
    Search,
    Settings,
    Share2,
    Sparkles,
    Star,
    Trash,
    TrendingUp,
    Users,
    Video,
    Wand2,
    Clock,
    Eye,
    Archive,
    ArrowUpDown,
    MoreHorizontal,
    Type,
    CuboidIcon,
    X,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import {ModeToggle} from "@/components/theme-toggle";
import {SignedIn} from "@clerk/nextjs";
import {LynkSkillUserButton} from "@/components/clerk-theme";

// Sample data for apps
const apps = [
    {
        name: "PixelMaster",
        icon: <ImageIcon className="text-violet-500" />,
        description: "Advanced image editing and composition",
        category: "Creative",
        recent: true,
        new: false,
        progress: 100,
    },
    {
        name: "VectorPro",
        icon: <Brush className="text-orange-500" />,
        description: "Professional vector graphics creation",
        category: "Creative",
        recent: true,
        new: false,
        progress: 100,
    },
    {
        name: "VideoStudio",
        icon: <Video className="text-pink-500" />,
        description: "Cinematic video editing and production",
        category: "Video",
        recent: true,
        new: false,
        progress: 100,
    },
    {
        name: "MotionFX",
        icon: <Sparkles className="text-blue-500" />,
        description: "Stunning visual effects and animations",
        category: "Video",
        recent: false,
        new: false,
        progress: 100,
    },
    {
        name: "PageCraft",
        icon: <Layers className="text-red-500" />,
        description: "Professional page design and layout",
        category: "Creative",
        recent: false,
        new: false,
        progress: 100,
    },
    {
        name: "UXFlow",
        icon: <LayoutGrid className="text-fuchsia-500" />,
        description: "Intuitive user experience design",
        category: "Design",
        recent: false,
        new: true,
        progress: 85,
    },
    {
        name: "PhotoLab",
        icon: <Camera className="text-teal-500" />,
        description: "Advanced photo editing and organization",
        category: "Photography",
        recent: false,
        new: false,
        progress: 100,
    },
    {
        name: "DocMaster",
        icon: <FileText className="text-red-600" />,
        description: "Document editing and management",
        category: "Document",
        recent: false,
        new: false,
        progress: 100,
    },
    {
        name: "WebCanvas",
        icon: <Code className="text-emerald-500" />,
        description: "Web design and development",
        category: "Web",
        recent: false,
        new: true,
        progress: 70,
    },
    {
        name: "3DStudio",
        icon: <CuboidIcon className="text-indigo-500" />,
        description: "3D modeling and rendering",
        category: "3D",
        recent: false,
        new: true,
        progress: 60,
    },
    {
        name: "FontForge",
        icon: <Type className="text-amber-500" />,
        description: "Typography and font creation",
        category: "Typography",
        recent: false,
        new: false,
        progress: 100,
    },
    {
        name: "ColorPalette",
        icon: <Palette className="text-purple-500" />,
        description: "Color scheme creation and management",
        category: "Design",
        recent: false,
        new: false,
        progress: 100,
    },
]

// Sample data for recent files
const recentFiles = [
    {
        name: "Brand Redesign.pxm",
        app: "PixelMaster",
        modified: "2 hours ago",
        icon: <ImageIcon className="text-violet-500" />,
        shared: true,
        size: "24.5 MB",
        collaborators: 3,
    },
    {
        name: "Company Logo.vec",
        app: "VectorPro",
        modified: "Yesterday",
        icon: <Brush className="text-orange-500" />,
        shared: true,
        size: "8.2 MB",
        collaborators: 2,
    },
    {
        name: "Product Launch Video.vid",
        app: "VideoStudio",
        modified: "3 days ago",
        icon: <Video className="text-pink-500" />,
        shared: false,
        size: "1.2 GB",
        collaborators: 0,
    },
    {
        name: "UI Animation.mfx",
        app: "MotionFX",
        modified: "Last week",
        icon: <Sparkles className="text-blue-500" />,
        shared: true,
        size: "345 MB",
        collaborators: 4,
    },
    {
        name: "Magazine Layout.pgc",
        app: "PageCraft",
        modified: "2 weeks ago",
        icon: <Layers className="text-red-500" />,
        shared: false,
        size: "42.8 MB",
        collaborators: 0,
    },
    {
        name: "Mobile App Design.uxf",
        app: "UXFlow",
        modified: "3 weeks ago",
        icon: <LayoutGrid className="text-fuchsia-500" />,
        shared: true,
        size: "18.3 MB",
        collaborators: 5,
    },
    {
        name: "Product Photography.phl",
        app: "PhotoLab",
        modified: "Last month",
        icon: <Camera className="text-teal-500" />,
        shared: false,
        size: "156 MB",
        collaborators: 0,
    },
]

// Sample data for projects
const projects = [
    {
        name: "Website Redesign",
        description: "Complete overhaul of company website",
        progress: 75,
        dueDate: "June 15, 2025",
        members: 4,
        files: 23,
    },
    {
        name: "Mobile App Launch",
        description: "Design and assets for new mobile application",
        progress: 60,
        dueDate: "July 30, 2025",
        members: 6,
        files: 42,
    },
    {
        name: "Brand Identity",
        description: "New brand guidelines and assets",
        progress: 90,
        dueDate: "May 25, 2025",
        members: 3,
        files: 18,
    },
    {
        name: "Marketing Campaign",
        description: "Summer promotion materials",
        progress: 40,
        dueDate: "August 10, 2025",
        members: 5,
        files: 31,
    },
]

// Sample data for tutorials
const tutorials = [
    {
        title: "Mastering Digital Illustration",
        description: "Learn advanced techniques for creating stunning digital art",
        duration: "1h 45m",
        level: "Advanced",
        instructor: "Sarah Chen",
        category: "Illustration",
        views: "24K",
    },
    {
        title: "UI/UX Design Fundamentals",
        description: "Essential principles for creating intuitive user interfaces",
        duration: "2h 20m",
        level: "Intermediate",
        instructor: "Michael Rodriguez",
        category: "Design",
        views: "56K",
    },
    {
        title: "Video Editing Masterclass",
        description: "Professional techniques for cinematic video editing",
        duration: "3h 10m",
        level: "Advanced",
        instructor: "James Wilson",
        category: "Video",
        views: "32K",
    },
    {
        title: "Typography Essentials",
        description: "Create beautiful and effective typography for any project",
        duration: "1h 30m",
        level: "Beginner",
        instructor: "Emma Thompson",
        category: "Typography",
        views: "18K",
    },
    {
        title: "Color Theory for Designers",
        description: "Understanding color relationships and psychology",
        duration: "2h 05m",
        level: "Intermediate",
        instructor: "David Kim",
        category: "Design",
        views: "41K",
    },
]

// Sample data for community posts
const communityPosts = [
    {
        title: "Minimalist Logo Design",
        author: "Alex Morgan",
        likes: 342,
        comments: 28,
        image: "/placeholder.svg?height=300&width=400",
        time: "2 days ago",
    },
    {
        title: "3D Character Concept",
        author: "Priya Sharma",
        likes: 518,
        comments: 47,
        image: "/placeholder.svg?height=300&width=400",
        time: "1 week ago",
    },
    {
        title: "UI Dashboard Redesign",
        author: "Thomas Wright",
        likes: 276,
        comments: 32,
        image: "/placeholder.svg?height=300&width=400",
        time: "3 days ago",
    },
    {
        title: "Product Photography Setup",
        author: "Olivia Chen",
        likes: 189,
        comments: 15,
        image: "/placeholder.svg?height=300&width=400",
        time: "5 days ago",
    },
]

// Sample data for sidebar navigation
const sidebarItems = [
    {
        title: "Home",
        icon: <Home />,
        isActive: true,
    },
    {
        title: "Apps",
        icon: <Grid />,
        badge: "2",
        items: [
            { title: "All Apps", url: "#" },
            { title: "Recent", url: "#" },
            { title: "Updates", url: "#", badge: "2" },
            { title: "Installed", url: "#" },
        ],
    },
    {
        title: "Files",
        icon: <FileText />,
        items: [
            { title: "Recent", url: "#" },
            { title: "Shared with me", url: "#", badge: "3" },
            { title: "Favorites", url: "#" },
            { title: "Trash", url: "#" },
        ],
    },
    {
        title: "Projects",
        icon: <Layers />,
        badge: "4",
        items: [
            { title: "Active Projects", url: "#", badge: "4" },
            { title: "Archived", url: "#" },
            { title: "Templates", url: "#" },
        ],
    },
    {
        title: "Learn",
        icon: <BookOpen />,
        items: [
            { title: "Tutorials", url: "#" },
            { title: "Courses", url: "#" },
            { title: "Webinars", url: "#" },
            { title: "Resources", url: "#" },
        ],
    },
    {
        title: "Community",
        icon: <Users />,
        items: [
            { title: "Explore", url: "#" },
            { title: "Following", url: "#" },
            { title: "Challenges", url: "#" },
            { title: "Events", url: "#" },
        ],
    },
    {
        title: "Resources",
        icon: <Bookmark />,
        items: [
            { title: "Stock Photos", url: "#" },
            { title: "Fonts", url: "#" },
            { title: "Icons", url: "#" },
            { title: "Templates", url: "#" },
        ],
    },
]

export default function CompanyDashboardPagee() {
    const { t } = useTranslation()
    const [, setProgress] = useState(0)
    const [notifications,] = useState(5)
    const [activeTab, setActiveTab] = useState("home")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

    // Simulate progress loading
    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 1000)
        return () => clearTimeout(timer)
    }, [])

    const toggleExpanded = (title: string) => {
        setExpandedItems((prev) => ({
            ...prev,
            [title]: !prev[title],
        }))
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
                <div className="fixed inset-0 z-4 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar - Mobile */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-full flex-col border-r text-foreground">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                                <Wand2 className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold">{t("dashboardCompany.designali")}</h2>
                                <p className="text-xs text-foreground">{t("dashboardCompany.creativeSuite")}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                            <X className="h-5 w-5 text-foreground" />
                        </Button>
                    </div>

                    <div className="px-3 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                            <Input type="search" placeholder={t("dashboardCompany.search")} className="w-full rounded-2xl bg-muted pl-9 pr-4 py-2" />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-3 py-2">
                        <div className="space-y-1">
                            {sidebarItems.map((item) => (
                                <div key={item.title} className="mb-1">
                                    <button
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium",
                                            item.isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
                                        )}
                                        onClick={() => item.items && toggleExpanded(item.title)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            <span>{item.title}</span>
                                        </div>
                                        {item.badge && (
                                            <Badge variant="outline" className="ml-auto rounded-full px-2 py-0.5 text-xs">
                                                {item.badge}
                                            </Badge>
                                        )}
                                        {item.items && (
                                            <ChevronDown
                                                className={cn(
                                                    "ml-2 h-4 w-4 transition-transform",
                                                    expandedItems[item.title] ? "rotate-180" : "",
                                                )}
                                            />
                                        )}
                                    </button>

                                    {item.items && expandedItems[item.title] && (
                                        <div className="mt-1 ml-6 space-y-1 border-l pl-3">
                                            {item.items.map((subItem) => (
                                                <a
                                                    key={subItem.title}
                                                    href={subItem.url}
                                                    className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted"
                                                >
                                                    {subItem.title}
                                                    {subItem.badge && (
                                                        <Badge variant="outline" className="ml-auto rounded-full px-2 py-0.5 text-xs">
                                                            {subItem.badge}
                                                        </Badge>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="border-t p-3">
                        <div className="space-y-1">
                            <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted">
                                <Settings className="h-5 w-5" />
                                <span>{t("dashboardCompany.settings")}</span>
                            </button>
                            <SignedIn>
                                <div className="flex items-center justify-start gap-3 sm:gap-4 ml-2">
                                    <LynkSkillUserButton />
                                    <div className="text-foreground text-sm font-semibold">{t("dashboardCompany.user")}</div>
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Desktop */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:block",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                                <Wand2 className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-foreground">{t("dashboardCompany.company")}</h2>
                                <p className="text-xs text-foreground">{t("dashboardCompany.creativeSuite")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-3 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                            <Input type="search" placeholder={t("dashboardCompany.search")} className="w-full rounded-2xl bg-muted pl-9 pr-4 py-2" />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-3 py-2">
                        <div className="space-y-1">
                            {sidebarItems.map((item) => (
                                <div key={item.title} className="mb-1">
                                    <button
                                        className={cn(
                                            "flex w-full items-center justify-between text-foreground rounded-2xl px-3 py-2 text-sm font-medium",
                                            item.isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
                                        )}
                                        onClick={() => item.items && toggleExpanded(item.title)}
                                    >
                                        <div className="flex items-center text-foreground gap-3">
                                            {item.icon}
                                            <span>{item.title}</span>
                                        </div>
                                        {item.badge && (
                                            <Badge variant="outline" className="ml-auto rounded-full px-2 py-0.5 text-xs">
                                                {item.badge}
                                            </Badge>
                                        )}
                                        {item.items && (
                                            <ChevronDown
                                                className={cn(
                                                    "ml-2 h-4 w-4 transition-transform",
                                                    expandedItems[item.title] ? "rotate-180" : "",
                                                )}
                                            />
                                        )}
                                    </button>

                                    {item.items && expandedItems[item.title] && (
                                        <div className="mt-1 ml-6 space-y-1 border-l pl-3">
                                            {item.items.map((subItem) => (
                                                <a
                                                    key={subItem.title}
                                                    href={subItem.url}
                                                    className="flex items-center justify-between text-foreground rounded-2xl px-3 py-2 text-sm hover:bg-muted"
                                                >
                                                    {subItem.title}
                                                    {subItem.badge && (
                                                        <Badge variant="outline" className="ml-auto rounded-full px-2 py-0.5 text-xs">
                                                            {subItem.badge}
                                                        </Badge>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="border-t p-3">
                        <div className="space-y-1 text-foreground">
                            <button className="flex w-full text-foreground items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted">
                                <Settings className="h-5 w-5" />
                                <span>{t("dashboardCompany.settings")}</span>
                            </button>
                            <SignedIn>
                                <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 ml-2">
                                    <LynkSkillUserButton />
                                    <div className="text-foreground text-sm font-medium">{t("dashboardCompany.user")}</div>
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={cn("min-h-screen transition-[padding] duration-150 ease-in-out", sidebarOpen ? "md:pl-64" : "md:pl-0")}>
                <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="h-5 w-5 text-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <PanelLeft className="h-5 w-5 text-foreground" />
                    </Button>
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-xl font-semibold text-foreground">{t("dashboardCompany.designaliCreative")}</h1>
                        <div className="flex items-center text-foreground gap-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-2xl">
                                            <Cloud className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t("dashboardCompany.cloudStorage")}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-2xl">
                                            <MessageSquare className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t("dashboardCompany.messages")}</TooltipContent>
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
                                    <TooltipContent>{t("dashboardCompany.notifications")}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-2xl">
                                            <ModeToggle/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t("dashboardCompany.toggleTheme")}</TooltipContent>
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

                <main className="flex-1 p-4 md:p-6 text-foreground">
                    <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <TabsList className="grid w-full max-w-[600px] grid-cols-5 rounded-2xl p-1">
                                <TabsTrigger value="home" className="rounded-xl data-[state=active]:rounded-xl">
                                    {t("dashboardCompany.home")}
                                </TabsTrigger>
                                <TabsTrigger value="apps" className="rounded-xl data-[state=active]:rounded-xl">
                                    {t("dashboardCompany.apps")}
                                </TabsTrigger>
                                <TabsTrigger value="files" className="rounded-xl data-[state=active]:rounded-xl">
                                    {t("dashboardCompany.files")}
                                </TabsTrigger>
                                <TabsTrigger value="projects" className="rounded-xl data-[state=active]:rounded-xl">
                                    {t("dashboardCompany.projects")}
                                </TabsTrigger>
                                <TabsTrigger value="learn" className="rounded-xl data-[state=active]:rounded-xl">
                                    {t("dashboardCompany.learn")}
                                </TabsTrigger>
                            </TabsList>
                            <div className="hidden md:flex gap-2">
                                <Button variant="outline" className="rounded-2xl">
                                    <Download className="mr-2 h-4 w-4" />
                                    {t("dashboardCompany.installApp")}
                                </Button>
                                <Button className="rounded-2xl">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("dashboardCompany.newProject")}
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
                                    <section>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-white"
                                        >
                                            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                                <div className="space-y-4">
                                                    <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-xl">{t("dashboardCompany.premium")}</Badge>
                                                    <h2 className="text-3xl font-bold">{t("dashboardCompany.welcomeTitle")}</h2>
                                                    <p className="max-w-[600px] text-white/80">
                                                        {t("dashboardCompany.welcomeSubtitle")}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3">
                                                        <Button className="rounded-2xl bg-white text-indigo-700 hover:bg-white/90">
                                                            {t("dashboardCompany.explorePlans")}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="rounded-2xl bg-transparent border-white text-white hover:bg-white/10"
                                                        >
                                                            {t("dashboardCompany.takeATour")}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="hidden lg:block">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 50, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                                        className="relative h-40 w-40"
                                                    >
                                                        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md" />
                                                        <div className="absolute inset-4 rounded-full bg-white/20" />
                                                        <div className="absolute inset-8 rounded-full bg-white/30" />
                                                        <div className="absolute inset-12 rounded-full bg-white/40" />
                                                        <div className="absolute inset-16 rounded-full bg-white/50" />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-semibold"> {t("dashboardCompany.myRecentInternship")}  </h2>
                                            <Button variant="ghost" className="rounded-2xl">
                                                {t("dashboardCompany.viewAll")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                            {apps
                                                .filter((app) => app.recent)
                                                .map((app) => (
                                                    <motion.div key={app.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                        <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
                                                            <CardHeader className="pb-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                                                        {app.icon}
                                                                    </div>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-2xl">
                                                                        <Star className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="pb-2">
                                                                <CardTitle className="text-lg">{app.name}</CardTitle>
                                                                <CardDescription>{app.description}</CardDescription>
                                                            </CardContent>
                                                            <CardFooter>
                                                                <Button variant="secondary" className="w-full rounded-2xl">
                                                                    {t("dashboardCompany.open")}
                                                                </Button>
                                                            </CardFooter>
                                                        </Card>
                                                    </motion.div>
                                                ))}
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-semibold">{t("dashboardCompany.allMyInternships")}</h2>
                                                <Button variant="ghost" className="rounded-2xl">
                                                    {t("dashboardCompany.viewAll")}
                                                </Button>
                                            </div>
                                            <div className="rounded-3xl border">
                                                <div className="grid grid-cols-1 divide-y">
                                                    {recentFiles.slice(0, 4).map((file) => (
                                                        <motion.div
                                                            key={file.name}
                                                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                                                            className="flex items-center justify-between p-4"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                                                                    {file.icon}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">{file.name}</p>
                                                                    <p className="text-sm text-foreground">
                                                                        {file.app} • {file.modified}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {file.shared && (
                                                                    <Badge variant="outline" className="rounded-xl">
                                                                        <Users className="mr-1 h-3 w-3" />
                                                                        {file.collaborators}
                                                                    </Badge>
                                                                )}
                                                                <Button variant="ghost" size="sm" className="rounded-xl">
                                                                    {t("dashboardCompany.open")}
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-semibold">{t("dashboardCompany.activeProjects")}</h2>
                                                <Button variant="ghost" className="rounded-2xl">
                                                    {t("dashboardCompany.viewAll")}
                                                </Button>
                                            </div>
                                            <div className="rounded-3xl border">
                                                <div className="grid grid-cols-1 divide-y">
                                                    {projects.slice(0, 3).map((project) => (
                                                        <motion.div
                                                            key={project.name}
                                                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                                                            className="p-4"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h3 className="font-medium">{project.name}</h3>
                                                                <Badge variant="outline" className="rounded-xl">
                                                                    Due {project.dueDate}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-foreground mb-3">{project.description}</p>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span>{t("dashboardCompany.progress")}</span>
                                                                    <span>{project.progress}%</span>
                                                                </div>
                                                                <Progress value={project.progress} className="h-2 rounded-xl" />
                                                            </div>
                                                            <div className="flex items-center justify-between mt-3 text-sm text-foreground">
                                                                <div className="flex items-center">
                                                                    <Users className="mr-1 h-4 w-4" />
                                                                    {project.members} {t("dashboardCompany.members")}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <FileText className="mr-1 h-4 w-4" />
                                                                    {project.files} {t("dashboardCompany.filesCount")}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-semibold">{t("dashboardCompany.communityHighlights")}</h2>
                                            <Button variant="ghost" className="rounded-2xl">
                                                {t("dashboardCompany.explore")}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            {communityPosts.map((post) => (
                                                <motion.div key={post.title} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                    <Card className="overflow-hidden rounded-3xl">
                                                        <div className="aspect-[4/3] overflow-hidden bg-muted">
                                                            <Image
                                                                src={post.image || "/placeholder.svg"}
                                                                alt={post.title}
                                                                fill
                                                                className="object-cover transition-transform duration-300 hover:scale-105"
                                                            />
                                                        </div>
                                                        <CardContent className="p-4">
                                                            <h3 className="font-semibold">{post.title}</h3>
                                                            <p className="text-sm text-foreground">by {post.author}</p>
                                                            <div className="mt-2 flex items-center justify-between text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <Heart className="h-4 w-4 text-red-500" />
                                                                    {post.likes}
                                                                    <MessageSquare className="ml-2 h-4 w-4 text-blue-500" />
                                                                    {post.comments}
                                                                </div>
                                                                <span className="text-foreground">{post.time}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="apps" className="space-y-8 mt-0">
                                    <section>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 p-8 text-white"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-bold">{t("dashboardCompany.creativeAppsCollection")}</h2>
                                                    <p className="max-w-[600px] text-white/80">
                                                        {t("dashboardCompany.creativeAppsDesc")}
                                                    </p>
                                                </div>
                                                <Button className="w-fit rounded-2xl bg-white text-red-700 hover:bg-white/90">
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {t("dashboardCompany.installDesktopApp")}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </section>

                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <Button variant="outline" className="rounded-2xl">
                                            {t("dashboardCompany.allCategories")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            {t("dashboardCompany.creative")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            {t("dashboardCompany.video")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            {t("dashboardCompany.web")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            {t("dashboardCompany.threeD")}
                                        </Button>
                                        <div className="flex-1"></div>
                                        <div className="relative w-full md:w-auto mt-3 md:mt-0">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                                            <Input
                                                type="search"
                                                placeholder={t("dashboardCompany.searchApps")}
                                                className="w-full rounded-2xl pl-9 md:w-[200px]"
                                            />
                                        </div>
                                    </div>

                                    <section className="space-y-4">
                                        <h2 className="text-2xl font-semibold">{t("dashboardCompany.newReleases")}</h2>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                            {apps
                                                .filter((app) => app.new)
                                                .map((app) => (
                                                    <motion.div key={app.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                        <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
                                                            <CardHeader className="pb-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                                                        {app.icon}
                                                                    </div>
                                                                    <Badge className="rounded-xl bg-amber-500">{t("dashboardCompany.new")}</Badge>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="pb-2">
                                                                <CardTitle className="text-lg">{app.name}</CardTitle>
                                                                <CardDescription>{app.description}</CardDescription>
                                                                <div className="mt-2">
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span>{t("dashboardCompany.installation")}</span>
                                                                        <span>{app.progress}%</span>
                                                                    </div>
                                                                    <Progress value={app.progress} className="h-2 mt-1 rounded-xl" />
                                                                </div>
                                                            </CardContent>
                                                            <CardFooter>
                                                                <Button variant="secondary" className="w-full rounded-2xl">
                                                                    {app.progress < 100 ? t("dashboardCompany.continueInstall") : t("dashboardCompany.open")}
                                                                </Button>
                                                            </CardFooter>
                                                        </Card>
                                                    </motion.div>
                                                ))}
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-2xl font-semibold">{t("dashboardCompany.allApps")}</h2>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                            {apps.map((app) => (
                                                <motion.div key={app.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                    <Card className="overflow-hidden rounded-3xl border hover:border-primary/50 transition-all duration-300">
                                                        <CardHeader className="pb-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                                                                    {app.icon}
                                                                </div>
                                                                <Badge variant="outline" className="rounded-xl">
                                                                    {app.category}
                                                                </Badge>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pb-2">
                                                            <CardTitle className="text-lg">{app.name}</CardTitle>
                                                            <CardDescription>{app.description}</CardDescription>
                                                        </CardContent>
                                                        <CardFooter className="flex gap-2">
                                                            <Button variant="secondary" className="flex-1 rounded-2xl">
                                                                {app.progress < 100 ? t("dashboardCompany.install") : t("dashboardCompany.open")}
                                                            </Button>
                                                            <Button variant="outline" size="icon" className="rounded-2xl">
                                                                <Star className="h-4 w-4" />
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="files" className="space-y-8 mt-0">
                                    <section>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 text-white"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-bold">{t("dashboardCompany.yourCreativeFiles")}</h2>
                                                    <p className="max-w-[600px] text-white/80">
                                                        {t("dashboardCompany.yourCreativeFilesDesc")}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    <Button className="rounded-2xl bg-white/20 backdrop-blur-md hover:bg-white/30">
                                                        <Cloud className="mr-2 h-4 w-4" />
                                                        {t("dashboardCompany.cloudStorage")}
                                                    </Button>
                                                    <Button className="rounded-2xl bg-white text-blue-700 hover:bg-white/90">
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        {t("dashboardCompany.uploadFiles")}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </section>

                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <Button variant="outline" className="rounded-2xl">
                                            <FileText className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.allFiles")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Clock className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.recent")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Users className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.shared")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Star className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.favorites")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Trash className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.trash")}
                                        </Button>
                                        <div className="flex-1"></div>
                                        <div className="relative w-full md:w-auto mt-3 md:mt-0">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                                            <Input
                                                type="search"
                                                placeholder={t("dashboardCompany.searchFiles")}
                                                className="w-full rounded-2xl pl-9 md:w-[200px]"
                                            />
                                        </div>
                                    </div>

                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-semibold">{t("dashboardCompany.allFiles")}</h2>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="rounded-2xl">
                                                    <PanelLeft className="mr-2 h-4 w-4" />
                                                    {t("dashboardCompany.filter")}
                                                </Button>
                                                <Button variant="outline" size="sm" className="rounded-2xl">
                                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                                    {t("dashboardCompany.sort")}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="rounded-3xl border overflow-hidden">
                                            <div className="bg-muted/50 p-3 hidden md:grid md:grid-cols-12 text-sm font-medium">
                                                <div className="col-span-6">{t("dashboardCompany.name")}</div>
                                                <div className="col-span-2">{t("dashboardCompany.app")}</div>
                                                <div className="col-span-2">{t("dashboardCompany.size")}</div>
                                                <div className="col-span-2">{t("dashboardCompany.modified")}</div>
                                            </div>
                                            <div className="divide-y">
                                                {recentFiles.map((file) => (
                                                    <motion.div
                                                        key={file.name}
                                                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                                                        className="p-3 md:grid md:grid-cols-12 items-center flex flex-col md:flex-row gap-3 md:gap-0"
                                                    >
                                                        <div className="col-span-6 flex items-center gap-3 w-full md:w-auto">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                                                                {file.icon}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{file.name}</p>
                                                                {file.shared && (
                                                                    <div className="flex items-center text-xs text-foreground">
                                                                        <Users className="mr-1 h-3 w-3" />
                                                                        {t("dashboardCompany.sharedWith")} {file.collaborators} {t("dashboardCompany.people")}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2 text-sm md:text-base">{file.app}</div>
                                                        <div className="col-span-2 text-sm md:text-base">{file.size}</div>
                                                        <div className="col-span-2 flex items-center justify-between w-full md:w-auto">
                                                            <span className="text-sm md:text-base">{file.modified}</span>
                                                            <div className="flex gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                                                    <Share2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="projects" className="space-y-8 mt-0">
                                    <section>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-8 text-white"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-bold">{t("dashboardCompany.projectManagement")}</h2>
                                                    <p className="max-w-[600px] text-white/80">
                                                        {t("dashboardCompany.projectManagementDesc")}
                                                    </p>
                                                </div>
                                                <Button className="w-fit rounded-2xl bg-white text-indigo-700 hover:bg-white/90">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    {t("dashboardCompany.newProject")}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </section>

                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <Button variant="outline" className="rounded-2xl">
                                            <Layers className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.allProjects")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Clock className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.recent")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Users className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.shared")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Archive className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.archived")}
                                        </Button>
                                        <div className="flex-1"></div>
                                        <div className="relative w-full md:w-auto mt-3 md:mt-0">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                                            <Input
                                                type="search"
                                                placeholder={t("dashboardCompany.searchProjects")}
                                                className="w-full rounded-2xl pl-9 md:w-[200px]"
                                            />
                                        </div>
                                    </div>

                                    <section className="space-y-4">
                                        <h2 className="text-2xl font-semibold">{t("dashboardCompany.activeProjects")}</h2>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                            {projects.map((project) => (
                                                <motion.div key={project.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                    <Card className="overflow-hidden rounded-3xl border hover:border-primary/50 transition-all duration-300">
                                                        <CardHeader>
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle>{project.name}</CardTitle>
                                                                <Badge variant="outline" className="rounded-xl">
                                                                    Due {project.dueDate}
                                                                </Badge>
                                                            </div>
                                                            <CardDescription>{project.description}</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span>{t("dashboardCompany.progress")}</span>
                                                                    <span>{project.progress}%</span>
                                                                </div>
                                                                <Progress value={project.progress} className="h-2 rounded-xl" />
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm text-foreground">
                                                                <div className="flex items-center">
                                                                    <Users className="mr-1 h-4 w-4" />
                                                                    {project.members} {t("dashboardCompany.members")}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <FileText className="mr-1 h-4 w-4" />
                                                                    {project.files} {t("dashboardCompany.filesCount")}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter className="flex gap-2">
                                                            <Button variant="secondary" className="flex-1 rounded-2xl">
                                                                {t("dashboardCompany.openProject")}
                                                            </Button>
                                                            <Button variant="outline" size="icon" className="rounded-2xl">
                                                                <Share2 className="h-4 w-4" />
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                            <motion.div whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                <Card className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed p-8 hover:border-primary/50 transition-all duration-300">
                                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                        <Plus className="h-6 w-6" />
                                                    </div>
                                                    <h3 className="text-lg font-medium">{t("dashboardCompany.createNewProject")}</h3>
                                                    <p className="mb-4 text-center text-sm text-foreground">
                                                        {t("dashboardCompany.createNewProjectDesc")}
                                                    </p>
                                                    <Button className="rounded-2xl">{t("dashboardCompany.newProject")}</Button>
                                                </Card>
                                            </motion.div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-2xl font-semibold">{t("dashboardCompany.projectTemplates")}</h2>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                            <Card className="overflow-hidden rounded-3xl">
                                                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
                                                    <h3 className="text-lg font-medium">{t("dashboardCompany.brandIdentity")}</h3>
                                                    <p className="text-sm text-white/80">{t("dashboardCompany.brandIdentityDesc")}</p>
                                                </div>
                                                <CardFooter className="flex justify-between p-4">
                                                    <Badge variant="outline" className="rounded-xl">
                                                        {t("dashboardCompany.popular")}
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" className="rounded-xl">
                                                        {t("dashboardCompany.useTemplate")}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                            <Card className="overflow-hidden rounded-3xl">
                                                <div className="aspect-video bg-gradient-to-br from-amber-500 to-red-600 p-6 text-white">
                                                    <h3 className="text-lg font-medium">{t("dashboardCompany.marketingCampaign")}</h3>
                                                    <p className="text-sm text-white/80">{t("dashboardCompany.marketingCampaignDesc")}</p>
                                                </div>
                                                <CardFooter className="flex justify-between p-4">
                                                    <Badge variant="outline" className="rounded-xl">
                                                        {t("dashboardCompany.new")}
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" className="rounded-xl">
                                                        {t("dashboardCompany.useTemplate")}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                            <Card className="overflow-hidden rounded-3xl">
                                                <div className="aspect-video bg-gradient-to-br from-green-500 to-teal-600 p-6 text-white">
                                                    <h3 className="text-lg font-medium">{t("dashboardCompany.websiteRedesign")}</h3>
                                                    <p className="text-sm text-white/80">{t("dashboardCompany.websiteRedesignDesc")}</p>
                                                </div>
                                                <CardFooter className="flex justify-between p-4">
                                                    <Badge variant="outline" className="rounded-xl">
                                                        {t("dashboardCompany.featured")}
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" className="rounded-xl">
                                                        {t("dashboardCompany.useTemplate")}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                            <Card className="overflow-hidden rounded-3xl">
                                                <div className="aspect-video bg-gradient-to-br from-pink-500 to-rose-600 p-6 text-white">
                                                    <h3 className="text-lg font-medium">{t("dashboardCompany.productLaunch")}</h3>
                                                    <p className="text-sm text-white/80">{t("dashboardCompany.productLaunchDesc")}</p>
                                                </div>
                                                <CardFooter className="flex justify-between p-4">
                                                    <Badge variant="outline" className="rounded-xl">
                                                        {t("dashboardCompany.popular")}
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" className="rounded-xl">
                                                        {t("dashboardCompany.useTemplate")}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="learn" className="space-y-8 mt-0">
                                    <section>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-bold">{t("dashboardCompany.learnAndGrow")}</h2>
                                                    <p className="max-w-[600px] text-white/80">
                                                        {t("dashboardCompany.learnAndGrowDesc")}
                                                    </p>
                                                </div>
                                                <Button className="w-fit rounded-2xl bg-white text-emerald-700 hover:bg-white/90">
                                                    <Crown className="mr-2 h-4 w-4" />
                                                    {t("dashboardCompany.upgradeToPro")}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </section>

                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <Button variant="outline" className="rounded-2xl">
                                            <Play className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.allTutorials")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.courses")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Lightbulb className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.tipsAndTricks")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <TrendingUp className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.trending")}
                                        </Button>
                                        <Button variant="outline" className="rounded-2xl">
                                            <Bookmark className="mr-2 h-4 w-4" />
                                            {t("dashboardCompany.saved")}
                                        </Button>
                                        <div className="flex-1"></div>
                                        <div className="relative w-full md:w-auto mt-3 md:mt-0">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                                            <Input
                                                type="search"
                                                placeholder={t("dashboardCompany.searchTutorials")}
                                                className="w-full rounded-2xl pl-9 md:w-[200px]"
                                            />
                                        </div>
                                    </div>

                                    <section className="space-y-4">
                                        <h2 className="text-2xl font-semibold">{t("dashboardCompany.featuredTutorials")}</h2>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {tutorials.slice(0, 3).map((tutorial) => (
                                                <motion.div key={tutorial.title} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                    <Card className="overflow-hidden rounded-3xl">
                                                        <div className="aspect-video overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full">
                                                                    <Play className="h-6 w-6" />
                                                                </Button>
                                                            </div>
                                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                                                                <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-xl">
                                                                    {tutorial.category}
                                                                </Badge>
                                                                <h3 className="mt-2 text-lg font-medium">{tutorial.title}</h3>
                                                            </div>
                                                        </div>
                                                        <CardContent className="p-4">
                                                            <p className="text-sm text-foreground">{tutorial.description}</p>
                                                            <div className="mt-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarFallback>{tutorial.instructor.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-sm">{tutorial.instructor}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                                    <Clock className="h-4 w-4" />
                                                                    {tutorial.duration}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter className="flex items-center justify-between border-t p-4">
                                                            <Badge variant="outline" className="rounded-xl">
                                                                {tutorial.level}
                                                            </Badge>
                                                            <div className="flex items-center gap-1 text-sm text-foreground">
                                                                <Eye className="h-4 w-4" />
                                                                {tutorial.views} {t("dashboardCompany.views")}
                                                            </div>
                                                        </CardFooter>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-semibold">{t("dashboardCompany.popularCourses")}</h2>
                                            <Button variant="ghost" className="rounded-2xl">
                                                {t("dashboardCompany.viewAll")}
                                            </Button>
                                        </div>
                                        <div className="rounded-3xl border overflow-hidden">
                                            <div className="divide-y">
                                                {tutorials.slice(3, 5).map((tutorial) => (
                                                    <motion.div
                                                        key={tutorial.title}
                                                        whileHover={{ scale: 1.02, y: -5 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="p-4 flex flex-col md:flex-row gap-3"
                                                    >
                                                        <div className="flex-shrink-0">
                                                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600">
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <Play className="h-8 w-8 text-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-medium">{tutorial.title}</h3>
                                                            <p className="text-sm text-foreground">{tutorial.description}</p>
                                                            <div className="mt-2 flex flex-wrap items-center gap-3">
                                                                <Badge variant="outline" className="rounded-xl">
                                                                    {tutorial.level}
                                                                </Badge>
                                                                <div className="flex items-center gap-1 text-sm text-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {tutorial.duration}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-sm text-foreground">
                                                                    <Eye className="h-3 w-3" />
                                                                    {tutorial.views} {t("dashboardCompany.views")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Button variant="ghost" size="sm" className="rounded-xl">
                                                                {t("dashboardCompany.watchNow")}
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h2 className="text-2xl font-semibold">{t("dashboardCompany.learningPaths")}</h2>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge className="rounded-xl bg-blue-500 text-white">{t("dashboardCompany.beginner")}</Badge>
                                                        <Award className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                    <CardTitle className="mt-2">{t("dashboardCompany.uiuxFundamentals")}</CardTitle>
                                                    <CardDescription>{t("dashboardCompany.uiuxFundamentalsDesc")}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>{t("dashboardCompany.coursesHours1")}</span>
                                                            <span>4.8 ★</span>
                                                        </div>
                                                        <Progress value={30} className="h-2 rounded-xl" />
                                                        <p className="text-xs text-foreground">{t("dashboardCompany.thirtyCompleted")}</p>
                                                    </div>
                                                </CardContent>
                                                <CardFooter>
                                                    <Button variant="secondary" className="w-full rounded-2xl">
                                                        {t("dashboardCompany.continueLearning")}
                                                    </Button>
                                                </CardFooter>
                                            </Card>

                                            <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge className="rounded-xl bg-amber-500">{t("dashboardCompany.intermediate")}</Badge>
                                                        <Award className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                    <CardTitle className="mt-2">{t("dashboardCompany.digitalIllustration")}</CardTitle>
                                                    <CardDescription>{t("dashboardCompany.digitalIllustrationDesc")}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>{t("dashboardCompany.coursesHours2")}</span>
                                                            <span>4.9 ★</span>
                                                        </div>
                                                        <Progress value={0} className="h-2 rounded-xl" />
                                                        <p className="text-xs text-foreground">{t("dashboardCompany.notStarted")}</p>
                                                    </div>
                                                </CardContent>
                                                <CardFooter>
                                                    <Button variant="secondary" className="w-full rounded-2xl">
                                                        {t("dashboardCompany.startLearning")}
                                                    </Button>
                                                </CardFooter>
                                            </Card>

                                            <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge className="rounded-xl bg-red-500 text-white">{t("dashboardCompany.advanced")}</Badge>
                                                        <Award className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                    <CardTitle className="mt-2">{t("dashboardCompany.motionGraphics")}</CardTitle>
                                                    <CardDescription>{t("dashboardCompany.motionGraphicsDesc")}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>{t("dashboardCompany.coursesHours3")}</span>
                                                            <span>4.7 ★</span>
                                                        </div>
                                                        <Progress value={0} className="h-2 rounded-xl" />
                                                        <p className="text-xs text-foreground">{t("dashboardCompany.notStarted")}</p>
                                                    </div>
                                                </CardContent>
                                                <CardFooter>
                                                    <Button variant="secondary" className="w-full rounded-2xl">
                                                        {t("dashboardCompany.startLearning")}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </div>
                                    </section>
                                </TabsContent>
                            </motion.div>
                        </AnimatePresence>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}
