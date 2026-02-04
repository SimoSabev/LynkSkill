import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getMemberPermissions } from "@/lib/permissions"
import { MemberStatus } from "@prisma/client"

export const runtime = "nodejs"

/**
 * GET /api/company/me/permissions
 * Get the current user's membership details and permissions
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's company membership
    const membership = await prisma.companyMember.findFirst({
      where: {
        userId: user.id,
        status: MemberStatus.ACTIVE,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
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

    if (!membership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    // Calculate all permissions
    const permissions = getMemberPermissions(membership)

    return NextResponse.json({
      membership: {
        id: membership.id,
        companyId: membership.companyId,
        defaultRole: membership.defaultRole,
        customRole: membership.customRole,
        extraPermissions: membership.extraPermissions,
        joinedAt: membership.joinedAt,
      },
      company: membership.company,
      permissions,
      isOwner: membership.defaultRole === "OWNER",
      isAdmin: membership.defaultRole === "ADMIN" || membership.defaultRole === "OWNER",
    })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
