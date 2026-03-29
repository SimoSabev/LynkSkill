import { computeSkillOverlap, normalizeSkills } from "./skill-taxonomy"

export interface StudentProfile {
    skills: string[]
    location?: string | null
    availabilityStart?: string | null
    hoursPerWeek?: number | null
    remotePreference?: string | null // "remote" | "onsite" | "hybrid" | null
    salaryExpectation?: number | null
    careerGoals?: { industries?: string[]; dreamJob?: string; shortTermGoal?: string } | null
    experienceCount?: number // number of experiences/projects
}

export interface InternshipProfile {
    skills: string[]
    location?: string | null
    paid?: boolean
    salary?: number | null
    startDate?: string | null
    endDate?: string | null
    description?: string | null
    title?: string | null
}

export interface HybridScoreBreakdown {
    skillOverlap: number       // 0-100, weight 0.40
    locationMatch: number      // 0-100, weight 0.15
    experienceFit: number      // 0-100, weight 0.15
    availabilityMatch: number  // 0-100, weight 0.10
    salaryFit: number          // 0-100, weight 0.10
    careerAlignment: number    // 0-100, weight 0.10
    baseScore: number          // Weighted combination, 0-100
    matchedSkills: string[]
    missingSkills: string[]
}

const WEIGHTS = {
    skillOverlap: 0.40,
    locationMatch: 0.15,
    experienceFit: 0.15,
    availabilityMatch: 0.10,
    salaryFit: 0.10,
    careerAlignment: 0.10,
}

/**
 * Compute a deterministic base score for a student-internship pair.
 * This prevents score hallucination by grounding matches in measurable data.
 * The AI can then adjust by +-15 for soft factors.
 */
export function computeBaseScore(
    student: StudentProfile,
    internship: InternshipProfile
): HybridScoreBreakdown {
    // 1. Skill overlap (40%)
    const { matched, missing, overlapRatio } = computeSkillOverlap(
        student.skills,
        internship.skills
    )
    const skillOverlap = Math.round(overlapRatio * 100)

    // 2. Location match (15%)
    const locationMatch = computeLocationMatch(student, internship)

    // 3. Experience fit (15%)
    const experienceFit = computeExperienceFit(student.experienceCount ?? 0)

    // 4. Availability match (10%)
    const availabilityMatch = computeAvailabilityMatch(student, internship)

    // 5. Salary fit (10%)
    const salaryFit = computeSalaryFit(student, internship)

    // 6. Career alignment (10%)
    const careerAlignment = computeCareerAlignment(student, internship)

    const baseScore = Math.round(
        skillOverlap * WEIGHTS.skillOverlap +
        locationMatch * WEIGHTS.locationMatch +
        experienceFit * WEIGHTS.experienceFit +
        availabilityMatch * WEIGHTS.availabilityMatch +
        salaryFit * WEIGHTS.salaryFit +
        careerAlignment * WEIGHTS.careerAlignment
    )

    return {
        skillOverlap,
        locationMatch,
        experienceFit,
        availabilityMatch,
        salaryFit,
        careerAlignment,
        baseScore,
        matchedSkills: matched,
        missingSkills: missing,
    }
}

/**
 * Combine deterministic base score with AI adjustment.
 * AI adjustment is clamped to [-15, +15] to prevent hallucination.
 */
export function computeFinalScore(baseScore: number, aiAdjustment: number): number {
    const clampedAdjustment = Math.max(-15, Math.min(15, aiAdjustment))
    return Math.max(0, Math.min(100, baseScore + clampedAdjustment))
}

// --- Internal scoring functions ---

function computeLocationMatch(student: StudentProfile, internship: InternshipProfile): number {
    // If student prefers remote and location is flexible, full match
    if (student.remotePreference === "remote") return 80 // Remote is generally compatible
    if (!student.location || !internship.location) return 60 // Unknown — neutral
    // Simple city-level matching (case insensitive)
    const studentCity = student.location.toLowerCase().trim()
    const internshipCity = internship.location.toLowerCase().trim()
    if (studentCity === internshipCity) return 100
    if (internshipCity.includes(studentCity) || studentCity.includes(internshipCity)) return 90
    if (internshipCity.includes("remote") || internshipCity.includes("hybrid")) return 75
    return 30 // Different cities, no remote option
}

