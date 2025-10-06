// /app/api/company/accept-policies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tosAccepted, privacyAccepted, companyId } = await req.json();
        if (!companyId || companyId === "null" || companyId === "undefined") {
            return NextResponse.json({ error: "Company ID required" }, { status: 400 });
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { owner: true },
        })
        if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

        if (company.owner.clerkId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const updated = await prisma.company.update({
            where: { id: companyId },
            data: {
                tosAccepted: Boolean(tosAccepted),
                privacyAccepted: Boolean(privacyAccepted),
            },
        });

        return NextResponse.json({ success: true, company: updated });
    } catch (err) {
        console.error("Error updating company policies:", err);
        return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }
}
