"use client"

import { motion } from "framer-motion"
import { Users, Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTranslation } from "@/lib/i18n"

export default function CandidatesPage() {
    const { t } = useTranslation()

    // Placeholder candidates data
    const candidates = [
        { id: 1, name: "Alex Johnson", skills: ["React", "TypeScript", "Node.js"], match: 92 },
        { id: 2, name: "Sarah Chen", skills: ["Python", "Data Science", "ML"], match: 88 },
        { id: 3, name: "Michael Brown", skills: ["Java", "Spring", "AWS"], match: 85 },
        { id: 4, name: "Emily Davis", skills: ["UI/UX", "Figma", "CSS"], match: 82 },
    ]

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/5 border border-indigo-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                        <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">{t('navigation.candidates')}</h1>
                        <p className="text-muted-foreground">Browse and search for potential candidates</p>
                    </div>
                </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search candidates by name, skills..." 
                        className="pl-10 rounded-xl"
                    />
                </div>
                <Button variant="outline" className="rounded-xl">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {candidates.map((candidate, index) => (
                    <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="border-border/50 hover:border-indigo-500/30 transition-all hover:shadow-lg">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-indigo-500/30">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-600 font-bold">
                                            {candidate.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{candidate.name}</CardTitle>
                                        <Badge 
                                            className="mt-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                        >
                                            {candidate.match}% Match
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {candidate.skills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" className="flex-1 rounded-xl">
                                        View Profile
                                    </Button>
                                    <Button size="sm" variant="outline" className="rounded-xl">
                                        Contact
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
