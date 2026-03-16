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
        
        if (!student || !student.aiProfile) {
            return NextResponse.json({ error: "No AI Profile found for student" }, { status: 404 })
        }

        if (!student.aiProfile.confidenceScore) {
             // Calculate on the fly if missing
             const newScore = await calculateAndSaveConfidenceScore(student.id);
             return NextResponse.json(newScore);
        }

        return NextResponse.json(student.aiProfile.confidenceScore)
    } catch (err) {
        console.error("Error fetching confidence score:", err)
        return NextResponse.json({ error: "Failed to fetch confidence score" }, { status: 500 })
    }
}

// Force a recalculation
export async function POST(_req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.user.findUnique({ 
            where: { clerkId: userId }
        })
        
        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 })
        }

        const score = await calculateAndSaveConfidenceScore(student.id);

        return NextResponse.json({ 
            success: true, 
            score,
            message: "Score recalculated successfully"
        })
    } catch (err) {
        console.error("Error recalculating score:", err)
        return NextResponse.json({ error: "Failed to recalculate score" }, { status: 500 })
    }
}
