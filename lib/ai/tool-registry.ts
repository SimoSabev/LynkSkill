/**
 * Tool Registry for AI Agent Permission Enforcement
 *
 * Security-critical component that maps every agent tool to its
 * required permission, audience, scope, and input schema.
 * Used by the authorization layer to enforce deny-by-default access control.
 */

import { Permission } from "@prisma/client"
import { z } from "zod"
import type OpenAI from "openai"

// ─── Scope & Audience Types ─────────────────────────────────────────────────

/** Defines how a tool's target resource relates to the calling user. */
export type ToolScope =
  | "NONE"                      // Public / no resource ownership check
  | "STUDENT_OWNED"             // Resource must belong to ctx.userId
  | "COMPANY_OWNED"             // Resource must belong to ctx.companyId
  | "CONVERSATION_PARTICIPANT"  // Caller must be a participant of the conversation

/** Which user audience is allowed to invoke the tool. */
export type ToolAudience = "STUDENT" | "COMPANY" | "BOTH"

// ─── Tool Definition ────────────────────────────────────────────────────────

export interface ToolDefinition {
  /** Unique tool name (must match the function name sent to OpenAI). */
  name: string
  /** Human-readable description shown to the LLM. */
  description: string
  /** Which audience may use this tool. */
  audience: ToolAudience
  /** Permission required to invoke the tool. `null` = no permission needed. */
  requiredPermission: Permission | null
  /** Ownership / scope check to enforce before execution. */
  scope: ToolScope
  /**
   * The key inside the tool arguments that identifies the scoped resource.
   * For example `"internshipId"` for a COMPANY_OWNED internship tool.
   * Omitted when scope is NONE or the resource is implicitly the caller.
   */
  scopeResourceId?: string
  /** Zod schema used to validate the raw arguments from the LLM. */
  inputSchema: z.ZodSchema
  /**
   * Pre-computed JSON Schema for OpenAI function parameters.
   * Built from `inputSchema` at module load time via `z.toJSONSchema()`.
   */
  parametersJsonSchema: Record<string, unknown>
  /** Whether this tool mutates data (write = true, read = false). */
  isWrite: boolean
}

// ─── Input Schemas ──────────────────────────────────────────────────────────

const emptySchema = z.object({})

const optionalStatusSchema = z.object({
  status: z.string().optional(),
})

const internshipIdSchema = z.object({
  internshipId: z.string().min(1, "internshipId is required"),
})

const searchInternshipsSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  paid: z.boolean().optional(),
})

const applyToInternshipSchema = z.object({
  internshipId: z.string().min(1, "internshipId is required"),
  coverLetter: z.string().optional(),
})

const updatePortfolioSchema = z.object({
  fullName: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
})

const saveInternshipSchema = z.object({
  internshipId: z.string().min(1, "internshipId is required"),
  save: z.boolean(),
})

const createInternshipSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  location: z.string().min(1, "location is required"),
  paid: z.boolean(),
  salary: z.number().optional(),
  qualifications: z.string().optional(),
  requiresCoverLetter: z.boolean().optional(),
  applicationStart: z.string().min(1, "applicationStart is required"),
  applicationEnd: z.string().min(1, "applicationEnd is required"),
})

const listReceivedApplicationsSchema = z.object({
  internshipId: z.string().optional(),
  status: z.string().optional(),
})

const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  status: z.enum(["APPROVED", "REJECTED"]),
})

const searchCandidatesSchema = z.object({
  skills: z.array(z.string()).optional(),
  query: z.string().optional(),
})

const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  scheduledAt: z.string().min(1, "scheduledAt is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
})

const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  content: z.string().min(1, "content is required"),
})

const listInterviewsSchema = z.object({
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
})

// ─── Helper: Build JSON Schema from Zod ─────────────────────────────────────

/**
 * Convert a Zod schema to a JSON Schema object suitable for OpenAI function
 * parameters. Uses Zod v4's built-in `z.toJSONSchema()`.
 */
function buildJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
  try {
    return z.toJSONSchema(schema) as Record<string, unknown>
  } catch {
    // Fallback for empty / trivial schemas
    return { type: "object", properties: {} }
  }
}

// ─── Helper: Create a ToolDefinition with auto-computed JSON Schema ─────────

type ToolDefInput = Omit<ToolDefinition, "parametersJsonSchema">

function defineTool(input: ToolDefInput): ToolDefinition {
  return {
    ...input,
    parametersJsonSchema: buildJsonSchema(input.inputSchema),
  }
}

// ─── Tool Registry ──────────────────────────────────────────────────────────

