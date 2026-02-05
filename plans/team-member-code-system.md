# Team Member Code System - Production Ready Plan

## 📋 Executive Summary

This document outlines the implementation plan for a **Team Member Code System** that allows company employees to join their organization during onboarding using a unique company invitation code, while restricting the invitation of external users (students and other company owners).

---

## 🎯 Goals

1. **New Role: TEAM_MEMBER** - A dedicated role for company employees joining via code
2. **Company Invitation Code** - Auto-generated `XXXX-XXXX-XXXX-XXXX` format code when company is created
3. **Onboarding Integration** - New onboarding path for team members to join via code
4. **Restricted Invitations** - Prevent inviting STUDENT or OWNER roles

---

## 📊 Current State Analysis

### Existing Roles
```
Application Level (User.role):
├── STUDENT
└── COMPANY

Company Level (DefaultCompanyRole):
├── OWNER (full access)
├── ADMIN (almost full access)
├── HR_MANAGER (recruitment focused)
├── HR_RECRUITER (limited recruitment)
└── VIEWER (read-only)
```

### Current Onboarding Flow
```
User Signs Up → Select Role:
├── STUDENT → Enter DOB → Complete Portfolio Setup
└── COMPANY → Enter Company Details → Become OWNER
```

### Current Invitation Flow
```
Owner/Admin → Send Email Invitation → User Receives Email
→ Click Link → Accept → Become CompanyMember
```

---

## 🏗️ Proposed Architecture

### New Role Structure
```
Application Level (User.role):
├── STUDENT
├── COMPANY (company owner)
└── TEAM_MEMBER (new - company employee)

Company Level (DefaultCompanyRole):
├── OWNER
├── ADMIN
├── HR_MANAGER
├── HR_RECRUITER
├── VIEWER
└── MEMBER (new - basic team member role)
```

### New Onboarding Flow
```
User Signs Up → Select Role:
├── STUDENT → Enter DOB → Complete Portfolio Setup
├── COMPANY → Enter Company Details → Become OWNER
└── TEAM_MEMBER (new) → Enter Code → Join Company with MEMBER role
```

---

## 📝 Database Schema Changes

### 1. Add Company Invitation Code to Company Model

```prisma
model Company {
  // ... existing fields ...
  
  // NEW: Invitation code for team members
  invitationCode     String    @unique @default(uuid())  // Will be formatted as XXXX-XXXX-XXXX-XXXX
  invitationCodeHash String?   // Optional: store hashed version for security
  codeExpiresAt      DateTime? // Optional: code expiration
  codeEnabled        Boolean   @default(true) // Owner can disable code
  maxTeamMembers     Int?      // Optional: limit team size
  
  // Track code usage
  codeUsageCount     Int       @default(0)
  lastCodeRegenAt    DateTime?
}
```

### 2. Update User Role Enum

```prisma
enum Role {
  STUDENT
  COMPANY
  TEAM_MEMBER  // NEW
}
```

### 3. Add MEMBER to DefaultCompanyRole

```prisma
enum DefaultCompanyRole {
  OWNER
  ADMIN
  HR_MANAGER
  HR_RECRUITER
  VIEWER
  MEMBER       // NEW - basic team member
}
```

### 4. Add Code Join History (Audit Trail)

```prisma
model CompanyCodeJoin {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  joinedAt    DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  
  @@index([companyId])
  @@index([userId])
}
```

---

## 🔧 Implementation Tasks

### Phase 1: Database & Models (Priority: Critical)

#### Task 1.1: Prisma Schema Updates
- [ ] Add `invitationCode` field to Company model
- [ ] Add `codeEnabled`, `codeExpiresAt`, `maxTeamMembers` fields
- [ ] Add `TEAM_MEMBER` to Role enum
- [ ] Add `MEMBER` to DefaultCompanyRole enum
- [ ] Create `CompanyCodeJoin` model for audit
- [ ] Run migration: `npx prisma migrate dev --name add-team-member-code-system`

