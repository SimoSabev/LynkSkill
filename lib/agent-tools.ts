import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"
import { searchAcrossSessions } from "@/lib/ai/ai-search"

export interface UserContext {
    userId: string
    clerkId: string
    role: string
    companyId?: string
    permissions: string[]
    isCompanyOwner?: boolean
    companyRole?: string
}

export interface ToolResult {
    tool: string
    cardType: string
    title: string
    data: unknown
    success: boolean
    error?: string
}

export async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    try {
        switch (toolName) {
            case "search_internships":
                return await searchInternships(args)
            case "create_internship":
                return await createInternship(args, ctx)
            case "get_applications":
                return await getApplications(ctx)
            case "get_dashboard_stats":
                return await getDashboardStats(ctx)
            case "get_portfolio":
                return await getPortfolio(ctx)
            case "update_portfolio":
                return await updatePortfolio(args, ctx)
            case "get_saved_internships":
                return await getSavedInternships(ctx)
            case "get_interviews":
                return await getInterviews(ctx)
            case "get_conversations":
                return await getConversations(ctx)
            case "get_assignments":
                return await getAssignments(ctx)
            case "get_company_internships":
                return await getCompanyInternships(ctx)
            case "search_candidates":
                return await searchCandidates(args)
            case "generate_cover_letter":
                return await generateCoverLetter(args, ctx)
            case "get_internship_recommendations":
                return await getInternshipRecommendations(args, ctx)
            case "withdraw_application":
                return await withdrawApplication(args, ctx)
            case "update_internship":
                return await updateInternship(args, ctx)
            case "get_application_details":
                return await getApplicationDetails(args, ctx)
            case "list_notifications":
                return await listNotifications(args, ctx)
            case "mark_notifications_read":
                return await markNotificationsRead(ctx)
            case "search_past_sessions":
                return await searchPastSessions(args, ctx)
            case "apply_to_internship":
                return await applyToInternship(args, ctx)
            case "draft_internship_from_description":
                return await draftInternshipFromDescription(args, ctx)
            case "evaluate_application":
                return await evaluateApplication(args, ctx)
            case "bulk_evaluate_applications":
                return await bulkEvaluateApplications(args, ctx)
            case "propose_interview_slots":
                return await proposeInterviewSlots(args, ctx)
            case "approve_application":
                return await approveApplication(args, ctx)
            case "reject_application":
                return await rejectApplication(args, ctx)
            case "toggle_auto_apply":
                return await toggleAutoApply(args, ctx)
            case "get_auto_apply_settings":
                return await getAutoApplySettings(ctx)
            default:
                return {
                    tool: toolName,
                    cardType: "error",
                    title: "Unknown tool",
                    data: null,
                    success: false,
                    error: `Tool "${toolName}" is not implemented.`,
                }
        }
    } catch (error) {
        return {
            tool: toolName,
            cardType: "error",
            title: "Error",
            data: null,
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred.",
        }
    }
}

async function searchInternships(
    args: Record<string, unknown>,
): Promise<ToolResult> {
    const query = (args.query as string) || ""
    const location = (args.location as string) || ""

    const internships = await prisma.internship.findMany({
        where: {
            AND: [
                query
                    ? {
                          OR: [
                              { title: { contains: query, mode: "insensitive" as const } },
                              { description: { contains: query, mode: "insensitive" as const } },
                          ],
                      }
                    : {},
                location
                    ? { location: { contains: location, mode: "insensitive" as const } }
                    : {},
            ],
        },
        include: { company: { select: { name: true } } },
        take: 10,
        orderBy: { createdAt: "desc" },
    })

    return {
        tool: "search_internships",
        cardType: "internship-list",
        title: `Found ${internships.length} internships`,
        data: internships.map((i) => ({
            id: i.id,
            title: i.title,
            company: i.company.name,
            location: i.location,
            paid: i.paid,
            salary: i.salary,
            description: i.description?.slice(0, 120),
            applicationEnd: i.applicationEnd?.toISOString(),
            requiresCoverLetter: i.requiresCoverLetter,
        })),
        success: true,
    }
}

async function createInternship(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    if (!ctx.companyId) {
        return {
            tool: "create_internship",
            cardType: "error",
            title: "No company",
            data: null,
            success: false,
            error: "You are not associated with a company.",
        }
    }

    // Calculate proper application deadline (default 30 days from now)
    const applicationEndRaw = args.applicationEnd as string | undefined
    const applicationEnd = applicationEndRaw ? new Date(applicationEndRaw) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const applicationStart = new Date()

    const internship = await prisma.internship.create({
        data: {
            title: args.title as string,
            description: args.description as string,
            companyId: ctx.companyId,
            location: (args.location as string) || "Remote",
            paid: (args.paid as boolean) ?? false,
            salary: args.salary != null ? Number(args.salary) : undefined,
            qualifications: (args.qualifications as string) || undefined,
            requiresCoverLetter: (args.requiresCoverLetter as boolean) ?? false,
            skills: Array.isArray(args.skills) ? args.skills as string[] : [],
            applicationStart,
            applicationEnd,
            startDate: args.startDate ? new Date(args.startDate as string) : undefined,
            endDate: args.endDate ? new Date(args.endDate as string) : undefined,
            testAssignmentTitle: (args.testAssignmentTitle as string) || undefined,
            testAssignmentDescription: (args.testAssignmentDescription as string) || undefined,
            testAssignmentDueDate: args.testAssignmentDueDate ? new Date(args.testAssignmentDueDate as string) : undefined,
        },
    })

    return {
        tool: "create_internship",
        cardType: "action-success",
        title: `Internship "${internship.title}" created`,
        data: {
            id: internship.id,
            title: internship.title,
            location: internship.location,
            paid: internship.paid,
            salary: internship.salary,
            applicationEnd: internship.applicationEnd.toISOString(),
            requiresCoverLetter: internship.requiresCoverLetter,
            message: `Internship created successfully! Application deadline: ${internship.applicationEnd.toLocaleDateString()}.`,
        },
        success: true,
    }
}

