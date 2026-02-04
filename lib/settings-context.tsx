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
    
    // Region
    timezone: string
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
    timezone: "Europe/Sofia",
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = "lynkskill-user-settings"

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Load settings from API on mount, fallback to localStorage
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Try to load from API first
                const response = await fetch('/api/user/settings')
                if (response.ok) {
                    const data = await response.json()
                    setSettings(prev => ({ ...prev, ...data }))
                    // Also save to localStorage as cache
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
                } else {
                    // Fallback to localStorage
                    const stored = localStorage.getItem(STORAGE_KEY)
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setSettings(prev => ({ ...prev, ...parsed }))
                    }
                }
            } catch (error) {
                console.error("Failed to load settings from API:", error)
                // Fallback to localStorage
                try {
                    const stored = localStorage.getItem(STORAGE_KEY)
                    if (stored) {
                        const parsed = JSON.parse(stored)
                        setSettings(prev => ({ ...prev, ...parsed }))
                    }
                } catch (localError) {
                    console.error("Failed to load settings from localStorage:", localError)
                }
            } finally {
                setIsLoading(false)
            }
        }
        
        loadSettings()
    }, [])

    // Save settings to API and localStorage
    const saveSettings = useCallback(async (updates: Partial<UserSettings>) => {
        setIsSaving(true)
        try {
            // Save to localStorage immediately for responsiveness
            const newSettings = { ...settings, ...updates }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
            
            // Save to API
            const response = await fetch('/api/user/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            
            if (!response.ok) {
                console.error("Failed to save settings to API")
            }
        } catch (error) {
            console.error("Failed to save settings:", error)
        } finally {
            setIsSaving(false)
        }
    }, [settings])

    const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        const updates = { [key]: value } as Partial<UserSettings>
        setSettings(prev => ({ ...prev, ...updates }))
        saveSettings(updates)
    }, [saveSettings])

    const updateSettings = useCallback((updates: Partial<UserSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }))
        saveSettings(updates)
    }, [saveSettings])

    const resetSettings = useCallback(async () => {
        setSettings(defaultSettings)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings))
        
        try {
            await fetch('/api/user/settings', { method: 'PUT' })
        } catch (error) {
            console.error("Failed to reset settings on server:", error)
        }
    }, [])

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
