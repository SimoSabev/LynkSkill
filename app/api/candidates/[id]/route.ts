import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbUser } from "@/lib/api-guards"
import { calculateCandidateScore } from "@/lib/candidate-scoring"

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
        const guard = await requireDbUser("COMPANY")
        if (!guard.ok) return guard.response

        const { id: candidateId } = await params
        const { searchParams } = new URL(req.url)
        const skills = searchParams.get("skills")?.split(",").filter(Boolean) || []

        // Requesting company, for evaluation history
        const companyId = guard.user.companies[0]?.id

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

        // Fetch evaluation history for this company only
        let evaluationHistory: EvaluationRecord[] = []
        if (companyId) {
            try {
                const evaluations = await prisma.candidateEvaluation.findMany({
                    where: {
                        candidateId,
                        companyId
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20
                })

                // Group by session
                const grouped = evaluations.reduce((acc: Record<string, EvaluationRecord>, evaluation) => {
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
            } catch (err) {
                // History is non-critical for rendering the profile
                console.error("Failed to load evaluation history:", err)
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
