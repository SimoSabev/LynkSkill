"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ModeToggleProps {
    /** Optional tooltip content shown on hover/focus of the toggle button. */
    tooltip?: React.ReactNode
    /** Class name applied to the tooltip content. */
    tooltipClassName?: string
    /** Class name applied to the trigger button. */
    className?: string
    variant?: React.ComponentProps<typeof Button>["variant"]
    /** Accessible label for the icon-only trigger button. */
    label?: string
}

export function ModeToggle({
    tooltip,
    tooltipClassName,
    className,
    variant = "outline",
    label = "Toggle theme",
}: ModeToggleProps = {}) {
    const { setTheme } = useTheme()

    const trigger = (
        <DropdownMenuTrigger asChild>
            <Button variant={variant} size="icon" className={className} aria-label={label}>
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">{label}</span>
            </Button>
        </DropdownMenuTrigger>
    )

    return (
        <DropdownMenu>
            {tooltip ? (
                <Tooltip>
                    <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                    <TooltipContent className={tooltipClassName}>{tooltip}</TooltipContent>
                </Tooltip>
            ) : (
                trigger
            )}
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
