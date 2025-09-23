// app/api/applications/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
        const { userId } = await auth();
        if (!userId) {
            console.error("PATCH: unauthenticated");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const companyUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!companyUser) {
            console.error("PATCH: company user not found for clerkId", userId);
            return NextResponse.json({ error: "Company user not found" }, { status: 404 });
        }

        const body = await req.json();
        const status = body?.status;
        if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
            console.error("PATCH: invalid status", status);
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Fetch application + relations (so we have internship & student info)
        const existingApp = await prisma.application.findUnique({
            where: { id },
            include: { internship: true, student: true },
        });

        if (!existingApp) {
            console.error("PATCH: application not found", id);
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // verify company ownership of the internship (optional but recommended)
        const internship = existingApp.internship;
        const company = await prisma.company.findUnique({ where: { id: internship.companyId } });
        if (!company) {
            console.error("PATCH: internship has no company", internship.id);
            return NextResponse.json({ error: "Company for internship not found" }, { status: 404 });
        }
        if (company.ownerId !== companyUser.id) {
            console.error("PATCH: forbidden: user does not own company", { companyId: company.id, userId: companyUser.id });
            return NextResponse.json({ error: "Forbidden: you don't manage this company" }, { status: 403 });
        }

        // Update application status
        const application = await prisma.application.update({
            where: { id },
            data: { status },
            include: { internship: true, student: true },
        });

        let project = null;

        if (status === "APPROVED") {
            // ensure a single project per application via upsert (unique on applicationId)
            try {
                project = await prisma.project.upsert({
                    where: { applicationId: application.id },
                    update: {}, // nothing to change if exists
                    create: {
                        title: application.internship.title ?? `Project for ${application.id}`,
                        description: application.internship.description ?? "",
                        internshipId: application.internshipId,
                        applicationId: application.id,
                        studentId: application.studentId,
                        companyId: application.internship.companyId,
                    },
                });
                console.log("PATCH: project created-or-exists:", project.id);
            } catch (err) {
                console.error("PATCH: failed to create project", err);
                // return application update success but also indicate project creation failure
                return NextResponse.json({ application, project: null, error: "Project creation failed", details: String(err) }, { status: 500 });
            }
        }

        return NextResponse.json({ application, project });
    } catch (err) {
        console.error("PATCH /api/applications/[id] error:", err);
        return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
    }
}
