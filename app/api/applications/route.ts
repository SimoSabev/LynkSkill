import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifyNewApplication, notifyNewAssignment } from "@/lib/notifications";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const student = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!student || student.role !== "STUDENT") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const { internshipId, coverLetter, coverLetterGeneratedByAI } = await req.json();
    if (!internshipId) {
        return NextResponse.json(
            { error: "Internship ID required" },
            { status: 400 }
        );
    }

    // 🔎 Check if already applied
    const existing = await prisma.application.findUnique({
        where: {
            internshipId_studentId: {
                internshipId,
                studentId: student.id,
            },
        },
    });

    if (existing) {
        return NextResponse.json(
            { error: "You have already applied to this internship" },
            { status: 400 }
        );
    }

    // Check if cover letter is required
    const internshipCheck = await prisma.internship.findUnique({
        where: { id: internshipId },
        select: { requiresCoverLetter: true }
    });

    if (internshipCheck?.requiresCoverLetter && !coverLetter?.trim()) {
        return NextResponse.json(
            { error: "A cover letter is required for this internship" },
            { status: 400 }
        );
    }

    // ✅ Create the application
    const application = await prisma.application.create({
        data: {
            studentId: student.id,
            internshipId,
            ...(coverLetter?.trim() ? {
                coverLetter: coverLetter.trim(),
                coverLetterStatus: "SUBMITTED",
                coverLetterGeneratedByAI: Boolean(coverLetterGeneratedByAI),
            } : {}),
        },
        include: {
            internship: {
                include: {
                    company: {
                        select: { ownerId: true, name: true }
                    }
                }
            },
        },
    });

    const internship = application.internship;

    // 📧 Notify company about new application
    const studentProfile = await prisma.profile.findUnique({
        where: { userId: student.id },
        select: { name: true }
    });
    
    await notifyNewApplication(
        internship.company.ownerId,
        studentProfile?.name || student.email,
        internship.title
    );

    // ------------------------------------------------------------
    // ✔ ONLY CREATE ASSIGNMENT IF INTERNSHIP HAS A TEST ASSIGNMENT
    // ------------------------------------------------------------
    const hasTest =
        internship.testAssignmentTitle &&
        internship.testAssignmentDescription &&
        internship.testAssignmentDueDate;

    if (hasTest) {
        try {
            await prisma.assignment.create({
                data: {
                    internshipId: application.internshipId,
                    studentId: application.studentId,
                    title: internship.testAssignmentTitle!,
                    description: internship.testAssignmentDescription!,
                    dueDate: internship.testAssignmentDueDate!,
                },
            });
            
            // 📧 Notify student about new assignment
            await notifyNewAssignment(
                application.studentId,
                internship.testAssignmentTitle!,
                internship.company.name,
                internship.testAssignmentDueDate!
            );
        } catch (err) {
            console.error("Failed to create test assignment:", err);
        }
    }

    return NextResponse.json(application);
}
