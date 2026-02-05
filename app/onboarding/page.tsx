"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
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
    Calendar,
    Loader2,
    Users,
    KeyRound,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { z } from "zod"

// Dynamically import heavy modal components for better initial load performance
const StudentPolicyModal = dynamic(
    () => import("@/components/student-policy-modal").then((mod) => mod.StudentPolicyModal),
    { loading: () => null }
)
const CompanyPolicyModal = dynamic(
    () => import("@/components/company-policy-modal").then((mod) => mod.CompanyPolicyModal),
    { loading: () => null }
)

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

// Move static data outside component to prevent recreation on each render
const ROLE_OPTIONS = [
    {
        value: "student" as const,
        title: "Student",
        description: "Access learning resources, track progress, and connect with peers",
        icon: GraduationCap,
    },
    {
        value: "company" as const,
        title: "Company",
        description: "Manage teams and post internships",
        icon: Building2,
    },
    {
        value: "team_member" as const,
        title: "Team Member",
        description: "Join an existing company with an invitation code",
        icon: Users,
    },
] as const

export default function OnboardingPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)
    const [error, setError] = React.useState("")
    const [selectedRole, setSelectedRole] = React.useState<"student" | "company" | "team_member" | null>(null)
    const [createdCompanyId, setCreatedCompanyId] = React.useState<string | null>(null)
    const [createdPortfolioId, setCreatedPortfolioId] = React.useState<string | null>(null)

    // Team Member invitation code state
    const [invitationCode, setInvitationCode] = React.useState(["", "", "", ""])
    const [codeValid, setCodeValid] = React.useState<boolean | null>(null)
    const [codeValidating, setCodeValidating] = React.useState(false)
    const [companyPreview, setCompanyPreview] = React.useState<{
        id: string
        name: string
        logo: string | null
        location: string
        description: string
        memberCount: number
    } | null>(null)
    const codeInputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    const [showStudentPolicyModal, setShowStudentPolicyModal] = React.useState(false)
    const [studentTosChecked, setStudentTosChecked] = React.useState(false)
    const [studentPrivacyChecked, setStudentPrivacyChecked] = React.useState(false)
    const [studentPolicyAccepted, setStudentPolicyAccepted] = React.useState(false)

    const [showPolicyModal, setShowPolicyModal] = React.useState(false)
    const [tosChecked, setTosChecked] = React.useState(false)
    const [privacyChecked, setPrivacyChecked] = React.useState(false)
    const [policyAccepted, setPolicyAccepted] = React.useState(false)

    const [eik, setEik] = React.useState("")
    const [companyValid, setCompanyValid] = React.useState<boolean | null>(null)
    const [companyName, setCompanyName] = React.useState("")
    const [companyDescription, setCompanyDescription] = React.useState("")
    const [companyLocation, setCompanyLocation] = React.useState("")
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
    const [logoUrl, setLogoUrl] = React.useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
    const eikDebounceRef = React.useRef<NodeJS.Timeout | null>(null)

    // Field-level validation errors
    const [fieldErrors, setFieldErrors] = React.useState<{
        companyName?: string
        companyDescription?: string
        companyLocation?: string
        logoUrl?: string
    }>({})

    // Real-time field validation
    const validateField = React.useCallback((field: string, value: string) => {
        const newErrors = { ...fieldErrors }
        
        switch (field) {
            case "companyName":
                if (value.length > 0 && value.length < 2) {
                    newErrors.companyName = "Company name must be at least 2 characters"
                } else if (value.length > 100) {
                    newErrors.companyName = "Company name is too long"
                } else {
                    delete newErrors.companyName
                }
                break
            case "companyDescription":
                if (value.length > 0 && value.length < 10) {
                    newErrors.companyDescription = "Description must be at least 10 characters"
                } else if (value.length > 2000) {
                    newErrors.companyDescription = "Description is too long"
                } else {
                    delete newErrors.companyDescription
                }
                break
            case "companyLocation":
                if (value.length > 0 && value.length < 2) {
                    newErrors.companyLocation = "Location must be at least 2 characters"
                } else {
                    delete newErrors.companyLocation
                }
                break
        }
        
        setFieldErrors(newErrors)
    }, [fieldErrors])

    const [dob, setDob] = React.useState("")
    const [ageValid, setAgeValid] = React.useState<boolean | null>(null)
    const [calculatedAge, setCalculatedAge] = React.useState<number | null>(null)

    React.useEffect(() => {
        if (!isLoaded || !user) return
        
        // Use Clerk's publicMetadata instead of API call
        const metadata = user.publicMetadata as { role?: string; onboardingComplete?: boolean } | undefined
        if (metadata?.onboardingComplete) {
            const dest = metadata.role === "COMPANY" ? "/dashboard/company" : "/dashboard/student"
            router.replace(dest)
        }
    }, [isLoaded, user, router])

    // Cleanup ObjectURL on unmount or when logoPreview changes
    React.useEffect(() => {
        return () => {
            if (logoPreview) {
                URL.revokeObjectURL(logoPreview)
            }
        }
    }, [logoPreview])

    const calculateAge = (birthDate: Date): number => {
        const diff = Date.now() - birthDate.getTime()
        const ageDt = new Date(diff)
        return Math.abs(ageDt.getUTCFullYear() - 1970)
    }

    const handleDobChange = (value: string) => {
        setDob(value)
        setAgeValid(null)
        setCalculatedAge(null)
        setError("")

        if (!value) return

        const selectedDate = new Date(value)
        const today = new Date()

        // Check if date is in the future
        if (selectedDate > today) {
            setAgeValid(false)
            setError("Date of birth cannot be in the future")
            return
        }

        // Check if date is valid
        if (isNaN(selectedDate.getTime())) {
            setAgeValid(false)
            setError("Please enter a valid date")
            return
        }

        // Check if date is too far in the past (e.g., more than 100 years ago)
        const hundredYearsAgo = new Date()
        hundredYearsAgo.setFullYear(today.getFullYear() - 100)
        if (selectedDate < hundredYearsAgo) {
            setAgeValid(false)
            setError("Please enter a valid date of birth")
            return
        }

        try {
            const age = calculateAge(selectedDate)
            setCalculatedAge(age)

            if (age < 16) {
                setAgeValid(false)
                setError("According to Bulgarian law, you must be at least 16 years old to use this platform")
            } else {
                setAgeValid(true)
                setError("")
            }
        } catch (_err) {
            setAgeValid(false)
            setError("Invalid date format")
        }
    }

    // Handle invitation code input for team members
    const handleCodeSegmentChange = async (index: number, value: string) => {
        // Only allow alphanumeric characters
        const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4)
        
        const newCode = [...invitationCode]
        newCode[index] = cleanValue
        setInvitationCode(newCode)
        setCodeValid(null)
        setCompanyPreview(null)
        setError("")

        // Auto-focus next input if current is filled
        if (cleanValue.length === 4 && index < 3) {
            codeInputRefs.current[index + 1]?.focus()
        }

        // Validate full code when all segments are filled
        const fullCode = newCode.join("-")
        if (newCode.every(segment => segment.length === 4)) {
            await validateInvitationCode(fullCode)
        }
    }

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace to move to previous input
        if (e.key === "Backspace" && invitationCode[index] === "" && index > 0) {
            codeInputRefs.current[index - 1]?.focus()
        }
    }

    const handleCodePaste = async (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedText = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "")
        
        if (pastedText.length >= 16) {
            const newCode = [
                pastedText.slice(0, 4),
                pastedText.slice(4, 8),
                pastedText.slice(8, 12),
                pastedText.slice(12, 16),
            ]
            setInvitationCode(newCode)
            setCodeValid(null)
            setCompanyPreview(null)
            
            // Validate the pasted code
            const fullCode = newCode.join("-")
            await validateInvitationCode(fullCode)
        }
    }

    const validateInvitationCode = async (code: string) => {
        setCodeValidating(true)
        setError("")
        
        try {
            const res = await fetch("/api/company/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            })

            const data = await res.json()

            if (data.valid) {
                setCodeValid(true)
                setCompanyPreview(data.company)
            } else {
                setCodeValid(false)
                setError(data.error || "Invalid invitation code")
            }
        } catch (err) {
            console.error("Code validation error:", err)
            setCodeValid(false)
            setError("Failed to validate code. Please try again.")
        } finally {
            setCodeValidating(false)
        }
    }

    const handleEikChange = (value: string) => {
        setEik(value)
        setCompanyValid(null)
        setError("")

        // Clear any pending debounce
        if (eikDebounceRef.current) {
            clearTimeout(eikDebounceRef.current)
        }

        if (value.length < 9) return

        // Debounce the API call by 500ms
        eikDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/validate-eik?eik=${value}`, { cache: "no-store" })

                // Read body once, as text
                const raw = await res.text()

                interface EikValidationResponse {
                    valid: boolean | "true" | "false"
                    error?: string
                }
                let data: EikValidationResponse | null = null
                try {
                    data = JSON.parse(raw)
                } catch {
                    console.error("EIK API returned non-JSON response:", raw.slice(0, 200))
                    setCompanyValid(false)
                    setError("Server returned invalid response")
                    return
                }

                console.log("EIK API Response:", { ok: res.ok, data })

                if (res.ok && data && (data.valid === true || data.valid === "true")) {
                    setCompanyValid(true)
                    setError("")
                } else {
                    setCompanyValid(false)
                    setError(data?.error || "EIK not found")
                }
            } catch (err) {
                console.error("EIK validation error:", err)
                setCompanyValid(false)
                setError("Unexpected error")
            }
        }, 500)
    }

    const handleLogoUpload = async (file: File) => {
        setIsUploadingLogo(true)
        setError("")

        // Revoke previous preview URL to prevent memory leak
        if (logoPreview) {
            URL.revokeObjectURL(logoPreview)
        }

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

            // Store logo URL in state instead of DOM
            setLogoUrl(data.logoUrl)
            console.log("✅ Logo uploaded successfully:", data.logoUrl)
        } catch (error) {
            console.error("Logo upload failed:", error)
            setError(error instanceof Error ? error.message : "Logo upload failed. Please try again.")
            setLogoPreview(null)
            setLogoUrl(null)
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleStudentProceedClick = async () => {
        setError("")

        if (!dob) {
            setError("Please enter your date of birth")
            return
        }

        if (!ageValid) {
            setError("According to Bulgarian law, you must be at least 16 years old to use this platform")
            return
        }

        try {
            const formData = new FormData()
            formData.append("role", "student")
            formData.append("dob", dob)

            const res = await completeOnboarding(formData)

            if (res?.createdPortfolioId) {
                setCreatedPortfolioId(res.createdPortfolioId)
                setShowStudentPolicyModal(true)
            } else {
                setError(res?.error || "Unknown error creating portfolio")
            }
        } catch (err) {
            console.error(err)
            setError("Error creating portfolio")
        }
    }

    const handleAcceptStudentPolicies = async () => {
        if (!createdPortfolioId) {
            setError("Portfolio not created yet")
            return
        }

        try {
            const res = await fetch("/api/student/accept-policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    portfolioId: createdPortfolioId,
                    tosAccepted: studentTosChecked,
                    privacyAccepted: studentPrivacyChecked,
                }),
            })

            let data: { error?: string } | null = null
            try {
                data = await res.json()
            } catch {
                // If response is empty or invalid JSON, skip
                console.warn("⚠️ API returned non-JSON or empty response")
            }

            if (!res.ok) {
                const msg = data?.error || `Request failed with status ${res.status}`
                throw new Error(msg)
            }

            setStudentPolicyAccepted(true)
            setShowStudentPolicyModal(false)
        } catch (err) {
            console.error("❌ handleAcceptStudentPolicies error:", err)
            setError(err instanceof Error ? err.message : "Failed to accept policies")
        }
    }

    const handleProceedClick = async () => {
        setError("")

        if (selectedRole !== "company") return

        // Use controlled state values instead of DOM queries
        const result = companySchema.safeParse({
            companyEik: eik,
            companyName,
            companyDescription,
            companyLocation,
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
            formData.append("companyDescription", companyDescription)
            formData.append("companyLocation", companyLocation)
            if (logoUrl) {
                formData.append("companyLogoHidden", logoUrl)
            }

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

            let data: { error?: string } | null = null
            try {
                data = await res.json()
            } catch {
                console.warn("⚠️ API returned non-JSON or empty response")
            }

            if (!res.ok) {
                const msg = data?.error || `Request failed with status ${res.status}`
                throw new Error(msg)
            }

            setPolicyAccepted(true)
            setShowPolicyModal(false)
        } catch (err) {
            console.error("❌ handleAcceptPolicies error:", err)
            setError(err instanceof Error ? err.message : "Failed to accept policies")
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")

        const formData = new FormData(e.currentTarget)
        const role = formData.get("role")

        if (role === "student" && !studentPolicyAccepted) {
            setError("You must accept the policy before continuing")
            return
        }

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
        if (selectedRole === "student") {
            if (!studentPolicyAccepted) return 1
            return 2
        }
        if (selectedRole === "company" && !policyAccepted) return 1
        if (selectedRole === "company" && policyAccepted) return 2
        if (selectedRole === "team_member") {
            if (!codeValid || !companyPreview) return 1
            return 2
        }
        return 1
    }

    const progressStep = getProgressStep()
    const totalSteps = selectedRole === "student" ? 3 : selectedRole === "company" ? 3 : selectedRole === "team_member" ? 2 : 2

    // Show loading state while Clerk is loading
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                </div>

                <div className="relative flex flex-col items-center gap-8 max-w-md text-center px-6">
                    {/* Animated logo */}
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-primary/30 shadow-xl shadow-primary/20">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        </div>
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-foreground">Preparing your journey</h2>
                        <p className="text-muted-foreground text-balance leading-relaxed">
                            Setting up your personalized onboarding experience...
                        </p>
                    </div>

                    {/* Loading bar */}
                    <div className="w-full max-w-xs">
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-gradient-to-r from-primary to-purple-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
            {/* Background matching landing page style */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Animated Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30" />
                
                {/* Dynamic Gradient Overlay - purple/blue theme */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
                            radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)
                        `,
                    }}
                />
            </div>
            
            {/* Floating dots - matching landing page */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-gradient-to-r from-purple-400/60 to-blue-400/60 rounded-full animate-pulse"
                        style={{
                            left: `${10 + (i * 8) % 80}%`,
                            top: `${15 + (i * 7) % 70}%`,
                            animationDelay: `${i * 0.4}s`,
                            animationDuration: `${3 + i * 0.3}s`,
                        }}
                    />
                ))}
            </div>
            
            <div className="relative z-10 p-6 md:p-8 lg:p-12">
                <div className="max-w-5xl mx-auto mb-12 text-center space-y-6">
    
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                            Let&apos;s get you started
                        </span>
                    </div>
                    
                    {/* Main heading with gradient */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
                            <span className="block text-foreground">Welcome to</span>
                            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                                LynkSkill
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                            Choose your role to get started and unlock your potential in our community
                        </p>
                    </div>

                    {selectedRole && (
                        <div className="flex items-center justify-center gap-3 pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3 px-5 py-3 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full">
                                {Array.from({ length: totalSteps }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div
                                            className={`flex items-center justify-center w-9 h-9 rounded-full font-semibold text-sm transition-all duration-500 ${
                                                i < progressStep
                                                    ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                                                    : i === progressStep
                                                        ? "bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/40"
                                                        : "bg-muted/50 text-muted-foreground"
                                            }`}
                                        >
                                            {i < progressStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
                                        </div>
                                        {i < totalSteps - 1 && (
                                            <div className={`h-0.5 w-8 md:w-12 rounded-full transition-all duration-500 ${
                                                i < progressStep ? "bg-gradient-to-r from-purple-500 to-blue-500" : "bg-muted/50"
                                            }`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-10">
                    <input type="hidden" name="role" value={selectedRole ?? ""} />
                    <input type="hidden" name="dob" value={dob} />
                    <input type="hidden" name="invitationCode" value={invitationCode.join("-")} />

                    <div className="space-y-6">
                        <div className="text-center space-y-3 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Select Your Role</h2>
                            <p className="text-muted-foreground text-lg">Choose the option that best describes you</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {ROLE_OPTIONS.map((r, index) => {
                                const Icon = r.icon
                                const isSelected = selectedRole === r.value
                                return (
                                    <Card
                                        key={r.value}
                                        onClick={() => setSelectedRole(r.value)}
                                        className={`cursor-pointer transition-all duration-300 group relative overflow-hidden border animate-in fade-in slide-in-from-bottom-4 ${
                                            isSelected
                                                ? "ring-2 ring-purple-500 shadow-lg border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5"
                                                : "hover:ring-1 hover:ring-purple-400/50 hover:shadow-md hover:-translate-y-1 border-border/50 bg-background/80"
                                        }`}
                                        style={{ animationDelay: `${200 + index * 100}ms` }}
                                    >
                                        <CardHeader className="space-y-5 relative z-10 p-6">
                                            <div className="flex justify-between items-start">
                                                <div
                                                    className={`p-4 rounded-xl transition-all duration-300 ${
                                                        isSelected
                                                            ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                                                            : "bg-muted/50 group-hover:bg-purple-500/10"
                                                    }`}
                                                >
                                                    <Icon className="w-8 h-8" />
                                                </div>
                                                {isSelected && (
                                                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 px-3 py-1">
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                        Selected
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${isSelected ? "bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" : ""}`}>
                                                    {r.title}
                                                </CardTitle>
                                                <CardDescription className="leading-relaxed text-sm text-muted-foreground">
                                                    {r.description}
                                                </CardDescription>
                                            </div>
                                            
                                            {/* Arrow indicator */}
                                            <div className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 ${isSelected ? "text-purple-400 translate-x-1" : "text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-1"}`}>
                                                <span>Get started</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </CardHeader>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {selectedRole === "student" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="text-center space-y-3 mb-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                                    <GraduationCap className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Step 2 of 3</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Student Information</h2>
                                <p className="text-muted-foreground">Provide your details to create your portfolio</p>
                            </div>

                            <Card className="border border-border/50 overflow-hidden bg-background/80">
                                <CardHeader className="space-y-2 border-b border-border/50 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                                            <GraduationCap className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Personal Details</CardTitle>
                                            <CardDescription>
                                                All fields marked with <span className="text-purple-400 font-semibold"> * </span> are required
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 pt-6 pb-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-purple-400" />
                                            <Label htmlFor="dob" className="font-semibold flex items-center gap-2">
                                                Date of Birth <span className="text-destructive">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="dob"
                                            type="date"
                                            value={dob}
                                            onChange={(e) => handleDobChange(e.target.value)}
                                            required
                                            min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split("T")[0]}
                                            max={new Date().toISOString().split("T")[0]}
                                            className="h-12 border focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                                        />
                                        {ageValid === true && calculatedAge !== null && (
                                            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-500">
                                                        Age Verified: {calculatedAge} years old
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {ageValid === false && (
                                            <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                                                <div className="p-2 bg-destructive/20 rounded-full">
                                                    <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-red-400">Age Requirement Not Met</p>
                                                    <p className="text-xs text-red-400/80">
                                                        According to Bulgarian law, you must be at least 16 years old to use this platform
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            According to Bulgarian law, you must be at least 16 years old to create an account
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                    {!studentPolicyAccepted && (
                                        <Button
                                            type="button"
                                            onClick={handleStudentProceedClick}
                                            disabled={!ageValid}
                                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                                        >
                                            <Shield className="mr-2 w-5 h-5" />
                                            Proceed to Policy Agreement
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    )}

                                    {studentPolicyAccepted && (
                                        <div className="flex items-center gap-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl animate-in fade-in zoom-in duration-500">
                                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-purple-400 font-semibold">Policy Accepted</p>
                                                <p className="text-xs text-muted-foreground">
                                                    You&apos;re ready to complete your registration
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {selectedRole === "company" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="text-center space-y-3 mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                                    <Building2 className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Step 2 of 3</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Company Information</h2>
                                <p className="text-muted-foreground">Provide your company details for verification</p>
                            </div>

                            <Card className="border border-white/10 overflow-hidden bg-background/80 backdrop-blur-sm">
                                <CardHeader className="space-y-2 border-b border-white/10 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Company Details</CardTitle>
                                            <CardDescription className="text-sm">
                                                All fields marked with <span className="text-purple-400 font-semibold"> * </span> are required
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 pt-6 pb-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Upload className="w-4 h-4 text-purple-400" />
                                            <Label htmlFor="companyLogo" className="text-base font-semibold flex items-center gap-2">
                                                Company Logo <span className="text-red-400">*</span>
                                            </Label>
                                        </div>
                                        <div className="flex flex-col md:flex-row items-start gap-4">
                                            <div className="flex-1 w-full">
                                                <div
                                                    className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 bg-background/50 ${
                                                        isUploadingLogo
                                                            ? "border-purple-500 bg-purple-500/5"
                                                            : "border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5"
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
                                                        className="file:mr-4 file:px-4 file:py-1.5 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-purple-500 file:to-blue-500 file:text-white file:text-sm file:font-medium file:cursor-pointer"
                                                    />
                                                </div>
                                                {isUploadingLogo && (
                                                    <div className="flex items-center gap-2 mt-3 p-2 bg-purple-500/10 rounded-lg animate-pulse">
                                                        <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                                        <span className="text-sm text-purple-400">
                                                            Uploading your logo...
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Upload your company logo in PNG or JPG format (maximum 5MB)
                                                </p>
                                            </div>
                                            {logoPreview && !isUploadingLogo && (
                                                <div className="flex-shrink-0 animate-in fade-in zoom-in duration-500">
                                                    <div className="relative p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                                        <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={logoPreview}
                                                                alt="Logo preview"
                                                                fill
                                                                className="object-contain"
                                                                unoptimized
                                                            />
                                                        </div>
                                                        <div className="absolute -top-2 -right-2 p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
                                                            <CheckCircle className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-purple-400" />
                                            <Label htmlFor="companyEik" className="text-base font-semibold flex items-center gap-2">
                                                EIK (BULSTAT) <span className="text-red-400">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyEik"
                                            name="companyEik"
                                            value={eik}
                                            onChange={(e) => handleEikChange(e.target.value)}
                                            required
                                            className="text-base h-12 border border-white/20 focus:border-purple-500 bg-background/50 transition-all duration-300 rounded-lg"
                                            placeholder="Enter your company EIK number"
                                        />
                                        {companyValid === true && (
                                            <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg animate-in fade-in slide-in-from-top-3 duration-500">
                                                <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-purple-400">
                                                        EIK Verified Successfully
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {companyValid === false && (
                                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-3 duration-500">
                                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-400">EIK Not Found</p>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Enter your 9-13 digit Bulgarian company identification number
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-purple-400" />
                                            <Label htmlFor="companyName" className="text-base font-semibold flex items-center gap-2">
                                                Company Name <span className="text-red-400">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyName"
                                            name="companyName"
                                            value={companyName}
                                            onChange={(e) => {
                                                setCompanyName(e.target.value)
                                                validateField("companyName", e.target.value)
                                            }}
                                            required
                                            className={`text-base h-12 border bg-background/50 transition-all duration-300 rounded-lg ${
                                                fieldErrors.companyName 
                                                    ? "border-red-500 focus:border-red-500" 
                                                    : companyName.length >= 2 
                                                        ? "border-purple-500 focus:border-purple-500" 
                                                        : "border-white/20 focus:border-purple-500"
                                            }`}
                                            placeholder="Enter your company's official name"
                                        />
                                        {fieldErrors.companyName ? (
                                            <p className="text-sm text-red-400 flex items-center gap-1">
                                                <XCircle className="w-4 h-4" />
                                                {fieldErrors.companyName}
                                            </p>
                                        ) : companyName.length >= 2 ? (
                                            <p className="text-sm text-purple-400 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Company name looks good
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Provide your company&apos;s full legal name as registered
                                            </p>
                                        )}
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-purple-400" />
                                            <Label htmlFor="companyDescription" className="text-base font-semibold flex items-center gap-2">
                                                Company Description <span className="text-red-400">*</span>
                                            </Label>
                                        </div>
                                        <Textarea
                                            id="companyDescription"
                                            name="companyDescription"
                                            value={companyDescription}
                                            onChange={(e) => {
                                                setCompanyDescription(e.target.value)
                                                validateField("companyDescription", e.target.value)
                                            }}
                                            required
                                            placeholder="Tell us about your company, what you do, and what makes you unique..."
                                            className={`min-h-28 text-base resize-none border bg-background/50 transition-all duration-300 rounded-lg ${
                                                fieldErrors.companyDescription 
                                                    ? "border-red-500 focus:border-red-500" 
                                                    : companyDescription.length >= 10 
                                                        ? "border-purple-500 focus:border-purple-500" 
                                                        : "border-white/20 focus:border-purple-500"
                                            }`}
                                        />
                                        <div className="flex items-center justify-between">
                                            {fieldErrors.companyDescription ? (
                                                <p className="text-sm text-red-400 flex items-center gap-1">
                                                    <XCircle className="w-4 h-4" />
                                                    {fieldErrors.companyDescription}
                                                </p>
                                            ) : companyDescription.length >= 10 ? (
                                                <p className="text-sm text-purple-400 flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Description looks good
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Minimum 10 characters - help others understand your business
                                                </p>
                                            )}
                                            <span className={`text-sm font-medium ${companyDescription.length >= 10 ? "text-purple-400" : "text-muted-foreground"}`}>
                                                {companyDescription.length}/10 min
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-purple-400" />
                                            <Label htmlFor="companyLocation" className="text-base font-semibold flex items-center gap-2">
                                                Location <span className="text-red-400">*</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyLocation"
                                            name="companyLocation"
                                            value={companyLocation}
                                            onChange={(e) => {
                                                setCompanyLocation(e.target.value)
                                                validateField("companyLocation", e.target.value)
                                            }}
                                            required
                                            placeholder="e.g., Sofia, Bulgaria"
                                            className={`text-base h-12 border bg-background/50 transition-all duration-300 rounded-lg ${
                                                fieldErrors.companyLocation 
                                                    ? "border-red-500 focus:border-red-500" 
                                                    : companyLocation.length >= 2 
                                                        ? "border-purple-500 focus:border-purple-500" 
                                                        : "border-white/20 focus:border-purple-500"
                                            }`}
                                        />
                                        {fieldErrors.companyLocation ? (
                                            <p className="text-sm text-red-400 flex items-center gap-1">
                                                <XCircle className="w-4 h-4" />
                                                {fieldErrors.companyLocation}
                                            </p>
                                        ) : companyLocation.length >= 2 ? (
                                            <p className="text-sm text-purple-400 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Location looks good
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Where is your company headquartered?
                                            </p>
                                        )}
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-purple-400" />
                                            <Label htmlFor="companyWebsite" className="text-base font-semibold">
                                                Website <span className="text-muted-foreground font-normal text-sm">(optional)</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="companyWebsite"
                                            name="companyWebsite"
                                            type="url"
                                            placeholder="https://www.yourcompany.com"
                                            className="text-base h-12 border border-white/20 focus:border-purple-500 bg-background/50 transition-all duration-300 rounded-lg"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Share your company website if you have one
                                        </p>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                                    {!policyAccepted && (
                                        <Button
                                            type="button"
                                            onClick={handleProceedClick}
                                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 transition-all duration-300 rounded-xl"
                                        >
                                            <Shield className="mr-2 w-5 h-5" />
                                            Proceed to Policy Agreement
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    )}

                                    {policyAccepted && (
                                        <div className="flex items-center gap-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl animate-in fade-in zoom-in duration-500">
                                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-purple-400 font-semibold">Policy Accepted</p>
                                                <p className="text-xs text-muted-foreground">
                                                    You&apos;re ready to complete your registration
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {selectedRole === "team_member" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="text-center space-y-3 mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                                    <Users className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Step 2 of 2</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Join Your Team</h2>
                                <p className="text-muted-foreground">Enter the invitation code provided by your company</p>
                            </div>

                            <Card className="border border-white/10 overflow-hidden bg-background/80 backdrop-blur-sm">
                                <CardHeader className="space-y-2 border-b border-white/10 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                                            <KeyRound className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">Invitation Code</CardTitle>
                                            <CardDescription className="text-sm">
                                                Enter the 16-character code in format XXXX-XXXX-XXXX-XXXX
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 pt-6 pb-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-2 md:gap-3">
                                            {[0, 1, 2, 3].map((index) => (
                                                <div key={index} className="flex items-center gap-2 md:gap-3">
                                                    <Input
                                                        ref={(el) => { codeInputRefs.current[index] = el }}
                                                        value={invitationCode[index]}
                                                        onChange={(e) => handleCodeSegmentChange(index, e.target.value)}
                                                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                                        onPaste={index === 0 ? handleCodePaste : undefined}
                                                        maxLength={4}
                                                        className="w-16 md:w-20 h-12 md:h-14 text-center text-lg md:text-xl font-mono font-bold tracking-wider uppercase border border-white/20 focus:border-purple-500 bg-background/50 transition-all duration-300 rounded-lg"
                                                        placeholder="XXXX"
                                                    />
                                                    {index < 3 && (
                                                        <span className="text-2xl text-muted-foreground font-bold">-</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {codeValidating && (
                                            <div className="flex items-center justify-center gap-2 p-3 bg-purple-500/10 rounded-lg animate-pulse">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                                <span className="text-sm text-purple-400">Validating code...</span>
                                            </div>
                                        )}

                                        {codeValid === true && companyPreview && (
                                            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl animate-in fade-in zoom-in duration-500">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <CheckCircle className="w-5 h-5 text-purple-400" />
                                                    <span className="text-sm font-semibold text-purple-400">Valid Code - Company Found</span>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    {companyPreview.logo ? (
                                                        <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                                            <Image
                                                                src={companyPreview.logo}
                                                                alt={companyPreview.name}
                                                                fill
                                                                className="object-contain"
                                                                unoptimized
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                            <Building2 className="w-8 h-8 text-purple-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-bold text-foreground truncate">{companyPreview.name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{companyPreview.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                            <Users className="w-4 h-4" />
                                                            <span>{companyPreview.memberCount} team members</span>
                                                        </div>
                                                        {companyPreview.description && (
                                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                                {companyPreview.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {codeValid === false && (
                                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-3 duration-500">
                                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-400">Invalid Code</p>
                                                    <p className="text-xs text-red-400/80">{error || "Please check your code and try again"}</p>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-sm text-muted-foreground text-center">
                                            Ask your company administrator for the invitation code to join the team
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <StudentPolicyModal
                        open={showStudentPolicyModal}
                        onOpenChange={setShowStudentPolicyModal}
                        portfolioId={createdPortfolioId}
                        onAccept={handleAcceptStudentPolicies}
                        tosChecked={studentTosChecked}
                        privacyChecked={studentPrivacyChecked}
                        onTosChange={setStudentTosChecked}
                        onPrivacyChange={setStudentPrivacyChecked}
                    />

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
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-3 duration-500">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-400 font-semibold text-sm">Error</p>
                                    <p className="text-red-400/80 text-sm mt-0.5">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center pt-6">
                        <Button
                            type="submit"
                            disabled={
                                !selectedRole ||
                                isPending ||
                                (selectedRole === "company" && !policyAccepted) ||
                                (selectedRole === "student" && !studentPolicyAccepted) ||
                                (selectedRole === "team_member" && (!codeValid || !companyPreview))
                            }
                            size="lg"
                            className="min-w-72 h-14 text-white text-base font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-[size:200%] hover:bg-[position:100%_0] shadow-lg shadow-purple-500/20 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    {selectedRole === "team_member" ? "Joining Team..." : "Processing..."}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {selectedRole === "team_member" ? "Join Team" : "Complete Registration"}
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
