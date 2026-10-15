import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/api-guards";

export async function DELETE(req: Request) {
    try {
        const guard = await requireDbUser("COMPANY");
        if (!guard.ok) return guard.response;
        const { user } = guard;

        // Get ID from URL query instead of req.json()
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Missing internship ID" },
                { status: 400 }
            );
        }

        const internship = await prisma.internship.findUnique({
            where: { id },
            select: { companyId: true },
        });

        if (!internship) {
            return NextResponse.json({ error: "Internship not found" }, { status: 404 });
        }

        if (!user.companies.some((c) => c.id === internship.companyId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if internship has applications
        const linkedApplications = await prisma.application.count({
            where: { internshipId: id },
        });

        if (linkedApplications > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete internship because students have already applied."
                },
                { status: 400 }
            );
        }

        // Delete internship
        await prisma.internship.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Internship deleted successfully" });

    } catch (err) {
        console.error("Delete internship error:", err);
        return NextResponse.json(
            { error: "Failed to delete internship" },
            { status: 500 }
        );
    }
}
