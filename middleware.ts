import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ✅ 1. ПЪЛЕН списък с публични маршрути
// Добавихме чистите пътища (без (.*)) за главните страници
const isPublicRoute = createRouteMatcher([
    "/",
    "/terms",
    "/privacy",
    "/help",
    "/help/(.*)",        // Подстраниците (student-guide, company-guide) също са публични
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
    "/api/public/(.*)"
]);

const isOnboardingRoute = createRouteMatcher([
    "/onboarding",
    "/redirect-after-signin",
    "/api/company/join",
]);

// Routes that require auth but no specific role (accessible to all authenticated users)
const isRoleAgnosticRoute = createRouteMatcher([
    "/invitations(.*)",
]);

// Единствен източник на истина за "кой къде живее".
// Всяка роля има точно едно начално табло -> редиректите винаги са терминални.
const DASHBOARD_BY_ROLE: Record<string, string> = {
    STUDENT: "/dashboard/student",
    COMPANY: "/dashboard/company",
    TEAM_MEMBER: "/dashboard/team-member",
};

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const url = req.nextUrl;

    // ⚠️ Премахнат е старият "Googlebot bypass".
    // User-Agent се задава от клиента, така че всеки можеше да изпрати
    // `User-Agent: googlebot` и да прескочи цялата auth логика по-долу (включително POST).
    // Причината за него (ботове, въртящи се в редиректи) е решена другаде:
    //   - /help/(.*) вече е публичен маршрут
    //   - /help препраща анонимните към /help/student-guide, а не към защитен dashboard
    //   - ролевите редиректи по-долу имат терминален fallback вместо безкраен цикъл

    // ✅ 2. Логика за публични страници
    if (isPublicRoute(req)) {
        // Ако потребителят е логнат и се опита да влезе в Home Page ("/"), го пращаме в Dashboard
        if (url.pathname === "/" && userId) {
            const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
            const onboardingComplete = onboardingRaw === true || onboardingRaw?.toString() === "true";
            const role = (sessionClaims?.metadata?.role || "").toString().toUpperCase();

            // Непозната/липсваща роля -> onboarding, а не налучкване на табло.
            const home = DASHBOARD_BY_ROLE[role];
            if (!onboardingComplete || !home) {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }
            return NextResponse.redirect(new URL(home, req.url));
        }
        // Ако е публична страница и не е хоумпейдж, просто го пускаме
        return NextResponse.next();
    }

    // ✅ 3. Защита на не-публични страници (Private Routes)
    // Ако няма UserID и не е публичен път -> Redirect към Home/Sign-in
    if (!userId) {
        // Redirect към sign-in вместо към home е по-добра практика, но нека запазим твоята логика
        return NextResponse.redirect(new URL("/", req.url)); 
    }

    // ✅ 4. Onboarding логика
    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete;
    const onboardingComplete = onboardingRaw === true || onboardingRaw?.toString() === "true";
    const role = (sessionClaims?.metadata?.role || "").toString().toUpperCase();

    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // ✅ 4.5. Allow role-agnostic routes (like invitations) for all authenticated users
    if (isRoleAgnosticRoute(req)) {
        return NextResponse.next();
    }

    // ✅ 5. Role-based защита.
    // Старата версия правеше редирект роля->роля: при роля извън
    // {STUDENT, COMPANY, TEAM_MEMBER} /dashboard/student пращаше към /dashboard/company,
    // което пращаше обратно към /dashboard/student -> ERR_TOO_MANY_REDIRECTS.
    // Сега целта се изчислява веднъж и всеки клон е терминален.
    if (url.pathname.startsWith("/dashboard")) {
        const home = DASHBOARD_BY_ROLE[role];

        // Непозната или липсваща роля -> onboarding (той не е /dashboard, така че не се зацикля).
        if (!home) {
            return NextResponse.redirect(new URL("/onboarding", req.url));
        }

        // Чуждо табло -> един редирект към собственото.
        if (!url.pathname.startsWith(home)) {
            return NextResponse.redirect(new URL(home, req.url));
        }
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
