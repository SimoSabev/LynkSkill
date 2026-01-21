import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Save AI-generated portfolio data to user's profile
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.user.findUnique({ 
            where: { clerkId: userId },
            include: { portfolio: true }
        })
        
        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 })
        }

        const body = await req.json()
        const { headline, about, skills, interests } = body

        // Merge with existing portfolio data if exists
        const existingSkills = student.portfolio?.skills || []
        const existingInterests = student.portfolio?.interests || []
        
        // Combine and deduplicate skills and interests
        const mergedSkills = [...new Set([...existingSkills, ...(skills || [])])]
        const mergedInterests = [...new Set([...existingInterests, ...(interests || [])])]

        const portfolio = await prisma.portfolio.upsert({
            where: { studentId: student.id },
            update: {
                headline: headline || student.portfolio?.headline,
                bio: about || student.portfolio?.bio,
                skills: mergedSkills,
                interests: mergedInterests,
            },
            create: {
                student: { connect: { id: student.id } },
                headline: headline || "",
                bio: about || "",
                skills: mergedSkills,
                interests: mergedInterests,
            },
        })

        return NextResponse.json({ 
            success: true, 
            portfolio,
            message: "AI-generated portfolio saved successfully" 
        })
    } catch (err) {
        console.error("Error saving AI portfolio:", err)
        return NextResponse.json({ error: "Failed to save AI portfolio" }, { status: 500 })
    }
}
