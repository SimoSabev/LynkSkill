"use client"

import React, { createContext, useContext, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"

interface NavigationContextType {
    isNavigating: boolean
    startNavigation: () => void
    endNavigation: () => void
    navigateTo: (href: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    const navigateTo = useCallback((href: string) => {
        if (href === pathname) return
        router.push(href)
    }, [pathname, router])

    return (
        <NavigationContext.Provider value={{ 
            isNavigating: false, 
            startNavigation: () => {}, 
            endNavigation: () => {},
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
