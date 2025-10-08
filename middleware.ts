// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
    '/',
    '/api/validate-eik(.*)',
    '/api/company/accept-policies(.*)',
    '/api/upload-logo(.*)',
    '/terms',
    '/privacy',
])

const isOnboardingRoute = createRouteMatcher([
    '/onboarding',
    '/redirect-after-signin',
    '/sign-in',
    '/sign-up',
])

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth()
    const url = req.nextUrl

    // --- 🔹 Auto-sync Clerk user with Supabase ---
    if (userId) {
        // Fire-and-forget request → ensures user exists in Supabase
        fetch(`${req.nextUrl.origin}/api/sync-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, sessionClaims }),
        }).catch(() => {})
    }

    // --- 🔹 Redirect unsigned users ---
    if (!userId && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete as
        | boolean
        | string
        | undefined
    const onboardingComplete =
        onboardingRaw === true || onboardingRaw === 'true'
    const role = (sessionClaims?.metadata?.role || '').toString().toUpperCase()

    // --- 🔹 Signed-in users visiting "/" → redirect to dashboard ---
    if (userId && url.pathname === '/') {
        if (!onboardingComplete) {
            return NextResponse.redirect(new URL('/onboarding', req.url))
        }

        if (role === 'COMPANY') {
            return NextResponse.redirect(new URL('/dashboard/company', req.url))
        }

        // Default to student dashboard if not company
        return NextResponse.redirect(new URL('/dashboard/student', req.url))
    }

    // --- 🔹 Onboarding redirect ---
    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    // --- 🔹 Role-based redirects ---
    if (url.pathname.startsWith('/dashboard/student') && role !== 'STUDENT') {
        return NextResponse.redirect(new URL('/dashboard/company', req.url))
    }
    if (url.pathname.startsWith('/dashboard/company') && role !== 'COMPANY') {
        return NextResponse.redirect(new URL('/dashboard/student', req.url))
    }

    // --- 🔹 Allow everything else ---
    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
}


// // middleware.ts
// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
//
// // ✅ define which routes should be public
// const isPublicRoute = createRouteMatcher([
//     "/",
//     "/api/validate-eik(.*)", // public EIK validation route
// ]);
//
// const isOnboardingRoute = createRouteMatcher([
//     "/onboarding",
//     "/redirect-after-signin",
//     "/sign-in",
//     "/sign-up",
// ]);
//
// export default clerkMiddleware(async (auth, req) => {
//     const { userId, sessionClaims } = await auth();
//     const url = req.nextUrl;
//
//     // ✅ skip Clerk for public routes
//     if (isPublicRoute(req)) {
//         console.log("🟢 Skipping Clerk auth for:", url.pathname);
//         return NextResponse.next();
//     }
//
//     // --- 🔹 Auto-sync Clerk user with Supabase ---
//     if (userId) {
//         fetch(`${req.nextUrl.origin}/api/sync-user`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ userId, sessionClaims }),
//         }).catch(() => {});
//     }
//
//     // --- 🔹 Redirect unsigned users ---
//     if (!userId) {
//         return NextResponse.redirect(new URL("/", req.url));
//     }
//
//     const onboardingRaw = sessionClaims?.metadata?.onboardingComplete as
//         | boolean
//         | string
//         | undefined;
//     const onboardingComplete =
//         onboardingRaw === true || onboardingRaw === "true";
//     const role = (sessionClaims?.metadata?.role || "")
//         .toString()
//         .toUpperCase();
//
//     // --- 🔹 Onboarding redirect ---
//     if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
//         return NextResponse.redirect(new URL("/onboarding", req.url));
//     }
//
//     // --- 🔹 Role-based redirects ---
//     if (url.pathname.startsWith("/dashboard/student") && role !== "STUDENT") {
//         return NextResponse.redirect(new URL("/dashboard/company", req.url));
//     }
//     if (url.pathname.startsWith("/dashboard/company") && role !== "COMPANY") {
//         return NextResponse.redirect(new URL("/dashboard/student", req.url));
//     }
//
//     // --- 🔹 Root redirect to dashboard ---
//     if (userId && onboardingComplete && url.pathname === "/") {
//         if (role === "STUDENT") {
//             return NextResponse.redirect(new URL("/dashboard/student", req.url));
//         }
//         if (role === "COMPANY") {
//             return NextResponse.redirect(new URL("/dashboard/company", req.url));
//         }
//     }
//
//     return NextResponse.next();
// });
//
// // ✅ matcher config: do NOT filter api routes manually here
// export const config = {
//     matcher: [
//         // Match all routes except static files
//         "/((?!_next|.*\\..*).*)",
//     ],
// };
