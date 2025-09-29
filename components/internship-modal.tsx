"use client"

import type React from "react"
import { useRef, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { ComponentType, SVGProps } from "react";
import { motion, AnimatePresence } from "framer-motion"
import { Internship } from "@/app/types"
import {
    Briefcase,
    MapPin,
    FileText,
    GraduationCap,
    DollarSign,
    CheckCircle,
    AlertCircle,
    Sparkles,
} from "lucide-react"

interface InternshipFormData  {
    title: string
    description: string
    location: string
    qualifications: string | null
    paid: boolean
    salary: number | null
}

interface InternshipModalProps {
    open: boolean
    onClose: () => void
    onCreate: (internship: Internship) => void
}

interface Errors {
    title?: string[]
    description?: string[]
    location?: string[]
    qualifications?: string[]
    paid?: string[]
    salary?: string[]
}

export function InternshipModal({ open, onClose, onCreate }: InternshipModalProps) {
    // Use refs for the form fields so the inputs stay uncontrolled (caret won't jump)
    const titleRef = useRef<HTMLInputElement | null>(null)
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
    const locationRef = useRef<HTMLInputElement | null>(null)
    const qualificationsRef = useRef<HTMLInputElement | null>(null)
    const salaryRef = useRef<HTMLInputElement | null>(null)

    // UI state
    const [paid, setPaid] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const [isLoading, setIsLoading] = useState(false)

    // Helper to read current values from refs
    const readValues = useCallback(() => {
        return {
            title: titleRef.current?.value ?? "",
            description: descriptionRef.current?.value ?? "",
            location: locationRef.current?.value ?? "",
            qualifications: qualificationsRef.current?.value ?? "",
            paid,
            salary: salaryRef.current?.value ?? "",
        }
    }, [paid])

    async function handleSubmit() {
        setIsLoading(true)
        setErrors({})

        const vals = readValues()
        const newErrors: Errors = {}

        if (!vals.title || vals.title.length < 3) {
            newErrors.title = ["Title must be at least 3 characters"]
        }
        if (!vals.description || vals.description.length < 10) {
            newErrors.description = ["Description must be at least 10 characters"]
        }
        if (!vals.location || vals.location.length < 2) {
            newErrors.location = ["Location must be at least 2 characters"]
        }
        if (vals.paid && (!vals.salary || Number.parseFloat(vals.salary) <= 0)) {
            newErrors.salary = ["Salary is required and must be positive for paid internships"]
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            setIsLoading(false)
            return
        }

        try {
            const body = {
                title: vals.title,
                description: vals.description,
                location: vals.location,
                qualifications: vals.qualifications || null,
                paid: vals.paid,
                salary: vals.paid && vals.salary ? Number.parseFloat(vals.salary) : null,
            }

            const res = await fetch("/api/internships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                const data: Internship = await res.json()  // ✅ full type
                onCreate(data)
                onClose()

                // reset uncontrolled inputs by setting their .value directly
                if (titleRef.current) titleRef.current.value = ""
                if (descriptionRef.current) descriptionRef.current.value = ""
                if (locationRef.current) locationRef.current.value = ""
                if (qualificationsRef.current) qualificationsRef.current.value = ""
                if (salaryRef.current) salaryRef.current.value = ""
                setPaid(false)
                setErrors({})
            } else {
                const errData = await res.json().catch(() => ({}))
                alert(errData.message || "Failed to create internship")
            }
        } catch (error) {
            console.error(error)
            alert("Failed to create internship")
        } finally {
            setIsLoading(false)
        }
    }

    // Form field wrapper (keeps same usage)
    const FormField = ({
                           label,
                           icon: Icon,
                           error,
                           children,
                       }: {
        label: string
        icon: ComponentType<SVGProps<SVGSVGElement>>
        error?: string[]
        children: React.ReactNode
    }) => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
            </Label>
            {children}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-sm text-[color:var(--internship-error)]"
                    >
                        <AlertCircle className="h-3 w-3" />
                        {error[0]}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )

    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* keep content mounted so dialog open/close doesn't unmount */}
            <DialogContent forceMount className="max-w-2xl rounded-2xl border-0 bg-gradient-to-br from-[color:var(--internship-modal-gradient-from)] to-[color:var(--internship-modal-gradient-to)] p-0 shadow-2xl">
                <div className="relative overflow-hidden rounded-t-2xl h-full bg-gradient-to-r from-[color:var(--internship-modal-gradient-from)] to-[color:var(--internship-modal-gradient-to)] px-8 py-6">
                    <DialogHeader className="relative">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                            <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            Create New Internship
                            <Sparkles className="h-5 w-5 text-yellow-300" />
                        </DialogTitle>
                        <p className="text-white/80">Fill in the details to create an exciting internship opportunity</p>
                    </DialogHeader>
                </div>

                <div className="bg-card/95 backdrop-blur-sm p-8 rounded-b-2xl">
                    <div className="space-y-6">
                        <FormField label="Internship Title" icon={Briefcase} error={errors.title}>
                            <Input
                                ref={titleRef}
                                defaultValue=""
                                placeholder="e.g., Software Development Intern"
                                className="h-12 rounded-xl border-2 border-border bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-[color:var(--internship-field-focus)] focus:ring-2 focus:ring-[color:var(--internship-field-focus)]/20"
                            />
                        </FormField>

                        <FormField label="Description" icon={FileText} error={errors.description}>
                            <Textarea
                                ref={descriptionRef}
                                defaultValue=""
                                placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                                className="min-h-[120px] rounded-xl border-2 border-border bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-[color:var(--internship-field-focus)] focus:ring-2 focus:ring-[color:var(--internship-field-focus)]/20 resize-none"
                            />
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Location" icon={MapPin} error={errors.location}>
                                <Input
                                    ref={locationRef}
                                    defaultValue=""
                                    placeholder="e.g., San Francisco, CA"
                                    className="h-12 rounded-xl border-2 border-border bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-[color:var(--internship-field-focus)] focus:ring-2 focus:ring-[color:var(--internship-field-focus)]/20"
                                />
                            </FormField>

                            <FormField label="Qualifications (Optional)" icon={GraduationCap} error={errors.qualifications}>
                                <Input
                                    ref={qualificationsRef}
                                    defaultValue=""
                                    placeholder="e.g., Computer Science student"
                                    className="h-12 rounded-xl border-2 border-border bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-[color:var(--internship-field-focus)] focus:ring-2 focus:ring-[color:var(--internship-field-focus)]/20"
                                />
                            </FormField>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="flex items-center space-x-3 rounded-xl bg-muted/50 p-4 backdrop-blur-sm">
                                <Checkbox
                                    checked={paid}
                                    onCheckedChange={(val) => setPaid(!!val)}
                                    className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-[color:var(--internship-field-focus)] data-[state=checked]:border-[color:var(--internship-field-focus)]"
                                />
                                <Label className="flex items-center gap-2 text-base font-medium cursor-pointer">
                                    <DollarSign className="h-4 w-4 text-[color:var(--internship-success)]" />
                                    This is a paid internship
                                </Label>
                            </div>

                            {/* keep salary input mounted to avoid unmount/remount (don't use conditional unmounting) */}
                            <div
                                className={`transition-all duration-200 overflow-hidden ${
                                    paid ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                                }`}
                                aria-hidden={!paid}
                            >
                                <FormField label="Monthly Salary" icon={DollarSign} error={errors.salary}>
                                    <Input
                                        ref={salaryRef}
                                        defaultValue=""
                                        type="number"
                                        placeholder="e.g., 2000"
                                        className="h-12 rounded-xl border-2 border-border bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-[color:var(--internship-field-focus)] focus:ring-2 focus:ring-[color:var(--internship-field-focus)]/20"
                                    />
                                </FormField>
                            </div>
                        </motion.div>
                    </div>

                    <DialogFooter className="mt-8 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-12 px-6 rounded-xl border-2 hover:bg-muted/50 transition-all duration-200 bg-transparent"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-[color:var(--internship-modal-gradient-from)] to-[color:var(--internship-modal-gradient-to)] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Creating...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Create Internship
                                </div>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
