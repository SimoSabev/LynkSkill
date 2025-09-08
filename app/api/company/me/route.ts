import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const { userId } = await auth()
    if (!userId) return new Response("Unauthorized", { status: 401 })

    const company = await prisma.company.findFirst({
        where: { owner: { clerkId: userId } },
        select: { id: true, name: true, logo: true },
    })

    if (!company) {
        return Response.json({ error: "Company not found" }, { status: 404 })
    }

    return Response.json(company)
}
