// lib/cleanup-utils.ts
import { prisma } from "@/lib/prisma"

/**
 * Result summary for the cleanup operation
 */
interface CleanupResult {
    totalFound: number
    successCount: number
    failureCount: number
    errors: Array<{ applicationId: string; error: string }>
}

/**
 * Deletes applications whose test assignment deadline passed without a submission.
 *
 * Only PENDING applications are eligible. Approved/rejected applications are
 * history (projects, experiences, reviews, conversations hang off them) and
 * must never be removed just because the test due date is in the past.
 *
 * Each application is removed in a transaction, in FK dependency order:
 * 1. the student's (empty) test Assignments for that internship
 * 2. Experience records referencing the application's Project
 * 3. the Application (Project/Interview/Conversation/Review cascade)
 *
 * @returns Promise<CleanupResult> Summary of the cleanup operation
 */
export async function deleteExpiredApplications(): Promise<CleanupResult> {
    const result: CleanupResult = {
        totalFound: 0,
        successCount: 0,
        failureCount: 0,
        errors: []
    }

    const candidates = await prisma.application.findMany({
        where: {
            status: "PENDING",
            internship: {
                testAssignmentDueDate: { lt: new Date() }
            }
        },
        select: { id: true, internshipId: true, studentId: true }
    })

    // Keep applications where the student did upload something
    const submitted = candidates.length
        ? await prisma.assignment.findMany({
            where: {
                internshipId: { in: candidates.map((a) => a.internshipId) },
                studentId: { in: candidates.map((a) => a.studentId) },
                submissions: { some: {} }
            },
            select: { internshipId: true, studentId: true }
        })
        : []
    const submittedPairs = new Set(submitted.map((s) => `${s.internshipId}|${s.studentId}`))
    const expired = candidates.filter((a) => !submittedPairs.has(`${a.internshipId}|${a.studentId}`))

    result.totalFound = expired.length

    for (const app of expired) {
        try {
            await prisma.$transaction([
                prisma.assignment.deleteMany({
                    where: {
                        internshipId: app.internshipId,
                        studentId: app.studentId,
                        submissions: { none: {} }
                    }
                }),
                prisma.experience.deleteMany({
                    where: { project: { applicationId: app.id } }
                }),
                prisma.application.delete({
                    where: { id: app.id }
                })
            ])
            result.successCount++
        } catch (error) {
            result.failureCount++
            const errorMessage = error instanceof Error ? error.message : String(error)
            result.errors.push({ applicationId: app.id, error: errorMessage })
            console.error(`Failed to delete application ${app.id}:`, errorMessage)
        }
    }

    return result
}
