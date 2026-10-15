import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/api-guards";
import { deleteExpiredApplications } from "@/lib/cleanup-utils";

// GET /api/cleanup - scheduled maintenance (run daily by a cron with CRON_SECRET).
// Public in middleware (cron has no Clerk session), so it is protected by CRON_SECRET.
export async function GET(req: Request) {
    if (!isAuthorizedCron(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await deleteExpiredApplications();
        return NextResponse.json({ message: "Cleanup completed", ...result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}
