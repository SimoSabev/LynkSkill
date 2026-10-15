import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { getUserCompanyByClerkId } from "@/lib/permissions"

// ============ Types ============
export interface DashboardInitialData {
    user: {
        id: string
        clerkId: string
        email: string
        role: "STUDENT" | "COMPANY" | "TEAM_MEMBER"
        introShown: boolean
        profile?: {
            name: string
        }
    } | null
    company: {
        id: string
        name: string
        logo: string | null
    } | null
    internships: Array<{
        id: string
        title: string
        location: string
        paid: boolean
        salary: number | null
        applicationStart: Date | null
        applicationEnd: Date | null
        createdAt: Date
        description: string
        companyId: string
        company: { name: string; logo: string | null }
    }>
    applications: Array<{
        id: string
        createdAt: Date
        status: "PENDING" | "APPROVED" | "REJECTED"
        studentId: string
        internshipId: string
        internship: {
            id: string
            title: string
            company: { id: string; name: string; logo: string | null }
        }
    }>
    projects: Array<{
        id: string
        title: string
        createdAt: Date
        internshipId: string
        studentId: string
        internship: {
            id: string
            title: string
            startDate: Date | null
            endDate: Date | null
            company: { name: string }
        }
        student: { email: string; profile: { name: string } | null }
        application: { status: string } | null
    }>
    recentExperiences: Array<{
        id: string
        files: { url: string }[]
        createdAt: Date
        uploader: { name: string; image: string | null }
        isBulk: boolean
    }>
}

// ============ Ensure User Exists (Lazy Sync) ============
async function ensureUserExists(clerkId: string, email?: string) {
    let user = await prisma.user.findUnique({
        where: { clerkId },
        include: { 
            profile: { select: { name: true } },
            companies: { select: { id: true } }
        }
    })

    if (!user) {
        // Create user if doesn't exist (lazy sync)
        user = await prisma.user.create({
            data: {
                clerkId,
                email: email || "",
                role: "STUDENT",
                onboardingComplete: false,
            },
            include: { 
                profile: { select: { name: true } },
                companies: { select: { id: true } }
            }
        })
    }

    return user
}

// ============ Cached Data Fetching Functions ============

// Cache the user fetch for the duration of the request
export const getUser = cache(async () => {
    const { userId } = await auth()
    if (!userId) return null

    const user = await ensureUserExists(userId)
    return user
})

// Fetch company data by company ID
export const getCompanyData = cache(async (companyId: string) => {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, logo: true }
    })
    return company
})

// Fetch internships for student
export const getStudentInternships = cache(async () => {
    const internships = await prisma.internship.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            id: true,
            title: true,
            description: true,
            location: true,
            paid: true,
            salary: true,
            applicationStart: true,
            applicationEnd: true,
            createdAt: true,
            companyId: true,
            company: { select: { name: true, logo: true } }
        }
    })
    return internships
})

// Fetch internships for company
export const getCompanyInternships = cache(async (companyId: string) => {
    const internships = await prisma.internship.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            description: true,
            location: true,
            paid: true,
            salary: true,
            applicationStart: true,
            applicationEnd: true,
            createdAt: true,
            companyId: true,
            company: { select: { name: true, logo: true } },
            applications: {
                select: {
                    id: true,
                    status: true,
                    studentId: true,
                    student: {
                        select: {
                            email: true,
                            profile: { select: { name: true } }
                        }
                    }
                }
            }
        }
    })
    return internships
})

// Fetch student applications
export const getStudentApplications = cache(async (studentId: string) => {
    const applications = await prisma.application.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            id: true,
            createdAt: true,
            status: true,
            studentId: true,
            internshipId: true,
            internship: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    location: true,
                    company: { select: { id: true, name: true, logo: true, description: true, location: true, website: true } }
                }
            }
        }
    })
    return applications
})