#### Task 1.2: Code Generation Utility
```typescript
// lib/company-code.ts

/**
 * Generate a company invitation code in format: XXXX-XXXX-XXXX-XXXX
 * Uses cryptographically secure random generation
 */
export function generateCompanyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0,O,1,I,L)
  const segments = 4;
  const segmentLength = 4;
  
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % chars.length;
      segment += chars[randomIndex];
    }
    parts.push(segment);
  }
  
  return parts.join('-');
}

/**
 * Validate code format
 */
export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code);
}

/**
 * Normalize code (uppercase, trim)
 */
export function normalizeCode(code: string): string {
  return code.toUpperCase().trim().replace(/\s/g, '');
}
```

---

### Phase 2: API Endpoints (Priority: Critical)

#### Task 2.1: Company Code Management APIs

```typescript
// app/api/company/code/route.ts

// GET - Get company invitation code (owner/admin only)
// POST - Regenerate code (owner/admin only)
// PATCH - Enable/disable code (owner/admin only)
```

**Endpoint Specifications:**

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/company/code` | OWNER, ADMIN | Get current code |
| POST | `/api/company/code/regenerate` | OWNER, ADMIN | Generate new code |
| PATCH | `/api/company/code/toggle` | OWNER, ADMIN | Enable/disable code |
| GET | `/api/company/code/history` | OWNER, ADMIN | View join history |

#### Task 2.2: Code Validation & Join API

```typescript
// app/api/company/join/route.ts

// POST - Validate and join company via code
interface JoinByCodeRequest {
  code: string;
}

interface JoinByCodeResponse {
  success: boolean;
  company?: {
    id: string;
    name: string;
    logo: string;
  };
  error?: string;
}
```

**Validation Rules:**
1. Code must be valid format (XXXX-XXXX-XXXX-XXXX)
2. Code must exist in database
3. Code must be enabled
4. Code must not be expired (if expiration set)
5. Company must not exceed maxTeamMembers (if set)
6. User must not already be a member of another company
7. User must have TEAM_MEMBER role (set during onboarding)

---

### Phase 3: Onboarding Flow (Priority: Critical)

#### Task 3.1: Update Role Selection UI

```tsx
// app/onboarding/page.tsx - Update role selection

const roles = [
  {
    id: 'student',
    title: 'Студент',
    description: 'Търся стаж и опит',
    icon: GraduationCap,
  },
  {
    id: 'company',
    title: 'Компания',
    description: 'Създавам нова компания',
    icon: Building2,
  },
  {
    id: 'team_member',  // NEW
    title: 'Член на екип',
    description: 'Присъединявам се към съществуваща компания',
    icon: Users,
  },
];
```

#### Task 3.2: Create Team Member Onboarding Step

```tsx
// components/onboarding/team-member-step.tsx

interface TeamMemberStepProps {
  onComplete: (companyId: string) => void;
  onBack: () => void;
}

// UI Components:
// 1. Code input with 4 separate input fields (XXXX-XXXX-XXXX-XXXX)
// 2. Real-time validation
// 3. Company preview after valid code
// 4. Join confirmation button
// 5. Error states (invalid code, code disabled, company full, etc.)
```

#### Task 3.3: Onboarding Flow Logic

```
Team Member Onboarding Steps:
1. Select "Member of team" role
2. Enter company code (XXXX-XXXX-XXXX-XXXX)
3. View company preview (name, logo, location)
4. Confirm joining
5. Accept Terms of Service & Privacy Policy
6. Complete → Redirect to /dashboard/company
```

---

### Phase 4: Permissions & Restrictions (Priority: High)

#### Task 4.1: Update Permission System

```typescript
// lib/permissions.ts - Add MEMBER role permissions

export const DEFAULT_ROLE_PERMISSIONS: Record<DefaultCompanyRole, Permission[]> = {
  // ... existing roles ...
  
  MEMBER: [
    // Basic read-only permissions
    Permission.VIEW_COMPANY,
    Permission.VIEW_INTERNSHIPS,
    Permission.VIEW_APPLICATIONS,
    Permission.VIEW_CANDIDATES,
    Permission.VIEW_INTERVIEWS,
    Permission.VIEW_ANALYTICS,
    // Can communicate
    Permission.SEND_MESSAGES,
    // Can view own experiences
    Permission.VIEW_EXPERIENCES,
  ],
};
```

#### Task 4.2: Restrict Invitation System

```typescript
// app/api/company/invitations/route.ts - Update POST handler

