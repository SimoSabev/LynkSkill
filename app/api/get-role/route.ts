// /api/get-role/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const { clerkId } = await req.json();

    if (!clerkId) return NextResponse.json({ role: null });

    const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { role: true },
    });

    return NextResponse.json({ role: user?.role || null });
}
