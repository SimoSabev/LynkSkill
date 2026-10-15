// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server"
import { requireDbUser } from "@/lib/api-guards"
import { setApplicationStatus } from "@/lib/services/applications"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireDbUser("COMPANY")
        if (!guard.ok) return guard.response

        const { id } = await params
        const { status } = await req.json().catch(() => ({}))

        if (status !== "APPROVED" && status !== "REJECTED") {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        const result = await setApplicationStatus(guard.user.id, id, status)
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status })
        }

        return NextResponse.json(result.data)
    } catch (error) {
        console.error("Error updating application:", error)
        return NextResponse.json(
            { error: "Failed to update application" },
            { status: 500 }
        )
    }
}
