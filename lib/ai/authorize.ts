/**
 * Authorization & Scope Checking for AI Agent Tool Execution
 *
 * Enforces deny-by-default access control by validating:
 *  1. Tool existence in the registry
 *  2. Input arguments via Zod schema
 *  3. Required permissions against the user's resolved permissions
 *  4. Resource scope (ownership / participation checks)
 *
 * Every tool call must pass through `validateAndAuthorizeToolCall` before
 * the tool handler is executed.
 */

import { Permission } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  getToolDefinition,
  validateToolInput,
  type ToolDefinition,
  type ToolScope,
  type ToolAudience,
} from "@/lib/ai/tool-registry"
import type { EnhancedUserContext } from "@/lib/ai/user-context"

// ─── Denial Types ───────────────────────────────────────────────────────────

export type DenialType =
  | "permission_denied"
  | "scope_denied"
  | "context_missing"
  | "validation_error"

export interface DenialResponse {
  /** Category of the denial. */
  type: DenialType
  /** The tool that was denied. */
  deniedTool: string
  /** Technical message (for logging / debugging). */
  message: string
  /** User-friendly reply to surface in the chat. */
  reply: string
  /** Optional suggestion for what the user *can* do. */
  suggestion?: string
  /** The permission that was required but missing. */
  requiredPermission?: string
  /** Per-field validation errors (for validation_error type). */
  validationErrors?: Record<string, string>
}

// ─── Authorization Result ───────────────────────────────────────────────────

export type AuthorizationResult =
  | { allowed: true; args: Record<string, unknown> }
  | { allowed: false; denial: DenialResponse }

// ─── Main Authorization Entry Point ─────────────────────────────────────────

/**
 * Validates and authorizes a tool call before execution.
 *
 * Steps:
 *  1. Look up tool in registry → deny if unknown (deny-by-default)
 *  2. Check audience match → deny if user type doesn't match
 *  3. Validate arguments via Zod → deny with validation_error on failure
 *  4. Check required permission → deny with permission_denied if missing
 *  5. Check scope (ownership / participation) → deny with scope_denied if violated
 *  6. Return `{ allowed: true, args }` with the parsed arguments
 */
export async function validateAndAuthorizeToolCall(
  toolName: string,
  rawArgs: unknown,
  ctx: EnhancedUserContext
): Promise<AuthorizationResult> {
  // Step 1: Tool must exist in the registry
  const toolDef = getToolDefinition(toolName)
  if (!toolDef) {
    return {
      allowed: false,
      denial: {
        type: "permission_denied",
        deniedTool: toolName,
        message: `Tool "${toolName}" is not registered. Deny-by-default.`,
        reply: `I don't have access to a tool called "${toolName}". This action is not available.`,
        suggestion: "Try asking me to do something else — I can help with internships, applications, messages, and more.",
      },
    }
  }

  // Step 2: Audience check
  const audienceResult = checkAudience(toolDef, ctx)
  if (!audienceResult.allowed) {
    return audienceResult
  }

  // Step 3: Validate arguments
  const validation = validateToolInput(toolName, rawArgs)
  if (!validation.success) {
    return {
      allowed: false,
      denial: getValidationErrorResponse(toolName, validation.error),
    }
  }
  const parsedArgs = validation.data

  // Step 4: Permission check
  if (toolDef.requiredPermission !== null) {
    // Students bypass company permission checks — their access is controlled
    // by audience filtering and scope checks instead.
    const isStudentUser = ctx.role === "STUDENT"
    if (!isStudentUser && !checkPermission(ctx, toolDef.requiredPermission)) {
      return {
        allowed: false,
        denial: getPermissionDeniedResponse(
          toolName,
          toolDef.requiredPermission,
          ctx
        ),
      }
    }
  }

  // Step 5: Scope check
  const scopeResult = await validateScope(toolDef.scope, parsedArgs, ctx, toolName, toolDef)
  if (!scopeResult.allowed) {
    return scopeResult
  }

  // All checks passed
  return { allowed: true, args: parsedArgs }
}

// ─── Audience Check ─────────────────────────────────────────────────────────