async function getApplications(
    ctx: UserContext
): Promise<ToolResult> {
    const applications = await prisma.application.findMany({
        where: ctx.role === "STUDENT"
            ? { studentId: ctx.userId }
            : ctx.companyId
              ? { internship: { companyId: ctx.companyId } }
              : {},
        include: {
            internship: { select: { title: true, company: { select: { name: true } } } },
        },
        take: 20,
        orderBy: { createdAt: "desc" },
    })

    return {
        tool: "get_applications",
        cardType: "application-list",
        title: `${applications.length} applications`,
        data: applications.map((a) => ({
            id: a.id,
            status: a.status,
            internshipTitle: a.internship.title,
            companyName: a.internship.company.name,
            createdAt: a.createdAt.toISOString(),
            hasCoverLetter: !!a.coverLetter,
        })),
        success: true,
    }
}

async function getDashboardStats(ctx: UserContext): Promise<ToolResult> {
    if (ctx.role === "STUDENT") {
        const [applications, savedCount] = await Promise.all([
            prisma.application.count({ where: { studentId: ctx.userId } }),
            prisma.savedInternship.count({ where: { userId: ctx.userId } }),
        ])
        return {
            tool: "get_dashboard_stats",
            cardType: "stats",
            title: "Your Dashboard",
            data: { applications, saved: savedCount },
            success: true,
        }
    }

    if (ctx.companyId) {
        const [internships, applications] = await Promise.all([
            prisma.internship.count({ where: { companyId: ctx.companyId } }),
            prisma.application.count({ where: { internship: { companyId: ctx.companyId } } }),
        ])
        return {
            tool: "get_dashboard_stats",
            cardType: "stats",
            title: "Company Dashboard",
            data: { internships, applications },
            success: true,
        }
    }

    return {
        tool: "get_dashboard_stats",
        cardType: "stats",
        title: "Dashboard",
        data: {},
        success: true,
    }
}

async function getPortfolio(ctx: UserContext): Promise<ToolResult> {
    const portfolio = await prisma.portfolio.findUnique({
        where: { studentId: ctx.userId },
    })

    if (!portfolio) {
        return {
            tool: "get_portfolio",
            cardType: "portfolio-view",
            title: "No portfolio yet",
            data: { empty: true, message: "You haven't created your portfolio yet. Tell me about yourself and I can help!" },
            success: true,
        }
    }

    return {
        tool: "get_portfolio",
        cardType: "portfolio-view",
        title: portfolio.fullName || "Your Portfolio",
        data: {
            fullName: portfolio.fullName,
            headline: portfolio.headline,
            bio: portfolio.bio,
            skills: portfolio.skills,
            interests: portfolio.interests,
            experience: portfolio.experience,
            education: portfolio.education,
            linkedin: portfolio.linkedin,
            github: portfolio.github,
            approvalStatus: portfolio.approvalStatus,
        },
        success: true,
    }
}

async function updatePortfolio(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    const data: Record<string, unknown> = {}
    if (typeof args.headline === "string") data.headline = args.headline
    if (typeof args.bio === "string") data.bio = args.bio
    if (Array.isArray(args.skills)) data.skills = args.skills

    const portfolio = await prisma.portfolio.upsert({
        where: { studentId: ctx.userId },
        update: data,
        create: {
            studentId: ctx.userId,
            fullName: "Student", // placeholder if they don't have one
            ...data
        }
    })

    return {
        tool: "update_portfolio",
        cardType: "portfolio-view",
        title: "Portfolio Updated",
        data: {
            fullName: portfolio.fullName,
            headline: portfolio.headline,
            bio: portfolio.bio,
            skills: portfolio.skills,
            interests: portfolio.interests,
            experience: portfolio.experience,
            education: portfolio.education,
            linkedin: portfolio.linkedin,
            github: portfolio.github,
            approvalStatus: portfolio.approvalStatus,
        },
        success: true,
    }
}
async function getSavedInternships(ctx: UserContext): Promise<ToolResult> {
    const saved = await prisma.savedInternship.findMany({
        where: { userId: ctx.userId },
        include: {
            internship: {
                select: { id: true, title: true, company: { select: { name: true } }, location: true },
            },
        },
        take: 10,
    })

    return {
        tool: "get_saved_internships",
        cardType: "internship-list",
        title: `${saved.length} saved internships`,
        data: saved.map((s) => ({
            id: s.internship.id,
            title: s.internship.title,
            company: s.internship.company.name,
            location: s.internship.location,
        })),
        success: true,
    }
}

async function getInterviews(ctx: UserContext): Promise<ToolResult> {
    const interviews = await prisma.interview.findMany({
        where: {
            application: ctx.role === "STUDENT"
                ? { studentId: ctx.userId }
                : ctx.companyId
                  ? { internship: { companyId: ctx.companyId } }
                  : {},
        },
        include: {
            application: {
                select: {
                    internship: { select: { title: true } },
                },
            },
        },
        take: 10,
        orderBy: { scheduledAt: "asc" },
    })

    return {
        tool: "get_interviews",
        cardType: "interview-list",
        title: `${interviews.length} interviews`,
        data: interviews.map((i) => ({
            id: i.id,
            scheduledAt: i.scheduledAt.toISOString(),
            location: i.location,
            status: i.status,
            internshipTitle: i.application.internship.title,
        })),
        success: true,
    }
}

