// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/']);
const isOnboardingRoute = createRouteMatcher([
    '/onboarding',
    '/redirect-after-signin',
    '/sign-in',
    '/sign-up',
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const url = req.nextUrl;

    // --- 🔹 Auto-sync Clerk user with Supabase ---
    if (userId) {
        // Fire-and-forget request → ensures user exists in Supabase
        fetch(`${req.nextUrl.origin}/api/sync-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, sessionClaims }),
        }).catch(() => {});
    }

    // --- 🔹 Redirect unsigned users ---
    if (!userId && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete as
        | boolean
        | string
        | undefined;
    const onboardingComplete =
        onboardingRaw === true || onboardingRaw === 'true';
    const role = (sessionClaims?.metadata?.role || '').toString().toUpperCase();

    // --- 🔹 Onboarding redirect ---
    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // --- 🔹 Role-based redirects ---
    if (url.pathname.startsWith('/dashboard/student') && role !== 'STUDENT') {
        return NextResponse.redirect(new URL('/dashboard/company', req.url));
    }
    if (url.pathname.startsWith('/dashboard/company') && role !== 'COMPANY') {
        return NextResponse.redirect(new URL('/dashboard/student', req.url));
    }

    // --- 🔹 Root redirect to dashboard ---
    if (userId && onboardingComplete && url.pathname === '/') {
        if (role === 'STUDENT') {
            return NextResponse.redirect(new URL('/dashboard/student', req.url));
        }
        if (role === 'COMPANY') {
            return NextResponse.redirect(new URL('/dashboard/company', req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
