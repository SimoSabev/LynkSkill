import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbUser } from "@/lib/api-guards"
import { calculateCandidateScore } from "@/lib/candidate-scoring"

export async function GET(req: NextRequest) {
    try {
        const guard = await requireDbUser("COMPANY")
        if (!guard.ok) return guard.response

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search") || ""
        const skills = searchParams.get("skills")?.split(",").filter(Boolean) || []

        // Fetch all students with their profiles and portfolios
        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT"
            },
            include: {
                profile: true,
                portfolio: true,
                experiences: true,
                projects: true
            },
            take: 50
        })

        // Map and calculate match scores using the consistent algorithm
        const candidates = students.map(student => {
            const fullName = student.profile?.name || student.portfolio?.fullName || "Student"
            
            // Use the consistent evaluation algorithm
            const { score, reasons, matchedSkills } = calculateCandidateScore({
                portfolio: student.portfolio,
                projects: student.projects || [],
                experiences: student.experiences || []
            }, skills)

            return {
                id: student.id,
                name: fullName,
                email: student.email || "",
                avatar: undefined,
                headline: student.portfolio?.headline || undefined,
                bio: student.portfolio?.bio || undefined,
                skills: student.portfolio?.skills || [],
                interests: student.portfolio?.interests || [],
                matchPercentage: score,
                matchReasons: reasons,
                matchedSkills,
                projectCount: student.projects?.length || 0,
                experienceCount: student.experiences?.length || 0
            }
        })

        // Filter by search term if provided
        let filteredCandidates = candidates
        if (search) {
            const searchLower = search.toLowerCase()
            filteredCandidates = candidates.filter(c => 
                c.name.toLowerCase().includes(searchLower) ||
                c.skills.some((s: string) => s.toLowerCase().includes(searchLower)) ||
                c.headline?.toLowerCase().includes(searchLower)
            )
        }

        // Sort by match percentage
        const sortedCandidates = filteredCandidates
            .sort((a, b) => b.matchPercentage - a.matchPercentage)
            .slice(0, 20)

        return NextResponse.json({ candidates: sortedCandidates })

    } catch (error) {
        console.error("Error fetching candidates:", error)
        return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
    }
}
