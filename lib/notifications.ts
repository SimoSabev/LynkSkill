// lib/notifications.ts
import { prisma } from "@/lib/prisma"
import type { NotificationType, Prisma } from "@prisma/client"

interface CreateNotificationParams {
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
    metadata?: Prisma.InputJsonValue
}

/**
 * Creates a notification for a user
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    link,
    metadata
}: CreateNotificationParams) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
                metadata,
            }
        })
        return notification
    } catch (error) {
        console.error("Failed to create notification:", error)
        return null
    }
}

/**
 * Creates notification when application status changes
 */
export async function notifyApplicationStatusChange(
    studentId: string,
    internshipTitle: string,
    companyName: string,
    status: "APPROVED" | "REJECTED",
    applicationId?: string,
    companyId?: string
) {
    const isApproved = status === "APPROVED"
    
    return createNotification({
        userId: studentId,
        type: isApproved ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED",
        title: isApproved ? "Application Approved! 🎉" : "Application Update",
        message: isApproved 
            ? `Congratulations! Your application for "${internshipTitle}" at ${companyName} has been approved. Click to accept the offer!`
            : `Your application for "${internshipTitle}" at ${companyName} was not selected. Keep applying!`,
        link: "/dashboard/student/internships/applied",
        metadata: {
            applicationId,
            internshipTitle,
            companyName,
            companyId,
            status
        }
    })
}

/**
 * Creates notification when a new application is received (for company)
 */
export async function notifyNewApplication(
    companyOwnerId: string,
    studentName: string,
    internshipTitle: string
) {
    return createNotification({
        userId: companyOwnerId,
        type: "APPLICATION_SUBMITTED",
        title: "New Application Received",
        message: `${studentName} has applied for "${internshipTitle}"`,
        link: "/dashboard/company/applications"
    })
}

/**
 * Creates notification when a new assignment is created
 */
export async function notifyNewAssignment(
    studentId: string,
    assignmentTitle: string,
    companyName: string,
    dueDate: Date
) {
    const formattedDate = dueDate.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
    })
    
    return createNotification({
        userId: studentId,
        type: "NEW_ASSIGNMENT",
        title: "New Assignment",
        message: `${companyName} has assigned you "${assignmentTitle}". Due: ${formattedDate}`,
        link: "/dashboard/student/experience"
    })
}

/**
 * Creates notification when assignment is submitted (for company)
 */
export async function notifyAssignmentSubmitted(
    companyOwnerId: string,
    studentName: string,
    assignmentTitle: string
) {
    return createNotification({
        userId: companyOwnerId,
        type: "ASSIGNMENT_SUBMITTED",
        title: "Assignment Submitted",
        message: `${studentName} has submitted "${assignmentTitle}"`,
        link: "/dashboard/company/experience"
    })
}

/**
 * Creates notification when experience is graded
 */
export async function notifyExperienceGraded(
    studentId: string,
    companyName: string,
    grade: number
) {
    return createNotification({
        userId: studentId,
        type: "EXPERIENCE_GRADED",
        title: "Experience Graded",
        message: `${companyName} has graded your experience: ${grade}/10`,
        link: "/dashboard/student/experience"
    })
}

/**
 * Creates notification for internship deadline approaching
 */
export async function notifyInternshipDeadline(
    studentId: string,
    internshipTitle: string,
    companyName: string,
    daysRemaining: number
) {
    return createNotification({
        userId: studentId,
        type: "INTERNSHIP_DEADLINE",
        title: "Application Deadline Approaching",
        message: `Only ${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left to apply for "${internshipTitle}" at ${companyName}`,
        link: "/dashboard/student/internships"
    })
}
/**
 * Creates notification when a user is invited to join a company team
 */
export async function notifyTeamInvitation(
    userId: string,
    companyName: string,
    role: string,
    token: string
) {
    const roleDisplayName = getRoleDisplayName(role)
    return createNotification({
        userId,
        type: "TEAM_INVITATION",
        title: "Company Team Invitation",
        message: `You've been invited to join ${companyName} as ${roleDisplayName}`,
        link: `/invitations?token=${token}`
    })
}