// Fetch company applications
export const getCompanyApplications = cache(async (companyId: string) => {
    const applications = await prisma.application.findMany({
        where: { internship: { companyId } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            id: true,
            createdAt: true,
            status: true,
            studentId: true,
            internshipId: true,
            internship: {
                select: {
                    id: true,
                    title: true,
                    company: { select: { id: true, name: true, logo: true } }
                }
            },
            student: {
                select: {
                    id: true,
                    email: true,
                    profile: { select: { name: true } }
                }
            }
        }
    })
    return applications
})

// Fetch projects
export const getProjects = cache(async (userId: string, role: string) => {
    const projects = await prisma.project.findMany({
        where: role === "STUDENT" 
            ? { studentId: userId }
            : { company: { ownerId: userId } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id: true,
            title: true,
            createdAt: true,
            internshipId: true,
            studentId: true,
            application: { select: { status: true } },
            internship: {
                select: {
                    id: true,
                    title: true,
                    startDate: true,
                    endDate: true,
                    company: { select: { name: true } }
                }
            },
            student: {
                select: {
                    email: true,
                    profile: { select: { name: true } }
                }
            }
        }
    })
    return projects
})

// Fetch recent experiences
export const getRecentExperiences = cache(async (userId: string, role: string, companyIds: string[] = []) => {
    const experiences = await prisma.experience.findMany({
        where: role === "STUDENT" 
            ? { studentId: userId } 
            : { companyId: { in: companyIds } },
        orderBy: { createdAt: "desc" },
        take: 4
    })

    return experiences.map(exp => ({
        id: exp.id,
        files: exp.mediaUrls.map(url => ({ url })),
        createdAt: exp.createdAt,
        uploader: {
            name: exp.uploaderName || "Unknown",
            image: exp.uploaderImage
        },
        isBulk: exp.mediaUrls.length > 1
    }))
})

// ============ Main Dashboard Data Fetcher ============
export async function getDashboardData(userType: "Student" | "Company" | "TeamMember"): Promise<DashboardInitialData> {
    const user = await getUser()
    
    if (!user) {
        return {
            user: null,
            company: null,
            internships: [],
            applications: [],
            projects: [],
            recentExperiences: []
        }
    }

    // For company users and team members, use membership-based access
    if (userType === "Company" || userType === "TeamMember") {
        const membership = await getUserCompanyByClerkId(user.clerkId)
        const companyId = membership?.companyId

        if (companyId) {
            const [company, internships, applications, projects, recentExperiences] = await Promise.all([
                getCompanyData(companyId),
                getCompanyInternships(companyId),
                getCompanyApplications(companyId),
                getProjects(user.id, "COMPANY"),
                getRecentExperiences(user.id, "COMPANY", [companyId])
            ])

        return {
            user: {
                id: user.id,
                clerkId: user.clerkId,
                email: user.email,
                role: user.role as "STUDENT" | "COMPANY" | "TEAM_MEMBER",
                introShown: user.introShown,
                profile: user.profile ?? undefined
            },
            company,
            internships: internships.map(i => ({
                ...i,
                description: i.description || "",
            })),
            applications: applications.map(a => ({
                ...a,
                status: a.status as "PENDING" | "APPROVED" | "REJECTED"
            })),
            projects,
            recentExperiences
        }
        }
    }

    // Student data fetching
    const [internships, applications, projects, recentExperiences] = await Promise.all([
        getStudentInternships(),
        getStudentApplications(user.id),
        getProjects(user.id, "STUDENT"),
        getRecentExperiences(user.id, "STUDENT")
    ])

    return {
        user: {
            id: user.id,
            clerkId: user.clerkId,
            email: user.email,
            role: user.role as "STUDENT" | "COMPANY" | "TEAM_MEMBER",
            introShown: user.introShown,
            profile: user.profile ?? undefined
        },
        company: null,
        internships: internships.map(i => ({
            ...i,
            description: i.description || "",
        })),
        applications: applications.map(a => ({
            ...a,
            status: a.status as "PENDING" | "APPROVED" | "REJECTED"
        })),
        projects,
        recentExperiences
    }
}
