import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // 1️⃣ Fetch paginated students from Prisma
        const students = await prisma.user.findMany({
            where: { role: "STUDENT" },
            include: {
                experiences: {
                    where: { status: "approved" },
                },
            },
            take: limit,
            skip: offset,
            orderBy: { id: "asc" },
        });

        // 2️⃣ Get Clerk client instance
        const clerk = await clerkClient();

        // 3️⃣ Fetch only needed Clerk users (batch by clerkIds)
        const clerkIds = students.map(s => s.clerkId);
        const clerkUsers = await clerk.users.getUserList({ userId: clerkIds });

        // 4️⃣ Create Map for O(1) lookup instead of O(n) find
        const clerkUserMap = new Map(clerkUsers.data.map(u => [u.id, u]));

        // 5️⃣ Combine Clerk + Prisma data with O(n) complexity
        const leaderboard = students.map((student) => {
            const clerkUser = clerkUserMap.get(student.clerkId);

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

        // 6️⃣ Sort leaderboard (after pagination for efficiency)
        leaderboard.sort((a, b) => b.allRound - a.allRound);

        return NextResponse.json(leaderboard);
    } catch (err) {
        console.error("Leaderboard error:", err);
        return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
    }
}
