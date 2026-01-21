import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

// Skill-based evaluation algorithm (same as AI mode)
function calculateCandidateScore(student: {
    portfolio: {
        skills?: string[]
        interests?: string[]
        bio?: string | null
        headline?: string | null
    } | null
    projects: { title: string; description: string }[]
    experiences: unknown[]
}, requiredSkills: string[] = []) {
    let score = 0
    const reasons: string[] = []
    const matchedSkills: string[] = []

    const studentSkillsArray = (student.portfolio?.skills || []).map((s: string) => s.toLowerCase())
    const studentInterests = (student.portfolio?.interests || []).map((s: string) => s.toLowerCase())
    const bio = (student.portfolio?.bio || "").toLowerCase()
    const headline = (student.portfolio?.headline || "").toLowerCase()
    const projectsText = student.projects?.map(p => 
        `${p.title} ${p.description}`
    ).join(" ").toLowerCase() || ""
    
    const fullText = `${bio} ${headline} ${projectsText} ${studentSkillsArray.join(" ")} ${studentInterests.join(" ")}`

    // If required skills are provided, calculate match against them
    if (requiredSkills.length > 0) {
        for (const skill of requiredSkills) {
            const skillLower = skill.toLowerCase()
            
            // Direct skill match (highest weight)
            if (studentSkillsArray.some(s => s.includes(skillLower) || skillLower.includes(s))) {
                score += 30
                matchedSkills.push(skill)
                reasons.push(`Skilled in ${skill}`)
            }
            // Skill in projects (high weight)
            else if (projectsText.includes(skillLower)) {
                score += 20
                matchedSkills.push(skill)
                reasons.push(`${skill} in projects`)
            }
            // Skill mentioned elsewhere (medium weight)
            else if (fullText.includes(skillLower)) {
                score += 15
                matchedSkills.push(skill)
                reasons.push(`Experience with ${skill}`)
            }
        }
    } else {
        // No required skills - evaluate based on profile completeness
        if (student.portfolio?.bio && student.portfolio.bio.length > 50) {
            score += 15
            reasons.push("Detailed portfolio")
        }
        if (student.portfolio?.headline) {
            score += 10
            reasons.push("Professional headline")
        }
        if (studentSkillsArray.length > 0) {
            score += Math.min(studentSkillsArray.length * 5, 25)
            reasons.push(`${studentSkillsArray.length} skills listed`)
        }
    }

    // Bonus for projects (shows practical experience)
    if (student.projects && student.projects.length > 0) {
        const projectBonus = Math.min(student.projects.length * 5, 15)
        score += projectBonus
        reasons.push(`${student.projects.length} project${student.projects.length > 1 ? 's' : ''}`)
    }

    // Bonus for work experience
    if (student.experiences && student.experiences.length > 0) {
        score += 10
        reasons.push(`${student.experiences.length} experience${student.experiences.length > 1 ? 's' : ''}`)
    }

    // Cap at 98
    score = Math.min(score, 98)

    return { score, reasons, matchedSkills }
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

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
