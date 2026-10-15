import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const student = await prisma.user.findUnique({ 
            where: { clerkId: userId },
            select: { id: true }
        })
        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

        const portfolio = await prisma.portfolio.findUnique({
            where: { studentId: student.id },
        })

        return NextResponse.json(portfolio ?? {})
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const student = await prisma.user.findUnique({ where: { clerkId: userId } })

        if (!student || student.role !== "STUDENT") return NextResponse.json({ error: "Student not found" }, { status: 404 })

        const body = await req.json()

        // Validate years in education
        if (body.education && Array.isArray(body.education)) {
            const currentYear = new Date().getFullYear()
            for (const edu of body.education) {
                if (edu.startYear < 1950 || edu.startYear > currentYear + 10) {
                    return NextResponse.json({ error: "Invalid start year in education" }, { status: 400 })
                }
                if (edu.endYear && (edu.endYear < 1950 || edu.endYear > currentYear + 10)) {
                    return NextResponse.json({ error: "Invalid end year in education" }, { status: 400 })
                }
                if (edu.endYear && edu.endYear < edu.startYear) {
                    return NextResponse.json({ error: "End year must be after start year" }, { status: 400 })
                }
            }
        }

        // Validate certification dates
        if (body.certifications && Array.isArray(body.certifications)) {
            for (const cert of body.certifications) {
                const issuedDate = new Date(cert.issuedAt)
                if (isNaN(issuedDate.getTime())) {
                    return NextResponse.json({ error: "Invalid issue date in certification" }, { status: 400 })
                }
                if (issuedDate > new Date()) {
                    return NextResponse.json({ error: "Issue date cannot be in the future" }, { status: 400 })
                }

                if (cert.expiresAt) {
                    const expiresDate = new Date(cert.expiresAt)
                    if (isNaN(expiresDate.getTime())) {
                        return NextResponse.json({ error: "Invalid expiry date in certification" }, { status: 400 })
                    }
                    if (expiresDate < issuedDate) {
                        return NextResponse.json({ error: "Expiry date must be after issue date" }, { status: 400 })
                    }
                }
            }
        }

        // Validate custom skills and interests
        const inappropriateWords = ["badword1", "badword2"]
        const validateText = (text: string) => {
            const lower = text.toLowerCase()
            return !inappropriateWords.some((word) => lower.includes(word)) && /^[a-zA-Z0-9\s\-.+#/]+$/.test(text)
        }

        if (body.skills && Array.isArray(body.skills)) {
            for (const skill of body.skills) {
                if (skill.length > 50 || !validateText(skill)) {
                    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 })
                }
            }
        }

        if (body.interests && Array.isArray(body.interests)) {
            for (const interest of body.interests) {
                if (interest.length > 50 || !validateText(interest)) {
                    return NextResponse.json({ error: "Invalid interest name" }, { status: 400 })
                }
            }
        }

        // NOTE: age / approvalStatus / needsApproval are intentionally NOT taken
        // from the client. They are derived from the DOB at onboarding; letting the
        // client send age=18 would self-approve a minor's portfolio.
        const portfolio = await prisma.portfolio.upsert({
            where: {
                studentId: student.id,
            },
            update: {
                fullName: body.fullName,
                headline: body.headline,
                bio: body.bio,
                skills: body.skills,
                interests: body.interests,
                experience: body.experience,
                education: body.education,
                projects: body.projects,
                certifications: body.certifications,
                linkedin: body.linkedin,
                github: body.github,
                portfolioUrl: body.portfolioUrl,
            },
            create: {
                student: {
                    connect: {
                        id: student.id,
                    },
                },
                fullName: body.fullName,
                headline: body.headline,
                bio: body.bio,
                skills: body.skills,
                interests: body.interests,
                experience: body.experience,
                education: body.education,
                projects: body.projects,
                certifications: body.certifications,
                linkedin: body.linkedin,
                github: body.github,
                portfolioUrl: body.portfolioUrl,
            },
        })

        return NextResponse.json(portfolio)
    } catch (err) {
        console.error(" Error in POST /api/portfolio:", err)
        return NextResponse.json({ error: "Failed to save portfolio" }, { status: 500 })
    }
}
