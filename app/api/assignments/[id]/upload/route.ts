import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"
import { currentUser } from "@clerk/nextjs/server"
import { MAX_FILES_PER_REQUEST, UPLOAD_RULES, safeStorageName, validateUpload } from "@/lib/upload-utils"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; const assignmentId = id

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
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        // Only the assigned student submits work. A company uploading here would
        // count as a "submission" and unlock approval/messaging gates.
        if (dbUser.role !== "STUDENT" || assignment.studentId !== dbUser.id) {
            return NextResponse.json(
                { error: "Forbidden: not your assignment" },
                { status: 403 }
            )
        }

        const formData = await req.formData()
        const files = formData.getAll("files").filter((f): f is File => f instanceof File)

        if (!files.length) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 })
        }
        if (files.length > MAX_FILES_PER_REQUEST) {
            return NextResponse.json({ error: `Max ${MAX_FILES_PER_REQUEST} files per upload` }, { status: 400 })
        }
        for (const file of files) {
            const invalid = validateUpload(file, UPLOAD_RULES.assignment)
            if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
        }

        const uploadedFilesData = []

        for (const [index, file] of files.entries()) {
            const buffer = Buffer.from(await file.arrayBuffer())
            const filePath = `${assignmentId}/${Date.now()}-${index}-${safeStorageName(file.name)}`

            const { error: uploadError } = await supabase.storage
                .from("assignments-files")
                .upload(filePath, buffer, { contentType: file.type })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from("assignments-files")
                .getPublicUrl(filePath)

            const fileRecord = await prisma.assignmentFile.create({
                data: {
                    assignmentId,
                    userId: dbUser.id,
                    name: file.name,
                    size: file.size,
                    url: urlData.publicUrl,
                },
            })

            uploadedFilesData.push(fileRecord)
        }

        return NextResponse.json({ success: true, files: uploadedFilesData })
    } catch (err) {
        console.error("Upload error:", err)
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        )
    }
}
