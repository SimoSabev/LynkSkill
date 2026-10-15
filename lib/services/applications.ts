// lib/services/applications.ts
// Side effects every new application needs, whichever path created it
// (POST /api/applications, the Linky agent, the auto-apply cron).
import { prisma } from "@/lib/prisma"
import { notifyNewAssignment } from "@/lib/notifications"

/**
 * Creates the internship's test assignment for the student (if the internship has one)
 * and notifies them. Without it the student never sees the task, and the expired-
 * application cleanup would later delete the application for having no submission.
 */
export async function createTestAssignmentForApplication(internshipId: string, studentId: string): Promise<void> {
    const internship = await prisma.internship.findUnique({
        where: { id: internshipId },
        select: {
            testAssignmentTitle: true,
            testAssignmentDescription: true,
            testAssignmentDueDate: true,
            company: { select: { name: true } },
        },
    })
    if (!internship?.testAssignmentTitle || !internship.testAssignmentDescription || !internship.testAssignmentDueDate) {
        return
    }

    const existing = await prisma.assignment.findFirst({
        where: { internshipId, studentId },
        select: { id: true },
    })
    if (existing) return

    await prisma.assignment.create({
        data: {
            internshipId,
            studentId,
            title: internship.testAssignmentTitle,
            description: internship.testAssignmentDescription,
            dueDate: internship.testAssignmentDueDate,
        },
    })

    await notifyNewAssignment(
        studentId,
        internship.testAssignmentTitle,
        internship.company.name,
        internship.testAssignmentDueDate
    )
}
