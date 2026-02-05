import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission } from "@prisma/client"

export const runtime = "nodejs"

/**
 * GET /api/company/code/history
 * Get history of users who joined via invitation code (owner/admin only)
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 })
    }

    // Check if user has permission to manage members (owner/admin)
    const canManage = await checkPermissionByClerkId(clerkId, companyId, Permission.MANAGE_MEMBERS)
    if (!canManage) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    const skip = (page - 1) * limit

    const [joins, total] = await Promise.all([
      prisma.companyCodeJoin.findMany({
        where: { companyId },
        include: {
          user: {
            include: {
              profile: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { joinedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.companyCodeJoin.count({
        where: { companyId }
      })
    ])

    const formattedJoins = joins.map(join => ({
      id: join.id,
      userId: join.userId,
      userName: join.user.profile?.name || join.user.email,
      userEmail: join.user.email,
      joinedAt: join.joinedAt,
      ipAddress: join.ipAddress,
    }))

    return NextResponse.json({
      history: formattedJoins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("Error fetching code join history:", error)
    return NextResponse.json({ error: "Failed to fetch join history" }, { status: 500 })
  }
}
