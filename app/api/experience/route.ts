import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Experience } from "@prisma/client"
import { MAX_FILES_PER_REQUEST, UPLOAD_RULES, safeStorageName, validateUpload } from "@/lib/upload-utils"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const student = await prisma.user.findUnique({
            where: { clerkId: userId },
        })
        if (!student || student.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can upload experiences" }, { status: 403 })
        }

        const formData = await req.formData()
        const companyId = formData.get("companyId") as string | null
        const projectId = formData.get("projectId") as string | null
        const files = formData.getAll("files").filter((f): f is File => f instanceof File)

        if (!companyId || !projectId || files.length === 0) {
            return NextResponse.json({ error: "Missing companyId, projectId, or files" }, { status: 400 })
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                application: true,
                internship: true,
            },
        })

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        // Verify the project belongs to this student
        if (project.studentId !== student.id) {
            return NextResponse.json({ error: "You don't have access to this project" }, { status: 403 })
        }

        // Verify the project's company matches the selected company
        if (project.companyId !== companyId) {
            return NextResponse.json({ error: "Project doesn't belong to the selected company" }, { status: 400 })
        }

        // Verify the application is APPROVED
        if (!project.application || project.application.status !== "APPROVED") {
            return NextResponse.json({ error: "You can only upload experiences for approved applications" }, { status: 403 })
        }

        if (files.length > MAX_FILES_PER_REQUEST) {
            return NextResponse.json({ error: `Max ${MAX_FILES_PER_REQUEST} files per upload` }, { status: 400 })
        }
        for (const file of files) {
            const rule = file.type.startsWith("video/") ? UPLOAD_RULES.experienceVideo : UPLOAD_RULES.experienceFile
            const invalid = validateUpload(file, rule)
            if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
        }

        const uploadedUrls: string[] = []
        for (const [index, file] of files.entries()) {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const path = `${student.id}/experience/${Date.now()}-${index}-${safeStorageName(file.name)}`

            const { error } = await supabase.storage
                .from("experience-files")
                .upload(path, buffer, { contentType: file.type, upsert: false })

            if (error) {
                console.error("Supabase upload error:", error.message)
                return NextResponse.json({ error: "Upload failed" }, { status: 500 })
            }

            const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/experience-files/${path}`
            uploadedUrls.push(fileUrl)
        }

        // Cache uploader info directly
        const clerk = await currentUser()
        const uploaderName =
            clerk?.fullName || clerk?.username || clerk?.firstName || clerk?.emailAddresses[0]?.emailAddress || "Unknown"
        const uploaderImage = clerk?.imageUrl || null

        const experience = await prisma.experience.create({
            data: {
                studentId: student.id,
                companyId,
                projectId: projectId, // Store the project reference
                mediaUrls: uploadedUrls,
                status: "pending",
                uploaderName,
                uploaderImage,
            },
            include: { company: true, student: true },
        })

        return NextResponse.json(experience)
    } catch (err) {
        console.error("Experience upload error:", err)
        return NextResponse.json({ error: "Failed to upload experience" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true },
        })
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        let experiences: Experience[] = []
        let summary = null

        if (user.role === "STUDENT") {
            experiences = await prisma.experience.findMany({
                where: { studentId: user.id },
                include: { company: true },
                orderBy: { createdAt: "desc" },
            })

            const approved = experiences.filter((exp) => exp.status === "approved")
            const totalExperiences = approved.length
            
            // Calculate new skill-based metrics
            const avgSkillScore = approved.length > 0 
                ? approved.reduce((sum, exp) => {
                    const skills = exp.skillsRating || 0
                    const impact = exp.impactRating || 0
                    const growth = exp.growthRating || 0
                    // Calculate skill score per experience (max 100)
                    const score = skills && impact && growth 
                        ? Math.round(((skills + impact + growth) / 15) * 100)
                        : (exp.grade ? (exp.grade - 1) * 25 : 0) // Fallback for legacy grades
                    return sum + score
                }, 0) / approved.length 
                : 0
            
            // Count endorsements by type
            const endorsementCounts = approved.reduce((acc, exp) => {
                if (exp.recommendation) {
                    acc[exp.recommendation] = (acc[exp.recommendation] || 0) + 1
                }
                return acc
            }, {} as Record<string, number>)
            
            const uniqueCompanies = new Set(approved.map((exp) => exp.companyId)).size
            
            // Calculate professional score (weighted combination)
            const professionalScore = Math.round(
                (avgSkillScore * 0.6) + // 60% from skill ratings
                (totalExperiences * 5) + // 5 points per experience
                (uniqueCompanies * 8) + // 8 points per unique company
                ((endorsementCounts['highly_recommend'] || 0) * 10) + // Bonus for high recommendations
                ((endorsementCounts['recommend'] || 0) * 5)
            )

            summary = {
                totalExperiences,
                avgSkillScore: Math.round(avgSkillScore),
                uniqueCompanies,
                professionalScore,
                endorsements: endorsementCounts,
                // Legacy fields for backward compatibility
                totalPoints: totalExperiences * 20,
                avgGrade: approved.length > 0 
                    ? Math.round((approved.reduce((sum, exp) => sum + (exp.grade || 0), 0) / approved.length) * 10) / 10 
                    : 0,
                allRound: professionalScore,
            }
        } else if (user.role === "COMPANY") {
            experiences = await prisma.experience.findMany({
                where: { companyId: { in: user.companies.map((c) => c.id) } },
                include: { student: true },
                orderBy: { createdAt: "desc" },
            })

        }

        return NextResponse.json({ experiences, summary })
    } catch (err) {
        console.error("Fetch experiences error:", err)
        return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 })
    }
}
