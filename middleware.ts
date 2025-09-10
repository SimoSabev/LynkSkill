import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/'])
const isOnboardingRoute = createRouteMatcher([
    '/onboarding',
    '/redirect-after-signin',
    '/sign-in',
    '/sign-up',
])

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth()
    const url = req.nextUrl

    if (!userId && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    const onboardingRaw = sessionClaims?.metadata?.onboardingComplete as boolean | string | undefined
    const onboardingComplete = onboardingRaw === true || onboardingRaw === 'true'
    const role = (sessionClaims?.metadata?.role || '').toString().toUpperCase()

    if (userId && !onboardingComplete && !isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    // 🚨 Role-based route protection
    if (url.pathname.startsWith('/dashboard/student') && role !== 'STUDENT') {
        // send back to company dashboard
        return NextResponse.redirect(new URL('/dashboard/company', req.url))
    }

    if (url.pathname.startsWith('/dashboard/company') && role !== 'COMPANY') {
        // send back to student dashboard
        return NextResponse.redirect(new URL('/dashboard/student', req.url))
    }

    // Redirect root "/" to proper dashboard
    if (userId && onboardingComplete && url.pathname === '/') {
        if (role === 'STUDENT') {
            return NextResponse.redirect(new URL('/dashboard/student', req.url))
        }
        if (role === 'COMPANY') {
            return NextResponse.redirect(new URL('/dashboard/company', req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
