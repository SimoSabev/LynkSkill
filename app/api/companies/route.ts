import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const revalidate = 3600;

export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                logo: true,
                location: true,
            },
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(companies)
    } catch (err) {
        console.error("Error fetching companies:", err)
        return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
    }
}
