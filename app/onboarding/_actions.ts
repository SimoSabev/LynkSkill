"use server"

import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { sanitizeForDb, schemas } from "@/lib/security"
import { generateUniqueCompanyCode, isValidCodeFormat, normalizeCode } from "@/lib/company-code"
import { z } from "zod"

// Validation schemas for onboarding
const studentSchema = z.object({
    dob: schemas.dateOfBirth,
})

const companyFormSchema = z.object({
    companyName: schemas.companyName,
    companyDescription: schemas.description,
    companyLocation: schemas.location,
    companyLatitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    companyLongitude: z.coerce.number().min(-180).max(180).optional().nullable(),
    companyEik: schemas.eik,
    companyWebsite: schemas.url.optional(),
    companyLogo: z.string().url().optional().nullable(),
})

const teamMemberSchema = z.object({
    invitationCode: z.string()
        .min(1, "Invitation code is required")
        .refine((code) => isValidCodeFormat(code), {
            message: "Invalid code format. Expected: XXXX-XXXX-XXXX-XXXX"
        }),
})

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: "No logged in user" }

    // ✅ Require explicit role selection (no auto-student)
    const roleInput = (formData.get("role") as string)?.toLowerCase()
    if (!roleInput || !["student", "company", "team_member"].includes(roleInput)) {
        return { error: "Please select a valid role before continuing." }
    }

    const role: "COMPANY" | "STUDENT" | "TEAM_MEMBER" = 
        roleInput === "company" ? "COMPANY" : 
        roleInput === "team_member" ? "TEAM_MEMBER" : "STUDENT"

    try {
        // Update Clerk metadata
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role, onboardingComplete: true },
        })

        // Get Clerk user info
        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
                ?.emailAddress || ""

        // Ensure user exists and update onboarding state
        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { role, onboardingComplete: true },
            create: {
                clerkId: userId,
                email,
                role,
                onboardingComplete: true,
                profile: { create: { name: sanitizeForDb(clerkUser.firstName ?? ""), bio: "" } },
            },
        })

        // --- STUDENT FLOW ---
        if (role === "STUDENT") {
            const dob = formData.get("dob") as string

            // Validate student data
            const validation = studentSchema.safeParse({ dob })
            if (!validation.success) {
                return { error: validation.error.issues[0].message }
            }

            const age = calculateAge(new Date(dob))

            if (age < 16) {
                return { error: "You must be at least 16 years old to use this platform" }
            }

            const needsApproval = age < 18

            const portfolio = await prisma.portfolio.upsert({
                where: { studentId: user.id },
                update: {
                    age,
                    approvalStatus: needsApproval ? "PENDING" : "APPROVED",
                    needsApproval,
                },
                create: {
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

            return {
                message: "Student portfolio created or updated",
                createdPortfolioId: portfolio.id,
                dashboard: "/dashboard/student",
            }
        }

        // --- COMPANY FLOW ---
        if (role === "COMPANY") {
            const rawData = {
                companyName: formData.get("companyName") as string,
                companyDescription: formData.get("companyDescription") as string,
                companyLocation: formData.get("companyLocation") as string,
                companyLatitude: formData.get("companyLatitude") ? parseFloat(formData.get("companyLatitude") as string) : null,
                companyLongitude: formData.get("companyLongitude") ? parseFloat(formData.get("companyLongitude") as string) : null,
                companyEik: formData.get("companyEik") as string,
                companyWebsite: (formData.get("companyWebsite") as string) || null,
                companyLogo: (formData.get("companyLogoHidden") as string) || null,
            }

            // Validate and sanitize company data
            const validation = companyFormSchema.safeParse(rawData)
            if (!validation.success) {
                return { error: validation.error.issues[0].message }
            }

            const { companyName, companyDescription, companyLocation, companyLatitude, companyLongitude, companyEik, companyWebsite, companyLogo } = validation.data

            const existing = await prisma.company.findFirst({
                where: { ownerId: user.id },
            })

            let createdCompany

            if (!existing) {
                // Generate unique invitation code for the company (DB-checked uniqueness)
                const invitationCode = await generateUniqueCompanyCode(prisma)
                
                createdCompany = await prisma.company.create({
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        latitude: companyLatitude || null,
                        longitude: companyLongitude || null,
                        website: companyWebsite || null,
                        ownerId: user.id,
                        eik: companyEik,
                        logo: companyLogo || null,
                        invitationCode: invitationCode,
                        codeEnabled: true,
                        codeUsageCount: 0,
                    },
                })

                // Create CompanyMember record for the owner with OWNER role
                await prisma.companyMember.create({
                    data: {
                        companyId: createdCompany.id,
                        userId: user.id,
                        defaultRole: "OWNER",
                        status: "ACTIVE",
                        invitedAt: new Date(),
                        joinedAt: new Date(),
                    },
                })
            } else {
                createdCompany = await prisma.company.update({
                    where: { id: existing.id },
                    data: {
                        name: companyName,
                        description: companyDescription,
                        location: companyLocation,
                        latitude: companyLatitude || null,
                        longitude: companyLongitude || null,
                        website: companyWebsite || null,
                        eik: companyEik,
                        logo: companyLogo || existing.logo,
                    },
                })
            }

            // Force update Prisma role to COMPANY
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

        // --- TEAM_MEMBER FLOW ---
        if (role === "TEAM_MEMBER") {
            const invitationCodeRaw = formData.get("invitationCode") as string

            // Validate team member data
            const validation = teamMemberSchema.safeParse({ invitationCode: invitationCodeRaw })
            if (!validation.success) {
                return { error: validation.error.issues[0].message }
            }

            const normalizedCode = normalizeCode(validation.data.invitationCode)

            // Find company by invitation code
            const company = await prisma.company.findFirst({
                where: { invitationCode: normalizedCode },
                include: {
                    _count: { select: { members: true } }
                }
            })

            if (!company) {
                return { error: "Invalid invitation code. Please check and try again." }
            }

            // Check if code is enabled
            if (!company.codeEnabled) {
                return { error: "This invitation code has been disabled by the company." }
            }

            // Check if code has expired
            if (company.codeExpiresAt && new Date() > company.codeExpiresAt) {
                return { error: "This invitation code has expired." }
            }

            // Check max team members limit
            if (company.maxTeamMembers && company._count.members >= company.maxTeamMembers) {
                return { error: "This company has reached its maximum team size." }
            }

            // Check if user is already a member of any company
            const existingMembership = await prisma.companyMember.findUnique({
                where: { userId: user.id }
            })

            if (existingMembership) {
                return { error: "You are already a member of a company. You cannot join another." }
            }

            // Create CompanyMember record with MEMBER role
            await prisma.companyMember.create({
                data: {
                    companyId: company.id,
                    userId: user.id,
                    defaultRole: "MEMBER",
                    status: "ACTIVE",
                    invitedAt: new Date(),
                    joinedAt: new Date(),
                },
            })

            // Create audit log entry
            await prisma.companyCodeJoin.create({
                data: {
                    companyId: company.id,
                    userId: user.id,
                }
            })

            // Increment code usage count
            await prisma.company.update({
                where: { id: company.id },
                data: { codeUsageCount: { increment: 1 } }
            })

            // Update user role to TEAM_MEMBER and complete onboarding
            await prisma.user.update({
                where: { id: user.id },
                data: { role: "TEAM_MEMBER", onboardingComplete: true },
            })

            // Update Clerk metadata
            await clerkClient.users.updateUser(userId, {
                publicMetadata: { role: "TEAM_MEMBER", onboardingComplete: true },
            })

            return {
                message: "Successfully joined company",
                companyName: company.name,
                dashboard: "/dashboard/team-member",
            }
        }

        return { error: "Unknown role" }
    } catch (err) {
        console.error("❌ completeOnboarding error:", err)
        return { error: "Error completing onboarding. Please try again." }
    }
}


function calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
}
