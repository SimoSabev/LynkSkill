import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; const assignmentId = id

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

        // Fetch assignment
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                internship: {
                    include: {
                        company: true,
                    },
                },
            },
        })

        if (!assignment) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        // STUDENT ACCESS
        if (dbUser.role === "STUDENT") {
            if (assignment.studentId !== dbUser.id) {
                return NextResponse.json(
                    { error: "Forbidden: this is not your assignment" },
                    { status: 403 }
                )
            }
        }

        // COMPANY ACCESS
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
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            internshipTitle: assignment.internship.title,
            companyName: assignment.internship.company.name,
        })
    } catch (error) {
        console.error("Error fetching assignment:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
