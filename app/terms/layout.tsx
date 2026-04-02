import { type Metadata } from "next"

export const metadata: Metadata = {
    title: "Terms of Service | LynkSkill",
    description: "Read the terms of service for LynkSkill - the platform connecting students with career-defining internships.",
}

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
