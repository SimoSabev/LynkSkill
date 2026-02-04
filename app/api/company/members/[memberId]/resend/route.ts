import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkPermissionByClerkId } from "@/lib/permissions"
import { Permission } from "@prisma/client"
import crypto from "crypto"
import { sendInvitationEmail } from "@/lib/email"

export const runtime = "nodejs"

interface RouteParams {
  params: Promise<{ memberId: string }>
}

/**
 * POST /api/company/members/[memberId]/resend
 * Resend an invitation email
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user making the request
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: {
          include: {
            company: true,
          },
        },
        profile: true,
      },
    })

    if (!user || !user.companyMembership) {
      return NextResponse.json({ error: "Not a member of any company" }, { status: 404 })
    }

    const companyId = user.companyMembership.companyId

    // Check if user has permission to invite members
    const hasPermission = await checkPermissionByClerkId(clerkId, companyId, Permission.INVITE_MEMBERS)
    if (!hasPermission) {
      return NextResponse.json({ error: "You don't have permission to resend invitations" }, { status: 403 })
    }

    // Find the invitation by ID
    const invitation = await prisma.companyInvitation.findFirst({
      where: {
        id: memberId,
        companyId,
        acceptedAt: null, // Only pending invitations
      },
      include: {
        company: true,
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Generate new token and extend expiration
    const newToken = crypto.randomBytes(32).toString("hex")
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Update the invitation with new token and expiration
    await prisma.companyInvitation.update({
      where: { id: invitation.id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    })

    // Send the invitation email again
    const emailResult = await sendInvitationEmail({
      to: invitation.email,
      companyName: invitation.company.name,
      inviterName: user.profile?.name || user.email,
      role: invitation.role,
      token: newToken,
      expiresAt: newExpiresAt,
    })

    if (!emailResult.success) {
      console.error("Failed to resend invitation email:", emailResult.error)
    }

    // Also update notification if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: invitation.email },
    })

    if (existingUser) {
      // Create a new notification with updated link
      await prisma.notification.create({
        data: {
          userId: existingUser.id,
          type: "TEAM_INVITATION",
          title: "Company Team Invitation (Resent)",
          message: `Reminder: You've been invited to join ${invitation.company.name} as ${invitation.role}`,
          link: `/invitations?token=${newToken}`,
        },
      })
    }

    return NextResponse.json({
      message: "Invitation resent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: newExpiresAt,
      },
    })
  } catch (error) {
    console.error("Error resending invitation:", error)
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 })
  }
}
