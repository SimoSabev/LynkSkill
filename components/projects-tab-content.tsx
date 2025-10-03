"use client"

import type React from "react"

import {useEffect, useState, useCallback} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {RefreshCw, Search, Users, FileText, Clock, Layers} from "lucide-react"
import {Input} from "@/components/ui/input"

type ApiProject = {
    id: string
    internship: {
        title: string
        company: { name: string }
        startDate: string
        endDate: string
    }
    student: { name: string; email: string }
    status: "ONGOING" | "COMPLETED"
    createdAt: string
}


export function ProjectsTabContent() {
    const [projects, setProjects] = useState<ApiProject[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [selected, setSelected] = useState<ApiProject | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<"all" | "recent">("all")

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/projects")
            const text = await res.text()
            try {
                const parsed = JSON.parse(text)
                console.log("Projects API raw payload:", parsed)
                if (!Array.isArray(parsed)) {
                    setError("Unexpected API response shape")
                    setProjects([])
                } else {
                    setProjects(parsed)
                }
            } catch (parseErr) {
                console.error("Failed to parse /api/projects response as JSON array:", parseErr, "raw:", text)
                setError("Invalid API response")
                setProjects([])
            }
        } catch (err: unknown) {
            console.error("Failed to fetch /api/projects", err)
            setError(err instanceof Error ? err.message : "Failed to fetch projects")
            setProjects([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    async function handleRefresh() {
        setRefreshing(true)
        await load()
        setRefreshing(false)
    }

    const filteredProjects = projects.filter(
        (project) =>
            project.internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.internship.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const now = Date.now()
    const finalProjects =
        filter === "recent"
            ? filteredProjects.filter((p) => {
                const createdAt = new Date(p.createdAt).getTime()
                const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24)
                return diffDays <= 5
            })
            : filteredProjects

    return (
        <div className="space-y-8">
            {/*<section>*/}
            {/*  <div className="overflow-hidden rounded-3xl p-8 text-white relative">*/}
            {/*    <div*/}
            {/*        className="absolute inset-0 opacity-90"*/}
            {/*        style={{*/}
            {/*          background: `linear-gradient(135deg, var(--projects-hero-from), var(--projects-hero-to))`,*/}
            {/*        }}*/}
            {/*    />*/}
            {/*    <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">*/}
            {/*      <div className="space-y-2">*/}
            {/*        <h1 className="text-3xl font-bold text-balance">Project Management</h1>*/}
            {/*        <p className="max-w-[600px] text-white/90 text-pretty">*/}
            {/*          Organize and track your internship projects. Monitor progress and collaborate with your team.*/}
            {/*        </p>*/}
            {/*      </div>*/}
            {/*      <Button className="w-fit rounded-2xl bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all duration-300">*/}
            {/*        <Plus className="mr-2 h-4 w-4" />*/}
            {/*        New Project*/}
            {/*      </Button>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</section>*/}

            <div className="flex flex-wrap gap-3 mb-6">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => setFilter("all")}
                >
                    <Layers className="mr-2 h-4 w-4"/>
                    All Projects
                </Button>

                <Button
                    variant={filter === "recent" ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => setFilter("recent")}
                >
                    <Clock className="mr-2 h-4 w-4"/>
                    Recent
                </Button>
                {/*<Button*/}
                {/*    variant="outline"*/}
                {/*    className="rounded-2xl bg-transparent border-2 hover:border-[var(--projects-accent)] hover:text-[var(--projects-accent)] transition-colors"*/}
                {/*>*/}
                {/*  <Users className="mr-2 h-4 w-4" />*/}
                {/*  Shared*/}
                {/*</Button>*/}
                {/*<Button*/}
                {/*    variant="outline"*/}
                {/*    className="rounded-2xl bg-transparent border-2 hover:border-[var(--projects-accent)] hover:text-[var(--projects-accent)] transition-colors"*/}
                {/*>*/}
                {/*  <Archive className="mr-2 h-4 w-4" />*/}
                {/*  Archived*/}
                {/*</Button>*/}
                <div className="flex-1"></div>
                <div className="relative w-full md:w-auto mt-3 md:mt-0">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                    <Input
                        type="search"
                        placeholder="Search projects..."
                        className="w-full rounded-2xl pl-9 md:w-[250px] border-2 focus:border-[var(--projects-accent)] transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="rounded-2xl"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}/>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({length: 6}).map((_, i) => (
                        <Card key={i} className="rounded-3xl animate-pulse">
                            <CardHeader>
                                <div className="h-6 bg-muted rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-4 bg-muted rounded w-1/2"></div>
                                <div className="h-4 bg-muted rounded w-2/3"></div>
                                <div className="h-6 bg-muted rounded w-20"></div>
                                <div className="h-3 bg-muted rounded w-1/3"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <div className="text-destructive text-lg font-medium">Error: {error}</div>
                    <Button onClick={handleRefresh} className="mt-4 rounded-2xl">
                        Try Again
                    </Button>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    {searchQuery ? (
                        <div>
                            <div className="text-muted-foreground text-lg">No projects match your search.</div>
                            <Button onClick={() => setSearchQuery("")} variant="outline" className="mt-4 rounded-2xl">
                                Clear Search
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <div className="text-muted-foreground text-lg">No projects yet.</div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Projects will appear here once applications are approved.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">
                            {searchQuery
                                ? `Search Results (${filteredProjects.length})`
                                : `Active Projects (${filteredProjects.length})`}
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {finalProjects.map((proj) => (
                            <Card
                                key={proj.id}
                                className="group rounded-3xl cursor-pointer border-2 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden relative"
                                onClick={() => setSelected(proj)}
                                style={
                                    {
                                        background: `linear-gradient(135deg, var(--internship-card-gradient-from), var(--internship-card-gradient-to))`,
                                        borderColor: `var(--internship-card-border)`,
                                        boxShadow: `0 4px 12px var(--internship-card-shadow)`,
                                    } as React.CSSProperties
                                }
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                        background: `linear-gradient(135deg, var(--internship-card-hover-from), var(--internship-card-hover-to))`,
                                    }}
                                />

                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"/>

                                <CardHeader className="relative z-10">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle
                                            className="line-clamp-2 text-lg group-hover:text-white transition-colors duration-300">
                                            {proj.internship.title}
                                        </CardTitle>
                                        <Badge
                                            variant={proj.status === "ONGOING" ? "secondary" : "default"}
                                            className="rounded-xl shrink-0 group-hover:scale-105 transition-transform group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30"
                                        >
                                            {proj.status}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3 relative z-10">
                                    <div className="space-y-2">
                                        <div
                                            className="flex items-center text-sm group-hover:text-white/90 transition-colors duration-300">
                                            <div
                                                className="w-2 h-2 rounded-full mr-2 group-hover:bg-white/80 transition-colors duration-300"
                                                style={{backgroundColor: `var(--internship-card-hover-from)`}}
                                            ></div>
                                            <span className="font-medium">Company:</span>
                                            <span className="ml-1">{proj.internship.company?.name ?? "Unknown"}</span>
                                        </div>
                                        <div
                                            className="flex items-center text-sm group-hover:text-white/90 transition-colors duration-300">
                                            <Users
                                                className="w-4 h-4 mr-2 group-hover:text-white/70 transition-colors duration-300"/>
                                            <span className="font-medium">Student:</span>
                                            <span
                                                className="ml-1 truncate">{proj.student?.name ?? proj.student?.email ?? "Unknown"}</span>
                                        </div>
                                    </div>

                                    <div
                                        className="pt-2 border-t group-hover:border-white/20 transition-colors duration-300">
                                        <div
                                            className="flex items-center justify-between text-xs group-hover:text-white/80 transition-colors duration-300">
                                            <div
                                                className="flex items-center text-sm group-hover:text-white/90 transition-colors duration-300">
                                                <Clock
                                                    className="w-4 h-4 mr-2 group-hover:text-white/70 transition-colors duration-300"/>
                                                <span className="font-medium">Period:</span>
                                                <span className="ml-1">
                                                  {new Date(proj.internship.startDate).toLocaleDateString()} -{" "}
                                                    {new Date(proj.internship.endDate).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center">
                                                <FileText className="w-3 h-3 mr-1"/>
                                                View Details
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>

                                <div
                                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                    style={{
                                        boxShadow: `0 20px 40px var(--internship-card-shadow-hover)`,
                                    }}
                                />
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[var(--projects-accent)]">Project
                            Details</DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4">
                            <div
                                className="p-4 rounded-2xl bg-gradient-to-br from-[var(--projects-card-hover-from)]/10 to-[var(--projects-card-hover-to)]/10 border border-[var(--projects-accent)]/20">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Internship</div>
                                <div className="text-lg font-semibold text-balance">{selected.internship.title}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Company</div>
                                    <div className="font-medium">{selected.internship.company?.name ?? "Unknown"}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                                    <Badge variant={selected.status === "ONGOING" ? "secondary" : "default"}
                                           className="rounded-xl">
                                        {selected.status}
                                    </Badge>
                                </div>
                              <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Period</div>
                                <div className="font-medium">
                                  {new Date(selected.internship.startDate).toLocaleDateString()} –{" "}
                                  {new Date(selected.internship.endDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Student</div>
                                <div
                                    className="font-medium">{selected.student?.name ?? selected.student?.email ?? "Unknown"}</div>
                                <div className="text-sm text-muted-foreground">{selected.student.email}</div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Started</div>
                                <div className="font-medium">{new Date(selected.createdAt).toLocaleString()}</div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setSelected(null)} className="rounded-2xl">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
