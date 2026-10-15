export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { Permission } from "@prisma/client";
import { checkPermission, getUserCompanyByClerkId } from "@/lib/permissions";
import { UPLOAD_RULES, safeStorageName, validateUpload } from "@/lib/upload-utils";

// ✅ Ensure this is a route handler, not a Server Action
export async function POST(req: Request) {
    // Apply rate limiting
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`upload-logo:${clientIp}`, RATE_LIMITS.sensitive);
    
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: "Too many upload requests. Please try again later." },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: rateLimitHeaders(rateLimit) });

        // Check membership and EDIT_COMPANY permission.
        // During onboarding the company does not exist yet: the logo is uploaded first and
        // its URL is passed to completeOnboarding, which only accepts URLs under this
        // user's own "company/<clerkId>/" prefix.
        const membership = await getUserCompanyByClerkId(clerkId);
        if (membership) {
            const hasPermission = await checkPermission(
                membership.userId,
                membership.companyId,
                Permission.EDIT_COMPANY
            );
            if (!hasPermission) {
                return NextResponse.json({ error: "You don't have permission to update company logo" }, { status: 403 });
            }
        } else {
            const user = await prisma.user.findUnique({
                where: { clerkId },
                select: { onboardingComplete: true },
            });
            if (user?.onboardingComplete) {
                return NextResponse.json({ error: "Company membership not found" }, { status: 404 });
            }
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file)
            return NextResponse.json({ error: "No file provided" }, { status: 400 });

        // ✅ Validate file type and size
        const invalid = validateUpload(file, UPLOAD_RULES.logo);
        if (invalid) {
            return NextResponse.json({ error: invalid }, { status: 400 });
        }

        // ✅ Convert to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = safeStorageName(file.name);
        const filePath = `company/${clerkId}/${timestamp}-${safeName}`;

        // ✅ Initialize Supabase client (service key required)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // ✅ Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("logos")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError.message);
            return NextResponse.json(
                { error: uploadError.message },
                { status: 500 }
            );
        }

        // ✅ Get public URL
        const { data: publicData } = supabase.storage
            .from("logos")
            .getPublicUrl(filePath);

        const logoUrl = publicData?.publicUrl;
        if (!logoUrl)
            return NextResponse.json(
                { error: "Failed to retrieve public URL" },
                { status: 500 }
            );

        // ✅ Update company logo (only once the company exists)
        if (membership) {
            try {
                await prisma.company.update({
                    where: { id: membership.companyId },
                    data: { logo: logoUrl },
                });
            } catch (dbErr) {
                console.warn("Prisma update failed:", dbErr);
            }
        }

        return NextResponse.json({ success: true, logoUrl });
    } catch (err) {
        console.error("Upload error:", err);
        return NextResponse.json(
            { error: (err as Error).message || "Upload failed" },
            { status: 500 }
        );
    }
}
