import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const assignmentId = id

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

        // Fetch assignment with submissions
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                internship: {
                    include: {
                        company: true,
                    },
                },
                submissions: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        size: true,
                        url: true,
                        createdAt: true,
                    }
                }
            },
        })

        if (!assignment) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        // Authorization checks
        if (dbUser.role === "STUDENT") {
            if (assignment.studentId !== dbUser.id) {
                return NextResponse.json(
                    { error: "Forbidden: this is not your assignment" },
                    { status: 403 }
                )
            }
        }

        if (dbUser.role === "COMPANY") {
            const company = await prisma.company.findFirst({
                where: { ownerId: dbUser.id },
            })

            if (!company || assignment.internship.companyId !== company.id) {
                return NextResponse.json(
                    { error: "Forbidden: this is not your internship" },
                    { status: 403 }
                )
            }
        }

        return NextResponse.json({
            files: assignment.submissions.map(file => ({
                id: file.id,
                name: file.name,
                size: file.size,
                url: file.url,
                createdAt: file.createdAt.toISOString(),
            }))
        })
    } catch (error) {
        console.error("Error fetching submissions:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
