"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export default function RedirectAfterSignIn({
                                                message = "Redirecting...",
                                                subtitle = "Please wait while we prepare your experience",
                                                showProgress = true,
                                            }) {
    const router = useRouter()
    const { user, isSignedIn, isLoaded } = useUser()
    const [progress, setProgress] = useState(0)
    const [dots, setDots] = useState("")

    useEffect(() => {
        if (!isLoaded) return

        async function checkRole() {
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

                // If user exists and has role, go to dashboard
                if (data?.role === "STUDENT") router.replace("/dashboard/student")
                else if (data?.role === "COMPANY") router.replace("/dashboard/company")
                else router.replace("/onboarding") // no role or not in DB
            } catch (err) {
                console.error("Error fetching role:", err)
                router.replace("/onboarding")
            }
        }

        checkRole()
    }, [user, isSignedIn, isLoaded, router])

    // Animate dots and progress
    useEffect(() => {
        const dotsInterval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
        }, 500)

        let progressInterval: NodeJS.Timeout
        if (showProgress) {
            progressInterval = setInterval(() => {
                setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 10))
            }, 200)
        }

        return () => {
            clearInterval(dotsInterval)
            if (progressInterval) clearInterval(progressInterval)
        }
    }, [showProgress])

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
            <div className="text-center space-y-8 animate-fade-in-up">
                <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-muted animate-spin-smooth"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin-smooth"></div>
                    <div className="absolute inset-2 rounded-full bg-accent/10 animate-pulse-glow"></div>
                </div>
                <div className="space-y-4">
                    <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground tracking-tight">
                        {message}
                        <span className="text-accent">{dots}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed">{subtitle}</p>
                </div>
                {showProgress && (
                    <div className="w-full max-w-xs mx-auto space-y-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-300 ease-out rounded-full" style={{ width: `${Math.min(progress, 90)}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground">{Math.round(Math.min(progress, 90))}% complete</p>
                    </div>
                )}
            </div>
        </div>
    )
}
