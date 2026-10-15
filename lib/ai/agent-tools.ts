// lib/ai/agent-tools.ts
// Tools the LynkSkill AI agent ("Linky") can call. Every tool runs as the
// signed-in user and goes through the same service-layer rules as the REST API.
// Write tools require `confirmed: true`, which the system prompt only allows
// after the user explicitly agreed in their latest message.
import type OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { calculateCandidateScore } from "@/lib/candidate-scoring"
import { applyToInternship, isApplicationWindowOpen, setApplicationStatus, withdrawApplication } from "@/lib/services/applications"
import { scheduleInterview, scheduleInterviewSchema } from "@/lib/services/interviews"
import { createNotification } from "@/lib/notifications"

export type AgentRole = "STUDENT" | "COMPANY"

export interface AgentContext {
    userId: string // DB user id
    role: AgentRole
    companyId: string | null
}

export interface InternshipMatch {
    id: string
    title: string
    company: string
    matchPercentage: number
    reasons: string[]
    skills: string[]
}

export interface StudentMatch {
    id: string
    name: string
    email: string
    matchPercentage: number
    reasons: string[]
    skills: string[]
    portfolio?: { headline?: string; about?: string }
}

/** Side-channel data surfaced to the UI alongside the text reply. */
export interface AgentArtifacts {
    internshipMatches?: InternshipMatch[]
    studentMatches?: StudentMatch[]
    portfolioDraft?: { headline: string; about: string; skills: string[]; interests: string[] }
    actions: { tool: string; ok: boolean; summary: string }[]
}

type ToolDef = OpenAI.Chat.ChatCompletionTool
type Args = Record<string, unknown>
type ToolResult = Record<string, unknown>

const MAX_LIST = 10

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : undefined)
const strList = (v: unknown, max = 30) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim().slice(0, 50)).slice(0, max) : []
const needsConfirmation = (action: string) => ({
    needs_confirmation: true,
    message: `Ask the user to explicitly confirm before you ${action}. Then call again with confirmed=true.`,
})
const fmtDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null)

function scoreInternship(
    internship: { title: string; description: string; qualifications: string | null; skills: string[] },
    studentSkills: string[],
    interests: string[]
) {
    const wanted = studentSkills.map((s) => s.toLowerCase())
    const required = internship.skills.map((s) => s.toLowerCase())
    const text = `${internship.title} ${internship.description} ${internship.qualifications ?? ""}`.toLowerCase()

    const matched = new Set<string>()
    let score = 20
    for (const skill of wanted) {
        if (required.some((r) => r.includes(skill) || skill.includes(r))) {
            score += 20
            matched.add(skill)
        } else if (text.includes(skill)) {
            score += 10
            matched.add(skill)
        }
    }
    for (const interest of interests.map((i) => i.toLowerCase())) {
        if (text.includes(interest)) score += 5
    }
    const reasons = matched.size ? [`Matches: ${[...matched].slice(0, 5).join(", ")}`] : ["General fit"]
    return { score: Math.min(score, 98), reasons, matched: [...matched] }
}

// ---------------------------------------------------------------------------
// tool definitions
// ---------------------------------------------------------------------------
const fn = (name: string, description: string, properties: Record<string, unknown>, required: string[] = []): ToolDef => ({
    type: "function",
    function: { name, description, parameters: { type: "object", properties, required, additionalProperties: false } },
})
const confirmedProp = { confirmed: { type: "boolean", description: "true ONLY if the user explicitly confirmed this exact action in their latest message" } }

const COMMON_TOOLS: ToolDef[] = [
    fn("get_my_notifications", "Latest notifications for the current user (unread first).", {}),
]

