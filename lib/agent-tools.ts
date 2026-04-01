import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"
import { searchAcrossSessions } from "@/lib/ai/ai-search"
import { normalizeSkills } from "@/lib/ai/skill-taxonomy"
import { calculateAndSaveConfidenceScore } from "@/lib/confidence-score"

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
            case "update_match_preferences":
                return await updateMatchPreferences(args, ctx)
            case "preview_auto_apply":
                return await previewAutoApply(ctx)
            case "get_confidence_breakdown":
                return await getConfidenceBreakdown(ctx)
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
            // Only show internships with open applications
            applicationEnd: { gte: new Date() },
            AND: [
                query
                    ? {
                          OR: [
                              { title: { contains: query, mode: "insensitive" as const } },
                              { description: { contains: query, mode: "insensitive" as const } },
                              { qualifications: { contains: query, mode: "insensitive" as const } },
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
        orderBy: { applicationEnd: "asc" },
    })

    // If no results for a specific query, fall back to all open internships
    const results = internships.length > 0 ? internships : (
        !query && !location ? [] : await prisma.internship.findMany({
            where: { applicationEnd: { gte: new Date() } },
            include: { company: { select: { name: true } } },
            take: 10,
            orderBy: { applicationEnd: "asc" },
        })
    )

    return {
        tool: "search_internships",
        cardType: "internship-list",
        title: `Found ${results.length} internships`,
        data: results.map((i) => ({
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

    // Merge incoming skills with existing instead of replacing
    if (Array.isArray(args.skills) && args.skills.length > 0) {
        const existing = await prisma.portfolio.findUnique({
            where: { studentId: ctx.userId },
            select: { skills: true },
        })
        const incomingNormalized = normalizeSkills(args.skills as string[])
        const existingNormalized = normalizeSkills(existing?.skills ?? [])
        // Deduplicate: union of both arrays by lowercase key
        const merged = normalizeSkills([...existingNormalized, ...incomingNormalized])
        data.skills = merged
    }

    const portfolio = await prisma.portfolio.upsert({
        where: { studentId: ctx.userId },
        update: data,
        create: {
            studentId: ctx.userId,
            fullName: "Student",
            ...data
        }
    })

    // Recalculate score immediately so the student sees the updated value in this turn
    let updatedScore: { overall: number; profileCompleteness: number; profilingDepth: number; endorsementQuality: number; activityScore: number } | null = null
    try {
        updatedScore = await calculateAndSaveConfidenceScore(ctx.userId)
    } catch {
        // Non-fatal — score will recalculate at end of turn
    }

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
            confidenceScore: updatedScore ? {
                overall: updatedScore.overall,
                profileCompleteness: updatedScore.profileCompleteness,
                profilingDepth: updatedScore.profilingDepth,
                endorsementQuality: updatedScore.endorsementQuality,
                activityScore: updatedScore.activityScore,
            } : null,
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
    const query = ((args.query as string) || "").trim()
    const queryLower = query.toLowerCase()

    // Fetch all students with portfolio + AI profile (confidence score)
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            profile: { select: { name: true } },
            portfolio: { select: { fullName: true, headline: true, skills: true } },
            aiProfile: { include: { confidenceScore: true } },
        },
        take: 100,
    })

    // Filter and rank: name/email match scores higher, then skill match
    const scored = students
        .map((s) => {
            const name = (s.portfolio?.fullName || s.profile?.name || s.email || "").toLowerCase()
            const skills = (s.portfolio?.skills || []) as string[]
            const skillsLower = skills.map(sk => sk.toLowerCase())
            const score = s.aiProfile?.confidenceScore?.overallScore ?? 0

            if (!query) return { student: s, rank: score }

            // Name / email match
            if (name.includes(queryLower) || s.email.toLowerCase().includes(queryLower)) {
                return { student: s, rank: 100 + score }
            }

            // Skill match — check if any skill contains the query keyword
            const skillMatch = skillsLower.some(sk => sk.includes(queryLower) || queryLower.includes(sk))
            if (skillMatch) {
                return { student: s, rank: 80 + score }
            }

            return { student: s, rank: -1 } // no match
        })
        .filter(r => !query || r.rank >= 0)
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 10)

    return {
        tool: "search_candidates",
        cardType: "candidate-list",
        title: `${scored.length} candidate${scored.length !== 1 ? "s" : ""} found`,
        data: scored.map(({ student: s }) => ({
            id: s.id,
            name: s.portfolio?.fullName || s.profile?.name || s.email,
            headline: s.portfolio?.headline,
            skills: (s.portfolio?.skills || []) as string[],
            confidenceScore: s.aiProfile?.confidenceScore?.overallScore ?? null,
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

    const [portfolio, aiProfile] = await Promise.all([
        prisma.portfolio.findUnique({
            where: { studentId: ctx.userId },
            select: { skills: true, interests: true, headline: true },
        }),
        prisma.aIProfile.findUnique({
            where: { studentId: ctx.userId },
            select: { skillsAssessment: true, careerGoals: true, preferences: true, availability: true },
        }),
    ])

    const skillsArr = normalizeSkills(portfolio?.skills ?? [])
    const interests = portfolio?.interests ?? []
    // Use all canonical skills — no slice cap
    const searchTerms = [...skillsArr, ...interests]

    const internshipSelectFields = {
        id: true,
        title: true,
        location: true,
        paid: true,
        salary: true,
        skills: true,
        description: true,
        startDate: true,
        endDate: true,
        applicationEnd: true,
        company: { select: { name: true } },
    } as const

    // ── Tier 1: Match on skills[] array (hasSome) + text search ──────────────
    // Wrapped in try-catch: hasSome can fail on some Prisma/DB configs — tier 2 always runs as safety net
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let internships: any[] = []
    try {
        internships = await prisma.internship.findMany({
            where: {
                applicationEnd: { gte: new Date() },
                ...(skillsArr.length > 0
                    ? {
                          OR: [
                              // Direct skills array overlap (PostgreSQL && operator via Prisma hasSome)
                              { skills: { hasSome: skillsArr } },
                              // Text search across description/title/qualifications
                              ...searchTerms.map((term) => ({
                                  OR: [
                                      { title: { contains: term, mode: "insensitive" as const } },
                                      { description: { contains: term, mode: "insensitive" as const } },
                                      { qualifications: { contains: term, mode: "insensitive" as const } },
                                  ],
                              })),
                          ],
                      }
                    : {}),
            },
            take: Math.max(limit * 4, 20),
            orderBy: { applicationEnd: "asc" },
            select: internshipSelectFields,
        })
    } catch {
        // hasSome or query failed — fall through to tier 2
        internships = []
    }

    // ── Tier 2: All open internships (no skill filter) ────────────────────────
    if (internships.length < 3) {
        try {
            internships = await prisma.internship.findMany({
                where: { applicationEnd: { gte: new Date() } },
                take: 20,
                orderBy: { applicationEnd: "asc" },
                select: internshipSelectFields,
            })
        } catch {
            internships = []
        }
    }

    // ── Tier 3: Absolute fallback — ignore expiry, return anything ────────────
    if (internships.length === 0) {
        try {
            internships = await prisma.internship.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                select: internshipSelectFields,
            })
        } catch {
            internships = []
        }
    }

    if (internships.length === 0) {
        return {
            tool: "get_internship_recommendations",
            cardType: "internship-list",
            title: "No internships available",
            data: [],
            success: true,
        }
    }

    // Use hybrid scoring to rank and explain matches
    const { computeBaseScore, extractStudentSkills } = await import("@/lib/ai/hybrid-scoring")

    const studentSkills = extractStudentSkills(
        aiProfile?.skillsAssessment,
        portfolio?.skills
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goals = aiProfile?.careerGoals as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prefs = aiProfile?.preferences as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const availability = aiProfile?.availability as any

    const studentProfile = {
        skills: studentSkills,
        location: prefs?.location ?? null,
        availabilityStart: availability?.startDate ?? null,
        hoursPerWeek: availability?.hoursPerWeek ?? null,
        remotePreference: prefs?.remote ?? null,
        salaryExpectation: prefs?.salary ?? null,
        careerGoals: goals ? {
            industries: goals.industries ?? [],
            dreamJob: goals.dreamJob ?? null,
            shortTermGoal: goals.shortTermGoal ?? null,
        } : null,
        experienceCount: 0,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoredInternships: any[] = internships
        .map((i: any) => {
            try {
                const internshipProfile = {
                    skills: Array.isArray(i.skills) ? i.skills : [],
                    location: i.location,
                    paid: i.paid,
                    salary: i.salary ? Number(i.salary) : null,
                    startDate: i.startDate?.toISOString() ?? null,
                    endDate: i.endDate?.toISOString() ?? null,
                    description: i.description,
                    title: i.title,
                }
                const breakdown = computeBaseScore(studentProfile, internshipProfile)
                return { internship: i, breakdown }
            } catch {
                // If scoring fails for this internship, return a base score of 0
                return { internship: i, breakdown: { baseScore: 0, matchedSkills: [], missingSkills: [] } }
            }
        })
        .sort((a: any, b: any) => b.breakdown.baseScore - a.breakdown.baseScore)
        .slice(0, limit)

    return {
        tool: "get_internship_recommendations",
        cardType: "internship-list",
        title: `Top ${scoredInternships.length} Recommendations for You`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: scoredInternships.map(({ internship: i, breakdown }: any) => ({
            id: i.id,
            title: i.title,
            company: i.company?.name ?? "",
            location: i.location,
            paid: i.paid,
            salary: i.salary,
            applicationEnd: i.applicationEnd?.toISOString?.() ?? null,
            matchScore: breakdown.baseScore,
            skillsAligned: breakdown.matchedSkills ?? [],
            missingSkills: breakdown.missingSkills ?? [],
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
            data: { errorCode: "ALREADY_APPLIED", applicationId: existing.id, status: existing.status },
            success: false,
            error: `You already applied to this internship and your application is currently ${existing.status}. Want me to find other open internships instead?`,
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
        // Suggest alternatives when the specific internship can't be found
        const alternatives = await prisma.internship.findMany({
            where: { applicationEnd: { gte: new Date() } },
            orderBy: { applicationEnd: "asc" },
            take: 3,
            select: { id: true, title: true, location: true, company: { select: { name: true } } },
        })
        return {
            tool: "apply_to_internship",
            cardType: "error",
            title: "Internship not found",
            data: { errorCode: "NOT_FOUND", alternatives },
            success: false,
            error: `The internship with ID "${internshipId}" was not found. It may have been removed. Here are open alternatives you can apply to instead.`,
        }
    }

    // Check deadline
    if (internship.applicationEnd && internship.applicationEnd < new Date()) {
        const alternatives = await prisma.internship.findMany({
            where: { applicationEnd: { gte: new Date() } },
            orderBy: { applicationEnd: "asc" },
            take: 3,
            select: { id: true, title: true, location: true, company: { select: { name: true } } },
        })
        return {
            tool: "apply_to_internship",
            cardType: "error",
            title: "Deadline passed",
            data: {
                errorCode: "DEADLINE_PASSED",
                deadline: internship.applicationEnd.toISOString(),
                alternatives,
            },
            success: false,
            error: `The application deadline for "${internship.title}" was ${internship.applicationEnd.toLocaleDateString("bg-BG")}. Here are internships still open for applications.`,
        }
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

async function updateMatchPreferences(
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    if (!ctx.companyId) {
        return { tool: "update_match_preferences", cardType: "error", title: "Not a company", data: null, success: false, error: "This tool is only available for companies." }
    }

    const preferredSkills = Array.isArray(args.preferredSkills) ? args.preferredSkills as string[] : undefined
    const excludedSkills = Array.isArray(args.excludedSkills) ? args.excludedSkills as string[] : undefined
    const preferredTraits = typeof args.preferredTraits === "string" ? args.preferredTraits : undefined
    const notes = typeof args.notes === "string" ? args.notes : undefined

    const result = await prisma.companyMatchPreferences.upsert({
        where: { companyId: ctx.companyId },
        update: {
            ...(preferredSkills !== undefined && { preferredSkills }),
            ...(excludedSkills !== undefined && { excludedSkills }),
            ...(preferredTraits !== undefined && { preferredTraits }),
            ...(notes !== undefined && { notes }),
        },
        create: {
            companyId: ctx.companyId,
            preferredSkills: preferredSkills ?? [],
            excludedSkills: excludedSkills ?? [],
            preferredTraits: preferredTraits ?? null,
            notes: notes ?? null,
        },
    })

    return {
        tool: "update_match_preferences",
        cardType: "action-success",
        title: "Match Preferences Updated",
        data: {
            preferredSkills: result.preferredSkills,
            excludedSkills: result.excludedSkills,
            preferredTraits: result.preferredTraits,
            notes: result.notes,
            message: "Your match preferences have been saved. Linky will use these to push better candidates to you.",
        },
        success: true,
    }
}

async function previewAutoApply(ctx: UserContext): Promise<ToolResult> {
    const [aiProfileRaw, portfolio, applications] = await Promise.all([
        prisma.aIProfile.findUnique({
            where: { studentId: ctx.userId },
            select: {
                autoApplyThreshold: true,
                autoApplyEnabled: true,
                skillsAssessment: true,
                careerGoals: true,
            },
        }),
        prisma.portfolio.findUnique({
            where: { studentId: ctx.userId },
            select: { skills: true, headline: true, bio: true },
        }),
        prisma.application.findMany({
            where: { studentId: ctx.userId },
            select: { internshipId: true },
        }),
    ])

    // Cast to include new schema fields that are pending prisma generate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiProfile = aiProfileRaw as typeof aiProfileRaw & { autoApplyPreviewMode?: boolean; autoApplyApprovedCount?: number }

    if (!aiProfile?.autoApplyEnabled) {
        return {
            tool: "preview_auto_apply",
            cardType: "action-success",
            title: "Auto-Apply is Off",
            data: { message: "Auto-apply is currently disabled. Enable it first to see match previews." },
            success: false,
            error: "Auto-apply is disabled.",
        }
    }

    const threshold = aiProfile.autoApplyThreshold ?? 80
    const appliedIds = new Set(applications.map(a => a.internshipId))

    const openInternships = await prisma.internship.findMany({
        where: { applicationEnd: { gt: new Date() } },
        include: { company: { select: { name: true } } },
        take: 30,
    })

    const { computeBaseScore, extractStudentSkills } = await import("@/lib/ai/hybrid-scoring")

    const studentSkills = extractStudentSkills(aiProfile.skillsAssessment, portfolio?.skills)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goals = aiProfile.careerGoals as any

    const studentProfile = {
        skills: studentSkills,
        careerGoals: goals ? { industries: goals.industries ?? [], dreamJob: goals.dreamJob ?? null, shortTermGoal: goals.shortTermGoal ?? null } : null,
        experienceCount: 0,
        location: null, availabilityStart: null, hoursPerWeek: null, remotePreference: null, salaryExpectation: null,
    }

    // Score eligible internships and filter by threshold
    const drafts = openInternships
        .filter(i => !appliedIds.has(i.id))
        .map(i => {
            const internshipProfile = {
                skills: Array.isArray(i.skills) ? i.skills : [],
                location: i.location,
                paid: i.paid,
                salary: i.salary ? Number(i.salary) : null,
                startDate: i.startDate?.toISOString() ?? null,
                endDate: i.endDate?.toISOString() ?? null,
                description: i.description,
                title: i.title,
            }
            const breakdown = computeBaseScore(studentProfile, internshipProfile)
            return {
                id: i.id,
                title: i.title,
                company: i.company?.name ?? "",
                location: i.location,
                paid: i.paid,
                salary: i.salary,
                matchScore: breakdown.baseScore,
                skillsAligned: breakdown.matchedSkills,
                missingSkills: breakdown.missingSkills,
                matchReason: breakdown.matchedSkills.length > 0
                    ? `${breakdown.matchedSkills.length}/${(Array.isArray(i.skills) ? i.skills : []).length} skills matched — ${breakdown.matchedSkills.slice(0, 2).join(", ")} align well`
                    : "Career goals and internship type align",
            }
        })
        .filter(d => d.matchScore >= threshold)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)

    if (drafts.length === 0) {
        return {
            tool: "preview_auto_apply",
            cardType: "action-success",
            title: "No Matches Above Threshold",
            data: { message: `No internships currently score above your ${threshold}% threshold. Try lowering the threshold or check back when new postings open.` },
            success: true,
        }
    }

    const approvedCount = aiProfile.autoApplyApprovedCount ?? 0
    const titleSuffix = approvedCount >= 3 ? " — Try Autonomous Mode!" : ` — Review & Confirm`

    return {
        tool: "preview_auto_apply",
        cardType: "internship-list",
        title: `${drafts.length} Auto-Apply Draft${drafts.length > 1 ? "s" : ""} ≥ ${threshold}%${titleSuffix}`,
        data: drafts,
        success: true,
    }
}

// ─── Confidence Score Breakdown Tool ─────────────────────────────────────────

async function getConfidenceBreakdown(ctx: UserContext): Promise<ToolResult> {
    const [scoreRow, portfolio, aiProfile] = await Promise.all([
        prisma.confidenceScore.findFirst({
            where: { aiProfile: { studentId: ctx.userId } },
        }),
        prisma.portfolio.findUnique({
            where: { studentId: ctx.userId },
            select: { skills: true },
        }),
        prisma.aIProfile.findUnique({
            where: { studentId: ctx.userId },
            select: {
                personalInfo: true,
                careerGoals: true,
                personalityTraits: true,
                skillsAssessment: true,
                educationDetails: true,
                availability: true,
                preferences: true,
                questionsAnswered: true,
            },
        }),
    ])

    const overall = scoreRow?.overallScore ?? 0
    const completeness = scoreRow?.profileCompleteness ?? 0
    const depth = scoreRow?.profilingDepth ?? 0
    const endorsement = scoreRow?.endorsementQuality ?? 0
    const activity = scoreRow?.activityScore ?? 0

    // Derive what's populated for actionable guidance
    const filledFields: string[] = []
    const missingFields: string[] = []
    const allFields = [
        { key: "personalInfo", label: "Personal info (location, lifestyle)" },
        { key: "careerGoals", label: "Career goals (dream job, industries)" },
        { key: "personalityTraits", label: "Work style & personality" },
        { key: "skillsAssessment", label: "Skills assessment" },
        { key: "educationDetails", label: "Education details" },
        { key: "availability", label: "Availability (start date, hours/week)" },
        { key: "preferences", label: "Preferences (salary, company size)" },
    ]
    for (const f of allFields) {
        const val = aiProfile ? (aiProfile as Record<string, unknown>)[f.key] : null
        if (val && typeof val === "object" && Object.keys(val).length > 0) {
            filledFields.push(f.label)
        } else {
            missingFields.push(f.label)
        }
    }

    const portfolioSkillCount = normalizeSkills(portfolio?.skills ?? []).length
    const aiSkills = aiProfile?.skillsAssessment as { technical?: string[]; soft?: string[] } | null
    const totalSkills = normalizeSkills([
        ...(portfolio?.skills ?? []),
        ...(aiSkills?.technical ?? []),
        ...(aiSkills?.soft ?? []),
    ]).length
    const questionsAnswered = aiProfile?.questionsAnswered ?? 0

    // Build prioritised action roadmap
    const actions: { impact: number; label: string; detail: string }[] = []

    if (depth < 80) {
        if (totalSkills < 20) {
            const needed = 20 - totalSkills
            actions.push({
                impact: Math.round((needed / 20) * 50 * 0.3),
                label: `Add ${needed} more skills to your profile`,
                detail: `You have ${totalSkills} recognised skills. Reaching 20 gives maximum depth score (+${Math.round((needed / 20) * 15)} pts).`,
            })
        }
        if (missingFields.length > 0) {
            actions.push({
                impact: Math.round((missingFields.length / 7) * 30 * 0.3),
                label: `Complete ${missingFields.length} missing profile section${missingFields.length > 1 ? "s" : ""}`,
                detail: `Missing: ${missingFields.slice(0, 3).join(", ")}${missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : ""}.`,
            })
        }
        if (questionsAnswered < 15) {
            actions.push({
                impact: Math.round(((15 - questionsAnswered) / 15) * 20 * 0.3),
                label: `Answer ${15 - questionsAnswered} more profiling questions`,
                detail: "Short Q&A with Linky fills the formal profiling depth bonus.",
            })
        }
    }

    if (completeness < 100 && missingFields.length > 0) {
        actions.push({
            impact: Math.round((missingFields.length / 7) * 100 * 0.4),
            label: "Fill all AI profile sections",
            detail: `Profile completeness is ${completeness}%. Each section filled adds ${Math.round(100 / 7 * 0.4)} points.`,
        })
    }

    if (endorsement < 50) {
        actions.push({
            impact: Math.round((50 - endorsement) * 0.2),
            label: "Get endorsed by a company",
            detail: "Complete an internship or project where the company rates your skills (1–5). Each endorsement can add up to 20 points.",
        })
    }

    actions.sort((a, b) => b.impact - a.impact)

    return {
        tool: "get_confidence_breakdown",
        cardType: "confidence-breakdown",
        title: `Confidence Score: ${overall}/100`,
        data: {
            overall,
            breakdown: {
                profileCompleteness: { score: completeness, weight: "40%", description: "How many of your 7 AI profile sections are filled" },
                profilingDepth: { score: depth, weight: "30%", description: "Skill richness (skills count), profile sections filled, and Q&A completed" },
                endorsementQuality: { score: endorsement, weight: "20%", description: "Company ratings from past internships/experiences" },
                activityScore: { score: activity, weight: "10%", description: "How active you are on the platform" },
            },
            stats: {
                totalSkills: totalSkills,
                portfolioSkills: portfolioSkillCount,
                filledProfileSections: filledFields.length,
                totalProfileSections: 7,
                questionsAnswered,
                targetQuestions: 15,
            },
            filledFields,
            missingFields,
            topActions: actions.slice(0, 4),
            scoreHistory: Array.isArray(scoreRow?.scoreHistory)
                ? (scoreRow.scoreHistory as Array<{ score: number; date: string; reason: string }>).slice(-5)
                : [],
        },
        success: true,
    }
}

