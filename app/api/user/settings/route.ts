import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface UserSettings {
    emailNotifications: boolean
    pushNotifications: boolean
    applicationUpdates: boolean
    interviewReminders: boolean
    weeklyDigest: boolean
    compactView: boolean
    animationsEnabled: boolean
    profileVisibility: "public" | "private" | "connections"
    showOnlineStatus: boolean
    allowMessages: boolean
    timezone: string
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

// GET /api/user/settings - Get user settings
export async function GET() {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { 
                profile: true
            }
        }) as { id: string; profile?: { settings?: object } | null } | null

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Settings are stored in profile.settings as JSON
        const profileSettings = user.profile?.settings
        const settings = profileSettings 
            ? { ...defaultSettings, ...(profileSettings as object) }
            : defaultSettings

        return NextResponse.json(settings)
    } catch (error) {
        console.error("Error fetching settings:", error)
        // Return defaults if there's any error
        return NextResponse.json(defaultSettings)
    }
}

// PATCH /api/user/settings - Update user settings
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const updates = body as Partial<UserSettings>

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { 
                profile: true
            }
        }) as { id: string; profile?: { id: string; settings?: object } | null } | null

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Merge existing settings with updates
        const currentSettings = user.profile?.settings 
            ? (user.profile.settings as object)
            : {}
        
        const newSettings = { ...currentSettings, ...updates }

        // Update or create profile with settings using raw SQL
        if (user.profile?.id) {
            await prisma.$executeRaw`
                UPDATE "Profile" 
                SET settings = ${JSON.stringify(newSettings)}::jsonb
                WHERE id = ${user.profile.id}
            `
        } else {
            // Create profile with settings
            await prisma.$executeRaw`
                INSERT INTO "Profile" (id, "userId", name, settings, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), ${user.id}, 'User', ${JSON.stringify(newSettings)}::jsonb, NOW(), NOW())
            `
        }

        return NextResponse.json({ 
            success: true, 
            settings: { ...defaultSettings, ...newSettings } 
        })
    } catch (error) {
        console.error("Error updating settings:", error)
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
}

// PUT /api/user/settings - Reset all settings to defaults
export async function PUT() {
    try {
        const { userId } = await auth()
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { 
                profile: true
            }
        }) as { id: string; profile?: { id: string } | null } | null

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (user.profile?.id) {
            await prisma.$executeRaw`
                UPDATE "Profile" 
                SET settings = ${JSON.stringify(defaultSettings)}::jsonb
                WHERE id = ${user.profile.id}
            `
        }

        return NextResponse.json({ 
            success: true, 
            settings: defaultSettings 
        })
    } catch (error) {
        console.error("Error resetting settings:", error)
        return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 })
    }
}
