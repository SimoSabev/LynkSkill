// app/api/projects/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            console.error("GET /api/projects unauthorized");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projects = await prisma.project.findMany({
            include: {
                internship: { include: { company: true } },
                student: { include: { profile: true } },
                application: true,
            },
            orderBy: { createdAt: "desc" },
        });

        console.log("GET /api/projects found", projects.length);

        const mapped = projects.map((p) => ({
            id: p.id,
            internship: {
                title: p.internship?.title ?? "(no title)",
                company: { name: p.internship?.company?.name ?? "(no company)" },
            },
            student: {
                name: p.student?.profile?.name ?? p.student?.email ?? "Unknown",
                email: p.student?.email ?? "",
            },
            // status currently static — add column if you'd like persistent statuses
            status: "ONGOING",
            createdAt: p.createdAt.toISOString(),
        }));

        return NextResponse.json(mapped);
    } catch (err) {
        console.error("GET /api/projects error:", err);
        return NextResponse.json({ error: "Failed to fetch projects", details: String(err) }, { status: 500 });
    }
}
