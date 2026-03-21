import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"

/**
 * Auto pre-screen an application using AI when it's submitted.
 * Stores the evaluation result as a CandidateEvaluation record
 * so company users see AI scores immediately.
 */
export async function autoPreScreenApplication(applicationId: string) {
    const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: {
                select: {
                    title: true,
                    description: true,
                    qualifications: true,
                    skills: true,
                    companyId: true,
                    company: { select: { name: true, ownerId: true } },
                },
            },
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
                        },
                    },
                    aiProfile: {
                        select: {
                            careerGoals: true,
                            skillsAssessment: true,
                        },
                    },
                },
            },
        },
    })

    if (!app) return

    const studentName =
        app.student.portfolio?.fullName ??
        app.student.profile?.name ??
        app.student.email

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are Linky's Auto-Screener for a Bulgarian internship platform. Evaluate how well this student matches the internship. Be fair, consider potential and transferable skills — these are students, not senior hires.

Respond ONLY in valid JSON:
{
    "matchScore": 0-100,
    "verdict": "strong_match" | "good_match" | "partial_match" | "weak_match",
    "strengths": ["2-3 specific strengths"],
    "concerns": ["0-2 concerns or gaps"],
    "oneLiner": "Single sentence summary for the hiring manager"
}`,
            },
            {
                role: "user",
                content: `Internship: ${app.internship.title}
Description: ${app.internship.description?.slice(0, 500)}
Required skills: ${(app.internship.skills || []).join(", ")}
Qualifications: ${app.internship.qualifications?.slice(0, 300) ?? "N/A"}

Student: ${studentName}
Headline: ${app.student.portfolio?.headline ?? "N/A"}
Bio: ${app.student.portfolio?.bio ?? "N/A"}
Skills: ${(app.student.portfolio?.skills || []).join(", ") || "N/A"}
Experience: ${app.student.portfolio?.experience ?? "N/A"}
Education: ${app.student.portfolio?.education ?? "N/A"}
AI Profile skills: ${JSON.stringify(app.student.aiProfile?.skillsAssessment) ?? "N/A"}
AI Career goals: ${JSON.stringify(app.student.aiProfile?.careerGoals) ?? "N/A"}`,
            },
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.2,
    })

    const raw = completion.choices[0].message.content
    if (!raw) return

    const evaluation = JSON.parse(raw)

    // Store as CandidateEvaluation using existing schema
    await prisma.candidateEvaluation.create({
        data: {
            candidateId: app.student.id,
            companyId: app.internship.companyId,
            sessionId: `auto_prescreen_${applicationId}`,
            sessionName: `Auto Pre-Screen: ${app.internship.title}`,
            searchQuery: app.internship.title,
            requiredSkills: app.internship.skills || [],
            matchPercentage: evaluation.matchScore,
            matchReasons: [evaluation.oneLiner, ...(evaluation.strengths || [])],
            matchedSkills: evaluation.strengths || [],
        },
    })

    // If it's a strong match, notify the company owner proactively
    if (evaluation.matchScore >= 80 && app.internship.company.ownerId) {
        await prisma.notification.create({
            data: {
                userId: app.internship.company.ownerId,
                type: "APPLICATION_SUBMITTED",
                title: "Strong Candidate Alert! ⭐",
                message: `Linky scored **${studentName}** at ${evaluation.matchScore}% for "${app.internship.title}". ${evaluation.oneLiner}`,
                link: `/dashboard/company/applications`,
                metadata: JSON.stringify({
                    applicationId,
                    matchScore: evaluation.matchScore,
                    verdict: evaluation.verdict,
                    autoScreened: true,
                }),
            },
        })
    }
}
