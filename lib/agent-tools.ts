import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { checkPermission } from "@/lib/permissions"
import { Permission } from "@prisma/client"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserContext {
    clerkId: string
    userId: string
    role: "STUDENT" | "COMPANY" | "TEAM_MEMBER"
    companyId?: string
}

export interface ToolResult {
    success: boolean
    cardType: string
    title: string
    data: unknown
    error?: string
}

// ─── Tool Definitions ───────────────────────────────────────────────────────

type Tool = OpenAI.Chat.Completions.ChatCompletionTool

const COMMON_TOOLS: Tool[] = [
    {
        type: "function",
        function: {
            name: "get_dashboard_stats",
            description: "Get an overview of dashboard statistics including counts of internships, applications, interviews, and messages. Use when the user asks about their dashboard, overview, or summary.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "list_interviews",
            description: "List upcoming and past interviews. Use when user asks about interviews or their schedule.",
            parameters: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"], description: "Filter by interview status" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_conversations",
            description: "List message conversations. Use when user asks about messages, chats, or wants to communicate with someone.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "send_message",
            description: "Send a message in an existing conversation. Use when the user wants to reply to or send a message in a conversation.",
            parameters: {
                type: "object",
                properties: {
                    conversationId: { type: "string", description: "The conversation ID to send the message to" },
                    content: { type: "string", description: "The message content to send" }
                },
                required: ["conversationId", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_assignments",
            description: "List assignments (test tasks from internship applications). Use when asking about assignments, tests, or tasks.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    }
]

const STUDENT_ONLY_TOOLS: Tool[] = [
    {
        type: "function",
        function: {
            name: "search_internships",
            description: "Search for available internships. Can filter by keywords (skills, job title, company), location, and paid/unpaid. When the user wants to see all internships, call with no arguments or empty query. Use when the student wants to find, browse, or list internships.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Search keywords like skills, job title, or company name" },
                    location: { type: "string", description: "Location filter (city, country, or 'Remote')" },
                    paid: { type: "boolean", description: "true for paid only, false for unpaid only, omit for all" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_internship_details",
            description: "Get full details about a specific internship including company info, requirements, and application dates. Use when the student wants more info about a particular internship.",
            parameters: {
                type: "object",
                properties: {
                    internshipId: { type: "string", description: "The internship ID" }
                },
                required: ["internshipId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_my_applications",
            description: "List the student's submitted applications with their statuses (pending, approved, rejected). Use when the student asks about their applications or application status.",
            parameters: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], description: "Filter by application status" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "apply_to_internship",
            description: "Submit an application to an internship on behalf of the student. Use when the student wants to apply for a specific internship.",
            parameters: {
                type: "object",
                properties: {
                    internshipId: { type: "string", description: "The internship ID to apply to" },
                    coverLetter: { type: "string", description: "Optional cover letter text" }
                },
                required: ["internshipId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_portfolio",
            description: "Get the student's current portfolio details including bio, skills, experience, and education. Use when the student asks about their portfolio or wants to view it.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "update_portfolio",
            description: "Update the student's portfolio fields. Only include fields that need to be changed. Use when the student wants to edit their portfolio, bio, skills, headline, etc.",
            parameters: {
                type: "object",
                properties: {
                    fullName: { type: "string", description: "Full name" },
                    headline: { type: "string", description: "Professional headline (e.g. 'Aspiring Full-Stack Developer')" },
                    bio: { type: "string", description: "About/bio section" },
                    skills: { type: "array", items: { type: "string" }, description: "Complete skills list (replaces existing)" },
                    interests: { type: "array", items: { type: "string" }, description: "Career interests list (replaces existing)" },
                    experience: { type: "string", description: "Work experience description" },
                    education: { type: "string", description: "Education background" },
                    linkedin: { type: "string", description: "LinkedIn profile URL" },
                    github: { type: "string", description: "GitHub profile URL" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "save_internship",
            description: "Save (bookmark) or unsave an internship for later viewing. Use when the student wants to save or remove a saved internship.",
            parameters: {
                type: "object",
                properties: {
                    internshipId: { type: "string", description: "The internship ID to save/unsave" },
                    save: { type: "boolean", description: "true to save, false to unsave" }
                },
                required: ["internshipId", "save"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_saved_internships",
            description: "List all internships the student has saved/bookmarked. Use when asking about saved or bookmarked internships.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    }
]

const COMPANY_ONLY_TOOLS: Tool[] = [
    {
        type: "function",
        function: {
            name: "list_internships",
            description: "List the company's posted internships. Use when the company wants to see their internship postings.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "get_internship_details",
            description: "Get full details about a specific internship including applications count. Use when wanting more info about a particular internship.",
            parameters: {
                type: "object",
                properties: {
                    internshipId: { type: "string", description: "The internship ID" }
                },
                required: ["internshipId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_internship",
            description: "Create a new internship posting for the company. All required fields must be provided. Use when the company wants to post a new internship opportunity.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Internship title (e.g. 'Frontend Developer Intern')" },
                    description: { type: "string", description: "Full description of the role and responsibilities" },
                    location: { type: "string", description: "Location (city, country or 'Remote')" },
                    paid: { type: "boolean", description: "Whether the internship is paid" },
                    salary: { type: "number", description: "Monthly salary amount if paid" },
                    qualifications: { type: "string", description: "Required qualifications and skills" },
                    requiresCoverLetter: { type: "boolean", description: "Whether applicants must submit a cover letter" },
                    applicationStart: { type: "string", description: "Application start date in ISO format (YYYY-MM-DD)" },
                    applicationEnd: { type: "string", description: "Application deadline in ISO format (YYYY-MM-DD)" }
                },
                required: ["title", "description", "location", "paid", "applicationStart", "applicationEnd"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_received_applications",
            description: "List applications received for the company's internships. Can filter by specific internship or status. Use when reviewing applicants.",
            parameters: {
                type: "object",
                properties: {
                    internshipId: { type: "string", description: "Filter by specific internship ID" },
                    status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], description: "Filter by application status" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_application_status",
            description: "Accept or reject a student's application. Use when the company wants to approve or deny an applicant.",
            parameters: {
                type: "object",
                properties: {
                    applicationId: { type: "string", description: "The application ID" },
                    status: { type: "string", enum: ["APPROVED", "REJECTED"], description: "New status to set" }
                },
                required: ["applicationId", "status"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_candidates",
            description: "Search for student candidates by skills, interests, or general query. Use when the company wants to find talent or scout students.",
            parameters: {
                type: "object",
                properties: {
                    skills: { type: "array", items: { type: "string" }, description: "Required skills to search for" },
                    query: { type: "string", description: "General search query (field, background, etc.)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "schedule_interview",
            description: "Schedule an interview with an applicant. Use when the company wants to set up an interview.",
            parameters: {
                type: "object",
                properties: {
                    applicationId: { type: "string", description: "The application ID to schedule interview for" },
                    scheduledAt: { type: "string", description: "Interview date/time in ISO format" },
                    location: { type: "string", description: "Interview location or video call link" },
                    notes: { type: "string", description: "Additional notes for the interview" }
                },
                required: ["applicationId", "scheduledAt"]
            }
        }
    }
]

export function getToolsForRole(role: "student" | "company"): Tool[] {
    return role === "student"
        ? [...COMMON_TOOLS, ...STUDENT_ONLY_TOOLS]
        : [...COMMON_TOOLS, ...COMPANY_ONLY_TOOLS]
}

// ─── Tool Executor Dispatcher ───────────────────────────────────────────────

export async function executeTool(
    name: string,
    args: Record<string, unknown>,
    ctx: UserContext
): Promise<ToolResult> {
    try {
        switch (name) {
            // Common tools
            case "get_dashboard_stats": return await getDashboardStats(ctx)
            case "list_interviews": return await listInterviews(args, ctx)
            case "list_conversations": return await listConversations(ctx)
            case "send_message": return await sendMessage(args, ctx)
            case "list_assignments": return await listAssignments(ctx)
            // Student tools
            case "search_internships": return await searchInternships(args)
            case "list_my_applications": return await listMyApplications(args, ctx)
            case "apply_to_internship": return await applyToInternship(args, ctx)
            case "get_portfolio": return await getPortfolio(ctx)
            case "update_portfolio": return await updatePortfolio(args, ctx)
            case "save_internship": return await saveInternship(args, ctx)
            case "list_saved_internships": return await listSavedInternships(ctx)
            // Shared (student detail + company detail)
            case "get_internship_details": return await getInternshipDetails(args)
            // Company tools
            case "list_internships": return await listCompanyInternships(ctx)
            case "create_internship": return await createInternship(args, ctx)
            case "list_received_applications": return await listReceivedApplications(args, ctx)
            case "update_application_status": return await updateApplicationStatus(args, ctx)
            case "search_candidates": return await searchCandidates(args)
            case "schedule_interview": return await scheduleInterview(args, ctx)
            default:
                return { success: false, cardType: "error", title: "Unknown Tool", data: null, error: `Unknown tool: ${name}` }
        }
    } catch (error) {
        console.error(`Tool execution error [${name}]:`, error)
        return { success: false, cardType: "error", title: "Error", data: null, error: String(error) }
    }
}

// ─── Tool Executors ─────────────────────────────────────────────────────────

async function getDashboardStats(ctx: UserContext): Promise<ToolResult> {
    if (ctx.role === "STUDENT") {
        const [applicationCount, interviewCount, savedCount, conversationCount, assignmentCount] = await Promise.all([
            prisma.application.count({ where: { studentId: ctx.userId } }),
            prisma.interview.count({ where: { application: { studentId: ctx.userId }, status: "SCHEDULED" } }),
            prisma.savedInternship.count({ where: { userId: ctx.userId } }),
            prisma.conversation.count({ where: { studentId: ctx.userId } }),
            prisma.assignment.count({ where: { studentId: ctx.userId } }),
        ])
        const portfolio = await prisma.portfolio.findUnique({ where: { studentId: ctx.userId }, select: { approvalStatus: true } })

        return {
            success: true, cardType: "stats", title: "Dashboard Overview",
            data: {
                applications: applicationCount,
                upcomingInterviews: interviewCount,
                savedInternships: savedCount,
                conversations: conversationCount,
                assignments: assignmentCount,
                portfolioStatus: portfolio?.approvalStatus || "NOT_CREATED",
            }
        }
    } else {
        const companyId = ctx.companyId
        if (!companyId) return { success: false, cardType: "error", title: "Error", data: null, error: "No company found" }

        const [internshipCount, applicationCount, interviewCount, conversationCount] = await Promise.all([
            prisma.internship.count({ where: { companyId } }),
            prisma.application.count({ where: { internship: { companyId } } }),
            prisma.interview.count({ where: { application: { internship: { companyId } }, status: "SCHEDULED" } }),
            prisma.conversation.count({ where: { companyId } }),
        ])
        const pendingApplications = await prisma.application.count({ where: { internship: { companyId }, status: "PENDING" } })

        return {
            success: true, cardType: "stats", title: "Dashboard Overview",
            data: {
                internships: internshipCount,
                totalApplications: applicationCount,
                pendingApplications,
                upcomingInterviews: interviewCount,
                conversations: conversationCount,
            }
        }
    }
}

async function searchInternships(args: Record<string, unknown>): Promise<ToolResult> {
    const query = (args.query as string) || ""
    const location = (args.location as string) || ""
    const paid = args.paid as boolean | undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    // Build text search conditions (OR between title, description, qualifications, skills, company name)
    const textConditions: unknown[] = []
    if (query) {
        // Split multi-word queries into individual keywords for broader matching
        const keywords = query.split(/\s+/).filter((k: string) => k.length > 2)
        const searchTerms = keywords.length > 0 ? keywords : [query]

        for (const term of searchTerms) {
            textConditions.push(
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
                { qualifications: { contains: term, mode: "insensitive" } },
                { skills: { has: term } },
                { company: { name: { contains: term, mode: "insensitive" } } }
            )
        }
    }

    // Location filter (AND with text conditions)
    if (location) {
        where.location = { contains: location, mode: "insensitive" }
    }
    if (textConditions.length > 0) {
        where.OR = textConditions
    }
    if (paid !== undefined) {
        where.paid = paid
    }

    let internships = await prisma.internship.findMany({
        where,
        include: {
            company: { select: { name: true, logo: true } },
            _count: { select: { applications: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 15
    })

    // Fallback: if query search returned nothing, return all recent internships
    if (internships.length === 0 && (query || location)) {
        internships = await prisma.internship.findMany({
            where: paid !== undefined ? { paid } : {},
            include: {
                company: { select: { name: true, logo: true } },
                _count: { select: { applications: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 15
        })
    }

    const data = internships.map(i => ({
        id: i.id,
        title: i.title,
        company: i.company?.name || "Company",
        companyLogo: i.company?.logo,
        location: i.location,
        paid: i.paid,
        salary: i.salary,
        description: i.description?.substring(0, 200) + (i.description && i.description.length > 200 ? "..." : ""),
        applicationEnd: i.applicationEnd?.toISOString(),
        applicationsCount: i._count.applications,
        requiresCoverLetter: i.requiresCoverLetter,
    }))

    return { success: true, cardType: "internship-list", title: `Found ${data.length} Internship${data.length !== 1 ? "s" : ""}`, data }
}

async function getInternshipDetails(args: Record<string, unknown>): Promise<ToolResult> {
    const id = args.internshipId as string
    if (!id) return { success: false, cardType: "error", title: "Error", data: null, error: "Missing internshipId" }

    const internship = await prisma.internship.findUnique({
        where: { id },
        include: {
            company: { select: { name: true, logo: true } },
            _count: { select: { applications: true } }
        }
    })

    if (!internship) return { success: false, cardType: "error", title: "Not Found", data: null, error: "Internship not found" }

    return {
        success: true, cardType: "internship-detail", title: internship.title,
        data: {
            id: internship.id,
            title: internship.title,
            company: internship.company?.name || "Company",
            companyLogo: internship.company?.logo,
            description: internship.description,
            qualifications: internship.qualifications,
            location: internship.location,
            paid: internship.paid,
            salary: internship.salary,
            requiresCoverLetter: internship.requiresCoverLetter,
            applicationStart: internship.applicationStart?.toISOString(),
            applicationEnd: internship.applicationEnd?.toISOString(),
            applicationsCount: internship._count.applications,
            createdAt: internship.createdAt.toISOString(),
        }
    }
}

async function listMyApplications(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    const status = args.status as string | undefined
    const where: Record<string, unknown> = { studentId: ctx.userId }
    if (status) where.status = status

    const applications = await prisma.application.findMany({
        where,
        include: {
            internship: {
                include: { company: { select: { name: true } } }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 20
    })

    const data = applications.map(a => ({
        id: a.id,
        status: a.status,
        internshipTitle: a.internship.title,
        companyName: a.internship.company?.name || "Company",
        createdAt: a.createdAt.toISOString(),
        hasCoverLetter: !!a.coverLetter,
    }))

    return { success: true, cardType: "application-list", title: `${data.length} Application${data.length !== 1 ? "s" : ""}`, data }
}

async function applyToInternship(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    if (ctx.role !== "STUDENT") {
        return { success: false, cardType: "error", title: "Error", data: null, error: "Only students can apply to internships" }
    }

    const internshipId = args.internshipId as string
    const coverLetter = (args.coverLetter as string) || undefined

    // Check if already applied
    const existing = await prisma.application.findFirst({
        where: { studentId: ctx.userId, internshipId }
    })
    if (existing) {
        return { success: false, cardType: "error", title: "Already Applied", data: null, error: "You have already applied to this internship" }
    }

    // Check if internship exists
    const internship = await prisma.internship.findUnique({
        where: { id: internshipId },
        include: { company: { select: { name: true } } }
    })
    if (!internship) {
        return { success: false, cardType: "error", title: "Not Found", data: null, error: "Internship not found" }
    }

    // Check cover letter requirement
    if (internship.requiresCoverLetter && !coverLetter) {
        return { success: false, cardType: "error", title: "Cover Letter Required", data: null, error: "This internship requires a cover letter. Please provide one." }
    }

    const application = await prisma.application.create({
        data: {
            studentId: ctx.userId,
            internshipId,
            status: "PENDING",
            coverLetter: coverLetter || null,
            coverLetterStatus: coverLetter ? "SUBMITTED" : null,
        }
    })

    // Create assignment if internship has a test
    if (internship.testAssignmentTitle && internship.testAssignmentDueDate) {
        await prisma.assignment.create({
            data: {
                title: internship.testAssignmentTitle,
                description: internship.testAssignmentDescription || "",
                dueDate: internship.testAssignmentDueDate,
                internshipId: internship.id,
                studentId: ctx.userId,
            }
        })
    }

    return {
        success: true, cardType: "action-success", title: "Application Submitted! 🎉",
        data: {
            applicationId: application.id,
            internshipTitle: internship.title,
            companyName: internship.company?.name,
            status: "PENDING",
            hasTest: !!internship.testAssignmentTitle,
        }
    }
}

async function getPortfolio(ctx: UserContext): Promise<ToolResult> {
    const portfolio = await prisma.portfolio.findUnique({
        where: { studentId: ctx.userId }
    })

    if (!portfolio) {
        return { success: true, cardType: "portfolio-view", title: "Portfolio", data: { empty: true, message: "No portfolio created yet" } }
    }

    return {
        success: true, cardType: "portfolio-view", title: "Your Portfolio",
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
            portfolioUrl: portfolio.portfolioUrl,
            approvalStatus: portfolio.approvalStatus,
        }
    }
}

async function updatePortfolio(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    if (ctx.role !== "STUDENT") {
        return { success: false, cardType: "error", title: "Error", data: null, error: "Only students can update portfolios" }
    }

    // Build update data from provided args only
    const updateData: Record<string, unknown> = {}
    const fields = ["fullName", "headline", "bio", "skills", "interests", "experience", "education", "linkedin", "github"]
    for (const field of fields) {
        if (args[field] !== undefined) {
            updateData[field] = args[field]
        }
    }

    if (Object.keys(updateData).length === 0) {
        return { success: false, cardType: "error", title: "Error", data: null, error: "No fields to update" }
    }

    const portfolio = await prisma.portfolio.upsert({
        where: { studentId: ctx.userId },
        update: updateData,
        create: {
            studentId: ctx.userId,
            fullName: (updateData.fullName as string) || "Student",
            ...updateData,
        }
    })

    const updatedFields = Object.keys(updateData)

    return {
        success: true, cardType: "action-success", title: "Portfolio Updated! ✨",
        data: {
            updatedFields,
            portfolio: {
                fullName: portfolio.fullName,
                headline: portfolio.headline,
                skills: portfolio.skills,
                bio: portfolio.bio,
            }
        }
    }
}

async function saveInternship(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    const internshipId = args.internshipId as string
    const save = args.save as boolean

    if (save) {
        // Check if already saved
        const existing = await prisma.savedInternship.findFirst({
            where: { userId: ctx.userId, internshipId }
        })
        if (existing) {
            return { success: true, cardType: "action-success", title: "Already Saved", data: { internshipId } }
        }
        await prisma.savedInternship.create({
            data: { userId: ctx.userId, internshipId }
        })
        return { success: true, cardType: "action-success", title: "Internship Saved! 🔖", data: { internshipId, saved: true } }
    } else {
        await prisma.savedInternship.deleteMany({
            where: { userId: ctx.userId, internshipId }
        })
        return { success: true, cardType: "action-success", title: "Internship Unsaved", data: { internshipId, saved: false } }
    }
}

async function listSavedInternships(ctx: UserContext): Promise<ToolResult> {
    const saved = await prisma.savedInternship.findMany({
        where: { userId: ctx.userId },
        include: {
            internship: {
                include: { company: { select: { name: true, logo: true } } }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    const data = saved.map((s: { internship: { id: string; title: string; company?: { name: string; logo?: string | null } | null; location: string; paid: boolean; salary?: number | null } }) => ({
        id: s.internship.id,
        title: s.internship.title,
        company: s.internship.company?.name || "Company",
        companyLogo: s.internship.company?.logo,
        location: s.internship.location,
        paid: s.internship.paid,
        salary: s.internship.salary,
    }))

    return { success: true, cardType: "internship-list", title: `${data.length} Saved Internship${data.length !== 1 ? "s" : ""}`, data }
}

async function listCompanyInternships(ctx: UserContext): Promise<ToolResult> {
    if (!ctx.companyId) return { success: false, cardType: "error", title: "Error", data: null, error: "No company found" }

    const internships = await prisma.internship.findMany({
        where: { companyId: ctx.companyId },
        include: {
            company: { select: { name: true, logo: true } },
            _count: { select: { applications: true } }
        },
        orderBy: { createdAt: "desc" }
    })

    const data = internships.map(i => ({
        id: i.id,
        title: i.title,
        company: i.company?.name || "Company",
        location: i.location,
        paid: i.paid,
        salary: i.salary,
        applicationsCount: i._count.applications,
        applicationEnd: i.applicationEnd?.toISOString(),
        createdAt: i.createdAt.toISOString(),
    }))

    return { success: true, cardType: "internship-list", title: `${data.length} Internship${data.length !== 1 ? "s" : ""}`, data }
}

async function createInternship(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    if (!ctx.companyId) return { success: false, cardType: "error", title: "Error", data: null, error: "No company found" }

    // Permission check
    const hasPermission = await checkPermission(ctx.userId, ctx.companyId, Permission.CREATE_INTERNSHIPS)
    if (!hasPermission) {
        return { success: false, cardType: "error", title: "Permission Denied", data: null, error: "You don't have permission to create internships" }
    }

    const title = args.title as string
    const description = args.description as string
    const location = args.location as string
    const paid = args.paid as boolean
    const salary = (args.salary as number) || null
    const qualifications = (args.qualifications as string) || null
    const requiresCoverLetter = (args.requiresCoverLetter as boolean) || false
    const applicationStart = new Date(args.applicationStart as string)
    const applicationEnd = new Date(args.applicationEnd as string)

    if (!title || !description || !location) {
        return { success: false, cardType: "error", title: "Missing Fields", data: null, error: "Title, description, and location are required" }
    }

    const internship = await prisma.internship.create({
        data: {
            companyId: ctx.companyId,
            title,
            description,
            location,
            paid,
            salary,
            qualifications,
            requiresCoverLetter,
            applicationStart,
            applicationEnd,
        }
    })

    return {
        success: true, cardType: "action-success", title: "Internship Created! 🚀",
        data: {
            id: internship.id,
            title: internship.title,
            location: internship.location,
            paid: internship.paid,
            salary: internship.salary,
        }
    }
}

async function listReceivedApplications(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    if (!ctx.companyId) return { success: false, cardType: "error", title: "Error", data: null, error: "No company found" }

    const where: Record<string, unknown> = { internship: { companyId: ctx.companyId } }
    if (args.internshipId) {
        (where.internship as Record<string, unknown>).id = args.internshipId
    }
    if (args.status) {
        where.status = args.status
    }

    const applications = await prisma.application.findMany({
        where,
        include: {
            student: { select: { id: true, email: true, profile: { select: { name: true } }, portfolio: { select: { headline: true, skills: true } } } },
            internship: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
    })

    const data = applications.map(a => ({
        id: a.id,
        status: a.status,
        internshipTitle: a.internship.title,
        studentName: a.student.profile?.name || a.student.email,
        studentEmail: a.student.email,
        studentHeadline: a.student.portfolio?.headline,
        studentSkills: a.student.portfolio?.skills || [],
        createdAt: a.createdAt.toISOString(),
        hasCoverLetter: !!a.coverLetter,
    }))

    return { success: true, cardType: "application-list", title: `${data.length} Application${data.length !== 1 ? "s" : ""}`, data }
}

async function updateApplicationStatus(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    if (!ctx.companyId) return { success: false, cardType: "error", title: "Error", data: null, error: "No company found" }

    const hasPermission = await checkPermission(ctx.userId, ctx.companyId, Permission.MANAGE_APPLICATIONS)
    if (!hasPermission) {
        return { success: false, cardType: "error", title: "Permission Denied", data: null, error: "You don't have permission to manage applications" }
    }

    const applicationId = args.applicationId as string
    const status = args.status as "APPROVED" | "REJECTED"

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { internship: { select: { companyId: true, title: true } }, student: { select: { email: true, profile: { select: { name: true } } } } }
    })

    if (!application) return { success: false, cardType: "error", title: "Not Found", data: null, error: "Application not found" }
    if (application.internship.companyId !== ctx.companyId) {
        return { success: false, cardType: "error", title: "Access Denied", data: null, error: "This application doesn't belong to your company" }
    }

    await prisma.application.update({
        where: { id: applicationId },
        data: { status }
    })

    return {
        success: true, cardType: "action-success",
        title: status === "APPROVED" ? "Application Approved! ✅" : "Application Rejected",
        data: {
            applicationId,
            status,
            studentName: application.student.profile?.name || application.student.email,
            internshipTitle: application.internship.title,
        }
    }
}

async function searchCandidates(args: Record<string, unknown>): Promise<ToolResult> {
    const skills = (args.skills as string[]) || []
    const query = (args.query as string) || ""

    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            profile: true,
            portfolio: true,
            projects: { select: { title: true, description: true } }
        },
        take: 50
    })

    // Score candidates
    const scored = students.map(student => {
        let score = 0
        const reasons: string[] = []
        const studentSkills = (student.portfolio?.skills || []).map((s: string) => s.toLowerCase())
        const bio = (student.portfolio?.bio || "").toLowerCase()
        const headline = (student.portfolio?.headline || "").toLowerCase()

        for (const skill of skills) {
            const skillLower = skill.toLowerCase()
            if (studentSkills.some((s: string) => s.includes(skillLower) || skillLower.includes(s))) {
                score += 30
                reasons.push(`Skilled in ${skill}`)
            } else if (bio.includes(skillLower) || headline.includes(skillLower)) {
                score += 15
                reasons.push(`Background in ${skill}`)
            }
        }

        if (query) {
            const qLower = query.toLowerCase()
            const fullText = `${bio} ${headline} ${studentSkills.join(" ")}`.toLowerCase()
            if (fullText.includes(qLower)) {
                score += 20
                reasons.push(`Matches "${query}"`)
            }
        }

        if (student.portfolio?.bio && student.portfolio.bio.length > 50) score += 5
        if (student.projects && student.projects.length > 0) score += student.projects.length * 5

        score = Math.min(score, 98)

        return {
            id: student.id,
            name: student.profile?.name || student.portfolio?.fullName || "Student",
            email: student.email,
            headline: student.portfolio?.headline,
            bio: student.portfolio?.bio?.substring(0, 150),
            skills: studentSkills.slice(0, 8),
            matchScore: score,
            reasons,
            projectCount: student.projects?.length || 0,
        }
    })

    const results = scored
        .filter(s => s.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10)

    return { success: true, cardType: "candidate-list", title: `Found ${results.length} Candidate${results.length !== 1 ? "s" : ""}`, data: results }
}

async function scheduleInterview(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    if (!ctx.companyId) return { success: false, cardType: "error", title: "Error", data: null, error: "No company found" }

    const hasPermission = await checkPermission(ctx.userId, ctx.companyId, Permission.SCHEDULE_INTERVIEWS)
    if (!hasPermission) {
        return { success: false, cardType: "error", title: "Permission Denied", data: null, error: "You don't have permission to schedule interviews" }
    }

    const applicationId = args.applicationId as string
    const scheduledAt = new Date(args.scheduledAt as string)
    const location = (args.location as string) || null
    const notes = (args.notes as string) || null

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: { select: { companyId: true, title: true } },
            student: { select: { email: true, profile: { select: { name: true } } } }
        }
    })

    if (!application) return { success: false, cardType: "error", title: "Not Found", data: null, error: "Application not found" }
    if (application.internship.companyId !== ctx.companyId) {
        return { success: false, cardType: "error", title: "Access Denied", data: null, error: "This application doesn't belong to your company" }
    }

    const interview = await prisma.interview.create({
        data: {
            applicationId,
            scheduledAt,
            location,
            notes,
            status: "SCHEDULED"
        }
    })

    return {
        success: true, cardType: "action-success", title: "Interview Scheduled! 📅",
        data: {
            interviewId: interview.id,
            scheduledAt: interview.scheduledAt.toISOString(),
            location: interview.location,
            studentName: application.student.profile?.name || application.student.email,
            internshipTitle: application.internship.title,
        }
    }
}

async function listInterviews(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    const status = args.status as string | undefined

    let where: Record<string, unknown> = {}
    if (ctx.role === "STUDENT") {
        where = { application: { studentId: ctx.userId } }
    } else if (ctx.companyId) {
        where = { application: { internship: { companyId: ctx.companyId } } }
    }
    if (status) where.status = status

    const interviews = await prisma.interview.findMany({
        where,
        include: {
            application: {
                include: {
                    student: { select: { email: true, profile: { select: { name: true } } } },
                    internship: { select: { title: true, company: { select: { name: true } } } }
                }
            }
        },
        orderBy: { scheduledAt: "asc" },
        take: 20
    })

    const data = interviews.map(i => ({
        id: i.id,
        scheduledAt: i.scheduledAt.toISOString(),
        location: i.location,
        status: i.status,
        notes: i.notes,
        internshipTitle: i.application.internship.title,
        companyName: i.application.internship.company?.name,
        studentName: i.application.student.profile?.name || i.application.student.email,
    }))

    return { success: true, cardType: "interview-list", title: `${data.length} Interview${data.length !== 1 ? "s" : ""}`, data }
}

async function listConversations(ctx: UserContext): Promise<ToolResult> {
    let where: Record<string, unknown> = {}
    if (ctx.role === "STUDENT") {
        where = { studentId: ctx.userId }
    } else if (ctx.companyId) {
        where = { companyId: ctx.companyId }
    }

    const conversations = await prisma.conversation.findMany({
        where,
        include: {
            student: { select: { email: true, profile: { select: { name: true } } } },
            company: { select: { name: true, logo: true } },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { content: true, createdAt: true }
            }
        },
        orderBy: { updatedAt: "desc" },
        take: 15
    })

    const data = conversations.map(c => ({
        id: c.id,
        studentName: c.student.profile?.name || c.student.email,
        companyName: c.company.name,
        companyLogo: c.company.logo,
        lastMessage: c.messages[0]?.content?.substring(0, 100) || "No messages yet",
        lastMessageAt: c.messages[0]?.createdAt?.toISOString() || c.updatedAt.toISOString(),
    }))

    return { success: true, cardType: "conversation-list", title: `${data.length} Conversation${data.length !== 1 ? "s" : ""}`, data }
}

async function sendMessage(args: Record<string, unknown>, ctx: UserContext): Promise<ToolResult> {
    const conversationId = args.conversationId as string
    const content = args.content as string

    if (!conversationId || !content) {
        return { success: false, cardType: "error", title: "Error", data: null, error: "Conversation ID and message content are required" }
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { studentId: true, companyId: true }
    })

    if (!conversation) return { success: false, cardType: "error", title: "Not Found", data: null, error: "Conversation not found" }

    // Check access
    if (ctx.role === "STUDENT" && conversation.studentId !== ctx.userId) {
        return { success: false, cardType: "error", title: "Access Denied", data: null, error: "You don't have access to this conversation" }
    }
    if (ctx.role !== "STUDENT" && ctx.companyId && conversation.companyId !== ctx.companyId) {
        return { success: false, cardType: "error", title: "Access Denied", data: null, error: "You don't have access to this conversation" }
    }

    await prisma.message.create({
        data: {
            conversationId,
            senderId: ctx.userId,
            senderType: ctx.role === "STUDENT" ? "STUDENT" : "COMPANY",
            content,
        }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
    })

    return { success: true, cardType: "action-success", title: "Message Sent! 💬", data: { conversationId, preview: content.substring(0, 100) } }
}

async function listAssignments(ctx: UserContext): Promise<ToolResult> {
    let where: Record<string, unknown> = {}
    if (ctx.role === "STUDENT") {
        where = { studentId: ctx.userId }
    } else if (ctx.companyId) {
        where = { internship: { companyId: ctx.companyId } }
    }

    const assignments = await prisma.assignment.findMany({
        where,
        include: {
            internship: { select: { title: true, company: { select: { name: true } } } },
            student: { select: { email: true, profile: { select: { name: true } } } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
    })

    const data = assignments.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description?.substring(0, 150),
        dueDate: a.dueDate?.toISOString(),
        internshipTitle: a.internship?.title,
        companyName: a.internship?.company?.name,
        studentName: a.student?.profile?.name || a.student?.email,
    }))

    return { success: true, cardType: "assignment-list", title: `${data.length} Assignment${data.length !== 1 ? "s" : ""}`, data }
}
