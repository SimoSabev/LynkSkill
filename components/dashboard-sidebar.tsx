"use client"

import {useState} from "react"
import {ChevronDown, Search, Settings, Wand2, X, LogOut, User} from "lucide-react"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {ScrollArea} from "@/components/ui/scroll-area"
import {cn} from "@/lib/utils"
import {sidebarItems} from "@/lib/dashboard-data"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {SignedIn, UserButton} from "@clerk/nextjs";

interface DashboardSidebarProps {
    userType: "Student" | "Company"
    isOpen: boolean
    isMobile?: boolean
    onClose?: () => void
    companyName?: string | null
    companyLogo?: string | null
}


export function DashboardSidebar({
                              userType,
                              isOpen,
                              isMobile = false,
                              onClose,
                              companyName,
                              companyLogo,
                          }: DashboardSidebarProps) {

    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

    const toggleExpanded = (title: string) => {
        setExpandedItems((prev) => ({
            ...prev,
            [title]: !prev[title],
        }))
    }

    const sidebarContent = (
        <div className="flex h-full flex-col border-r text-foreground">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    {userType === "Company" && companyLogo ? (
                        <img
                            src={companyLogo}
                            alt="Company Logo"
                            className="h-10 w-10 rounded-2xl object-cover"
                        />
                    ) : (
                        <div
                            className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                            <Wand2 className="size-5"/>
                        </div>
                    )}
                    <div>
                        <h2 className="font-semibold">
                            {userType === "Company" ? companyName ?? "Loading..." : "Student"}
                        </h2>
                        <p className="text-xs text-foreground">
                            {userType === "Company" ? "Company Dashboard" : "Creative Suite"}
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
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-foreground"/>
                    <Input type="search" placeholder="Search..."
                           className="w-full rounded-2xl bg-muted pl-9 pr-4 py-2"/>
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
                                        className={cn("ml-2 h-4 w-4 transition-transform", expandedItems[item.title] ? "rotate-180" : "")}
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
                                                <Badge variant="outline"
                                                       className="ml-auto rounded-full px-2 py-0.5 text-xs">
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
                                        // userButtonAvatarBox:
                                        //     "w-8 h-8 sm:w-8 sm:h-8 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-black transition-all duration-300 hover:ring-purple-400",
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
