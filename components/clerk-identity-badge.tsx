"use client"

import React from "react"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ClerkIdentityBadgeProps {
    size?: "sm" | "md" | "lg"
    showSecondaryText?: boolean
    className?: string
}

export function ClerkIdentityBadge({
    size = "md",
    showSecondaryText = true,
    className,
}: ClerkIdentityBadgeProps) {
    const { user } = useUser()

    if (!user) return null

    const displayName =
        user.fullName || user.primaryEmailAddress?.emailAddress || "User"
    const email = user.primaryEmailAddress?.emailAddress

    const sizeClasses = {
        sm: "h-7 gap-2 text-xs px-2",
        md: "h-9 gap-2.5 text-sm px-3",
        lg: "h-11 gap-3 text-base px-4",
    }

    const avatarSizes = { sm: 20, md: 28, lg: 36 }

    return (
        <div
            className={cn(
                "flex items-center rounded-full bg-muted/50 border border-border/40",
                sizeClasses[size],
                className
            )}
        >
            <ClerkUserAvatar size={avatarSizes[size]} />
            <div className="flex flex-col leading-tight">
                <span className="font-medium truncate max-w-[120px]">
                    {displayName}
                </span>
                {showSecondaryText && email && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {email}
                    </span>
                )}
            </div>
        </div>
    )
}

interface ClerkUserAvatarProps {
    size?: number
    className?: string
}

export function ClerkUserAvatar({ size = 28, className }: ClerkUserAvatarProps) {
    const { user } = useUser()

    if (!user?.imageUrl) {
        return (
            <div
                className={cn(
                    "rounded-full bg-violet-500/20 flex items-center justify-center text-violet-600 font-semibold",
                    className
                )}
                style={{ width: size, height: size, fontSize: size * 0.4 }}
            >
                {(user?.fullName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "U").toUpperCase()}
            </div>
        )
    }

    return (
        <Image
            src={user.imageUrl}
            alt={user.fullName || "User"}
            width={size}
            height={size}
            className={cn("rounded-full", className)}
        />
    )
}
