// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const { userId, email, role } = await req.json();

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (existingUser) return NextResponse.json(existingUser);

    const user = await prisma.user.create({
        data: {
            clerkId: userId,
            email,
            role,
            profile: { create: { name: '', bio: '' } }, // optional: create empty profile
        },
    });

    return NextResponse.json(user);
}