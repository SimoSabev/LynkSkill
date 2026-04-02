import { type Metadata } from "next"

export const metadata: Metadata = {
    title: "Help Center | LynkSkill",
    description: "Get help with LynkSkill - find guides and support for students and companies.",
}

export default function HelpLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
