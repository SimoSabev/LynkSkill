import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Experience } from "@prisma/client"

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

        const uploadedUrls: string[] = []
        for (const file of files) {
            if (file.type.startsWith("image/") && file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: `Image ${file.name} too large (max 10MB)` }, { status: 400 })
            }
            if (file.type.startsWith("video/") && file.size > 100 * 1024 * 1024) {
                return NextResponse.json({ error: `Video ${file.name} too large (max 100MB)` }, { status: 400 })
            }

            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const path = `${student.id}/experience/${Date.now()}-${file.name}`

            const { error } = await supabase.storage
                .from("experience-files")
                .upload(path, buffer, { contentType: file.type, upsert: true })

            if (error) {
                console.error("Supabase upload error:", error.message)
                return NextResponse.json({ error: error.message }, { status: 500 })
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
            const totalPoints = approved.length * 20
            const avgGrade =
                approved.length > 0 ? approved.reduce((sum, exp) => sum + (exp.grade || 0), 0) / approved.length : 0
            const uniqueCompanies = new Set(approved.map((exp) => exp.companyId)).size

            summary = {
                totalPoints,
                avgGrade: Math.round(avgGrade * 10) / 10,
                uniqueCompanies,
                allRound: totalPoints + avgGrade * 10 + uniqueCompanies * 5,
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
