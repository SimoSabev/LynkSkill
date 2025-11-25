// File: `components/internship-modal.tsx`
            "use client"

            import React, {useState, useCallback, useMemo} from "react"
            import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog"
            import {Input} from "@/components/ui/input"
            import {Textarea} from "@/components/ui/textarea"
            import {Button} from "@/components/ui/button"
            import {Label} from "@/components/ui/label"
            import {Checkbox} from "@/components/ui/checkbox"
            import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
            import {Calendar} from "@/components/ui/calendar"
            import type {ComponentType, SVGProps} from "react"
            import {motion, AnimatePresence} from "framer-motion"
            import type {Internship} from "@/app/types"
            import {
                Briefcase,
                MapPin,
                FileText,
                GraduationCap,
                DollarSign,
                CheckCircle,
                AlertCircle,
                CalendarIcon,
            } from "lucide-react"
            import {format, startOfDay} from "date-fns"

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
                location: string
                qualifications: string
                salary: string
                paid: boolean
                testAssignmentTitle: string
                testAssignmentDescription: string
                testAssignmentDueDate?: Date
                applicationStart?: Date
                applicationEnd?: Date
            }

            const INITIAL_FORM_STATE: FormValues = {
                title: "",
                description: "",
                location: "",
                qualifications: "",
                salary: "",
                paid: false,
                testAssignmentTitle: "",
                testAssignmentDescription: "",
                testAssignmentDueDate: undefined,
                applicationStart: undefined,
                applicationEnd: undefined,
            }

            /* Stable style constants to avoid new object each render */
            const ringStyle = {
                "--tw-ring-color": "color-mix(in oklch, var(--internship-field-focus) 20%, transparent)",
            } as React.CSSProperties

            const dialogBorderStyle = {
                borderColor: "color-mix(in oklch, var(--internship-modal-gradient-from) 20%, transparent)",
                boxShadow: "0 25px 50px -12px color-mix(in oklch, var(--internship-modal-gradient-from) 10%, transparent)",
            } as React.CSSProperties

            const dialogHeaderBg = {
                background: "linear-gradient(135deg, var(--internship-modal-gradient-from), var(--internship-modal-gradient-to))",
            } as React.CSSProperties

            type FormFieldProps = {
                label: string
                icon: ComponentType<SVGProps<SVGSVGElement>>
                error?: string[]
                children: React.ReactNode
            }

            /* Moved out and memoized so it doesn't get recreated on every render */
            const FormField = React.memo(function FormField({label, icon: Icon, error, children}: FormFieldProps) {
                return (
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                            <Icon className="h-4 w-4" style={{color: "var(--internship-modal-gradient-from)"}}/>
                            {label}
                        </Label>
                        {children}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: "auto"}}
                                    exit={{opacity: 0, height: 0}}
                                    className="flex items-center gap-2 text-sm text-red-400"
                                >
                                    <AlertCircle className="h-3 w-3"/>
                                    {error[0]}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )
            })

            export function InternshipModal({open, onClose, onCreate}: InternshipModalProps) {
                const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_STATE)
                const [errors, setErrors] = useState<Errors>({})
                const [isLoading, setIsLoading] = useState(false)

                /* stable updater - uses functional updates to avoid reading stale state */
                const updateField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
                    setFormValues((prev) => ({...prev, [key]: value}))
                    setErrors((prev) => (prev[key as keyof Errors] ? {...prev, [key]: undefined} : prev))
                }, [])

                const resetForm = useCallback(() => {
                    setFormValues(INITIAL_FORM_STATE)
                    setErrors({})
                }, [])

                const handleClose = useCallback(() => {
                    resetForm()
                    onClose()
                }, [onClose, resetForm])

                const today = useMemo(() => startOfDay(new Date()), [])

                const handleSubmit = useCallback(async () => {
                    setIsLoading(true)
                    const newErrors: Errors = {}

                    if (!formValues.title || formValues.title.length < 3) {
                        newErrors.title = ["Title must be at least 3 characters"]
                    }
                    if (!formValues.description || formValues.description.length < 10) {
                        newErrors.description = ["Description must be at least 10 characters"]
                    }
                    if (!formValues.applicationStart) {
                        newErrors.applicationStart = ["Start date is required"]
                    }
                    if (!formValues.applicationEnd) {
                        newErrors.applicationEnd = ["End date is required"]
                    }

                    // Normalize to start-of-day for comparisons
                    const start = formValues.applicationStart ? startOfDay(formValues.applicationStart) : undefined
                    const end = formValues.applicationEnd ? startOfDay(formValues.applicationEnd) : undefined

                    if (start && start < today) {
                        newErrors.applicationStart = ["Start date cannot be in the past"]
                    }
                    if (end && end < today) {
                        newErrors.applicationEnd = ["End date cannot be in the past"]
                    }
                    if (start && end && start > end) {
                        newErrors.applicationEnd = ["End date must be after start date"]
                    }

                    if (!formValues.location || formValues.location.length < 2) {
                        newErrors.location = ["Location must be at least 2 characters"]
                    }
                    if (formValues.paid && (!formValues.salary || Number.parseFloat(formValues.salary) <= 0)) {
                        newErrors.salary = ["Salary is required and must be positive for paid internships"]
                    }

                    if (Object.keys(newErrors).length > 0) {
                        setErrors(newErrors)
                        setIsLoading(false)
                        return
                    }

                    try {
                        const body = {
                            title: formValues.title,
                            description: formValues.description,
                            location: formValues.location,
                            qualifications: formValues.qualifications || null,
                            paid: formValues.paid,
                            salary: formValues.paid && formValues.salary ? Number.parseFloat(formValues.salary) : null,
                            applicationStart: formValues.applicationStart?.toISOString().split("T")[0] ?? "",
                            applicationEnd: formValues.applicationEnd?.toISOString().split("T")[0] ?? "",
                            testAssignmentTitle: formValues.testAssignmentTitle || null,
                            testAssignmentDescription: formValues.testAssignmentDescription || null,
                            testAssignmentDueDate: formValues.testAssignmentDueDate?.toISOString().split("T")[0] ?? null,
                        }

                        const res = await fetch("/api/internships", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify(body),
                        })

                        if (res.ok) {
                            const data: Internship = await res.json()
                            onCreate(data)
                            resetForm()
                            onClose()
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
                }, [formValues, onCreate, onClose, resetForm, today])

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

                return (
                    <Dialog open={open} onOpenChange={handleClose}>
                        <DialogContent
                            forceMount
                            className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-slate-900 p-0 shadow-2xl"
                            style={dialogBorderStyle}
                        >
                            <div className="sticky top-0 z-10 overflow-hidden rounded-t-2xl px-8 py-6" style={dialogHeaderBg}>
                                <DialogHeader className="relative">
                                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-white">
                                        <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                                            <Briefcase className="h-6 w-6"/>
                                        </div>
                                        Create New Internship
                                    </DialogTitle>
                                    <p className="text-white/80 text-sm">Fill in the details to create an internship opportunity</p>
                                </DialogHeader>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"/>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-b-2xl">
                                <div className="space-y-6">
                                    <FormField label="Internship Title" icon={Briefcase} error={errors.title}>
                                        <Input
                                            value={formValues.title}
                                            onChange={(e) => updateField("title", e.target.value)}
                                            placeholder="e.g., Software Development Intern"
                                            className="h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:ring-2 transition-all duration-200"
                                            style={ringStyle}
                                            onFocus={(e) => (e.target.style.borderColor = "var(--internship-field-focus)")}
                                            onBlur={(e) => (e.target.style.borderColor = "rgb(51 65 85)")}
                                        />
                                    </FormField>

                                    <FormField label="Description" icon={FileText} error={errors.description}>
                                        <Textarea
                                            value={formValues.description}
                                            onChange={(e) => updateField("description", e.target.value)}
                                            placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                                            className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:ring-2 transition-all duration-200 resize-none"
                                            style={ringStyle}
                                            onFocus={(e) => (e.target.style.borderColor = "var(--internship-field-focus)")}
                                            onBlur={(e) => (e.target.style.borderColor = "rgb(51 65 85)")}
                                        />
                                    </FormField>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="Applications Open" icon={CalendarIcon} error={errors.applicationStart}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                                        {formValues.applicationStart ? (
                                                            format(formValues.applicationStart, "PPP")
                                                        ) : (
                                                            <span className="text-slate-500">Pick a date</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formValues.applicationStart}
                                                        onSelect={(date) => updateField("applicationStart", date)}
                                                        initialFocus
                                                        className="rounded-xl"
                                                        disabled={disableStartDate}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormField>

                                        <FormField label="Applications Close" icon={CalendarIcon} error={errors.applicationEnd}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                                        {formValues.applicationEnd ? (
                                                            format(formValues.applicationEnd, "PPP")
                                                        ) : (
                                                            <span className="text-slate-500">Pick a date</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formValues.applicationEnd}
                                                        onSelect={(date) => updateField("applicationEnd", date)}
                                                        initialFocus
                                                        disabled={disableEndDate}
                                                        className="rounded-xl"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormField>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="Location" icon={MapPin} error={errors.location}>
                                            <Input
                                                value={formValues.location}
                                                onChange={(e) => updateField("location", e.target.value)}
                                                placeholder="e.g., San Francisco, CA"
                                                className="h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:ring-2 transition-all duration-200"
                                                style={ringStyle}
                                                onFocus={(e) => (e.target.style.borderColor = "var(--internship-field-focus)")}
                                                onBlur={(e) => (e.target.style.borderColor = "rgb(51 65 85)")}
                                            />
                                        </FormField>

                                        <FormField label="Qualifications (Optional)" icon={GraduationCap}
                                                   error={errors.qualifications}>
                                            <Input
                                                value={formValues.qualifications}
                                                onChange={(e) => updateField("qualifications", e.target.value)}
                                                placeholder="e.g., Computer Science student"
                                                className="h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:ring-2 transition-all duration-200"
                                                style={ringStyle}
                                                onFocus={(e) => (e.target.style.borderColor = "var(--internship-field-focus)")}
                                                onBlur={(e) => (e.target.style.borderColor = "rgb(51 65 85)")}
                                            />
                                        </FormField>
                                    </div>

                                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-4">
                                        <div
                                            className="flex items-center space-x-3 rounded-xl bg-slate-800/50 border border-slate-700 p-4">
                                            <Checkbox
                                                checked={formValues.paid}
                                                onCheckedChange={(val) => updateField("paid", !!val)}
                                                className="h-5 w-5 rounded-md border-slate-600"
                                                style={
                                                    {
                                                        "--checkbox-checked-bg": "var(--internship-modal-gradient-from)",
                                                        "--checkbox-checked-border": "var(--internship-modal-gradient-from)",
                                                    } as React.CSSProperties
                                                }
                                            />
                                            <Label
                                                className="flex items-center gap-2 text-base font-medium cursor-pointer text-slate-200">
                                                <DollarSign className="h-4 w-4 text-emerald-400"/>
                                                This is a paid internship
                                            </Label>
                                        </div>

                                        <AnimatePresence>
                                            {formValues.paid && (
                                                <motion.div
                                                    initial={{opacity: 0, height: 0}}
                                                    animate={{opacity: 1, height: "auto"}}
                                                    exit={{opacity: 0, height: 0}}
                                                    transition={{duration: 0.2}}
                                                >
                                                    <FormField label="Monthly Salary" icon={DollarSign} error={errors.salary}>
                                                        <Input
                                                            value={formValues.salary}
                                                            onChange={(e) => updateField("salary", e.target.value)}
                                                            type="number"
                                                            placeholder="e.g., 2000"
                                                            className="h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:ring-2 transition-all duration-200"
                                                            style={ringStyle}
                                                            onFocus={(e) => (e.target.style.borderColor = "var(--internship-field-focus)")}
                                                            onBlur={(e) => (e.target.style.borderColor = "rgb(51 65 85)")}
                                                        />
                                                    </FormField>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    <div className="space-y-4 pt-6 border-t border-slate-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="h-5 w-5 text-slate-400"/>
                                            <h3 className="text-lg font-semibold text-slate-200">Test Assignment (Optional)</h3>
                                        </div>

                                        <FormField label="Assignment Title" icon={FileText} error={errors.testAssignmentTitle}>
                                            <Input
                                                value={formValues.testAssignmentTitle}
                                                onChange={(e) => updateField("testAssignmentTitle", e.target.value)}
                                                placeholder="e.g., Coding Challenge"
                                                className="h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:ring-2 transition-all duration-200"
                                                style={ringStyle}
                                                onFocus={(e) => (e.target.style.borderColor = "var(--internship-field-focus)")}
                                                onBlur={(e) => (e.target.style.borderColor = "rgb(51 65 85)")}
                                            />
                                        </FormField>

                                        <FormField label="Assignment Description" icon={FileText}
                                                   error={errors.testAssignmentDescription}>
                                            <Textarea
                                                value={formValues.testAssignmentDescription}
                                                onChange={(e) => updateField("testAssignmentDescription", e.target.value)}
                                                placeholder="Describe the assignment for applicants..."
                                                className="min-h-[100px] rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:ring-2 transition-all duration-200 resize-none"
                                                style={ringStyle}
                                                onFocus={(e) => (e.target.style.borderColor = "var(--internship-field-focus)")}
                                                onBlur={(e) => (e.target.style.borderColor = "rgb(51 65 85)")}
                                            />
                                        </FormField>

                                        <FormField label="Assignment Due Date" icon={CalendarIcon}
                                                   error={errors.testAssignmentDueDate}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal h-11 rounded-xl border border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                                        {formValues.testAssignmentDueDate ? (
                                                            format(formValues.testAssignmentDueDate, "PPP")
                                                        ) : (
                                                            <span className="text-slate-500">Pick a date</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formValues.testAssignmentDueDate}
                                                        onSelect={(date) => updateField("testAssignmentDueDate", date)}
                                                        initialFocus
                                                        className="rounded-xl"
                                                        disabled={(date) => {
                                                            const { applicationStart, applicationEnd } = formValues
                                                            const d = startOfDay(date)

                                                            if (d < today) return true
                                                            if (applicationStart && d < startOfDay(applicationStart)) return true
                                                            if (applicationEnd && d > startOfDay(applicationEnd)) return true

                                                            return false
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormField>
                                    </div>
                                </div>

                                <DialogFooter className="mt-8 flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleClose}
                                        className="h-11 px-6 rounded-xl border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 transition-all duration-200"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="h-11 px-8 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, var(--internship-modal-gradient-from), var(--internship-modal-gradient-to))",
                                            boxShadow:
                                                "0 10px 25px -5px color-mix(in oklch, var(--internship-modal-gradient-from) 20%, transparent)",
                                        }}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>
                                                Creating...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4"/>
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