// app/api/role/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"

// ------------------- GET role -------------------
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: {
                id: true,
                role: true,
                // Add other fields you need
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ------------------- SET role -------------------
export async function POST(req: Request) {
    const { role } = await req.json()
    const validRoles = ["STUDENT", "COMPANY"]

    if (!validRoles.includes(role?.toUpperCase())) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const user = await currentUser()
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = user.primaryEmailAddress?.emailAddress
    if (!email) {
        return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const finalRole = role.toUpperCase()

    // 1) Update Clerk metadata
    await clerkClient.users.updateUserMetadata(user.id, {
        publicMetadata: { role: finalRole },
    })

    // 2) Sync with Prisma DB
    const existingUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
    })

    if (existingUser) {
        const updated = await prisma.user.update({
            where: { clerkId: user.id },
            data: { role: finalRole },
        })
        return NextResponse.json(updated)
    }

    const newUser = await prisma.user.create({
        data: {
            clerkId: user.id,
            email,
            role: finalRole,
            profile: { create: { name: "", bio: "" } },
        },
    })

    return NextResponse.json(newUser)
}