async function getConversations(ctx: UserContext): Promise<ToolResult> {
    const whereClause = ctx.role === "STUDENT"
        ? { studentId: ctx.userId }
        : ctx.companyId
          ? { companyId: ctx.companyId }
          : {}

    const conversations = await prisma.conversation.findMany({
        where: whereClause,
        include: {
            student: { select: { email: true, profile: { select: { name: true } } } },
            company: { select: { name: true } },
            messages: { take: 1, orderBy: { createdAt: "desc" } },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
    })

    return {
        tool: "get_conversations",
        cardType: "conversation-list",
        title: `${conversations.length} conversations`,
        data: conversations.map((c) => ({
            id: c.id,
            studentName: c.student.profile?.name || c.student.email,
            companyName: c.company.name,
            lastMessage: c.messages[0]?.content?.slice(0, 80) || "No messages",
            lastMessageAt: c.messages[0]?.createdAt?.toISOString(),
        })),
        success: true,
    }
}

async function getAssignments(ctx: UserContext): Promise<ToolResult> {
    const assignments = await prisma.assignment.findMany({
        where: ctx.role === "STUDENT"
            ? { studentId: ctx.userId }
            : ctx.companyId
              ? { internship: { companyId: ctx.companyId } }
              : {},
        include: {
            internship: { select: { title: true, company: { select: { name: true } } } },
        },
        take: 10,
        orderBy: { dueDate: "asc" },
    })

    return {
        tool: "get_assignments",
        cardType: "assignment-list",
        title: `${assignments.length} assignments`,
        data: assignments.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description?.slice(0, 120),
            dueDate: a.dueDate.toISOString(),
            internshipTitle: a.internship.title,
            companyName: a.internship.company.name,
        })),
        success: true,
    }
}

async function getCompanyInternships(ctx: UserContext): Promise<ToolResult> {
    if (!ctx.companyId) {
        return {
            tool: "get_company_internships",
            cardType: "error",
            title: "No company",
            data: null,
            success: false,
            error: "You are not associated with a company.",
        }
    }

    const internships = await prisma.internship.findMany({
        where: { companyId: ctx.companyId },
        take: 20,
        orderBy: { createdAt: "desc" },
    })

    return {
        tool: "get_company_internships",
        cardType: "internship-list",
        title: `${internships.length} company internships`,
        data: internships.map((i) => ({
            id: i.id,
            title: i.title,
            company: "Your company",
            location: i.location,
            paid: i.paid,
            salary: i.salary,
            description: i.description?.slice(0, 120),
            applicationEnd: i.applicationEnd.toISOString(),
            applicationsCount: 0,
            requiresCoverLetter: i.requiresCoverLetter,
        })),
        success: true,
    }
}

async function searchCandidates(
    args: Record<string, unknown>,
): Promise<ToolResult> {
    const query = (args.query as string) || ""

    const students = await prisma.user.findMany({
        where: {
            role: "STUDENT",
            ...(query
                ? {
                      OR: [
                          { email: { contains: query, mode: "insensitive" as const } },
                          { profile: { is: { name: { contains: query, mode: "insensitive" as const } } } },
                      ],
                  }
                : {}),
        },
        include: {
            profile: { select: { name: true } },
            portfolio: { select: { fullName: true, headline: true, skills: true } },
        },
        take: 10,
    })

    return {
        tool: "search_candidates",
        cardType: "candidate-list",
        title: `${students.length} candidates found`,
        data: students.map((s) => ({
            id: s.id,
            name: s.portfolio?.fullName || s.profile?.name || s.email,
            headline: s.portfolio?.headline,
            skills: s.portfolio?.skills || [],
        })),
        success: true,
    }
}

// ─── New tools ────────────────────────────────────────────────────────────────

async function generateCoverLetter(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const internshipId = args.internshipId as string
    if (!internshipId) {
        return { tool: "generate_cover_letter", cardType: "error", title: "Missing ID", data: null, success: false, error: "internshipId is required" }
    }

    const [internship, portfolio] = await Promise.all([
        prisma.internship.findUnique({
            where: { id: internshipId },
            select: { title: true, description: true, qualifications: true, company: { select: { name: true } } },
        }),
        prisma.portfolio.findUnique({
            where: { studentId: ctx.userId },
            select: { fullName: true, bio: true, skills: true, experience: true },
        }),
    ])

    if (!internship) {
        return { tool: "generate_cover_letter", cardType: "error", title: "Not found", data: null, success: false, error: "Internship not found" }
    }
    if (!portfolio) {
        return { tool: "generate_cover_letter", cardType: "error", title: "No portfolio", data: null, success: false, error: "Please create your portfolio first so I can generate a personalised cover letter" }
    }

    const skillsStr = Array.isArray(portfolio.skills) ? portfolio.skills.join(", ") : ""

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: `Write a concise, compelling cover letter (max 200 words) for ${portfolio.fullName ?? "this student"} applying to "${internship.title}" at ${internship.company?.name ?? "this company"}.

Student bio: ${portfolio.bio ?? "N/A"}
Skills: ${skillsStr || "N/A"}
Experience: ${portfolio.experience ?? "N/A"}
Job description: ${internship.description?.slice(0, 400) ?? "N/A"}
Requirements: ${internship.qualifications?.slice(0, 300) ?? "N/A"}

Be specific, professional, enthusiastic. No placeholders.`,
            },
        ],
        max_tokens: 400,
        temperature: 0.6,
    })

    const letter = completion.choices[0].message.content ?? ""

    return {
        tool: "generate_cover_letter",
        cardType: "cover-letter",
        title: `Cover Letter for ${internship.title}`,
        data: {
            internshipId,
            internshipTitle: internship.title,
            company: internship.company?.name ?? "",
            letter,
        },
        success: true,
    }
}

