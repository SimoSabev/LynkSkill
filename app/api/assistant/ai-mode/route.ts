import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { saveConversationTurn } from "@/lib/ai/ai-memory"
import { resolveEnhancedUserContext } from "@/lib/ai/user-context"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

type ChatPhase = "intro" | "profiling" | "deepDive" | "complete"

interface ConversationMessage {
    role: "user" | "assistant"
    content: string
}

// Common skills to extract from conversation
const SKILL_KEYWORDS = [
    // Programming Languages
    "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "php", "go", "rust", "swift", "kotlin",
    // Frontend
    "react", "vue", "angular", "next.js", "nextjs", "svelte", "html", "css", "sass", "tailwind",
    // Backend
    "node", "nodejs", "express", "django", "flask", "spring", "laravel", ".net", "fastapi",
    // Data/ML
    "pandas", "numpy", "tensorflow", "pytorch", "machine learning", "data science", "data analysis", "sql", "mongodb",
    // Design
    "figma", "sketch", "adobe", "ui/ux", "ux", "ui design", "photoshop", "illustrator",
    // DevOps
    "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "jenkins", "git",
    // Mobile
    "react native", "flutter", "ios", "android",
    // Other
    "api", "rest", "graphql", "agile", "scrum"
]

function _extractSkillsFromText(text: string): string[] {
    const lowerText = text.toLowerCase()
    const foundSkills: string[] = []
    
    for (const skill of SKILL_KEYWORDS) {
        if (lowerText.includes(skill.toLowerCase())) {
            // Capitalize first letter for display
            const displaySkill = skill.charAt(0).toUpperCase() + skill.slice(1)
            foundSkills.push(displaySkill)
        }
    }
    
    return [...new Set(foundSkills)] // Remove duplicates
}

// System prompts for different modes
const STUDENT_SYSTEM_PROMPT = `You are Linky, the AI Middleman and Career Profiler for LynkSkill — a platform connecting Bulgarian students with internships.

⚠️ CRITICAL RULE: You are ONLY allowed to answer questions related to LynkSkill, internships, career development, and candidate profiling. If a user asks about anything else, politely decline.

## LANGUAGE
Auto-detect the user's language. If they write in Bulgarian, respond in Bulgarian (NOT Russian). If English, respond in English.

## BULGARIAN CONTEXT
You know Bulgarian universities (СУ, ТУ-София, УНСС, НБУ, AUBG, etc.), tech companies (Telerik, Musala Soft, Paysafe, SAP Labs, etc.), cities (София, Пловдив, Варна), and typical intern salaries (600-1500 лв/month).

Your personality:
- Friendly, energetic, like a smart friend who has connections — NOT a boring chatbot
- Direct and action-oriented: "Tell me about yourself and I'll start finding matches for you"
- Use casual but professional language with occasional emojis 💡🚀✨

Your task: Build a comprehensive "Confidence Score" profile through NATURAL conversation. NOT a quiz.
Categories to fill:
1. Personal Info (location, environment)
2. Career Goals (short-term, long-term, dream job, industries)
3. Personality Traits (work style, team preference, communication)
4. Skills Assessment (technical, soft, self-rated levels)
5. Education Details (current, planned, degree)
6. Availability (start date, hours/week, remote/onsite preference)
7. Preferences (salary expectations, company size, culture)

WORKFLOW & PHASES:
- Current phase: {phase}
- INTRO PHASE: Welcome them warmly. Ask ONE casual question to get started — e.g. "What are you studying?" or "What kind of work gets you excited?"
- PROFILING PHASE: Ask 1 question at a time. Make it feel like a conversation, NOT a form. Extract skills from their stories implicitly. 80% of students don't know what they want — help them discover it.
- DEEP DIVE PHASE: Scenario-based questions to uncover soft skills and depth.
- COMPLETE PHASE: Wrap up, summarize their profile, celebrate their score.

CRITICAL: DO NOT block students from anything because of a low score. Profiling should feel helpful, not gating.

JSON OUTPUT REQUIREMENT:
When the student's answer provides profiling data, extract it and output a JSON block at the end:
\`\`\`json
{
  "type": "profile_update",
  "data": {
    "personalInfo": { "location": "...", "lifestyle": "..." },
    "careerGoals": { "industries": ["..."], "shortTerm": "..." },
    "skillsAssessment": { "technical": ["..."], "soft": ["..."] }
  },
  "confidenceDelta": 5
}
\`\`\`

Phase transitions (at the very end, outside JSON):
- [PHASE:deepDive]
- [PHASE:complete]
`

