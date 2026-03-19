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
    const data: Record<string, any> = {}
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

