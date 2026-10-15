import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { notifyExperienceGraded } from "@/lib/notifications"
import { calculateSkillScore } from "@/lib/candidate-scoring"

const VALID_STATUSES = ["pending", "approved", "rejected"]
const VALID_RECOMMENDATIONS = ["highly_recommend", "recommend", "neutral", "not_recommend"]

// Endorsement types
interface EndorsementData {
    status: string
    skillsRating?: number      // 1-5
    impactRating?: number      // 1-5
    growthRating?: number      // 1-5
    recommendation?: string    // "highly_recommend" | "recommend" | "neutral" | "not_recommend"
    endorsementNote?: string
    grade?: number             // Legacy support
}

// Calculate legacy grade from new ratings (for backward compatibility)
function calculateLegacyGrade(skillsRating?: number, impactRating?: number, growthRating?: number): number | null {
    if (!skillsRating || !impactRating || !growthRating) return null
    // Average of ratings (1-5) mapped to grade (2-6)
    const avgRating = (skillsRating + impactRating + growthRating) / 3
    return Math.round(avgRating + 1) // 1-5 → 2-6
}

// PATCH /api/experience/[id] - Update experience status and endorsement
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })

        if (!user || user.role !== "COMPANY") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json() as EndorsementData
        const { status, skillsRating, impactRating, growthRating, recommendation, endorsementNote } = body

        const experience = await prisma.experience.findUnique({
            where: { id },
        })

        if (!experience) {
            return NextResponse.json({ error: "Experience not found" }, { status: 404 })
        }

        if (!user.companies.some((c: { id: string }) => c.id === experience.companyId)) {
            return NextResponse.json({ error: "Not your company's experience" }, { status: 403 })
        }

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        // Validate endorsement data for approval
        if (status === "approved") {
            if (!skillsRating || !impactRating || !growthRating || !recommendation) {
                return NextResponse.json({ 
                    error: "Complete endorsement (skills, impact, growth ratings and recommendation) is required when approving" 
                }, { status: 400 })
            }
            
            // Validate rating ranges (1-5, integers)
            const ratings = [skillsRating, impactRating, growthRating]
            if (ratings.some(r => !Number.isInteger(r) || r < 1 || r > 5)) {
                return NextResponse.json({ error: "Ratings must be whole numbers between 1 and 5" }, { status: 400 })
            }
            if (!VALID_RECOMMENDATIONS.includes(recommendation)) {
                return NextResponse.json({ error: "Invalid recommendation" }, { status: 400 })
            }
        }

        // Calculate legacy grade for backward compatibility
        const calculatedGrade = status === "approved" 
            ? calculateLegacyGrade(skillsRating, impactRating, growthRating)
            : null


        // Update experience - use simple update without include to avoid Prisma issues
        await prisma.experience.update({
            where: { id },
            data: {
                status,
                grade: calculatedGrade,
                skillsRating: status === "approved" ? skillsRating : null,
                impactRating: status === "approved" ? impactRating : null,
                growthRating: status === "approved" ? growthRating : null,
                recommendation: status === "approved" ? recommendation : null,
                endorsementNote: status === "approved" ? (endorsementNote || null) : null,
            },
        })

        // Fetch the updated experience with relations
        const updated = await prisma.experience.findUnique({
            where: { id },
            include: {
                student: true,
                company: true,
            },
        })

        if (!updated) {
            return NextResponse.json({ error: "Failed to fetch updated experience" }, { status: 500 })
        }

        // 📧 Notify student about experience endorsement
        if (status === "approved" && skillsRating && impactRating && growthRating) {
            const company = user.companies.find((c: { id: string }) => c.id === experience.companyId)
            const skillScore = calculateSkillScore({ skillsRating, impactRating, growthRating, recommendation })
            await notifyExperienceGraded(
                experience.studentId,
                company?.name || "Company",
                skillScore // Send skill score instead of grade
            )
        }

        return NextResponse.json(updated)
    } catch (error) {
        console.error(" PATCH /experience/[id] error:", error)
        return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
    }
}
