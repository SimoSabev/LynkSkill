import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"
import { NotificationType } from "@prisma/client"

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

    let notificationsCreated = 0

    for (const student of students) {
        // Skip students with zero info — but allow very low scores
        const hasAnyProfile = student.aiProfile?.skillsAssessment || (student.portfolio?.skills && student.portfolio.skills.length > 0)
        if (!hasAnyProfile) continue

        // Don't recommend internships they already applied to
        const appliedIds = new Set(student.applications.map(a => a.internshipId))
        const eligibleInternships = openInternships.filter(i => !appliedIds.has(i.id))
        if (eligibleInternships.length === 0) continue

        const studentProfileStr = JSON.stringify({
            skills: student.aiProfile?.skillsAssessment ?? { technical: student.portfolio?.skills ?? [] },
            goals: student.aiProfile?.careerGoals ?? null,
            preferences: student.aiProfile?.preferences ?? null,
            headline: student.portfolio?.headline ?? null,
            interests: student.portfolio?.interests ?? [],
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internshipsStr = JSON.stringify(eligibleInternships.map((i: any) => ({
            id: i.id,
            title: i.title,
            company: i.company?.name,
            requirements: i.qualifications,
            skills: i.skills,
            location: i.location,
            paid: i.paid,
            salary: i.salary,
        })))

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are Linky's Matchmaker for Bulgarian students. Match this student to the best internships. Consider skills, goals, location, and potential. Be generous with potential matches — students are learning, so transferable skills count. Find 1-3 best matches with score > 60%.

Respond ONLY in valid JSON:
{
    "matches": [
        {
            "internshipId": "string",
            "matchScore": 85,
            "matchReason": "Short, enthusiastic reason (1 sentence)",
            "actionLabel": "Apply now" or "Tell me more",
            "urgency": "high" | "medium" | "low"
        }
    ]
}`
                    },
                    {
                        role: "user",
                        content: `Student Profile: ${studentProfileStr}\n\nInternships: ${internshipsStr}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) continue;

            const result = JSON.parse(content) as { matches: { internshipId: string; matchReason: string; matchScore: number; actionLabel?: string; urgency?: string }[] };

            if (result.matches && result.matches.length > 0) {
                const matchCount = result.matches.length;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const topMatch: any = eligibleInternships.find(i => i.id === result.matches[0].internshipId);

                if (!topMatch) continue;

                const message = matchCount === 1
                    ? `🎯 Linky found a match! **${topMatch.title}** at **${topMatch.company.name}** (${result.matches[0].matchScore}% fit). ${result.matches[0].matchReason}`
                    : `🎯 Linky found ${matchCount} matches for you! Top pick: **${topMatch.title}** at **${topMatch.company.name}** (${result.matches[0].matchScore}% fit).`;

                // Enhanced metadata with action buttons for the frontend
                const metadata = {
                    matches: result.matches,
                    actions: result.matches.map(m => ({
                        internshipId: m.internshipId,
                        label: m.actionLabel || "Apply now",
                        type: "linky_apply", // Frontend can use this to trigger apply_to_internship via Linky
                        matchScore: m.matchScore,
                    })),
                    topMatchCompany: topMatch.company?.name,
                    topMatchTitle: topMatch.title,
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
                });
                notificationsCreated++;
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

    // 2. Fetch students with any confidence score — the AI middleman evaluates everyone
    const students = await prisma.aIProfile.findMany({
        where: {
            confidenceScore: { overallScore: { gt: 20 } } // Lower threshold — push more students
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
    });

    if (students.length === 0) return 0;

    let notificationsCreated = 0;

    // 3. For each posting, find top candidates and push them
    for (const posting of postings) {
        const postingStr = JSON.stringify({
            title: posting.title,
            requirements: posting.qualifications,
            skills: posting.skills,
            description: posting.description?.slice(0, 400),
        });

        const candidatesStr = JSON.stringify(students.map(s => ({
            id: s.studentId,
            name: s.student?.portfolio?.fullName || s.student?.profile?.name || s.student?.email || "Candidate",
            headline: s.student?.portfolio?.headline,
            confidenceScore: s.confidenceScore?.overallScore ?? 0,
            skills: s.skillsAssessment,
            careerGoals: s.careerGoals,
            portfolioSkills: s.student?.portfolio?.skills || [],
        })));

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are Linky's AI Middleman for a Bulgarian internship platform. Your job is to PUSH the best students to companies — students don't need to apply, YOU match them.

Evaluate each candidate based on:
1. Skill overlap with the posting
2. Confidence Score (higher = more reliable profile data)
3. Career goals alignment
4. Potential and transferable skills

Find top 1-3 matches. Prefer students with higher confidence scores. Be generous with potential.
Respond ONLY in valid JSON:
{
    "matches": [
        {
            "studentId": "string",
            "studentName": "string",
            "confidenceScore": 75,
            "matchScore": 95,
            "matchReason": "Detailed reason why (2 sentences)",
            "highlight": "The single most impressive thing about this candidate"
        }
    ]
}`
                    },
                    {
                        role: "user",
                        content: `Job Posting: ${postingStr}\n\nCandidates: ${candidatesStr}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) continue;

            const result = JSON.parse(content) as { matches: { studentId: string; studentName: string; confidenceScore?: number; matchReason: string; matchScore: number; highlight?: string }[] };

            if (result.matches && result.matches.length > 0) {
                const cmpOwnerId = posting.company?.ownerId;
                const companyName = posting.company?.name || "a top company";

                if (!cmpOwnerId) continue;

                const topMatch = result.matches[0];
                const message = `🤖 Linky pushed ${result.matches.length} candidate${result.matches.length > 1 ? "s" : ""} to your "${posting.title}" role.

🏆 Top: **${topMatch.studentName}** (${topMatch.matchScore}% fit, Score: ${topMatch.confidenceScore ?? "?"}/100)
💡 ${topMatch.highlight || topMatch.matchReason}`;

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
                            matches: result.matches,
                            pushedByLinky: true,
                        })
                    }
                });
                notificationsCreated++;

                // Notify students that Linky is pushing them — even if they didn't apply
                for (const match of result.matches) {
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
