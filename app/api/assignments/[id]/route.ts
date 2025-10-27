import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"


export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> } // 👈 must be Promise
) {
    try {
        const { id } = await context.params // 👈 await params

        const internship = await prisma.internship.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                testAssignmentTitle: true,
                testAssignmentDescription: true,
                testAssignmentDueDate: true,
                company: {
                    select: {
                        name: true,
                    },
                },
            },
        })

        if (!internship) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            )
        }

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

// 🧩 Access control
        if (dbUser.role === "STUDENT") {
            const hasApplied = await prisma.application.findFirst({
                where: {
                    studentId: dbUser.id,
                    internshipId: internship.id,
                },
            })

            if (!hasApplied) {
                return NextResponse.json(
                    { error: "Forbidden: you haven’t applied to this internship" },
                    { status: 403 }
                )
            }
        }

        if (dbUser.role === "COMPANY") {
            const ownsInternship = await prisma.internship.findFirst({
                where: { id: internship.id, companyId: dbUser.id },
            })

            if (!ownsInternship) {
                return NextResponse.json(
                    { error: "Forbidden: not your internship" },
                    { status: 403 }
                )
            }
        }

        return NextResponse.json({
            id: internship.id,
            title: internship.testAssignmentTitle,
            description: internship.testAssignmentDescription,
            dueDate: internship.testAssignmentDueDate,
            internshipTitle: internship.title,
            companyName: internship.company.name,
        })
    } catch (error) {
        console.error("Error fetching assignment:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
