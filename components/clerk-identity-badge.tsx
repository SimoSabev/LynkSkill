"use client"

import React from "react"
import { useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ClerkIcon } from "@/components/ui/clerk-icon"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export type ClerkIdentity = {
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  username?: string | null
  emailAddress?: string | null
  imageUrl?: string | null
}

type SizeKey = "sm" | "md" | "lg"

type SizeConfig = {
  avatar: string
  name: string
  text: string
  label: string
  icon: number
}

const SIZE_CONFIG: Record<SizeKey, SizeConfig> = {
  sm: {
    avatar: "h-8 w-8",
    name: "text-sm",
    text: "text-[11px]",
    label: "text-[10px]",
    icon: 12,
  },
  md: {
    avatar: "h-10 w-10",
    name: "text-base",
    text: "text-xs",
    label: "text-[11px]",
    icon: 14,
  },
  lg: {
    avatar: "h-12 w-12",
    name: "text-lg",
    text: "text-sm",
    label: "text-xs",
    icon: 16,
  },
}

const AVATAR_SIZE_MAP = {
  xs: "h-6 w-6",
  sm: "h-7 w-7",
  md: "h-9 w-9",
} as const

type AvatarSizeKey = keyof typeof AVATAR_SIZE_MAP

type ClerkUserType = ReturnType<typeof useUser>["user"]

const mapClerkUser = (user?: ClerkUserType | null): ClerkIdentity | undefined => {
  if (!user) return undefined

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    username: user.username,
    emailAddress: user.primaryEmailAddress?.emailAddress,
    imageUrl: user.imageUrl,
  }
}

const joinNames = (first?: string | null, last?: string | null) => {
  return [first, last].filter(Boolean).join(" ").trim()
}

const buildInitials = (identity?: ClerkIdentity) => {
  const source =
    joinNames(identity?.firstName, identity?.lastName) ||
    identity?.fullName ||
    identity?.username ||
    identity?.emailAddress ||
    "You"

  const letters = source
    .split(/\s|_|-/)
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join("")

  return letters.slice(0, 2).toUpperCase() || "YU"
}

const buildDisplayName = (identity?: ClerkIdentity, initials?: string) => {
  const preferredName = joinNames(identity?.firstName, identity?.lastName)

  if (preferredName) return preferredName
  if (identity?.username) return identity.username
  if (identity?.emailAddress) return identity.emailAddress
  if (identity?.fullName) return identity.fullName

  return initials || "You"
}

const buildSecondaryText = (identity?: ClerkIdentity, displayName?: string) => {
  if (!identity) return undefined

  if (identity.emailAddress && identity.emailAddress !== displayName) {
    return identity.emailAddress
  }

  if (identity.username && identity.username !== displayName) {
    return identity.username
  }

  return undefined
}

const useResolvedIdentity = (identity?: ClerkIdentity) => {
  const { user, isLoaded } = useUser()

  const resolvedIdentity = React.useMemo<ClerkIdentity | undefined>(
    () => identity ?? mapClerkUser(user),
    [identity, user]
  )

  return {
    resolvedIdentity,
    isLoading: !identity && !isLoaded && !resolvedIdentity,
  }
}

export interface ClerkIdentityBadgeProps {
  size?: SizeKey
  showClerkIcon?: boolean
  className?: string
  label?: React.ReactNode
  identity?: ClerkIdentity
  showSecondaryText?: boolean
}

/**
 * Renders the authenticated Clerk user's identity with brand attribution.
 */
export function ClerkIdentityBadge({
  size = "sm",
  showClerkIcon = true,
  className,
  label = "You're signed in as",
  identity,
  showSecondaryText = true,
}: ClerkIdentityBadgeProps) {
  const { resolvedIdentity, isLoading } = useResolvedIdentity(identity)
  const config = SIZE_CONFIG[size]
  const initials = React.useMemo(() => buildInitials(resolvedIdentity), [resolvedIdentity])
  const displayName = React.useMemo(
    () => buildDisplayName(resolvedIdentity, initials),
    [resolvedIdentity, initials]
  )
  const secondaryText = React.useMemo(
    () => (showSecondaryText ? buildSecondaryText(resolvedIdentity, displayName) : undefined),
    [resolvedIdentity, displayName, showSecondaryText]
  )

  const accessibleLabel = typeof label === "string" ? label : "Current user"

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Skeleton className={cn("rounded-full", config.avatar)} />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-3 w-32" />
          {showSecondaryText && <Skeleton className="h-2 w-20" />}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2 shadow-sm",
        className
      )}
      role="group"
      aria-label={`${accessibleLabel} ${displayName}`}
    >
      <Avatar className={cn(config.avatar, "border border-border/60")}>
        <AvatarImage src={resolvedIdentity?.imageUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-0.5">
        {label && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-muted-foreground/70",
              config.label
            )}
          >
            {showClerkIcon && (
              <ClerkIcon
                size={config.icon}
                className="text-violet-600 dark:text-violet-400"
                aria-hidden
              />
            )}
            <span className="truncate">{label}</span>
          </span>
        )}
        <span className={cn("font-semibold text-foreground truncate", config.name)}>{displayName}</span>
        {secondaryText && (
          <span className={cn("text-muted-foreground truncate", config.text)}>{secondaryText}</span>
        )}
      </div>
    </div>
  )
}

export interface ClerkUserAvatarProps {
  size?: AvatarSizeKey
  className?: string
  identity?: ClerkIdentity
  ariaLabel?: string
}

/**
 * Compact avatar-only representation of the signed-in Clerk user.
 */
export function ClerkUserAvatar({
  size = "sm",
  className,
  identity,
  ariaLabel,
}: ClerkUserAvatarProps) {
  const { resolvedIdentity, isLoading } = useResolvedIdentity(identity)
  const dimensionClass = AVATAR_SIZE_MAP[size]
  const initials = React.useMemo(() => buildInitials(resolvedIdentity), [resolvedIdentity])
  const displayName = React.useMemo(
    () => buildDisplayName(resolvedIdentity, initials),
    [resolvedIdentity, initials]
  )

  if (isLoading && !resolvedIdentity) {
    return <Skeleton className={cn("rounded-full", dimensionClass)} />
  }

  return (
    <Avatar
      className={cn("border border-border/60", dimensionClass, className)}
      aria-label={ariaLabel ?? `User avatar for ${displayName}`}
    >
      <AvatarImage src={resolvedIdentity?.imageUrl ?? undefined} alt={displayName} />
      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-600 text-white text-[10px] font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
