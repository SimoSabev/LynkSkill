"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

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
    isSaving: boolean
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
    const [isSaving, setIsSaving] = useState(false)

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

    // Save settings to localStorage whenever they change
    const saveSettings = useCallback(async (newSettings: UserSettings) => {
        setIsSaving(true)
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
            // Simulate API call for server-side persistence
            await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error) {
            console.error("Failed to save settings:", error)
        } finally {
            setIsSaving(false)
        }
    }, [])

    const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value }
            saveSettings(newSettings)
            return newSettings
        })
    }, [saveSettings])

    const updateSettings = useCallback((updates: Partial<UserSettings>) => {
        setSettings(prev => {
            const newSettings = { ...prev, ...updates }
            saveSettings(newSettings)
            return newSettings
        })
    }, [saveSettings])

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings)
        saveSettings(defaultSettings)
    }, [saveSettings])

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSetting,
            updateSettings,
            resetSettings,
            isLoading,
            isSaving,
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
