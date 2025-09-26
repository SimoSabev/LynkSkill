// app/api/experience/recent-files/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { Experience } from "@prisma/client"

export async function GET() {
    try {
        const { userId } = await auth()
        console.log("recent-files userId", userId)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })
        console.log("recent-files user", user)
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        let experiences: Experience[] = []

        if (user.role === "STUDENT") {
            experiences = await prisma.experience.findMany({
                where: { studentId: user.id },
                orderBy: { createdAt: "desc" },
                take: 10,
            })
        } else if (user.role === "COMPANY") {
            experiences = await prisma.experience.findMany({
                where: { companyId: { in: user.companies.map((c) => c.id) } },
                orderBy: { createdAt: "desc" },
                take: 10,
            })
        }

        console.log("recent-files experiences", experiences.length)

        const files = experiences
            .flatMap((exp) =>
                exp.mediaUrls.map((url: string) => ({
                    url,
                    createdAt: exp.createdAt,
                }))
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4)

        console.log("recent-files returning", files.length)
        return NextResponse.json(files)
    } catch (err) {
        console.error("recent-files error", err)
        return NextResponse.json(
            { error: "Failed to load recent files", details: String(err) },
            { status: 500 }
        )
    }
}
