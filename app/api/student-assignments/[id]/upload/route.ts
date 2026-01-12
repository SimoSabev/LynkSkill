import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; const assignmentId = id

    try {
        const clerkUser = await currentUser()
        if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { internship: true }
        })

        if (!assignment)
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })

        // Access control
        if (dbUser.role === "STUDENT" && assignment.studentId !== dbUser.id)
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        if (dbUser.role === "COMPANY" && assignment.internship.companyId !== dbUser.id)
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const formData = await req.formData()
        const files = formData.getAll("files") as File[]

        const uploaded = []

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer())
            const path = `${assignmentId}/${Date.now()}-${file.name}`

            const { error } = await supabase.storage
                .from("assignments-files")
                .upload(path, buffer, { contentType: file.type })

            if (error) throw error

            const { data } = supabase.storage
                .from("assignments-files")
                .getPublicUrl(path)

            const record = await prisma.assignmentFile.create({
                data: {
                    assignmentId,
                    userId: dbUser.id,
                    name: file.name,
                    size: file.size,
                    url: data.publicUrl
                }
            })

            uploaded.push(record)
        }

        return NextResponse.json({ success: true, files: uploaded })
    } catch (error) {
        console.error("UPLOAD ERROR:", error)
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        )
    }
}
