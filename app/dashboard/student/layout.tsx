import type React from "react"
import { getDashboardData } from "@/lib/server-data"
import { DashboardProvider } from "@/lib/dashboard-context"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardProviders } from "@/components/dashboard/dashboard-providers"

export const revalidate = 60

export default async function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const initialData = await getDashboardData("Student")

    const serializedData = {
        user: initialData.user,
        company: initialData.company,
        internships: initialData.internships.map(i => ({
            ...i,
            createdAt: i.createdAt.toISOString(),
            applicationStart: i.applicationStart?.toISOString() ?? null,
            applicationEnd: i.applicationEnd?.toISOString() ?? null,
        })),
        applications: initialData.applications.map(a => ({
            ...a,
            createdAt: a.createdAt.getTime(),
        })),
        projects: initialData.projects.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            status: "ONGOING" as const,
            internship: {
                ...p.internship,
                startDate: p.internship.startDate?.toISOString() ?? null,
                endDate: p.internship.endDate?.toISOString() ?? null,
            }
        })),
        recentExperiences: initialData.recentExperiences.map(e => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
        })),
    }

    return (
        <DashboardProviders>
            <DashboardProvider userType="Student" initialData={serializedData}>
                <DashboardShell userType="Student">
                    {children}
                </DashboardShell>
            </DashboardProvider>
        </DashboardProviders>
    )
}
