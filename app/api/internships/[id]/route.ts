import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params; // ✅ await the params!

        // ✅ Efficient query with minimal relations
        const internship = await prisma.internship.findUnique({
            where: { id },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        description: true,
                        website: true,
                        logo: true,
                    },
                },
            },
        });

        if (!internship) {
            return NextResponse.json({ error: "Internship not found" }, { status: 404 });
        }

        return NextResponse.json(internship, { status: 200 });
    } catch (error) {
        console.error("Error fetching internship:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
