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

        const aiProfile = await prisma.aIProfile.findUnique({
            where: { studentId: student.id },
            include: { confidenceScore: true }
        })

        return NextResponse.json({
            ...portfolio,
            aiProfile: aiProfile || null
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        console.log(" POST /api/portfolio called")

        const { userId } = await auth()
        console.log(" Clerk userId:", userId)

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const student = await prisma.user.findUnique({ where: { clerkId: userId } })
        console.log(" Found student:", student?.id)

        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

        const body = await req.json()
        console.log(" Request body received:", JSON.stringify(body, null, 2))

        // Validate years in education
        if (body.education && Array.isArray(body.education)) {
            const currentYear = new Date().getFullYear()
            for (const edu of body.education) {
                if (edu.startYear < 1950 || edu.startYear > currentYear + 10) {
                    console.log(" Validation failed: Invalid start year", edu.startYear)
                    return NextResponse.json({ error: "Invalid start year in education" }, { status: 400 })
                }
                if (edu.endYear && (edu.endYear < 1950 || edu.endYear > currentYear + 10)) {
                    console.log(" Validation failed: Invalid end year", edu.endYear)
                    return NextResponse.json({ error: "Invalid end year in education" }, { status: 400 })
                }
                if (edu.endYear && edu.endYear < edu.startYear) {
                    console.log(" Validation failed: End year before start year")
                    return NextResponse.json({ error: "End year must be after start year" }, { status: 400 })
                }
            }
        }

        // Validate certification dates
        if (body.certifications && Array.isArray(body.certifications)) {
            for (const cert of body.certifications) {
                const issuedDate = new Date(cert.issuedAt)
                if (isNaN(issuedDate.getTime())) {
                    console.log(" Validation failed: Invalid issue date", cert.issuedAt)
                    return NextResponse.json({ error: "Invalid issue date in certification" }, { status: 400 })
                }
                if (issuedDate > new Date()) {
                    console.log(" Validation failed: Issue date in future")
                    return NextResponse.json({ error: "Issue date cannot be in the future" }, { status: 400 })
                }

                if (cert.expiresAt) {
                    const expiresDate = new Date(cert.expiresAt)
                    if (isNaN(expiresDate.getTime())) {
                        console.log(" Validation failed: Invalid expiry date", cert.expiresAt)
                        return NextResponse.json({ error: "Invalid expiry date in certification" }, { status: 400 })
                    }
                    if (expiresDate < issuedDate) {
                        console.log(" Validation failed: Expiry before issue date")
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
                    console.log(" Validation failed: Invalid skill", skill)
                    return NextResponse.json({ error: "Invalid skill name" }, { status: 400 })
                }
            }
        }

        if (body.interests && Array.isArray(body.interests)) {
            for (const interest of body.interests) {
                if (interest.length > 50 || !validateText(interest)) {
                    console.log(" Validation failed: Invalid interest", interest)
                    return NextResponse.json({ error: "Invalid interest name" }, { status: 400 })
                }
            }
        }

        const needsApproval = Boolean(body.age && body.age < 18)

        console.log(" Needs approval:", needsApproval)

        console.log(" Attempting upsert to database...")
        const portfolio = await prisma.portfolio.upsert({
            where: {
                studentId: student.id,
            },
            update: {
                fullName: body.fullName,
                headline: body.headline,
                age: body.age,
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
                approvalStatus: needsApproval ? "PENDING" : "APPROVED",
                needsApproval: needsApproval,
            },
            create: {
                student: {
                    connect: {
                        id: student.id,
                    },
                },
                fullName: body.fullName,
                headline: body.headline,
                age: body.age,
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
                approvalStatus: needsApproval ? "PENDING" : "APPROVED",
                needsApproval: needsApproval,
            },
        })

        console.log(" Portfolio saved successfully:", portfolio.id)
        return NextResponse.json(portfolio)
    } catch (err) {
        console.error(" Error in POST /api/portfolio:", err)
        return NextResponse.json({ error: "Failed to save portfolio" }, { status: 500 })
    }
}
