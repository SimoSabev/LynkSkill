export {}

declare global {
    interface CustomJwtSessionClaims {
        // Requires the Clerk session token template to include:
        //   { "metadata": "{{user.public_metadata}}" }
        metadata: {
            onboardingComplete?: boolean | string
            // Written as "STUDENT" | "COMPANY" by onboarding; compared case-insensitively
            role?: string
        }
    }
}
