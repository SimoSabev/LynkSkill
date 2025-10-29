import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const expiredApplications = await prisma.application.findMany({
            where: { internship: { testAssignmentDueDate: { lt: new Date() } } },
        });

        for (const app of expiredApplications) {
            await prisma.experience.deleteMany({
                where: { project: { applicationId: app.id } },
            });
            await prisma.project.deleteMany({
                where: { applicationId: app.id },
            });
            await prisma.application.delete({
                where: { id: app.id },
            });
        }

        return NextResponse.json({ message: "Cleanup completed" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}
