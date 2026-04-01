import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"
import { computeBaseScore, computeFinalScore, extractStudentSkills, type StudentProfile, type InternshipProfile } from "./hybrid-scoring"

// Process a batch of students to find matching internships and notify them
export async function runStudentMatchmaker() {
    // 1. Fetch active internships that are still open
    const openInternships = await prisma.internship.findMany({
        where: {
            applicationEnd: { gt: new Date() }
        },
        include: { company: true },
        take: 50
    })

    if (openInternships.length === 0) return 0

    // 2. Fetch students — lowered threshold to 10 so even new users get matches
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            aiProfile: { include: { confidenceScore: true } },
            portfolio: { select: { skills: true, interests: true, headline: true } },
            applications: { select: { internshipId: true } },
        },
        take: 100
    })

    // Pre-fetch recent match notifications to avoid re-notifying for the same internships
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentMatchNotifications = await prisma.notification.findMany({
        where: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: "AI_MATCHMAKER" as any,
            createdAt: { gt: sevenDaysAgo },
        },
        select: { userId: true, metadata: true },
    })

    // Build a set of "userId:internshipId" pairs already notified
    const alreadyNotifiedSet = new Set<string>()
    for (const notif of recentMatchNotifications) {
        try {
            const meta = typeof notif.metadata === "string" ? JSON.parse(notif.metadata) : notif.metadata
            if (meta?.matches) {
                for (const m of meta.matches) {
                    if (m.internshipId) alreadyNotifiedSet.add(`${notif.userId}:${m.internshipId}`)
                }
            }
            if (meta?.internshipId) {
                alreadyNotifiedSet.add(`${notif.userId}:${meta.internshipId}`)
            }
        } catch { /* skip malformed metadata */ }
    }

    let notificationsCreated = 0

    for (const student of students) {
        // Skip students with zero info — but allow very low scores
        const hasAnyProfile = student.aiProfile?.skillsAssessment || (student.portfolio?.skills && student.portfolio.skills.length > 0)
        if (!hasAnyProfile) continue

        // Don't recommend internships they already applied to OR were recently notified about
        const appliedIds = new Set(student.applications.map(a => a.internshipId))
        const eligibleInternships = openInternships.filter(i =>
            !appliedIds.has(i.id) && !alreadyNotifiedSet.has(`${student.id}:${i.id}`)
        )
        if (eligibleInternships.length === 0) continue

        // Build normalized student profile for hybrid scoring
        const studentSkills = extractStudentSkills(
            student.aiProfile?.skillsAssessment,
            student.portfolio?.skills
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const careerGoals = student.aiProfile?.careerGoals as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const preferences = student.aiProfile?.preferences as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const availability = student.aiProfile?.availability as any

        const studentProfile: StudentProfile = {
            skills: studentSkills,
            location: preferences?.location ?? null,
            availabilityStart: availability?.startDate ?? null,
            hoursPerWeek: availability?.hoursPerWeek ?? null,
            remotePreference: preferences?.remote ?? null,
            salaryExpectation: preferences?.salary ?? null,
            careerGoals: careerGoals ? {
                industries: careerGoals.industries ?? [],
                dreamJob: careerGoals.dreamJob ?? null,
                shortTermGoal: careerGoals.shortTermGoal ?? null,
            } : null,
            experienceCount: 0, // Will be enriched if available
        }

        // Compute deterministic base scores for all eligible internships
        const scoredInternships = eligibleInternships.map(i => {
            const internshipProfile: InternshipProfile = {
                skills: Array.isArray(i.skills) ? i.skills : [],
                location: i.location,
                paid: i.paid,
                salary: i.salary ? Number(i.salary) : null,
                startDate: i.startDate?.toISOString() ?? null,
                endDate: i.endDate?.toISOString() ?? null,
                description: i.description,
                title: i.title,
            }
            const breakdown = computeBaseScore(studentProfile, internshipProfile)
            return { internship: i, breakdown }
        })

        // Pre-filter: only send internships with baseScore >= 40 to AI for evaluation
        const candidateInternships = scoredInternships
            .filter(s => s.breakdown.baseScore >= 40)
            .sort((a, b) => b.breakdown.baseScore - a.breakdown.baseScore)
            .slice(0, 8) // Limit AI context

        if (candidateInternships.length === 0) continue

        const studentProfileStr = JSON.stringify({
            skills: studentSkills,
            goals: careerGoals ?? null,
            preferences: preferences ?? null,
            headline: student.portfolio?.headline ?? null,
            interests: student.portfolio?.interests ?? [],
        })

        const internshipsWithScores = candidateInternships.map(c => ({
            id: c.internship.id,
            title: c.internship.title,
            company: c.internship.company?.name,
            requirements: c.internship.qualifications,
            skills: c.internship.skills,
            location: c.internship.location,
            paid: c.internship.paid,
            salary: c.internship.salary,
            baseScore: c.breakdown.baseScore,
            matchedSkills: c.breakdown.matchedSkills,
            missingSkills: c.breakdown.missingSkills,
        }))

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are Linky's Matchmaker for Bulgarian students. Each internship already has a deterministic baseScore. Your job is to evaluate SOFT FACTORS and provide an aiAdjustment between -15 and +15.

Soft factors to consider:
- Transferable skills (student has related skills even if not exact match)
- Growth potential (student's interests align with the role)
- Personality/culture fit signals from their goals
- Missing skills that are easy to learn vs. hard gaps

Select the 1-3 BEST matches where (baseScore + aiAdjustment) >= 60.

Respond ONLY in valid JSON:
{
    "matches": [
        {
            "internshipId": "string",
            "aiAdjustment": 10,
            "matchReason": "Short, enthusiastic reason (1 sentence)",
            "skillsAligned": ["React", "JavaScript"],
            "growthOpportunity": "What they'd learn in this role (1 sentence)",
            "actionLabel": "Apply now",
            "urgency": "high"
        }
    ]
}`
                    },
                    {
                        role: "user",
                        content: `Student Profile: ${studentProfileStr}\n\nInternships (with base scores): ${JSON.stringify(internshipsWithScores)}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) continue;

            const result = JSON.parse(content) as { matches: { internshipId: string; aiAdjustment: number; matchReason: string; skillsAligned?: string[]; growthOpportunity?: string; actionLabel?: string; urgency?: string }[] };

            if (result.matches && result.matches.length > 0) {
                // Compute final scores using hybrid system
                const finalMatches = result.matches
                    .map(m => {
                        const scored = candidateInternships.find(c => c.internship.id === m.internshipId)
                        if (!scored) return null
                        const finalScore = computeFinalScore(scored.breakdown.baseScore, m.aiAdjustment)
                        if (finalScore < 60) return null
                        return {
                            internshipId: m.internshipId,
                            matchScore: finalScore,
                            baseScore: scored.breakdown.baseScore,
                            aiAdjustment: m.aiAdjustment,
                            matchReason: m.matchReason,
                            skillsAligned: m.skillsAligned ?? scored.breakdown.matchedSkills,
                            missingSkills: scored.breakdown.missingSkills,
                            growthOpportunity: m.growthOpportunity ?? null,
                            actionLabel: m.actionLabel,
                            urgency: m.urgency,
                        }
                    })
                    .filter((m): m is NonNullable<typeof m> => m !== null)

                if (finalMatches.length === 0) continue

                const matchCount = finalMatches.length
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const topMatchInternship: any = eligibleInternships.find(i => i.id === finalMatches[0].internshipId)
                if (!topMatchInternship) continue

                const topScore = finalMatches[0].matchScore
                const message = matchCount === 1
                    ? `🎯 Linky found a match! **${topMatchInternship.title}** at **${topMatchInternship.company.name}** (${topScore}% fit). ${finalMatches[0].matchReason}`
                    : `🎯 Linky found ${matchCount} matches for you! Top pick: **${topMatchInternship.title}** at **${topMatchInternship.company.name}** (${topScore}% fit).`

                const metadata = {
                    matches: finalMatches,
                    actions: finalMatches.map(m => ({
                        internshipId: m.internshipId,
                        label: m.actionLabel || "Apply now",
                        type: "linky_apply",
                        matchScore: m.matchScore,
                    })),
                    topMatchCompany: topMatchInternship.company?.name,
                    topMatchTitle: topMatchInternship.title,
                }

                await prisma.notification.create({
                    data: {
                        userId: student.id,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        type: "AI_MATCHMAKER" as any,
                        title: "Linky Found You a Match! 🎯",
                        message,
                        link: `/dashboard/student/internships`,
                        metadata: JSON.stringify(metadata),
                    }
                })
                notificationsCreated++
            }
        } catch (error) {
            console.error(`Failed matchmaker for student ${student.id}:`, error);
        }
    }

    return notificationsCreated;
}

