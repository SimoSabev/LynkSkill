// app/api/applications/accept-offer/route.ts
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/applications/accept-offer - Student accepts an approved internship offer
export async function POST(req: Request) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { applicationId, notificationId } = body as {
            applicationId?: string
            notificationId?: string
        }

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
        }

        // Get the current user
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (user.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can accept internship offers" }, { status: 403 })
        }

        // Find the application and verify it belongs to this student
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: {
                    include: { company: true }
                },
                project: true,
            }
        })

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        if (application.studentId !== user.id) {
            return NextResponse.json({ error: "This application does not belong to you" }, { status: 403 })
        }

        if (application.status !== "APPROVED") {
            return NextResponse.json({ error: "Only approved applications can be accepted" }, { status: 400 })
        }

        // Check if already accepted (project exists)
        if (application.project) {
            // Already has a project, just return the project ID
            return NextResponse.json({
                success: true,
                message: "Offer already accepted",
                projectId: application.project.id,
                internshipTitle: application.internship.title,
                companyName: application.internship.company.name
            })
        }

        // Create a project for this accepted internship
        const project = await prisma.project.create({
            data: {
                title: application.internship.title,
                description: application.internship.description || "",
                internshipId: application.internshipId,
                applicationId: application.id,
                studentId: application.studentId,
                companyId: application.internship.companyId,
            }
        })

        // Mark the notification as read if provided
        if (notificationId) {
            await prisma.notification.updateMany({
                where: { 
                    id: notificationId,
                    userId: user.id 
                },
                data: { read: true }
            })
        }

        // Create a notification for the company that the student accepted
        const companyOwner = await prisma.companyMember.findFirst({
            where: {
                companyId: application.internship.companyId,
                defaultRole: "OWNER"
            },
            select: { userId: true }
        })

        if (companyOwner) {
            const studentProfile = await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { name: true }
            })

            await prisma.notification.create({
                data: {
                    userId: companyOwner.userId,
                    type: "GENERAL",
                    title: "Internship Offer Accepted",
                    message: `${studentProfile?.name || "A student"} has accepted the offer for "${application.internship.title}"`,
                    link: "/dashboard/company/experience"
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: "Offer accepted successfully",
            projectId: project.id,
            internshipTitle: application.internship.title,
            companyName: application.internship.company.name
        })
    } catch (error) {
        console.error("POST /api/applications/accept-offer error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
