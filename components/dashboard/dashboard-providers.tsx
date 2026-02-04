"use client"

import React from "react"
import { SettingsProvider, useSettings } from "@/lib/settings-context"
import { NavigationProvider } from "@/lib/navigation-context"
import { NavigationLoader } from "@/components/navigation-loader"
import { cn } from "@/lib/utils"

interface DashboardProvidersProps {
    children: React.ReactNode
}

function SettingsApplier({ children }: { children: React.ReactNode }) {
    const { settings, isLoading } = useSettings()
    
    // Apply settings as CSS classes to enable/disable animations and compact view
    const settingsClasses = cn(
        !settings.animationsEnabled && "reduce-motion",
        settings.compactView && "compact-view"
    )
    
    // Add CSS variables and classes to the root
    React.useEffect(() => {
        if (isLoading) return
        
        const root = document.documentElement
        
        // Animation settings
        if (!settings.animationsEnabled) {
            root.classList.add("reduce-motion")
            root.style.setProperty("--animation-duration", "0s")
            root.style.setProperty("--transition-duration", "0s")
        } else {
            root.classList.remove("reduce-motion")
            root.style.removeProperty("--animation-duration")
            root.style.removeProperty("--transition-duration")
        }
        
        // Compact view settings
        if (settings.compactView) {
            root.classList.add("compact-view")
            root.style.setProperty("--spacing-multiplier", "0.75")
        } else {
            root.classList.remove("compact-view")
            root.style.removeProperty("--spacing-multiplier")
        }
    }, [settings.animationsEnabled, settings.compactView, isLoading])
    
    return (
        <div className={settingsClasses}>
            {children}
        </div>
    )
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
    return (
        <SettingsProvider>
            <NavigationProvider>
                <NavigationLoader />
                <SettingsApplier>
                    {children}
                </SettingsApplier>
            </NavigationProvider>
        </SettingsProvider>
    )
}
