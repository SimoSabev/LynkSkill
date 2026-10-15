import { NextResponse } from "next/server"
import { runStudentMatchmaker, runCompanyMatchmaker } from "@/lib/ai/ai-matchmaker"
import { isAuthorizedCron } from "@/lib/api-guards"

export const maxDuration = 300 // Set max duration for Vercel Hobby max to 5 mins

export async function GET(req: Request) {
    if (!isAuthorizedCron(req)) {
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
