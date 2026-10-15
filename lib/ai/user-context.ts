import { prisma } from "@/lib/prisma"
import type { UserContext } from "@/lib/agent-tools"
import { MemberStatus } from "@prisma/client"
import { getMemberPermissions } from "@/lib/permissions"

interface ContextResult {
    success: true
    context: UserContext
}

interface ContextError {
    success: false
    error: string
}

export async function resolveEnhancedUserContext(
    clerkId: string
): Promise<ContextResult | ContextError> {
    try {
        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: {
                companyMembership: {
                    include: {
                        customRole: { select: { id: true, name: true, permissions: true, color: true } },
                    },
                },
                companies: { select: { id: true }, take: 1 },
            },
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        // Only an ACTIVE membership counts: suspended/pending members keep their row
        // but must not act for the company. Permissions = default role + custom role
        // + extra grants (same resolution as the REST routes).
        const membership =
            user.companyMembership?.status === MemberStatus.ACTIVE ? user.companyMembership : null
        const permissions: string[] = membership
            ? getMemberPermissions(membership)
            : []

        // Company owners get all permissions
        const ownedCompanyId = user.companies[0]?.id
        const companyId = ownedCompanyId || membership?.companyId
        if (ownedCompanyId) {
            // Owner — grant all permissions implicitly handled by authorize layer
            permissions.push("__OWNER__")
        }

        const isOwner = !!ownedCompanyId
        const companyRole = isOwner
            ? "OWNER"
            : membership?.defaultRole ?? undefined

        return {
            success: true,
            context: {
                userId: user.id,
                clerkId: user.clerkId,
                role: user.role,
                companyId: companyId ?? undefined,
                permissions,
                isCompanyOwner: isOwner,
                companyRole,
            },
        }
    } catch (error) {
        console.error("[user-context] Failed to resolve context:", error)
        return { success: false, error: "Failed to resolve user context" }
    }
}
