"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function CompanyGuideRedirectPage() {
    const router = useRouter()
    const { isSignedIn, isLoaded } = useUser()

    useEffect(() => {
        if (!isLoaded) return
        
        if (isSignedIn) {
            fetch('/api/user/role')
                .then(res => res.json())
                .then(data => {
                    if (data.role === 'COMPANY') {
                        router.replace('/dashboard/company/help/company-guide')
                    } else {
                        router.replace('/dashboard/student/help/company-guide')
                    }
                })
                .catch(() => {
                    router.replace('/dashboard/student/help/company-guide')
                })
        } else {
            router.replace('/dashboard/student/help/company-guide')
        }
    }, [isLoaded, isSignedIn, router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-muted-foreground">Redirecting to Company Guide...</p>
            </div>
        </div>
    )
}
