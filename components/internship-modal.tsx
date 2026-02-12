"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { motion, AnimatePresence } from "framer-motion"
import type { Internship } from "@/app/types"
import {
    Briefcase,
    MapPin,
    FileText,
    GraduationCap,
    Euro,
    CheckCircle,
    AlertCircle,
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ClipboardList,
    Check,
    ScrollText,
} from "lucide-react"
import { format, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { LocationPicker, type LocationData } from "@/components/location-picker"
import { useTranslation } from "@/lib/i18n"

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
    applicationStart?: string[]
    applicationEnd?: string[]
    testAssignmentTitle?: string[]
    testAssignmentDescription?: string[]
    testAssignmentDueDate?: string[]
}

interface FormValues {
    title: string
    description: string
    location: LocationData
    qualifications: string
    salary: string
    paid: boolean
    requiresCoverLetter: boolean
    testAssignmentTitle: string
    testAssignmentDescription: string
    testAssignmentDueDate?: Date
    applicationStart?: Date
    applicationEnd?: Date
}

const INITIAL_FORM_STATE: FormValues = {
    title: "",
    description: "",
    location: { address: "", latitude: 0, longitude: 0 },
    qualifications: "",
    salary: "",
    paid: false,
    requiresCoverLetter: false,
    testAssignmentTitle: "",
    testAssignmentDescription: "",
    testAssignmentDueDate: undefined,
    applicationStart: undefined,
    applicationEnd: undefined,
}

const steps = [
    { id: 1, title: "Basic Info", icon: Briefcase, description: "Title & Description" },
    { id: 2, title: "Details", icon: MapPin, description: "Location & Dates" },
    { id: 3, title: "Compensation", icon: Euro, description: "Paid or Unpaid" },
    { id: 4, title: "Assignment", icon: ClipboardList, description: "Optional Test" },
]

