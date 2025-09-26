"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileImage, FileVideo, Download, Eye, Sparkles, Users, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type RecentFile = {
    url: string
    createdAt: string
}

export function CommunityHighlights() {
    const [files, setFiles] = useState<RecentFile[]>([])
    const [loading, setLoading] = useState(true)

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

    const getFileIcon = (url: string) =>
        url.match(/\.(mp4|mov|avi)$/) ? (
            <FileVideo className="h-5 w-5 text-[var(--experience-accent)]" />
        ) : (
            <FileImage className="h-5 w-5 text-[var(--experience-success)]" />
        )

    const getFileType = (url: string) => (url.match(/\.(mp4|mov|avi)$/) ? "Video" : "Image")

    return (
        <section className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden rounded-3xl bg-card border border-border p-8 relative"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground text-balance">Community Highlights</h2>
                        <p className="max-w-[600px] text-muted-foreground text-pretty">
                            Discover the latest creative work and achievements shared by our community members.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
                            <Sparkles className="h-4 w-4 text-[var(--experience-accent)]" />
                            <span className="text-sm font-medium">{Math.min(files.length, 4)} Files</span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
                            <TrendingUp className="h-4 w-4 text-[var(--experience-success)]" />
                            <span className="text-sm font-medium">Recent Activity</span>
                        </div>
                    </div>
                </div>
            </motion.div>

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
                            <Card key={i} className="overflow-hidden rounded-3xl">
                                <div className="aspect-square bg-muted animate-pulse" />
                                <CardContent className="p-4 space-y-2">
                                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                                    <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                                    <div className="h-8 w-full bg-muted rounded-xl animate-pulse" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : files.length === 0 ? (
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
                        {files.slice(0, 4).map((file, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.1 }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card className="overflow-hidden rounded-3xl border border-border bg-card hover:shadow-lg hover:shadow-muted/50 transition-all duration-300 group">
                                    <div className="relative">
                                        <div className="aspect-square bg-muted flex items-center justify-center border-b border-border">
                                            {getFileIcon(file.url)}
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                                onClick={() => window.open(file.url, "_blank")}
                                            >
                                                <Download className="h-4 w-4" />
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
                                                <AvatarFallback className="bg-[var(--experience-accent)]/10 text-[var(--experience-accent)] text-xs font-semibold">
                                                    U
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-muted-foreground">Anonymous</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