async function getInternshipRecommendations(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const limit = Math.min((args.limit as number) || 5, 10)

    const portfolio = await prisma.portfolio.findUnique({
        where: { studentId: ctx.userId },
        select: { skills: true, interests: true },
    })

    const skillsArr = portfolio?.skills ?? []
    const searchTerms = [...skillsArr, ...(portfolio?.interests ?? [])].slice(0, 5)

    const internships = await prisma.internship.findMany({
        where: {
            applicationEnd: { gte: new Date() },
            ...(searchTerms.length > 0
                ? {
                      OR: searchTerms.map((term) => ({
                          OR: [
                              { qualifications: { contains: term, mode: "insensitive" as const } },
                              { description: { contains: term, mode: "insensitive" as const } },
                              { title: { contains: term, mode: "insensitive" as const } },
                          ],
                      })),
                  }
                : {}),
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            location: true,
            paid: true,
            salary: true,
            company: { select: { name: true } },
        },
    })

    return {
        tool: "get_internship_recommendations",
        cardType: "internship-list",
        title: `Top ${internships.length} Recommendations for You`,
        data: internships.map((i) => ({
            id: i.id,
            title: i.title,
            company: i.company?.name ?? "",
            location: i.location,
            paid: i.paid,
            salary: i.salary,
        })),
        success: true,
    }
}

async function withdrawApplication(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const applicationId = args.applicationId as string
    if (!applicationId) {
        return { tool: "withdraw_application", cardType: "error", title: "Missing ID", data: null, success: false, error: "applicationId is required" }
    }

    const application = await prisma.application.findFirst({
        where: { id: applicationId, studentId: ctx.userId, status: "PENDING" },
    })

    if (!application) {
        return {
            tool: "withdraw_application",
            cardType: "error",
            title: "Cannot withdraw",
            data: null,
            success: false,
            error: "Application not found or not in PENDING status",
        }
    }

    await prisma.application.delete({ where: { id: applicationId } })

    return {
        tool: "withdraw_application",
        cardType: "action-success",
        title: "Application withdrawn",
        data: { applicationId, message: "Your application has been withdrawn." },
        success: true,
    }
}

async function updateInternship(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const { internshipId, ...updates } = args as { internshipId: string;[k: string]: unknown }
    if (!internshipId) {
        return { tool: "update_internship", cardType: "error", title: "Missing ID", data: null, success: false, error: "internshipId is required" }
    }
    if (!ctx.companyId) {
        return { tool: "update_internship", cardType: "error", title: "No company", data: null, success: false, error: "You are not associated with a company." }
    }

    // Only allow safe fields to be updated
    const dateFields = ["applicationEnd", "startDate", "endDate", "testAssignmentDueDate"]
    const allowedFields = ["title", "description", "location", "paid", "salary", "qualifications", "requiresCoverLetter", "skills", "testAssignmentTitle", "testAssignmentDescription", ...dateFields]
    const safeUpdates: Record<string, unknown> = {}
    for (const key of allowedFields) {
        if (updates[key] !== undefined) {
            if (dateFields.includes(key)) {
                safeUpdates[key] = new Date(updates[key] as string)
            } else {
                safeUpdates[key] = updates[key]
            }
        }
    }

    const updated = await prisma.internship.update({
        where: { id: internshipId, companyId: ctx.companyId },
        data: safeUpdates,
    })

    return {
        tool: "update_internship",
        cardType: "action-success",
        title: `Internship "${updated.title}" updated`,
        data: { id: updated.id, title: updated.title },
        success: true,
    }
}

async function getApplicationDetails(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const applicationId = args.applicationId as string
    if (!applicationId) {
        return { tool: "get_application_details", cardType: "error", title: "Missing ID", data: null, success: false, error: "applicationId is required" }
    }

    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: { select: { title: true, companyId: true } },
        },
    })

    if (!app) {
        return { tool: "get_application_details", cardType: "error", title: "Not found", data: null, success: false, error: "Application not found" }
    }

    // Security: company users can only see applications for their own internships
    if (ctx.role !== "STUDENT" && app.internship.companyId !== ctx.companyId) {
        return { tool: "get_application_details", cardType: "error", title: "Not found", data: null, success: false, error: "Application not found" }
    }
    // Security: students can only see their own applications
    if (ctx.role === "STUDENT" && app.studentId !== ctx.userId) {
        return { tool: "get_application_details", cardType: "error", title: "Not found", data: null, success: false, error: "Application not found" }
    }

    // Get the student's portfolio for richer details
    const portfolio = await prisma.portfolio.findUnique({
        where: { studentId: app.studentId },
        select: { fullName: true, headline: true, skills: true, bio: true },
    })
    const studentUser = await prisma.user.findUnique({
        where: { id: app.studentId },
        select: { email: true },
    })

    return {
        tool: "get_application_details",
        cardType: "application-detail",
        title: `Application — ${app.internship.title}`,
        data: {
            id: app.id,
            status: app.status,
            coverLetter: app.coverLetter,
            appliedAt: app.createdAt.toISOString(),
            student: {
                name: portfolio?.fullName,
                email: studentUser?.email,
                headline: portfolio?.headline,
                skills: portfolio?.skills ?? [],
                bio: portfolio?.bio,
            },
        },
        success: true,
    }
}

async function listNotifications(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const unreadOnly = (args.unreadOnly as boolean) ?? false

    const notifications = await prisma.notification.findMany({
        where: {
            userId: ctx.userId,
            ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, type: true, message: true, read: true, createdAt: true },
    })

    return {
        tool: "list_notifications",
        cardType: "notification-list",
        title: unreadOnly ? "Unread Notifications" : "Recent Notifications",
        data: notifications.map((n) => ({
            id: n.id,
            type: n.type,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt.toISOString(),
        })),
        success: true,
    }
}

