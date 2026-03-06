# AI Mode Execution Plan — Role-Based AI Agent

> **Version:** 1.0  
> **Date:** 2026-02-16  
> **Status:** Draft  
> **Scope:** LynkSkill AI Assistant (Linky) — Role-Based Permission Enforcement

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Types and Capabilities Matrix](#2-user-types-and-capabilities-matrix)
3. [The 8 Core Tasks](#3-the-8-core-tasks)
4. [Permission-to-Tool Mapping](#4-permission-to-tool-mapping)
5. [Implementation Architecture](#5-implementation-architecture)
6. [Request/Response Format](#6-requestresponse-format)

---

## 1. Overview

### Purpose of the Role-Based AI Mode

The role-based AI mode transforms Linky from a simple two-mode assistant (student vs. company) into a **permission-aware agent** that dynamically adjusts its capabilities based on the authenticated user's role and granted permissions. This ensures:

- **Security**: Users can only perform actions they are authorized for
- **Contextual UX**: The AI only suggests actions the user can actually execute
- **Compliance**: Company-level permission policies are enforced at the AI layer
- **Scalability**: New roles and permissions integrate automatically

### How It Differs from Current Implementation

| Aspect | Current (`ai-mode/route.ts` + `agent/route.ts`) | New Role-Based Mode |
|--------|--------------------------------------------------|---------------------|
| **User classification** | Binary: `student` or `company` | Granular: `STUDENT`, `OWNER`, `ADMIN`, `HR_MANAGER`, `HR_RECRUITER`, `MEMBER`, `VIEWER` |
| **Tool selection** | `getToolsForRole("student" \| "company")` — all company users get the same tools | `getToolsForPermissions(permissions[])` — tools filtered by actual permissions |
| **Permission checks** | None at AI layer; only at API route level | Pre-execution permission validation before every tool call |
| **System prompt** | Two static prompts (`STUDENT_SYSTEM_PROMPT`, `COMPANY_SYSTEM_PROMPT`) | Dynamic prompts generated from role + permissions context |
| **Error handling** | Generic API errors | Permission-specific denial messages with guidance |

### Two-Level Permission System

The AI agent operates within a **two-level permission hierarchy**:

```
┌─────────────────────────────────────────────┐
│  Level 1: User-Level (Platform Role)        │
│  ─────────────────────────────────────────  │
│  Determined by `user.role` in the database  │
│  Values: STUDENT | COMPANY | TEAM_MEMBER    │
│  Controls: Which top-level features are     │
│  accessible (student features vs company    │
│  features)                                  │
├─────────────────────────────────────────────┤
│  Level 2: Company-Level (Member Role)       │
│  ─────────────────────────────────────────  │
│  Determined by `companyMember.defaultRole`  │
│  + `customRole.permissions`                 │
│  + `extraPermissions`                       │
│  Values: OWNER | ADMIN | HR_MANAGER |       │
│  HR_RECRUITER | MEMBER | VIEWER             │
│  Controls: Which company actions the AI     │
│  can execute on behalf of the user          │
└─────────────────────────────────────────────┘
```

**Resolution order:**
1. Check `defaultRole` → get base permissions from `DEFAULT_ROLE_PERMISSIONS`
2. Merge `customRole.permissions` (if assigned)
3. Merge `extraPermissions` (individually granted by owner/admin)
4. Final set = union of all three sources

---

## 2. User Types and Capabilities Matrix

### 2.1 STUDENT Role

Students interact with the platform as job seekers. They have a fixed set of capabilities that do not use the company permission system.

| Capability | Allowed | AI Tool |
|------------|---------|---------|
| Search/browse internships | ✅ | `search_internships` |
| View internship details | ✅ | `get_internship_details` |
| Apply to internships | ✅ | `apply_to_internship` |
| View own applications | ✅ | `list_my_applications` |
| Save/bookmark internships | ✅ | `save_internship`, `list_saved_internships` |
| View/update own portfolio | ✅ | `get_portfolio`, `update_portfolio` |
| View own assignments | ✅ | `list_assignments` |
| Submit assignments | ✅ | *(future: `submit_assignment`)* |
| View interviews | ✅ | `list_interviews` |
| View/send messages | ✅ | `list_conversations`, `send_message` |
| View dashboard stats | ✅ | `get_dashboard_stats` |
| Create internships | ❌ | — |
| Manage applications | ❌ | — |
| Search candidates | ❌ | — |
| Schedule interviews | ❌ | — |
| Manage team members | ❌ | — |
| Grade experiences | ❌ | — |

### 2.2 COMPANY / TEAM_MEMBER Roles (6 Levels)

Company users are governed by the Prisma `Permission` enum. Each default role maps to a predefined set of permissions (defined in [`lib/role-permissions.ts`](lib/role-permissions.ts)).

#### Full Permission Matrix

| Permission | OWNER (L6) | ADMIN (L5) | HR_MANAGER (L4) | HR_RECRUITER (L3) | MEMBER (L2) | VIEWER (L1) |
|------------|:----------:|:----------:|:----------------:|:------------------:|:-----------:|:-----------:|
| **Company Management** | | | | | | |
| `DELETE_COMPANY` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `EDIT_COMPANY` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `TRANSFER_OWNERSHIP` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Member Management** | | | | | | |
| `MANAGE_MEMBERS` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `INVITE_MEMBERS` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `REMOVE_MEMBERS` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `CHANGE_ROLES` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `DELEGATE_PERMISSIONS` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Internship Management** | | | | | | |
| `CREATE_INTERNSHIPS` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `EDIT_INTERNSHIPS` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `DELETE_INTERNSHIPS` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Application Management** | | | | | | |
| `VIEW_APPLICATIONS` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `MANAGE_APPLICATIONS` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `REVIEW_COVER_LETTERS` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Candidate Management** | | | | | | |
| `VIEW_CANDIDATES` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `SEARCH_CANDIDATES` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Interview Management** | | | | | | |
| `SCHEDULE_INTERVIEWS` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `CONDUCT_INTERVIEWS` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Messaging** | | | | | | |
| `SEND_MESSAGES` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `VIEW_MESSAGES` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Experience & Assignments** | | | | | | |
| `CREATE_ASSIGNMENTS` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GRADE_EXPERIENCES` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Role Summaries

**OWNER (Level 6)** — Full access to everything. The only role that can delete the company or transfer ownership.

**ADMIN (Level 5)** — Same as Owner except: cannot `DELETE_COMPANY` or `TRANSFER_OWNERSHIP`. Can manage all team members and delegate permissions.

**HR_MANAGER (Level 4)** — Full internship lifecycle management. Can create/edit/delete internships, manage all applications, search candidates, schedule and conduct interviews, create assignments, and grade experiences. Can invite new members but cannot remove them or change roles.

**HR_RECRUITER (Level 3)** — Application and candidate focused. Can view/manage applications, search candidates, schedule/conduct interviews, and communicate via messages. Cannot create or modify internship postings or assignments.

**MEMBER (Level 2)** — Basic team participant. Can view candidates and applications, send and view messages. Joined via invitation code with minimal default permissions.

**VIEWER (Level 1)** — Read-only access. Can view candidates and view messages only. No write operations.

---

## 3. The 8 Core Tasks

### Task 1: Internship Management

**Actions:** `CREATE`, `EDIT`, `DELETE` internships

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| Create internship | `CREATE_INTERNSHIPS` | OWNER, ADMIN, HR_MANAGER |
| Edit internship | `EDIT_INTERNSHIPS` | OWNER, ADMIN, HR_MANAGER |
| Delete internship | `DELETE_INTERNSHIPS` | OWNER, ADMIN, HR_MANAGER |
| List company internships | *(any company member)* | All company roles |
| View internship details | *(any authenticated user)* | All roles including STUDENT |

**AI Behavior:**
- For roles without `CREATE_INTERNSHIPS`: Linky will not offer to create internships and will explain the limitation if asked
- For roles with full access: Linky gathers required fields (title, description, location, dates, paid status) before executing

---

### Task 2: Application Management

**Actions:** `VIEW`, `MANAGE`, `ACCEPT`, `REJECT` applications

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| View applications | `VIEW_APPLICATIONS` | OWNER, ADMIN, HR_MANAGER, HR_RECRUITER, MEMBER |
| Accept/reject applications | `MANAGE_APPLICATIONS` | OWNER, ADMIN, HR_MANAGER, HR_RECRUITER |
| Review cover letters | `REVIEW_COVER_LETTERS` | OWNER, ADMIN, HR_MANAGER, HR_RECRUITER |
| Submit application (student) | *(student-only)* | STUDENT |

**AI Behavior:**
- MEMBER role: Can view applications but Linky will not offer accept/reject actions
- VIEWER role: Cannot access applications at all
- STUDENT role: Can view own applications and apply to internships

---

### Task 3: Candidate Search

**Actions:** `SEARCH_CANDIDATES`, `VIEW_CANDIDATES`

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| Search candidates by skills | `SEARCH_CANDIDATES` | OWNER, ADMIN, HR_MANAGER, HR_RECRUITER |
| View candidate profiles | `VIEW_CANDIDATES` | All company roles |

**AI Behavior:**
- VIEWER/MEMBER: Can view candidate profiles if linked, but cannot perform searches
- HR_RECRUITER+: Linky proactively suggests candidate searches based on open internship requirements

---

### Task 4: Interview Scheduling

**Actions:** `SCHEDULE_INTERVIEWS`, `CONDUCT_INTERVIEWS`

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| Schedule interviews | `SCHEDULE_INTERVIEWS` | OWNER, ADMIN, HR_MANAGER, HR_RECRUITER |
| Conduct/manage interviews | `CONDUCT_INTERVIEWS` | OWNER, ADMIN, HR_MANAGER, HR_RECRUITER |
| View interviews | *(any member)* | All roles |

**AI Behavior:**
- Linky confirms date/time and candidate details before scheduling
- For students: Linky shows upcoming interviews and preparation tips

---

### Task 5: Portfolio Management

**Actions:** `VIEW`, `UPDATE` own portfolio

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| View own portfolio | *(student-only)* | STUDENT |
| Update portfolio fields | *(student-only)* | STUDENT |

**AI Behavior:**
- Only available to STUDENT role
- Linky can audit the portfolio, suggest improvements, and directly update fields
- Company users asking about portfolios are redirected to candidate search

---

### Task 6: Assignment Management

**Actions:** `CREATE`, `VIEW`, `GRADE` assignments

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| Create assignments | `CREATE_ASSIGNMENTS` | OWNER, ADMIN, HR_MANAGER |
| Grade experiences | `GRADE_EXPERIENCES` | OWNER, ADMIN, HR_MANAGER |
| View assignments (company) | *(any company member)* | All company roles |
| View assignments (student) | *(student-only)* | STUDENT |
| Submit assignments | *(student-only)* | STUDENT |

**AI Behavior:**
- HR_RECRUITER and below cannot create or grade assignments
- Students can view their assignments and get help understanding requirements

---

### Task 7: Messaging

**Actions:** `SEND_MESSAGES`, `VIEW_MESSAGES`

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| Send messages | `SEND_MESSAGES` | OWNER, ADMIN, HR_MANAGER, HR_RECRUITER, MEMBER, STUDENT |
| View messages | `VIEW_MESSAGES` | All roles |

**AI Behavior:**
- VIEWER: Can read messages but Linky will not offer to send replies
- All other roles: Linky can compose and send messages on behalf of the user
- Students: Full messaging capability for conversations with companies

---

### Task 8: Team/Member Management

**Actions:** `INVITE`, `REMOVE`, `CHANGE_ROLES`

| Action | Required Permission | Eligible Roles |
|--------|-------------------|----------------|
| Invite members | `INVITE_MEMBERS` | OWNER, ADMIN, HR_MANAGER |
| Remove members | `REMOVE_MEMBERS` | OWNER, ADMIN |
| Change roles | `CHANGE_ROLES` | OWNER, ADMIN |
| Delegate permissions | `DELEGATE_PERMISSIONS` | OWNER, ADMIN |
| Manage members (full) | `MANAGE_MEMBERS` | OWNER, ADMIN |

**AI Behavior:**
- Not currently exposed as AI tools (managed via UI)
- Future consideration: Linky could help OWNER/ADMIN invite members or adjust roles
- Role hierarchy enforced: `canManageRole()` from [`lib/role-permissions.ts:378`](lib/role-permissions.ts:378)

---

## 4. Permission-to-Tool Mapping

Each AI agent tool requires specific permissions. The agent must validate permissions **before** executing any tool.

### Company Tools

| AI Tool | Required Permission(s) | Description |
|---------|----------------------|-------------|
| `create_internship` | `CREATE_INTERNSHIPS` | Create a new internship posting |
| `edit_internship` | `EDIT_INTERNSHIPS` | Modify an existing internship |
| `delete_internship` | `DELETE_INTERNSHIPS` | Remove an internship posting |
| `list_internships` | *(any company member)* | List company's internship postings |
| `get_internship_details` | *(any authenticated)* | View details of a specific internship |
| `list_received_applications` | `VIEW_APPLICATIONS` | List applications for company internships |
| `update_application_status` | `MANAGE_APPLICATIONS` | Accept or reject an application |
| `search_candidates` | `SEARCH_CANDIDATES` | Search student candidates by skills |
| `view_candidates` | `VIEW_CANDIDATES` | View candidate profile details |
| `schedule_interview` | `SCHEDULE_INTERVIEWS` | Schedule an interview with a candidate |
| `conduct_interview` | `CONDUCT_INTERVIEWS` | Manage/update interview status |
| `send_message` | `SEND_MESSAGES` | Send a message in a conversation |
| `list_conversations` | `VIEW_MESSAGES` | List message conversations |
| `create_assignment` | `CREATE_ASSIGNMENTS` | Create an assignment for interns |
| `grade_experience` | `GRADE_EXPERIENCES` | Grade/endorse an intern's experience |

### Student Tools (No Permission Check Required)

| AI Tool | Description |
|---------|-------------|
| `search_internships` | Search available internships |
| `get_internship_details` | View internship details |
| `apply_to_internship` | Submit an application |
| `list_my_applications` | View own applications |
| `save_internship` | Bookmark an internship |
| `list_saved_internships` | View saved internships |
| `get_portfolio` | View own portfolio |
| `update_portfolio` | Update portfolio fields |
| `list_assignments` | View assigned tasks |
| `list_interviews` | View interview schedule |
| `list_conversations` | View message threads |
| `send_message` | Send a message |
| `get_dashboard_stats` | View dashboard overview |

### Tool Filtering Function (Proposed)

```typescript
// Replace current getToolsForRole() in lib/agent-tools.ts
export function getToolsForPermissions(
  role: "STUDENT" | "COMPANY" | "TEAM_MEMBER",
  permissions: Permission[]
): Tool[] {
  if (role === "STUDENT") {
    return [...COMMON_TOOLS, ...STUDENT_ONLY_TOOLS]
  }

  // Company/Team Member: filter tools by permissions
  const availableTools = [...COMMON_TOOLS]

  const TOOL_PERMISSION_MAP: Record<string, Permission | null> = {
    list_internships: null, // any company member
    get_internship_details: null,
    create_internship: Permission.CREATE_INTERNSHIPS,
    list_received_applications: Permission.VIEW_APPLICATIONS,
    update_application_status: Permission.MANAGE_APPLICATIONS,
    search_candidates: Permission.SEARCH_CANDIDATES,
    schedule_interview: Permission.SCHEDULE_INTERVIEWS,
    // Common tools with permission gates
    send_message: Permission.SEND_MESSAGES,
    list_conversations: Permission.VIEW_MESSAGES,
  }

  for (const tool of COMPANY_ONLY_TOOLS) {
    const requiredPerm = TOOL_PERMISSION_MAP[tool.function.name]
    if (requiredPerm === null || permissions.includes(requiredPerm)) {
      availableTools.push(tool)
    }
  }

  return availableTools
}
```

---

## 5. Implementation Architecture

### 5.1 User Context Resolution

The AI agent must resolve the full user context before processing any request. This extends the current [`resolveUserContext()`](app/api/assistant/agent/route.ts:89) function.

```typescript
interface EnhancedUserContext extends UserContext {
  clerkId: string
  userId: string
  role: "STUDENT" | "COMPANY" | "TEAM_MEMBER"
  companyId?: string
  companyRole?: DefaultCompanyRole  // NEW: OWNER, ADMIN, etc.
  permissions: Permission[]          // NEW: resolved permission set
  customRoleName?: string            // NEW: for display purposes
}

async function resolveEnhancedUserContext(
  clerkId: string
): Promise<EnhancedUserContext | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true },
  })
  if (!user) return null

  const ctx: EnhancedUserContext = {
    clerkId,
    userId: user.id,
    role: user.role as "STUDENT" | "COMPANY" | "TEAM_MEMBER",
    permissions: [],
  }

  if (user.role !== "STUDENT") {
    const membership = await getUserCompanyByClerkId(clerkId)
    if (membership) {
      ctx.companyId = membership.companyId
      ctx.companyRole = membership.defaultRole ?? undefined
      ctx.permissions = getMemberPermissions(membership)
      ctx.customRoleName = membership.customRole?.name
    }
  }

  return ctx
}
```

### 5.2 Permission Checking Flow

```
┌──────────────────┐
│  User sends      │
│  message to AI   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Resolve user    │
│  context + perms │
│  (auth + DB)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Filter tools    │
│  by permissions  │
│  (getToolsFor    │
│  Permissions)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Generate system │
│  prompt with     │
│  role context    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Send to OpenAI  │
│  with filtered   │
│  tool list       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  OpenAI returns  │────▶│  Tool call?      │
│  response        │     │                  │
└──────────────────┘     └────────┬─────────┘
                                  │
                         ┌────────┴─────────┐
                         │ YES              │ NO
                         ▼                  ▼
                  ┌──────────────┐   ┌──────────────┐
                  │ DOUBLE-CHECK │   │ Return text  │
                  │ permission   │   │ response     │
                  │ before exec  │   └──────────────┘
                  └──────┬───────┘
                         │
                  ┌──────┴───────┐
                  │ ALLOWED?     │
                  ▼              ▼
           ┌───────────┐  ┌───────────────┐
           │ Execute   │  │ Return denial │
           │ tool      │  │ message       │
           └───────────┘  └───────────────┘
```

### 5.3 Pre-Execution Permission Validation

Even though tools are filtered before being sent to OpenAI, a **second permission check** must occur before execution to prevent prompt injection or model hallucination from invoking unauthorized tools.

```typescript
const TOOL_REQUIRED_PERMISSIONS: Record<string, Permission | null> = {
  // Company tools
  create_internship: Permission.CREATE_INTERNSHIPS,
  list_received_applications: Permission.VIEW_APPLICATIONS,
  update_application_status: Permission.MANAGE_APPLICATIONS,
  search_candidates: Permission.SEARCH_CANDIDATES,
  schedule_interview: Permission.SCHEDULE_INTERVIEWS,
  send_message: Permission.SEND_MESSAGES,
  list_conversations: Permission.VIEW_MESSAGES,
  // Tools with no specific permission (any company member)
  list_internships: null,
  get_internship_details: null,
  get_dashboard_stats: null,
  list_interviews: null,
  list_assignments: null,
}

function validateToolPermission(
  toolName: string,
  ctx: EnhancedUserContext
): { allowed: boolean; reason?: string } {
  // Student tools are always allowed for students
  if (ctx.role === "STUDENT") {
    const studentTools = ["search_internships", "get_internship_details",
      "list_my_applications", "apply_to_internship", "get_portfolio",
      "update_portfolio", "save_internship", "list_saved_internships",
      "get_dashboard_stats", "list_interviews", "list_conversations",
      "send_message", "list_assignments"]
    if (studentTools.includes(toolName)) return { allowed: true }
    return { allowed: false, reason: "This action is not available for students" }
  }

  // Company/Team Member permission check
  const requiredPerm = TOOL_REQUIRED_PERMISSIONS[toolName]
  if (requiredPerm === null || requiredPerm === undefined) {
    return { allowed: true } // No specific permission needed
  }
  if (ctx.permissions.includes(requiredPerm)) {
    return { allowed: true }
  }
  return {
    allowed: false,
    reason: `You don't have the "${requiredPerm}" permission. Contact your company admin to request access.`
  }
}
```

### 5.4 Error Handling for Denied Permissions

When a permission check fails, the AI should return a **helpful, non-technical** response:

```typescript
interface PermissionDenialResponse {
  type: "permission_denied"
  tool: string
  requiredPermission: string
  userRole: string
  message: string  // User-friendly message
  suggestion: string  // What the user can do instead
}

// Example denial responses:
const DENIAL_TEMPLATES: Record<string, { message: string; suggestion: string }> = {
  CREATE_INTERNSHIPS: {
    message: "I can't create internships with your current role.",
    suggestion: "Ask your HR Manager or Admin to create the internship, or request the CREATE_INTERNSHIPS permission."
  },
  MANAGE_APPLICATIONS: {
    message: "I can't accept or reject applications with your current permissions.",
    suggestion: "You can still view applications. Ask an HR Manager or Admin to process this application."
  },
  SEARCH_CANDIDATES: {
    message: "Candidate search isn't available with your current role.",
    suggestion: "You can view candidates that have been shared with you. Ask your team lead for search access."
  },
}
```

### 5.5 Role-Specific System Prompts

Replace the current binary prompt system with dynamic prompt generation:

```typescript
function generateSystemPrompt(ctx: EnhancedUserContext): string {
  if (ctx.role === "STUDENT") {
    return STUDENT_AGENT_PROMPT // Existing student prompt
  }

  // Build company prompt dynamically
  const roleName = ctx.companyRole
    ? ROLE_DISPLAY_INFO[ctx.companyRole].label
    : ctx.customRoleName || "Team Member"

  const capabilities = buildCapabilityList(ctx.permissions)
  const restrictions = buildRestrictionList(ctx.permissions)

  return `You are Linky, the AI Agent for LynkSkill.

You are assisting a company team member with the role: **${roleName}**

YOUR CAPABILITIES (based on this user's permissions):
${capabilities}

RESTRICTIONS (actions you CANNOT perform for this user):
${restrictions}

IMPORTANT RULES:
1. NEVER attempt to perform actions outside the user's permissions
2. If asked to do something you can't, explain why and suggest who can help
3. Only suggest actions that are within the user's permission set
4. Be professional, efficient, and action-oriented
5. Use emojis occasionally 🎯💼✨
6. Only answer questions related to LynkSkill and recruitment

FORMATTING:
- Use **bold** for important info
- Use bullet points for lists
- After showing results, suggest 2-3 relevant follow-up actions (within permissions)`
}

function buildCapabilityList(permissions: Permission[]): string {
  const capabilities: string[] = []

  if (permissions.includes(Permission.CREATE_INTERNSHIPS))
    capabilities.push("- Create new internship postings")
  if (permissions.includes(Permission.EDIT_INTERNSHIPS))
    capabilities.push("- Edit existing internships")
  if (permissions.includes(Permission.DELETE_INTERNSHIPS))
    capabilities.push("- Delete internships")
  if (permissions.includes(Permission.VIEW_APPLICATIONS))
    capabilities.push("- View received applications")
  if (permissions.includes(Permission.MANAGE_APPLICATIONS))
    capabilities.push("- Accept or reject applications")
  if (permissions.includes(Permission.SEARCH_CANDIDATES))
    capabilities.push("- Search for candidates by skills")
  if (permissions.includes(Permission.VIEW_CANDIDATES))
    capabilities.push("- View candidate profiles")
  if (permissions.includes(Permission.SCHEDULE_INTERVIEWS))
    capabilities.push("- Schedule interviews with candidates")
  if (permissions.includes(Permission.CONDUCT_INTERVIEWS))
    capabilities.push("- Manage and conduct interviews")
  if (permissions.includes(Permission.SEND_MESSAGES))
    capabilities.push("- Send messages to candidates")
  if (permissions.includes(Permission.VIEW_MESSAGES))
    capabilities.push("- View message conversations")
  if (permissions.includes(Permission.CREATE_ASSIGNMENTS))
    capabilities.push("- Create assignments for interns")
  if (permissions.includes(Permission.GRADE_EXPERIENCES))
    capabilities.push("- Grade intern experiences")

  return capabilities.length > 0
    ? capabilities.join("\n")
    : "- View-only access to company data"
}

function buildRestrictionList(permissions: Permission[]): string {
  const allCompanyPerms = Object.values(Permission)
  const missing = allCompanyPerms.filter(p => !permissions.includes(p))

  if (missing.length === 0) return "- No restrictions (full access)"

  const restrictions: string[] = []
  if (!permissions.includes(Permission.CREATE_INTERNSHIPS))
    restrictions.push("- Cannot create, edit, or delete internships")
  if (!permissions.includes(Permission.MANAGE_APPLICATIONS))
    restrictions.push("- Cannot accept or reject applications")
  if (!permissions.includes(Permission.SEARCH_CANDIDATES))
    restrictions.push("- Cannot search for candidates")
  if (!permissions.includes(Permission.SCHEDULE_INTERVIEWS))
    restrictions.push("- Cannot schedule interviews")
  if (!permissions.includes(Permission.SEND_MESSAGES))
    restrictions.push("- Cannot send messages")
  if (!permissions.includes(Permission.CREATE_ASSIGNMENTS))
    restrictions.push("- Cannot create assignments or grade experiences")

  return restrictions.join("\n")
}
```

---

## 6. Request/Response Format

### 6.1 Request Format

The client sends a POST request to the AI agent endpoint:

```typescript
// POST /api/assistant/agent
interface AgentRequest {
  message: string
  conversationHistory: {
    role: "user" | "assistant"
    content: string
  }[]
  // Note: userType, role, and permissions are resolved server-side
  // from the authenticated session — NOT sent by the client
}
```

**Server-side enrichment** (not client-provided):

```typescript
interface ResolvedAgentRequest {
  message: string
  conversationHistory: ConversationMessage[]
  userContext: EnhancedUserContext  // Resolved from auth
  availableTools: Tool[]            // Filtered by permissions
  systemPrompt: string              // Generated from role
}
```

### 6.2 Response Format

#### Standard Text Response

```typescript
interface AgentTextResponse {
  type: "text"
  reply: string
  role: string          // User's role for UI context
  permissions: string[] // Active permissions for UI tool hints
}
```

#### Tool Execution Response

```typescript
interface AgentToolResponse {
  type: "tool_result"
  reply: string           // AI's natural language summary
  toolResults: {
    tool: string          // Tool name that was executed
    success: boolean
    cardType: string      // UI card type for rendering
    title: string         // Card title
    data: unknown         // Tool-specific data
  }[]
  role: string
  permissions: string[]
}
```

#### Permission Denied Response

```typescript
interface AgentDeniedResponse {
  type: "permission_denied"
  reply: string           // Friendly explanation
  deniedTool: string      // Which tool was denied
  requiredPermission: string
  userRole: string
  suggestion: string      // What the user can do instead
}
```

### 6.3 Role-Specific Response Examples

**STUDENT asking to search internships:**
```json
{
  "type": "tool_result",
  "reply": "I found 5 internships matching 'React developer'! 🎯 Here are the top matches:",
  "toolResults": [{
    "tool": "search_internships",
    "success": true,
    "cardType": "internship_list",
    "title": "Internship Search Results",
    "data": { "internships": [...], "total": 5 }
  }],
  "role": "STUDENT",
  "permissions": []
}
```

**HR_RECRUITER asking to create an internship (denied):**
```json
{
  "type": "permission_denied",
  "reply": "I can't create internships with your current HR Recruiter role. 😊 This action requires the CREATE_INTERNSHIPS permission, which is available to HR Managers, Admins, and Owners.",
  "deniedTool": "create_internship",
  "requiredPermission": "CREATE_INTERNSHIPS",
  "userRole": "HR_RECRUITER",
  "suggestion": "Ask your HR Manager or Admin to create this internship posting."
}
```

**OWNER creating an internship:**
```json
{
  "type": "tool_result",
  "reply": "I've created the internship posting 'Frontend Developer Intern'! 🚀 It's now live and accepting applications.",
  "toolResults": [{
    "tool": "create_internship",
    "success": true,
    "cardType": "internship_created",
    "title": "Internship Created",
    "data": { "id": "...", "title": "Frontend Developer Intern", "status": "ACTIVE" }
  }],
  "role": "OWNER",
  "permissions": ["CREATE_INTERNSHIPS", "EDIT_INTERNSHIPS", "..."]
}
```

**VIEWER asking to view messages:**
```json
{
  "type": "tool_result",
  "reply": "Here are your recent conversations 📬",
  "toolResults": [{
    "tool": "list_conversations",
    "success": true,
    "cardType": "conversation_list",
    "title": "Messages",
    "data": { "conversations": [...] }
  }],
  "role": "VIEWER",
  "permissions": ["VIEW_CANDIDATES", "VIEW_MESSAGES"]
}
```

---

## Implementation Checklist

- [ ] Extend `UserContext` to `EnhancedUserContext` with permissions in [`lib/agent-tools.ts`](lib/agent-tools.ts)
- [ ] Create `getToolsForPermissions()` to replace `getToolsForRole()` in [`lib/agent-tools.ts:301`](lib/agent-tools.ts:301)
- [ ] Add `TOOL_REQUIRED_PERMISSIONS` map and `validateToolPermission()` function
- [ ] Update `resolveUserContext()` in [`app/api/assistant/agent/route.ts:89`](app/api/assistant/agent/route.ts:89) to resolve company membership and permissions
- [ ] Create dynamic system prompt generator (`generateSystemPrompt()`)
- [ ] Add pre-execution permission check in the tool execution loop
- [ ] Add permission denial response handling with user-friendly messages
- [ ] Update response format to include `role` and `permissions` fields
- [ ] Add unit tests for permission-to-tool mapping
- [ ] Add integration tests for each role level
- [ ] Update frontend to handle `permission_denied` response type
- [ ] Add UI indicators showing available actions based on user permissions
