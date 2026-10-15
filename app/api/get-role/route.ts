// /app/api/get-role/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Returns the role/onboarding state of the *signed-in* user.
// Any clerkId in the request body is ignored - identity comes from the session only.
export async function POST() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ role: null, onboardingComplete: false }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true, onboardingComplete: true },
    })

    return NextResponse.json({
        role: user?.role ?? null,
        onboardingComplete: user?.onboardingComplete ?? false,
    })
}