const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Common / Both ───────────────────────────────────────────────────────
  defineTool({
    name: "get_dashboard_stats",
    description:
      "Get an overview of dashboard statistics including counts of internships, applications, interviews, and messages.",
    audience: "BOTH",
    requiredPermission: null,
    scope: "NONE",
    inputSchema: emptySchema,
    isWrite: false,
  }),
  defineTool({
    name: "list_interviews",
    description:
      "List upcoming and past interviews. Use when user asks about interviews or their schedule.",
    audience: "BOTH",
    requiredPermission: null,
    scope: "NONE",
    inputSchema: listInterviewsSchema,
    isWrite: false,
  }),
  defineTool({
    name: "list_conversations",
    description:
      "List message conversations. Use when user asks about messages, chats, or wants to communicate.",
    audience: "BOTH",
    requiredPermission: null,
    scope: "NONE",
    inputSchema: emptySchema,
    isWrite: false,
  }),
  defineTool({
    name: "send_message",
    description:
      "Send a message in an existing conversation. Use when the user wants to reply to or send a message.",
    audience: "BOTH",
    requiredPermission: Permission.SEND_MESSAGES,
    scope: "CONVERSATION_PARTICIPANT",
    scopeResourceId: "conversationId",
    inputSchema: sendMessageSchema,
    isWrite: true,
  }),
  defineTool({
    name: "list_assignments",
    description:
      "List assignments (test tasks from internship applications). Use when asking about assignments, tests, or tasks.",
    audience: "BOTH",
    requiredPermission: null,
    scope: "NONE",
    inputSchema: emptySchema,
    isWrite: false,
  }),

  // ── Student-Only Tools ────────────────────────────────────────────────
  defineTool({
    name: "search_internships",
    description:
      "Search for available internships. Can filter by keywords, location, and paid/unpaid.",
    audience: "STUDENT",
    requiredPermission: null,
    scope: "NONE",
    inputSchema: searchInternshipsSchema,
    isWrite: false,
  }),
  defineTool({
    name: "get_internship_details",
    description:
      "Get full details about a specific internship including company info, requirements, and dates.",
    audience: "BOTH",
    requiredPermission: null,
    scope: "NONE",
    scopeResourceId: "internshipId",
    inputSchema: internshipIdSchema,
    isWrite: false,
  }),
  defineTool({
    name: "list_my_applications",
    description:
      "List the student's submitted applications with their statuses (pending, approved, rejected).",
    audience: "STUDENT",
    requiredPermission: null,
    scope: "STUDENT_OWNED",
    inputSchema: optionalStatusSchema,
    isWrite: false,
  }),
  defineTool({
    name: "apply_to_internship",
    description:
      "Submit an application to an internship on behalf of the student.",
    audience: "STUDENT",
    requiredPermission: null,
    scope: "NONE",
    scopeResourceId: "internshipId",
    inputSchema: applyToInternshipSchema,
    isWrite: true,
  }),
  defineTool({
    name: "get_portfolio",
    description:
      "Get the student's current portfolio details including bio, skills, experience, and education.",
    audience: "STUDENT",
    requiredPermission: null,
    scope: "STUDENT_OWNED",
    inputSchema: emptySchema,
    isWrite: false,
  }),
  defineTool({
    name: "update_portfolio",
    description:
      "Update the student's portfolio fields. Only include fields that need to be changed.",
    audience: "STUDENT",
    requiredPermission: null,
    scope: "STUDENT_OWNED",
    inputSchema: updatePortfolioSchema,
    isWrite: true,
  }),
  defineTool({
    name: "save_internship",
    description:
      "Save (bookmark) or unsave an internship for later viewing.",
    audience: "STUDENT",
    requiredPermission: null,
    scope: "NONE",
    inputSchema: saveInternshipSchema,
    isWrite: true,
  }),
  defineTool({
    name: "list_saved_internships",
    description:
      "List all internships the student has saved/bookmarked.",
    audience: "STUDENT",
    requiredPermission: null,
    scope: "STUDENT_OWNED",
    inputSchema: emptySchema,
    isWrite: false,
  }),

  // ── Company-Only Tools ────────────────────────────────────────────────
  defineTool({
    name: "list_internships",
    description:
      "List the company's posted internships.",
    audience: "COMPANY",
    requiredPermission: null,
    scope: "COMPANY_OWNED",
    inputSchema: emptySchema,
    isWrite: false,
  }),
  defineTool({
    name: "create_internship",
    description:
      "Create a new internship posting for the company. All required fields must be provided.",
    audience: "COMPANY",
    requiredPermission: Permission.CREATE_INTERNSHIPS,
    scope: "COMPANY_OWNED",
    inputSchema: createInternshipSchema,
    isWrite: true,
  }),
  defineTool({
    name: "list_received_applications",
    description:
      "List applications received for the company's internships. Can filter by internship or status.",
    audience: "COMPANY",
    requiredPermission: Permission.VIEW_APPLICATIONS,
    scope: "COMPANY_OWNED",
    inputSchema: listReceivedApplicationsSchema,
    isWrite: false,
  }),
  defineTool({
    name: "update_application_status",
    description:
      "Accept or reject a student's application.",
    audience: "COMPANY",
    requiredPermission: Permission.MANAGE_APPLICATIONS,
    scope: "COMPANY_OWNED",
    scopeResourceId: "applicationId",
    inputSchema: updateApplicationStatusSchema,
    isWrite: true,
  }),
  defineTool({
    name: "search_candidates",
    description:
      "Search for student candidates by skills, interests, or general query.",
    audience: "COMPANY",
    requiredPermission: Permission.SEARCH_CANDIDATES,
    scope: "COMPANY_OWNED",
    inputSchema: searchCandidatesSchema,
    isWrite: false,
  }),
  defineTool({
    name: "schedule_interview",
    description:
      "Schedule an interview with an applicant.",
    audience: "COMPANY",
    requiredPermission: Permission.SCHEDULE_INTERVIEWS,
    scope: "COMPANY_OWNED",
    scopeResourceId: "applicationId",
    inputSchema: scheduleInterviewSchema,
    isWrite: true,
  }),
]

