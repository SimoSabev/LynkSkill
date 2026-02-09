import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Permission } from "@prisma/client";
import { getUserCompanyByClerkId, checkPermission } from "@/lib/permissions";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await context.params;

        const internship = await prisma.internship.findUnique({
            where: { id },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                    },
                },
            },
        });

        if (!internship) {
            return NextResponse.json({ error: "Internship not found" }, { status: 404 });
        }

        // For company/team-member users, verify they belong to the internship's company
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { role: true },
        });

        if (user?.role === "COMPANY" || user?.role === "TEAM_MEMBER") {
            const membership = await getUserCompanyByClerkId(clerkId);
            if (!membership || internship.companyId !== membership.companyId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json(internship, { status: 200 });
    } catch (error) {
        console.error("Error fetching internship:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// ------------------- UPDATE -------------------
export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await context.params;

        // Verify ownership via company membership
        const membership = await getUserCompanyByClerkId(clerkId);
        if (!membership) {
            return new NextResponse("Company not found", { status: 404 });
        }

        // Check permission
        const hasPermission = await checkPermission(
            membership.userId,
            membership.companyId,
            Permission.CREATE_INTERNSHIPS
        );
        if (!hasPermission) {
            return new NextResponse("You don't have permission to edit internships", { status: 403 });
        }

        // Verify internship belongs to the company
        const existing = await prisma.internship.findFirst({
            where: { id, companyId: membership.companyId },
        });
        if (!existing) {
            return NextResponse.json({ message: "Internship not found or not yours" }, { status: 404 });
        }

        const body = await req.json();

        // Build update data – only include fields that were sent
        const updateData: Record<string, unknown> = {};
        
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.location !== undefined) updateData.location = body.location;
        if (body.latitude !== undefined) updateData.latitude = body.latitude;
        if (body.longitude !== undefined) updateData.longitude = body.longitude;
        if (body.qualifications !== undefined) updateData.qualifications = body.qualifications;
        if (body.paid !== undefined) updateData.paid = body.paid;
        if (body.salary !== undefined) updateData.salary = body.salary;
        if (body.duration !== undefined) updateData.duration = body.duration;
        if (body.skills !== undefined) updateData.skills = body.skills;
        if (body.requiresCoverLetter !== undefined) updateData.requiresCoverLetter = body.requiresCoverLetter;
        if (body.applicationStart !== undefined) {
            updateData.applicationStart = body.applicationStart ? new Date(body.applicationStart) : null;
        }
        if (body.applicationEnd !== undefined) {
            updateData.applicationEnd = body.applicationEnd ? new Date(body.applicationEnd) : null;
        }
        if (body.testAssignmentTitle !== undefined) updateData.testAssignmentTitle = body.testAssignmentTitle;
        if (body.testAssignmentDescription !== undefined) updateData.testAssignmentDescription = body.testAssignmentDescription;
        if (body.testAssignmentDueDate !== undefined) {
            updateData.testAssignmentDueDate = body.testAssignmentDueDate ? new Date(body.testAssignmentDueDate) : null;
        }

        const internship = await prisma.internship.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(internship);
    } catch (error) {
        console.error("Error updating internship:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
