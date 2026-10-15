"use server"

import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { validateEIK } from "@/lib/validateEIK"

/**
 * Onboarding is a two-step flow driven by the onboarding page:
 *  1. First call creates the Portfolio / Company and returns its id, so the
 *     client can record ToS + Privacy acceptance via /api/{student,company}/accept-policies.
 *  2. Final call (form submit) marks onboarding complete - but only if the
 *     policies were actually accepted server-side.
 *
 * `onboardingComplete` is written to Clerk metadata *last*, after every
 * validation and DB write succeeded. Previously it was set first, so a failed
 * validation (or skipping the policy modal) still left the user "onboarded".
 */
export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth()
    if (!userId) return { error: "No logged in user" }

    // ✅ Require explicit role selection (no auto-student)
    const roleInput = (formData.get("role") as string)?.toLowerCase()
    if (roleInput !== "company" && roleInput !== "student") {
        return { error: "Please select your role before continuing." }
    }

    const role: "COMPANY" | "STUDENT" = roleInput === "company" ? "COMPANY" : "STUDENT"

    try {
        const existingUser = await prisma.user.findUnique({ where: { clerkId: userId } })

        // Role is immutable once onboarding is complete
        if (existingUser?.onboardingComplete && existingUser.role !== role) {
            return { error: "Your account role has already been set and cannot be changed." }
        }

        // Get Clerk user info
        const clerkUser = await clerkClient.users.getUser(userId)
        const email =
            clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
                ?.emailAddress || ""

        // --- STUDENT FLOW ---
        if (role === "STUDENT") {
            const dob = parseDob(formData.get("dob") as string | null)
            if (!dob) {
                return { error: "Please enter a valid date of birth." }
            }

            const age = calculateAge(dob)
            if (age < 16) {
                return { error: "You must be at least 16 years old to use this platform" }
            }

            const needsApproval = age < 18

            const user = await prisma.user.upsert({
                where: { clerkId: userId },
                update: { role, email: email || undefined },
                create: {
                    clerkId: userId,
                    email,
                    role,
                    profile: { create: { name: clerkUser.firstName ?? "", bio: "" } },
                },
            })

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

            if (!(user.tosAccepted && user.privacyAccepted)) {
                // Step 1 done - client must accept policies, then submit again
                return {
                    message: "Student portfolio created or updated",
                    createdPortfolioId: portfolio.id,
                    needsPolicies: true,
                }
            }

            await finalizeOnboarding(userId, user.id, role)

            return {
                message: "Student portfolio created or updated",
                createdPortfolioId: portfolio.id,
                dashboard: "/dashboard/student",
            }
        }

        // --- COMPANY FLOW ---
        const companyName = ((formData.get("companyName") as string) || "").trim()
        const companyDescription = ((formData.get("companyDescription") as string) || "").trim()
        const companyLocation = ((formData.get("companyLocation") as string) || "").trim()
        const companyWebsite = ((formData.get("companyWebsite") as string) || "").trim() || null
        const companyEik = ((formData.get("companyEik") as string) || "").trim()
        const companyLogo = sanitizeLogoUrl(formData.get("companyLogoHidden") as string | null)

        // ✅ Require all company fields
        if (!companyName || !companyDescription || !companyLocation || !companyEik) {
            return { error: "Please fill all required company fields" }
        }

        // ✅ Validate EIK checksum (9 or 13 digits) - same algorithm as /api/validate-eik
        if (!validateEIK(companyEik)) {
            return { error: "Invalid EIK — must be a valid 9 or 13 digit Bulgarian EIK" }
        }

        if (companyWebsite && !/^https?:\/\/[^\s]+$/i.test(companyWebsite)) {
            return { error: "Company website must start with http:// or https://" }
        }

        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: { role, email: email || undefined },
            create: {
                clerkId: userId,
                email,
                role,
                profile: { create: { name: clerkUser.firstName ?? "", bio: "" } },
            },
        })

        const existing = await prisma.company.findFirst({
            where: { ownerId: user.id },
        })

        const companyData = {
            name: companyName.slice(0, 200),
            description: companyDescription.slice(0, 5000),
            location: companyLocation.slice(0, 200),
            website: companyWebsite,
            eik: companyEik,
        }

        const company = existing
            ? await prisma.company.update({
                where: { id: existing.id },
                data: { ...companyData, logo: companyLogo || existing.logo },
            })
            : await prisma.company.create({
                data: { ...companyData, ownerId: user.id, logo: companyLogo },
            })

        if (!(company.tosAccepted && company.privacyAccepted)) {
            // Step 1 done - client must accept policies, then submit again
            return {
                message: "Company created",
                createdCompanyId: company.id,
                needsPolicies: true,
            }
        }

        await finalizeOnboarding(userId, user.id, role)

        return {
            message: "Company onboarding complete",
            createdCompanyId: company.id,
            dashboard: "/dashboard/company",
        }
    } catch (err) {
        console.error("❌ completeOnboarding error:", err)
        return { error: "Error completing onboarding" }
    }
}

async function finalizeOnboarding(clerkId: string, dbUserId: string, role: "STUDENT" | "COMPANY") {
    await prisma.user.update({
        where: { id: dbUserId },
        data: { role, onboardingComplete: true },
    })
    // Clerk last: middleware trusts these claims for routing
    await clerkClient.users.updateUser(clerkId, {
        publicMetadata: { role, onboardingComplete: true },
    })
}

function parseDob(raw: string | null): Date | null {
    if (!raw) return null
    const date = new Date(raw)
    if (isNaN(date.getTime())) return null
    if (date > new Date()) return null
    if (date.getFullYear() < 1900) return null
    return date
}

function calculateAge(dob: Date): number {
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const hadBirthday =
        now.getMonth() > dob.getMonth() ||
        (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate())
    if (!hadBirthday) age--
    return age
}

// Only accept logos uploaded through /api/upload-logo into our Supabase bucket
function sanitizeLogoUrl(raw: string | null): string | null {
    if (!raw) return null
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!base) return null
    const allowedPrefix = `${base.replace(/\/$/, "")}/storage/v1/object/public/logos/`
    return raw.startsWith(allowedPrefix) ? raw : null
}
