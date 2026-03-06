import { prisma } from "@/lib/prisma"
import { DefaultCompanyRole, Permission } from "@prisma/client"
import {
  getUserCompany,
  getMemberPermissions,
  type CompanyMemberWithPermissions,
} from "@/lib/permissions"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EnhancedUserContext {
  /** Clerk authentication ID */
  clerkId: string
  /** Internal database user ID */
  userId: string

  /** User's platform role */
  role: "STUDENT" | "COMPANY" | "TEAM_MEMBER"

  /** Company ID if user is a member of a company */
  companyId?: string
  /** Default company role (OWNER, ADMIN, HR_MANAGER, etc.) */
  companyRole?: DefaultCompanyRole
  /** Custom role name if assigned */
  customRoleName?: string

  /** Resolved permissions array (union of default role + custom role + extra) */
  permissions: Permission[]

  /** Whether the user has an active company membership */
  hasCompanyMembership: boolean
  /** Whether the user is the company owner */
  isCompanyOwner: boolean
}

export type ContextError =
  | "USER_NOT_FOUND"
  | "MEMBERSHIP_NOT_FOUND"
  | "PERMISSIONS_NOT_LOADED"

export type ContextResolutionResult =
  | { success: true; context: EnhancedUserContext }
  | { success: false; error: ContextError; message: string }

/**
 * Simplified context object suitable for passing to tool functions.
 */
export interface PartialToolContext {
  userId: string
  companyId: string | null
  permissions: Permission[]
  role: "STUDENT" | "COMPANY" | "TEAM_MEMBER"
  isCompanyOwner: boolean
}

// ─── Main Resolution Function ───────────────────────────────────────────────

/**
 * Resolves a fully-populated EnhancedUserContext from a Clerk ID.
 *
 * 1. Looks up the user in the database
 * 2. Determines role (STUDENT / COMPANY / TEAM_MEMBER)
 * 3. For company-related roles, fetches membership & permissions
 * 4. Returns a discriminated union result
 */
export async function resolveEnhancedUserContext(
  clerkId: string
): Promise<ContextResolutionResult> {
  // Step 1: Find user in database
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })

  if (!user) {
    return {
      success: false,
      error: "USER_NOT_FOUND",
      message: `No user found for Clerk ID: ${clerkId}`,
    }
  }

  const role = user.role as "STUDENT" | "COMPANY" | "TEAM_MEMBER"

  // Step 2: For students, return a simple context (no company data)
  if (role === "STUDENT") {
    return {
      success: true,
      context: {
        clerkId,
        userId: user.id,
        role,
        permissions: [],
        hasCompanyMembership: false,
        isCompanyOwner: false,
      },
    }
  }

  // Step 3: For COMPANY or TEAM_MEMBER, resolve company membership
  // getUserCompany returns a CompanyMember with company & customRole includes
  let membership: Awaited<ReturnType<typeof getUserCompany>> = null

  try {
    membership = await getUserCompany(user.id)
  } catch {
    // getUserCompany may throw on DB errors
  }

  if (!membership) {
    return {
      success: false,
      error: "MEMBERSHIP_NOT_FOUND",
      message: `User ${user.id} has role ${role} but no active company membership was found`,
    }
  }

  // Step 4: Resolve permissions
  let permissions: Permission[]
  try {
    permissions = getMemberPermissions(membership as CompanyMemberWithPermissions)
  } catch {
    return {
      success: false,
      error: "PERMISSIONS_NOT_LOADED",
      message: `Failed to load permissions for user ${user.id} in company ${membership.companyId}`,
    }
  }

  const ownerFlag = membership.defaultRole === DefaultCompanyRole.OWNER

  return {
    success: true,
    context: {
      clerkId,
      userId: user.id,
      role,
      companyId: membership.companyId,
      companyRole: membership.defaultRole ?? undefined,
      customRoleName: membership.customRole?.name ?? undefined,
      permissions,
      hasCompanyMembership: true,
      isCompanyOwner: ownerFlag,
    },
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Check if the context includes a specific permission.
 */
export function hasPermission(
  ctx: EnhancedUserContext,
  permission: Permission | string
): boolean {
  return ctx.permissions.includes(permission as Permission)
}

/**
 * Check if the context includes **any** of the given permissions.
 */
export function hasAnyPermission(
  ctx: EnhancedUserContext,
  permissions: (Permission | string)[]
): boolean {
  return permissions.some((p) => ctx.permissions.includes(p as Permission))
}

/**
 * Check if the context includes **all** of the given permissions.
 */
export function hasAllPermissions(
  ctx: EnhancedUserContext,
  permissions: (Permission | string)[]
): boolean {
  return permissions.every((p) => ctx.permissions.includes(p as Permission))
}

/**
 * Returns true if the user is a student.
 */
export function isStudent(ctx: EnhancedUserContext): boolean {
  return ctx.role === "STUDENT"
}

/**
 * Returns true if the user is a company owner or team member (i.e. not a student).
 */
export function isCompanyUser(ctx: EnhancedUserContext): boolean {
  return ctx.role === "COMPANY" || ctx.role === "TEAM_MEMBER"
}

/**
 * Returns true if the user can access a specific company.
 * A user can access a company if they are a member of that company.
 */
export function canAccessCompany(
  ctx: EnhancedUserContext,
  companyId: string
): boolean {
  return ctx.hasCompanyMembership && ctx.companyId === companyId
}

// ─── Tool Context Adapter ───────────────────────────────────────────────────

/**
 * Extracts a simplified context object suitable for passing to tool functions.
 * This avoids leaking the full EnhancedUserContext into tool implementations.
 */
export function getContextForTools(ctx: EnhancedUserContext): PartialToolContext {
  return {
    userId: ctx.userId,
    companyId: ctx.companyId ?? null,
    permissions: ctx.permissions,
    role: ctx.role,
    isCompanyOwner: ctx.isCompanyOwner,
  }
}
