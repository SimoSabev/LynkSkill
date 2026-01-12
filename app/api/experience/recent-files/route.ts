import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const revalidate = 60;

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const experiences = await prisma.experience.findMany({
            where: user.role === "STUDENT" ? { studentId: user.id } : { companyId: { in: user.companies.map((c) => c.id) } },
            orderBy: { createdAt: "desc" },
            take: 4, // Take only 4 most recent experiences
        })

        const groupedExperiences = experiences.map((exp) => ({
            id: exp.id,
            files: exp.mediaUrls.map((url) => ({ url })),
            createdAt: exp.createdAt,
            uploader: {
                name: exp.uploaderName || "Unknown Student",
                image: exp.uploaderImage,
            },
            isBulk: exp.mediaUrls.length > 1, // Flag for bulk uploads
        }))

        return NextResponse.json(groupedExperiences)
    } catch (err) {
        console.error("recent-files error", err)
        return NextResponse.json({ error: "Failed to load recent files", details: String(err) }, { status: 500 })
    }
}
