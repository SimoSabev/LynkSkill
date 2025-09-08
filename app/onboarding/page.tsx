"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "./_actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Building2, ArrowRight, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
    const [error, setError] = React.useState("")
    const [selectedRole, setSelectedRole] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false)
    const { user } = useUser()
    const router = useRouter()

    const roles = [
        {
            value: "student",
            title: "Student",
            description: "Access learning resources, track progress, and connect with peers",
            icon: GraduationCap,
            features: ["Course Materials", "Progress Tracking", "Peer Network", "Study Tools"],
            gradient: "from-blue-500/10 to-cyan-500/10",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-600",
            borderColor: "border-blue-200/50",
        },
        {
            value: "company",
            title: "Company",
            description: "Manage teams, access enterprise features, and drive business growth",
            icon: Building2,
            features: ["Team Management", "Analytics Dashboard", "Enterprise Tools", "Priority Support"],
            gradient: "from-purple-500/10 to-pink-500/10",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-600",
            borderColor: "border-purple-200/50",
        },
    ]

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)

        try {
            const res = await completeOnboarding(formData)
            if (res?.message) {
                await user?.reload()
                // ✅ Redirect correctly based on role
                router.push(selectedRole === "company" ? "/dashboard/company" : "/dashboard/student")
            }
            if (res?.error) setError(res.error)
        } catch {
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto mb-12 text-center">
                <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Welcome! Let's get you started</h1>
                <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                    Choose your role to customize your experience and unlock the features that matter most to you.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {roles.map((role) => {
                        const Icon = role.icon
                        const isSelected = selectedRole === role.value
                        return (
                            <Card
                                key={role.value}
                                className={`cursor-pointer transition-all duration-300 hover:shadow-lg group relative overflow-hidden ${
                                    isSelected
                                        ? "ring-2 ring-primary shadow-xl border-primary bg-gradient-to-br from-primary/5 to-primary/10"
                                        : `border hover:border-muted-foreground/20 bg-gradient-to-br ${role.gradient}`
                                }`}
                                onClick={() => setSelectedRole(role.value)}
                            >
                                <CardHeader className="space-y-4 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div
                                            className={`p-4 rounded-2xl transition-all duration-300 ${
                                                isSelected
                                                    ? "bg-primary text-primary-foreground shadow-lg"
                                                    : `${role.iconBg} ${role.iconColor} group-hover:scale-110`
                                            }`}
                                        >
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        {isSelected && (
                                            <Badge variant="default" className="flex items-center gap-1.5">
                                                <CheckCircle className="w-3 h-3" />
                                                Selected
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-bold text-foreground">{role.title}</CardTitle>
                                        <CardDescription className="text-muted-foreground text-base leading-relaxed">
                                            {role.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-0">
                                    <div className="space-y-3">
                                        {role.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                                                <div
                                                    className={`w-2 h-2 rounded-full transition-colors ${
                                                        isSelected ? "bg-primary" : "bg-muted-foreground/40"
                                                    }`}
                                                />
                                                <span className="font-medium">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <input
                                    type="radio"
                                    name="role"
                                    value={role.value}
                                    checked={isSelected}
                                    onChange={() => setSelectedRole(role.value)}
                                    className="sr-only"
                                    required
                                />
                            </Card>
                        )
                    })}
                </div>

                {selectedRole === "company" && (
                    <Card className="bg-background border shadow-sm">
                        <CardHeader className="pb-6">
                            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Company Information
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Tell us about your company to personalize your experience
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                                        Company Name *
                                    </Label>
                                    <Input
                                        id="companyName"
                                        type="text"
                                        name="companyName"
                                        placeholder="Enter your company name"
                                        className="bg-background border-input"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyLocation" className="text-sm font-medium text-foreground">
                                        Location *
                                    </Label>
                                    <Input
                                        id="companyLocation"
                                        type="text"
                                        name="companyLocation"
                                        placeholder="City, Country"
                                        className="bg-background border-input"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyDescription" className="text-sm font-medium text-foreground">
                                    Description *
                                </Label>
                                <Textarea
                                    id="companyDescription"
                                    name="companyDescription"
                                    placeholder="Describe what your company does..."
                                    className="bg-background border-input min-h-[100px] resize-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyWebsite" className="text-sm font-medium text-foreground">
                                    Website <span className="text-muted-foreground">(Optional)</span>
                                </Label>
                                <Input
                                    id="companyWebsite"
                                    type="url"
                                    name="companyWebsite"
                                    placeholder="https://example.com"
                                    className="bg-background border-input"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardContent className="pt-6">
                            <p className="text-destructive text-sm font-medium">{error}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-center pt-4">
                    <Button
                        type="submit"
                        disabled={!selectedRole || isLoading}
                        size="lg"
                        className="min-w-[200px] h-12 text-base font-semibold"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