async function markNotificationsRead(ctx: UserContext): Promise<ToolResult> {
    await prisma.notification.updateMany({
        where: { userId: ctx.userId, read: false },
        data: { read: true },
    })

    return {
        tool: "mark_notifications_read",
        cardType: "action-success",
        title: "Notifications cleared",
        data: { message: "All notifications marked as read." },
        success: true,
    }
}

async function searchPastSessions(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const query = (args.query as string) || ""
    if (!query.trim()) {
        return {
            tool: "search_past_sessions",
            cardType: "error",
            title: "No query",
            data: null,
            success: false,
            error: "Please provide a search term.",
        }
    }

    const limit = Math.min((args.limit as number) || 10, 20)
    const results = await searchAcrossSessions(ctx.userId, query, limit)

    return {
        tool: "search_past_sessions",
        cardType: "session-search-results",
        title: `Found ${results.length} result(s) for "${query}"`,
        data: results.map(r => ({
            sessionId: r.sessionId,
            sessionName: r.sessionName,
            sessionDate: r.sessionDate,
            snippet: r.matchingSnippet,
            role: r.role,
            confidenceScore: r.confidenceScore,
            sourceLabel: `From: "${r.sessionName}" • ${r.sessionDate}${r.confidenceScore != null ? ` • Score: ${r.confidenceScore}%` : ""}`,
        })),
        success: true,
    }
}

// ─── Phase 2: Linky applies for students ─────────────────────────────────────

async function applyToInternship(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const internshipId = args.internshipId as string
    if (!internshipId) {
        return { tool: "apply_to_internship", cardType: "error", title: "Missing ID", data: null, success: false, error: "internshipId is required" }
    }

    // Check if already applied
    const existing = await prisma.application.findFirst({
        where: { studentId: ctx.userId, internshipId },
    })
    if (existing) {
        return {
            tool: "apply_to_internship",
            cardType: "error",
            title: "Already applied",
            data: null,
            success: false,
            error: "You have already applied to this internship.",
        }
    }

    // Fetch internship, portfolio, and AI profile for the confidence-based application
    const [internship, portfolio, aiProfile] = await Promise.all([
        prisma.internship.findUnique({
            where: { id: internshipId },
            select: {
                id: true, title: true, description: true, qualifications: true,
                skills: true, applicationEnd: true,
                company: { select: { name: true, id: true } },
            },
        }),
        prisma.portfolio.findUnique({
            where: { studentId: ctx.userId },
            select: { fullName: true, bio: true, skills: true, experience: true, headline: true, education: true },
        }),
        prisma.aIProfile.findUnique({
            where: { studentId: ctx.userId },
            include: { confidenceScore: true },
        }),
    ])

    if (!internship) {
        return { tool: "apply_to_internship", cardType: "error", title: "Not found", data: null, success: false, error: "Internship not found" }
    }

    // Check deadline
    if (internship.applicationEnd && internship.applicationEnd < new Date()) {
        return { tool: "apply_to_internship", cardType: "error", title: "Deadline passed", data: null, success: false, error: "The application deadline for this internship has passed." }
    }

    const confidenceScore = aiProfile?.confidenceScore?.overallScore ?? 0
    const studentName = portfolio?.fullName ?? "Student"

    // Build Linky's AI pitch — this replaces cover letters entirely
    // Linky generates a short "why this student fits" summary for the company
    const skillsStr = Array.isArray(portfolio?.skills) ? portfolio.skills.join(", ") : ""
    const aiSkills = aiProfile?.skillsAssessment ? JSON.stringify(aiProfile.skillsAssessment) : ""
    const aiGoals = aiProfile?.careerGoals ? JSON.stringify(aiProfile.careerGoals) : ""

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are Linky, an AI middleman matching Bulgarian students to internships. Generate a SHORT (max 100 words) "Linky Match Summary" explaining why this student is a good fit. This is NOT a cover letter — it's an AI-generated match evaluation. Be direct, highlight specific skill overlaps and potential. Use bullet points.`,
            },
            {
                role: "user",
                content: `Student: ${studentName}
Headline: ${portfolio?.headline ?? "N/A"}
Skills: ${skillsStr || aiSkills || "N/A"}
Career goals: ${aiGoals || "N/A"}
Education: ${portfolio?.education ?? "N/A"}
Confidence Score: ${confidenceScore}/100

Internship: ${internship.title}
Required skills: ${(internship.skills || []).join(", ")}
Description: ${internship.description?.slice(0, 300) ?? "N/A"}`,
            },
        ],
        max_tokens: 200,
        temperature: 0.3,
    })
    const linkyMatchSummary = completion.choices[0].message.content ?? null

    // Create the application — no cover letter, just Linky's match summary in metadata
    const application = await prisma.application.create({
        data: {
            studentId: ctx.userId,
            internshipId,
            status: "PENDING",
        },
    })

    // Notify the company with Linky's AI evaluation
    const companyOwner = internship.company?.id
        ? await prisma.company.findUnique({
              where: { id: internship.company.id },
              select: { ownerId: true },
          })
        : null

    if (companyOwner?.ownerId) {
        await prisma.notification.create({
            data: {
                userId: companyOwner.ownerId,
                type: "APPLICATION_SUBMITTED",
                title: `New Match: ${studentName} → ${internship.title}`,
                message: `Linky matched **${studentName}** (Score: ${confidenceScore}/100) to "${internship.title}". ${linkyMatchSummary?.slice(0, 150) ?? ""}`,
                link: `/dashboard/company/applications`,
                metadata: JSON.stringify({
                    applicationId: application.id,
                    internshipId,
                    confidenceScore,
                    linkyMatchSummary,
                    appliedViaLinky: true,
                }),
            },
        })
    }

    return {
        tool: "apply_to_internship",
        cardType: "action-success",
        title: `Applied to ${internship.title}!`,
        data: {
            applicationId: application.id,
            internshipTitle: internship.title,
            company: internship.company?.name ?? "",
            confidenceScore,
            matchSummary: linkyMatchSummary,
            message: `Done! I matched you to "${internship.title}" at ${internship.company?.name}. Your profile (${confidenceScore}/100) speaks for itself — no cover letter needed.`,
        },
        success: true,
    }
}

