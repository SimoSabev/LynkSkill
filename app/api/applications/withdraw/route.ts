// app/api/applications/withdraw/route.ts
import { NextResponse } from "next/server"
import { requireDbUser } from "@/lib/api-guards"
import { withdrawApplication } from "@/lib/services/applications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/applications/withdraw - Withdraw a pending application
export async function POST(req: Request) {
    try {
        const guard = await requireDbUser("STUDENT")
        if (!guard.ok) return guard.response

        const { applicationId } = await req.json().catch(() => ({}))
        if (!applicationId || typeof applicationId !== "string") {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 })
        }

        const result = await withdrawApplication(guard.user.id, applicationId)
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status })
        }

        return NextResponse.json({
            success: true,
            message: `Application to "${result.data.title}" has been withdrawn`
        })
    } catch (error) {
        console.error("POST /api/applications/withdraw error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
