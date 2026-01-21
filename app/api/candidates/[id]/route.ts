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

interface EvaluationRecord {
    sessionId: string
    sessionName: string | null
    searchQuery: string | null
    requiredSkills: string[]
    createdAt: Date
    matchPercentage: number
    matchReasons: string[]
    matchedSkills: string[]
}

// Get a single candidate's full profile
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: candidateId } = await params
        const { searchParams } = new URL(req.url)
        const skills = searchParams.get("skills")?.split(",").filter(Boolean) || []

        // Get the requesting user's company for evaluation history
        const requestingUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true }
        })

        const companyId = requestingUser?.companies?.[0]?.id

        // Fetch the candidate with all related data
        const student = await prisma.user.findUnique({
            where: { 
                id: candidateId,
                role: "STUDENT"
            },
            include: {
                profile: true,
                portfolio: true,
                projects: true,
                experiences: {
                    include: {
                        company: true,
                        project: true
                    }
                }
            }
        })

        if (!student) {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
        }

        // Fetch evaluation history separately (handles case where model might not exist yet)
        let evaluationHistory: EvaluationRecord[] = []
        if (companyId) {
            try {
                // @ts-expect-error - Model may not exist until migration is run
                const evaluations = await prisma.candidateEvaluation.findMany({
                    where: { 
                        candidateId,
                        companyId 
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20
                })
                
                // Group by session
                const grouped = evaluations.reduce((acc: Record<string, EvaluationRecord>, evaluation: EvaluationRecord) => {
                    if (!acc[evaluation.sessionId]) {
                        acc[evaluation.sessionId] = {
                            sessionId: evaluation.sessionId,
                            sessionName: evaluation.sessionName,
                            searchQuery: evaluation.searchQuery,
                            requiredSkills: evaluation.requiredSkills,
                            createdAt: evaluation.createdAt,
                            matchPercentage: evaluation.matchPercentage,
                            matchReasons: evaluation.matchReasons,
                            matchedSkills: evaluation.matchedSkills
                        }
                    }
                    return acc
                }, {} as Record<string, EvaluationRecord>)
                
                evaluationHistory = (Object.values(grouped) as EvaluationRecord[]).sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
            } catch {
                // Model doesn't exist yet, ignore
                console.log("CandidateEvaluation model not yet available")
            }
        }

        // Calculate evaluation score using the same algorithm as AI mode
        const { score, reasons, matchedSkills } = calculateCandidateScore({
            portfolio: student.portfolio,
            projects: student.projects || [],
            experiences: student.experiences || []
        }, skills)

        const candidate = {
            id: student.id,
            name: student.profile?.name || student.portfolio?.fullName || "Student",
            email: student.email || "",
            headline: student.portfolio?.headline || undefined,
            bio: student.portfolio?.bio || undefined,
            skills: student.portfolio?.skills || [],
            interests: student.portfolio?.interests || [],
            experience: student.portfolio?.experience || undefined,
            // Current evaluation data (same format as AI mode)
            matchPercentage: score,
            matchReasons: reasons,
            matchedSkills: matchedSkills,
            // Evaluation history from AI sessions
            evaluationHistory,
            // Projects
            projects: student.projects?.map((p: { id: string; title: string; description: string }) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                technologies: [] // Projects don't have technologies in schema
            })) || [],
            // Experiences
            experiences: student.experiences?.map((e: { id: string; createdAt: Date; project?: { title?: string; description?: string } | null; company?: { name?: string } | null }) => ({
                id: e.id,
                title: e.project?.title || "Experience",
                company: e.company?.name || "Company",
                description: e.project?.description || undefined,
                startDate: e.createdAt.toISOString(),
                endDate: undefined
            })) || []
        }

        return NextResponse.json({ candidate })

    } catch (error) {
        console.error("Error fetching candidate:", error)
        return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 })
    }
}