/**
 * Creates notification when a team invitation is accepted
 */
export async function notifyTeamInvitationAccepted(
    inviterId: string,
    memberName: string
) {
    return createNotification({
        userId: inviterId,
        type: "TEAM_INVITATION_ACCEPTED",
        title: "Invitation Accepted",
        message: `${memberName} has joined your team`,
        link: "/dashboard/company/team"
    })
}

/**
 * Creates notification when a cover letter is reviewed by company
 */
export async function notifyCoverLetterReviewed(
    studentId: string,
    internshipTitle: string,
    companyName: string,
    applicationId: string
) {
    return createNotification({
        userId: studentId,
        type: "COVER_LETTER_REVIEWED",
        title: "Cover Letter Reviewed",
        message: `Your cover letter for "${internshipTitle}" at ${companyName} has been reviewed`,
        link: "/dashboard/student/internships/applied",
        metadata: {
            applicationId,
            internshipTitle,
            companyName
        }
    })
}

/**
 * Creates notification reminding student to add cover letter
 */
export async function notifyCoverLetterReminder(
    studentId: string,
    internshipTitle: string,
    companyName: string,
    daysRemaining: number
) {
    return createNotification({
        userId: studentId,
        type: "COVER_LETTER_REMINDER",
        title: "Cover Letter Reminder",
        message: `Don't forget to add a cover letter for "${internshipTitle}" at ${companyName}. ${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining before the deadline.`,
        link: "/dashboard/student/internships/applied"
    })
}

/**
 * Creates notification when an internship is about to expire (for company users)
 */
export async function notifyInternshipExpiringSoon(
    userId: string,
    internshipTitle: string,
    companyName: string,
    daysRemaining: number,
    internshipId: string
) {
    return createNotification({
        userId,
        type: "INTERNSHIP_EXPIRING_SOON",
        title: "Internship Expiring Soon ⚠️",
        message: `Your internship "${internshipTitle}" at ${companyName} will expire in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}. Renew it to keep it active.`,
        link: "/dashboard/company/internships",
        metadata: {
            internshipId,
            internshipTitle,
            companyName,
            daysRemaining
        }
    })
}

/**
 * Creates notification when an internship has expired and been auto-deleted
 */
export async function notifyInternshipExpired(
    userId: string,
    internshipTitle: string,
    companyName: string,
    internshipId?: string
) {
    return createNotification({
        userId,
        type: "INTERNSHIP_EXPIRED",
        title: "Internship Expired & Removed",
        message: `Your internship "${internshipTitle}" at ${companyName} has expired and been automatically removed.`,
        link: "/dashboard/company/internships",
        metadata: {
            internshipId,
            internshipTitle,
            companyName
        }
    })
}

/**
 * Creates notification when an internship is successfully renewed
 */
export async function notifyInternshipRenewed(
    userId: string,
    internshipTitle: string,
    companyName: string,
    newEndDate: Date,
    internshipId: string
) {
    const formattedDate = newEndDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    })
    return createNotification({
        userId,
        type: "INTERNSHIP_RENEWED",
        title: "Internship Renewed ✅",
        message: `Your internship "${internshipTitle}" at ${companyName} has been renewed until ${formattedDate}.`,
        link: "/dashboard/company/internships",
        metadata: {
            internshipId,
            internshipTitle,
            companyName,
            newEndDate: newEndDate.toISOString()
        }
    })
}

/**
 * Gets the human-readable role display name
 */
function getRoleDisplayName(role: string): string {
    const roleMap: Record<string, string> = {
        OWNER: "Owner",
        ADMIN: "Administrator",
        HR_MANAGER: "HR Manager",
        HR_RECRUITER: "HR Recruiter",
        VIEWER: "Viewer",
    }
    return roleMap[role] || role
}