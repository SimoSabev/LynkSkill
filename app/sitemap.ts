import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

interface SitemapEntry {
    url: string
    lastModified?: string | Date
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lynkskill.net'
    
    // Fetch dynamic data directly from database
    const [internships, companies, projects, experiences, portfolios] = await Promise.all([
        // Get active internships
        prisma.internship.findMany({
            where: {
                applicationStart: {
                    lte: new Date()
                },
                applicationEnd: {
                    gte: new Date()
                }
            },
            select: {
                id: true,
                updatedAt: true,
                title: true
            }
        }),
        // Get all approved companies
        prisma.company.findMany({
            where: {
                OR: [
                    {
                        internships: {
                            some: {
                                applicationStart: {
                                    lte: new Date()
                                },
                                applicationEnd: {
                                    gte: new Date()
                                }
                            }
                        }
                    },
                    {
                        projects: {
                            some: {
                                application: {
                                    status: "APPROVED"
                                }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                updatedAt: true,
                name: true
            }
        }),
        // Get approved projects
        prisma.project.findMany({
            where: {
                application: {
                    status: "APPROVED"
                }
            },
            select: {
                id: true,
                updatedAt: true,
                title: true
            }
        }),
        // Get approved experiences
        prisma.experience.findMany({
            where: {
                status: "approved"
            },
            select: {
                id: true,
                updatedAt: true,
                studentId: true,
                projectId: true,
                companyId: true
            }
        }),
        // Get approved portfolios
        prisma.portfolio.findMany({
            where: {
                approvalStatus: "APPROVED"
            },
            select: {
                studentId: true,
                updatedAt: true
            }
        })
    ])

    // Static pages with appropriate SEO attributes
    const staticPages: SitemapEntry[] = [
        // --- Core pages (Highest Priority) ---
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/internships`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/companies`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/projects`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/help`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        
        // --- Authentication and Onboarding pages ---
        {
            url: `${baseUrl}/sign-in`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/sign-up`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/onboarding`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/redirect-after-signin`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        
        // --- Legal pages (Lowest Priority) ---
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        }
    ]

    // Dynamic pages for internships
    const internshipPages = internships.map((internship): SitemapEntry => ({
        url: `${baseUrl}/internships/${internship.id}`,
        lastModified: internship.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    // Dynamic pages for companies
    const companyPages = companies.map((company): SitemapEntry => ({
        url: `${baseUrl}/companies/${company.id}`,
        lastModified: company.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
    }))

    // Dynamic pages for projects
    const projectPages = projects.map((project): SitemapEntry => ({
        url: `${baseUrl}/projects/${project.id}`,
        lastModified: project.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
    }))

    // Dynamic pages for experiences
    const experiencePages = experiences.map((experience): SitemapEntry => ({
        url: `${baseUrl}/experience/${experience.id}`,
        lastModified: experience.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
    }))

    // Dynamic pages for portfolios
    const portfolioPages = portfolios.map((portfolio): SitemapEntry => ({
        url: `${baseUrl}/portfolio/${portfolio.studentId}`,
        lastModified: portfolio.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
    }))

    // Dynamic pages for assignments
    const assignmentPages = internships.map((internship): SitemapEntry => ({
        url: `${baseUrl}/assignments/${internship.id}`,
        lastModified: internship.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
    }))

    // Combine all pages
    return [
        ...staticPages,
        ...internshipPages,
        ...companyPages,
        ...projectPages,
        ...experiencePages,
        ...portfolioPages,
        ...assignmentPages
    ]
}
