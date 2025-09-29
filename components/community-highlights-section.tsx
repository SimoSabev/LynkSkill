"use client"

import {useEffect, useState} from "react"
import {motion} from "framer-motion"
import {
    Download,
    Sparkles,
    Users,
    TrendingUp,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {Progress} from "@/components/ui/progress"

type RecentFile = {
    url: string
    createdAt: string
    uploader: {
        name: string
        image: string | null
    }
}

interface CommunityHighlightsProps {
    setActiveTab: (tab: string) => void
}

export function CommunityHighlights({setActiveTab}: CommunityHighlightsProps) {
    const [files, setFiles] = useState<RecentFile[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedFile, setSelectedFile] = useState<RecentFile | null>(null)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "safe" | "danger">("idle")

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await fetch("/api/experience/recent-files")
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Failed to fetch recent files")
                setFiles(data)
            } catch (err) {
                console.error("RecentFilesSection error:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchFiles()
    }, [])

    const getFileType = (url: string) => (url.match(/\.(mp4|mov|avi)$/) ? "Video" : "Image")

    const handleDownloadClick = (file: RecentFile) => {
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
                // Simulate result (90% chance safe, 10% flagged as dangerous)
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
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 relative"
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
                            <Sparkles className="h-4 w-4"/>
                            <span className="text-sm font-medium">{Math.min(files.length, 4)} Files</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                            <TrendingUp className="h-4 w-4"/>
                            <span className="text-sm font-medium">Recent Activity</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Latest submissions */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--experience-accent)] text-white text-sm font-bold">
                        1
                    </div>
                    <h3 className="text-xl font-semibold">Latest Submissions</h3>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({length: 4}).map((_, i) => (
                            <Card key={i} className="overflow-hidden rounded-3xl">
                                <div className="aspect-square bg-muted animate-pulse"/>
                                <CardContent className="p-4 space-y-2">
                                    <div className="h-4 w-16 bg-muted rounded animate-pulse"/>
                                    <div className="h-6 w-24 bg-muted rounded animate-pulse"/>
                                    <div className="h-8 w-full bg-muted rounded-xl animate-pulse"/>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : files.length === 0 ? (
                    <Card className="rounded-3xl border-2 border-dashed border-[var(--experience-step-border)] p-12 text-center">
                        <div className="space-y-3">
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-8 w-8 text-muted-foreground"/>
                            </div>
                            <div>
                                <h4 className="font-medium">No community files yet</h4>
                                <p className="text-sm text-muted-foreground">
                                    Community submissions will appear here when available
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {files.slice(0, 4).map((file, i) => (
                            <motion.div
                                key={i}
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.3, delay: i * 0.1}}
                                whileHover={{scale: 1.02, y: -5}}
                                whileTap={{scale: 0.98}}
                            >
                                <Card
                                    onClick={() => setActiveTab("learn")}
                                    className="overflow-hidden rounded-3xl border border-border bg-card hover:shadow-lg hover:shadow-muted/50 transition-all duration-300 group">
                                    <div className="relative">
                                        <div
                                            className="aspect-square bg-muted flex items-center justify-center border-b border-border overflow-hidden">
                                            {file.url.match(/\.(mp4|mov|avi)$/) ? (
                                                <video src={file.url} className="h-full w-full object-cover" muted/>
                                            ) : (
                                                <img
                                                    src={file.url}
                                                    alt="Community file"
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDownloadClick(file);
                                                }}
                                            >
                                                <Download className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>

                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="rounded-xl text-xs">
                                                {getFileType(file.url)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(file.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-sm truncate group-hover:text-[var(--experience-accent)] transition-colors">
                                                {file.url.split("/").pop()?.split(".")[0] || "Untitled"}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">Community submission</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 border border-[var(--experience-accent)]/20">
                                                {file.uploader?.image ? (
                                                    <img
                                                        src={file.uploader.image}
                                                        alt={file.uploader?.name || "Anonymous"}
                                                        className="h-full w-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <AvatarFallback
                                                        className="bg-[var(--experience-accent)]/10 text-[var(--experience-accent)] text-xs font-semibold">
                                                        {file.uploader?.name?.charAt(0).toUpperCase() || "?"}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>

                                            <span className="text-xs text-muted-foreground">
                                              {file.uploader?.name || "Anonymous"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
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
                            <Progress value={scanProgress}/>
                            <p className="text-sm text-muted-foreground">Scanning for viruses...</p>
                        </div>
                    )}

                    {scanStatus === "safe" && (
                        <div className="flex flex-col items-center gap-3 text-green-600">
                            <ShieldCheck className="h-8 w-8"/>
                            <p className="text-sm">No threats detected. File is safe.</p>
                        </div>
                    )}

                    {scanStatus === "danger" && (
                        <div className="flex flex-col items-center gap-3 text-red-600">
                            <ShieldAlert className="h-8 w-8"/>
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
