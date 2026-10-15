import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic" // Uses request.url

// Calculate skill score for an experience
function calculateExperienceScore(exp: {
    skillsRating?: number | null
    impactRating?: number | null
    growthRating?: number | null
    recommendation?: string | null
    grade?: number | null
}): number {
    const skills = exp.skillsRating || 0
    const impact = exp.impactRating || 0
    const growth = exp.growthRating || 0
    
    if (skills && impact && growth) {
        // New endorsement system score
        let recommendationBonus = 0
        switch (exp.recommendation) {
            case 'highly_recommend': recommendationBonus = 15; break
            case 'recommend': recommendationBonus = 10; break
            case 'neutral': recommendationBonus = 5; break
            case 'not_recommend': recommendationBonus = 0; break
        }
        return Math.round((skills * 8) + (impact * 7) + (growth * 5) + recommendationBonus)
    } else if (exp.grade) {
        // Fallback for legacy grade system (2-6 → equivalent score)
        return (exp.grade - 1) * 15 // 2→15, 3→30, 4→45, 5→60, 6→75
    }
    return 0
}

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const viewer = await prisma.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
        // Students see each other's names/scores, not contact details
        const canSeeEmails = viewer?.role === "COMPANY";

        const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "50") || 50, 1), 100);
        const offset = Math.max(parseInt(req.nextUrl.searchParams.get("offset") || "0") || 0, 0);

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
            const totalExperiences = approved.length;
            
            // Calculate average skill score
            const avgSkillScore = approved.length > 0
                ? approved.reduce((sum, exp) => sum + calculateExperienceScore(exp), 0) / approved.length
                : 0;
            
            // Count endorsements
            const endorsementCounts = approved.reduce((acc, exp) => {
                if (exp.recommendation) {
                    acc[exp.recommendation] = (acc[exp.recommendation] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
            
            const uniqueCompanies = new Set(approved.map((e) => e.companyId)).size;
            
            // Calculate professional score
            const professionalScore = Math.round(
                (avgSkillScore * 0.6) +
                (totalExperiences * 5) +
                (uniqueCompanies * 8) +
                ((endorsementCounts['highly_recommend'] || 0) * 10) +
                ((endorsementCounts['recommend'] || 0) * 5)
            );

            // Legacy compatibility
            const avgGrade = approved.length > 0
                ? approved.reduce((sum, e) => sum + (e.grade || 0), 0) / approved.length
                : 0;

            return {
                id: student.id,
                name:
                    clerkUser?.firstName && clerkUser?.lastName
                        ? `${clerkUser.firstName} ${clerkUser.lastName}`
                        : "Unnamed",
                email: canSeeEmails ? (clerkUser?.emailAddresses?.[0]?.emailAddress || student.email) : "",
                imageUrl: clerkUser?.imageUrl || "/default-avatar.png",
                // New metrics
                totalExperiences,
                avgSkillScore: Math.round(avgSkillScore),
                uniqueCompanies,
                professionalScore,
                highlyRecommended: endorsementCounts['highly_recommend'] || 0,
                recommended: endorsementCounts['recommend'] || 0,
                // Legacy fields for backward compatibility
                totalPoints: totalExperiences * 20,
                avgGrade: Math.round(avgGrade * 10) / 10,
                allRound: professionalScore,
            };
        });

        // 6️⃣ Sort leaderboard by professional score
        leaderboard.sort((a, b) => b.professionalScore - a.professionalScore);

        return NextResponse.json(leaderboard);
    } catch (err) {
        console.error("Leaderboard error:", err);
        return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
    }
}
