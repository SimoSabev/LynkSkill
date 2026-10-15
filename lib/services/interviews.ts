// lib/services/interviews.ts
// Interview scheduling rules shared by the REST route and the AI agent.
import { z } from "zod"
import { addMonths } from "date-fns"
import { prisma } from "@/lib/prisma"

export const scheduleInterviewSchema = z.object({
    applicationId: z.string().min(1, "Application ID is required"),
    scheduledAt: z.string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .refine((val) => new Date(val) > new Date(), "Interview cannot be scheduled in the past")
        .refine((val) => new Date(val) <= addMonths(new Date(), 3), "Interview must be scheduled within the next 3 months"),
    location: z.string().max(500, "Location too long").optional(),
    notes: z.string().max(1000, "Notes too long").optional()
})

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>

/** A company schedules an interview for an application to one of its internships. */
export async function scheduleInterview(companyUserId: string, input: ScheduleInterviewInput) {
    const user = await prisma.user.findUnique({
        where: { id: companyUserId },
        select: { role: true, companies: { select: { id: true } } },
    })
    if (!user || user.role !== "COMPANY") {
        return { ok: false as const, error: "Only companies can schedule interviews", status: 403 }
    }

    const application = await prisma.application.findUnique({
        where: { id: input.applicationId },
        include: { internship: { select: { companyId: true, title: true } } },
    })
    if (!application) return { ok: false as const, error: "Application not found", status: 404 }

    if (!user.companies.some((c) => c.id === application.internship.companyId)) {
        return { ok: false as const, error: "You can only schedule interviews for your own company's applications", status: 403 }
    }

    const existing = await prisma.interview.findFirst({
        where: { applicationId: input.applicationId, status: { in: ["SCHEDULED", "CONFIRMED"] } },
    })
    if (existing) {
        return { ok: false as const, error: "An interview is already scheduled for this application", status: 400 }
    }

    const interview = await prisma.interview.create({
        data: {
            applicationId: input.applicationId,
            scheduledAt: new Date(input.scheduledAt),
            location: input.location,
            notes: input.notes,
        },
        include: {
            application: {
                include: {
                    student: { select: { id: true, profile: { select: { name: true } } } },
                    internship: { select: { title: true, company: { select: { name: true } } } },
                },
            },
        },
    })

    await prisma.notification.create({
        data: {
            userId: application.studentId,
            type: "INTERVIEW_SCHEDULED",
            title: "Interview Scheduled",
            message: `An interview for "${application.internship.title}" has been scheduled`,
            link: `/dashboard/student/interviews`,
        },
    })

    return { ok: true as const, data: interview }
}