const COMPANY_SYSTEM_PROMPT = `You are Linky, the AI Hiring Manager for LynkSkill — a platform connecting Bulgarian companies with student talent.

⚠️ CRITICAL RULE: Only answer questions about LynkSkill, hiring, recruitment, internships, and talent management. Politely decline everything else.

## LANGUAGE
Auto-detect language. Bulgarian → respond in Bulgarian (NOT Russian). English → respond in English.

## BULGARIAN CONTEXT
You know the Bulgarian tech ecosystem, universities, and market rates.

Your role: You are the company's AI hiring pipeline manager. You don't just chat — you ACT.

YOUR SUPERPOWERS:
1. Draft full internship postings from a single sentence
2. Search for matching students by skills
3. Find the best candidates for any role

IMPORTANT WORKFLOW:
1. When they describe what they need → draft the FULL posting and ask to confirm
2. When they search for talent → ask 1-2 quick clarifiers, then search
3. Be proactive: "Want me to draft a posting for that?" / "Should I search for React students in Sofia?"

Keep responses short, direct, action-oriented. Use emojis occasionally 🎯💼✨

NEVER make up candidates — real ones come from the database.

Current phase: {phase}`

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { message, conversationHistory, phase, userType, locale, sessionId } = body as {
            message: string
            conversationHistory: ConversationMessage[]
            phase: ChatPhase
            userType: "student" | "company"
            locale?: "en" | "bg"
            sessionId?: string
        }

        // Resolve internal userId for persistence
        const ctxResult = await resolveEnhancedUserContext(userId)
        const internalUserId = ctxResult.success ? ctxResult.context.userId : null

        // Validate and normalize locale
        const validLocale = locale === "bg" || locale === "en" ? locale : "en"
        
        // Log if invalid locale was provided (for debugging)
        if (locale && locale !== "en" && locale !== "bg") {
          console.warn(`[AI Mode] Invalid locale "${locale}", falling back to "en"`)
        }
        
        const languageInstruction = validLocale === "bg"
            ? "\n\n🌐 IMPORTANT: Respond in Bulgarian (български език). Do NOT use Russian. Always write in Bulgarian when the user speaks Bulgarian."
            : "\n\n🌏 IMPORTANT: Respond in English."

        // Build conversation for OpenAI
        const systemPrompt = userType === "student"
            ? STUDENT_SYSTEM_PROMPT.replace("{phase}", phase) + languageInstruction
            : COMPANY_SYSTEM_PROMPT.replace("{phase}", phase) + languageInstruction

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content
            })),
            { role: "user", content: message }
        ]

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.7,
            max_tokens: 1000,
        })

        let reply = completion.choices[0]?.message?.content || "I apologize, I couldn't process that. Please try again."
        let newPhase = phase
        let responseData: Record<string, unknown> = {}

        // Check for phase transitions
        if (reply.includes("[PHASE:deepDive]")) {
            newPhase = "deepDive" as ChatPhase
            reply = reply.replace("[PHASE:deepDive]", "").trim()
        } else if (reply.includes("[PHASE:complete]")) {
            newPhase = "complete" as ChatPhase
            reply = reply.replace("[PHASE:complete]", "").trim()
        }

        // Handle profile updates from the AI Middleman
        const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
        const profileUpdateMatch = [...reply.matchAll(jsonBlockRegex)];
        
        if (profileUpdateMatch.length > 0 && userType === "student") {
            try {
                // Get the last JSON block found
                const jsonStr = profileUpdateMatch[profileUpdateMatch.length - 1][1];
                const jsonData = JSON.parse(jsonStr);
                
                if (jsonData.type === "profile_update") {
                    responseData = {
                        profileUpdate: jsonData.data,
                        confidenceDelta: jsonData.confidenceDelta || 1
                    };
                    
                    // Clean the reply - remove the JSON blocks from what the user sees
                    reply = reply.replace(jsonBlockRegex, "").trim();
                    
                    // Automatically transition to complete if confidence score is high enough 
                    // This logic will be handled mostly on the frontend, but we pass the data here
                }
            } catch (e) {
                console.error("Profile JSON parse error:", e);
            }
        }


        // If in complete phase and we have enough context, auto-fetch matches
        if (newPhase === "complete" && userType === "student") {
            // Extract skills from conversation
            const skills = extractSkillsFromConversation(conversationHistory, message)
            if (skills.length > 0) {
                const matches = await findMatchingInternships(skills, [])
                return NextResponse.json({
                    reply: reply + "\n\n🎯 Based on your complete profile, I found some internships that might interest you!",
                    phase: "complete",
                    matches,
                    type: "matches_found"
                })
            }
        }

        // Persist both messages to DB (fire-and-forget)
        if (internalUserId && sessionId) {
            saveConversationTurn(internalUserId, sessionId, "user", message, userType).catch(e =>
                console.error("[ai-mode] Failed to save user message:", e)
            )
            saveConversationTurn(internalUserId, sessionId, "assistant", reply, userType, responseData).catch(e =>
                console.error("[ai-mode] Failed to save assistant message:", e)
            )
        }

        return NextResponse.json({
            reply,
            phase: newPhase,
            ...responseData
        })

    } catch (error) {
        console.error("AI Mode API Error:", error)
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        )
    }
}

