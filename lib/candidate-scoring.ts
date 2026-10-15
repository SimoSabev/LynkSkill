// lib/candidate-scoring.ts
// Single source of truth for candidate match scoring (candidates list,
// candidate detail page). Previously duplicated verbatim in each route.

export interface ScorableStudent {
    portfolio: {
        skills?: string[]
        interests?: string[]
        bio?: string | null
        headline?: string | null
    } | null
    projects: { title: string; description: string }[]
    experiences: unknown[]
}

export function calculateCandidateScore(student: ScorableStudent, requiredSkills: string[] = []) {
    let score = 0
    const reasons: string[] = []
    const matchedSkills: string[] = []

    const studentSkillsArray = (student.portfolio?.skills || []).map((s: string) => s.toLowerCase())
    const studentInterests = (student.portfolio?.interests || []).map((s: string) => s.toLowerCase())
    const bio = (student.portfolio?.bio || "").toLowerCase()
    const headline = (student.portfolio?.headline || "").toLowerCase()
    const projectsText = student.projects?.map(p =>
        `${p.title} ${p.description}`
    ).join(" ").toLowerCase() || ""

    const fullText = `${bio} ${headline} ${projectsText} ${studentSkillsArray.join(" ")} ${studentInterests.join(" ")}`

    // If required skills are provided, calculate match against them
    if (requiredSkills.length > 0) {
        for (const skill of requiredSkills) {
            const skillLower = skill.toLowerCase()

            // Direct skill match (highest weight)
            if (studentSkillsArray.some(s => s.includes(skillLower) || skillLower.includes(s))) {
                score += 30
                matchedSkills.push(skill)
                reasons.push(`Skilled in ${skill}`)
            }
            // Skill in projects (high weight)
            else if (projectsText.includes(skillLower)) {
                score += 20
                matchedSkills.push(skill)
                reasons.push(`${skill} in projects`)
            }
            // Skill mentioned elsewhere (medium weight)
            else if (fullText.includes(skillLower)) {
                score += 15
                matchedSkills.push(skill)
                reasons.push(`Experience with ${skill}`)
            }
        }
    } else {
        // No required skills - evaluate based on profile completeness
        if (student.portfolio?.bio && student.portfolio.bio.length > 50) {
            score += 15
            reasons.push("Detailed portfolio")
        }
        if (student.portfolio?.headline) {
            score += 10
            reasons.push("Professional headline")
        }
        if (studentSkillsArray.length > 0) {
            score += Math.min(studentSkillsArray.length * 5, 25)
            reasons.push(`${studentSkillsArray.length} skills listed`)
        }
    }

    // Bonus for projects (shows practical experience)
    if (student.projects && student.projects.length > 0) {
        const projectBonus = Math.min(student.projects.length * 5, 15)
        score += projectBonus
        reasons.push(`${student.projects.length} project${student.projects.length > 1 ? 's' : ''}`)
    }

    // Bonus for work experience
    if (student.experiences && student.experiences.length > 0) {
        score += 10
        reasons.push(`${student.experiences.length} experience${student.experiences.length > 1 ? 's' : ''}`)
    }

    // Cap at 98
    score = Math.min(score, 98)

    return { score, reasons, matchedSkills }
}

// Experience endorsement score (used for notifications and leaderboard)
export function calculateSkillScore(experience: {
    skillsRating?: number | null
    impactRating?: number | null
    growthRating?: number | null
    recommendation?: string | null
}): number {
    const skills = experience.skillsRating || 0
    const impact = experience.impactRating || 0
    const growth = experience.growthRating || 0

    // Recommendation bonus
    let recommendationBonus = 0
    switch (experience.recommendation) {
        case 'highly_recommend': recommendationBonus = 15; break
        case 'recommend': recommendationBonus = 10; break
        case 'neutral': recommendationBonus = 5; break
        case 'not_recommend': recommendationBonus = 0; break
    }

    // Weighted calculation: skills (40%) + impact (35%) + growth (25%) + recommendation bonus
    return Math.round((skills * 8) + (impact * 7) + (growth * 5) + recommendationBonus)
}
