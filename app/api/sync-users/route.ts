import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const { userId, sessionClaims } = await req.json();

    if (!userId) {
        return NextResponse.json({ ok: false, reason: "No Clerk user" }, { status: 401 });
    }

    // Check if user exists in Supabase (via Prisma)
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                clerkId: userId,
                email: sessionClaims?.email || "",
                role: (sessionClaims?.metadata?.role || "STUDENT").toString().toUpperCase(),
                onboardingComplete:
                    sessionClaims?.metadata?.onboardingComplete === true ||
                    sessionClaims?.metadata?.onboardingComplete === "true",
            },
        });
    }

    return NextResponse.json({ ok: true, user });
}
