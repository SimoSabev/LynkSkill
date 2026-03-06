import { prisma } from "@/lib/prisma"
import type { UserContext } from "@/lib/agent-tools"

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
                        customRole: { select: { permissions: true } },
                    },
                },
                companies: { select: { id: true }, take: 1 },
            },
        })

        if (!user) {
            return { success: false, error: "User not found" }
        }

        // Resolve permissions from membership
        const permissions: string[] = []

        if (user.companyMembership) {
            // Add custom role permissions
            if (user.companyMembership.customRole?.permissions) {
                permissions.push(...user.companyMembership.customRole.permissions)
            }
            // Add extra permissions
            if (user.companyMembership.extraPermissions) {
                permissions.push(...user.companyMembership.extraPermissions)
            }
        }

        // Company owners get all permissions
        const companyId = user.companies[0]?.id || user.companyMembership?.companyId
        if (user.companies.length > 0) {
            // Owner — grant all permissions implicitly handled by authorize layer
            permissions.push("__OWNER__")
        }

        const isOwner = user.companies.length > 0
        const companyRole = isOwner
            ? "OWNER"
            : user.companyMembership?.defaultRole ?? undefined

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
