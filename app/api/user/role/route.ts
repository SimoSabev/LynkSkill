import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json({ role: null }, { status: 200 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true }
        })

        if (!user) {
            return NextResponse.json({ role: null }, { status: 200 })
        }

        return NextResponse.json({ role: user.role })
    } catch (error) {
        console.error("Error fetching user role:", error)
        return NextResponse.json({ role: null }, { status: 200 })
    }
}
