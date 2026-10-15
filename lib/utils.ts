import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Href for a user-supplied external link: http(s) only. A stored "javascript:" or
 * "data:" URL would run in the viewer's session when clicked; bare domains get https://.
 */
export function safeExternalUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const url = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
  return /^https?:\/\//i.test(url) ? url : undefined
}
