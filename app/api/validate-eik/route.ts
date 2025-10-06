// /app/api/validate-eik/route.ts
import { NextResponse } from "next/server";
import { validateEIK } from "@/lib/validateEIK";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const eik = searchParams.get("eik");

    if (!eik) {
        return NextResponse.json({ error: "Missing EIK" }, { status: 400 });
    }

    // Проверяваме дали съдържа само цифри и е дълго 9 или 13
    if (!/^\d{9,13}$/.test(eik)) {
        return NextResponse.json({ valid: false, eik, error: "Invalid EIK format" });
    }

    const isValid = validateEIK(eik);

    return NextResponse.json({
        valid: isValid,
        eik,
        companyName: isValid ? "Company exists (simulated)" : null, // няма реално име без външен източник
    });
}
