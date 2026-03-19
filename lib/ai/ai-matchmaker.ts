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
        take: 50 // Limit to recent/top 50 for cost/performance
    })

    if (openInternships.length === 0) return 0

    // 2. Fetch students who have an AIProfile with a reasonable confidence score
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            aiProfile: { include: { confidenceScore: true } }
        },
        take: 100 // Process in batches
    })

    let notificationsCreated = 0

    // 3. Evaluate each student using lightweight Prompt (to keep costs down)
    for (const student of students) {
        if (!student.aiProfile || !student.aiProfile.skillsAssessment) continue
        
        // Skip students with very low profile completion
        const score = student.aiProfile.confidenceScore?.overallScore ?? 0
        if (score < 30) continue

        const studentProfileStr = JSON.stringify({
            skills: student.aiProfile.skillsAssessment,
            goals: student.aiProfile.careerGoals,
            preferences: student.aiProfile.preferences
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internshipsStr = JSON.stringify(openInternships.map((i: any) => ({
            id: i.id,
            title: i.title,
            company: i.company?.name,
            requirements: i.qualifications,
            location: i.location
        })))

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are Linky's Matchmaker. You are given a student profile and a list of open internships. Find the top 1-3 best matching internships for this student. If none are a good fit (>70% match), return an empty array. Respond ONLY in valid JSON format:
{
    "matches": [
        { "internshipId": "string", "matchReason": "Short, enthusiastic reason why they fit", "matchScore": 85 }
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

            const result = JSON.parse(content) as { matches: { internshipId: string; matchReason: string; matchScore: number }[] };
            
            if (result.matches && result.matches.length > 0) {
                // Generate a friendly notification message
                const matchCount = result.matches.length;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const topMatch: any = openInternships.find(i => i.id === result.matches[0].internshipId);
                
                if (!topMatch) continue;

                const message = matchCount === 1 
                    ? `Linky found a perfect match! ${topMatch.title} at ${topMatch.company.name} looks like a great fit for your skills. Reason: ${result.matches[0].matchReason}`
                    : `Linky found ${matchCount} new matching internships for you! Top pick: ${topMatch.title} at ${topMatch.company.name}.`;

                await prisma.notification.create({
                    data: {
                        userId: student.id,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        type: "AI_MATCHMAKER" as any, // Fixed: Using suppression because Prisma types are stale
                        title: "New AI Matches Found! 🎯",
                        message,
                        link: `/internships/${topMatch.id}`,
                        metadata: JSON.stringify(result.matches)
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

// Process companies with open postings to find star candidates
export async function runCompanyMatchmaker() {
    // 1. Fetch active company postings with low applicants 
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

    // Filter in memory for < 20 applicants to ensure we help postings that actually need visibility
    const postings = allPostings.filter(p => p._count.applications < 20);

    if (postings.length === 0) return 0;

    // 2. Fetch top students looking for roles
    const students = await prisma.aIProfile.findMany({
        where: {
            confidenceScore: { overallScore: { gt: 40 } }
        },
        include: { 
            student: { 
                select: { 
                    id: true, 
                    email: true, 
                    profile: { select: { name: true } },
                    portfolio: { 
                        select: { 
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

    // 3. For each posting, find top candidates
    for (const posting of postings) {
        const postingStr = JSON.stringify({
            title: posting.title,
            requirements: posting.qualifications,
            description: posting.description
        });

        const candidatesStr = JSON.stringify(students.map(s => ({
            id: s.studentId,
            name: s.student?.profile?.name || s.student?.email || "Candidate",
            skills: s.skillsAssessment,
            careerGoals: s.careerGoals,
            portfolio: s.student?.portfolio || null
        })));

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are Linky's Elite Talent Scout. Find the absolute best matching candidates for a job posting. 
Analyze student skills, career goals, and portfolio experience deeply. Look for potential and transferable skills. 
Be highly selective but don't miss hidden gems. Pick top 1-3.
Respond ONLY in valid JSON format:
{
    "matches": [
        { 
            "studentId": "string", 
            "studentName": "string", 
            "matchScore": 95,
            "matchReason": "Detailed reason why (2 sentences)",
            "highlight": "The single most impressive thing (e.g. 'Complex React projects in portfolio')"
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

            const result = JSON.parse(content) as { matches: { studentId: string; studentName: string; matchReason: string; matchScore: number; highlight?: string }[] };
            
            if (result.matches && result.matches.length > 0) {
                const cmpOwnerId = posting.company?.ownerId;
                const companyName = posting.company?.name || "a top company";
                
                if (!cmpOwnerId) continue;

                const topMatch = result.matches[0];
                const message = `Linky Scout has found ${result.matches.length} star candidates for your "${posting.title}" role. 
                
🏆 Top Pick: ${topMatch.studentName} (${topMatch.matchScore}% Match)
💡 Note: ${topMatch.highlight || topMatch.matchReason}`;

                await prisma.notification.create({
                    data: {
                        userId: cmpOwnerId, // Notify the company owner
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        type: "AI_MATCHMAKER" as any,
                        title: "Star Candidates Discovered ✨",
                        message,
                        link: `/company/internships/${posting.id}/matches`,
                        metadata: JSON.stringify({ internshipId: posting.id, matches: result.matches })
                    }
                });
                notificationsCreated++;

                // Notify students that they were highlighted
                for (const match of result.matches) {
                    if (!match.studentId) continue;
                    
                    await prisma.notification.create({
                        data: {
                            userId: match.studentId,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            type: "AI_MATCHMAKER" as any,
                            title: "Profile Highlighted! 🚀",
                            message: `Linky just presented your profile to ${companyName} as a top match for their "${posting.title}" role! Keep your profile updated to get more matches.`,
                            link: `/dashboard/student/portfolio`,
                            metadata: JSON.stringify({ internshipId: posting.id, companyId: posting.companyId })
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
