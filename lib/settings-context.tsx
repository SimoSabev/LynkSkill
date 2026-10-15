"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

/**
 * Client-side (localStorage) user preferences.
 *
 * Only `animationsEnabled` is currently enforced (see components/dashboard/dashboard-shell.tsx).
 * Theme and language live in next-themes and the i18n provider respectively.
 * The remaining fields are placeholders for upcoming features; the settings pages render
 * them as disabled "Coming soon" controls so users aren't misled.
 */
interface UserSettings {
    // Notifications
    emailNotifications: boolean
    pushNotifications: boolean
    applicationUpdates: boolean
    interviewReminders: boolean
    weeklyDigest: boolean
    
    // Appearance
    compactView: boolean
    animationsEnabled: boolean
    
    // Privacy
    profileVisibility: "public" | "private" | "connections"
    showOnlineStatus: boolean
    allowMessages: boolean
}

interface SettingsContextType {
    settings: UserSettings
    updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
    updateSettings: (updates: Partial<UserSettings>) => void
    resetSettings: () => void
    isLoading: boolean
}

const defaultSettings: UserSettings = {
    emailNotifications: true,
    pushNotifications: true,
    applicationUpdates: true,
    interviewReminders: true,
    weeklyDigest: false,
    compactView: false,
    animationsEnabled: true,
    profileVisibility: "public",
    showOnlineStatus: true,
    allowMessages: true,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = "lynkskill-user-settings"

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                setSettings(prev => ({ ...prev, ...parsed }))
            }
        } catch (error) {
            console.error("Failed to load settings:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Persist to localStorage (synchronous; there is no server-side persistence yet)
    useEffect(() => {
        if (isLoading) return
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
        } catch (error) {
            console.error("Failed to save settings:", error)
        }
    }, [settings, isLoading])

    const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }, [])

    const updateSettings = useCallback((updates: Partial<UserSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }))
    }, [])

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings)
    }, [])

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSetting,
            updateSettings,
            resetSettings,
            isLoading,
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