export function InternshipModal({ open, onClose, onCreate }: InternshipModalProps) {
    const { t } = useTranslation()
    const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_STATE)
    const [errors, setErrors] = useState<Errors>({})
    const [isLoading, setIsLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    const updateField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
        setFormValues((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => (prev[key as keyof Errors] ? { ...prev, [key]: undefined } : prev))
    }, [])

    const resetForm = useCallback(() => {
        setFormValues(INITIAL_FORM_STATE)
        setErrors({})
        setCurrentStep(1)
    }, [])

    const handleClose = useCallback(() => {
        resetForm()
        onClose()
    }, [onClose, resetForm])

    const today = useMemo(() => startOfDay(new Date()), [])

    const validateStep = useCallback((step: number): boolean => {
        const newErrors: Errors = {}

        if (step === 1) {
            if (!formValues.title || formValues.title.length < 3) {
                newErrors.title = [t("internshipModal.titleMinChars")]
            }
            if (!formValues.description || formValues.description.length < 10) {
                newErrors.description = [t("internshipModal.descriptionMinChars")]
            }
        }

        if (step === 2) {
            if (!formValues.location.address || formValues.location.address.length < 2) {
                newErrors.location = [t("internshipModal.locationMinChars")]
            }
            if (!formValues.applicationStart) {
                newErrors.applicationStart = [t("internshipModal.startDateRequired")]
            }
            if (!formValues.applicationEnd) {
                newErrors.applicationEnd = [t("internshipModal.endDateRequired")]
            }
            const start = formValues.applicationStart ? startOfDay(formValues.applicationStart) : undefined
            const end = formValues.applicationEnd ? startOfDay(formValues.applicationEnd) : undefined
            if (start && start < today) {
                newErrors.applicationStart = [t("internshipModal.startDatePast")]
            }
            if (end && end < today) {
                newErrors.applicationEnd = [t("internshipModal.endDatePast")]
            }
            if (start && end && start > end) {
                newErrors.applicationEnd = [t("internshipModal.endAfterStart")]
            }
        }

        if (step === 3) {
            if (formValues.paid && (!formValues.salary || Number.parseFloat(formValues.salary) <= 0)) {
                newErrors.salary = [t("internshipModal.salaryRequired")]
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return false
        }
        return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formValues, today])

    const handleNext = useCallback(() => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 4))
        }
    }, [currentStep, validateStep])

    const handleBack = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 1))
    }, [])

    const handleSubmit = useCallback(async () => {
        // Validate all steps
        for (let step = 1; step <= 3; step++) {
            if (!validateStep(step)) {
                setCurrentStep(step)
                return
            }
        }

        setIsLoading(true)

        try {
            const body = {
                title: formValues.title,
                description: formValues.description,
                location: formValues.location.address,
                latitude: formValues.location.latitude || null,
                longitude: formValues.location.longitude || null,
                qualifications: formValues.qualifications || null,
                paid: formValues.paid,
                salary: formValues.paid && formValues.salary ? Number.parseFloat(formValues.salary) : null,
                applicationStart: formValues.applicationStart?.toISOString().split("T")[0] ?? "",
                applicationEnd: formValues.applicationEnd?.toISOString().split("T")[0] ?? "",
                requiresCoverLetter: formValues.requiresCoverLetter,
                testAssignmentTitle: formValues.testAssignmentTitle || null,
                testAssignmentDescription: formValues.testAssignmentDescription || null,
                testAssignmentDueDate: formValues.testAssignmentDueDate?.toISOString().split("T")[0] ?? null,
            }

            const res = await fetch("/api/internships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                const data: Internship = await res.json()
                onCreate(data)
                resetForm()
                onClose()
            } else {
                const errData = await res.json().catch(() => ({}))
                console.error("API Error:", errData)
                alert(errData.message || errData.errors ? JSON.stringify(errData.errors) : t("internshipModal.failedToCreate"))
            }
        } catch (error) {
            console.error(error)
            alert(t("internshipModal.failedToCreate"))
        } finally {
            setIsLoading(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formValues, onCreate, onClose, resetForm, validateStep])

    const disableStartDate = useCallback(
        (date: Date) => startOfDay(date) < today,
        [today]
    )

    const disableEndDate = useCallback(
        (date: Date) => {
            const d = startOfDay(date)
            if (d < today) return true
            if (formValues.applicationStart && d < startOfDay(formValues.applicationStart)) return true
            return false
        },
        [formValues.applicationStart, today]
    )

    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <motion.div
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                                currentStep === step.id
                                    ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30"
                                    : currentStep > step.id
                                        ? "bg-emerald-500 text-white"
                                        : "bg-muted text-muted-foreground"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {currentStep > step.id ? (
                                <Check className="h-5 w-5" />
                            ) : (
                                <step.icon className="h-5 w-5" />
                            )}
                        </motion.div>
                        <span className={cn(
                            "text-xs mt-2 font-medium hidden sm:block",
                            currentStep === step.id ? "text-primary" : "text-muted-foreground"
                        )}>
                            {step.title}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={cn(
                            "flex-1 h-1 mx-2 rounded-full transition-colors duration-300",
                            currentStep > step.id ? "bg-emerald-500" : "bg-muted"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    )

    const renderStep1 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4">
                    <Briefcase className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold">{t("internshipModal.basicInformation")}</h3>
                <p className="text-sm text-muted-foreground">{t("internshipModal.tellUsAbout")}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <Briefcase className="h-4 w-4 text-purple-500" />
                        {t("internshipModal.internshipTitle")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={formValues.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder={t("internshipModal.titlePlaceholder")}
                        className={cn(
                            "h-12 rounded-xl border-2 transition-all",
                            errors.title ? "border-red-500" : "border-border focus:border-purple-500"
                        )}
                    />
                    {errors.title && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.title[0]}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-purple-500" />
                        {t("internshipModal.description")} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        value={formValues.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        placeholder={t("internshipModal.descriptionPlaceholder")}
                        className={cn(
                            "min-h-[150px] rounded-xl border-2 transition-all resize-none",
                            errors.description ? "border-red-500" : "border-border focus:border-purple-500"
                        )}
                    />
                    {errors.description && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.description[0]}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    )

    const renderStep2 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
        >
            <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-3">
                    <MapPin className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">{t("internshipModal.locationTimeline")}</h3>
                <p className="text-sm text-muted-foreground">{t("internshipModal.whereAndWhen")}</p>
            </div>

            {/* Location Section */}
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-4 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {t("internshipModal.internshipLocation")} <span className="text-red-500">*</span>
                </Label>
                <LocationPicker
                    value={formValues.location}
                    onChange={(loc) => updateField("location", loc)}
                    error={errors.location?.[0]}
                    required
                    mapHeight={180}
                />
                {errors.location && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.location[0]}
                    </p>
                )}
            </div>

            {/* Qualifications - Full Width */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    {t("internshipModal.qualifications")}
                </Label>
                <Input
                    value={formValues.qualifications}
                    onChange={(e) => updateField("qualifications", e.target.value)}
                    placeholder={t("internshipModal.qualificationsPlaceholder")}
                    className="h-11 rounded-xl border-2 border-border focus:border-blue-500 transition-all"
                />
            </div>

            {/* Timeline - Two Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        {t("internshipModal.applicationsOpen")} <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-11 justify-start rounded-xl border-2 transition-all",
                                    errors.applicationStart ? "border-red-500" : "border-border hover:border-blue-500"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formValues.applicationStart ? (
                                    format(formValues.applicationStart, "PPP")
                                ) : (
                                    <span className="text-muted-foreground">{t("internshipModal.pickDate")}</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={formValues.applicationStart}
                                onSelect={(date) => updateField("applicationStart", date)}
                                initialFocus
                                disabled={disableStartDate}
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.applicationStart && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.applicationStart[0]}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        {t("internshipModal.applicationsClose")} <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-11 justify-start rounded-xl border-2 transition-all",
                                    errors.applicationEnd ? "border-red-500" : "border-border hover:border-blue-500"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formValues.applicationEnd ? (
                                    format(formValues.applicationEnd, "PPP")
                                ) : (
                                    <span className="text-muted-foreground">{t("internshipModal.pickDate")}</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={formValues.applicationEnd}
                                onSelect={(date) => updateField("applicationEnd", date)}
                                initialFocus
                                disabled={disableEndDate}
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.applicationEnd && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.applicationEnd[0]}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    )

    const renderStep3 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 mb-4">
                    <Euro className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold">{t("internshipModal.compensation")}</h3>
                <p className="text-sm text-muted-foreground">{t("internshipModal.isPaidInternship")}</p>
            </div>

            <div className="space-y-6">
                <div
                    className={cn(
                        "p-6 rounded-2xl border-2 transition-all cursor-pointer",
                        formValues.paid
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-border hover:border-emerald-500/50"
                    )}
                    onClick={() => updateField("paid", !formValues.paid)}
                >
                    <div className="flex items-center gap-4">
                        <Checkbox
                            checked={formValues.paid}
                            onCheckedChange={(val) => updateField("paid", !!val)}
                            className="h-6 w-6 rounded-lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Euro className="h-5 w-5 text-emerald-500" />
                                <span className="font-semibold">{t("internshipModal.paidInternship")}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("internshipModal.internsReceiveCompensation")}
                            </p>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {formValues.paid && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                        >
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Euro className="h-4 w-4 text-emerald-500" />
                                {t("internshipModal.monthlySalaryBGN")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formValues.salary}
                                onChange={(e) => updateField("salary", e.target.value)}
                                type="number"
                                placeholder={t("internshipModal.salaryPlaceholder")}
                                className={cn(
                                    "h-12 rounded-xl border-2 transition-all",
                                    errors.salary ? "border-red-500" : "border-border focus:border-emerald-500"
                                )}
                            />
                            {errors.salary && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> {errors.salary[0]}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!formValues.paid && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-sm text-muted-foreground text-center">
                            {t("internshipModal.unpaidTip")}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    )

    const renderStep4 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 mb-4">
                    <ClipboardList className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold">{t("internshipModal.requirementsAndAssignment")}</h3>
                <p className="text-sm text-muted-foreground">{t("internshipModal.coverLetterAndTest")}</p>
            </div>

            {/* Cover Letter Requirement Toggle */}
            <div className="p-5 rounded-2xl border-2 space-y-2 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="requiresCoverLetter"
                        checked={formValues.requiresCoverLetter}
                        onCheckedChange={(val) => updateField("requiresCoverLetter", !!val)}
                        className="h-5 w-5 rounded-md"
                    />
                    <div>
                        <Label htmlFor="requiresCoverLetter" className="flex items-center gap-2 cursor-pointer font-medium">
                            <ScrollText className="h-4 w-4 text-indigo-500" />
                            {t("internshipModal.requireCoverLetter")}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("internshipModal.coverLetterDescription")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-muted-foreground">{t("internshipModal.testAssignmentOptional")}</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-orange-500" />
                        {t("internshipModal.assignmentTitle")}
                    </Label>
                    <Input
                        value={formValues.testAssignmentTitle}
                        onChange={(e) => updateField("testAssignmentTitle", e.target.value)}
                        placeholder={t("internshipModal.assignmentTitlePlaceholder")}
                        className="h-12 rounded-xl border-2 border-border focus:border-orange-500 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-orange-500" />
                        {t("internshipModal.assignmentDescription")}
                    </Label>
                    <Textarea
                        value={formValues.testAssignmentDescription}
                        onChange={(e) => updateField("testAssignmentDescription", e.target.value)}
                        placeholder={t("internshipModal.assignmentDescPlaceholder")}
                        className="min-h-[120px] rounded-xl border-2 border-border focus:border-orange-500 transition-all resize-none"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        <CalendarIcon className="h-4 w-4 text-orange-500" />
                        {t("internshipModal.dueDate")}
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-12 justify-start rounded-xl border-2 border-border hover:border-orange-500 transition-all"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formValues.testAssignmentDueDate ? (
                                    format(formValues.testAssignmentDueDate, "PPP")
                                ) : (
                                    <span className="text-muted-foreground">{t("internshipModal.pickDateOptional")}</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={formValues.testAssignmentDueDate}
                                onSelect={(date) => updateField("testAssignmentDueDate", date)}
                                initialFocus
                                disabled={(date) => {
                                    const d = startOfDay(date)
                                    if (d < today) return true
                                    if (formValues.applicationStart && d < startOfDay(formValues.applicationStart)) return true
                                    if (formValues.applicationEnd && d > startOfDay(formValues.applicationEnd)) return true
                                    return false
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {!formValues.testAssignmentTitle && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-sm text-muted-foreground text-center">
                            {t("internshipModal.assignmentTip")}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    )

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-0">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-br from-purple-600 to-blue-600 px-8 py-6 rounded-t-3xl">
                    <DialogHeader className="relative">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-white">
                            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            {t("internshipModal.createNewInternship")}
                        </DialogTitle>
                        <p className="text-white/80 text-sm">{t("internshipModal.step")} {currentStep} {t("internshipModal.of")} {steps.length}: {steps[currentStep - 1].title}</p>
                    </DialogHeader>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="p-8">
                    {renderStepIndicator()}

                    <AnimatePresence mode="wait">
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                        {currentStep === 4 && renderStep4()}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <DialogFooter className="px-8 pb-8 flex gap-3">
                    {currentStep > 1 && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="h-12 px-6 rounded-xl"
                            disabled={isLoading}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            {t("internshipModal.back")}
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="h-12 px-6 rounded-xl"
                        disabled={isLoading}
                    >
                        {t("internshipModal.cancel")}
                    </Button>
                    {currentStep < 4 ? (
                        <Button
                            onClick={handleNext}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
                        >
                            {t("internshipModal.next")}
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    {t("internshipModal.creating")}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {t("internshipModal.createInternship")}
                                </div>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
