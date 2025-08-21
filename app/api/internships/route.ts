import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs"; // ако ползваш Clerk

// Създаване на нов Internship
export async function POST(req: Request) {
    try {
        const { userId } = auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, description, qualifications, location, paid, salary } = body;

        // Взимаме company user
        const company = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!company || company.role !== "COMPANY") {
            return NextResponse.json({ error: "Only companies can post internships" }, { status: 403 });
        }

        const internship = await prisma.internship.create({
            data: {
                companyId: company.id,
                title,
                description,
                qualifications,
                location,
                paid,
                salary: paid ? salary : null,
            },
        });

        return NextResponse.json(internship, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// Взимане на всички стажове (за ученици)
export async function GET() {
    try {
        const internships = await prisma.internship.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(internships);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
