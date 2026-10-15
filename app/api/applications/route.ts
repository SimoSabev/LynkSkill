import { NextResponse } from "next/server";
import { requireDbUser } from "@/lib/api-guards";
import { applyToInternship } from "@/lib/services/applications";

export async function POST(req: Request) {
    const guard = await requireDbUser("STUDENT");
    if (!guard.ok) return guard.response;

    const { internshipId } = await req.json().catch(() => ({}));
    if (!internshipId || typeof internshipId !== "string") {
        return NextResponse.json({ error: "Internship ID required" }, { status: 400 });
    }

    const result = await applyToInternship(guard.user.id, internshipId);
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
}
