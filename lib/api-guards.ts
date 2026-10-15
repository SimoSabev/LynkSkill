// lib/api-guards.ts
// Shared authorization helpers for route handlers.
// Every handler must derive identity from the Clerk session (auth()),
// never from request bodies, query params or custom headers.
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"

export type GuardFailure = { ok: false; response: NextResponse }

/**
 * Resolves the signed-in user from the DB (with owned companies).
 * Optionally enforces a role.
 */
export async function requireDbUser(role?: "STUDENT" | "COMPANY") {
    const { userId } = await auth()
    if (!userId) {
        return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as GuardFailure
    }

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { companies: { select: { id: true, name: true } } },
    })

    if (!user) {
        return { ok: false, response: NextResponse.json({ error: "User not found" }, { status: 404 }) } as GuardFailure
    }

    if (role && user.role !== role) {
        return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as GuardFailure
    }

    return { ok: true as const, user }
}

/**
 * Verifies a cron/maintenance request.
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically.
 * Fails closed when CRON_SECRET is not configured.
 */
export function isAuthorizedCron(req: Request): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false

    const header = req.headers.get("authorization") ?? ""
    const expected = `Bearer ${secret}`
    const a = new TextEncoder().encode(header)
    const b = new TextEncoder().encode(expected)
    return a.length === b.length && timingSafeEqual(a, b)
}
