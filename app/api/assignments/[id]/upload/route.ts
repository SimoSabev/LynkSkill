import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"
import { currentUser } from "@clerk/nextjs/server"
import slugify from "slugify"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sanitizeFileName = (name: string) => {
    const [base, ext] = name.split(/\.(?=[^\.]+$)/)
    const safeBase = slugify(base, { lower: true, strict: true })
    return `${safeBase}.${ext || ""}`
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const assignmentId = params.id

    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id },
        })

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                internship: true,
            },
        })

        if (!assignment) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            )
        }

        // Access control
        if (dbUser.role === "STUDENT") {
            if (assignment.studentId !== dbUser.id) {
                return NextResponse.json(
                    { error: "Forbidden: not your assignment" },
                    { status: 403 }
                )
            }
        }

        if (dbUser.role === "COMPANY") {
            if (assignment.internship.companyId !== dbUser.id) {
                return NextResponse.json(
                    { error: "Forbidden: not your internship" },
                    { status: 403 }
                )
            }
        }

        const formData = await req.formData()
        const files = formData.getAll("files") as File[]

        if (!files.length) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 })
        }

        const uploadedFilesData = []

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer())
            const safeName = sanitizeFileName(file.name)
            const filePath = `${assignmentId}/${Date.now()}-${safeName}`

            const { error: uploadError } = await supabase.storage
                .from("assignments-files")
                .upload(filePath, buffer, { contentType: file.type })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from("assignments-files")
                .getPublicUrl(filePath)

            const record = await prisma.assignmentFile.create({
                data: {
                    assignmentId,
                    userId: dbUser.id,
                    name: file.name,
                    size: file.size,
                    url: urlData.publicUrl,
                },
            })

            uploadedFilesData.push(record)
        }

        return NextResponse.json({ success: true, files: uploadedFilesData })
    } catch (err) {
        console.error("Upload error:", err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Upload failed" },
            { status: 500 }
        )
    }
}
