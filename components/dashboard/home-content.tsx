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
        <div className="space-y-8 pb-8">
            {/* Hero section with welcome message */}
            <DashboardHero userType={userType} />
            
            {/* Main internships section - full width for better visibility */}
            <RecentInternshipsSection userType={userType} />
            
            {/* Secondary content in responsive grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RecentApplicationsSection userType={userType} />
                <ActiveAssignmentsSection userType={userType} />
            </div>
            
            {/* Community section */}
            <CommunityHighlights userType={userType} />
        </div>
    )
}
