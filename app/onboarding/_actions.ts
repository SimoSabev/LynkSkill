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
        // Update Clerk metadata
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role, onboardingComplete: true },
        })

        // Get Clerk user info
        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.emailAddresses.find(
                (e) => e.id === clerkUser.primaryEmailAddressId
            )?.emailAddress || ""

        // Ensure user exists and update onboarding state
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

        // --- STUDENT FLOW ---
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

            return { message: "Student onboarding complete", dashboard: "/dashboard/student" }
        }

        // --- COMPANY FLOW ---
        if (role === "COMPANY") {
            const companyName = (formData.get("companyName") as string) || ""
            const companyDescription = (formData.get("companyDescription") as string) || ""
            const companyLocation = (formData.get("companyLocation") as string) || ""
            const companyWebsite = (formData.get("companyWebsite") as string) || null
            const companyEik = (formData.get("companyEik") as string) || ""
            const companyLogo = (formData.get("companyLogoHidden") as string) || null

            if (!companyName || !companyDescription || !companyLocation || !companyEik) {
                return { error: "Please fill all required company fields" }
            }

            if (companyEik.length !== 9 && companyEik.length !== 13) {
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
                        logo: companyLogo,
                    },
                })
            } else {
                createdCompany = await prisma.company.update({
                    where: { id: existing.id },
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        website: companyWebsite,
                        eik: companyEik,
                        logo: companyLogo || existing.logo,
                    },
                })
            }

            // ✅ Force update Prisma role (important if switching from student)
            await prisma.user.update({
                where: { id: user.id },
                data: { role: "COMPANY" },
            })

            return {
                message: "Company onboarding complete",
                createdCompanyId: createdCompany.id,
                dashboard: "/dashboard/company",
            }
        }

        return { error: "Unknown role" }
    } catch (err) {
        console.error("❌ completeOnboarding error:", err)
        return { error: "Error completing onboarding" }
    }
}

function calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
}
