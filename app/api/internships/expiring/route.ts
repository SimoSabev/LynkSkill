// app/api/internships/expiring/route.ts
//
// Returns internships that are expiring soon or recently expired
// for the authenticated company user's dashboard

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyByClerkId } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        const now = new Date()

        // Get internships expiring in the next 7 days
        const sevenDaysFromNow = new Date(now)
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        // Get internships that are already expired but still within grace period (7 days)
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const internships = await prisma.internship.findMany({
            where: {
                companyId: membership.companyId,
                applicationEnd: {
                    gte: sevenDaysAgo,     // Not older than 7 days expired
                    lte: sevenDaysFromNow, // Within next 7 days
                },
            },
            orderBy: { applicationEnd: "asc" },
            select: {
                id: true,
                title: true,
                description: true,
                location: true,
                paid: true,
                salary: true,
                applicationStart: true,
                applicationEnd: true,
                createdAt: true,
                skills: true,
                company: {
                    select: { name: true },
                },
                _count: {
                    select: { applications: true },
                },
            },
        })

        // Categorize internships
        const expiringSoon = internships.filter((i) => {
            const endDate = new Date(i.applicationEnd)
            return endDate > now
        })

        const expired = internships.filter((i) => {
            const endDate = new Date(i.applicationEnd)
            return endDate <= now
        })

        return NextResponse.json({
            expiringSoon,
            expired,
            totalExpiring: expiringSoon.length,
            totalExpired: expired.length,
        })
    } catch (error) {
        console.error("Error fetching expiring internships:", error)
        return NextResponse.json(
            { error: "Failed to fetch expiring internships" },
            { status: 500 }
        )
    }
}
