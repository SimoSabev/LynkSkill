import { NextResponse } from "next/server"
import { runStudentMatchmaker, runCompanyMatchmaker } from "@/lib/ai/ai-matchmaker"

export const maxDuration = 300 // Set max duration for Vercel Hobby max to 5 mins

export async function GET(req: Request) {
    // Basic security for the cron job pattern
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        console.log("[CRON] Starting AI Matchmaker...")
        
        // Run both matchmaking jobs sequentially
        const studentNotifications = await runStudentMatchmaker()
        const companyNotifications = await runCompanyMatchmaker()
        
        console.log(`[CRON] Matchmaker finished. Created ${studentNotifications} student notifications and ${companyNotifications} company notifications.`)
        
        return NextResponse.json({
            success: true,
            studentMatchNotifications: studentNotifications,
            companyMatchNotifications: companyNotifications,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error("[CRON] Matchmaker failed:", error)
        return NextResponse.json({ error: "Matchmaker failed", details: String(error) }, { status: 500 })
    }
}
