import { Permission } from "@prisma/client"
import { z } from "zod"
import type { ChatCompletionTool } from "openai/resources/chat/completions"

interface ToolDefinition {
    audience: "STUDENT" | "COMPANY" | "BOTH"
    permission: Permission | null
    scope: "NONE" | "SELF" | "COMPANY_OWNED"
    description: string
    input: z.ZodObject<z.core.$ZodLooseShape>
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
    // ─── Student tools ───────────────────────────────────────────────
    search_internships: {
        audience: "STUDENT",
        permission: null,
        scope: "NONE",
        description: "Search for ONE available internship by keyword, skill, or location.",
        input: z.object({
            query: z.string().optional().describe("Search keyword (title, skill, description)"),
            location: z.string().optional().describe("City or region filter"),
            limit: z.number().optional().describe("MUST be exactly 1 unless overridden. Never output a list."),
        }),
    },
    get_portfolio: {
        audience: "STUDENT",
        permission: null,
        scope: "SELF",
        description: "Retrieve the student's portfolio (name, headline, skills).",
        input: z.object({}),
    },
    update_portfolio: {
        audience: "STUDENT",
        permission: null,
        scope: "SELF",
        description: "Updates the user's manual portfolio fields (headline, bio, skills). Use this when the user explicitly asks to add something to their portfolio.",
        input: z.object({
            headline: z.string().optional().describe("A short professional headline"),
            bio: z.string().optional().describe("A brief about me summary"),
            skills: z.array(z.string()).optional().describe("An array of skills, e.g. ['React', 'TypeScript']"),
        }),
    },
    get_saved_internships: {
        audience: "STUDENT",
        permission: null,
        scope: "SELF",
        description: "List internships the student has bookmarked / saved.",
        input: z.object({}),
    },
    generate_cover_letter: {
        audience: "STUDENT",
        permission: null,
        scope: "SELF",
        description: "Generate a personalised AI cover letter for a specific internship based on the student's portfolio.",
        input: z.object({
            internshipId: z.string().describe("The internship ID to generate the cover letter for"),
        }),
    },
    get_internship_recommendations: {
        audience: "STUDENT",
        permission: null,
        scope: "SELF",
        description: "Get ONE personalised internship recommendation ranked by match to the student's skills and interests.",
        input: z.object({
            limit: z.number().optional().describe("MUST be exactly 1. You only recommend the single best match."),
        }),
    },
    withdraw_application: {
        audience: "STUDENT",
        permission: null,
        scope: "SELF",
        description: "Withdraw (cancel) a pending application. Only works for PENDING applications.",
        input: z.object({
            applicationId: z.string().describe("The application ID to withdraw"),
        }),
    },

