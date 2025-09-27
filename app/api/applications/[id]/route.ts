import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = params
        const body = await req.json()
        const { status } = body

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status },
        })

        return NextResponse.json(updatedApplication)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 })
    }
}
