import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// PATCH /api/experience/[id] - Update experience status and grade
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    console.log(" PATCH /api/experience/[id] called")

    try {
        const { userId } = await auth()
        if (!userId) {
            console.log(" Unauthorized - no userId")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        console.log(" Experience ID:", id)

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })

        if (!user || user.role !== "COMPANY") {
            console.log(" Forbidden - user is not a company")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { status, grade } = body as { status: string; grade?: number }
        console.log(" Request body:", { status, grade })

        const experience = await prisma.experience.findUnique({
            where: { id },
        })

        if (!experience) {
            console.log(" Experience not found")
            return NextResponse.json({ error: "Experience not found" }, { status: 404 })
        }

        if (!user.companies.some((c: { id: string }) => c.id === experience.companyId)) {
    console.log(" Forbidden - not company's experience")
    return NextResponse.json({ error: "Not your company's experience" }, { status: 403 })
}


        if (status === "approved" && (grade === null || grade === undefined)) {
            console.log(" Bad request - grade required for approval")
            return NextResponse.json({ error: "Grade is required when approving" }, { status: 400 })
        }

        const updated = await prisma.experience.update({
            where: { id },
            data: {
                status,
                grade: status === "approved" ? grade : null,
            },
        })

        console.log(" Experience updated successfully:", updated.id)
        return NextResponse.json(updated)
    } catch (error) {
        console.error(" PATCH /experience/[id] error:", error)
        return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
    }
}
