import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const aiProfile = await prisma.aIProfile.findUnique({
        where: { studentId: user.id },
        select: {
            autoApplyEnabled: true,
            autoApplyThreshold: true,
            autoApplyCount: true,
            lastAutoApplyAt: true,
        },
    })

    return NextResponse.json({
        enabled: aiProfile?.autoApplyEnabled ?? false,
        threshold: aiProfile?.autoApplyThreshold ?? 80,
        autoApplyCount: aiProfile?.autoApplyCount ?? 0,
        lastAutoApplyAt: aiProfile?.lastAutoApplyAt?.toISOString() ?? null,
    })
}