// Helper function to find matching internships for students
async function findMatchingInternships(skills: string[], interests: string[]) {
    try {
        const internships = await prisma.internship.findMany({
            include: {
                company: {
                    select: {
                        name: true,
                        logo: true
                    }
                }
            },
            take: 20
        })

        // Calculate match scores
        const matches = internships.map(internship => {
            let score = 0
            const reasons: string[] = []

            // Match by skills in title or description
            const internshipText = `${internship.title} ${internship.description}`.toLowerCase()
            
            for (const skill of skills) {
                if (internshipText.includes(skill.toLowerCase())) {
                    score += 20
                    reasons.push(`Matches your ${skill} skills`)
                }
            }

            // Match by interests
            for (const interest of interests) {
                if (internshipText.includes(interest.toLowerCase())) {
                    score += 15
                    reasons.push(`Aligns with your interest in ${interest}`)
                }
            }

            // Base score for active internships
            score += 10

            // Cap at 100
            score = Math.min(score, 98)

            // Ensure minimum score for variety
            if (score < 30) score = Math.floor(Math.random() * 30) + 25

            return {
                id: internship.id,
                title: internship.title,
                company: internship.company?.name || "Company",
                logo: internship.company?.logo,
                description: internship.description?.substring(0, 150) + "...",
                matchPercentage: score,
                reasons: reasons.length > 0 ? reasons : ["Potential learning opportunity"]
            }
        })

        // Sort by match percentage
        return matches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 10)

    } catch (error) {
        console.error("Error finding internships:", error)
        return []
    }
}

