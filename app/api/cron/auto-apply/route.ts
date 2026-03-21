import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"

/**
 * Cron endpoint: Auto-apply for students with autoApplyEnabled=true.
 * Finds matching internships above their threshold and applies automatically.
 * Secured by CRON_SECRET header.
 */
export async function POST(req: Request) {
    const secret = req.headers.get("x-cron-secret")
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find students with auto-apply enabled
    const autoApplyStudents = await prisma.aIProfile.findMany({
        where: { autoApplyEnabled: true },
        include: {
            student: {
                select: {
                    id: true,
                    email: true,
                    portfolio: { select: { fullName: true, headline: true, skills: true, bio: true } },
                    applications: { select: { internshipId: true } },
                },
            },
            confidenceScore: { select: { overallScore: true } },
        },
        take: 50,
    })

    if (autoApplyStudents.length === 0) {
        return NextResponse.json({ autoApplied: 0, message: "No students with auto-apply enabled" })
    }

    // Get open internships
    const openInternships = await prisma.internship.findMany({
        where: { applicationEnd: { gt: new Date() } },
        include: { company: { select: { name: true } } },
        take: 50,
    })

    if (openInternships.length === 0) {
        return NextResponse.json({ autoApplied: 0, message: "No open internships" })
    }

    let totalAutoApplied = 0

    for (const profile of autoApplyStudents) {
        const student = profile.student
        if (!student) continue

        // Skip internships already applied to
        const appliedIds = new Set(student.applications.map(a => a.internshipId))
        const eligible = openInternships.filter(i => !appliedIds.has(i.id))
        if (eligible.length === 0) continue

        const studentStr = JSON.stringify({
            skills: student.portfolio?.skills ?? [],
            headline: student.portfolio?.headline ?? "",
            bio: student.portfolio?.bio ?? "",
            aiSkills: profile.skillsAssessment,
            careerGoals: profile.careerGoals,
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const internshipsStr = JSON.stringify(eligible.slice(0, 20).map((i: any) => ({
            id: i.id,
            title: i.title,
            company: i.company?.name,
            skills: i.skills,
            location: i.location,
        })))

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are Linky's auto-apply engine. Find the BEST matching internships for this student. Only return matches with score >= ${profile.autoApplyThreshold}. Be accurate — this will trigger a real application.

Respond ONLY in valid JSON:
{
    "matches": [
        { "internshipId": "string", "matchScore": 85, "reason": "1-sentence reason" }
    ]
}

Return an empty matches array if no match exceeds the threshold.`,
                    },
                    { role: "user", content: `Student: ${studentStr}\n\nInternships: ${internshipsStr}` },
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
            })

            const content = completion.choices[0]?.message?.content
            if (!content) continue

            const result = JSON.parse(content) as { matches: { internshipId: string; matchScore: number; reason: string }[] }

            for (const match of (result.matches || []).slice(0, 3)) {
                if (match.matchScore < profile.autoApplyThreshold) continue

                // Check if already applied (double-check)
                const existing = await prisma.application.findFirst({
                    where: { studentId: student.id, internshipId: match.internshipId },
                })
                if (existing) continue

                const internship = eligible.find(i => i.id === match.internshipId)
                if (!internship) continue

                // Create application
                await prisma.application.create({
                    data: {
                        studentId: student.id,
                        internshipId: match.internshipId,
                        coverLetter: `[Auto-applied by Linky] Match score: ${match.matchScore}%. ${match.reason}`,
                        status: "PENDING",
                    },
                })

                // Notify student
                await prisma.notification.create({
                    data: {
                        userId: student.id,
                        type: "APPLICATION_SUBMITTED",
                        title: "Linky Auto-Applied for You! 🤖",
                        message: `Linky applied to **${internship.title}** at **${internship.company.name}** (${match.matchScore}% match). ${match.reason}`,
                        link: `/dashboard/student/applications`,
                        metadata: JSON.stringify({
                            internshipId: match.internshipId,
                            matchScore: match.matchScore,
                            autoApplied: true,
                        }),
                    },
                })

                totalAutoApplied++
            }

            // Update auto-apply count
            if (totalAutoApplied > 0) {
                await prisma.aIProfile.update({
                    where: { studentId: student.id },
                    data: {
                        autoApplyCount: { increment: totalAutoApplied },
                        lastAutoApplyAt: new Date(),
                    },
                })
            }
        } catch (error) {
            console.error(`Auto-apply failed for student ${student.id}:`, error)
        }
    }

    return NextResponse.json({ autoApplied: totalAutoApplied, studentsProcessed: autoApplyStudents.length })
}
