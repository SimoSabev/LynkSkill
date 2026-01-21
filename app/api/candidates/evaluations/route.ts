import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

interface EvaluationInput {
    id: string
    matchPercentage: number
    reasons: string[]
    skills: string[]
}

interface SessionData {
    sessionId: string
    sessionName: string | null
    searchQuery: string | null
    requiredSkills: string[]
    createdAt: Date
    candidates: Array<{
        id: string
        candidateId: string
        name: string
        avatar?: string
        matchPercentage: number
        matchReasons: string[]
        matchedSkills: string[]
    }>
}

// Save AI evaluation results for candidates
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get the company for this user
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true }
        })

        if (!user || user.role !== "COMPANY" || user.companies.length === 0) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        const company = user.companies[0]
        const body = await req.json()
        
        const { 
            sessionId, 
            sessionName,
            searchQuery, 
            requiredSkills, 
            candidates // Array of candidate evaluation results
        } = body

        if (!sessionId || !candidates || !Array.isArray(candidates)) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
        }

        // Save evaluation for each candidate
        const evaluations = await Promise.all(
            candidates.map(async (candidate: EvaluationInput) => {
                // @ts-expect-error - Model may not exist until migration is run
                return prisma.candidateEvaluation.create({
                    data: {
                        candidateId: candidate.id,
                        companyId: company.id,
                        sessionId,
                        sessionName: sessionName || `AI Search - ${new Date().toLocaleDateString()}`,
                        searchQuery: searchQuery || "",
                        requiredSkills: requiredSkills || [],
                        matchPercentage: candidate.matchPercentage,
                        matchReasons: candidate.reasons || [],
                        matchedSkills: candidate.skills || []
                    }
                })
            })
        )

        return NextResponse.json({ 
            success: true, 
            evaluationsCount: evaluations.length,
            sessionId 
        })

    } catch (error) {
        console.error("Error saving AI evaluations:", error)
        return NextResponse.json({ error: "Failed to save evaluations" }, { status: 500 })
    }
}

// Get all evaluations for a company
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true }
        })

        if (!user || user.role !== "COMPANY" || user.companies.length === 0) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        const company = user.companies[0]
        const { searchParams } = new URL(req.url)
        const candidateId = searchParams.get("candidateId")

        const whereClause: { companyId: string; candidateId?: string } = {
            companyId: company.id
        }

        if (candidateId) {
            whereClause.candidateId = candidateId
        }

        // @ts-expect-error - Model may not exist until migration is run
        const evaluations = await prisma.candidateEvaluation.findMany({
            where: whereClause,
            include: {
                candidate: {
                    include: {
                        profile: true,
                        portfolio: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Group evaluations by session
        const sessions = (evaluations as Array<{
            id: string
            sessionId: string
            sessionName: string | null
            searchQuery: string | null
            requiredSkills: string[]
            createdAt: Date
            candidateId: string
            matchPercentage: number
            matchReasons: string[]
            matchedSkills: string[]
            candidate: {
                profile?: { name?: string; avatar?: string } | null
                portfolio?: { fullName?: string; avatarUrl?: string } | null
            }
        }>).reduce((acc: Record<string, SessionData>, evaluation) => {
            if (!acc[evaluation.sessionId]) {
                acc[evaluation.sessionId] = {
                    sessionId: evaluation.sessionId,
                    sessionName: evaluation.sessionName,
                    searchQuery: evaluation.searchQuery,
                    requiredSkills: evaluation.requiredSkills,
                    createdAt: evaluation.createdAt,
                    candidates: []
                }
            }
            acc[evaluation.sessionId].candidates.push({
                id: evaluation.id,
                candidateId: evaluation.candidateId,
                name: evaluation.candidate.profile?.name || evaluation.candidate.portfolio?.fullName || "Student",
                avatar: evaluation.candidate.profile?.avatar || evaluation.candidate.portfolio?.avatarUrl || undefined,
                matchPercentage: evaluation.matchPercentage,
                matchReasons: evaluation.matchReasons,
                matchedSkills: evaluation.matchedSkills
            })
            return acc
        }, {} as Record<string, SessionData>)

        return NextResponse.json({ 
            sessions: (Object.values(sessions) as SessionData[]).sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        })

    } catch (error) {
        console.error("Error fetching AI evaluations:", error)
        return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 })
    }
}
