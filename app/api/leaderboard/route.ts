import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 1️⃣ Fetch all students from Prisma
        const students = await prisma.user.findMany({
            where: { role: "STUDENT" },
            include: {
                experiences: {
                    where: { status: "approved" },
                },
            },
        });

        // 2️⃣ Get Clerk client instance (✅ new syntax)
        const clerk = await clerkClient();

        // 3️⃣ Fetch all Clerk users (✅)
        const clerkUsers = await clerk.users.getUserList();

        // 4️⃣ Combine Clerk + Prisma data
        const leaderboard = students.map((student) => {
            const clerkUser = clerkUsers.data.find((u) => u.id === student.clerkId);

            const approved = student.experiences;
            const totalPoints = approved.length * 20;
            const avgGrade =
                approved.length > 0
                    ? approved.reduce((sum, e) => sum + (e.grade || 0), 0) / approved.length
                    : 0;
            const uniqueCompanies = new Set(approved.map((e) => e.companyId)).size;
            const allRound = totalPoints + avgGrade * 10 + uniqueCompanies * 5;

            return {
                id: student.id,
                name:
                    clerkUser?.firstName && clerkUser?.lastName
                        ? `${clerkUser.firstName} ${clerkUser.lastName}`
                        : "Unnamed",
                email: clerkUser?.emailAddresses?.[0]?.emailAddress || student.email,
                imageUrl: clerkUser?.imageUrl || "/default-avatar.png",
                totalPoints,
                avgGrade: Math.round(avgGrade * 10) / 10,
                uniqueCompanies,
                allRound,
            };
        });

        // 5️⃣ Sort leaderboard
        leaderboard.sort((a, b) => b.allRound - a.allRound);

        return NextResponse.json(leaderboard);
    } catch (err) {
        console.error("Leaderboard error:", err);
        return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
    }
}
