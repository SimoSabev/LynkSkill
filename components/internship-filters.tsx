"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X, MapPin, Euro, Briefcase, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/lib/i18n"

export interface InternshipFilters {
    search: string
    location: string
    paid: "all" | "paid" | "unpaid"
    minSalary: number
    maxSalary: number
    skills: string[]
}

interface InternshipFiltersProps {
    filters: InternshipFilters
    onFiltersChange: (filters: InternshipFilters) => void
    locations: string[]
    allSkills: string[]
}

const POPULAR_SKILLS = [
    "JavaScript", "TypeScript", "React", "Python", "Java", 
    "Node.js", "SQL", "Git", "AWS", "Docker"
]

export function InternshipFiltersComponent({
    filters,
    onFiltersChange,
    locations,
    allSkills
}: InternshipFiltersProps) {
    const { t } = useTranslation()
    const [localFilters, setLocalFilters] = useState<InternshipFilters>(filters)
    const [isOpen, setIsOpen] = useState(false)
    const [searchDebounce, setSearchDebounce] = useState(filters.search)

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchDebounce !== filters.search) {
                onFiltersChange({ ...filters, search: searchDebounce })
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchDebounce, filters, onFiltersChange])

    const handleSearchChange = (value: string) => {
        setSearchDebounce(value)
        setLocalFilters(prev => ({ ...prev, search: value }))
    }

    const handleApplyFilters = () => {
        onFiltersChange(localFilters)
        setIsOpen(false)
    }

    const handleClearFilters = () => {
        const cleared: InternshipFilters = {
            search: "",
            location: "all",
            paid: "all",
            minSalary: 0,
            maxSalary: 10000,
            skills: []
        }
        setLocalFilters(cleared)
        setSearchDebounce("")
        onFiltersChange(cleared)
    }

    const toggleSkill = (skill: string) => {
        setLocalFilters(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }))
    }

    const activeFilterCount = [
        filters.location !== "all",
        filters.paid !== "all",
        filters.minSalary > 0,
        filters.maxSalary < 10000,
        filters.skills.length > 0
    ].filter(Boolean).length

    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex gap-3 flex-col sm:flex-row">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={t("filters.searchInternships")}
                        value={searchDebounce}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-11 pr-10 h-11 rounded-xl md:rounded-2xl border-2 border-border/50 focus:border-purple-500 bg-background/80 backdrop-blur-sm shadow-md focus:shadow-lg transition-all text-sm"
                    />
                    {searchDebounce && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => handleSearchChange("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Filter Button */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="gap-2 h-11 px-5 rounded-xl md:rounded-2xl border-2 border-border/50 hover:border-purple-500/50 bg-background/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all font-semibold"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("filters.filters")}</span>
                            {activeFilterCount > 0 && (
                                <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l-2 border-border/50">
                        <SheetHeader className="pb-4 border-b border-border/50">
                            <SheetTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                    <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                {t("filters.filters")}
                            </SheetTitle>
                        </SheetHeader>

                        <div className="space-y-6 py-6">
                            {/* Location Filter */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                                        <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    {t("filters.location")}
                                </Label>
                                <Select
                                    value={localFilters.location}
                                    onValueChange={(value) => 
                                        setLocalFilters(prev => ({ ...prev, location: value }))
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 focus:border-purple-500 transition-colors">
                                        <SelectValue placeholder="All locations" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="all">🌍 All locations</SelectItem>
                                        <SelectItem value="remote">{t("filters.remote")}</SelectItem>
                                        {locations.map(loc => (
                                            <SelectItem key={loc} value={loc.toLowerCase()}>
                                                📍 {loc}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Paid/Unpaid Filter */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <div className="p-1.5 rounded-lg bg-green-500/10">
                                        <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    {t("filters.compensation")}
                                </Label>
                                <Select
                                    value={localFilters.paid}
                                    onValueChange={(value: "all" | "paid" | "unpaid") => 
                                        setLocalFilters(prev => ({ ...prev, paid: value }))
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-2 border-border/50 focus:border-purple-500 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                                        <SelectItem value="paid">{t("filters.paidOnly")}</SelectItem>
                                        <SelectItem value="unpaid">{t("filters.unpaidOnly")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Salary Range Filter */}
                            {localFilters.paid !== "unpaid" && (
                                <div className="space-y-4">
                                    <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                            <Euro className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        {t("filters.salaryRange")}
                                    </Label>
                                    <div className="px-3 py-4 bg-muted/30 rounded-xl border border-border/30">
                                        <Slider
                                            value={[localFilters.minSalary, localFilters.maxSalary]}
                                            onValueChange={([min, max]) => 
                                                setLocalFilters(prev => ({ 
                                                    ...prev, 
                                                    minSalary: min, 
                                                    maxSalary: max 
                                                }))
                                            }
                                            min={0}
                                            max={10000}
                                            step={100}
                                            className="mt-2"
                                        />
                                        <div className="flex justify-between mt-3 text-sm font-semibold">
                                            <span className="px-2 py-1 rounded-lg bg-background border border-border/50">${localFilters.minSalary}</span>
                                            <span className="text-muted-foreground">{t("filters.to")}</span>
                                            <span className="px-2 py-1 rounded-lg bg-background border border-border/50">${localFilters.maxSalary}+</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Skills Filter */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    {t("filters.requiredSkills")}
                                    {localFilters.skills.length > 0 && (
                                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                            {localFilters.skills.length} selected
                                        </span>
                                    )}
                                </Label>
                                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border/30 max-h-48 overflow-y-auto">
                                    {(allSkills.length > 0 ? allSkills : POPULAR_SKILLS).map(skill => (
                                        <button
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                                localFilters.skills.includes(skill)
                                                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm"
                                                    : "bg-background border border-border/50 text-muted-foreground hover:border-purple-500/50 hover:text-foreground"
                                            }`}
                                        >
                                            {skill}
                                            {localFilters.skills.includes(skill) && (
                                                <X className="h-3 w-3 ml-1.5 inline" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
                            <Button 
                                variant="outline" 
                                onClick={handleClearFilters}
                                className="w-full sm:w-auto h-11 rounded-xl border-2 font-semibold"
                            >
                                <X className="h-4 w-4 mr-2" />
                                {t("filters.clearAll")}
                            </Button>
                            <Button 
                                onClick={handleApplyFilters}
                                className="w-full sm:w-auto h-11 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {t("filters.applyFilters")}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* Clear All Button (visible when filters active) */}
                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4 mr-1" />
                        {t("filters.clearAll")}
                    </Button>
                )}
            </div>

            {/* Active Filters Display - Premium UI */}
            <AnimatePresence>
                {(filters.skills.length > 0 || filters.location !== "all" || filters.paid !== "all") && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-2 items-center"
                    >
                        <span className="text-xs text-muted-foreground font-medium mr-1">{t("filters.active")}</span>
                        
                        {filters.location !== "all" && (
                            <div className="group">
                                <button
                                    onClick={() => onFiltersChange({ ...filters, location: "all" })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:border-purple-500/50 transition-colors duration-150"
                                >
                                    <MapPin className="h-3 w-3" />
                                    <span className="capitalize">{filters.location}</span>
                                    <X className="h-3 w-3 ml-0.5 opacity-60 group-hover:opacity-100" />
                                </button>
                            </div>
                        )}
                        
                        {filters.paid !== "all" && (
                            <div className="group">
                                <button
                                    onClick={() => onFiltersChange({ ...filters, paid: "all" })}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150 ${
                                        filters.paid === "paid" 
                                            ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 hover:border-green-500/50"
                                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:border-amber-500/50"
                                    }`}
                                >
                                    <Euro className="h-3 w-3" />
                                    <span>{filters.paid === "paid" ? t("filters.paid") : t("filters.unpaid")}</span>
                                    <X className="h-3 w-3 ml-0.5 opacity-60 group-hover:opacity-100" />
                                </button>
                            </div>
                        )}
                        
                        {filters.skills.map((skill) => (
                            <div
                                key={skill}
                                className="group"
                            >
                                <button
                                    onClick={() => onFiltersChange({ 
                                        ...filters, 
                                        skills: filters.skills.filter(s => s !== skill) 
                                    })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:border-blue-500/50 transition-colors duration-150"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    <span>{skill}</span>
                                    <X className="h-3 w-3 ml-0.5 opacity-60 group-hover:opacity-100" />
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
