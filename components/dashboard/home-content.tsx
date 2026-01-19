"use client"

import { DashboardHero } from "@/components/dashboard-hero"
import { RecentInternshipsSection } from "@/components/recent-internships-section"
import { RecentApplicationsSection } from "@/components/recent-applications-section"
import { ActiveAssignmentsSection } from "@/components/active-assignments-section"
import { CommunityHighlights } from "@/components/community-highlights-section"

interface HomeContentProps {
    userType: "Student" | "Company"
}

export function HomeContent({ userType }: HomeContentProps) {
    return (
        <div className="space-y-8">
            <DashboardHero userType={userType} />
            <RecentInternshipsSection userType={userType} />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <RecentApplicationsSection userType={userType} />
                <ActiveAssignmentsSection userType={userType} />
            </div>
            <CommunityHighlights userType={userType} />
        </div>
    )
}