const STUDENT_TOOLS: ToolDef[] = [
    fn("get_my_profile", "The student's portfolio (headline, bio, skills, interests, links) plus application/interview counts. Call this first when you need context about the student.", {}),
    fn("draft_portfolio", "Show a generated portfolio draft in the UI (does NOT save). Use after gathering the student's skills/interests/background.", {
        headline: { type: "string" }, about: { type: "string", description: "2-3 sentence professional summary" },
        skills: { type: "array", items: { type: "string" } }, interests: { type: "array", items: { type: "string" } },
    }, ["headline", "about", "skills", "interests"]),
    fn("update_my_portfolio", "Save changes to the student's portfolio. Skills/interests are merged (add) or removed.", {
        headline: { type: "string" }, bio: { type: "string" },
        add_skills: { type: "array", items: { type: "string" } }, remove_skills: { type: "array", items: { type: "string" } },
        add_interests: { type: "array", items: { type: "string" } },
        linkedin: { type: "string" }, github: { type: "string" }, portfolio_url: { type: "string" },
        ...confirmedProp,
    }),
    fn("search_internships", "Search open internships. Results are ranked against the student's skills (or the skills given) and shown in the UI.", {
        query: { type: "string", description: "free text matched against title/description" },
        skills: { type: "array", items: { type: "string" }, description: "skills to match; defaults to the student's portfolio skills" },
        location: { type: "string" }, paid_only: { type: "boolean" },
    }),
    fn("get_internship_details", "Full details of one internship, incl. test assignment and whether the student already applied.", {
        internship_id: { type: "string" },
    }, ["internship_id"]),
    fn("apply_to_internship", "Submit an application for the student.", { internship_id: { type: "string" }, ...confirmedProp }, ["internship_id"]),
    fn("save_internship", "Bookmark an internship for later.", { internship_id: { type: "string" } }, ["internship_id"]),
    fn("list_my_applications", "The student's applications with status and whether a test assignment is pending.", {}),
    fn("withdraw_application", "Withdraw a PENDING application.", { application_id: { type: "string" }, ...confirmedProp }, ["application_id"]),
    fn("list_my_assignments", "Test assignments with due dates and submission status.", {}),
    fn("list_my_interviews", "Upcoming and past interviews.", {}),
    fn("respond_to_interview", "Confirm an interview or request a reschedule.", {
        interview_id: { type: "string" }, action: { type: "string", enum: ["confirm", "request_reschedule"] }, ...confirmedProp,
    }, ["interview_id", "action"]),
]

const COMPANY_TOOLS: ToolDef[] = [
    fn("get_my_company", "The company profile and stats (internships, applications by status, upcoming interviews).", {}),
    fn("list_my_internships", "The company's internships with application counts.", {}),
    fn("create_internship", "Publish a new internship. Dates are YYYY-MM-DD.", {
        title: { type: "string" }, description: { type: "string" }, location: { type: "string" },
        qualifications: { type: "string" }, paid: { type: "boolean" }, salary: { type: "number", description: "monthly, required if paid" },
        skills: { type: "array", items: { type: "string" } },
        application_start: { type: "string" }, application_end: { type: "string" },
        test_assignment_title: { type: "string" }, test_assignment_description: { type: "string" }, test_assignment_due_date: { type: "string" },
        ...confirmedProp,
    }, ["title", "description", "location", "paid", "application_start", "application_end"]),
    fn("search_candidates", "Search students by skills / free text. Results are shown in the UI.", {
        skills: { type: "array", items: { type: "string" } }, query: { type: "string" },
    }),
    fn("get_candidate_profile", "Full profile of one student (portfolio, projects, endorsed experience).", { candidate_id: { type: "string" } }, ["candidate_id"]),
    fn("list_applications", "Applications to the company's internships.", {
        internship_id: { type: "string" }, status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
    }),
    fn("update_application_status", "Approve or reject an application.", {
        application_id: { type: "string" }, status: { type: "string", enum: ["APPROVED", "REJECTED"] }, ...confirmedProp,
    }, ["application_id", "status"]),
    fn("schedule_interview", "Schedule an interview for an application. scheduled_at is ISO 8601 with timezone (e.g. 2026-10-20T14:00:00+03:00).", {
        application_id: { type: "string" }, scheduled_at: { type: "string" }, location: { type: "string", description: "address or video link" },
        notes: { type: "string" }, ...confirmedProp,
    }, ["application_id", "scheduled_at"]),
    fn("contact_candidate", "Send a short message (notification) to a student.", {
        candidate_id: { type: "string" }, message: { type: "string" }, ...confirmedProp,
    }, ["candidate_id", "message"]),
]

export function toolsFor(role: AgentRole): ToolDef[] {
    return [...COMMON_TOOLS, ...(role === "COMPANY" ? COMPANY_TOOLS : STUDENT_TOOLS)]
}

