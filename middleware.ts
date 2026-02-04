import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ✅ 1. ПЪЛЕН списък с публични маршрути
// Добавихме чистите пътища (без (.*)) за главните страници
const isPublicRoute = createRouteMatcher([
    "/",
    "/terms",
    "/privacy",
    "/help",
    "/sitemap.xml",
    "/robots.txt",
    "/sign-in(.*)",  // Важно: Clerk страниците трябва да са публични
    "/sign-up(.*)",
    "/internships",      // Главна страница
    "/internships/(.*)", // Подстраници
    "/companies",        // Главна страница
    "/companies/(.*)",   // Подстраници
    "/projects",         // Главна страница
    "/projects/(.*)",    // Подстраници
    "/assignments/(.*)",
    "/experience/(.*)",  // Добавих experience, беше в sitemap-а
    "/portfolio/(.*)",   // Добавих portfolio, беше в sitemap-а
    "/api/validate-eik(.*)",
    "/api/company/accept-policies(.*)",
    "/api/student/accept-policies(.*)",
    "/api/upload-logo(.*)",
    "/api/cleanup(.*)",
    "/api/public/(.*)"
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding",
    "/redirect-after-signin"
]);

// Routes that require auth but no specific role (accessible to all authenticated users)
const isRoleAgnosticRoute = createRouteMatcher([
    "/invitations(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const url = req.nextUrl;

    // ✅ 2. SEO Fix: Пропускаме Googlebot директно, за да не го въртим в редиректи
    // Това е безопасно, защото ботовете не могат да направят POST заявки или да пипат данни
    const userAgent = req.headers.get("user-agent") || "";
    const isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex/i.test(userAgent);

    if (isBot) {
         return NextResponse.next();
    }

    // ✅ 3. Логика за публични страници
    if (isPublicRoute(req)) {
        // Ако потребителят е логнат и се опита да влезе в Home Page ("/"), го пращаме в Dashboard
        if (url.pathname === "/" && userId) {
            const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
            const onboardingComplete = onboardingRaw === true || onboardingRaw?.toString() === "true";
            const role = (sessionClaims?.metadata?.role || "").toString().toUpperCase();

            if (!onboardingComplete) {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }
            if (role === "COMPANY") {
                return NextResponse.redirect(new URL("/dashboard/company", req.url));
            }
            return NextResponse.redirect(new URL("/dashboard/student", req.url));
        }
        // Ако е публична страница и не е хоумпейдж, просто го пускаме
        return NextResponse.next();
    }

    // ✅ 4. Защита на не-публични страници (Private Routes)
    // Ако няма UserID и не е публичен път -> Redirect към Home/Sign-in
    if (!userId) {
        // Redirect към sign-in вместо към home е по-добра практика, но нека запазим твоята логика
        return NextResponse.redirect(new URL("/", req.url)); 
    }

    // ✅ 5. Onboarding логика
    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
    const onboardingComplete = onboardingRaw === true || onboardingRaw?.toString() === "true";
    const role = (sessionClaims?.metadata?.role || "").toString().toUpperCase();

    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // ✅ 5.5. Allow role-agnostic routes (like invitations) for all authenticated users
    if (isRoleAgnosticRoute(req)) {
        return NextResponse.next();
    }

    // ✅ 6. Role-based защита
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
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