// ─── Lookup Maps (built once at module load) ────────────────────────────────

const toolsByName = new Map<string, ToolDefinition>()
for (const def of TOOL_DEFINITIONS) {
  // Note: some names like "get_internship_details" appear once with audience BOTH,
  // while "list_internships" is COMPANY-only (students use "search_internships").
  // If a name is duplicated the last definition wins — keep the array ordered so
  // the most specific (company) variant is last.
  toolsByName.set(def.name, def)
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Context passed to `getToolsForContext` so it can filter by audience
 * and check the caller's permissions.
 */
export interface ToolFilterContext {
  /** "student" | "company" — matches the userType sent from the client. */
  userType: "student" | "company"
  /** Set of permissions the current user holds (resolved from their role). */
  permissions: Set<Permission>
}

/**
 * Returns the OpenAI-compatible tool list filtered by:
 *  1. Audience (STUDENT / COMPANY / BOTH)
 *  2. Required permission (tool is excluded if the user lacks it)
 *
 * This ensures the LLM never even *sees* tools the user cannot invoke.
 */
export function getToolsForContext(
  ctx: ToolFilterContext
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  const audienceFilter: ToolAudience[] =
    ctx.userType === "student"
      ? ["STUDENT", "BOTH"]
      : ["COMPANY", "BOTH"]

  return TOOL_DEFINITIONS
    .filter((def) => {
      // 1. Audience gate
      if (!audienceFilter.includes(def.audience)) return false

      // 2. Permission gate — if a permission is required the user must have it.
      //    Students currently have no Permission enum values; their tools use
      //    requiredPermission: null so they pass through.
      if (def.requiredPermission !== null) {
        // For students, send_message permission check is skipped (they don't
        // go through the company permission system). The scope check at
        // execution time will verify conversation participation instead.
        if (ctx.userType === "student") {
          // Students are allowed to see the tool; runtime scope check handles authz.
          return true
        }
        if (!ctx.permissions.has(def.requiredPermission)) return false
      }

      return true
    })
    .map(toOpenAITool)
}

/**
 * Look up a single tool definition by name.
 * Returns `null` if the tool does not exist in the registry.
 */
export function getToolDefinition(name: string): ToolDefinition | null {
  return toolsByName.get(name) ?? null
}

/**
 * Return every registered tool definition (useful for tests / admin views).
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return [...TOOL_DEFINITIONS]
}

/**
 * Validate raw LLM arguments against the tool's Zod input schema.
 *
 * @returns `{ success: true, data }` with the parsed & typed data, or
 *          `{ success: false, error }` with a human-readable validation message.
 */
export function validateToolInput(
  toolName: string,
  rawArgs: unknown
): { success: true; data: Record<string, unknown> } | { success: false; error: string } {
  const def = getToolDefinition(toolName)
  if (!def) {
    return { success: false, error: `Unknown tool: ${toolName}` }
  }

  const result = def.inputSchema.safeParse(rawArgs)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${String(i.path?.join(".") ?? "")}: ${i.message}`)
      .join("; ")
    return { success: false, error: `Invalid arguments for ${toolName}: ${issues}` }
  }

  return { success: true, data: result.data as Record<string, unknown> }
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Convert a `ToolDefinition` into the shape OpenAI expects for function calling.
 * Uses the pre-computed `parametersJsonSchema`.
 */
function toOpenAITool(
  def: ToolDefinition
): OpenAI.Chat.Completions.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: def.name,
      description: def.description,
      parameters: def.parametersJsonSchema,
    },
  }
}
