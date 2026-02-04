import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { MemberStatus } from "@prisma/client"
import { clerkClient } from "@/lib/clerk"

export const runtime = "nodejs"

interface RouteParams {
  params: Promise<{ token: string }>
}

/**
 * GET /api/company/invitations/[token]
 * Verify an invitation token (for email link verification)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params

    const invitation = await prisma.companyInvitation.findUnique({
      where: { token },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
            description: true,
          },
        },
        invitedBy: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation has already been accepted" }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        company: invitation.company,
        invitedBy: {
          name: invitation.invitedBy.profile?.name || invitation.invitedBy.email,
        },
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error verifying invitation:", error)
    return NextResponse.json({ error: "Failed to verify invitation" }, { status: 500 })
  }
}

/**
 * POST /api/company/invitations/[token]
 * Accept an invitation via email link
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: true,
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member of a company
    if (user.companyMembership) {
      return NextResponse.json({ 
        error: "You are already a member of a company" 
      }, { status: 400 })
    }

    // Find the invitation
    const invitation = await prisma.companyInvitation.findUnique({
      where: { token },
      include: {
        company: true,
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation has already been accepted" }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Verify the email matches
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ 
        error: "This invitation was sent to a different email address" 
      }, { status: 403 })
    }

    // Accept the invitation
    const membership = await prisma.$transaction(async (tx) => {
      // Mark invitation as accepted
      await tx.companyInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      })

      // Create the membership
      const member = await tx.companyMember.create({
        data: {
          companyId: invitation.companyId,
          userId: user.id,
          defaultRole: invitation.customRoleId ? null : invitation.role,
          customRoleId: invitation.customRoleId,
          invitedByEmail: invitation.email,
          invitedById: invitation.invitedById,
          status: MemberStatus.ACTIVE,
          joinedAt: new Date(),
        },
        include: {
          company: true,
        },
      })

      // Update user role to COMPANY if not already
      if (user.role !== "COMPANY") {
        await tx.user.update({
          where: { id: user.id },
          data: { role: "COMPANY" },
        })
      }

      return member
    })

    // Update Clerk user metadata to reflect the new role
    // This is done outside the transaction since it's an external service
    if (user.role !== "COMPANY") {
      try {
        await clerkClient.users.updateUser(clerkId, {
          publicMetadata: { role: "COMPANY", onboardingComplete: true },
        })
      } catch (clerkError) {
        console.error("Failed to update Clerk metadata:", clerkError)
        // Don't fail the request, the database role is updated
      }
    }

    // Notify the inviter
    await prisma.notification.create({
      data: {
        userId: invitation.invitedById,
        type: "TEAM_INVITATION_ACCEPTED",
        title: "Invitation Accepted",
        message: `${user.profile?.name || user.email} has joined your team`,
        link: "/dashboard/company/team",
      },
    })

    return NextResponse.json({
      message: "Successfully joined the company",
      membership: {
        companyId: membership.companyId,
        companyName: membership.company.name,
        role: membership.defaultRole,
      },
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}

/**
 * DELETE /api/company/invitations/[token]
 * Decline an invitation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the invitation
    const invitation = await prisma.companyInvitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Verify the email matches
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ 
        error: "This invitation was sent to a different email address" 
      }, { status: 403 })
    }

    // Delete the invitation
    await prisma.companyInvitation.delete({
      where: { id: invitation.id },
    })

    return NextResponse.json({
      message: "Invitation declined",
    })
  } catch (error) {
    console.error("Error declining invitation:", error)
    return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 })
  }
}
