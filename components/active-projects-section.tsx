"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { FileText, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type ApiProject = {
    id: string
    internship: { title: string; company: { name: string } }
    student: { name: string; email: string }
    status: "ONGOING" | "COMPLETED"
    createdAt: string
}

interface ActiveProjectsSectionProps {
    setActiveTab: (tab: string) => void
}

export function ActiveProjectsSection({ setActiveTab }: ActiveProjectsSectionProps) {
    const [projects, setProjects] = useState<ApiProject[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/projects")
                const data = await res.json()
                if (Array.isArray(data)) {
                    setProjects(data)
                } else {
                    console.error("Unexpected response:", data)
                    setProjects([])
                }
            } catch (err) {
                console.error("Failed to fetch projects:", err)
                setProjects([])
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [])

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Active Projects</h2>
                <Button
                    variant="ghost"
                    className="rounded-2xl"
                    onClick={() => setActiveTab("projects")} // 👈 go to projects tab
                >
                    View All
                </Button>
            </div>
            <div className="rounded-3xl border">
                <div className="grid grid-cols-1 divide-y">
                    {isLoading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                                    <div className="h-6 w-20 bg-muted rounded-xl animate-pulse" />
                                </div>
                                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                                        <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-xl animate-pulse" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                        ))
                        : projects
                            .slice(0, 3) // 👈 only latest 3
                            .map((proj, index) => (
                                <motion.div
                                    key={proj.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                                    onClick={() => setActiveTab("projects")} // 👈 go to projects tab
                                    className="p-4 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium">{proj.internship.title}</h3>
                                        <Badge variant="outline" className="rounded-xl">
                                            {proj.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-foreground mb-3">
                                        Company: {proj.internship.company?.name ?? "Unknown"}
                                    </p>
                                    <p className="text-sm mb-3">
                                        Student: {proj.student?.name ?? proj.student?.email ?? "Unknown"}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Started</span>
                                            <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <Progress value={proj.status === "COMPLETED" ? 100 : 50} className="h-2 rounded-xl" />
                                    </div>
                                    <div className="flex items-center justify-between mt-3 text-sm text-foreground">
                                        <div className="flex items-center">
                                            <Users className="mr-1 h-4 w-4" />
                                            1 member
                                        </div>
                                        <div className="flex items-center">
                                            <FileText className="mr-1 h-4 w-4" />
                                            linked application
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                </div>
            </div>
        </section>
    )
}
