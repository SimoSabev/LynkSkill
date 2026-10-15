import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes. API routes listed here MUST do their own auth
// (Clerk session via auth(), or CRON_SECRET for /api/cleanup).
const isPublicRoute = createRouteMatcher([
    "/",
    "/terms",
    "/privacy",
    "/help",
    "/robots.txt",
    "/sitemap.xml",
    "/api/validate-eik(.*)",
    "/api/company/accept-policies(.*)",
    "/api/student/accept-policies(.*)",
    "/api/upload-logo(.*)",
    "/api/cleanup(.*)"
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding",
    "/redirect-after-signin",
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

// APIs a signed-in user may call before onboarding is complete
const isOnboardingApi = createRouteMatcher([
    "/api/get-role",
    "/api/users",
    "/api/user/me",
]);

type Role = "STUDENT" | "COMPANY" | null;

function readClaims(sessionClaims: CustomJwtSessionClaims | null | undefined): {
    onboardingComplete: boolean;
    role: Role;
} {
    const raw = sessionClaims?.metadata?.onboardingComplete as unknown;
    const onboardingComplete = raw === true || raw === "true";
    const roleRaw = (sessionClaims?.metadata?.role ?? "").toString().toUpperCase();
    const role: Role = roleRaw === "STUDENT" || roleRaw === "COMPANY" ? roleRaw : null;
    return { onboardingComplete, role };
}

function dashboardFor(role: Role): string {
    return role === "COMPANY" ? "/dashboard/company" : "/dashboard/student";
}

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const url = req.nextUrl;

    // NOTE: there is intentionally no User-Agent based bypass here.
    // Crawlers only need public routes, which are already allowed below;
    // a UA bypass let anyone skip auth/role checks by spoofing "googlebot".

    if (isPublicRoute(req)) {
        // Logged-in users hitting the landing page go straight to their dashboard
        if (url.pathname === "/" && userId) {
            const { onboardingComplete, role } = readClaims(sessionClaims);
            if (!onboardingComplete) {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }
            return NextResponse.redirect(new URL(dashboardFor(role), req.url));
        }
        return NextResponse.next();
    }

    if (!userId) {
        // API callers get a proper 401 instead of an HTML redirect
        if (url.pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/", req.url));
    }

    const { onboardingComplete, role } = readClaims(sessionClaims);

    if (!onboardingComplete && !isOnboardingRoute(req) && !isOnboardingApi(req)) {
        if (url.pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Onboarding not completed" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Role-based page protection. Only redirect when the role is known,
    // otherwise a missing claim would bounce student <-> company forever.
    if (url.pathname.startsWith("/dashboard/student") && role === "COMPANY") {
        return NextResponse.redirect(new URL("/dashboard/company", req.url));
    }
    if (url.pathname.startsWith("/dashboard/company") && role === "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
