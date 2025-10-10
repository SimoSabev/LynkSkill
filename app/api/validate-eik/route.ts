import { NextResponse } from "next/server"
import { validateEIK } from "@/lib/validateEIK"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const eik = searchParams.get("eik")

        if (!eik) {
            return NextResponse.json({ valid: false, error: "Missing EIK" }, { status: 400 })
        }

        if (!/^\d{9,13}$/.test(eik)) {
            return NextResponse.json({ valid: false, eik, error: "Invalid EIK format" }, { status: 200 })
        }

        const isValid = Boolean(validateEIK(eik))

        return NextResponse.json(
            {
                valid: isValid,
                eik,
                companyName: isValid ? "Company exists (simulated)" : null,
            },
            { status: 200 },
        )
    } catch (error) {
        console.error("❌ validate-eik API error:", error)
        return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 })
    }
}