// ---------------------------------------------------------------------------
// executors
// ---------------------------------------------------------------------------
type Executor = (ctx: AgentContext, args: Args, out: AgentArtifacts) => Promise<ToolResult>

const common: Record<string, Executor> = {
    async get_my_notifications(ctx) {
        const notifications = await prisma.notification.findMany({
            where: { userId: ctx.userId },
            orderBy: [{ read: "asc" }, { createdAt: "desc" }],
            take: MAX_LIST,
            select: { title: true, message: true, read: true, createdAt: true },
        })
        return { notifications: notifications.map((n) => ({ ...n, createdAt: fmtDate(n.createdAt) })) }
    },
}

const student: Record<string, Executor> = {
    async get_my_profile(ctx) {
        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: {
                email: true,
                profile: { select: { name: true } },
                portfolio: {
                    select: { fullName: true, headline: true, bio: true, skills: true, interests: true, experience: true, linkedin: true, github: true, portfolioUrl: true, approvalStatus: true },
                },
                _count: { select: { applications: true, experiences: true } },
            },
        })
        const upcomingInterviews = await prisma.interview.count({
            where: { application: { studentId: ctx.userId }, scheduledAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
        })
        return { name: user?.profile?.name || user?.portfolio?.fullName || null, portfolio: user?.portfolio ?? null, counts: { ...user?._count, upcomingInterviews } }
    },

    async draft_portfolio(_ctx, args, out) {
        const draft = {
            headline: str(args.headline, 200) ?? "",
            about: str(args.about, 2000) ?? "",
            skills: strList(args.skills),
            interests: strList(args.interests),
        }
        out.portfolioDraft = draft
        return { shown_to_user: true, note: "The student can review it and press Save, or ask you to save it with update_my_portfolio." }
    },

    async update_my_portfolio(ctx, args, out) {
        if (args.confirmed !== true) return needsConfirmation("update their portfolio")
        const existing = await prisma.portfolio.findUnique({ where: { studentId: ctx.userId } })
        const remove = new Set(strList(args.remove_skills).map((s) => s.toLowerCase()))
        const skills = [...new Set([...(existing?.skills ?? []), ...strList(args.add_skills)])].filter((s) => !remove.has(s.toLowerCase()))
        const interests = [...new Set([...(existing?.interests ?? []), ...strList(args.add_interests)])]
        const url = (v: unknown) => {
            const s = str(v, 300)
            return s && /^https?:\/\//i.test(s) ? s : undefined
        }
        const data = {
            headline: str(args.headline, 200),
            bio: str(args.bio, 3000),
            skills,
            interests,
            linkedin: url(args.linkedin),
            github: url(args.github),
            portfolioUrl: url(args.portfolio_url),
        }
        await prisma.portfolio.upsert({
            where: { studentId: ctx.userId },
            update: data,
            create: { student: { connect: { id: ctx.userId } }, ...data },
        })
        out.actions.push({ tool: "update_my_portfolio", ok: true, summary: "Portfolio updated" })
        return { saved: true, skills, interests }
    },

    async search_internships(ctx, args, out) {
        const portfolio = await prisma.portfolio.findUnique({ where: { studentId: ctx.userId }, select: { skills: true, interests: true } })
        const skills = strList(args.skills).length ? strList(args.skills) : portfolio?.skills ?? []
        const query = str(args.query, 200)
        const location = str(args.location, 100)

        const internships = await prisma.internship.findMany({
            where: {
                applicationEnd: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                ...(args.paid_only === true ? { paid: true } : {}),
                ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
                ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" as const } }, { description: { contains: query, mode: "insensitive" as const } }] } : {}),
            },
            include: { company: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 100,
        })

        const ranked = internships
            .map((i) => ({ i, ...scoreInternship(i, skills, portfolio?.interests ?? []) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_LIST)

        out.internshipMatches = ranked.map(({ i, score, reasons, matched }) => ({
            id: i.id, title: i.title, company: i.company.name, matchPercentage: score, reasons,
            skills: i.skills.length ? i.skills.slice(0, 6) : matched,
        }))

        return {
            searched_with_skills: skills,
            results: ranked.map(({ i, score }) => ({
                id: i.id, title: i.title, company: i.company.name, location: i.location, paid: i.paid, salary: i.salary,
                applies_until: fmtDate(i.applicationEnd), match: score,
                open_now: isApplicationWindowOpen(i.applicationStart, i.applicationEnd),
            })),
        }
    },

    async get_internship_details(ctx, args) {
        const id = str(args.internship_id, 50)
        if (!id) return { error: "internship_id required" }
        const i = await prisma.internship.findUnique({
            where: { id },
            include: { company: { select: { name: true, location: true, website: true } }, applications: { where: { studentId: ctx.userId }, select: { id: true, status: true } } },
        })
        if (!i) return { error: "Internship not found" }
        return {
            id: i.id, title: i.title, description: i.description, qualifications: i.qualifications, location: i.location,
            paid: i.paid, salary: i.salary, skills: i.skills, company: i.company,
            application_window: { from: fmtDate(i.applicationStart), until: fmtDate(i.applicationEnd), open_now: isApplicationWindowOpen(i.applicationStart, i.applicationEnd) },
            test_assignment: i.testAssignmentTitle ? { title: i.testAssignmentTitle, description: i.testAssignmentDescription, due: fmtDate(i.testAssignmentDueDate) } : null,
            my_application: i.applications[0] ?? null,
        }
    },

    async apply_to_internship(ctx, args, out) {
        const id = str(args.internship_id, 50)
        if (!id) return { error: "internship_id required" }
        if (args.confirmed !== true) return needsConfirmation("submit this application")
        const result = await applyToInternship(ctx.userId, id)
        out.actions.push({ tool: "apply_to_internship", ok: result.ok, summary: result.ok ? `Applied to ${result.data.internship.title}` : result.error })
        if (!result.ok) return { error: result.error }
        return { applied: true, application_id: result.data.id, test_assignment_created: result.data.hasTest }
    },

    async save_internship(ctx, args, out) {
        const id = str(args.internship_id, 50)
        if (!id) return { error: "internship_id required" }
        const exists = await prisma.internship.findUnique({ where: { id }, select: { title: true } })
        if (!exists) return { error: "Internship not found" }
        await prisma.savedInternship.upsert({
            where: { userId_internshipId: { userId: ctx.userId, internshipId: id } },
            update: {},
            create: { userId: ctx.userId, internshipId: id },
        })
        out.actions.push({ tool: "save_internship", ok: true, summary: `Saved ${exists.title}` })
        return { saved: true }
    },

    async list_my_applications(ctx) {
        const apps = await prisma.application.findMany({
            where: { studentId: ctx.userId },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { internship: { select: { id: true, title: true, testAssignmentTitle: true, company: { select: { name: true } } } } },
        })
        return {
            applications: apps.map((a) => ({
                id: a.id, status: a.status, applied: fmtDate(a.createdAt), internship_id: a.internship.id,
                internship: a.internship.title, company: a.internship.company.name, has_test: Boolean(a.internship.testAssignmentTitle),
            })),
        }
    },

    async withdraw_application(ctx, args, out) {
        const id = str(args.application_id, 50)
        if (!id) return { error: "application_id required" }
        if (args.confirmed !== true) return needsConfirmation("withdraw this application")
        const result = await withdrawApplication(ctx.userId, id)
        out.actions.push({ tool: "withdraw_application", ok: result.ok, summary: result.ok ? `Withdrew ${result.data.title}` : result.error })
        return result.ok ? { withdrawn: true } : { error: result.error }
    },

    async list_my_assignments(ctx) {
        const assignments = await prisma.assignment.findMany({
            where: { studentId: ctx.userId },
            orderBy: { dueDate: "asc" },
            take: 20,
            include: { internship: { select: { title: true, company: { select: { name: true } } } }, _count: { select: { submissions: true } } },
        })
        return {
            assignments: assignments.map((a) => ({
                id: a.id, title: a.title, internship: a.internship.title, company: a.internship.company.name,
                due: fmtDate(a.dueDate), overdue: a.dueDate < new Date(), submitted: a._count.submissions > 0,
                upload_link: `/assignments/${a.id}`,
            })),
        }
    },

    async list_my_interviews(ctx) {
        const interviews = await prisma.interview.findMany({
            where: { application: { studentId: ctx.userId } },
            orderBy: { scheduledAt: "asc" },
            take: 20,
            include: { application: { select: { internship: { select: { title: true, company: { select: { name: true } } } } } } },
        })
        return {
            interviews: interviews.map((iv) => ({
                id: iv.id, status: iv.status, at: iv.scheduledAt.toISOString(), duration_min: iv.duration, location: iv.location,
                internship: iv.application.internship.title, company: iv.application.internship.company.name,
            })),
        }
    },

    async respond_to_interview(ctx, args, out) {
        const id = str(args.interview_id, 50)
        const action = args.action === "confirm" ? "CONFIRMED" : args.action === "request_reschedule" ? "RESCHEDULED" : null
        if (!id || !action) return { error: "interview_id and a valid action are required" }
        if (args.confirmed !== true) return needsConfirmation(action === "CONFIRMED" ? "confirm this interview" : "request a reschedule")
        const iv = await prisma.interview.findUnique({
            where: { id },
            include: { application: { select: { studentId: true, internship: { select: { company: { select: { ownerId: true } } } } } } },
        })
        if (!iv || iv.application.studentId !== ctx.userId) return { error: "Interview not found" }
        await prisma.interview.update({ where: { id }, data: { status: action } })
        await createNotification({
            userId: iv.application.internship.company.ownerId,
            type: "INTERVIEW_SCHEDULED",
            title: action === "CONFIRMED" ? "Interview Confirmed" : "Interview Reschedule Requested",
            message: action === "CONFIRMED" ? "Interview has been confirmed by the student" : "A reschedule has been requested for the interview",
            link: "/dashboard/company/interviews",
        })
        out.actions.push({ tool: "respond_to_interview", ok: true, summary: action === "CONFIRMED" ? "Interview confirmed" : "Reschedule requested" })
        return { updated: true, status: action }
    },
}

const company: Record<string, Executor> = {
    async get_my_company(ctx) {
        if (!ctx.companyId) return { error: "No company profile found" }
        const [c, byStatus, upcoming] = await Promise.all([
            prisma.company.findUnique({ where: { id: ctx.companyId }, select: { name: true, description: true, location: true, website: true, _count: { select: { internships: true } } } }),
            prisma.application.groupBy({ by: ["status"], where: { internship: { companyId: ctx.companyId } }, _count: true }),
            prisma.interview.count({ where: { application: { internship: { companyId: ctx.companyId } }, scheduledAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
        ])
        return { company: c, applications_by_status: Object.fromEntries(byStatus.map((s) => [s.status, s._count])), upcoming_interviews: upcoming }
    },

    async list_my_internships(ctx) {
        if (!ctx.companyId) return { error: "No company profile found" }
        const list = await prisma.internship.findMany({
            where: { companyId: ctx.companyId },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { _count: { select: { applications: true } } },
        })
        return {
            internships: list.map((i) => ({
                id: i.id, title: i.title, location: i.location, paid: i.paid, applications: i._count.applications,
                window: `${fmtDate(i.applicationStart)} → ${fmtDate(i.applicationEnd)}`, open_now: isApplicationWindowOpen(i.applicationStart, i.applicationEnd),
            })),
        }
    },

    async create_internship(ctx, args, out) {
        if (!ctx.companyId) return { error: "No company profile found" }
        const title = str(args.title, 200), description = str(args.description, 5000), location = str(args.location, 200)
        const paid = args.paid === true
        const salary = typeof args.salary === "number" && args.salary > 0 ? args.salary : null
        const start = new Date(String(args.application_start)), end = new Date(String(args.application_end))
        const errors: string[] = []
        if (!title || title.length < 3) errors.push("title (min 3 chars)")
        if (!description || description.length < 10) errors.push("description (min 10 chars)")
        if (!location || location.length < 2) errors.push("location")
        if (paid && !salary) errors.push("salary is required for paid internships")
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) errors.push("valid application_start < application_end (YYYY-MM-DD)")
        const testDue = str(args.test_assignment_due_date) ? new Date(String(args.test_assignment_due_date)) : null
        if (testDue && isNaN(testDue.getTime())) errors.push("valid test_assignment_due_date")
        if (errors.length) return { error: `Missing/invalid: ${errors.join("; ")}` }
        if (args.confirmed !== true) return needsConfirmation("publish this internship")

        const internship = await prisma.internship.create({
            data: {
                companyId: ctx.companyId, title: title!, description: description!, location: location!,
                qualifications: str(args.qualifications, 3000) ?? null, paid, salary: paid ? salary : null,
                skills: strList(args.skills).map((s) => s.toLowerCase()),
                applicationStart: start, applicationEnd: end,
                testAssignmentTitle: str(args.test_assignment_title, 200) ?? null,
                testAssignmentDescription: str(args.test_assignment_description, 5000) ?? null,
                testAssignmentDueDate: testDue,
            },
        })
        out.actions.push({ tool: "create_internship", ok: true, summary: `Published ${internship.title}` })
        return { created: true, internship_id: internship.id }
    },

    async search_candidates(_ctx, args, out) {
        const skills = strList(args.skills)
        const query = str(args.query, 200)?.toLowerCase()
        const students = await prisma.user.findMany({
            where: { role: "STUDENT", onboardingComplete: true },
            include: { profile: true, portfolio: true, projects: { select: { title: true, description: true } }, experiences: { where: { status: "approved" }, select: { id: true } } },
            take: 300,
        })
        const ranked = students
            .map((s) => ({ s, ...calculateCandidateScore({ portfolio: s.portfolio, projects: s.projects, experiences: s.experiences }, skills) }))
            .filter(({ s, matchedSkills }) => {
                if (query) {
                    const hay = `${s.portfolio?.headline ?? ""} ${s.portfolio?.bio ?? ""} ${(s.portfolio?.skills ?? []).join(" ")}`.toLowerCase()
                    if (!hay.includes(query)) return skills.length > 0 && matchedSkills.length > 0
                }
                return skills.length === 0 || matchedSkills.length > 0
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_LIST)

        out.studentMatches = ranked.map(({ s, score, reasons, matchedSkills }) => ({
            id: s.id,
            name: s.profile?.name || s.portfolio?.fullName || "Student",
            email: s.email,
            matchPercentage: score,
            reasons: reasons.length ? reasons : ["Available candidate"],
            skills: matchedSkills.length ? matchedSkills : (s.portfolio?.skills ?? []).slice(0, 5),
            portfolio: { headline: s.portfolio?.headline ?? undefined, about: s.portfolio?.bio ?? undefined },
        }))

        return {
            results: ranked.map(({ s, score, matchedSkills }) => ({
                id: s.id, name: s.profile?.name || s.portfolio?.fullName || "Student", headline: s.portfolio?.headline,
                match: score, matched_skills: matchedSkills, all_skills: (s.portfolio?.skills ?? []).slice(0, 10),
                endorsed_experiences: s.experiences.length,
            })),
        }
    },

    async get_candidate_profile(_ctx, args) {
        const id = str(args.candidate_id, 50)
        if (!id) return { error: "candidate_id required" }
        const s = await prisma.user.findFirst({
            where: { id, role: "STUDENT" },
            include: {
                profile: true,
                portfolio: { select: { fullName: true, headline: true, bio: true, skills: true, interests: true, experience: true, education: true, linkedin: true, github: true, portfolioUrl: true } },
                projects: { select: { title: true, description: true }, take: 10 },
                experiences: {
                    where: { status: "approved" },
                    select: { skillsRating: true, impactRating: true, growthRating: true, recommendation: true, endorsementNote: true, company: { select: { name: true } } },
                    take: 10,
                },
            },
        })
        if (!s) return { error: "Candidate not found" }
        return { id: s.id, name: s.profile?.name || s.portfolio?.fullName, email: s.email, portfolio: s.portfolio, projects: s.projects, endorsements: s.experiences }
    },

    async list_applications(ctx, args) {
        if (!ctx.companyId) return { error: "No company profile found" }
        const status = ["PENDING", "APPROVED", "REJECTED"].includes(String(args.status)) ? (args.status as "PENDING" | "APPROVED" | "REJECTED") : undefined
        const apps = await prisma.application.findMany({
            where: { internship: { companyId: ctx.companyId, ...(str(args.internship_id, 50) ? { id: str(args.internship_id, 50) } : {}) }, ...(status ? { status } : {}) },
            orderBy: { createdAt: "desc" },
            take: 25,
            include: {
                internship: { select: { title: true, testAssignmentTitle: true } },
                student: { select: { id: true, email: true, profile: { select: { name: true } }, portfolio: { select: { skills: true } } } },
                interviews: { where: { status: { in: ["SCHEDULED", "CONFIRMED"] } }, select: { scheduledAt: true } },
            },
        })
        const submitted = await prisma.assignment.findMany({
            where: { internship: { companyId: ctx.companyId }, submissions: { some: {} }, studentId: { in: apps.map((a) => a.studentId) } },
            select: { studentId: true, internshipId: true },
        })
        const done = new Set(submitted.map((s) => `${s.studentId}|${s.internshipId}`))
        return {
            applications: apps.map((a) => ({
                id: a.id, status: a.status, applied: fmtDate(a.createdAt), internship: a.internship.title,
                candidate_id: a.student.id, candidate: a.student.profile?.name || a.student.email,
                skills: (a.student.portfolio?.skills ?? []).slice(0, 8),
                test_required: Boolean(a.internship.testAssignmentTitle), test_submitted: done.has(`${a.studentId}|${a.internshipId}`),
                interview: a.interviews[0]?.scheduledAt.toISOString() ?? null,
            })),
        }
    },

    async update_application_status(ctx, args, out) {
        const id = str(args.application_id, 50)
        const status = args.status === "APPROVED" || args.status === "REJECTED" ? args.status : null
        if (!id || !status) return { error: "application_id and status (APPROVED|REJECTED) required" }
        if (args.confirmed !== true) return needsConfirmation(`${status === "APPROVED" ? "approve" : "reject"} this application`)
        const result = await setApplicationStatus(ctx.userId, id, status)
        out.actions.push({ tool: "update_application_status", ok: result.ok, summary: result.ok ? `Application ${status.toLowerCase()}` : result.error })
        return result.ok ? { updated: true, status } : { error: result.error }
    },

    async schedule_interview(ctx, args, out) {
        const parsed = scheduleInterviewSchema.safeParse({
            applicationId: str(args.application_id, 50),
            scheduledAt: str(args.scheduled_at, 40),
            location: str(args.location, 500),
            notes: str(args.notes, 1000),
        })
        if (!parsed.success) return { error: parsed.error.issues[0].message }
        if (args.confirmed !== true) return needsConfirmation("schedule this interview")
        const result = await scheduleInterview(ctx.userId, parsed.data)
        out.actions.push({ tool: "schedule_interview", ok: result.ok, summary: result.ok ? "Interview scheduled" : result.error })
        return result.ok ? { scheduled: true, interview_id: result.data.id } : { error: result.error }
    },

    async contact_candidate(ctx, args, out) {
        const id = str(args.candidate_id, 50)
        const message = str(args.message, 1000)
        if (!id || !message) return { error: "candidate_id and message required" }
        if (args.confirmed !== true) return needsConfirmation("send this message")
        if (!ctx.companyId) return { error: "No company profile found" }
        const [candidate, comp] = await Promise.all([
            prisma.user.findFirst({ where: { id, role: "STUDENT" }, select: { id: true } }),
            prisma.company.findUnique({ where: { id: ctx.companyId }, select: { name: true } }),
        ])
        if (!candidate) return { error: "Candidate not found" }
        await createNotification({
            userId: candidate.id,
            type: "NEW_MESSAGE",
            title: `Message from ${comp?.name ?? "a company"}`,
            message,
            link: "/dashboard/student/messages",
        })
        out.actions.push({ tool: "contact_candidate", ok: true, summary: "Message sent" })
        return { sent: true }
    },
}

export async function runTool(ctx: AgentContext, name: string, rawArgs: string, out: AgentArtifacts): Promise<ToolResult> {
    const table = { ...common, ...(ctx.role === "COMPANY" ? company : student) }
    const exec = table[name]
    if (!exec) return { error: `Unknown tool: ${name}` }
    let args: Args
    try {
        args = rawArgs ? JSON.parse(rawArgs) : {}
    } catch {
        return { error: "Invalid JSON arguments" }
    }
    try {
        return await exec(ctx, args, out)
    } catch (err) {
        console.error(`Agent tool ${name} failed:`, err)
        return { error: "Tool failed unexpectedly" }
    }
}
