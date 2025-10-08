"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "./_actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    GraduationCap,
    Building2,
    ArrowRight,
    CheckCircle,
    XCircle,
    Shield,
    Sparkles,
    Upload,
    MapPin,
    Globe,
    FileText,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { z } from "zod"
import { CompanyPolicyModal } from "@/components/company-policy-modal"

const companySchema = z.object({
    companyEik: z
        .string()
        .min(9, "EIK must be at least 9 digits")
        .max(13, "EIK cannot be more than 13 digits")
        .regex(/^\d+$/, "EIK must contain only digits"),
    companyName: z.string().min(2, "Company name required"),
    companyDescription: z.string().min(10, "Description too short"),
    companyLocation: z.string().min(2, "Location required"),
})

export default function OnboardingPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const [error, setError] = React.useState("")
    const [selectedRole, setSelectedRole] = React.useState<string>("")
    const [createdCompanyId, setCreatedCompanyId] = React.useState<string | null>(null)

    const [showPolicyModal, setShowPolicyModal] = React.useState(false)
    const [tosChecked, setTosChecked] = React.useState(false)
    const [privacyChecked, setPrivacyChecked] = React.useState(false)
    const [policyAccepted, setPolicyAccepted] = React.useState(false)

    const [eik, setEik] = React.useState("")
    const [companyValid, setCompanyValid] = React.useState<boolean | null>(null)
    const [companyName, setCompanyName] = React.useState("")
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)

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

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Loading your experience...</p>
                </div>
            </div>
        )
    }

    const handleEikChange = async (value: string) => {
        setEik(value)
        setCompanyValid(null)

        if (value.length < 9) return

        try {
            const res = await fetch(`/api/validate-eik?eik=${value}`)
            const data = await res.json()
            if (data.valid) {
                setCompanyValid(true)
            } else {
                setCompanyValid(false)
            }
        } catch {
            setCompanyValid(false)
        }
    }

    const handleLogoUpload = async (file: File) => {
        setIsUploadingLogo(true)
        setError("")

        try {
            const previewUrl = URL.createObjectURL(file)
            setLogoPreview(previewUrl)

            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/upload-logo", {
                method: "POST",
                body: formData,
                cache: "no-store",
            })

            const contentType = res.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text()
                console.error("Non-JSON response:", text.substring(0, 200))
                throw new Error("Server returned an invalid response. Check console for details.")
            }

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to upload logo")
            }

            const uploadedUrl = data.logoUrl

            const input = document.querySelector<HTMLInputElement>('[name="companyLogoHidden"]')
            if (input) input.value = uploadedUrl

            console.log("✅ Logo uploaded successfully:", uploadedUrl)
        } catch (error) {
            console.error("Logo upload failed:", error)
            setError(error instanceof Error ? error.message : "Logo upload failed. Please try again.")
            setLogoPreview(null)
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleProceedClick = async () => {
        setError("")

        if (selectedRole !== "company") return

        const result = companySchema.safeParse({
            companyEik: eik,
            companyName,
            companyDescription: document.querySelector<HTMLTextAreaElement>('[name="companyDescription"]')?.value,
            companyLocation: document.querySelector<HTMLInputElement>('[name="companyLocation"]')?.value,
        })

        if (!result.success) {
            setError(result.error.issues[0].message)
            return
        }

        if (!companyValid) {
            setError("EIK not found in registry")
            return
        }

        try {
            const formData = new FormData()
            formData.append("role", "company")
            formData.append("companyEik", eik)
            formData.append("companyName", companyName)
            formData.append(
                "companyDescription",
                document.querySelector<HTMLTextAreaElement>('[name="companyDescription"]')?.value || "",
            )
            formData.append(
                "companyLocation",
                document.querySelector<HTMLInputElement>('[name="companyLocation"]')?.value || "",
            )

            const res = await completeOnboarding(formData)

            if (res?.createdCompanyId) {
                setCreatedCompanyId(res.createdCompanyId)
                setShowPolicyModal(true)
            } else {
                setError(res?.error || "Unknown error creating company")
            }
        } catch (err) {
            console.error(err)
            setError("Error creating company")
        }
    }

    const handleAcceptPolicies = async () => {
        if (!createdCompanyId) {
            setError("Company not created yet")
            return
        }

        try {
            const res = await fetch("/api/company/accept-policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId: createdCompanyId,
                    tosAccepted: tosChecked,
                    privacyAccepted: privacyChecked,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to accept policies")
            }

            setPolicyAccepted(true)
            setShowPolicyModal(false)
        } catch (err) {
            console.error(err)
            setError("Failed to accept policies")
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")

        const formData = new FormData(e.currentTarget)
        const role = formData.get("role")

        if (role === "company" && !policyAccepted) {
            setError("You must accept the policy before continuing")
            return
        }

        setIsPending(true)

        try {
            const res = await completeOnboarding(formData)

            if (res?.error) {
                setError(res.error)
                return
            }

            if (res?.dashboard) {
                await user?.reload()
                router.push(res.dashboard)
            }
        } catch (err) {
            console.error(err)
            setError("An error occurred during onboarding")
        } finally {
            setIsPending(false)
        }
    }

    const getProgressStep = () => {
        if (!selectedRole) return 0
        if (selectedRole === "student") return 1
        if (selectedRole === "company" && !policyAccepted) return 1
        if (policyAccepted) return 2
        return 1
    }

    const progressStep = getProgressStep()
    const totalSteps = selectedRole === "company" ? 3 : 2

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
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--experience-hero-gradient-from)] via-background to-[var(--experience-hero-gradient-to)] opacity-[0.03]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--experience-accent)_0%,transparent_50%)] opacity-[0.05]" />

            <div className="relative z-10 p-6 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto mb-16 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--experience-accent)]/10 to-primary/10 border border-[var(--experience-accent)]/20 rounded-full mb-6 shadow-sm">
                        <Sparkles className="w-4 h-4 text-[var(--experience-accent)]" />
                        <span className="text-sm font-semibold text-[var(--experience-accent)]">Welcome aboard</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground text-balance leading-[1.1] tracking-tight">
                        Welcome to LynkSkill
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-pretty">
                        Choose your role to get started and unlock your potential in our community
                    </p>

                    {selectedRole && (
                        <div className="flex items-center justify-center gap-3 pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-500 ${
                                            i < progressStep
                                                ? "bg-[var(--experience-accent)] text-[var(--experience-accent-foreground)] shadow-lg shadow-[var(--experience-accent)]/30 scale-110"
                                                : i === progressStep
                                                    ? "bg-[var(--experience-accent)]/20 text-[var(--experience-accent)] ring-2 ring-[var(--experience-accent)]/50 scale-105"
                                                    : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {i < progressStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
                                    </div>
                                    {i < totalSteps - 1 && (
                                        <div
                                            className={`h-1 w-16 rounded-full transition-all duration-500 ${
                                                i < progressStep ? "bg-[var(--experience-accent)]" : "bg-muted"
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-10">
                    <input type="hidden" name="role" value={selectedRole} />
                    <div className="space-y-4">
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-2xl font-bold text-foreground">Select Your Role</h2>
                            <p className="text-muted-foreground">Choose the option that best describes you</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {roles.map((r) => {
                                const Icon = r.icon
                                const isSelected = selectedRole === r.value
                                return (
                                    <Card
                                        key={r.value}
                                        onClick={() => setSelectedRole(r.value)}
                                        className={`cursor-pointer transition-all duration-500 group relative overflow-hidden ${
                                            isSelected
                                                ? "ring-2 ring-[var(--experience-accent)] shadow-2xl shadow-[var(--experience-accent)]/20 scale-[1.02]"
                                                : "hover:ring-2 hover:ring-[var(--experience-accent)]/50 hover:shadow-xl hover:-translate-y-1"
                                        }`}
                                    >
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br from-[var(--experience-card-hover-from)] to-[var(--experience-card-hover-to)] opacity-0 transition-opacity duration-500 ${isSelected ? "opacity-5" : "group-hover:opacity-5"}`}
                                        />

                                        <CardHeader className="space-y-5 relative z-10">
                                            <div className="flex justify-between items-start">
                                                <div
                                                    className={`p-5 rounded-2xl transition-all duration-500 ${
                                                        isSelected
                                                            ? "bg-gradient-to-br from-[var(--experience-accent)] to-[var(--experience-button-primary-hover)] text-[var(--experience-accent-foreground)] shadow-xl shadow-[var(--experience-accent)]/40 scale-110"
                                                            : "bg-[var(--experience-step-background)] group-hover:bg-[var(--experience-accent)]/10 group-hover:scale-105"
                                                    }`}
                                                >
                                                    <Icon className="w-8 h-8" />
                                                </div>
                                                {isSelected && (
                                                    <Badge className="bg-[var(--experience-accent)] text-[var(--experience-accent-foreground)] shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                                                        Selected
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <CardTitle className="text-3xl font-bold">{r.title}</CardTitle>
                                                <CardDescription className="leading-relaxed text-base">{r.description}</CardDescription>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {selectedRole === "company" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-2xl font-bold text-foreground">Company Information</h2>
                                <p className="text-muted-foreground">Provide your company details for verification</p>
                            </div>

                            <Card className="shadow-2xl border-2 border-[var(--experience-step-border)] overflow-hidden">
                                <CardHeader className="space-y-2 border-b border-[var(--experience-step-border)] bg-gradient-to-br from-[var(--experience-step-background)] to-transparent py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-br from-[var(--experience-accent)] to-[var(--experience-button-primary-hover)] rounded-xl shadow-lg">
                                            <Building2 className="w-6 h-6 text-[var(--experience-accent-foreground)]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl">Company Details</CardTitle>
                                            <CardDescription className="text-base">All fields marked with <span className={"text-purple-500"}> * </span> are required</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-8 pt-8 pb-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Upload className="w-5 h-5 text-[var(--experience-accent)]" />
                                            <Label htmlFor="companyLogo" className="text-lg font-bold flex items-center gap-2">
                                                Company Logo <span className="text-[var(--experience-error)]">*</span>
                                            </Label>
                                        </div>
                                        <div className="flex flex-col md:flex-row items-start gap-6">
                                            <div className="flex-1 w-full">
                                                <div className="relative group">
                                                    <div
                                                        className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
                                                            isUploadingLogo
                                                                ? "border-[var(--experience-accent)] bg-[var(--experience-accent)]/5"
                                                                : "border-[var(--experience-step-border)] hover:border-[var(--experience-accent)]/50 hover:bg-[var(--experience-upload-zone-hover)]"
                                                        }`}
                                                    >
                                                        <Input
                                                            id="companyLogo"
                                                            name="companyLogo"
                                                            type="file"
                                                            accept="image/*"
                                                            required
                                                            disabled={isUploadingLogo}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleLogoUpload(file)
                                                            }}
                                                            className="file:mr-4 5 file:px-5 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-[var(--experience-accent)] file:to-[var(--experience-button-primary-hover)] file:text-[var(--experience-accent-foreground)] file:font-semibold file:shadow-md hover:file:shadow-lg file:transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <input type="hidden" name="companyLogoHidden" />
                                                {isUploadingLogo && (
                                                    <div className="flex items-center gap-3 mt-4 p-3 bg-[var(--experience-accent)]/10 rounded-lg animate-pulse">
                                                        <div className="w-5 h-5 border-3 border-[var(--experience-accent)]/30 border-t-[var(--experience-accent)] rounded-full animate-spin mr-3" />
                                                        <span className="text-sm font-medium text-[var(--experience-accent)]">
                                                          Uploading your logo...
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                                    Upload your company logo in PNG or JPG format (maximum 5MB)
                                                </p>
                                            </div>
                                            {logoPreview && !isUploadingLogo && (
                                                <div className="flex-shrink-0 animate-in fade-in zoom-in duration-500">
                                                    <div className="relative p-4 bg-gradient-to-br from-[var(--experience-card-gradient-from)] to-[var(--experience-card-gradient-to)] rounded-2xl border-2 border-[var(--experience-accent)]/30 shadow-xl">
                                                        <img
                                                            src={logoPreview || "/placeholder.svg"}
                                                            alt="Logo preview"
                                                            className="h-24 w-24 object-contain rounded-xl"
                                                        />
                                                        <div className="absolute -top-3 -right-3 p-2 bg-gradient-to-br from-[var(--experience-success)] to-green-600 rounded-full shadow-lg">
                                                            <CheckCircle className="w-5 h-5 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--experience-step-border)] to-transparent" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-[var(--experience-accent)]" />
                                            <Label htmlFor="companyEik" className="text-lg font-bold flex items-center gap-2">
                                                EИК (BULSTAT) <span className="text-[var(--experience-error)]">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyEik"
                                            name="companyEik"
                                            value={eik}
                                            onChange={(e) => handleEikChange(e.target.value)}
                                            required
                                            className="text-base h-12 border-2 focus:border-[var(--experience-accent)] transition-colors"
                                            placeholder="Enter your company EIK number"
                                        />
                                        {companyValid === true && (
                                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[var(--experience-success)]/10 to-green-50 dark:to-green-950/20 border-2 border-[var(--experience-success)]/30 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-3 duration-500">
                                                <div className="p-2 bg-[var(--experience-success)]/20 rounded-full">
                                                    <CheckCircle className="w-6 h-6 text-[var(--experience-success)] flex-shrink-0" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--experience-success)]">
                                                        EIK Verified Successfully
                                                    </p>
                                                    <p className="text-xs text-[var(--experience-success)]/80">Company found in the registry</p>
                                                </div>
                                            </div>
                                        )}
                                        {companyValid === false && (
                                            <div className="flex items-center gap-3 p-4 bg-[var(--experience-error)]/10 border-2 border-[var(--experience-error)]/30 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-3 duration-500">
                                                <div className="p-2 bg-[var(--experience-error)]/20 rounded-full">
                                                    <XCircle className="w-6 h-6 text-[var(--experience-error)] flex-shrink-0" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--experience-error)]">EIK Not Found</p>
                                                    <p className="text-xs text-[var(--experience-error)]/80">Please verify your EIK number</p>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Enter your 9-13 digit Bulgarian company identification number
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--experience-step-border)] to-transparent" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-[var(--experience-accent)]" />
                                            <Label htmlFor="companyName" className="text-lg font-bold flex items-center gap-2">
                                                Company Name <span className="text-[var(--experience-error)]">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyName"
                                            name="companyName"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            required
                                            className="text-base h-12 border-2 focus:border-[var(--experience-accent)] transition-colors"
                                            placeholder="Enter your company's official name"
                                        />
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Provide your company&apos;s full legal name as registered
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--experience-step-border)] to-transparent" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[var(--experience-accent)]" />
                                            <Label htmlFor="companyDescription" className="text-lg font-bold flex items-center gap-2">
                                                Company Description <span className="text-[var(--experience-error)]">*</span>
                                            </Label>
                                        </div>
                                        <Textarea
                                            id="companyDescription"
                                            name="companyDescription"
                                            required
                                            placeholder="Tell us about your company, what you do, and what makes you unique..."
                                            className="min-h-36 text-base resize-none border-2 focus:border-[var(--experience-accent)] transition-colors leading-relaxed"
                                        />
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Minimum 10 characters - help others understand your business
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--experience-step-border)] to-transparent" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-[var(--experience-accent)]" />
                                            <Label htmlFor="companyLocation" className="text-lg font-bold flex items-center gap-2">
                                                Location <span className="text-[var(--experience-error)]">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyLocation"
                                            name="companyLocation"
                                            required
                                            placeholder="e.g., Sofia, Bulgaria"
                                            className="text-base h-12 border-2 focus:border-[var(--experience-accent)] transition-colors"
                                        />
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Where is your company headquartered?
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--experience-step-border)] to-transparent" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-muted-foreground" />
                                            <Label htmlFor="companyWebsite" className="text-lg font-bold">
                                                Website <span className="text-muted-foreground font-normal text-sm">(optional)</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyWebsite"
                                            name="companyWebsite"
                                            type="url"
                                            placeholder="https://www.yourcompany.com"
                                            className="text-base h-12 border-2 focus:border-[var(--experience-accent)] transition-colors"
                                        />
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Share your company website if you have one
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-[var(--experience-step-border)] to-transparent" />

                                    {!policyAccepted && (
                                        <Button
                                            type="button"
                                            onClick={handleProceedClick}
                                            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-[var(--experience-button-secondary)] to-[var(--experience-button-secondary-hover)] hover:from-[var(--experience-button-secondary-hover)] hover:to-[var(--experience-button-secondary)] shadow-lg hover:shadow-xl transition-all duration-300"
                                            variant="secondary"
                                        >
                                            <Shield className="mr-2 w-5 h-5" />
                                            Proceed to Policy Agreement
                                        </Button>
                                    )}

                                    {policyAccepted && (
                                        <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-[var(--experience-success)]/10 via-green-50 to-emerald-50 dark:from-[var(--experience-success)]/20 dark:via-green-950/20 dark:to-emerald-950/20 border-2 border-[var(--experience-success)]/30 rounded-2xl shadow-lg animate-in fade-in zoom-in duration-500">
                                            <div className="p-3 bg-gradient-to-br from-[var(--experience-success)] to-green-600 rounded-xl shadow-lg">
                                                <CheckCircle className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-base text-[var(--experience-success)] font-bold">Policy Accepted</p>
                                                <p className="text-sm text-[var(--experience-success)]/80">
                                                    You&apos;re ready to complete your registration
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <CompanyPolicyModal
                        open={showPolicyModal}
                        onOpenChange={setShowPolicyModal}
                        companyId={createdCompanyId}
                        onAccept={handleAcceptPolicies}
                        tosChecked={tosChecked}
                        privacyChecked={privacyChecked}
                        onTosChange={setTosChecked}
                        onPrivacyChange={setPrivacyChecked}
                    />

                    {error && (
                        <div className="p-5 bg-[var(--experience-error)]/10 border-2 border-[var(--experience-error)]/30 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-3 duration-500">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-[var(--experience-error)]/20 rounded-full flex-shrink-0">
                                    <XCircle className="w-6 h-6 text-[var(--experience-error)]" />
                                </div>
                                <div>
                                    <p className="text-[var(--experience-error)] font-bold text-base">Error</p>
                                    <p className="text-[var(--experience-error)]/90 text-sm leading-relaxed mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center pt-8">
                        <Button
                            type="submit"
                            disabled={!selectedRole || isPending || (selectedRole === "company" && !policyAccepted)}
                            size="lg"
                            className="min-w-72 h-16 text-foreground text-lg font-bold bg-gradient-to-r from-[var(--experience-accent)] to-[var(--experience-button-primary-hover)] hover:from-[var(--experience-button-primary-hover)] hover:to-[var(--experience-accent)] shadow-2xl hover:shadow-[var(--experience-accent)]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-6 h-6 border-3 border-[var(--experience-accent-foreground)]/30 border-t-[var(--experience-accent-foreground)] rounded-full animate-spin mr-3" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Complete Registration
                                    <ArrowRight className="ml-3 w-6 h-6" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
