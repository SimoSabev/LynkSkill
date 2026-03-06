"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ClerkIconProps extends React.SVGAttributes<SVGSVGElement> {
  className?: string
  size?: number
  title?: string
}

/**
 * Clerk logo icon component rendered from SVG
 */
export function ClerkIcon({ className, size = 16, title = "Clerk", ...props }: ClerkIconProps) {
  const ariaHidden = props["aria-label"] ? undefined : true

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
      role={ariaHidden ? undefined : "img"}
      aria-hidden={ariaHidden}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 28C9.373 28 4 22.627 4 16S9.373 4 16 4s12 5.373 12 12-5.373 12-12 12z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M16 8c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  )
}

/**
 * Clerk badge with icon and text
 * Used to indicate Clerk-powered authentication
 */
export function ClerkBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
        "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
        className
      )}
    >
      <ClerkIcon size={10} title="Clerk" aria-hidden />
      <span>Secured by Clerk</span>
    </span>
  )
}
