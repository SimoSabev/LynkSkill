import { TOOL_REGISTRY } from "@/lib/ai/tool-registry"
import type { UserContext } from "@/lib/agent-tools"

interface AuthorizeResult {
    allowed: boolean
    args: Record<string, unknown>
    reason?: string
}

export async function validateAndAuthorizeToolCall(
    toolName: string,
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<AuthorizeResult> {
    const toolDef = TOOL_REGISTRY[toolName]

    if (!toolDef) {
        return { allowed: false, args, reason: `Unknown tool: ${toolName}` }
    }

    // Check audience
    const audience = toolDef.audience as string
    if (audience !== "BOTH") {
        const userAudience = ctx.role === "STUDENT" ? "STUDENT" : "COMPANY"
        if (audience !== userAudience) {
            return {
                allowed: false,
                args,
                reason: `Tool "${toolName}" is not available for ${ctx.role} users.`,
            }
        }
    }

    const isCompanyUser = ctx.role !== "STUDENT"
    const isOwner = ctx.permissions.includes("__OWNER__")

    // A company user without an (active) company must never fall through to
    // unscoped queries (removed/suspended members keep their COMPANY/TEAM_MEMBER role).
    if (isCompanyUser && !ctx.companyId && (audience === "COMPANY" || toolDef.companyPermission)) {
        return {
            allowed: false,
            args,
            reason: "You are not an active member of a company.",
        }
    }

    // Check required permission (and the company-side permission of BOTH tools)
    const requiredPermissions = [
        toolDef.permission,
        isCompanyUser ? toolDef.companyPermission : undefined,
    ].filter((p): p is NonNullable<typeof p> => !!p)
    for (const requiredPermission of requiredPermissions) {
        if (!isOwner && !ctx.permissions.includes(requiredPermission)) {
            return {
                allowed: false,
                args,
                reason: `Missing permission: ${requiredPermission}`,
            }
        }
    }

    // Enforce scope — inject companyId for company-owned resources
    const scope = toolDef.scope as string
    if (scope === "COMPANY_OWNED" && ctx.companyId) {
        args = { ...args, companyId: ctx.companyId }
    }
    if (scope === "SELF") {
        args = { ...args, userId: ctx.userId }
    }

    // Validate input schema if present
    if (toolDef.input) {
        const parseResult = toolDef.input.safeParse(args)
        if (!parseResult.success) {
            return {
                allowed: false,
                args,
                reason: `Invalid arguments: ${parseResult.error.message}`,
            }
        }
    }

    return { allowed: true, args }
}