// Process companies with open postings — PROACTIVELY push high-confidence students
// This is the core "AI middleman" feature: students don't need to apply,
// Linky pushes them to companies based on their confidence score + match quality
export async function runCompanyMatchmaker() {
    // 1. Fetch active company postings
    const allPostings = await prisma.internship.findMany({
        where: {
            applicationEnd: { gt: new Date() }
        },
        include: {
            company: true,
            _count: { select: { applications: true } }
        },
        take: 50
    });

    // Prioritize postings with fewer applicants
    const postings = allPostings.sort((a, b) => a._count.applications - b._count.applications).slice(0, 30);

    if (postings.length === 0) return 0;

    // 2. Fetch students with meaningful profiles — protect company trust by requiring quality
    const students = (await prisma.aIProfile.findMany({
        where: {
            confidenceScore: { overallScore: { gt: 45 } } // Raised threshold — only push students with real profiles
        },
        include: {
            confidenceScore: true,
            student: {
                select: {
                    id: true,
                    email: true,
                    profile: { select: { name: true } },
                    portfolio: {
                        select: {
                            fullName: true,
                            headline: true,
                            bio: true,
                            skills: true,
                            experience: true,
                            education: true,
                            projects: true
                        }
                    }
                }
            }
        },
        take: 100
    })).filter(s => {
        // Quality gate: must have at least 3 skills AND a headline to be pushed to companies
        const skills = s.student?.portfolio?.skills
        const headline = s.student?.portfolio?.headline
        const hasEnoughSkills = Array.isArray(skills) && skills.length >= 3
        const hasHeadline = !!headline && headline.trim().length > 0
        return hasEnoughSkills && hasHeadline
    });

    if (students.length === 0) return 0;

    // Pre-fetch deduplication data: existing pushes and recent rejections
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [existingPushNotifications, recentRejections] = await Promise.all([
        // Find all AI_MATCHMAKER notifications with pushedByLinky in the last 30 days
        prisma.notification.findMany({
            where: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: "AI_MATCHMAKER" as any,
                createdAt: { gt: thirtyDaysAgo },
                NOT: { metadata: { equals: undefined } },
            },
            select: { userId: true, metadata: true },
        }),
        // Find students rejected by companies in the last 30 days
        prisma.application.findMany({
            where: {
                status: "REJECTED",
                updatedAt: { gt: thirtyDaysAgo },
            },
            select: { studentId: true, internship: { select: { companyId: true } } },
        }),
    ])

    // Build lookup sets for fast dedup checks
    // Key: "studentId:internshipId" — tracks which students were already pushed for which postings
    const alreadyPushedSet = new Set<string>()
    for (const notif of existingPushNotifications) {
        try {
            const meta = typeof notif.metadata === "string" ? JSON.parse(notif.metadata) : notif.metadata
            if (meta?.pushedByLinky && meta?.internshipId) {
                alreadyPushedSet.add(`${notif.userId}:${meta.internshipId}`)
            }
        } catch { /* skip malformed metadata */ }
    }

    // Key: "studentId:companyId" — tracks which students were recently rejected by which companies
    const rejectedByCompanySet = new Set<string>()
    for (const rejection of recentRejections) {
        if (rejection.studentId && rejection.internship?.companyId) {
            rejectedByCompanySet.add(`${rejection.studentId}:${rejection.internship.companyId}`)
        }
    }

    // Pre-fetch company match preferences for all posting companies
    const companyIds = [...new Set(postings.map(p => p.companyId).filter(Boolean))]
    const companyPrefs = await prisma.companyMatchPreferences.findMany({
        where: { companyId: { in: companyIds } },
    }).catch(() => [])
    const prefsByCompany = new Map<string, { preferredSkills: string[]; excludedSkills: string[]; preferredTraits: string | null; notes: string | null }>()
    for (const pref of companyPrefs) {
        prefsByCompany.set(pref.companyId, pref)
    }

    let notificationsCreated = 0;

    // 3. For each posting, find top candidates and push them
    for (const posting of postings) {
        const internshipProfile: InternshipProfile = {
            skills: Array.isArray(posting.skills) ? posting.skills : [],
            location: posting.location,
            paid: posting.paid,
            salary: posting.salary ? Number(posting.salary) : null,
            startDate: posting.startDate?.toISOString() ?? null,
            endDate: posting.endDate?.toISOString() ?? null,
            description: posting.description,
            title: posting.title,
        }

        // Filter out students already pushed for this posting or recently rejected by this company
        const eligibleStudents = students.filter(s => {
            const studentId = s.studentId
            if (!studentId) return false
            if (alreadyPushedSet.has(`${studentId}:${posting.id}`)) return false
            if (posting.companyId && rejectedByCompanySet.has(`${studentId}:${posting.companyId}`)) return false
            return true
        })

        if (eligibleStudents.length === 0) continue

        // Compute deterministic base scores for each candidate
        const scoredCandidates = eligibleStudents.map(s => {
            const candidateSkills = extractStudentSkills(
                s.skillsAssessment,
                s.student?.portfolio?.skills
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const goals = s.careerGoals as any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prefs = s.preferences as any

            const profile: StudentProfile = {
                skills: candidateSkills,
                location: prefs?.location ?? null,
                careerGoals: goals ? {
                    industries: goals.industries ?? [],
                    dreamJob: goals.dreamJob ?? null,
                    shortTermGoal: goals.shortTermGoal ?? null,
                } : null,
                experienceCount: 0,
            }
            const breakdown = computeBaseScore(profile, internshipProfile)
            return { student: s, breakdown, candidateSkills }
        })

        // Pre-filter: only send candidates with baseScore >= 35 to AI
        const viableCandidates = scoredCandidates
            .filter(c => c.breakdown.baseScore >= 35)
            .sort((a, b) => b.breakdown.baseScore - a.breakdown.baseScore)
            .slice(0, 10)

        if (viableCandidates.length === 0) continue

        const postingStr = JSON.stringify({
            title: posting.title,
            requirements: posting.qualifications,
            skills: posting.skills,
            description: posting.description?.slice(0, 400),
        })

        const candidatesWithScores = viableCandidates.map(c => ({
            id: c.student.studentId,
            name: c.student.student?.portfolio?.fullName || c.student.student?.profile?.name || c.student.student?.email || "Candidate",
            headline: c.student.student?.portfolio?.headline,
            confidenceScore: c.student.confidenceScore?.overallScore ?? 0,
            baseScore: c.breakdown.baseScore,
            matchedSkills: c.breakdown.matchedSkills,
            missingSkills: c.breakdown.missingSkills,
            careerGoals: c.student.careerGoals,
        }))

        // Load company preferences if available
        const companyPref = posting.companyId ? prefsByCompany.get(posting.companyId) : undefined
        let preferencesBlock = ""
        if (companyPref) {
            const parts: string[] = []
            if (companyPref.preferredSkills?.length > 0) parts.push(`PREFERRED skills: ${companyPref.preferredSkills.join(", ")}`)
            if (companyPref.excludedSkills?.length > 0) parts.push(`EXCLUDED skills (do NOT match): ${companyPref.excludedSkills.join(", ")}`)
            if (companyPref.preferredTraits) parts.push(`Preferred traits: ${companyPref.preferredTraits}`)
            if (companyPref.notes) parts.push(`Company notes: ${companyPref.notes}`)
            if (parts.length > 0) {
                preferencesBlock = `\n\nCOMPANY PREFERENCES (from the hiring team — these override defaults):\n${parts.join("\n")}\n`
            }
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are Linky's AI Middleman for a Bulgarian internship platform. Each candidate has a deterministic baseScore already calculated. Your job is to evaluate SOFT FACTORS and provide an aiAdjustment between -15 and +15.

Soft factors to consider:
- Transferable skills not captured in exact skill matching
- Career trajectory alignment
- Confidence Score reliability (higher = more trustworthy data)
- Unique strengths visible in their headline/goals
${preferencesBlock}
Select top 1-3 candidates where (baseScore + aiAdjustment) >= 55. Prefer students with higher confidence scores.

Respond ONLY in valid JSON:
{
    "matches": [
        {
            "studentId": "string",
            "studentName": "string",
            "aiAdjustment": 10,
            "matchReason": "Detailed reason why (2 sentences)",
            "highlight": "The single most impressive thing about this candidate"
        }
    ]
}`
                    },
                    {
                        role: "user",
                        content: `Job Posting: ${postingStr}\n\nCandidates (with base scores): ${JSON.stringify(candidatesWithScores)}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) continue;

            const result = JSON.parse(content) as { matches: { studentId: string; studentName: string; aiAdjustment: number; matchReason: string; highlight?: string }[] };

            if (result.matches && result.matches.length > 0) {
                const cmpOwnerId = posting.company?.ownerId;
                const companyName = posting.company?.name || "a top company";

                if (!cmpOwnerId) continue;

                // Compute final scores with clamped AI adjustments
                const finalMatches = result.matches
                    .map(m => {
                        const scored = viableCandidates.find(c => c.student.studentId === m.studentId)
                        if (!scored) return null
                        const finalScore = computeFinalScore(scored.breakdown.baseScore, m.aiAdjustment)
                        if (finalScore < 55) return null
                        return {
                            studentId: m.studentId,
                            studentName: m.studentName,
                            confidenceScore: scored.student.confidenceScore?.overallScore ?? 0,
                            matchScore: finalScore,
                            baseScore: scored.breakdown.baseScore,
                            matchReason: m.matchReason,
                            highlight: m.highlight ?? m.matchReason,
                            matchedSkills: scored.breakdown.matchedSkills,
                            missingSkills: scored.breakdown.missingSkills,
                        }
                    })
                    .filter((m): m is NonNullable<typeof m> => m !== null)

                if (finalMatches.length === 0) continue

                const topMatch = finalMatches[0];
                const message = `🤖 Linky pushed ${finalMatches.length} candidate${finalMatches.length > 1 ? "s" : ""} to your "${posting.title}" role.

🏆 Top: **${topMatch.studentName}** (${topMatch.matchScore}% fit, Score: ${topMatch.confidenceScore}/100)
💡 ${topMatch.highlight}`;

                await prisma.notification.create({
                    data: {
                        userId: cmpOwnerId,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        type: "AI_MATCHMAKER" as any,
                        title: "Linky Pushed Candidates to You ⭐",
                        message,
                        link: `/dashboard/company/candidates`,
                        metadata: JSON.stringify({
                            internshipId: posting.id,
                            matches: finalMatches,
                            pushedByLinky: true,
                        })
                    }
                });
                notificationsCreated++;

                // Notify students that Linky is pushing them
                for (const match of finalMatches) {
                    if (!match.studentId) continue;

                    await prisma.notification.create({
                        data: {
                            userId: match.studentId,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            type: "AI_MATCHMAKER" as any,
                            title: "Linky Pushed You to a Company! 🚀",
                            message: `Linky presented your profile to **${companyName}** for their "${posting.title}" role (${match.matchScore}% match). Your Confidence Score made this possible — keep it high!`,
                            link: `/dashboard/student/internships`,
                            metadata: JSON.stringify({
                                internshipId: posting.id,
                                companyId: posting.companyId,
                                companyName,
                                matchScore: match.matchScore,
                                matchedSkills: match.matchedSkills,
                                missingSkills: match.missingSkills,
                                pushedByLinky: true,
                            })
                        }
                    });
                    notificationsCreated++;
                }
            }
        } catch (error) {
            console.error(`Failed company matchmaker for posting ${posting.id}:`, error);
        }
    }

    return notificationsCreated;
}
