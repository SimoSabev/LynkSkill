/**
 * Permission Enforcement System Tests
 *
 * Comprehensive tests for the LynkSkill AI assistant permission enforcement system.
 * Tests cover: tool registry completeness, deny-by-default, permission-based filtering,
 * cross-company access, student scope validation, authorization flow, and helper functions.
 *
 * Run with: npx vitest run or npm test (after installing vitest)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { Permission, DefaultCompanyRole, MemberStatus } from "@prisma/client"
import {
  getToolsForContext,
  getToolDefinition,
  validateToolInput,
  getAllToolDefinitions,
  type ToolFilterContext,
} from "../tool-registry"
import {
  resolveEnhancedUserContext,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isStudent,
  isCompanyUser,
  canAccessCompany,
  getContextForTools,
  type EnhancedUserContext,
} from "../user-context"
import {
  validateAndAuthorizeToolCall,
  checkPermission,
  assertCompanyScope,
  assertResourceBelongsToCompany,
  assertResourceBelongsToUser,
  getPermissionDeniedResponse,
  getScopeDeniedResponse,
  getContextMissingResponse,
  type AuthorizationResult,
  type DenialResponse,
} from "../authorize"

// Type guard helper for AuthorizationResult - returns denial if result is not allowed
function getDenial(result: AuthorizationResult): DenialResponse | undefined {
  return result.allowed ? undefined : result.denial
}

// Helper to get denial as unknown type (for test assertions)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDenialAny(result: AuthorizationResult): any {
  return result.allowed ? undefined : result.denial
}

// Type guard helper for validateToolInput result
function getValidationError(result: { success: true; data: Record<string, unknown> } | { success: false; error: string }): string | undefined {
  return result.success ? undefined : result.error
}

// Helper to get validation error as unknown type (for test assertions)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValidationErrorAny(result: { success: true; data: Record<string, unknown> } | { success: false; error: string }): any {
  return result.success ? undefined : result.error
}

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    companyMember: {
      findFirst: vi.fn(),
    },
    conversation: {
      findUnique: vi.fn(),
    },
  },
}))

// Import prisma after mocking
import { prisma } from "@/lib/prisma"

// Mock user return type for tests - partial user object with required fields
const mockUser = {
  id: "test_user_id",
  role: "STUDENT" as const,
  clerkId: "clerk_test",
  email: "test@example.com",
  onboardingComplete: true,
  introShown: true,
  tosAccepted: true,
  privacyAccepted: true,
}

// Helper to create mock user contexts
const createStudentContext = (overrides: Partial<EnhancedUserContext> = {}): EnhancedUserContext => ({
  clerkId: "student_clerk_123",
  userId: "student_user_123",
  role: "STUDENT",
  permissions: [],
  hasCompanyMembership: false,
  isCompanyOwner: false,
  ...overrides,
})

const createCompanyContext = (
  permissions: Permission[] = [],
  overrides: Partial<EnhancedUserContext> = {}
): EnhancedUserContext => ({
  clerkId: "company_clerk_123",
  userId: "company_user_123",
  role: "COMPANY",
  companyId: "company_123",
  companyRole: DefaultCompanyRole.OWNER,
  permissions,
  hasCompanyMembership: true,
  isCompanyOwner: true,
  ...overrides,
})

const createTeamMemberContext = (
  permissions: Permission[] = [],
  overrides: Partial<EnhancedUserContext> = {}
): EnhancedUserContext => ({
  clerkId: "member_clerk_123",
  userId: "member_user_123",
  role: "TEAM_MEMBER",
  companyId: "company_123",
  companyRole: DefaultCompanyRole.HR_RECRUITER,
  permissions,
  hasCompanyMembership: true,
  isCompanyOwner: false,
  ...overrides,
})

describe("Tool Registry Tests", () => {
  describe("Test 1: Tool Registry Completeness", () => {
    it("should have every tool in the registry with requiredPermission declared", () => {
      const tools = getAllToolDefinitions()

      // Verify registry is not empty
      expect(tools.length).toBeGreaterThan(0)

      // Verify every tool has requiredPermission declared (null is OK)
      for (const tool of tools) {
        expect(tool).toHaveProperty("requiredPermission")
        // null is acceptable (means no permission required)
        expect(
          tool.requiredPermission === null || typeof tool.requiredPermission === "string"
        ).toBe(true)
      }
    })

    it("should have every tool with scope declared", () => {
      const tools = getAllToolDefinitions()

      for (const tool of tools) {
        expect(tool).toHaveProperty("scope")
        expect(["NONE", "STUDENT_OWNED", "COMPANY_OWNED", "CONVERSATION_PARTICIPANT"]).toContain(
          tool.scope
        )
      }
    })

    it("should have all required fields for each tool definition", () => {
      const tools = getAllToolDefinitions()

      for (const tool of tools) {
        expect(tool.name).toBeDefined()
        expect(tool.description).toBeDefined()
        expect(tool.audience).toBeDefined()
        expect(tool.scope).toBeDefined()
        expect(tool.inputSchema).toBeDefined()
        expect(tool.isWrite).toBeDefined()
        expect(typeof tool.isWrite).toBe("boolean")
      }
    })

    it("should have valid audience values", () => {
      const tools = getAllToolDefinitions()

      for (const tool of tools) {
        expect(["STUDENT", "COMPANY", "BOTH"]).toContain(tool.audience)
      }
    })
  })

  describe("Test 2: Deny-by-Default for Unknown Tools", () => {
    it("should return null for unknown tool names", () => {
      const unknownTool = getToolDefinition("non_existent_tool")
      expect(unknownTool).toBeNull()
    })

    it("should deny unknown tools in authorization", async () => {
      const studentCtx = createStudentContext()

      const result = await validateAndAuthorizeToolCall(
        "this_tool_does_not_exist",
        {},
        studentCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial).toBeDefined()
      expect(denial?.type).toBe("permission_denied")
      expect(denial?.message).toContain("not registered")
    })

    it("should return validation error for unregistered tools", async () => {
      const companyCtx = createCompanyContext([Permission.CREATE_INTERNSHIPS])

      const result = await validateAndAuthorizeToolCall(
        "fake_create_tool",
        { title: "Test" },
        companyCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("permission_denied")
    })
  })

  describe("Test 3: Permission-Based Tool Filtering", () => {
    it("should filter out company-only tools for students", () => {
      const studentCtx: ToolFilterContext = {
        userType: "student",
        permissions: new Set(),
      }

      const tools = getToolsForContext(studentCtx)
      const toolNames = tools.map((t) => (t as { function: { name: string } }).function.name)

      // Company-only tools should not be available to students
      expect(toolNames).not.toContain("create_internship")
      expect(toolNames).not.toContain("list_internships")
      expect(toolNames).not.toContain("list_received_applications")
      expect(toolNames).not.toContain("search_candidates")
      expect(toolNames).not.toContain("schedule_interview")
    })

    it("should filter tools requiring permissions when user lacks permission", () => {
      const companyCtx: ToolFilterContext = {
        userType: "company",
        permissions: new Set(), // No permissions
      }

      const tools = getToolsForContext(companyCtx)
      const toolNames = tools.map((t) => (t as { function: { name: string } }).function.name)

      // Tools requiring permissions should be filtered out
      expect(toolNames).not.toContain("create_internship") // Requires CREATE_INTERNSHIPS
      expect(toolNames).not.toContain("search_candidates") // Requires SEARCH_CANDIDATES
      expect(toolNames).not.toContain("schedule_interview") // Requires SCHEDULE_INTERVIEWS
    })

    it("should allow tools without permission requirements to all users", () => {
      const companyCtx: ToolFilterContext = {
        userType: "company",
        permissions: new Set(),
      }

      const tools = getToolsForContext(companyCtx)
      const toolNames = tools.map((t) => (t as { function: { name: string } }).function.name)

      // Tools without required permission should be available
      expect(toolNames).toContain("get_dashboard_stats")
      expect(toolNames).toContain("list_interviews")
      expect(toolNames).toContain("list_conversations")
    })

    it("should include tools when user has required permission", () => {
      const companyCtx: ToolFilterContext = {
        userType: "company",
        permissions: new Set([Permission.CREATE_INTERNSHIPS]),
      }

      const tools = getToolsForContext(companyCtx)
      const toolNames = tools.map((t) => (t as { function: { name: string } }).function.name)

      // Should include create_internship when user has permission
      expect(toolNames).toContain("create_internship")
    })
  })

  describe("Test 4: Cross-Company Access Denied", () => {
    it("should deny access to company-owned tools when user has no company membership", async () => {
      const ctxWithoutCompany: EnhancedUserContext = {
        clerkId: "clerk_123",
        userId: "user_123",
        role: "COMPANY",
        permissions: [Permission.CREATE_INTERNSHIPS],
        hasCompanyMembership: false,
        isCompanyOwner: false,
        // No companyId
      }

      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Test Internship",
          description: "Test description",
          location: "Test location",
          paid: true,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        ctxWithoutCompany
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("context_missing")
    })

    it("should include company ID in context for COMPANY_OWNED tools", async () => {
      const companyCtx = createCompanyContext([Permission.CREATE_INTERNSHIPS])

      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Test Internship",
          description: "Test description",
          location: "Test location",
          paid: true,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        companyCtx
      )

      // With proper company context, should pass initial checks
      const denial = getDenial(result)
      expect(result.allowed || denial?.type === "permission_denied").toBe(true)
    })
  })

  describe("Test 5: Student Scope Validation", () => {
    it("should allow students to access their own portfolio", async () => {
      const studentCtx = createStudentContext()

      const result = await validateAndAuthorizeToolCall(
        "get_portfolio",
        {},
        studentCtx
      )

      // Should pass - STUDENT_OWNED scope allows student access to their own
      expect(result.allowed).toBe(true)
    })

    it("should allow students to view their own applications", async () => {
      const studentCtx = createStudentContext()

      const result = await validateAndAuthorizeToolCall(
        "list_my_applications",
        {},
        studentCtx
      )

      // Should pass - STUDENT_OWNED scope
      expect(result.allowed).toBe(true)
    })

    it("should deny students from accessing company tools", async () => {
      const studentCtx = createStudentContext()

      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Test",
          description: "Test",
          location: "Test",
          paid: true,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        studentCtx
      )

      // Should be denied - audience is COMPANY only
      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("permission_denied")
    })
  })

  describe("Test 6: Authorization Flow", () => {
    it("should validate tool input before checking permissions", async () => {
      const companyCtx = createCompanyContext([Permission.CREATE_INTERNSHIPS])

      // Missing required field
      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          // Missing title, description, location, etc.
        },
        companyCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("validation_error")
    })

    it("should check audience before permission", async () => {
      const studentCtx = createStudentContext()

      // Even with all permissions, student cannot access company tools
      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Test",
          description: "Test",
          location: "Test",
          paid: true,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        studentCtx
      )

      const denial = getDenialAny(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("permission_denied")
    })

    it("should allow valid tool calls to pass through", async () => {
      const companyCtx = createCompanyContext([Permission.CREATE_INTERNSHIPS])

      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Software Engineer Intern",
          description: "Great opportunity for students",
          location: "Remote",
          paid: true,
          salary: 5000,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        companyCtx
      )

      expect(result.allowed).toBe(true)
      if (result.allowed) {
        expect(result.args).toBeDefined()
      }
    })

    it("should catch invalid calls at each step - unknown tool", async () => {
      const ctx = createStudentContext()

      const result = await validateAndAuthorizeToolCall("unknown_tool", {}, ctx)

      const denial = getDenialAny(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("permission_denied")
    })
  })

  describe("Test 7: Permission Helper Functions", () => {
    const ctx = createCompanyContext([
      Permission.CREATE_INTERNSHIPS,
      Permission.VIEW_APPLICATIONS,
    ])

    it("hasPermission should return correct values", () => {
      expect(hasPermission(ctx, Permission.CREATE_INTERNSHIPS)).toBe(true)
      expect(hasPermission(ctx, Permission.DELETE_COMPANY)).toBe(false)
    })

    it("hasAnyPermission should work correctly", () => {
      expect(
        hasAnyPermission(ctx, [Permission.CREATE_INTERNSHIPS, Permission.DELETE_COMPANY])
      ).toBe(true)
      expect(
        hasAnyPermission(ctx, [Permission.DELETE_COMPANY, Permission.MANAGE_MEMBERS])
      ).toBe(false)
    })

    it("hasAllPermissions should work correctly", () => {
      expect(
        hasAllPermissions(ctx, [
          Permission.CREATE_INTERNSHIPS,
          Permission.VIEW_APPLICATIONS,
        ])
      ).toBe(true)
      expect(
        hasAllPermissions(ctx, [
          Permission.CREATE_INTERNSHIPS,
          Permission.DELETE_COMPANY,
        ])
      ).toBe(false)
    })

    it("isStudent should return correct values", () => {
      const studentCtx = createStudentContext()
      const companyCtx = createCompanyContext([])

      expect(isStudent(studentCtx)).toBe(true)
      expect(isStudent(companyCtx)).toBe(false)
    })

    it("isCompanyUser should return correct values", () => {
      const studentCtx = createStudentContext()
      const companyCtx = createCompanyContext([])
      const memberCtx = createTeamMemberContext([])

      expect(isCompanyUser(studentCtx)).toBe(false)
      expect(isCompanyUser(companyCtx)).toBe(true)
      expect(isCompanyUser(memberCtx)).toBe(true)
    })

    it("canAccessCompany should work correctly", () => {
      const companyCtx = createCompanyContext([], { companyId: "company_123" })

      expect(canAccessCompany(companyCtx, "company_123")).toBe(true)
      expect(canAccessCompany(companyCtx, "other_company")).toBe(false)
    })
  })

  describe("Test 8: Context Resolution", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("should return correct structure for students", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "student_123",
        role: "STUDENT" as const,
        clerkId: "clerk_student_123",
        email: "student@test.com",
        onboardingComplete: true,
        introShown: true,
        tosAccepted: true,
        privacyAccepted: true,
      })

      const result = await resolveEnhancedUserContext("clerk_student_123")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.context.role).toBe("STUDENT")
        expect(result.context.permissions).toEqual([])
        expect(result.context.hasCompanyMembership).toBe(false)
        expect(result.context.isCompanyOwner).toBe(false)
      }
    })

    it("should return correct permissions for company users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "company_user_123",
        role: "COMPANY" as const,
        clerkId: "clerk_company_123",
        email: "company@test.com",
        onboardingComplete: true,
        introShown: true,
        tosAccepted: true,
        privacyAccepted: true,
      })

      // Mock getUserCompany from permissions module
      vi.mock("@/lib/permissions", () => ({
        getUserCompany: vi.fn().mockResolvedValue({
          userId: "company_user_123",
          companyId: "company_123",
          defaultRole: DefaultCompanyRole.OWNER,
          customRole: null,
          extraPermissions: [],
          status: MemberStatus.ACTIVE,
        }),
        getMemberPermissions: vi.fn().mockReturnValue([
          Permission.CREATE_INTERNSHIPS,
          Permission.VIEW_APPLICATIONS,
        ]),
        CompanyMemberWithPermissions: {},
      }))

      const result = await resolveEnhancedUserContext("clerk_company_123")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.context.role).toBe("COMPANY")
        expect(result.context.companyId).toBe("company_123")
        expect(result.context.permissions.length).toBeGreaterThan(0)
        expect(result.context.hasCompanyMembership).toBe(true)
      }
    })

    it("should handle error for missing users", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await resolveEnhancedUserContext("non_existent_clerk_id")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("USER_NOT_FOUND")
      }
    })

    it("should handle missing company membership for company role", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user_123",
        role: "COMPANY" as const,
        clerkId: "clerk_company_no_membership",
        email: "nocompany@test.com",
        onboardingComplete: true,
        introShown: true,
        tosAccepted: true,
        privacyAccepted: true,
      })

      vi.mock("@/lib/permissions", () => ({
        getUserCompany: vi.fn().mockResolvedValue(null),
      }))

      const result = await resolveEnhancedUserContext("clerk_company_no_membership")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("MEMBERSHIP_NOT_FOUND")
      }
    })
  })

  describe("Key Security Test Scenarios", () => {
    it("Student trying to access create_internship should be denied", async () => {
      const studentCtx = createStudentContext()

      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Internship",
          description: "Description",
          location: "Location",
          paid: true,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        studentCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("permission_denied")
      expect(denial?.reply).toContain("only available for company members")
    })

    it("VIEWER trying to access search_candidates should be denied", async () => {
      // VIEWER has no permissions by default
      const viewerCtx = createCompanyContext([])

      const result = await validateAndAuthorizeToolCall(
        "search_candidates",
        { query: "software" },
        viewerCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("permission_denied")
      expect(denial?.requiredPermission).toBe("SEARCH_CANDIDATES")
    })

    it("HR_RECRUITER without proper permission should be denied", async () => {
      // HR_RECRUITER has VIEW_APPLICATIONS but not MANAGE_APPLICATIONS
      const hrCtx = createTeamMemberContext([Permission.VIEW_APPLICATIONS])

      const result = await validateAndAuthorizeToolCall(
        "update_application_status",
        {
          applicationId: "app_123",
          status: "APPROVED",
        },
        hrCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("permission_denied")
      expect(denial?.requiredPermission).toBe("MANAGE_APPLICATIONS")
    })

    it("Company user with no membership trying to access company tools should be context_missing", async () => {
      const noMembershipCtx: EnhancedUserContext = {
        clerkId: "clerk_123",
        userId: "user_123",
        role: "COMPANY",
        permissions: [Permission.CREATE_INTERNSHIPS],
        hasCompanyMembership: false,
        isCompanyOwner: false,
      }

      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Internship",
          description: "Description",
          location: "Location",
          paid: true,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        noMembershipCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("context_missing")
    })

    it("Invalid tool arguments should return validation_error", async () => {
      const companyCtx = createCompanyContext([Permission.CREATE_INTERNSHIPS])

      const result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          // Missing required fields
          title: "", // Empty title should fail validation
        },
        companyCtx
      )

      const denial = getDenial(result)
      expect(result.allowed).toBe(false)
      expect(denial?.type).toBe("validation_error")
    })

    it("Student accessing student-owned tools should succeed", async () => {
      const studentCtx = createStudentContext()

      const result = await validateAndAuthorizeToolCall("get_portfolio", {}, studentCtx)

      expect(result.allowed).toBe(true)
    })

    it("Company owner with all permissions should access all company tools", async () => {
      const ownerCtx = createCompanyContext([
        Permission.CREATE_INTERNSHIPS,
        Permission.SEARCH_CANDIDATES,
        Permission.SCHEDULE_INTERVIEWS,
        Permission.VIEW_APPLICATIONS,
        Permission.MANAGE_APPLICATIONS,
      ])

      // Test create_internship
      let result = await validateAndAuthorizeToolCall(
        "create_internship",
        {
          title: "Internship",
          description: "Description",
          location: "Location",
          paid: true,
          applicationStart: "2024-01-01",
          applicationEnd: "2024-12-31",
        },
        ownerCtx
      )
      expect(result.allowed).toBe(true)

      // Test search_candidates
      result = await validateAndAuthorizeToolCall(
        "search_candidates",
        { query: "developer" },
        ownerCtx
      )
      expect(result.allowed).toBe(true)

      // Test schedule_interview
      result = await validateAndAuthorizeToolCall(
        "schedule_interview",
        {
          applicationId: "app_123",
          scheduledAt: "2024-06-01T10:00:00Z",
        },
        ownerCtx
      )
      expect(result.allowed).toBe(true)
    })

    it("getContextForTools should return simplified context", () => {
      const fullCtx = createCompanyContext([Permission.CREATE_INTERNSHIPS])
      const toolCtx = getContextForTools(fullCtx)

      expect(toolCtx.userId).toBe(fullCtx.userId)
      expect(toolCtx.companyId).toBe(fullCtx.companyId)
      expect(toolCtx.permissions).toEqual(fullCtx.permissions)
      expect(toolCtx.role).toBe(fullCtx.role)
      expect(toolCtx.isCompanyOwner).toBe(fullCtx.isCompanyOwner)
    })

    it("assertResourceBelongsToCompany should validate ownership", () => {
      expect(assertResourceBelongsToCompany("company_123", "company_123")).toBe(true)
      expect(assertResourceBelongsToCompany("company_123", "other_company")).toBe(false)
      expect(assertResourceBelongsToCompany("company_123", undefined)).toBe(false)
    })

    it("assertResourceBelongsToUser should validate ownership", () => {
      expect(assertResourceBelongsToUser("user_123", "user_123")).toBe(true)
      expect(assertResourceBelongsToUser("user_123", "other_user")).toBe(false)
    })

    it("checkPermission should work correctly", () => {
      const ctx = createCompanyContext([Permission.CREATE_INTERNSHIPS])

      expect(checkPermission(ctx, Permission.CREATE_INTERNSHIPS)).toBe(true)
      expect(checkPermission(ctx, Permission.DELETE_COMPANY)).toBe(false)
    })

    it("assertCompanyScope should validate company context", () => {
      const validCtx = createCompanyContext([])
      const invalidCtx: EnhancedUserContext = {
        ...createCompanyContext([]),
        companyId: undefined,
        hasCompanyMembership: false,
      }

      expect(assertCompanyScope(validCtx).allowed).toBe(true)
      expect(assertCompanyScope(invalidCtx).allowed).toBe(false)
    })
  })

  describe("Denial Response Builders", () => {
    it("getPermissionDeniedResponse should include required permission", () => {
      const ctx = createCompanyContext([])
      const response = getPermissionDeniedResponse(
        "create_internship",
        Permission.CREATE_INTERNSHIPS,
        ctx
      )

      expect(response.type).toBe("permission_denied")
      expect(response.requiredPermission).toBe("CREATE_INTERNSHIPS")
      expect(response.reply).toContain("permission")
    })

    it("getScopeDeniedResponse should include resource info", () => {
      const response = getScopeDeniedResponse(
        "update_application_status",
        "COMPANY_OWNED",
        { resourceType: "application", resourceId: "app_123" }
      )

      expect(response.type).toBe("scope_denied")
      expect(response.reply).toContain("company")
    })

    it("getContextMissingResponse should indicate missing context", () => {
      const response = getContextMissingResponse("create_internship", "companyId")

      expect(response.type).toBe("context_missing")
      expect(response.reply).toContain("company")
    })
  })

  describe("Tool Input Validation", () => {
    it("should validate correct input for create_internship", () => {
      const result = validateToolInput("create_internship", {
        title: "Software Engineer",
        description: "Great opportunity",
        location: "Remote",
        paid: true,
        applicationStart: "2024-01-01",
        applicationEnd: "2024-12-31",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe("Software Engineer")
      }
    })

    it("should reject invalid input for create_internship", () => {
      const result = validateToolInput("create_internship", {
        // Missing required fields
      })

      const error = getValidationError(result)
      expect(result.success).toBe(false)
      expect(error).toContain("title")
    })

    it("should handle invalid tool name in validation", () => {
      const result = validateToolInput("nonexistent_tool", {})

      const error = getValidationError(result)
      expect(result.success).toBe(false)
      expect(error).toContain("Unknown tool")
    })
  })
})

describe("Additional Edge Cases", () => {
  it("should handle tools with no required fields", async () => {
    const studentCtx = createStudentContext()

    const result = await validateAndAuthorizeToolCall("get_dashboard_stats", {}, studentCtx)

    expect(result.allowed).toBe(true)
  })

  it("should handle optional fields correctly", async () => {
    const studentCtx = createStudentContext()

    const result = await validateAndAuthorizeToolCall(
      "search_internships",
      { query: "developer" }, // Only query, other fields optional
      studentCtx
    )

    expect(result.allowed).toBe(true)
  })

  it("should handle array fields correctly", async () => {
    const companyCtx = createCompanyContext([Permission.SEARCH_CANDIDATES])

    const result = await validateAndAuthorizeToolCall(
      "search_candidates",
      { skills: ["javascript", "typescript"] },
      companyCtx
    )

    expect(result.allowed).toBe(true)
  })

  it("should handle enum fields correctly", async () => {
    const studentCtx = createStudentContext()

    const result = await validateAndAuthorizeToolCall(
      "list_interviews",
      { status: "SCHEDULED" },
      studentCtx
    )

    expect(result.allowed).toBe(true)
  })

  it("should reject invalid enum values", async () => {
    const studentCtx = createStudentContext()

    const result = await validateAndAuthorizeToolCall(
      "list_interviews",
      { status: "INVALID_STATUS" },
      studentCtx
    )

    const denial = getDenial(result)
    expect(result.allowed).toBe(false)
    expect(denial?.type).toBe("validation_error")
  })
})
