'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { prisma } from '@/lib/prisma'

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: 'No logged in user' }

    const roleInput = formData.get('role') as string
    const role = roleInput.toUpperCase() === 'COMPANY' ? 'COMPANY' : 'STUDENT' // matches Prisma enum

    try {
        // Update Clerk user metadata
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { onboardingComplete: true, role: roleInput },
        })

        // Get Clerk user email
        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.emailAddresses.find(
                (e) => e.id === clerkUser.primaryEmailAddressId
            )?.emailAddress || ''

        // Upsert user in Prisma
        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { role },
            create: {
                clerkId: userId,
                email,
                role,
            },
        })

        // If user is a company, create company record
        if (role === 'COMPANY') {
            const companyName = formData.get('companyName') as string
            const companyDescription = formData.get('companyDescription') as string
            const companyLocation = formData.get('companyLocation') as string
            const companyWebsite = formData.get('companyWebsite') as string | null

            if (!companyName || !companyDescription || !companyLocation) {
                return { error: 'Please provide all required company details' }
            }

            await prisma.company.create({
                data: {
                    name: companyName,
                    description: companyDescription,
                    location: companyLocation,
                    website: companyWebsite || null,
                    ownerId: user.id,
                },
            })
        }

        return { message: 'Onboarding complete' }
    } catch (err) {
        console.error('Onboarding error:', err)
        return { error: 'Error completing onboarding' }
    }
}
