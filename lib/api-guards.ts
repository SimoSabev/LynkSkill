// lib/api-guards.ts
// Shared authorization helpers for route handlers.
// Identity always comes from the Clerk session (auth()) and the role from the DB —
// never from request bodies, query params, custom headers or Clerk metadata alone.
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { MemberStatus, Permission, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserCompany, getMemberPermissions } from "@/lib/permissions"

export type GuardFailure = { ok: false; response: NextResponse }

function fail(error: string, status: number): GuardFailure {
    return { ok: false, response: NextResponse.json({ error }, { status }) }
}

/**
 * Resolves the signed-in user from the DB. Optionally restricts to the given roles.
 */
export async function requireDbUser(roles?: Role | Role[]) {
    const { userId } = await auth()
    if (!userId) return fail("Unauthorized", 401)

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, clerkId: true, email: true, role: true },
    })
    if (!user) return fail("User not found", 404)

    const allowed = roles === undefined ? null : Array.isArray(roles) ? roles : [roles]
    if (allowed && !allowed.includes(user.role)) return fail("Forbidden", 403)

    return { ok: true as const, user }
}

/**
 * Resolves the signed-in user's ACTIVE company membership (owner or team member)
 * and optionally enforces a permission.
 */
export async function requireCompanyAccess(permission?: Permission) {
    const guard = await requireDbUser([Role.COMPANY, Role.TEAM_MEMBER])
    if (!guard.ok) return guard

    const membership = await getUserCompany(guard.user.id)
    if (!membership || membership.status !== MemberStatus.ACTIVE) {
        return fail("No active company membership", 403)
    }

    const permissions = getMemberPermissions(membership)
    if (permission && !permissions.includes(permission)) {
        return fail(`Missing permission: ${permission}`, 403)
    }

    return {
        ok: true as const,
        user: guard.user,
        companyId: membership.companyId,
        permissions,
    }
}

function safeEqual(a: string, b: string): boolean {
    const ab = new TextEncoder().encode(a)
    const bb = new TextEncoder().encode(b)
    return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/**
 * Verifies a cron/maintenance request. Fails closed when CRON_SECRET is unset
 * (except in local development).
 *
 * Accepted credentials:
 * - `Authorization: Bearer <CRON_SECRET>` (what Vercel Cron sends)
 * - `x-cron-secret: <CRON_SECRET>`
 * - `?secret=<CRON_SECRET>` (legacy; secrets in URLs end up in logs — prefer the header)
 */
export function isAuthorizedCron(req: Request): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return process.env.NODE_ENV === "development"

    const bearer = req.headers.get("authorization")
    if (bearer && safeEqual(bearer, `Bearer ${secret}`)) return true

    const header = req.headers.get("x-cron-secret")
    if (header && safeEqual(header, secret)) return true

    const query = new URL(req.url).searchParams.get("secret")
    return !!query && safeEqual(query, secret)
}
