"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/lib/i18n"

export function LandingThemeToggle() {
    const { setTheme, theme } = useTheme()
    const { t } = useTranslation()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-2xl transition-all duration-300 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-110 active:scale-95"
                >
                    <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                    <span className="sr-only">{t("dashboard.toggleTheme")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="min-w-[160px] bg-background/95 backdrop-blur-xl border-purple-500/20"
            >
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-2 cursor-pointer transition-colors ${
                        theme === "light"
                            ? "bg-purple-500/20 text-foreground"
                            : "hover:bg-purple-500/10"
                    }`}
                >
                    <Sun className="h-4 w-4" />
                    <span>{t("settings.light")}</span>
                    {theme === "light" && (
                        <span className="ml-auto text-purple-400">✓</span>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-2 cursor-pointer transition-colors ${
                        theme === "dark"
                            ? "bg-purple-500/20 text-foreground"
                            : "hover:bg-purple-500/10"
                    }`}
                >
                    <Moon className="h-4 w-4" />
                    <span>{t("settings.dark")}</span>
                    {theme === "dark" && (
                        <span className="ml-auto text-purple-400">✓</span>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={`flex items-center gap-2 cursor-pointer transition-colors ${
                        theme === "system"
                            ? "bg-purple-500/20 text-foreground"
                            : "hover:bg-purple-500/10"
                    }`}
                >
                    <Monitor className="h-4 w-4" />
                    <span>{t("settings.system")}</span>
                    {theme === "system" && (
                        <span className="ml-auto text-purple-400">✓</span>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
