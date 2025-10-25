// For applications and internships related to a company
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const companyUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        })
        if (!companyUser)
            return NextResponse.json(
                { error: "Company user not found" },
                { status: 404 }
            )

        // Find the company owned by this user
        const company = await prisma.company.findFirst({
            where: { ownerId: companyUser.id },
        })
        if (!company)
            return NextResponse.json({ error: "Company not found" }, { status: 404 })

        // Get all internship IDs belonging to this company
        const internshipIds = (
            await prisma.internship.findMany({
                where: { companyId: company.id },
                select: { id: true },
            })
        ).map((i) => i.id)

        // Fetch applications for these internships
        const applications = await prisma.application.findMany({
            where: { internshipId: { in: internshipIds } },
            include: {
                internship: {
                    include: { company: true },
                },
                student: {
                    include: {
                        assignments: {
                            include: {
                                submissions: true, // ✅ note: correct field name from your schema
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        // Add `hasUploadedFiles` flag
        const formatted = applications.map((app) => {
            const hasUploadedFiles = app.student.assignments.some(
                (a) =>
                    a.internshipId === app.internshipId &&
                    a.submissions &&
                    a.submissions.length > 0
            )
            return { ...app, hasUploadedFiles }
        })

        return NextResponse.json(formatted)
    } catch (err) {
        console.error("Error fetching company applications:", err)
        return NextResponse.json(
            { error: "Failed to fetch company applications" },
            { status: 500 }
        )
    }
}
