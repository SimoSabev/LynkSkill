"use client"

import React from "react"
import { SettingsProvider } from "@/lib/settings-context"
import { NavigationProvider } from "@/lib/navigation-context"
import { NavigationLoader } from "@/components/navigation-loader"

interface DashboardProvidersProps {
    children: React.ReactNode
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
    return (
        <SettingsProvider>
            <NavigationProvider>
                <NavigationLoader />
                {children}
            </NavigationProvider>
        </SettingsProvider>
    )
}
