# Security & architecture audit — October 2026

## Fixed in this change

| Severity | Issue | Fix |
|---|---|---|
| Critical | `GET /api/cleanup` was public and unauthenticated; it deleted **all** applications (incl. approved ones, with projects/experiences) once a test due date passed | Requires `CRON_SECRET`; only deletes PENDING applications with no submission, transactionally; scheduled via `vercel.json` |
| Critical | `POST /api/projects/cleanup` — no auth, deleted approved projects | Removed (unused) |
| Critical | `DELETE /api/internship/delete` — no auth, any user could delete any internship | Company-owner check |
| Critical | Middleware skipped all checks for any `User-Agent` containing "googlebot" | Bypass removed |
| High | `POST /api/sync-users`, `GET /api/check-user`, `POST /api/get-role` trusted user ids from body/header | First two removed (unused); `get-role` uses the session |
| High | `POST /api/role` let any user switch STUDENT ↔ COMPANY at any time | Removed; role is set once during onboarding and immutable afterwards |
| High | Onboarding set `onboardingComplete` in Clerk **before** validation; ToS/Privacy acceptance was client-side only | Clerk metadata written last, only after policies are accepted server-side; EIK checksum validated server-side; logo URL restricted to our bucket |
| High | `/api/assistant/ai-mode` trusted `userType` from the client → students could pull every student's email | `userType` derived from DB role; history sanitised/bounded; rate limit |
| High | `/api/candidates*` open to students (all student emails/profiles) | Company-only |
| High | `GET /api/interviews/[id]` — no ownership check | Student/company ownership check |
| High | `DELETE /api/portfolio/upload` — could delete any file in the bucket | Restricted to `<ownUserId>/portfolio/` |
| High | `/api/applications/company` returned students' assignments **at other companies** (incl. submission URLs) and full user rows | Explicit select, assignments filtered by company |
| Medium | Uploads: no type/size validation, raw file names in storage paths | `lib/upload-utils.ts` allowlists + safe names on all upload routes |
| Medium | Portfolio POST let the client set `age` → self-approve a minor's portfolio | `age`/approval are server-owned |
| Medium | Leaderboard exposed all student emails to other students | Emails only for companies; bounded paging |
| Medium | Companies could upload "submissions" on behalf of students (unlocking approval/messaging gates); `student-assignments` company check compared a company id to a user id | Student-only uploads; correct owner check |
| Low | `lib/openai.ts` read `.env` from disk and logged part of the key; threw at import | Env-only, no logging, no import-time throw |
| Low | 9 TypeScript errors; `NEXT_DISABLE_TYPECHECK` is not a real Next.js flag, so `next build` was failing on them | Errors fixed, flag removed, `next build` passes |
| Low | Legacy `pages/` router duplicated the dashboards outside middleware role checks | Removed |

## Requires action (cannot be done from code)

1. **Set `CRON_SECRET`** in Vercel project env (any long random string). Without it `/api/cleanup` returns 401 (fails closed).
2. **Clerk session token** must include `{"metadata": "{{user.public_metadata}}"}` (Dashboard → Sessions → Customize session token). Middleware routing depends on it.
3. **Prisma migration drift.** `prisma/migrations` stops at Aug 2025; Notification, SavedInternship, Conversation, Message, Review, Interview, CandidateEvaluation, the new enums and the Experience rating columns exist only via `db push`. A fresh database built with `prisma migrate deploy` will be missing them. Baseline once against production:
   ```bash
   mkdir -p prisma/migrations/20261015000000_sync_schema
   npx prisma migrate diff \
     --from-url "$DIRECT_URL" \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/20261015000000_sync_schema/migration.sql
   # If the diff is empty (prod already matches), mark it applied:
   npx prisma migrate resolve --applied 20261015000000_sync_schema
   ```
   (If prod is ahead of the migrations folder, generate the diff from an empty shadow DB instead and `resolve --applied` it.)

## Known remaining weaknesses (not fixed here)

- **Rate limiting is per-instance memory.** On serverless this is best effort. `@upstash/ratelimit` is already a dependency; wire it into the AI routes for a real global limit.
- **In-memory AI chat sessions** (`/api/assistant`, `/api/assistant/chat`) are lost on cold start and not shared between instances. Persist to DB/Redis if continuity matters.
- **Storage buckets are public.** Assignment/experience files are reachable by anyone with the URL. Switch to private buckets + signed URLs for student work.
- **No automated tests.** Highest-value first targets: onboarding action, application approval flow, authorization of `[id]` routes.
- **Authorization is per-route.** `lib/api-guards.ts` (`requireDbUser`) exists now; migrate the remaining routes to it so new routes can't forget the check.
- **One company per user is assumed** (`companies[0]`) across many routes while the schema allows many.
