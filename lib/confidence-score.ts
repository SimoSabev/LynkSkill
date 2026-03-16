import { prisma } from "@/lib/prisma";

export interface ConfidenceScoreBreakdown {
    profileCompleteness: number; // 40% weight
    profilingDepth: number;      // 30% weight
    endorsementQuality: number;  // 20% weight
    activityScore: number;       // 10% weight
    overall: number;             // 100% total
}

// Calculate how many fields in AIProfile are populated
function calculateProfileCompleteness(aiProfile: Record<string, unknown> | null): number {
    if (!aiProfile) return 0;
    
    // Check key JSON fields
    const fieldsToCheck = [
        'personalInfo', 'careerGoals', 'personalityTraits', 
        'skillsAssessment', 'educationDetails', 'availability', 'preferences'
    ];
    
    let filledFields = 0;
    for (const field of fieldsToCheck) {
        if (aiProfile[field] && Object.keys(aiProfile[field]).length > 0) {
            filledFields++;
        }
    }
    
    // Convert to 0-100 scale
    return Math.min(100, Math.round((filledFields / fieldsToCheck.length) * 100));
}

// Calculate how deep the AI profiling went
function calculateProfilingDepth(aiProfile: Record<string, unknown> | null): number {
    if (!aiProfile) return 0;
    
    const _asked = typeof aiProfile.questionsAsked === 'number' ? aiProfile.questionsAsked : 0;
    const answered = typeof aiProfile.questionsAnswered === 'number' ? aiProfile.questionsAnswered : 0;
    
    if (answered === 0) return 0;
    
    // Assume 15 questions is "100% depth" for a full profile
    const TARGET_QUESTIONS = 15;
    
    return Math.min(100, Math.round((answered / TARGET_QUESTIONS) * 100));
}

// Calculate endorsement score from experiences
function calculateEndorsementQuality(experiences: Record<string, unknown>[]): number {
    if (!experiences || experiences.length === 0) return 0;
    
    let totalScore = 0;
    let endorsementsWithRatings = 0;
    
    for (const exp of experiences) {
        // Assume 1-5 scale mapped to 0-100
        const skillsRating = typeof exp.skillsRating === 'number' ? exp.skillsRating : null;
        const impactRating = typeof exp.impactRating === 'number' ? exp.impactRating : null;
        const growthRating = typeof exp.growthRating === 'number' ? exp.growthRating : null;
        const grade = typeof exp.grade === 'number' ? exp.grade : null;
        
        if (skillsRating || impactRating || growthRating || grade) {
            let avgRating = 0;
            let ratingCount = 0;
            
            if (skillsRating !== null) { avgRating += skillsRating; ratingCount++; }
            if (impactRating !== null) { avgRating += impactRating; ratingCount++; }
            if (growthRating !== null) { avgRating += growthRating; ratingCount++; }
            
            if (ratingCount > 0) {
                // Average of the multiple ratings (1-5) converted to percentage
                totalScore += (avgRating / ratingCount) * 20; // 5 * 20 = 100
                endorsementsWithRatings++;
            } else if (grade !== null) {
                // Fallback to legacy grade
                const gradeMax = 100; // Assuming 100 is max grade
                totalScore += Math.min(100, (grade / gradeMax) * 100);
                endorsementsWithRatings++;
            }
        }
    }
    
    if (endorsementsWithRatings === 0) return 20; // Base score for having an experience without ratings yet
    
    return Math.min(100, Math.round(totalScore / endorsementsWithRatings));
}

// Calculate activity score based on recent logins or message activity
function calculateActivityScore(lastLoginDate: Date | null, conversationsCount: number): number {
    let score = 50; // Base score
    
    if (lastLoginDate) {
        const daysSinceLogin = Math.floor((new Date().getTime() - lastLoginDate.getTime()) / (1000 * 3600 * 24));
        if (daysSinceLogin < 7) score += 30; // Active this week
        else if (daysSinceLogin < 30) score += 10; // Active this month
    }
    
    // Bonus for having active conversations
    score += Math.min(20, conversationsCount * 5);
    
    return Math.min(100, score);
}

export async function calculateAndSaveConfidenceScore(studentId: string): Promise<ConfidenceScoreBreakdown> {
    try {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                aiProfile: true,
                experiences: true,
                conversations: true
            }
        });
        
        if (!student) throw new Error("Student not found");
        if (!student.aiProfile) {
            // If they don't have an AI profile yet, default everything to 0
            return {
                profileCompleteness: 0,
                profilingDepth: 0,
                endorsementQuality: 0,
                activityScore: 0,
                overall: 0
            };
        }

        const profileCompleteness = calculateProfileCompleteness(student.aiProfile);
        const profilingDepth = calculateProfilingDepth(student.aiProfile);
        const endorsementQuality = calculateEndorsementQuality(student.experiences || []);
        
        // Activity score based on conversations (since we don't have lastLoginAt in schema)
        const activityScore = calculateActivityScore(new Date(), student.conversations?.length || 0);
        
        // Calculate weighted overall score
        // 40% profile completeness + 30% depth + 20% endorsements + 10% activity
        const overallScore = Math.round(
            (profileCompleteness * 0.40) +
            (profilingDepth * 0.30) +
            (endorsementQuality * 0.20) +
            (activityScore * 0.10)
        );
        
        const scoreData = {
            profileCompleteness,
            profilingDepth,
            endorsementQuality,
            activityScore,
            overallScore
        };
        
        // Save to database
        const existingScore = await prisma.confidenceScore.findUnique({
            where: { aiProfileId: student.aiProfile.id }
        });
        
        // Append to history if we want to track over time
        const newHistoryEntry = {
            score: overallScore,
            date: new Date().toISOString(),
            reason: "Recalculated"
        };
        
        let scoreHistory: Array<{ score: number; date: string; reason: string }> = [];
        if (existingScore && existingScore.scoreHistory) {
            const history = Array.isArray(existingScore.scoreHistory) ? existingScore.scoreHistory : [];
            // Filter and validate history entries
            scoreHistory = history.filter((entry): entry is { score: number; date: string; reason: string } =>
                typeof entry === 'object' && entry !== null &&
                'score' in entry && typeof (entry as { score: unknown }).score === 'number' &&
                'date' in entry && typeof (entry as { date: unknown }).date === 'string' &&
                'reason' in entry && typeof (entry as { reason: unknown }).reason === 'string'
            );
            // Keep last 10 entries
            if (scoreHistory.length >= 10) scoreHistory.shift();
            scoreHistory.push(newHistoryEntry);
        } else {
            scoreHistory = [newHistoryEntry];
        }

        await prisma.confidenceScore.upsert({
            where: { aiProfileId: student.aiProfile.id },
            update: {
                ...scoreData,
                scoreHistory: JSON.stringify(scoreHistory),
                lastCalculatedAt: new Date()
            },
            create: {
                aiProfile: { connect: { id: student.aiProfile.id } },
                ...scoreData,
                scoreHistory: JSON.stringify(scoreHistory)
            }
        });
        
        return {
            ...scoreData,
            overall: overallScore
        };
        
    } catch (error) {
        console.error("Error calculating confidence score:", error);
        throw error;
    }
}
