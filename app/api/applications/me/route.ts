import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

await prisma.application.deleteMany({
    where: {
        internship: {
            testAssignmentDueDate: { lt: new Date() },
        },
    },
});


export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const student = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

        const applications = await prisma.application.findMany({
            where: { studentId: student.id },
            include: { internship: { include: { company: true } } },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(applications);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
}
