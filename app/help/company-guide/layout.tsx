import { type Metadata } from "next"

export const metadata: Metadata = {
    title: "Company Guide | LynkSkill Help",
    description: "Guide for companies using LynkSkill to find and hire talented students.",
}

export default function CompanyGuideLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
