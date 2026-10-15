import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

// Invite a candidate for an interview
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: candidateId } = await params
        const { 
            scheduledAt, 
            duration = 30, 
            type = "video", 
            location, 
            notes,
            positionTitle,
            timeZone
        } = await req.json()

        if (!scheduledAt || isNaN(Date.parse(scheduledAt))) {
            return NextResponse.json({ error: "Interview date is required" }, { status: 400 })
        }

        if (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > 2000)) {
            return NextResponse.json({ error: "Notes are too long (maximum 2000 characters)" }, { status: 400 })
        }

        // Get the company user
        const companyUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { companies: true }
        })

        if (!companyUser || companyUser.role !== "COMPANY" || companyUser.companies.length === 0) {
            return NextResponse.json({ error: "Only companies can invite candidates" }, { status: 403 })
        }

        const company = companyUser.companies[0]

        // Get the candidate
        const candidate = await prisma.user.findUnique({
            where: { id: candidateId },
            include: { profile: true, portfolio: true }
        })

        if (!candidate || candidate.role !== "STUDENT") {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
        }

        const candidateName = candidate.profile?.name || candidate.portfolio?.fullName || "Candidate"
        const interviewDate = new Date(scheduledAt)
        const dateFormatOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        }
        // Format in the inviting company's time zone (server runs in UTC); fall back if invalid
        let formattedDate: string
        try {
            formattedDate = interviewDate.toLocaleString('en-US', {
                ...dateFormatOptions,
                timeZone: typeof timeZone === "string" && timeZone ? timeZone : "UTC"
            })
        } catch {
            formattedDate = interviewDate.toLocaleString('en-US', { ...dateFormatOptions, timeZone: "UTC" })
        }

        // Create notification for the candidate (interview invitation)
        const notification = await prisma.notification.create({
            data: {
                userId: candidateId,
                type: "INTERVIEW_SCHEDULED",
                title: `Interview invitation from ${company.name}`,
                message: `You've been invited for a ${duration}-minute ${type} interview for "${positionTitle || "a position"}" on ${formattedDate}.${typeof location === "string" && location.trim() ? ` Location: ${location.trim()}.` : ''} ${notes ? `Notes: ${notes}` : ''}`.trim(),
                link: "/dashboard/student/interviews"
            }
        })

        return NextResponse.json({ 
            success: true, 
            notificationId: notification.id,
            message: `Interview invitation notification sent to ${candidateName}.`,
            details: {
                candidate: candidateName,
                date: formattedDate,
                duration,
                type,
                position: positionTitle
            }
        })

    } catch (error) {
        console.error("Error sending interview invitation:", error)
        return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 })
    }
}
