import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import OnboardingWrapper from "@/components/OnboardingWrapper"
import { I18nProvider } from "@/lib/i18n"

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
        template: '%s | LynkSkill',
    },
    description:
        'LynkSkill connects students with businesses for real-world projects, internships, and collaborations. Gain practical experience, grow your skills, and create meaningful career connections in Bulgaria and worldwide.',
    keywords: [
        // --- English ---
        'student internships',
        'student projects',
        'business collaboration',
        'student opportunities',
        'skills marketplace',
        'university students',
        'real-world learning',
        'career development',
        'professional growth',
        'student-business platform',
        'student startup projects',
        'student networking',
        'youth innovation',
        'student tech projects',
        'digital portfolio',
        'student community',
        'education platform',
        'practical experience',
        'real projects for students',
        'internship platform',
        'LynkSkill',
        // --- Bulgarian ---
        'ученически стажове',
        'ученически проекти',
        'сътрудничество между ученици и фирми',
        'възможности за ученици',
        'платформа за умения',
        'университетски стажове',
        'реален опит за ученици',
        'кариера за ученици',
        'развитие на умения',
        'професионално развитие',
        'ученическа практика',
        'платформа за ученици и бизнес',
        'иновативна образователна платформа',
        'проектно обучение',
        'училищна кариера',
        'ученици и бизнес',
        'практически опит',
        'младешко развитие',
        'бъдеще за ученици',
    ],
    authors: [{ name: 'LynkSkill Team', url: 'https://lynkskill.net' }],
    creator: 'LynkSkill',
    publisher: 'LynkSkill',
    metadataBase: new URL('https://lynkskill.net'),

    openGraph: {
        title: 'LynkSkill – Where Students and Businesses Connect',
        description:
            'LynkSkill bridges the gap between students and companies by providing opportunities for internships, real projects, and career growth.',
        url: 'https://lynkskill.net',
        siteName: 'LynkSkill',
        images: [
            {
                url: '/opengrapgh.png',
                width: 1200,
                height: 630,
                alt: 'LynkSkill – Students and Businesses Connecting',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },

    twitter: {
        card: 'summary_large_image',
        title: 'LynkSkill – Empowering Students with Real-World Projects',
        description:
            'Join LynkSkill to connect with businesses, gain practical experience, and showcase your skills to the world.',
        creator: '@lynkskill',
        images: ['/opengrapgh.png'],
    },

    icons: {
        icon: '/favicon.ico',},

    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },

    alternates: {
        canonical: 'https://lynkskill.net',
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
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                <I18nProvider>
                    <OnboardingWrapper />
                    <main>{children}</main>
                </I18nProvider>
            </ThemeProvider>
            </body>
            </html>
        </ClerkProvider>
    )
}
