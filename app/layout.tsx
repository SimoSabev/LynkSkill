import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import OnboardingWrapper from "@/components/OnboardingWrapper"
import { I18nProvider } from "@/lib/i18n"
import { AIModeProvider } from "@/lib/ai-mode-context"

// Custom Clerk appearance for LynkSkill branding
const clerkAppearance = {
    baseTheme: dark,
    variables: {
        colorPrimary: '#a855f7', // Purple-500
        colorBackground: '#0f0a1a', // Dark purple-ish background
        colorInputBackground: '#1a1425', // Slightly lighter for inputs
        colorInputText: '#ffffff',
        colorText: '#ffffff',
        colorTextSecondary: '#a1a1aa', // Muted text
        colorDanger: '#ef4444',
        colorSuccess: '#22c55e',
        colorWarning: '#f59e0b',
        colorNeutral: '#71717a',
        borderRadius: '0.75rem', // Rounded-xl
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        fontSize: '14px',
        spacingUnit: '4px',
    },
    elements: {
        // Card styling
        card: {
            backgroundColor: '#0f0a1a',
            borderRadius: '1.5rem',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.15)',
        },
        // Root box
        rootBox: {
            backgroundColor: 'transparent',
        },
        // Header
        headerTitle: {
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '700',
        },
        headerSubtitle: {
            color: '#a1a1aa',
        },
        // Social buttons
        socialButtonsBlockButton: {
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '0.75rem',
            color: '#ffffff',
            '&:hover': {
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderColor: 'rgba(168, 85, 247, 0.5)',
            },
        },
        socialButtonsBlockButtonText: {
            color: '#ffffff',
            fontWeight: '500',
        },
        // Divider
        dividerLine: {
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
        },
        dividerText: {
            color: '#71717a',
        },
        // Form fields
        formFieldLabel: {
            color: '#ffffff',
            fontWeight: '500',
            fontSize: '0.875rem',
        },
        formFieldInput: {
            backgroundColor: '#1a1425',
            borderRadius: '0.75rem',
            border: '2px solid rgba(168, 85, 247, 0.2)',
            color: '#ffffff',
            '&:focus': {
                borderColor: '#a855f7',
                boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)',
            },
            '&::placeholder': {
                color: '#71717a',
            },
        },
        formFieldInputShowPasswordButton: {
            color: '#71717a',
            '&:hover': {
                color: '#a855f7',
            },
        },
        // Primary button
        formButtonPrimary: {
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            borderRadius: '0.75rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            padding: '0.75rem 1.5rem',
            boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.3)',
            '&:hover': {
                background: 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
                boxShadow: '0 15px 30px -5px rgba(168, 85, 247, 0.4)',
            },
            '&:active': {
                transform: 'scale(0.98)',
            },
        },
        // Footer
        footerActionLink: {
            color: '#a855f7',
            fontWeight: '500',
            '&:hover': {
                color: '#c084fc',
            },
        },
        footerActionText: {
            color: '#a1a1aa',
        },
        // Identity preview
        identityPreviewEditButton: {
            color: '#a855f7',
        },
        // Alert
        alert: {
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
        },
        alertText: {
            color: '#fca5a5',
        },
        // User button
        userButtonAvatarBox: {
            borderRadius: '0.75rem',
        },
        userButtonPopoverCard: {
            backgroundColor: '#0f0a1a',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '1rem',
        },
        userButtonPopoverActionButton: {
            '&:hover': {
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
            },
        },
        // Modal backdrop
        modalBackdrop: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
        },
        // OTP Input
        otpCodeFieldInput: {
            backgroundColor: '#1a1425',
            borderRadius: '0.75rem',
            border: '2px solid rgba(168, 85, 247, 0.2)',
            color: '#ffffff',
            '&:focus': {
                borderColor: '#a855f7',
            },
        },
    },
    layout: {
        socialButtonsPlacement: 'top' as const,
        socialButtonsVariant: 'blockButton' as const,
        termsPageUrl: '/terms',
        privacyPageUrl: '/privacy',
        helpPageUrl: '/help',
    },
}

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
            appearance={clerkAppearance}
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
                    <AIModeProvider>
                        <OnboardingWrapper />
                        <main>{children}</main>
                    </AIModeProvider>
                </I18nProvider>
            </ThemeProvider>
            </body>
            </html>
        </ClerkProvider>
    )
}
