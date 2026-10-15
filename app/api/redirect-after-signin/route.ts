import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete as boolean | string | undefined
    const onboardingComplete = onboardingRaw === true || onboardingRaw === "true"
    const role = (sessionClaims?.metadata?.role || "").toString().toUpperCase()

    // If not onboarded → go to onboarding
    if (!onboardingComplete) {
        return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    // Otherwise → role-based dashboard
    if (role === "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard/student", req.url))
    }
    if (role === "COMPANY") {
        return NextResponse.redirect(new URL("/dashboard/company", req.url))
    }
    if (role === "TEAM_MEMBER") {
        return NextResponse.redirect(new URL("/dashboard/team-member", req.url))
    }

    // Fallback: unknown role -> let onboarding resolve it (there is no /dashboard page)
    return NextResponse.redirect(new URL("/onboarding", req.url))
}