function checkAudience(
  toolDef: ToolDefinition,
  ctx: EnhancedUserContext
): AuthorizationResult {
  const userAudience: ToolAudience =
    ctx.role === "STUDENT" ? "STUDENT" : "COMPANY"

  if (
    toolDef.audience !== "BOTH" &&
    toolDef.audience !== userAudience
  ) {
    const roleLabel = ctx.role === "STUDENT" ? "student" : "company member"
    return {
      allowed: false,
      denial: {
        type: "permission_denied",
        deniedTool: toolDef.name,
        message: `Tool "${toolDef.name}" requires audience ${toolDef.audience} but user is ${userAudience}.`,
        reply: `This action is only available for ${toolDef.audience === "STUDENT" ? "students" : "company members"}. You're signed in as a ${roleLabel}.`,
        suggestion:
          toolDef.audience === "STUDENT"
            ? "If you're a student, make sure you're signed in with your student account."
            : "If you're part of a company, make sure you're signed in with your company account.",
      },
    }
  }

  // Audience matches — return a pass-through (args will be set later)
  return { allowed: true, args: {} }
}

// ─── Permission Helpers ─────────────────────────────────────────────────────

/**
 * Check whether the user context includes a specific permission.
 */
export function checkPermission(
  ctx: EnhancedUserContext,
  requiredPermission: Permission | string
): boolean {
  return ctx.permissions.includes(requiredPermission as Permission)
}

/**
 * Build a user-friendly denial response for a missing permission.
 */
export function getPermissionDeniedResponse(
  toolName: string,
  requiredPermission: Permission | string,
  ctx: EnhancedUserContext
): DenialResponse {
  const roleLabel = ctx.companyRole
    ? ctx.companyRole.replace(/_/g, " ").toLowerCase()
    : ctx.customRoleName ?? ctx.role.toLowerCase()

  return {
    type: "permission_denied",
    deniedTool: toolName,
    requiredPermission: String(requiredPermission),
    message: `Permission "${requiredPermission}" is required for tool "${toolName}" but user role "${roleLabel}" does not have it.`,
    reply: `You don't have permission to perform this action. Required permission: **${String(requiredPermission).replace(/_/g, " ").toLowerCase()}**. Your current role: **${roleLabel}**.`,
    suggestion: "Ask your company admin or owner to grant you the required permission, or contact them to perform this action on your behalf.",
  }
}

// ─── Scope Validation ───────────────────────────────────────────────────────

/**
 * Main scope validation logic. Checks resource ownership / participation
 * based on the tool's declared scope.
 */
export async function validateScope(
  scope: ToolScope,
  args: Record<string, unknown>,
  ctx: EnhancedUserContext,
  toolName: string,
  toolDef: ToolDefinition
): Promise<AuthorizationResult> {
  switch (scope) {
    case "NONE":
      // No ownership check needed
      return { allowed: true, args }

    case "STUDENT_OWNED":
      // The resource implicitly belongs to the calling student.
      // No explicit resource ID check needed — the tool handler should
      // always scope queries to ctx.userId.
      return { allowed: true, args }

    case "COMPANY_OWNED": {
      const companyCheck = assertCompanyScope(ctx)
      if (!companyCheck.allowed) {
        return {
          allowed: false,
          denial: getContextMissingResponse(toolName, "companyId"),
        }
      }
      // If the tool has a scopeResourceId, the actual ownership check
      // (does this resource belong to ctx.companyId?) must be done by
      // the tool handler at query time, since we don't know the resource
      // table here. The authorization layer guarantees the user *has* a
      // company context.
      return { allowed: true, args }
    }

    case "CONVERSATION_PARTICIPANT": {
      const conversationId = toolDef.scopeResourceId
        ? (args[toolDef.scopeResourceId] as string | undefined)
        : undefined

      if (!conversationId) {
        return {
          allowed: false,
          denial: {
            type: "validation_error",
            deniedTool: toolName,
            message: `Scope CONVERSATION_PARTICIPANT requires a conversationId but none was provided.`,
            reply: "I need a conversation ID to send a message. Please specify which conversation you'd like to message in.",
          },
        }
      }

      const participantCheck = await assertConversationParticipant(
        conversationId,
        ctx
      )
      if (!participantCheck.allowed) {
        return {
          allowed: false,
          denial: getScopeDeniedResponse(toolName, scope, {
            resourceType: "conversation",
            resourceId: conversationId,
          }),
        }
      }

      return { allowed: true, args }
    }

    default: {
      // Unknown scope — deny by default
      // This should be unreachable if all ToolScope values are handled above.
      const unknownScope: string = scope
      return {
        allowed: false,
        denial: {
          type: "scope_denied",
          deniedTool: toolName,
          message: `Unknown scope "${unknownScope}" for tool "${toolName}". Deny-by-default.`,
          reply: "This action could not be authorized due to an internal configuration error.",
        },
      }
    }
  }
}

// ─── Scope Assertion Helpers ────────────────────────────────────────────────

