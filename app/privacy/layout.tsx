import { type Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy | LynkSkill",
    description: "Learn how LynkSkill protects your data and privacy. Read our comprehensive privacy policy.",
}

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
