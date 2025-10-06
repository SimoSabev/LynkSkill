export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

// ✅ Ensure this is a route handler, not a Server Action
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file)
            return NextResponse.json({ error: "No file provided" }, { status: 400 });

        // ✅ Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }

        // ✅ Convert to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `company/${userId}/${timestamp}-${safeName}`;

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

        // ✅ Optional: update Prisma (if user has a company)
        try {
            const user = await prisma.user.findUnique({ where: { clerkId: userId } });
            if (user) {
                const company = await prisma.company.findFirst({
                    where: { ownerId: user.id },
                });
                if (company) {
                    await prisma.company.update({
                        where: { id: company.id },
                        data: { logo: logoUrl },
                    });
                }
            }
        } catch (dbErr) {
            console.warn("Prisma update skipped:", dbErr);
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
