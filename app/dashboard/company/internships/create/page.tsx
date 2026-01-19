"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InternshipModal } from "@/components/internship-modal"
import { useTranslation } from "@/lib/i18n"

export default function CreateInternshipPage() {
    const { t } = useTranslation()
    const [modalOpen, setModalOpen] = useState(true)

    const handleCreate = () => {
        // Redirect to internships list after creation
        window.location.href = "/dashboard/company/internships"
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-blue-500/5 border border-purple-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                            <Briefcase className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{t('navigation.createNew')}</h1>
                            <p className="text-muted-foreground">Create a new internship opportunity</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setModalOpen(true)}
                        className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Internship
                    </Button>
                </div>
            </motion.div>

            <InternshipModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onCreate={handleCreate}
            />
        </div>
    )
}
