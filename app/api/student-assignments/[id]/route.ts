import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { getUserCompany } from "@/lib/permissions"

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
            return NextResponse.json(
                { error: "User not found in database" },
                { status: 404 }
            )
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
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            )
        }

        // Access control: the assigned student, or an active member of the hiring company.
        // (Previously TEAM_MEMBER matched neither branch and skipped the check entirely,
        // and the company branch compared a company id with a user id.)
        if (assignment.studentId !== dbUser.id) {
            const membership = await getUserCompany(dbUser.id)
            const isCompanyMember =
                membership?.status === "ACTIVE" &&
                membership.companyId === assignment.internship.companyId
            if (!isCompanyMember) {
                return NextResponse.json(
                    { error: "Forbidden: this is not your assignment" },
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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}