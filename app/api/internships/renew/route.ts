// app/api/internships/renew/route.ts
//
// Renews an expired or expiring internship by extending its applicationEnd date.
// Requires EDIT_INTERNSHIPS permission.

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Permission } from "@prisma/client"
import { getUserCompanyByClerkId, checkPermission } from "@/lib/permissions"
import { notifyInternshipRenewed } from "@/lib/notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        // Check EDIT_INTERNSHIPS permission
        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.EDIT_INTERNSHIPS
        )
        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to renew internships" },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { internshipId, newEndDate, extensionDays } = body

        if (!internshipId) {
            return NextResponse.json(
                { error: "Internship ID is required" },
                { status: 400 }
            )
        }

        // Verify the internship belongs to the company
        const internship = await prisma.internship.findFirst({
            where: {
                id: internshipId,
                companyId: membership.companyId,
            },
            include: {
                company: {
                    select: { name: true },
                },
            },
        })

        if (!internship) {
            return NextResponse.json(
                { error: "Internship not found or doesn't belong to your company" },
                { status: 404 }
            )
        }

        // Calculate new end date
        let calculatedEndDate: Date

        if (newEndDate) {
            // Specific date provided
            calculatedEndDate = new Date(newEndDate)
            if (isNaN(calculatedEndDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid date format" },
                    { status: 400 }
                )
            }
        } else if (extensionDays && typeof extensionDays === "number" && extensionDays > 0) {
            // Extension by days from now
            calculatedEndDate = new Date()
            calculatedEndDate.setDate(calculatedEndDate.getDate() + extensionDays)
        } else {
            // Default: extend by 30 days from now
            calculatedEndDate = new Date()
            calculatedEndDate.setDate(calculatedEndDate.getDate() + 30)
        }

        // Ensure the new end date is in the future
        if (calculatedEndDate <= new Date()) {
            return NextResponse.json(
                { error: "New end date must be in the future" },
                { status: 400 }
            )
        }

        // Update the internship
        const updated = await prisma.internship.update({
            where: { id: internshipId },
            data: {
                applicationEnd: calculatedEndDate,
            },
        })

        // Send renewal notification to the user who renewed it
        await notifyInternshipRenewed(
            membership.userId,
            internship.title,
            internship.company.name,
            calculatedEndDate,
            internship.id
        )

        return NextResponse.json({
            success: true,
            internship: updated,
            newEndDate: calculatedEndDate.toISOString(),
        })
    } catch (error) {
        console.error("Error renewing internship:", error)
        return NextResponse.json(
            { error: "Failed to renew internship" },
            { status: 500 }
        )
    }
}
