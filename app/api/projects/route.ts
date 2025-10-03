// app/api/projects/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get("companyId");

        const projects = await prisma.project.findMany({
            where: companyId ? { companyId } : {},
            include: {
                internship: { include: { company: true } },
                student: { include: { profile: true } },
                application: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const mapped = projects.map((p) => ({
            id: p.id,
            name: p.internship?.title ?? "(no title)",
            companyId: p.internship?.company?.id ?? "",
            internship: {
                title: p.internship?.title ?? "(no title)",
                company: { name: p.internship?.company?.name ?? "(no company)" },
                startDate: p.internship?.applicationStart?.toISOString() ?? null,
                endDate: p.internship?.applicationEnd?.toISOString() ?? null,
            },
            student: {
                name: p.student?.profile?.name ?? p.student?.email ?? "Unknown",
                email: p.student?.email ?? "",
            },
            status: "ONGOING",
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        }));


        return NextResponse.json(mapped);
    } catch (err) {
        console.error("GET /api/projects error:", err);
        return NextResponse.json(
            { error: "Failed to fetch projects", details: String(err) },
            { status: 500 }
        );
    }
}