// RESTRICTION: Cannot invite users who are:
// 1. Already STUDENT role → Forbidden
// 2. Already COMPANY (owner) role → Forbidden
// 3. Already a member of another company → Forbidden

// ALLOWED: Can only invite to roles:
// - VIEWER
// - HR_RECRUITER
// - HR_MANAGER
// - ADMIN (only by OWNER)
// - MEMBER

// FORBIDDEN: Cannot invite to:
// - OWNER role (ownership transfer only)
```

#### Task 4.3: Add Role Validation in Invitation

```typescript
// Validation function
function canBeInvited(targetUser: User): { allowed: boolean; reason?: string } {
  if (targetUser.role === 'STUDENT') {
    return { allowed: false, reason: 'Students cannot be invited to companies' };
  }
  
  if (targetUser.role === 'COMPANY') {
    return { allowed: false, reason: 'Company owners cannot be invited' };
  }
  
  if (targetUser.companyMembership) {
    return { allowed: false, reason: 'User is already a member of another company' };
  }
  
  return { allowed: true };
}
```

---

### Phase 5: Company Settings UI (Priority: High)

#### Task 5.1: Team Code Management Component

```tsx
// components/team/team-code-settings.tsx

interface TeamCodeSettingsProps {
  company: Company;
  onCodeRegenerated: () => void;
}

// Features:
// 1. Display current code (masked by default, reveal on click)
// 2. Copy code button
// 3. Regenerate code button (with confirmation)
// 4. Toggle enable/disable
// 5. Set expiration date (optional)
// 6. Set max team members (optional)
// 7. View join history
```

#### Task 5.2: Join History Component

```tsx
// components/team/join-history.tsx

// Display:
// - User name/avatar
// - Join date
// - IP address (admin only)
// - Actions: Remove member
```

---

### Phase 6: Auto-Generate Code on Company Creation (Priority: High)

#### Task 6.1: Update Company Creation

```typescript
// app/api/company/create/route.ts

// When creating company:
const companyCode = generateCompanyCode();

const company = await prisma.company.create({
  data: {
    // ... existing fields ...
    invitationCode: companyCode,
    codeEnabled: true,
    codeUsageCount: 0,
  },
});

// Also update onboarding endpoint
```

---

## 🔒 Security Considerations

### 1. Code Security
- **Rate Limiting**: Max 5 code attempts per IP per hour
- **Code Complexity**: 16 chars (4x4) = ~2.8 billion combinations
- **Audit Trail**: Log all join attempts (success and failure)
- **Code Rotation**: Allow manual regeneration, optional auto-rotation

### 2. Role Restrictions
- **STUDENT → Company**: Cannot switch directly, must create new account or contact support
- **COMPANY → Team Member**: Cannot downgrade, must transfer ownership first
- **One Company Rule**: User can only be member of ONE company at a time

### 3. Code Abuse Prevention
- **Cooldown**: 5-minute cooldown between code regenerations
- **Notification**: Notify owner when code is used
- **Max Uses**: Optional limit on code usage
- **IP Tracking**: Track joining IP for security audit

---

## 📱 UI/UX Design

### Code Input Component
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│        Въведете код за присъединяване              │
│                                                     │
│    ┌────┐   ┌────┐   ┌────┐   ┌────┐              │
│    │ABCD│ - │EFGH│ - │IJKL│ - │MNOP│              │
│    └────┘   └────┘   └────┘   └────┘              │
│                                                     │
│    ✓ Валиден код                                   │
│                                                     │
│    ┌─────────────────────────────────────────┐     │
│    │  🏢 ТехноКорп ООД                       │     │
│    │  📍 София, България                      │     │
│    │  👥 15 члена на екипа                    │     │
│    └─────────────────────────────────────────┘     │
│                                                     │
│         [Присъедини се към екипа]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Company Settings - Code Management
```
┌─────────────────────────────────────────────────────┐
│  Код за присъединяване                              │
│─────────────────────────────────────────────────────│
│                                                     │
│  Код: ABCD-EFGH-IJKL-MNOP  [👁️] [📋 Копирай]       │
│                                                     │
│  Статус: ● Активен                                  │
│  Използван: 15 пъти                                 │
│  Последно: 05.02.2026, 14:30                        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ☐ Автоматично изтичане след ___ дни               │
│  ☐ Максимум членове: ___                            │
│                                                     │
│  [🔄 Генерирай нов код]  [⏸️ Деактивирай]          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Migration Strategy

