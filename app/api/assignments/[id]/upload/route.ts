import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"
import { currentUser } from "@clerk/nextjs/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> } // 👈 note Promise
) {
    const { id } = await context.params // 👈 must await params
    const internshipId = id

    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id },
        })

        if (!dbUser) {
            return NextResponse.json({ error: "User not found in database" }, { status: 404 })
        }

        const formData = await req.formData()
        const files = formData.getAll("files") as File[]

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 })
        }

        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
        })
        if (!internship) {
            return NextResponse.json({ error: "Internship not found" }, { status: 404 })
        }

        let assignment = await prisma.assignment.findFirst({
            where: { internshipId, studentId: dbUser.id },
        })

        if (!assignment) {
            assignment = await prisma.assignment.create({
                data: {
                    internshipId,
                    studentId: dbUser.id,
                    title: "Student Submission",
                    description: "Auto-created assignment submission",
                    dueDate: new Date(),
                },
            })
        }

        const uploadedFilesData = []

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const filePath = `${assignment.id}/${Date.now()}-${file.name}`

            const { error: uploadError } = await supabase.storage
                .from("assignments-files")
                .upload(filePath, buffer, { contentType: file.type })

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage
                .from("assignments-files")
                .getPublicUrl(filePath)

            const fileRecord = await prisma.assignmentFile.create({
                data: {
                    assignmentId: assignment.id,
                    userId: dbUser.id,
                    name: file.name,
                    size: file.size,
                    url: publicUrlData.publicUrl,
                },
            })

            uploadedFilesData.push(fileRecord)
        }

        return NextResponse.json({ success: true, files: uploadedFilesData })
    } catch (err: unknown) {
        console.error("🚨 Upload error:", err)
        const message = err instanceof Error ? err.message : "Failed to upload files"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
