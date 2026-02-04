"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Download, Sparkles, Users, TrendingUp, ShieldAlert, ShieldCheck, Layers } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useDashboard } from "@/lib/dashboard-context"

type GroupedExperience = {
    id: string
    files: { url: string }[]
    createdAt: string
    uploader: {
        name: string
        image: string | null
    }
    isBulk: boolean
}

interface CommunityHighlightsProps {
    setActiveTab?: (tab: string) => void
    userType?: "Student" | "Company"
}

export function CommunityHighlights({ setActiveTab, userType = "Student" }: CommunityHighlightsProps) {
    const router = useRouter()
    
    const handleNavigateToExperience = () => {
        if (setActiveTab) {
            setActiveTab("learn")
        } else {
            const basePath = userType === "Student" ? "/dashboard/student" : "/dashboard/company"
            router.push(`${basePath}/experience`)
        }
    }
    
    // Use centralized context - no more individual fetches
    const { recentExperiences, isLoadingExperiences } = useDashboard()
    
    const experiences = recentExperiences as GroupedExperience[]
    const loading = isLoadingExperiences
    
    const [selectedFile, setSelectedFile] = useState<{ url: string } | null>(null)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "safe" | "danger">("idle")

    const getFileType = (url: string) => (url.match(/\.(mp4|mov|avi)$/) ? "Video" : "Image")

    const handleDownloadClick = (file: { url: string }) => {
        setSelectedFile(file)
        setScanProgress(0)
        setScanStatus("idle")
    }

    const startScan = () => {
        setScanStatus("scanning")
        let progress = 0
        const interval = setInterval(() => {
            progress += 20
            setScanProgress(progress)
            if (progress >= 100) {
                clearInterval(interval)
                const safe = Math.random() > 0.1
                setScanStatus(safe ? "safe" : "danger")
            }
        }, 500)
    }

    const confirmDownload = () => {
        if (selectedFile && scanStatus === "safe") {
            window.open(selectedFile.url, "_blank")
            setSelectedFile(null)
        }
    }

    return (
        <section className="space-y-6">
            {/* Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm shadow-lg text-white p-8 relative"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-balance">Community Highlights</h2>
                        <p className="max-w-[600px] text-pretty">
                            Discover the latest creative work and achievements shared by our community.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm font-medium">{experiences.length} Submissions</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">Recent Activity</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Latest submissions */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--experience-accent)] text-white text-sm font-bold">
                        1
                    </div>
                    <h3 className="text-xl font-semibold">Latest Submissions</h3>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden rounded-3xl border-border/50">
                                <div className="aspect-square bg-muted/40 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                <CardContent className="p-4 space-y-3">
                                    <div className="h-5 w-20 bg-muted/50 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                    <div className="h-4 w-28 bg-muted/40 rounded-md relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                    <div className="h-10 w-full bg-muted/30 rounded-xl relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : experiences.length === 0 ? (
                    <Card className="rounded-3xl border-2 border-dashed border-[var(--experience-step-border)] p-12 text-center">
                        <div className="space-y-3">
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h4 className="font-medium">No community files yet</h4>
                                <p className="text-sm text-muted-foreground">Community submissions will appear here when available</p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {experiences.map((exp) => {
                            const firstFile = exp.files[0]
                            return (
                                <div
                                    key={exp.id}
                                >
                                    <Card
                                        onClick={handleNavigateToExperience}
                                        className="overflow-hidden rounded-2xl border border-border bg-card hover:shadow-md transition-shadow duration-150 group cursor-pointer"
                                    >
                                        <div className="relative">
                                            <div className="aspect-square bg-muted flex items-center justify-center border-b border-border overflow-hidden">
                                                {firstFile.url.match(/\.(mp4|mov|avi)$/) ? (
                                                    <video src={firstFile.url} className="h-full w-full object-cover" muted />
                                                ) : (
                                                    <img
                                                        src={firstFile.url || "/placeholder.svg"}
                                                        alt="Community file"
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            {exp.isBulk && (
                                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                    <Layers className="h-3 w-3" />+{exp.files.length - 1} more
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        handleDownloadClick(firstFile)
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                {exp.isBulk ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-xl text-xs bg-[var(--experience-accent)]/10 text-[var(--experience-accent)] border-[var(--experience-accent)]/20"
                                                    >
                                                        Bulk Upload
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="rounded-xl text-xs">
                                                        {getFileType(firstFile.url)}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                          {new Date(exp.createdAt).toLocaleDateString()}
                        </span>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-sm truncate group-hover:text-[var(--experience-accent)] transition-colors">
                                                    {exp.isBulk
                                                        ? `${exp.files.length} Files`
                                                        : firstFile.url.split("/").pop()?.split(".")[0] || "Untitled"}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {exp.isBulk ? "Click to view all files" : "Community submission"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border border-[var(--experience-accent)]/20">
                                                    {exp.uploader?.image ? (
                                                        <img
                                                            src={exp.uploader.image || "/placeholder.svg"}
                                                            alt={exp.uploader?.name || "Anonymous"}
                                                            className="h-full w-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <AvatarFallback className="bg-[var(--experience-accent)]/10 text-[var(--experience-accent)] text-xs font-semibold">
                                                            {exp.uploader?.name?.charAt(0).toUpperCase() || "?"}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>

                                                <span className="text-xs text-muted-foreground">{exp.uploader?.name || "Anonymous"}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Download modal */}
            <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Download File</DialogTitle>
                        <DialogDescription>
                            Before downloading, we&apos;ll quickly scan this file for potential risks.
                        </DialogDescription>
                    </DialogHeader>

                    {scanStatus === "idle" && (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                File: <strong>{selectedFile?.url.split("/").pop()}</strong>
                            </p>
                            <Button onClick={startScan} className="w-full">
                                Start Scan
                            </Button>
                        </div>
                    )}

                    {scanStatus === "scanning" && (
                        <div className="space-y-3">
                            <Progress value={scanProgress} />
                            <p className="text-sm text-muted-foreground">Scanning for viruses...</p>
                        </div>
                    )}

                    {scanStatus === "safe" && (
                        <div className="flex flex-col items-center gap-3 text-green-600">
                            <ShieldCheck className="h-8 w-8" />
                            <p className="text-sm">No threats detected. File is safe.</p>
                        </div>
                    )}

                    {scanStatus === "danger" && (
                        <div className="flex flex-col items-center gap-3 text-red-600">
                            <ShieldAlert className="h-8 w-8" />
                            <p className="text-sm">Warning: Suspicious content detected! Download at your own risk.</p>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setSelectedFile(null)}>
                            Cancel
                        </Button>
                        {scanStatus === "safe" && (
                            <Button onClick={confirmDownload} className="bg-green-600 hover:bg-green-700">
                                Download
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
