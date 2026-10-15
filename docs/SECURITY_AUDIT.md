# Security audit — October 2026 (ported onto current `main`)

Findings from the original audit (branch `claude/legacy-audit-fixes`, based on `99a2640`) were re-checked
against current `main`, and only the ones still open were fixed. The new AI agent stack in `main`
(tool registry, memory, auto-apply, AI notifications) was audited for the same bug classes.

Shared helpers: `lib/api-guards.ts` (`requireDbUser`, `requireCompanyAccess`, `isAuthorizedCron`),
`lib/upload-utils.ts` (upload allowlists/limits), `lib/ai/action-confirmation.ts` (signed agent actions).

## Fixed

| Severity | Issue | Fix |
|---|---|---|
| Critical | `GET /api/cleanup` public + unauthenticated; deleted **all** applications (incl. approved) past the test due date | `CRON_SECRET`; only PENDING applications without any submission, per-application transaction |
| Critical | `POST /api/projects/cleanup` — no auth, deleted projects | Removed (unused) |
| Critical | Middleware skipped every check for a bot `User-Agent` (`googlebot`, `bingbot`, …) | Bypass removed (public pages are already in `isPublicRoute`) |
| Critical | Cron routes failed open when `CRON_SECRET` was unset (`secret !== process.env.CRON_SECRET` with both `undefined`) — combined with the UA bypass, anyone could trigger auto-apply/matchmaker | Shared fail-closed constant-time check; cron routes reachable without a Clerk session |
| High | Agent write tools (apply, withdraw, approve/reject, interviews, create/edit internship, auto-apply) ran inside the LLM turn — prompt injection via internship text / cover letters could trigger them | Signed, user-bound, 10-min confirmation token → Confirm card → `POST /api/assistant/agent/confirm` (re-authorized) |
| High | Agent: a company user without a company (removed member) got unscoped `{}` queries → every company's conversations/applications | Denied in `authorize.ts`; executors match nothing |
| High | Agent: suspended/pending members kept acting for the company; default-role permissions missing | ACTIVE membership only; `getMemberPermissions()` |
| High | `completeOnboarding` could be re-run after onboarding → role switch (student ↔ company) | Refused once `onboardingComplete` |
| High | `POST /api/role` switched role at will | Removed; GET only |
| High | `/api/sync-users`, `/api/check-user`, `/api/get-role` trusted ids from body/header | First two removed (unused); `get-role` uses the session |
| High | `/api/candidates`, `/api/candidates/[id]` open to students (all student profiles + emails) | Active membership + `VIEW_CANDIDATES` |
| High | `GET /api/interviews/[id]` — no ownership check | Student or active member of the hiring company |
| High | `DELETE /api/portfolio/upload` deleted any object in the bucket | Restricted to `<userId>/portfolio/` |
| High | `/api/applications/company` leaked students' assignments/submissions at **other** companies and full user rows | Explicit select; assignments filtered by company |
| High | `student-assignments/[id]` (GET + upload): `TEAM_MEMBER` matched no branch → no check; company branch compared company id to user id | Student or active company member; uploads student-only |
| Medium | Stored XSS: company `website` and student `linkedin/github/portfolioUrl` accepted `javascript:` URLs and are rendered as links | http(s) only |
| Medium | Client-set `age` in `/api/portfolio` (and unused `/api/portfolio/me`) → minor self-approves portfolio | Server-owned; `/me` removed |
| Medium | Uploads: no MIME/size validation, raw file names in storage paths | `lib/upload-utils.ts` on all upload routes |
| Medium | Companies could upload assignment "submissions" (unlocking approval/messaging gates) | Student-only |
| Medium | Agent/ai-mode trusted `userType` and chat history (`role: "system"` injection) from the client; no length limits | DB role; roles whitelisted, history/message bounded |
| Medium | No rate limits on LLM routes | Per-user limits on agent, ai-mode, chat, cover-letter, assistant |
| Medium | Leaderboard exposed student emails to students | Company users only; bounded paging |
| Medium | `search_candidates` tool matched/returned student emails | Removed |
| Low | `app/api/assistant/route.ts` read `OPENAI_API_KEY` from `.env` on disk; `lib/openai.ts` threw at import | Env only, lazy failure |
| Low | Applications accepted outside the application window | Enforced server-side |
| Low | Onboarding EIK only format-checked; logo URL any URL | Checksum server-side; logo must be the user's own upload |
| Low | `upload-logo` 404'd during onboarding (company doesn't exist yet) | Allowed pre-company, no DB write |
| Low | auto-apply cron incremented every student's count by the global total; GET not exported | Per-student; GET export |

## Requires action (cannot be done from code)

1. **Set `CRON_SECRET`** in the Vercel project env. Without it all cron routes and `/api/cleanup` return 401
   (fail closed). Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically; there is no
   `vercel.json` in the repo, so schedule `/api/cleanup`, `/api/cron/*` in the dashboard or add one.
   Before this change the cron routes were redirected by middleware (no Clerk session), i.e. they did not run.
2. **Agent confirmations** are signed with `AI_ACTION_SECRET` (falls back to `CLERK_SECRET_KEY`). Set a
   dedicated `AI_ACTION_SECRET` if you rotate Clerk keys independently.
3. **Clerk session token** must include `{"metadata": "{{user.public_metadata}}"}` — middleware routing depends on it.

## Known remaining weaknesses (not fixed here)

- **Rate limiting is per-instance memory** (`lib/rate-limit.ts`). On serverless it is best effort; wire
  `@upstash/ratelimit` (already a dependency) for a global limit.
- **Confirmation tokens are replayable** within their 10-minute TTL by the same user (tools are mostly
  idempotent: duplicate apply → `ALREADY_APPLIED`). Store a nonce if this matters.
- **`update_portfolio` stays automatic** (product decision: skills are merged without asking). It only
  touches the caller's own portfolio.
- **Team members skip ToS/Privacy acceptance** in onboarding (`finalizeOnboarding` → "no separate policy
  acceptance needed"). Product/legal decision.
- **Invited members get role `COMPANY`** while code-joined members get `TEAM_MEMBER`; routes that check
  `role === "COMPANY"` + `companies[0]` (owner) are inconsistent with the membership model
  (e.g. `candidates/[id]/invite|message`, `candidates/evaluations`, `experience/[id]`). Migrate them to
  `requireCompanyAccess(permission)`.
- **Storage buckets are public.** Assignment/experience files are reachable by URL. Private buckets + signed URLs.
- **`?secret=` query auth** is still accepted by `isAuthorizedCron` for the documented
  `scripts/expire-internships.ts` flow; prefer the header (query strings end up in logs).
- **No automated tests.** Highest-value first targets: onboarding action, application approval flow,
  `authorize.ts` + confirmation flow, authorization of `[id]` routes.