// ─── Phase 3: Company tools ──────────────────────────────────────────────────

async function draftInternshipFromDescription(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const description = args.naturalDescription as string
    if (!description) {
        return { tool: "draft_internship_from_description", cardType: "error", title: "No description", data: null, success: false, error: "Please describe what kind of intern you need." }
    }

    // Use AI to parse the natural language into structured internship data
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are Linky, helping a Bulgarian company create an internship posting. Parse the company's natural language description into a structured internship posting. Be thorough and professional. If details are missing, use sensible defaults for the Bulgarian market.

Respond ONLY in valid JSON:
{
    "title": "string — professional internship title",
    "description": "string — 2-3 paragraph professional description of the role, responsibilities, and what the intern will learn",
    "qualifications": "string — required qualifications and nice-to-haves",
    "skills": ["array", "of", "required", "skills"],
    "location": "string — city or 'Remote'",
    "paid": true/false,
    "salary": number or null (monthly in BGN),
    "requiresCoverLetter": true/false,
    "applicationEnd": "YYYY-MM-DD — default 30 days from now",
    "startDate": "YYYY-MM-DD or null",
    "endDate": "YYYY-MM-DD or null",
    "durationMonths": number or null
}`,
            },
            { role: "user", content: description },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.3,
    })

    const raw = completion.choices[0].message.content
    if (!raw) {
        return { tool: "draft_internship_from_description", cardType: "error", title: "AI error", data: null, success: false, error: "Failed to generate internship draft." }
    }

    const draft = JSON.parse(raw)

    return {
        tool: "draft_internship_from_description",
        cardType: "internship-draft",
        title: `Draft: ${draft.title}`,
        data: {
            ...draft,
            status: "draft",
            message: "Here's the internship I drafted. Review it and tell me to publish it, or let me know what to change.",
        },
        success: true,
    }
}

async function evaluateApplication(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const applicationId = args.applicationId as string
    if (!applicationId) {
        return { tool: "evaluate_application", cardType: "error", title: "Missing ID", data: null, success: false, error: "applicationId is required" }
    }

    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: { select: { title: true, description: true, qualifications: true, skills: true, companyId: true } },
            student: {
                select: {
                    email: true,
                    profile: { select: { name: true } },
                    portfolio: { select: { fullName: true, headline: true, bio: true, skills: true, experience: true, education: true, projects: true } },
                    aiProfile: { select: { careerGoals: true, skillsAssessment: true, personalityTraits: true } },
                },
            },
        },
    })

    if (!app) {
        return { tool: "evaluate_application", cardType: "error", title: "Not found", data: null, success: false, error: "Application not found" }
    }
    if (app.internship.companyId !== ctx.companyId) {
        return { tool: "evaluate_application", cardType: "error", title: "Not authorized", data: null, success: false, error: "This application is not for your company." }
    }

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are Linky's Talent Evaluator. Evaluate how well this student matches the internship requirements. Be honest, fair, and look for potential — not just exact skill matches. Consider transferable skills and growth potential.

Respond ONLY in valid JSON:
{
    "matchScore": 0-100,
    "verdict": "strong_match" | "good_match" | "partial_match" | "weak_match",
    "strengths": ["2-3 specific strengths"],
    "concerns": ["0-2 specific concerns or gaps"],
    "recommendation": "1-2 sentence recommendation for the hiring manager",
    "standoutFactor": "The single most impressive thing about this candidate (or null)"
}`,
            },
            {
                role: "user",
                content: `Internship: ${app.internship.title}
Description: ${app.internship.description?.slice(0, 500)}
Required skills: ${(app.internship.skills || []).join(", ")}
Qualifications: ${app.internship.qualifications?.slice(0, 300) ?? "N/A"}

Student: ${app.student.portfolio?.fullName ?? app.student.profile?.name ?? app.student.email}
Headline: ${app.student.portfolio?.headline ?? "N/A"}
Bio: ${app.student.portfolio?.bio ?? "N/A"}
Skills: ${(app.student.portfolio?.skills || []).join(", ") || "N/A"}
Experience: ${app.student.portfolio?.experience ?? "N/A"}
Education: ${app.student.portfolio?.education ?? "N/A"}
Cover letter: ${app.coverLetter?.slice(0, 400) ?? "None submitted"}
AI Profile goals: ${JSON.stringify(app.student.aiProfile?.careerGoals) ?? "N/A"}`,
            },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.2,
    })

    const raw = completion.choices[0].message.content
    if (!raw) {
        return { tool: "evaluate_application", cardType: "error", title: "AI error", data: null, success: false, error: "Evaluation failed" }
    }

    const evaluation = JSON.parse(raw)

    return {
        tool: "evaluate_application",
        cardType: "application-evaluation",
        title: `Evaluation: ${app.student.portfolio?.fullName ?? "Candidate"}`,
        data: {
            applicationId,
            studentName: app.student.portfolio?.fullName ?? app.student.profile?.name ?? app.student.email,
            internshipTitle: app.internship.title,
            ...evaluation,
        },
        success: true,
    }
}

