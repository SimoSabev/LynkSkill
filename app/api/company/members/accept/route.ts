import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { MemberStatus } from "@prisma/client"
import { clerkClient } from "@/lib/clerk"

export const runtime = "nodejs"

/**
 * POST /api/company/members/accept
 * Accept a company invitation (in-app)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Invitation token is required" }, { status: 400 })
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
        error: "You are already a member of a company. Leave your current company first." 
      }, { status: 400 })
    }

    // Find the invitation
    const invitation = await prisma.companyInvitation.findUnique({
      where: { token },
      include: {
        company: true,
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

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Check if invitation has already been accepted
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation has already been accepted" }, { status: 400 })
    }

    // Check if the invitation email matches the user's email
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ 
        error: "This invitation was sent to a different email address" 
      }, { status: 403 })
    }

    // Create the company membership
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
          customRole: true,
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
        role: membership.defaultRole || membership.customRole?.name,
      },
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
