"use client"

import { RecentInternshipsSection } from "@/components/recent-internships-section"
import { ExpiringInternshipsBanner } from "@/components/expiring-internships-banner"

export default function CompanyInternshipsPage() {
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <ExpiringInternshipsBanner />
            <RecentInternshipsSection userType="Company" />
        </div>
    )
}
