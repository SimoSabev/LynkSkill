// app/api/internships/route.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// ------------------- ZOD SCHEMA -------------------
const internshipSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    location: z.string().min(2, "Location must be at least 2 characters"),
    qualifications: z.string().optional().nullable(),
    paid: z.boolean(),
    salary: z.union([z.number().positive(), z.null()]),
    testAssignmentTitle: z.string().optional().nullable(),
    testAssignmentDescription: z.string().optional().nullable(),
    testAssignmentDueDate: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val ? new Date(val) : null)),
}).superRefine((data, ctx) => {
    if (data.paid && data.salary == null) {
        ctx.addIssue({
            code: "custom",
            path: ["salary"],
            message: "Salary is required if internship is paid",
        });
    }
});

// ------------------- CREATE internship -------------------
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { companies: true },
    });
    if (!user || user.role !== "COMPANY") return new NextResponse("Forbidden", { status: 403 });

    const company = user.companies[0];
    if (!company) return new NextResponse("Company not found", { status: 404 });

    const body = await req.json();
    const parsed = internshipSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    const internship = await prisma.internship.create({
        data: {
            title: data.title,
            description: data.description,
            location: data.location,
            qualifications: data.qualifications,
            paid: data.paid,
            salary: data.paid ? data.salary : null,
            companyId: company.id,
            applicationStart: new Date(body.applicationStart),
            applicationEnd: new Date(body.applicationEnd),
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
            testAssignmentTitle: data.testAssignmentTitle ?? null,
            testAssignmentDescription: data.testAssignmentDescription ?? null,
            testAssignmentDueDate: data.testAssignmentDueDate,
        },
    });

    return NextResponse.json(internship);
}

// ------------------- READ internships -------------------
export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { companies: true },
    });
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    // Check if requesting a specific internship
    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("id");

    if (internshipId) {
        // Fetch single internship with authorization
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            include: {
                company: true,
                applications: {
                    include: {
                        student: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            },
        });

        if (!internship) {
            return new NextResponse("Internship not found", { status: 404 });
        }

        // Authorization check
        if (user.role === "COMPANY") {
            // Company can only see their own internships
            const company = user.companies[0];
            if (!company || internship.companyId !== company.id) {
                return new NextResponse("Forbidden", { status: 403 });
            }
            // Return full details including applications for company
            return NextResponse.json(internship);
        } else {
            // Students can see any internship but without sensitive company data
            // Remove sensitive application data that doesn't belong to this student
            const sanitizedInternship = {
                ...internship,
                applications: internship.applications.filter(
                    (app) => app.studentId === user.id
                ),
            };
            return NextResponse.json(sanitizedInternship);
        }
    }

    // Fetch all internships based on role
    const internships =
        user.role === "COMPANY"
            ? await prisma.internship.findMany({
                where: { companyId: user.companies[0]?.id },
                orderBy: { createdAt: "desc" },
                include: {
                    company: true,
                    applications: {
                        include: {
                            student: {
                                include: {
                                    profile: true
                                }
                            }
                        }
                    }
                },
            })
            : await prisma.internship.findMany({
                orderBy: { createdAt: "desc" },
                include: { company: true },
            });

    return NextResponse.json(internships);
}

// ------------------- UPDATE internship -------------------
export async function PUT(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { companies: true },
    });
    if (!user || user.role !== "COMPANY") return new NextResponse("Forbidden", { status: 403 });

    const company = user.companies[0];
    if (!company) return new NextResponse("Company not found", { status: 404 });

    const body = await req.json();
    const parsed = internshipSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    if (!body.id) return new NextResponse("Internship ID required", { status: 400 });

    const existing = await prisma.internship.findUnique({ where: { id: body.id } });
    if (!existing || existing.companyId !== company.id) {
        return new NextResponse("Not found or unauthorized", { status: 404 });
    }

    const updated = await prisma.internship.update({
        where: { id: body.id },
        data: {
            title: data.title,
            description: data.description,
            location: data.location,
            qualifications: data.qualifications ?? null,
            paid: data.paid,
            salary: data.paid ? data.salary : null,
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
            testAssignmentTitle: data.testAssignmentTitle ?? null,
            testAssignmentDescription: data.testAssignmentDescription ?? null,
            testAssignmentDueDate: data.testAssignmentDueDate,
        },
    });

    return NextResponse.json(updated);
}

// ------------------- DELETE internship -------------------
export async function DELETE(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { companies: true },
    });
    if (!user || user.role !== "COMPANY") return new NextResponse("Forbidden", { status: 403 });

    const company = user.companies[0];
    if (!company) return new NextResponse("Company not found", { status: 404 });

    const { id } = await req.json();
    if (!id) return new NextResponse("Internship ID required", { status: 400 });

    const existing = await prisma.internship.findUnique({ where: { id } });
    if (!existing || existing.companyId !== company.id) {
        return new NextResponse("Not found or unauthorized", { status: 404 });
    }

    await prisma.internship.delete({ where: { id } });

    return NextResponse.json({ success: true });
}