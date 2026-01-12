// app/api/internships/route.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Prisma + Supabase pgBouncer optimisation
export const runtime = "nodejs";
export const revalidate = 300;

// ZOD schema
const internshipSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    location: z.string().min(2),
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

// ------------------- CREATE -------------------
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, companies: true }
    });

    if (!user || user.role !== "COMPANY")
        return new NextResponse("Forbidden", { status: 403 });

    const company = user.companies[0];
    if (!company) return new NextResponse("Company not found", { status: 404 });

    const body = await req.json();
    const parsed = internshipSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
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

// ------------------- READ -------------------
export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, companies: true }
    });

    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const internshipId = searchParams.get("id");

    // ------------------- SINGLE INTERNSHIP -------------------
    if (internshipId) {
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            select: {
                id: true,
                title: true,
                description: true,
                location: true,
                paid: true,
                salary: true,
                qualifications: true,
                applicationStart: true,
                applicationEnd: true,
                startDate: true,
                endDate: true,
                companyId: true,
                company: { select: { id: true, name: true, location: true, logo: true } },
                applications: {
                    select: {
                        id: true,
                        status: true,
                        studentId: true,
                        student: {
                            select: {
                                email: true,
                                profile: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!internship) return new NextResponse("Not found", { status: 404 });

        // Company → full info
        if (user.role === "COMPANY") {
            const company = user.companies[0];
            if (!company || internship.companyId !== company.id)
                return new NextResponse("Forbidden", { status: 403 });

            return NextResponse.json(internship);
        }

        // Student → only their own application
        return NextResponse.json({
            ...internship,
            applications: internship.applications.filter(
                (a) => a.studentId === user.id
            ),
        });
    }

    // ------------------- MULTIPLE INTERNSHIPS -------------------

    if (user.role === "COMPANY") {
        const companyId = user.companies[0]?.id;

        const internships = await prisma.internship.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                location: true,
                paid: true,
                salary: true,
                applicationStart: true,
                applicationEnd: true,
                company: { select: { name: true, logo: true } },
                applications: {
                    select: {
                        id: true,
                        status: true,
                        studentId: true,
                        student: {
                            select: {
                                email: true,
                                profile: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(internships);
    }

    // STUDENT → gets very light data (FASTER!)
    const internships = await prisma.internship.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            location: true,
            paid: true,
            salary: true,
            applicationStart: true,
            applicationEnd: true,
            company: { select: { name: true, logo: true } }
        }
    });

    return NextResponse.json(internships);
}
