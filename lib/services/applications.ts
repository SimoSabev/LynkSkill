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

/**
 * Approval gate: if the internship has a test assignment, the student must have
 * uploaded something first. Returns an error message, or null when approval is allowed.
 */
export async function getApprovalBlocker(internshipId: string, studentId: string): Promise<string | null> {
    const internship = await prisma.internship.findUnique({
        where: { id: internshipId },
        select: { testAssignmentTitle: true },
    })
    if (!internship?.testAssignmentTitle) return null

    const submitted = await prisma.assignment.count({
        where: { internshipId, studentId, submissions: { some: {} } },
    })
    return submitted > 0 ? null : "The student must upload the internship assignment before approval."
}

/** Creates the Project an approved application needs (experiences hang off it). Idempotent. */
export async function ensureProjectForApprovedApplication(applicationId: string): Promise<void> {
    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
            id: true,
            internshipId: true,
            studentId: true,
            project: { select: { id: true } },
            internship: { select: { title: true, description: true, companyId: true } },
        },
    })
    if (!app || app.project) return

    await prisma.project.create({
        data: {
            title: app.internship.title,
            description: app.internship.description || "",
            internshipId: app.internshipId,
            applicationId: app.id,
            studentId: app.studentId,
            companyId: app.internship.companyId,
        },
    })
}
