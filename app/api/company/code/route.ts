import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission } from "@prisma/client"
import { generateCompanyCode, maskCode, isCodeExpired, getTimeUntilExpiry } from "@/lib/company-code"

export const runtime = "nodejs"

/**
 * GET /api/company/code
 * Get company invitation code (owner/admin only)
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    // Check if user has permission to manage members (owner/admin)
    const canManage = await checkPermissionByClerkId(clerkId, companyId, Permission.MANAGE_MEMBERS)
    if (!canManage) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        invitationCode: true,
        codeEnabled: true,
        codeExpiresAt: true,
        maxTeamMembers: true,
        codeUsageCount: true,
        lastCodeRegenAt: true,
        _count: {
          select: { members: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    if (!company.invitationCode) {
      return NextResponse.json({ error: "No invitation code generated" }, { status: 404 })
    }

    return NextResponse.json({
      code: company.invitationCode,
      maskedCode: maskCode(company.invitationCode),
      enabled: company.codeEnabled,
      expiresAt: company.codeExpiresAt,
      isExpired: isCodeExpired(company.codeExpiresAt),
      timeUntilExpiry: getTimeUntilExpiry(company.codeExpiresAt),
      maxTeamMembers: company.maxTeamMembers,
      currentMembers: company._count.members,
      usageCount: company.codeUsageCount,
      lastRegenAt: company.lastCodeRegenAt,
    })
  } catch (error) {
    console.error("Error fetching company code:", error)
    return NextResponse.json({ error: "Failed to fetch company code" }, { status: 500 })
  }
}

/**
 * POST /api/company/code
 * Regenerate company invitation code (owner/admin only)
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { companyId } = body

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    // Check if user has permission to manage members (owner/admin)
    const canManage = await checkPermissionByClerkId(clerkId, companyId, Permission.MANAGE_MEMBERS)
    if (!canManage) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Check cooldown (5 minutes between regenerations)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { lastCodeRegenAt: true }
    })

    if (company?.lastCodeRegenAt) {
      const cooldownMs = 5 * 60 * 1000 // 5 minutes
      const timeSinceRegen = Date.now() - new Date(company.lastCodeRegenAt).getTime()
      if (timeSinceRegen < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceRegen) / 1000)
        return NextResponse.json({ 
          error: `Please wait ${remainingSeconds} seconds before regenerating the code` 
        }, { status: 429 })
      }
    }

    // Generate new code
    const newCode = generateCompanyCode()

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        invitationCode: newCode,
        lastCodeRegenAt: new Date(),
        codeUsageCount: 0, // Reset usage count
      },
      select: {
        invitationCode: true,
        codeEnabled: true,
      }
    })

    return NextResponse.json({
      code: newCode,
      maskedCode: maskCode(newCode),
      message: "Invitation code regenerated successfully",
    })
  } catch (error) {
    console.error("Error regenerating company code:", error)
    return NextResponse.json({ error: "Failed to regenerate company code" }, { status: 500 })
  }
}

/**
 * PATCH /api/company/code
 * Update code settings (enable/disable, expiration, max members)
 */
export async function PATCH(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, enabled, expiresAt, maxTeamMembers } = body

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    // Check if user has permission to manage members (owner/admin)
    const canManage = await checkPermissionByClerkId(clerkId, companyId, Permission.MANAGE_MEMBERS)
    if (!canManage) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const updateData: {
      codeEnabled?: boolean
      codeExpiresAt?: Date | null
      maxTeamMembers?: number | null
    } = {}

    if (typeof enabled === "boolean") {
      updateData.codeEnabled = enabled
    }

    if (expiresAt !== undefined) {
      updateData.codeExpiresAt = expiresAt ? new Date(expiresAt) : null
    }

    if (maxTeamMembers !== undefined) {
      updateData.maxTeamMembers = maxTeamMembers
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      select: {
        invitationCode: true,
        codeEnabled: true,
        codeExpiresAt: true,
        maxTeamMembers: true,
      }
    })

    return NextResponse.json({
      enabled: updatedCompany.codeEnabled,
      expiresAt: updatedCompany.codeExpiresAt,
      maxTeamMembers: updatedCompany.maxTeamMembers,
      message: "Code settings updated successfully",
    })
  } catch (error) {
    console.error("Error updating company code settings:", error)
    return NextResponse.json({ error: "Failed to update code settings" }, { status: 500 })
  }
}
