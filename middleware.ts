import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/terms",
    "/privacy",
    "/api/validate-eik(.*)",
    "/api/company/accept-policies(.*)",
    "/api/upload-logo(.*)",
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding",
    "/redirect-after-signin",
    "/sign-in",
    "/sign-up",
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const url = req.nextUrl;

    // ✅ Always allow public APIs and static pages
    if (isPublicRoute(req)) {
        // 👇 Special case: if logged in and visiting "/", redirect to dashboard
        if (url.pathname === "/" && userId) {
            const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
            const onboardingComplete =
                onboardingRaw === true || onboardingRaw?.toString() === "true";
            const role = (sessionClaims?.metadata?.role || "")
                .toString()
                .toUpperCase();

            if (!onboardingComplete) {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }

            if (role === "COMPANY") {
                return NextResponse.redirect(new URL("/dashboard/company", req.url));
            }
            return NextResponse.redirect(new URL("/dashboard/student", req.url));
        }

        return NextResponse.next();
    }

    // ✅ Sync Clerk user with Supabase if logged in
    if (userId) {
        fetch(`${req.nextUrl.origin}/api/sync-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, sessionClaims }),
        }).catch(() => {});
    }

    // ✅ Redirect guests to "/"
    if (!userId && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // ✅ Onboarding redirect
    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
    const onboardingComplete =
        onboardingRaw === true || onboardingRaw?.toString() === "true";
    const role = (sessionClaims?.metadata?.role || "")
        .toString()
        .toUpperCase();

    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // ✅ Role-based route protection
    if (url.pathname.startsWith("/dashboard/student") && role !== "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard/company", req.url));
    }
    if (url.pathname.startsWith("/dashboard/company") && role !== "COMPANY") {
        return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
