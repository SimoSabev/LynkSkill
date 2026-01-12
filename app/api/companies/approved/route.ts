import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const revalidate = 3600;

// GET /api/companies/approved - Returns only companies where student has APPROVED applications
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.user.findUnique({
            where: { clerkId: userId },
        })

        if (!student || student.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can access this endpoint" }, { status: 403 })
        }

        // Find all APPROVED applications for this student
        const approvedApplications = await prisma.application.findMany({
            where: {
                studentId: student.id,
                status: "APPROVED",
            },
            include: {
                internship: {
                    include: {
                        company: true,
                    },
                },
            },
        })

        // Extract unique companies from approved applications
        // Extract unique companies from approved applications
        const companiesMap = new Map<string, { id: string; name: string; logo: string | null }>()

        approvedApplications.forEach((app: typeof approvedApplications[0]) => {
            if (app.internship?.company) {
                const company = app.internship.company
                if (!companiesMap.has(company.id)) {
                    companiesMap.set(company.id, {
                        id: company.id,
                        name: company.name,
                        logo: company.logo,
                    })
                }
            }
        })


        const companies = Array.from(companiesMap.values())

        return NextResponse.json(companies)
    } catch (err) {
        console.error("GET /api/companies/approved error:", err)
        return NextResponse.json({ error: "Failed to fetch approved companies", details: String(err) }, { status: 500 })
    }
}
