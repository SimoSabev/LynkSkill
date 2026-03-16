import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { calculateAndSaveConfidenceScore } from "@/lib/confidence-score"

export async function GET(_req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.user.findUnique({ 
            where: { clerkId: userId },
            include: { 
                aiProfile: {
                    include: {
                        confidenceScore: true
                    }
                }
            }
        })
        
        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 })
        }

        return NextResponse.json(student.aiProfile || null)
    } catch (err) {
        console.error("Error fetching AI profile:", err)
        return NextResponse.json({ error: "Failed to fetch AI profile" }, { status: 500 })
    }
}

// Save or update AI profile data based on conversational chat
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.user.findUnique({ 
            where: { clerkId: userId },
            include: { aiProfile: true }
        })
        
        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 })
        }

        const body = await req.json()
        const { 
            personalInfo, 
            careerGoals, 
            personalityTraits, 
            skillsAssessment, 
            educationDetails, 
            availability, 
            preferences,
            questionsAsked,
            questionsAnswered,
            profilingComplete,
            profilingConversation
         } = body

        // Deep merge logic to preserve existing fields not in the payload
        const currentProfile = (student.aiProfile as Record<string, unknown>) || {}
        
        const mergedPersonalInfo = { ...(currentProfile.personalInfo as Record<string, unknown> || {}), ...(personalInfo || {}) }
        const mergedCareerGoals = { ...(currentProfile.careerGoals as Record<string, unknown> || {}), ...(careerGoals || {}) }
        const mergedPersonalityTraits = { ...(currentProfile.personalityTraits as Record<string, unknown> || {}), ...(personalityTraits || {}) }
        const mergedSkillsAssessment = { ...(currentProfile.skillsAssessment as Record<string, unknown> || {}), ...(skillsAssessment || {}) }
        const mergedEducationDetails = { ...(currentProfile.educationDetails as Record<string, unknown> || {}), ...(educationDetails || {}) }
        const mergedAvailability = { ...(currentProfile.availability as Record<string, unknown> || {}), ...(availability || {}) }
        const mergedPreferences = { ...(currentProfile.preferences as Record<string, unknown> || {}), ...(preferences || {}) }
        
        let newConversation = profilingConversation ? profilingConversation : [];
        if (currentProfile.profilingConversation && Array.isArray(currentProfile.profilingConversation)) {
            newConversation = [...currentProfile.profilingConversation, ...(profilingConversation || [])]
        }

        const currentAsked = typeof currentProfile.questionsAsked === 'number' ? currentProfile.questionsAsked : 0
        const currentAnswered = typeof currentProfile.questionsAnswered === 'number' ? currentProfile.questionsAnswered : 0
        const newAsked = typeof questionsAsked === 'number' ? questionsAsked : currentAsked
        const newAnswered = typeof questionsAnswered === 'number' ? questionsAnswered : currentAnswered
        const isComplete = profilingComplete !== undefined ? profilingComplete : currentProfile.profilingComplete || false

        const aiProfile = await prisma.aIProfile.upsert({
            where: { studentId: student.id },
            update: {
                personalInfo: mergedPersonalInfo,
                careerGoals: mergedCareerGoals,
                personalityTraits: mergedPersonalityTraits,
                skillsAssessment: mergedSkillsAssessment,
                educationDetails: mergedEducationDetails,
                availability: mergedAvailability,
                preferences: mergedPreferences,
                profilingConversation: newConversation,
                questionsAsked: newAsked,
                questionsAnswered: newAnswered,
                profilingComplete: isComplete,
                lastProfilingAt: new Date()
            },
            create: {
                student: { connect: { id: student.id } },
                personalInfo: mergedPersonalInfo,
                careerGoals: mergedCareerGoals,
                personalityTraits: mergedPersonalityTraits,
                skillsAssessment: mergedSkillsAssessment,
                educationDetails: mergedEducationDetails,
                availability: mergedAvailability,
                preferences: mergedPreferences,
                profilingConversation: newConversation,
                questionsAsked: newAsked,
                questionsAnswered: newAnswered,
                profilingComplete: isComplete,
                lastProfilingAt: new Date()
            },
            include: {
                 confidenceScore: true
            }
        })

        // Recalculate score after update
        const newScore = await calculateAndSaveConfidenceScore(student.id);

        return NextResponse.json({ 
            success: true, 
            aiProfile,
            confidenceScore: newScore,
            message: "AI profile saved successfully"
        })
    } catch (err) {
        console.error("Error saving AI profile:", err)
        return NextResponse.json({ error: "Failed to save AI profile" }, { status: 500 })
    }
}
