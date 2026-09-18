"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function HelpRedirectPage() {
    const router = useRouter()
    const { isSignedIn, isLoaded } = useUser()
    const { t } = useTranslation()

    useEffect(() => {
        if (!isLoaded) return
        
        if (isSignedIn) {
            // Fetch user role and redirect accordingly
            fetch('/api/user/role')
                .then(res => res.json())
                .then(data => {
                    if (data.role === 'COMPANY') {
                        router.replace('/dashboard/company/help')
                    } else {
                        router.replace('/dashboard/student/help')
                    }
                })
                .catch(() => {
                    router.replace('/dashboard/student/help')
                })
        } else {
            // Анонимните посетители (и търсачките) отиват към публичното ръководство.
            // Преди тук стоеше '/dashboard/student/help', което е зад auth -> middleware
            // ги връщаше на '/', така че Help Center нямаше индексируемо съдържание.
            router.replace('/help/student-guide')
        }
    }, [isLoaded, isSignedIn, router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-muted-foreground">{t("help.redirecting")}</p>
            </div>
        </div>
    )
}
