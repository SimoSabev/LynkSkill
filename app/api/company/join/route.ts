import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { normalizeCode, isValidCodeFormat, isCodeExpired } from "@/lib/company-code"

export const runtime = "nodejs"

/**
 * POST /api/company/join
 * Validate invitation code and return company info for preview
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: "Invitation code required" }, { status: 400 })
    }

    // Validate code format
    if (!isValidCodeFormat(code)) {
      return NextResponse.json({ 
        error: "Invalid code format. Expected: XXXX-XXXX-XXXX-XXXX",
        valid: false 
      }, { status: 400 })
    }

    const normalizedCode = normalizeCode(code)

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        companyMembership: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is a STUDENT - they cannot join companies
    if (user.role === "STUDENT") {
      return NextResponse.json({ 
        error: "Students cannot join companies. Please create a new account if you want to work for a company.",
        valid: false 
      }, { status: 403 })
    }

    // Check if user is a COMPANY owner - they cannot join other companies
    if (user.role === "COMPANY") {
      return NextResponse.json({ 
        error: "Company owners cannot join other companies.",
        valid: false 
      }, { status: 403 })
    }

    // Check if user is already a member of any company
    if (user.companyMembership) {
      return NextResponse.json({ 
        error: "You are already a member of a company. You cannot join another.",
        valid: false 
      }, { status: 403 })
    }

    // Find company by invitation code
    const company = await prisma.company.findFirst({
      where: { invitationCode: normalizedCode },
      select: {
        id: true,
        name: true,
        logo: true,
        location: true,
        description: true,
        codeEnabled: true,
        codeExpiresAt: true,
        maxTeamMembers: true,
        _count: {
          select: { members: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ 
        error: "Invalid invitation code. Please check and try again.",
        valid: false 
      }, { status: 404 })
    }

    // Check if code is enabled
    if (!company.codeEnabled) {
      return NextResponse.json({ 
        error: "This invitation code has been disabled by the company.",
        valid: false 
      }, { status: 403 })
    }

    // Check if code has expired
    if (isCodeExpired(company.codeExpiresAt)) {
      return NextResponse.json({ 
        error: "This invitation code has expired.",
        valid: false 
      }, { status: 403 })
    }

    // Check max team members limit
    if (company.maxTeamMembers && company._count.members >= company.maxTeamMembers) {
      return NextResponse.json({ 
        error: "This company has reached its maximum team size.",
        valid: false 
      }, { status: 403 })
    }

    // Return company preview info
    return NextResponse.json({
      valid: true,
      company: {
        id: company.id,
        name: company.name,
        logo: company.logo,
        location: company.location,
        description: company.description?.substring(0, 200) + (company.description && company.description.length > 200 ? "..." : ""),
        memberCount: company._count.members,
      }
    })
  } catch (error) {
    console.error("Error validating invitation code:", error)
    return NextResponse.json({ error: "Failed to validate invitation code" }, { status: 500 })
  }
}
