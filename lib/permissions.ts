import { prisma } from "@/lib/prisma"
import { DefaultCompanyRole, Permission, MemberStatus } from "@prisma/client"
import { DEFAULT_ROLE_PERMISSIONS } from "./role-permissions"

export interface CompanyMemberWithPermissions {
  id: string
  userId: string
  companyId: string
  defaultRole: DefaultCompanyRole | null
  customRoleId: string | null
  extraPermissions: Permission[]
  status: MemberStatus
  customRole: {
    id: string
    name: string
    permissions: Permission[]
    color: string | null
  } | null
}

/**
 * Get a user's membership in a company
 */
export async function getCompanyMembership(
  userId: string,
  companyId: string
): Promise<CompanyMemberWithPermissions | null> {
  const member = await prisma.companyMember.findFirst({
    where: {
      userId,
      companyId,
      status: MemberStatus.ACTIVE,
    },
    include: {
      customRole: {
        select: {
          id: true,
          name: true,
          permissions: true,
          color: true,
        },
      },
    },
  })

  return member
}

/**
 * Get a user's membership by their Clerk ID
 */
export async function getCompanyMembershipByClerkId(
  clerkId: string,
  companyId: string
): Promise<CompanyMemberWithPermissions | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })

  if (!user) return null

  return getCompanyMembership(user.id, companyId)
}

/**
 * Get all permissions for a company member
 * Combines default role permissions, custom role permissions, and extra permissions
 */
export function getMemberPermissions(member: CompanyMemberWithPermissions): Permission[] {
  const permissions = new Set<Permission>()

  // Add default role permissions
  if (member.defaultRole) {
    for (const perm of DEFAULT_ROLE_PERMISSIONS[member.defaultRole]) {
      permissions.add(perm)
    }
  }

  // Add custom role permissions
  if (member.customRole) {
    for (const perm of member.customRole.permissions) {
      permissions.add(perm)
    }
  }

  // Add extra permissions granted by owner/admin
  for (const perm of member.extraPermissions) {
    permissions.add(perm)
  }

  return Array.from(permissions)
}

/**
 * Check if a member has a specific permission
 */
export function memberHasPermission(
  member: CompanyMemberWithPermissions,
  permission: Permission
): boolean {
  const permissions = getMemberPermissions(member)
  return permissions.includes(permission)
}

/**
 * Check if a user has a specific permission in a company
 * This is the main function to use for permission checks
 */
export async function checkPermission(
  userId: string,
  companyId: string,
  permission: Permission
): Promise<boolean> {
  const member = await getCompanyMembership(userId, companyId)
  if (!member) return false
  return memberHasPermission(member, permission)
}

/**
 * Check if a user has a specific permission by Clerk ID
 */
export async function checkPermissionByClerkId(
  clerkId: string,
  companyId: string,
  permission: Permission
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })

  if (!user) return false

  return checkPermission(user.id, companyId, permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export async function checkAnyPermission(
  userId: string,
  companyId: string,
  permissions: Permission[]
): Promise<boolean> {
  const member = await getCompanyMembership(userId, companyId)
  if (!member) return false
  
  const memberPerms = getMemberPermissions(member)
  return permissions.some(p => memberPerms.includes(p))
}

/**
 * Check if a user has all of the specified permissions
 */
export async function checkAllPermissions(
  userId: string,
  companyId: string,
  permissions: Permission[]
): Promise<boolean> {
  const member = await getCompanyMembership(userId, companyId)
  if (!member) return false
  
  const memberPerms = getMemberPermissions(member)
  return permissions.every(p => memberPerms.includes(p))
}

/**
 * Check if a user is the owner of a company
 */
export async function isCompanyOwner(
  userId: string,
  companyId: string
): Promise<boolean> {
  const member = await getCompanyMembership(userId, companyId)
  return member?.defaultRole === DefaultCompanyRole.OWNER
}

/**
 * Check if a user is an admin or owner of a company
 */
export async function isCompanyAdminOrOwner(
  userId: string,
  companyId: string
): Promise<boolean> {
  const member = await getCompanyMembership(userId, companyId)
  return (
    member?.defaultRole === DefaultCompanyRole.OWNER ||
    member?.defaultRole === DefaultCompanyRole.ADMIN
  )
}

/**
 * Get a user's company (if they are a member of one)
 * Also handles migration for existing company owners without membership records
 */
export async function getUserCompany(userId: string) {
  // First check if user has a membership
  let membership = await prisma.companyMember.findFirst({
    where: { userId },
    include: {
      company: true,
      customRole: true,
    },
  })

  // If no membership, check if user owns a company and create membership
  if (!membership) {
    const ownedCompany = await prisma.company.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    })

    if (ownedCompany) {
      // Create owner membership for existing company
      membership = await prisma.companyMember.create({
        data: {
          userId,
          companyId: ownedCompany.id,
          defaultRole: DefaultCompanyRole.OWNER,
          status: MemberStatus.ACTIVE,
          joinedAt: new Date(),
        },
        include: {
          company: true,
          customRole: true,
        },
      })
    }
  }

  return membership
}

/**
 * Get a user's company by Clerk ID
 */
export async function getUserCompanyByClerkId(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })

  if (!user) return null

  return getUserCompany(user.id)
}

/**
 * Require a specific permission - throws if not authorized
 */
export async function requirePermission(
  userId: string,
  companyId: string,
  permission: Permission
): Promise<void> {
  const hasPermission = await checkPermission(userId, companyId, permission)
  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

/**
 * Permission check result with details
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  member?: CompanyMemberWithPermissions
}

/**
 * Check permission with detailed result
 */
export async function checkPermissionDetailed(
  userId: string,
  companyId: string,
  permission: Permission
): Promise<PermissionCheckResult> {
  const member = await getCompanyMembership(userId, companyId)
  
  if (!member) {
    return {
      allowed: false,
      reason: "User is not a member of this company",
    }
  }

  if (member.status !== MemberStatus.ACTIVE) {
    return {
      allowed: false,
      reason: `Member status is ${member.status}`,
      member,
    }
  }

  const hasPermission = memberHasPermission(member, permission)
  
  if (!hasPermission) {
    return {
      allowed: false,
      reason: `Role does not have permission: ${permission}`,
      member,
    }
  }

  return {
    allowed: true,
    member,
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(
  member: CompanyMemberWithPermissions
): string {
  if (member.customRole) {
    return member.customRole.name
  }
  
  if (member.defaultRole) {
    const roleNames: Record<DefaultCompanyRole, string> = {
      OWNER: "Owner",
      ADMIN: "Admin",
      HR_MANAGER: "HR Manager",
      HR_RECRUITER: "HR Recruiter",
      VIEWER: "Viewer",
      MEMBER: "Team Member",
    }
    return roleNames[member.defaultRole]
  }

  return "Unknown"
}
