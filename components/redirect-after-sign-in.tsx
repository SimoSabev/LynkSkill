"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function RedirectAfterSignIn() {
    const router = useRouter()
    const { user, isSignedIn, isLoaded } = useUser()

    useEffect(() => {
        if (!isLoaded) return
            ;(async () => {
            if (!isSignedIn || !user) {
                router.replace("/sign-in")
                return
            }

            try {
                const res = await fetch("/api/get-role", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ clerkId: user.id }),
                })
                const data = await res.json()

                if (!data?.role || !data.onboardingComplete) {
                    router.replace("/onboarding")
                    return
                }

                if (data.role.toUpperCase() === "STUDENT") router.replace("/dashboard/student")
                else if (data.role.toUpperCase() === "COMPANY") router.replace("/dashboard/company")
                else router.replace("/onboarding")
            } catch (err) {
                console.error(err)
                router.replace("/onboarding")
            }
        })()
    }, [user, isSignedIn, isLoaded, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground">Setting up your account</h2>
                    <p className="text-muted-foreground text-balance">
                        Please wait while we prepare your personalized experience...
                    </p>
                </div>
            </div>
        </div>
    )
}
