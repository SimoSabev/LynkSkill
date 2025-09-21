'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { prisma } from '@/lib/prisma'

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: 'No logged in user' }

    const roleInput = (formData.get('role') as string) || ''
    const role = roleInput.toUpperCase() === 'COMPANY' ? 'COMPANY' : 'STUDENT'

    try {
        // Update Clerk public metadata (uppercase role + onboardingComplete)
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role, onboardingComplete: true },
        })

        // Get Clerk user email
        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
                ?.emailAddress || ''

        // Upsert user in Prisma with onboardingComplete true
        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { role, onboardingComplete: true },
            create: {
                clerkId: userId,
                email,
                role,
                onboardingComplete: true,
                profile: { create: { name: clerkUser.firstName ?? '', bio: '' } },
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

        // If company: create company record (once)
        if (role === 'COMPANY') {
            const companyName = (formData.get('companyName') as string) || ''
            const companyDescription = (formData.get('companyDescription') as string) || ''
            const companyLocation = (formData.get('companyLocation') as string) || ''
            const companyWebsite = (formData.get('companyWebsite') as string) || null

            if (!companyName || !companyDescription || !companyLocation) {
                return { error: 'Please fill company name, description and location' }
            }

            // Avoid duplicate company for same user
            const existing = await prisma.company.findFirst({ where: { ownerId: user.id } })
            if (!existing) {
                await prisma.company.create({
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        website: companyWebsite,
                        ownerId: user.id,
                    },
                })
            }
        }

        // return dashboard path the client should navigate to
        const dashboard = role === 'COMPANY' ? '/dashboard/company' : '/dashboard/student'
        return { message: 'Onboarding complete', dashboard }
    } catch (err) {
        console.error('completeOnboarding error', err)
        return { error: 'Error completing onboarding' }
    }
}

function calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
}