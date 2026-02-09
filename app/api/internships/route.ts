// app/api/internships/route.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { Permission } from "@prisma/client";
import { getUserCompanyByClerkId, checkPermission } from "@/lib/permissions";

// Prisma + Supabase pgBouncer optimisation
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Need dynamic for query params

// ZOD schema
const internshipSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    location: z.string().min(2, "Location must be at least 2 characters"),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    qualifications: z.string().optional().nullable(),
    paid: z.boolean(),
    salary: z.union([z.number().positive(), z.null()]).optional(),
    requiresCoverLetter: z.boolean().optional().default(false),
    applicationStart: z.string().transform((val) => new Date(val)),
    applicationEnd: z.string().transform((val) => new Date(val)),
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
    if (data.applicationStart >= data.applicationEnd) {
        ctx.addIssue({
            code: "custom",
            path: ["applicationEnd"],
            message: "End date must be after start date",
        });
    }
});

// ------------------- CREATE -------------------
export async function POST(req: Request) {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    // Get user's company membership
    const membership = await getUserCompanyByClerkId(clerkId);
    if (!membership) {
        return new NextResponse("Company not found", { status: 404 });
    }

    // Check CREATE_INTERNSHIP permission
    const hasPermission = await checkPermission(
        membership.userId,
        membership.companyId,
        Permission.CREATE_INTERNSHIPS
    );
    if (!hasPermission) {
        return new NextResponse("You don't have permission to create internships", { status: 403 });
    }

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
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            qualifications: data.qualifications ?? null,
            paid: data.paid,
            salary: data.paid ? (data.salary ?? null) : null,
            requiresCoverLetter: data.requiresCoverLetter,
            companyId: membership.companyId,
            applicationStart: data.applicationStart,
            applicationEnd: data.applicationEnd,
            testAssignmentTitle: data.testAssignmentTitle ?? null,
            testAssignmentDescription: data.testAssignmentDescription ?? null,
            testAssignmentDueDate: data.testAssignmentDueDate ?? null,
        },
    });

    return NextResponse.json(internship);
}

// ------------------- READ -------------------
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, companies: true }
    });

    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const internshipId = searchParams.get("id");
    
    // Parse filter parameters
    const search = searchParams.get("search");
    const location = searchParams.get("location");
    const paid = searchParams.get("paid");
    const minSalary = searchParams.get("minSalary");
    const maxSalary = searchParams.get("maxSalary");
    const skills = searchParams.get("skills"); // comma-separated

    // ------------------- SINGLE INTERNSHIP -------------------
    if (internshipId) {
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            select: {
                id: true,
                title: true,
                description: true,
                location: true,
                latitude: true,
                longitude: true,
                paid: true,
                salary: true,
                qualifications: true,
                requiresCoverLetter: true,
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

        // Company or TeamMember → full info (use membership-based access)
        if (user.role === "COMPANY" || user.role === "TEAM_MEMBER") {
            const membership = await getUserCompanyByClerkId(userId);
            if (!membership || internship.companyId !== membership.companyId)
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

    if (user.role === "COMPANY" || user.role === "TEAM_MEMBER") {
        const membership = await getUserCompanyByClerkId(userId);
        const companyId = membership?.companyId;

        if (!companyId) {
            return new NextResponse("Company not found", { status: 404 });
        }

        const internships = await prisma.internship.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                location: true,
                latitude: true,
                longitude: true,
                paid: true,
                salary: true,
                requiresCoverLetter: true,
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

    // STUDENT → gets very light data (FASTER!) with filtering
    const whereClause: Prisma.InternshipWhereInput = {};
    
    // Search by title or description
    if (search) {
        whereClause.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
        ];
    }
    
    // Filter by location
    if (location && location !== "all") {
        whereClause.location = { contains: location, mode: "insensitive" };
    }
    
    // Filter by paid/unpaid
    if (paid === "true") {
        whereClause.paid = true;
    } else if (paid === "false") {
        whereClause.paid = false;
    }
    
    // Filter by salary range
    if (minSalary) {
        whereClause.salary = { 
            ...whereClause.salary as Prisma.FloatNullableFilter,
            gte: parseFloat(minSalary) 
        };
    }
    if (maxSalary) {
        whereClause.salary = { 
            ...whereClause.salary as Prisma.FloatNullableFilter,
            lte: parseFloat(maxSalary) 
        };
    }
    
    // Filter by skills (stored as array in skills field)
    if (skills) {
        const skillList = skills.split(",").map(s => s.trim().toLowerCase());
        whereClause.skills = { hasSome: skillList };
    }

    const internships = await prisma.internship.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            description: true,
            location: true,
            latitude: true,
            longitude: true,
            paid: true,
            salary: true,
            skills: true,
            requiresCoverLetter: true,
            applicationStart: true,
            applicationEnd: true,
            createdAt: true,
            company: { select: { name: true, logo: true } }
        }
    });

    return NextResponse.json(internships);
}
