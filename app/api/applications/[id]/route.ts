// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { notifyApplicationStatusChange } from "@/lib/notifications"
import { Permission } from "@prisma/client"
import { checkPermission, getUserCompanyByClerkId } from "@/lib/permissions"
import { ensureProjectForApprovedApplication, getApprovalBlocker } from "@/lib/services/applications"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const { status } = await req.json()

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        // Get membership and check permissions
        const membership = await getUserCompanyByClerkId(clerkId)
        if (!membership) {
            return NextResponse.json(
                { error: "Company membership not found" },
                { status: 404 }
            )
        }

        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.MANAGE_APPLICATIONS
        )
        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to manage applications" },
                { status: 403 }
            )
        }

        // ======================================================
        // 1) Load the application + internship + project
        // ======================================================
        const data = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: {
                    include: { company: true }
                },
                student: true,
                project: true,   // IMPORTANT for project creation check
            },
        })

        if (!data)
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            )

        // ======================================================
        // 1.5) Verify application belongs to user's company
        // ======================================================
        if (data.internship.companyId !== membership.companyId) {
            return NextResponse.json(
                { error: "You can only manage applications for your own internships" },
                { status: 403 }
            )
        }

        // ======================================================
        // 2) Check assignment upload ONLY IF internship requires it
        // ======================================================
        if (status === "APPROVED") {
            const blocker = await getApprovalBlocker(data.internshipId, data.studentId)
            if (blocker) {
                return NextResponse.json({ error: blocker }, { status: 400 })
            }
        }

        // ======================================================
        // 3) Update application status
        // ======================================================
        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status },
            include: {
                internship: true,
                student: true,
            },
        })

        // ======================================================
        // 4) Create project if APPROVED and no project exists
        // ======================================================
        if (status === "APPROVED") {
            await ensureProjectForApprovedApplication(updatedApplication.id)
        }

        // ======================================================
        // 5) Send notification to student about status change
        // ======================================================
        const company = await prisma.company.findFirst({
            where: { id: updatedApplication.internship.companyId },
            select: { name: true, id: true }
        })
        
        await notifyApplicationStatusChange(
            updatedApplication.studentId,
            updatedApplication.internship.title,
            company?.name || "Company",
            status as "APPROVED" | "REJECTED",
            updatedApplication.id,  // applicationId
            company?.id             // companyId
        )

        return NextResponse.json(updatedApplication)
    } catch (error) {
        console.error("Error updating application:", error)
        return NextResponse.json(
            { error: "Failed to update application" },
            { status: 500 }
        )
    }
}