function computeExperienceFit(experienceCount: number): number {
    // For student internships, even 0 experience is okay but more is better
    if (experienceCount === 0) return 40 // Students are expected to have limited experience
    if (experienceCount === 1) return 60
    if (experienceCount === 2) return 75
    if (experienceCount >= 3) return 90
    return 50
}

function computeAvailabilityMatch(student: StudentProfile, internship: InternshipProfile): number {
    if (!student.availabilityStart || !internship.startDate) return 70 // Unknown — neutral-positive
    try {
        const studentStart = new Date(student.availabilityStart)
        const internshipStart = new Date(internship.startDate)
        const diffDays = Math.abs(studentStart.getTime() - internshipStart.getTime()) / (1000 * 3600 * 24)
        if (diffDays <= 7) return 100
        if (diffDays <= 30) return 80
        if (diffDays <= 60) return 60
        return 30
    } catch {
        return 70
    }
}

function computeSalaryFit(student: StudentProfile, internship: InternshipProfile): number {
    // If internship is unpaid and student has salary expectation, lower fit
    if (!internship.paid) {
        if (student.salaryExpectation && student.salaryExpectation > 0) return 30
        return 70 // No expectation, unpaid is okay for students
    }
    if (!student.salaryExpectation || !internship.salary) return 70 // Unknown — neutral
    const ratio = internship.salary / student.salaryExpectation
    if (ratio >= 1.0) return 100 // Pays more than expected
    if (ratio >= 0.8) return 80
    if (ratio >= 0.6) return 50
    return 30
}

function computeCareerAlignment(student: StudentProfile, internship: InternshipProfile): number {
    if (!student.careerGoals) return 50 // No goals specified — neutral

    let score = 50
    const titleLower = (internship.title ?? "").toLowerCase()
    const descLower = (internship.description ?? "").toLowerCase()
    const combined = `${titleLower} ${descLower}`

    // Check industry alignment
    if (student.careerGoals.industries) {
        for (const industry of student.careerGoals.industries) {
            if (combined.includes(industry.toLowerCase())) {
                score += 25
                break
            }
        }
    }

    // Check dream job alignment
    if (student.careerGoals.dreamJob) {
        const dreamWords = student.careerGoals.dreamJob.toLowerCase().split(/\s+/)
        const matchedWords = dreamWords.filter(w => w.length > 3 && combined.includes(w))
        if (matchedWords.length > 0) {
            score += Math.min(25, matchedWords.length * 10)
        }
    }

    return Math.min(100, score)
}

/**
 * Extract student skills from various profile data formats.
 * Handles both aiProfile.skillsAssessment (JSON) and portfolio.skills (string[]).
 */
export function extractStudentSkills(
    aiProfileSkills: unknown,
    portfolioSkills: unknown
): string[] {
    const skills: string[] = []

    // Extract from AI profile skillsAssessment (JSON with technical/soft keys)
    if (aiProfileSkills && typeof aiProfileSkills === "object") {
        const assessment = aiProfileSkills as Record<string, unknown>
        if (Array.isArray(assessment.technical)) {
            for (const s of assessment.technical) {
                if (typeof s === "string") skills.push(s)
                else if (typeof s === "object" && s && "name" in s) skills.push(String(s.name))
            }
        }
        if (Array.isArray(assessment.soft)) {
            for (const s of assessment.soft) {
                if (typeof s === "string") skills.push(s)
                else if (typeof s === "object" && s && "name" in s) skills.push(String(s.name))
            }
        }
    }

    // Extract from portfolio skills (string[])
    if (Array.isArray(portfolioSkills)) {
        for (const s of portfolioSkills) {
            if (typeof s === "string") skills.push(s)
        }
    }

    return normalizeSkills(skills)
}
