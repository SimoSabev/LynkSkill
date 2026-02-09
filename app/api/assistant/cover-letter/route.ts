// app/api/assistant/cover-letter/route.ts
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { openai } from "@/lib/openai"

const COVER_LETTER_SYSTEM_PROMPT = `You are Linky, an expert career coach AI at LynkSkill, helping students write compelling cover letters for internship applications.

## YOUR TASK:
Generate a professional, personalized cover letter based on the student's portfolio and the internship details provided.

## GUIDELINES:
- Keep it concise: 250-400 words (3-4 short paragraphs)
- Professional but warm tone — suitable for young professionals (16-22 years old)
- First paragraph: Express enthusiasm for the specific role and company
- Second paragraph: Highlight relevant skills and experiences that match the internship requirements
- Third paragraph: Show eagerness to learn and contribute, mention specific aspects of the company that appeal
- Final paragraph: Professional closing with call to action
- Use specific details from their portfolio and the internship — never be generic
- Do NOT use overly formal or stiff language
- Do NOT include placeholders like [Your Name] — use the actual student name
- Do NOT include date, address headers, or "Dear Hiring Manager" — just the letter body
- Match skills from the student's portfolio to the internship requirements
- If the student has projects or experience relevant to the role, mention them specifically

## OUTPUT:
Return ONLY the cover letter text. No markdown headers, no explanations, no meta-commentary.`

export async function POST(req: Request) {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true, role: true }
        })

        if (!user || user.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can generate cover letters" }, { status: 403 })
        }

        const { internshipId } = await req.json()

        if (!internshipId) {
            return NextResponse.json({ error: "Internship ID is required" }, { status: 400 })
        }

        // Fetch student portfolio
        const portfolio = await prisma.portfolio.findUnique({
            where: { studentId: user.id },
            select: {
                fullName: true,
                headline: true,
                bio: true,
                skills: true,
                interests: true,
                experience: true,
                education: true,
                projects: true,
                certifications: true,
            }
        })

        if (!portfolio) {
            return NextResponse.json(
                { error: "Please complete your portfolio before generating a cover letter" },
                { status: 400 }
            )
        }

        // Fetch internship details
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            select: {
                title: true,
                description: true,
                qualifications: true,
                location: true,
                skills: true,
                company: {
                    select: {
                        name: true,
                        description: true,
                        location: true,
                    }
                }
            }
        })

        if (!internship) {
            return NextResponse.json({ error: "Internship not found" }, { status: 404 })
        }

        // Build the prompt context
        const userMessage = `Generate a cover letter for this student applying to this internship:

## STUDENT PORTFOLIO:
- **Name:** ${portfolio.fullName || "Student"}
- **Headline:** ${portfolio.headline || "N/A"}
- **Bio:** ${portfolio.bio || "N/A"}
- **Skills:** ${portfolio.skills?.join(", ") || "N/A"}
- **Interests:** ${portfolio.interests?.join(", ") || "N/A"}
- **Experience:** ${portfolio.experience || "N/A"}
- **Education:** ${typeof portfolio.education === "string" ? portfolio.education : JSON.stringify(portfolio.education) || "N/A"}
- **Projects:** ${typeof portfolio.projects === "string" ? portfolio.projects : JSON.stringify(portfolio.projects) || "N/A"}
- **Certifications:** ${typeof portfolio.certifications === "string" ? portfolio.certifications : JSON.stringify(portfolio.certifications) || "N/A"}

## INTERNSHIP DETAILS:
- **Position:** ${internship.title}
- **Company:** ${internship.company.name}
- **Company Description:** ${internship.company.description || "N/A"}
- **Location:** ${internship.location}
- **Role Description:** ${internship.description}
- **Required Qualifications:** ${internship.qualifications || "N/A"}
- **Required Skills:** ${internship.skills?.join(", ") || "N/A"}

Write the cover letter now.`

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: COVER_LETTER_SYSTEM_PROMPT },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        })

        const coverLetter = completion.choices[0]?.message?.content?.trim()

        if (!coverLetter) {
            return NextResponse.json(
                { error: "Failed to generate cover letter. Please try again." },
                { status: 500 }
            )
        }

        return NextResponse.json({ coverLetter })
    } catch (error) {
        console.error("Cover letter generation error:", error)
        return NextResponse.json(
            { error: "Failed to generate cover letter" },
            { status: 500 }
        )
    }
}
