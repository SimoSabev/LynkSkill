"use client"

import React, { createContext, useContext, useState, useEffect, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

interface NavigationContextType {
    isNavigating: boolean
    startNavigation: () => void
    endNavigation: () => void
    navigateTo: (href: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [isNavigating, setIsNavigating] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const pathname = usePathname()

    // End navigation when pathname changes
    useEffect(() => {
        setIsNavigating(false)
    }, [pathname])

    const startNavigation = () => setIsNavigating(true)
    const endNavigation = () => setIsNavigating(false)

    const navigateTo = (href: string) => {
        if (href === pathname) return
        
        setIsNavigating(true)
        startTransition(() => {
            router.push(href)
        })
    }

    // Combine our state with React's isPending
    const loading = isNavigating || isPending

    return (
        <NavigationContext.Provider value={{ 
            isNavigating: loading, 
            startNavigation, 
            endNavigation,
            navigateTo 
        }}>
            {children}
        </NavigationContext.Provider>
    )
}

export function useNavigation() {
    const context = useContext(NavigationContext)
    if (!context) {
        return {
            isNavigating: false,
            startNavigation: () => {},
            endNavigation: () => {},
            navigateTo: () => {},
        }
    }
    return context
}