async function bulkEvaluateApplications(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const internshipId = args.internshipId as string
    if (!internshipId) {
        return { tool: "bulk_evaluate_applications", cardType: "error", title: "Missing ID", data: null, success: false, error: "internshipId is required" }
    }

    const internship = await prisma.internship.findUnique({
        where: { id: internshipId, companyId: ctx.companyId },
        select: { title: true, description: true, qualifications: true, skills: true },
    })

    if (!internship) {
        return { tool: "bulk_evaluate_applications", cardType: "error", title: "Not found", data: null, success: false, error: "Internship not found or not yours." }
    }

    const applications = await prisma.application.findMany({
        where: { internshipId, status: "PENDING" },
        include: {
            student: {
                select: {
                    email: true,
                    profile: { select: { name: true } },
                    portfolio: { select: { fullName: true, headline: true, skills: true, bio: true } },
                },
            },
        },
        take: 20,
    })

    if (applications.length === 0) {
        return {
            tool: "bulk_evaluate_applications",
            cardType: "application-evaluation",
            title: "No pending applications",
            data: { candidates: [], message: "There are no pending applications for this internship." },
            success: true,
        }
    }

    // Build candidate summaries for batch evaluation
    const candidateSummaries = applications.map(app => ({
        applicationId: app.id,
        name: app.student.portfolio?.fullName ?? app.student.profile?.name ?? app.student.email,
        headline: app.student.portfolio?.headline ?? "",
        skills: (app.student.portfolio?.skills || []).join(", "),
        bio: app.student.portfolio?.bio?.slice(0, 200) ?? "",
        coverLetter: app.coverLetter?.slice(0, 200) ?? "None",
    }))

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are Linky's Talent Evaluator. Rank these candidates for the internship by fit. Be fair and look for potential.

Respond ONLY in valid JSON:
{
    "rankings": [
        {
            "applicationId": "string",
            "matchScore": 0-100,
            "verdict": "strong_match" | "good_match" | "partial_match" | "weak_match",
            "oneLiner": "One sentence explaining why they're a good/bad fit"
        }
    ]
}
Sort by matchScore descending.`,
            },
            {
                role: "user",
                content: `Internship: ${internship.title}
Description: ${internship.description?.slice(0, 400)}
Required skills: ${(internship.skills || []).join(", ")}
Qualifications: ${internship.qualifications?.slice(0, 300) ?? "N/A"}

Candidates:
${JSON.stringify(candidateSummaries)}`,
            },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.2,
    })

    const raw = completion.choices[0].message.content
    if (!raw) {
        return { tool: "bulk_evaluate_applications", cardType: "error", title: "AI error", data: null, success: false, error: "Bulk evaluation failed" }
    }

    const result = JSON.parse(raw)

    // Enrich with candidate names
    const enrichedRankings = (result.rankings || []).map((r: { applicationId: string; matchScore: number; verdict: string; oneLiner: string }) => {
        const app = applications.find(a => a.id === r.applicationId)
        return {
            ...r,
            studentName: app?.student.portfolio?.fullName ?? app?.student.profile?.name ?? app?.student.email ?? "Unknown",
        }
    })

    return {
        tool: "bulk_evaluate_applications",
        cardType: "application-rankings",
        title: `${enrichedRankings.length} Candidates Ranked for "${internship.title}"`,
        data: {
            internshipTitle: internship.title,
            candidates: enrichedRankings,
            message: `I've ranked ${enrichedRankings.length} candidates by fit. Want me to approve the top match or view details on anyone?`,
        },
        success: true,
    }
}

async function proposeInterviewSlots(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const applicationId = args.applicationId as string
    if (!applicationId) {
        return { tool: "propose_interview_slots", cardType: "error", title: "Missing ID", data: null, success: false, error: "applicationId is required" }
    }

    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: { select: { title: true, companyId: true, company: { select: { name: true } } } },
            student: { select: { id: true, email: true, profile: { select: { name: true } }, portfolio: { select: { fullName: true } } } },
        },
    })

    if (!app || app.internship.companyId !== ctx.companyId) {
        return { tool: "propose_interview_slots", cardType: "error", title: "Not found", data: null, success: false, error: "Application not found or not authorized." }
    }

    const slots = args.slots as Array<{ date: string; time: string; durationMinutes?: number }>
    const location = (args.location as string) || "To be confirmed"
    const notes = (args.notes as string) || ""

    // Create interview for the first proposed slot
    const firstSlot = slots[0]
    const scheduledAt = new Date(`${firstSlot.date}T${firstSlot.time}:00`)
    const duration = firstSlot.durationMinutes || 30

    const interview = await prisma.interview.create({
        data: {
            applicationId,
            scheduledAt,
            duration,
            location,
            notes: notes + (slots.length > 1 ? `\n\nAlternative slots: ${slots.slice(1).map(s => `${s.date} at ${s.time}`).join(", ")}` : ""),
            status: "SCHEDULED",
        },
    })

    // Notify the student
    const studentName = app.student.portfolio?.fullName ?? app.student.profile?.name ?? app.student.email
    await prisma.notification.create({
        data: {
            userId: app.student.id,
            type: "INTERVIEW_SCHEDULED",
            title: "Interview Scheduled! 🎉",
            message: `${app.internship.company.name} wants to interview you for "${app.internship.title}"! ${scheduledAt.toLocaleDateString("en-GB")} at ${scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. Location: ${location}`,
            link: `/dashboard/student/interviews`,
            metadata: JSON.stringify({ interviewId: interview.id, applicationId, slots }),
        },
    })

    return {
        tool: "propose_interview_slots",
        cardType: "action-success",
        title: `Interview scheduled with ${studentName}`,
        data: {
            interviewId: interview.id,
            studentName,
            scheduledAt: scheduledAt.toISOString(),
            duration,
            location,
            allSlots: slots,
            message: `Interview scheduled with ${studentName} for ${scheduledAt.toLocaleDateString("en-GB")} at ${scheduledAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. They've been notified.`,
        },
        success: true,
    }
}

