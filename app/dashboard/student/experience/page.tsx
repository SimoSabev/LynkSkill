"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import MyExperienceTabContent from "@/components/my-experience-tab-content"

function ExperienceContent() {
    const searchParams = useSearchParams()
    const projectId = searchParams?.get("project") ?? null
    
    return <MyExperienceTabContent highlightProjectId={projectId} />
}

export default function ExperiencePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <ExperienceContent />
        </Suspense>
    )
}
