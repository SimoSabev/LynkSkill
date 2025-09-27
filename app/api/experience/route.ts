import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type StudentExperience = Awaited<
    ReturnType<typeof prisma.experience.findMany>
>

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const student = await prisma.user.findUnique({
            where: { clerkId: userId },
        })
        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 })
        }

        const formData = await req.formData()
        const companyId = formData.get("companyId") as string | null
        const files = formData.getAll("files").filter((f): f is File => f instanceof File)

        if (!companyId || files.length === 0) {
            return NextResponse.json({ error: "Missing companyId or files" }, { status: 400 })
        }

        const uploadedUrls: string[] = []

        for (const file of files) {
            // Validate size
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
                .upload(path, buffer, {
                    contentType: file.type,
                    upsert: true,
                })

            if (error) {
                console.error("Supabase upload error:", error.message)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/experience-files/${path}`
            uploadedUrls.push(fileUrl)
        }

        const experience = await prisma.experience.create({
            data: {
                studentId: student.id,
                companyId,
                mediaUrls: uploadedUrls,
                status: "pending",
            },
            include: { company: true },
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

        let experiences: StudentExperience = []

        if (user.role === "STUDENT") {
            experiences = await prisma.experience.findMany({
                where: { studentId: user.id },
                include: { company: true },
                orderBy: { createdAt: "desc" },
            })
        } else if (user.role === "COMPANY") {
            experiences = await prisma.experience.findMany({
                where: { companyId: { in: user.companies.map((c) => c.id) } },
                include: { student: true },
                orderBy: { createdAt: "desc" },
            })
        }

        return NextResponse.json(experiences)
    } catch (err) {
        console.error("Fetch experiences error:", err)
        return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 })
    }
}
