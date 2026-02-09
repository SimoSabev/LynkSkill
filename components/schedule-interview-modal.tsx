"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Calendar, 
    X, 
    MapPin, 
    Video, 
    Loader2,
    User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format, addMonths } from "date-fns"
import { LocationPicker, type LocationData } from "@/components/location-picker"
import { cn } from "@/lib/utils"

interface ScheduleInterviewModalProps {
    open: boolean
    onClose: () => void
    applicationId: string
    studentName: string
    internshipTitle: string
    onSuccess?: () => void
}

export function ScheduleInterviewModal({ 
    open, 
    onClose, 
    applicationId, 
    studentName,
    internshipTitle,
    onSuccess 
}: ScheduleInterviewModalProps) {
    const [date, setDate] = useState("")
    const [time, setTime] = useState("")
    const [location, setLocation] = useState("")
    const [locationData, setLocationData] = useState<LocationData>({ address: "", latitude: 0, longitude: 0 })
    const [locationType, setLocationType] = useState<"video" | "in-person">("video")
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!date || !time) {
            toast.error("Please select date and time")
            return
        }

        const scheduledAt = new Date(`${date}T${time}`)
        const now = new Date()
        const maxDate = addMonths(now, 3)
        
        if (scheduledAt < now) {
            toast.error("Interview cannot be scheduled in the past")
            return
        }
        
        if (scheduledAt > maxDate) {
            toast.error("Interview must be scheduled within the next 3 months")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/interviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId,
                    scheduledAt: scheduledAt.toISOString(),
                    location: locationType === "video" 
                        ? location || "Video call (link will be shared)" 
                        : locationData.address || location,
                    latitude: locationType === "in-person" ? locationData.latitude || null : null,
                    longitude: locationType === "in-person" ? locationData.longitude || null : null,
                    notes: notes.trim() || undefined
                })
            })

            if (res.ok) {
                toast.success("Interview scheduled successfully!")
                onSuccess?.()
                onClose()
                // Reset form
                setDate("")
                setTime("")
                setLocation("")
                setLocationData({ address: "", latitude: 0, longitude: 0 })
                setNotes("")
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to schedule interview")
            }
        } catch (error) {
            console.error("Error scheduling interview:", error)
            toast.error("Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Get date limits (today to 3 months)
    const today = format(new Date(), "yyyy-MM-dd")
    const maxDateStr = format(addMonths(new Date(), 3), "yyyy-MM-dd")

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="relative p-6 border-b border-border bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 rounded-full"
                                onClick={onClose}
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                                    <Calendar className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Schedule Interview</h2>
                                    <p className="text-sm text-muted-foreground">Set up a meeting with the candidate</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Candidate Info */}
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{studentName}</p>
                                    <p className="text-sm text-muted-foreground">{internshipTitle}</p>
                                </div>
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={today}
                                        max={maxDateStr}
                                        className="rounded-xl"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Within 3 months</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">Start Time</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-4 space-y-3">
                                <Label className="flex items-center gap-2 text-sm font-semibold">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    Interview Location
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant={locationType === "video" ? "default" : "outline"}
                                        onClick={() => setLocationType("video")}
                                        className={cn(
                                            "rounded-xl h-11 transition-all",
                                            locationType === "video" && "bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-500/25"
                                        )}
                                    >
                                        <Video className="h-4 w-4 mr-2" />
                                        Video Call
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={locationType === "in-person" ? "default" : "outline"}
                                        onClick={() => setLocationType("in-person")}
                                        className={cn(
                                            "rounded-xl h-11 transition-all",
                                            locationType === "in-person" && "bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-500/25"
                                        )}
                                    >
                                        <MapPin className="h-4 w-4 mr-2" />
                                        In Person
                                    </Button>
                                </div>
                                {locationType === "video" ? (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="location" className="text-xs text-muted-foreground">
                                            Meeting Link (optional)
                                        </Label>
                                        <Input
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="https://zoom.us/j/... or Google Meet link"
                                            className="rounded-xl h-11"
                                        />
                                    </div>
                                ) : (
                                    <LocationPicker
                                        value={locationData}
                                        onChange={(loc) => {
                                            setLocationData(loc)
                                            setLocation(loc.address)
                                        }}
                                        mapHeight={200}
                                    />
                                )}
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes for Candidate (optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What to prepare, what to expect, dress code..."
                                    className="rounded-xl min-h-[80px] resize-none"
                                    maxLength={500}
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting || !date || !time}
                                className="w-full rounded-xl h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <Calendar className="h-5 w-5 mr-2" />
                                )}
                                {isSubmitting ? "Scheduling..." : "Schedule Interview"}
                            </Button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
