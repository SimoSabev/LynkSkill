import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import OnboardingWrapper from "@/components/OnboardingWrapper"

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: {
        default: 'LynkSkill – Empowering Students Through Real-World Experience',
        template: '%s | LynkSkill'
    },
    description:
        'LynkSkill connects students with businesses for real-world projects, internships, and collaborations. Gain practical experience, showcase your skills, and grow your professional network.',
    keywords: [
        'student internships',
        'student projects',
        'business collaboration',
        'student opportunities',
        'skills marketplace',
        'university students',
        'LynkSkill',
        'real-world learning',
        'student-business platform'
    ],
    authors: [{ name: 'LynkSkill Team', url: 'https://lynkskill.net' }],
    creator: 'LynkSkill',
    publisher: 'LynkSkill',
    metadataBase: new URL('https://lynkskill.net'),

    // Open Graph (Facebook, LinkedIn, etc.)
    openGraph: {
        title: 'LynkSkill – Students Meet Real-World Experience',
        description:
            'Connect with businesses, gain hands-on experience, and unlock career opportunities through LynkSkill.',
        url: 'https://lynkskill.net',
        siteName: 'LynkSkill',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'LynkSkill – Students and Businesses Connecting'
            }
        ],
        locale: 'en_US',
        type: 'website'
    },

    // Twitter metadata
    twitter: {
        card: 'summary_large_image',
        title: 'LynkSkill – Where Students and Businesses Connect',
        description:
            'Join LynkSkill to collaborate with companies, build experience, and showcase your skills to the world.',
        creator: '@lynkskill',
        images: ['/og-image.jpg']
    },

    // Geo & regional targeting (useful if you’re focused on specific regions)
    other: {
        'geo.region': 'US',
        'geo.placename': 'United States',
        'geo.position': '37.7749;-122.4194', // Example: San Francisco (update as needed)
        'ICBM': '37.7749, -122.4194',
    },

    // Favicon + manifest
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },

    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1
        }
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/onboarding"
        >
            <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {/* Only render RegisterUser on /onboarding */}
                <OnboardingWrapper />
                <main>{children}</main>
            </ThemeProvider>
            </body>
            </html>
        </ClerkProvider>
    )
}
