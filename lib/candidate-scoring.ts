// lib/candidate-scoring.ts

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