### Step 1: Database Migration
```bash
# Generate migration
npx prisma migrate dev --name add-team-member-code-system

# This will:
# 1. Add invitationCode to Company (with unique constraint)
# 2. Add TEAM_MEMBER to Role enum
# 3. Add MEMBER to DefaultCompanyRole enum
# 4. Create CompanyCodeJoin table
```

### Step 2: Backfill Existing Companies
```typescript
// scripts/backfill-company-codes.ts

const companies = await prisma.company.findMany({
  where: { invitationCode: null }
});

for (const company of companies) {
  await prisma.company.update({
    where: { id: company.id },
    data: { invitationCode: generateCompanyCode() }
  });
}
```

### Step 3: Deploy in Order
1. Deploy database migration
2. Run backfill script
3. Deploy API endpoints
4. Deploy onboarding UI changes
5. Deploy company settings UI

---

## ✅ Acceptance Criteria

### Must Have (MVP)
- [ ] Company invitation code generated on company creation
- [ ] Team member can join via code during onboarding
- [ ] Code can be viewed/copied by owner/admin
- [ ] Code can be regenerated
- [ ] Code can be enabled/disabled
- [ ] Students cannot be invited to companies
- [ ] Company owners cannot be invited to other companies
- [ ] MEMBER role with appropriate permissions

### Should Have
- [ ] Join history/audit trail
- [ ] Code expiration option
- [ ] Max team members limit
- [ ] Rate limiting on code attempts
- [ ] Notification when code is used

### Nice to Have
- [ ] Auto-rotate code periodically
- [ ] QR code for easy sharing
- [ ] Bulk code generation for events
- [ ] Code usage analytics

---

## 📊 Test Cases

### Unit Tests
1. Code generation produces valid format
2. Code validation accepts valid codes
3. Code validation rejects invalid formats
4. Permission check for MEMBER role
5. Invitation restriction for STUDENT users
6. Invitation restriction for COMPANY users

### Integration Tests
1. Full onboarding flow for team member
2. Code regeneration by owner
3. Code disable/enable toggle
4. Join company via valid code
5. Reject join with invalid code
6. Reject join when code disabled
7. Reject join when company full

### E2E Tests
1. Complete team member journey
2. Company owner manages code settings
3. Invitation restrictions work correctly

---

## 📅 Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database & Models | 2 days | None |
| Phase 2: API Endpoints | 3 days | Phase 1 |
| Phase 3: Onboarding Flow | 3 days | Phase 2 |
| Phase 4: Permissions | 2 days | Phase 1 |
| Phase 5: Company Settings UI | 2 days | Phase 2 |
| Phase 6: Auto-Generate | 1 day | Phase 1, 2 |
| Testing & QA | 3 days | All phases |
| **Total** | **~2-3 weeks** | |

---

## 🔗 Related Files to Modify

### Prisma
- `prisma/schema.prisma`

### API Routes
- `app/api/company/create/route.ts` (update)
- `app/api/company/code/route.ts` (new)
- `app/api/company/code/regenerate/route.ts` (new)
- `app/api/company/code/toggle/route.ts` (new)
- `app/api/company/code/history/route.ts` (new)
- `app/api/company/join/route.ts` (new)
- `app/api/company/invitations/route.ts` (update - add restrictions)

### Onboarding
- `app/onboarding/page.tsx` (update)
- `components/onboarding/team-member-step.tsx` (new)

### Components
- `components/team/team-code-settings.tsx` (new)
- `components/team/join-history.tsx` (new)
- `components/team/invite-member-modal.tsx` (update - add restrictions)

### Lib
- `lib/company-code.ts` (new)
- `lib/permissions.ts` (update)

### Types
- `types/index.ts` (update)

---

## 🚀 Quick Start Implementation

To start implementing, run these commands in order:

```bash
# 1. Create the migration
npx prisma migrate dev --name add-team-member-code-system

# 2. Generate Prisma client
npx prisma generate

# 3. Run backfill for existing companies
npx tsx scripts/backfill-company-codes.ts

# 4. Start development server
npm run dev
```

---

*Document created: February 5, 2026*
*Last updated: February 5, 2026*
*Version: 1.0*
