"use client"

import dynamic from "next/dynamic"
import { DashboardProvider } from "@/lib/dashboard-context"
import type { GetServerSideProps } from "next"

const DashboardLayout = dynamic(
  () => import("@/components/dashboard-layout").then(m => m.DashboardLayout),
  { ssr: false }
)

// Force SSR — skips static generation at build time (auth-gated page)
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} })

export default function StudentDashboard() {
  return (
    <DashboardProvider userType="Student">
      <DashboardLayout userType="Student" />
    </DashboardProvider>
  )
}
