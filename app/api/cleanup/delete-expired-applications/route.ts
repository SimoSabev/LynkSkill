// app/api/cleanup/delete-expired-applications/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const now = new Date();

        // Find internships whose test assignment has expired
        const expiredInternships = await prisma.internship.findMany({
            where: {
                testAssignmentDueDate: {
                    lt: now, // earlier than current date
                },
            },
            select: { id: true },
        });

        if (expiredInternships.length === 0) {
            return NextResponse.json({ message: "No expired assignments found." });
        }

        // Delete all applications for those expired internships
        const deleted = await prisma.application.deleteMany({
            where: {
                internshipId: { in: expiredInternships.map((i) => i.id) },
            },
        });

        return NextResponse.json({
            message: `Deleted ${deleted.count} expired applications.`,
        });
    } catch (error) {
        console.error("Error deleting expired applications:", error);
        return NextResponse.json(
            { error: "Failed to delete expired applications" },
            { status: 500 }
        );
    }
}
