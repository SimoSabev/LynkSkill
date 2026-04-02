import { type Metadata } from "next"

export const metadata: Metadata = {
    title: "Student Guide | LynkSkill Help",
    description: "Guide for students using LynkSkill to find internships and build their careers.",
}

export default function StudentGuideLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