/**
 * Ensures the user context has a companyId (required for COMPANY_OWNED tools).
 */
export function assertCompanyScope(
  ctx: EnhancedUserContext
): { allowed: true } | { allowed: false } {
  if (!ctx.companyId || !ctx.hasCompanyMembership) {
    return { allowed: false }
  }
  return { allowed: true }
}

/**
 * Verifies that a resource's companyId matches the user's companyId.
 * Use this in tool handlers when loading a resource from the database.
 */
export function assertResourceBelongsToCompany(
  resourceCompanyId: string,
  userCompanyId: string | undefined
): boolean {
  if (!userCompanyId) return false
  return resourceCompanyId === userCompanyId
}

/**
 * Verifies that a resource's userId matches the calling user's ID.
 * Use this in tool handlers for STUDENT_OWNED resources.
 */
export function assertResourceBelongsToUser(
  resourceUserId: string,
  userId: string
): boolean {
  return resourceUserId === userId
}

/**
 * Verifies that the user is a participant in the given conversation.
 * Queries the database to check studentId or companyId membership.
 */
export async function assertConversationParticipant(
  conversationId: string,
  ctx: EnhancedUserContext
): Promise<{ allowed: true } | { allowed: false }> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { studentId: true, companyId: true },
    })

    if (!conversation) {
      return { allowed: false }
    }

    // Student: must be the conversation's student
    if (ctx.role === "STUDENT") {
      return conversation.studentId === ctx.userId
        ? { allowed: true }
        : { allowed: false }
    }

    // Company / Team Member: must belong to the conversation's company
    if (ctx.companyId && conversation.companyId === ctx.companyId) {
      return { allowed: true }
    }

    return { allowed: false }
  } catch {
    // DB error — deny by default
    return { allowed: false }
  }
}

// ─── Denial Response Builders ───────────────────────────────────────────────

/**
 * Generates a scope denial response when a resource doesn't belong to the user.
 */
export function getScopeDeniedResponse(
  toolName: string,
  scope: ToolScope,
  resourceInfo: { resourceType: string; resourceId: string }
): DenialResponse {
  const scopeLabel =
    scope === "COMPANY_OWNED"
      ? "company"
      : scope === "STUDENT_OWNED"
        ? "account"
        : scope === "CONVERSATION_PARTICIPANT"
          ? "conversations"
          : "scope"

  return {
    type: "scope_denied",
    deniedTool: toolName,
    message: `Scope check failed for tool "${toolName}": ${resourceInfo.resourceType} "${resourceInfo.resourceId}" does not belong to the user's ${scopeLabel}.`,
    reply: `This ${resourceInfo.resourceType} doesn't belong to your ${scopeLabel}. You can only access your own ${resourceInfo.resourceType}s.`,
    suggestion: `Try accessing a ${resourceInfo.resourceType} that belongs to you.`,
  }
}

/**
 * Generates a response when required context (e.g. companyId) is missing.
 */
export function getContextMissingResponse(
  toolName: string,
  requiredContext: string
): DenialResponse {
  const contextLabels: Record<string, string> = {
    companyId: "company",
    userId: "user account",
  }

  const label = contextLabels[requiredContext] ?? requiredContext

  return {
    type: "context_missing",
    deniedTool: toolName,
    message: `Tool "${toolName}" requires ${requiredContext} in context but it is missing.`,
    reply: `This action requires a ${label} context. Please join or create a ${label} first.`,
    suggestion:
      requiredContext === "companyId"
        ? "You can create a new company or ask for an invitation to join an existing one."
        : undefined,
  }
}

/**
 * Generates a validation error response from a Zod validation failure string.
 */
function getValidationErrorResponse(
  toolName: string,
  errorMessage: string
): DenialResponse {
  // Parse individual field errors from the combined error string
  // Format: "Invalid arguments for toolName: field1: msg1; field2: msg2"
  const validationErrors: Record<string, string> = {}
  const issuesPart = errorMessage.replace(/^Invalid arguments for \w+:\s*/, "")
  for (const issue of issuesPart.split("; ")) {
    const colonIdx = issue.indexOf(": ")
    if (colonIdx > 0) {
      const field = issue.slice(0, colonIdx).trim()
      const msg = issue.slice(colonIdx + 2).trim()
      if (field) validationErrors[field] = msg
    }
  }

  return {
    type: "validation_error",
    deniedTool: toolName,
    message: errorMessage,
    reply: "I couldn't complete this action because some of the information provided was invalid. Please check the details and try again.",
    validationErrors:
      Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
  }
}