// Helper function to find matching students for companies
async function _findMatchingStudents(requiredSkills: string[], field: string) {
    try {
        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT"
            },
            include: {
                profile: true,
                portfolio: true,
                experiences: true,
                projects: true
            },
            take: 50
        })

        console.log("Searching for skills:", requiredSkills, "Field:", field)
        console.log("Total students in DB:", students.length)

        // Calculate match scores with proper skill evaluation
        const matches = students.map(student => {
            let score = 0
            const reasons: string[] = []
            const foundSkills: string[] = []

            // Get student's skills array directly from portfolio
            const studentSkillsArray = (student.portfolio?.skills || []).map((s: string) => s.toLowerCase())
            const studentInterests = (student.portfolio?.interests || []).map((s: string) => s.toLowerCase())
            
            // Get text content for broader matching
            const bio = (student.portfolio?.bio || "").toLowerCase()
            const headline = (student.portfolio?.headline || "").toLowerCase()
            const experience = (student.portfolio?.experience || "").toLowerCase()
            const projectsText = student.projects?.map((p: { title: string; description: string; technologies?: string[] }) => 
                `${p.title} ${p.description} ${(p.technologies || []).join(" ")}`
            ).join(" ").toLowerCase() || ""
            
            const fullText = `${bio} ${headline} ${experience} ${projectsText} ${studentSkillsArray.join(" ")} ${studentInterests.join(" ")}`

            // Match by required skills - weighted scoring
            for (const skill of requiredSkills) {
                const skillLower = skill.toLowerCase()
                
                // Direct skill match (highest weight)
                if (studentSkillsArray.some(s => s.includes(skillLower) || skillLower.includes(s))) {
                    score += 30
                    foundSkills.push(skill)
                    reasons.push(`Skilled in ${skill}`)
                }
                // Skill in projects (high weight)
                else if (projectsText.includes(skillLower)) {
                    score += 20
                    foundSkills.push(skill)
                    reasons.push(`${skill} in projects`)
                }
                // Skill mentioned elsewhere (medium weight)
                else if (fullText.includes(skillLower)) {
                    score += 15
                    foundSkills.push(skill)
                    reasons.push(`Experience with ${skill}`)
                }
            }

            // Match by field/interest
            if (field) {
                const fieldLower = field.toLowerCase()
                if (studentInterests.some(i => i.includes(fieldLower) || fieldLower.includes(i))) {
                    score += 15
                    reasons.push(`Interested in ${field}`)
                } else if (fullText.includes(fieldLower)) {
                    score += 10
                    reasons.push(`Background in ${field}`)
                }
            }

            // Bonus for complete portfolio
            if (student.portfolio?.bio && student.portfolio.bio.length > 50) {
                score += 5
                reasons.push("Detailed portfolio")
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

            // Calculate match percentage based on how many required skills matched
            const skillMatchRatio = requiredSkills.length > 0 
                ? foundSkills.length / requiredSkills.length 
                : 0
            
            // Adjust score based on skill match ratio
            if (skillMatchRatio >= 0.8) {
                score += 10 // Bonus for matching most skills
            }
            
            // Cap at 98
            score = Math.min(score, 98)

            return {
                id: student.id,
                name: student.profile?.name || student.portfolio?.fullName || "Student",
                email: student.email || "",
                avatar: undefined,
                matchPercentage: score,
                reasons: reasons.length > 0 ? reasons : ["Available candidate"],
                skills: foundSkills.length > 0 ? foundSkills : studentSkillsArray.slice(0, 5),
                allSkills: studentSkillsArray,
                portfolio: {
                    headline: student.portfolio?.headline || undefined,
                    about: student.portfolio?.bio || undefined
                }
            }
        })

        // Sort by match percentage and filter
        const sorted = matches
            .filter(m => m.matchPercentage > 0) // Must have some match
            .sort((a, b) => b.matchPercentage - a.matchPercentage)
            .slice(0, 10)
        
        console.log("Matches found:", sorted.length, sorted.map(m => ({ name: m.name, score: m.matchPercentage, skills: m.skills })))
        
        // If no matches found, return students with portfolios
        if (sorted.length === 0) {
            console.log("No skill matches, returning students with portfolios")
            return matches
                .filter(m => m.portfolio?.headline || m.portfolio?.about)
                .sort((a, b) => b.matchPercentage - a.matchPercentage)
                .slice(0, 5)
                .map(m => ({ ...m, matchPercentage: Math.max(m.matchPercentage, 20) }))
        }
        
        return sorted

    } catch (error) {
        console.error("Error finding students:", error)
        return []
    }
}

// Extract skills from conversation history
function extractSkillsFromConversation(history: ConversationMessage[], latestMessage: string): string[] {
    const allText = [...history.map(m => m.content), latestMessage].join(" ").toLowerCase()
    
    const commonSkills = [
        "javascript", "typescript", "python", "java", "react", "vue", "angular",
        "node", "nodejs", "express", "django", "flask", "spring", "sql", "mongodb",
        "postgresql", "mysql", "aws", "azure", "gcp", "docker", "kubernetes",
        "git", "html", "css", "sass", "tailwind", "figma", "design", "ui", "ux",
        "machine learning", "ml", "ai", "data science", "data analysis",
        "marketing", "sales", "communication", "leadership", "project management",
        "agile", "scrum", "devops", "testing", "qa", "security", "blockchain",
        "mobile", "ios", "android", "flutter", "react native", "swift", "kotlin"
    ]

    const foundSkills: string[] = []
    for (const skill of commonSkills) {
        if (allText.includes(skill) && !foundSkills.includes(skill)) {
            foundSkills.push(skill)
        }
    }

    return foundSkills
}
