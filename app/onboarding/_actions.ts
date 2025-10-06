"use server"

import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: "No logged in user" }

    const roleInput = (formData.get("role") as string)?.toUpperCase()
    const role: "COMPANY" | "STUDENT" = roleInput === "COMPANY" ? "COMPANY" : "STUDENT"

    try {
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role, onboardingComplete: true },
        })

        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || ""

        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { role, onboardingComplete: true },
            create: {
                clerkId: userId,
                email,
                role,
                onboardingComplete: true,
                profile: { create: { name: clerkUser.firstName ?? "", bio: "" } },
            },
        })

        if (role === "STUDENT") {
            const dob = formData.get("dob") as string
            const age = dob ? calculateAge(new Date(dob)) : null
            const needsApproval = age !== null && age < 18

            await prisma.portfolio.create({
                data: {
                    studentId: user.id,
                    age,
                    approvalStatus: needsApproval ? "PENDING" : "APPROVED",
                    needsApproval,
                    bio: "",
                    skills: [],
                    interests: [],
                    experience: "",
                    education: [],
                    projects: [],
                    certifications: [],
                },
            })
        }

        if (role === "COMPANY") {
            const companyName = (formData.get("companyName") as string) || ""
            const companyDescription = (formData.get("companyDescription") as string) || ""
            const companyLocation = (formData.get("companyLocation") as string) || ""
            const companyWebsite = (formData.get("companyWebsite") as string) || null
            const companyEik = (formData.get("companyEik") as string) || ""
            const companyLogo = (formData.get("companyLogoHidden") as string) || null // ✅ Read logo URL

            if (!companyName || !companyDescription || !companyLocation || !companyEik) {
                return { error: "Please fill all required company fields" }
            }

            if (companyEik.length !== 9) {
                return { error: "Invalid EIK format" }
            }

            const existing = await prisma.company.findFirst({
                where: { ownerId: user.id },
            })

            let createdCompany

            if (!existing) {
                createdCompany = await prisma.company.create({
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        website: companyWebsite,
                        ownerId: user.id,
                        eik: companyEik,
                        logo: companyLogo, // ✅ Save logo URL
                    },
                })
            } else {
                // ✅ Update existing company with logo if provided
                createdCompany = await prisma.company.update({
                    where: { id: existing.id },
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        website: companyWebsite,
                        eik: companyEik,
                        logo: companyLogo || existing.logo, // Keep existing if no new logo
                    },
                })
            }

            return { message: "Company created", createdCompanyId: createdCompany.id }
        }
        return { message: "Onboarding complete", dashboard: "/dashboard/student" }
    } catch (err: any) {
        console.error("❌ completeOnboarding error:", err)
        return { error: err.message || "Error completing onboarding" }
    }
}

function calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
}