async function approveApplication(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const applicationId = args.applicationId as string
    if (!applicationId) {
        return { tool: "approve_application", cardType: "error", title: "Missing ID", data: null, success: false, error: "applicationId is required" }
    }

    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: { select: { title: true, companyId: true, company: { select: { name: true } } } },
            student: { select: { id: true, portfolio: { select: { fullName: true } }, profile: { select: { name: true } } } },
        },
    })

    if (!app || app.internship.companyId !== ctx.companyId) {
        return { tool: "approve_application", cardType: "error", title: "Not found", data: null, success: false, error: "Application not found or not authorized." }
    }

    if (app.status !== "PENDING") {
        return { tool: "approve_application", cardType: "error", title: "Cannot approve", data: null, success: false, error: `Application is already ${app.status}.` }
    }

    await prisma.application.update({
        where: { id: applicationId },
        data: { status: "APPROVED" },
    })

    const studentName = app.student.portfolio?.fullName ?? app.student.profile?.name ?? "Student"

    // Notify student
    await prisma.notification.create({
        data: {
            userId: app.student.id,
            type: "APPLICATION_APPROVED",
            title: "Application Approved! 🎉",
            message: `Great news! ${app.internship.company.name} approved your application for "${app.internship.title}"!`,
            link: `/dashboard/student/internships/applied`,
            metadata: JSON.stringify({ applicationId, internshipId: app.internshipId }),
        },
    })

    return {
        tool: "approve_application",
        cardType: "action-success",
        title: `${studentName} approved`,
        data: {
            applicationId,
            studentName,
            internshipTitle: app.internship.title,
            message: `${studentName} has been approved for "${app.internship.title}". The student has been notified. Want me to schedule an interview?`,
        },
        success: true,
    }
}

async function rejectApplication(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const applicationId = args.applicationId as string
    if (!applicationId) {
        return { tool: "reject_application", cardType: "error", title: "Missing ID", data: null, success: false, error: "applicationId is required" }
    }

    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: { select: { title: true, companyId: true, company: { select: { name: true } } } },
            student: { select: { id: true, portfolio: { select: { fullName: true } }, profile: { select: { name: true } } } },
        },
    })

    if (!app || app.internship.companyId !== ctx.companyId) {
        return { tool: "reject_application", cardType: "error", title: "Not found", data: null, success: false, error: "Application not found or not authorized." }
    }

    if (app.status !== "PENDING") {
        return { tool: "reject_application", cardType: "error", title: "Cannot reject", data: null, success: false, error: `Application is already ${app.status}.` }
    }

    await prisma.application.update({
        where: { id: applicationId },
        data: { status: "REJECTED" },
    })

    const studentName = app.student.portfolio?.fullName ?? app.student.profile?.name ?? "Student"

    // Notify student
    await prisma.notification.create({
        data: {
            userId: app.student.id,
            type: "APPLICATION_REJECTED",
            title: "Application Update",
            message: `Your application for "${app.internship.title}" at ${app.internship.company.name} was not selected. Don't worry — keep exploring other opportunities!`,
            link: `/dashboard/student/internships`,
            metadata: JSON.stringify({ applicationId, internshipId: app.internshipId }),
        },
    })

    return {
        tool: "reject_application",
        cardType: "action-success",
        title: `${studentName} rejected`,
        data: {
            applicationId,
            studentName,
            internshipTitle: app.internship.title,
            message: `${studentName}'s application for "${app.internship.title}" has been rejected. They've been notified with encouragement.`,
        },
        success: true,
    }
}

// ─── Phase 6: Autonomous Mode Tools ─────────────────────────────────────────

async function toggleAutoApply(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    const enabled = args.enabled as boolean
    const threshold = typeof args.threshold === "number" ? Math.max(50, Math.min(100, args.threshold)) : undefined

    const aiProfile = await prisma.aIProfile.upsert({
        where: { studentId: ctx.userId },
        update: {
            autoApplyEnabled: enabled,
            ...(threshold !== undefined ? { autoApplyThreshold: threshold } : {}),
        },
        create: {
            studentId: ctx.userId,
            autoApplyEnabled: enabled,
            autoApplyThreshold: threshold ?? 80,
        },
    })

    return {
        tool: "toggle_auto_apply",
        cardType: "auto-apply-settings",
        title: enabled ? "Auto-Apply Enabled" : "Auto-Apply Disabled",
        data: {
            enabled: aiProfile.autoApplyEnabled,
            threshold: aiProfile.autoApplyThreshold,
            autoApplyCount: aiProfile.autoApplyCount,
            message: enabled
                ? `Auto-apply is ON! Linky will automatically apply to internships with ${aiProfile.autoApplyThreshold}%+ match score.`
                : "Auto-apply is OFF. Linky will ask before applying.",
        },
        success: true,
    }
}

async function getAutoApplySettings(ctx: UserContext): Promise<ToolResult> {
    const aiProfile = await prisma.aIProfile.findUnique({
        where: { studentId: ctx.userId },
        select: {
            autoApplyEnabled: true,
            autoApplyThreshold: true,
            autoApplyCount: true,
            lastAutoApplyAt: true,
        },
    })

    return {
        tool: "get_auto_apply_settings",
        cardType: "auto-apply-settings",
        title: "Auto-Apply Settings",
        data: {
            enabled: aiProfile?.autoApplyEnabled ?? false,
            threshold: aiProfile?.autoApplyThreshold ?? 80,
            autoApplyCount: aiProfile?.autoApplyCount ?? 0,
            lastAutoApplyAt: aiProfile?.lastAutoApplyAt?.toISOString() ?? null,
            message: aiProfile?.autoApplyEnabled
                ? `Auto-apply is ON (threshold: ${aiProfile.autoApplyThreshold}%). Linky has auto-applied ${aiProfile.autoApplyCount} time(s).`
                : "Auto-apply is OFF. Enable it to let Linky apply for you automatically!",
        },
        success: true,
    }
}

