"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "./_actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Building2, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useTransition } from "react"

export default function OnboardingPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = React.useState("")
    const [selectedRole, setSelectedRole] = React.useState<string>("")

    // If already onboarded — redirect away immediately
    React.useEffect(() => {
        if (!isLoaded || !user) return
            ;(async () => {
            try {
                const res = await fetch("/api/get-role", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ clerkId: user.id }),
                })
                const data = await res.json()
                if (data?.onboardingComplete) {
                    // already finished onboarding: navigate to their dashboard
                    const dest = data.role === "COMPANY" ? "/dashboard/company" : "/dashboard/student"
                    router.replace(dest)
                }
            } catch (err) {
                console.error(err)
            }
        })()
    }, [isLoaded, user, router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const res = await completeOnboarding(formData)
            if (res?.dashboard) {
                await user?.reload()
                router.push(res.dashboard)
            } else if (res?.error) {
                setError(res.error)
            } else {
                setError("Unknown error")
            }
        })
    }

    const roles = [
        {
            value: "student",
            title: "Student",
            description: "Access learning resources, track progress, and connect with peers",
            icon: GraduationCap,
        },
        {
            value: "company",
            title: "Company",
            description: "Manage teams and post internships",
            icon: Building2,
        },
    ]

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto mb-12 text-center">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    Welcome — choose a role
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {roles.map((r) => {
                        const Icon = r.icon
                        const isSelected = selectedRole === r.value
                        return (
                            <Card
                                key={r.value}
                                onClick={() => setSelectedRole(r.value)}
                                className={`cursor-pointer p-4 ${
                                    isSelected ? "ring-2 ring-primary" : ""
                                }`}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div
                                            className={`p-3 rounded-xl ${
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            }`}
                                        >
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        {isSelected && <Badge>Selected</Badge>}
                                    </div>
                                    <CardTitle>{r.title}</CardTitle>
                                    <CardDescription>{r.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <input
                                        type="radio"
                                        name="role"
                                        value={r.value}
                                        checked={isSelected}
                                        onChange={() => setSelectedRole(r.value)}
                                        className="sr-only"
                                        required
                                    />
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Student extra fields */}
                {selectedRole === "student" && (
                    <Card className="p-4">
                        <CardHeader>
                            <CardTitle>Student information</CardTitle>
                            <CardDescription>
                                We need your date of birth to verify your eligibility
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Date of Birth</Label>
                                <Input name="dob" type="date" required />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Company extra fields */}
                {selectedRole === "company" && (
                    <Card className="p-4">
                        <CardHeader>
                            <CardTitle>Company information</CardTitle>
                            <CardDescription>
                                We need these to create your company
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Company name</Label>
                                <Input name="companyName" required />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea name="companyDescription" required />
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input name="companyLocation" required />
                            </div>
                            <div>
                                <Label>Website (optional)</Label>
                                <Input name="companyWebsite" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && <p className="text-red-500">{error}</p>}

                <div className="flex justify-center">
                    <Button type="submit" disabled={!selectedRole || isPending}>
                        {isPending ? "Processing..." : "Continue"}
                        <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </form>
        </div>
    )
}