    // ─── Company tools ───────────────────────────────────────────────
    create_internship: {
        audience: "COMPANY",
        permission: Permission.CREATE_INTERNSHIPS,
        scope: "COMPANY_OWNED",
        description: "Create a new internship posting for the company. ALWAYS ask about: deadline, paid/unpaid, salary, cover letter requirement, location, qualifications, skills needed, and optional test assignment.",
        input: z.object({
            title: z.string().describe("Internship title"),
            description: z.string().describe("Detailed internship description"),
            location: z.string().optional().describe("Location (defaults to Remote)"),
            paid: z.boolean().optional().describe("Whether the internship is paid"),
            salary: z.number().optional().describe("Monthly salary if paid"),
            qualifications: z.string().optional().describe("Required qualifications / requirements"),
            skills: z.array(z.string()).optional().describe("Required skills array e.g. [\"React\", \"TypeScript\"]"),
            requiresCoverLetter: z.boolean().optional().describe("Whether applicants must submit a cover letter"),
            applicationEnd: z.string().optional().describe("Application deadline in YYYY-MM-DD format (defaults to 30 days from now)"),
            startDate: z.string().optional().describe("Internship start date YYYY-MM-DD"),
            endDate: z.string().optional().describe("Internship end date YYYY-MM-DD"),
            testAssignmentTitle: z.string().optional().describe("Title of a test assignment for applicants"),
            testAssignmentDescription: z.string().optional().describe("Description of the test assignment"),
            testAssignmentDueDate: z.string().optional().describe("Test assignment deadline YYYY-MM-DD"),
        }),
    },
    get_company_internships: {
        audience: "COMPANY",
        permission: null,
        scope: "COMPANY_OWNED",
        description: "List all internships posted by the company.",
        input: z.object({}),
    },
    search_candidates: {
        audience: "COMPANY",
        permission: Permission.SEARCH_CANDIDATES,
        scope: "NONE",
        description: "Search for student candidates by name, email, or skill keyword.",
        input: z.object({
            query: z.string().optional().describe("Search keyword (name, email, skill)"),
        }),
    },
    update_internship: {
        audience: "COMPANY",
        permission: Permission.EDIT_INTERNSHIPS,
        scope: "COMPANY_OWNED",
        description: "Update an existing internship posting. Only include fields that need changing.",
        input: z.object({
            internshipId: z.string().describe("The internship ID to update"),
            title: z.string().optional(),
            description: z.string().optional(),
            location: z.string().optional(),
            paid: z.boolean().optional(),
            salary: z.number().optional(),
            qualifications: z.string().optional(),
            requiresCoverLetter: z.boolean().optional(),
            skills: z.array(z.string()).optional().describe("Required skills array"),
            applicationEnd: z.string().optional().describe("New deadline YYYY-MM-DD"),
            startDate: z.string().optional().describe("Internship start YYYY-MM-DD"),
            endDate: z.string().optional().describe("Internship end YYYY-MM-DD"),
            testAssignmentTitle: z.string().optional(),
            testAssignmentDescription: z.string().optional(),
            testAssignmentDueDate: z.string().optional().describe("Test assignment deadline YYYY-MM-DD"),
        }),
    },
    get_application_details: {
        audience: "COMPANY",
        permission: Permission.VIEW_APPLICATIONS,
        scope: "COMPANY_OWNED",
        description: "Get full details of a specific application including student profile and cover letter.",
        input: z.object({
            applicationId: z.string().describe("The application ID"),
        }),
    },

    // ─── Shared tools ────────────────────────────────────────────────
    get_applications: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "List applications. Students see their own; companies see applications to their internships.",
        input: z.object({}),
    },
    get_dashboard_stats: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "Get a statistical overview of the dashboard (counts of applications, internships, etc.).",
        input: z.object({}),
    },
    get_interviews: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "List upcoming or past interviews for the current user.",
        input: z.object({}),
    },
    get_conversations: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "List the user's message conversations with the latest message preview.",
        input: z.object({}),
    },
    get_assignments: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "List assignments for the current user.",
        input: z.object({}),
    },
    list_notifications: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "List the user's recent notifications (unread first).",
        input: z.object({
            unreadOnly: z.boolean().optional().describe("True to return only unread notifications"),
        }),
    },
    mark_notifications_read: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "Mark all notifications as read.",
        input: z.object({}),
    },
    search_past_sessions: {
        audience: "BOTH",
        permission: null,
        scope: "SELF",
        description: "Search across all past AI conversations for a keyword or topic. Returns matching messages with session names, dates, and confidence scores showing which session the info came from.",
        input: z.object({
            query: z.string().describe("Search term to find in past conversations"),
            limit: z.number().optional().describe("Max results (default 10, max 20)"),
        }),
    },
}

export function getToolDefinition(toolName: string): ToolDefinition | undefined {
    return TOOL_REGISTRY[toolName]
}

export function getToolsForContext({ userType }: { userType: string; permissions: Set<string> | string[] }): ChatCompletionTool[] {
    return Object.entries(TOOL_REGISTRY)
        .filter(([, def]) => (def.audience === "BOTH" || def.audience === userType.toUpperCase()))
        .map(([name, def]) => ({
            type: "function" as const,
            function: {
                name,
                description: def.description,
                parameters: z.toJSONSchema(def.input) as Record<string, unknown>,
            }
        }))
}
