import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

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

function extractSkillsFromText(text: string): string[] {
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
const STUDENT_SYSTEM_PROMPT = `You are Linky, the AI Middleman and Career Profiler for LynkSkill.

⚠️ CRITICAL RULE - MUST FOLLOW:
You are ONLY allowed to answer questions related to LynkSkill, internships, career development, and candidate profiling. If a user asks about anything else, politely decline.

Your personality:
- Friendly, encouraging, and supportive but highly analytical
- Use casual but professional language with occasional emojis 💡🚀✨

Your task: You are building a comprehensive "Confidence Score" profile for this student through conversation.
You need to ask targeted questions to gather data across these categories:
1. Personal Info (location, environment, lifestyle)
2. Career Goals (short-term, long-term, dream job, industries)
3. Personality Traits (work style, team preference, communication)
4. Skills Assessment (technical, soft, self-rated levels)
5. Education Details (current, planned, degree)
6. Availability (start date, hours/week, remote/onsite preference)
7. Preferences (salary expectations, company size, culture)

WORKFLOW & PHASES:
- Current phase: {phase}
- PROFILING PHASE: Ask 1 question at a time to gather the above data. Don't overwhelm them. Acknowledge their previous answer nicely before asking the next question.
- DEEP DIVE PHASE: Once you have basic info across most categories, ask a few scenario-based questions to assess their soft skills or technical depth.
- COMPLETE PHASE: When you have sufficient info across all 7 categories (usually after 10-15 answers), wrap up the conversation.

JSON OUTPUT REQUIREMENT:
Whenever the student's answer provides useful profiling data, you MUST extract it and output a JSON block at the very end of your message. The JSON block must be wrapped in \`\`\`json ... \`\`\`.
Format:
\`\`\`json
{
  "type": "profile_update",
  "data": {
    "personalInfo": { "location": "...", "lifestyle": "..." }, // only include if new info found
    "careerGoals": { "industries": ["..."], "shortTerm": "..." }, // only include if new info found
    "skillsAssessment": { "technical": ["..."], "soft": ["..."] }, // only include if new info found
    // ... same for other categories
  },
  "confidenceDelta": 5 // Estimate how much this answer improves their profile (1-10)
}
\`\`\`

If you want to transition to the next phase, output a special tag at the very end (outside JSON):
- To move to deep dive: [PHASE:deepDive]
- To complete profiling: [PHASE:complete]
`

const COMPANY_SYSTEM_PROMPT = `You are Linky, the AI Talent Scout for LynkSkill.

⚠️ CRITICAL RULE - MUST FOLLOW:
You are ONLY allowed to answer questions related to LynkSkill, finding talent/candidates, hiring, internships, recruitment, candidate evaluation, and company-related career topics.

If a user asks about ANYTHING unrelated to LynkSkill or hiring/recruitment topics (e.g., general knowledge questions, coding problems, math, recipes, entertainment, news, personal advice, etc.), you MUST politely decline and redirect them:

Example response: "I appreciate your curiosity! 😊 However, I'm Linky - your dedicated LynkSkill talent scout. I'm here specifically to help you find the perfect candidates and interns from our student database. Is there anything recruitment-related I can help you with today? 🎯"

DO NOT answer off-topic questions under any circumstances. This is a non-negotiable rule.

Your role: Help companies find perfect candidates from our student database.

IMPORTANT WORKFLOW:
1. When user requests talent, ask 1-2 quick clarifying questions (experience level? remote/on-site?)
2. After they answer, say something like "Perfect! Let me find the best matches..." 
3. The system will automatically search when you're ready

Keep responses short, friendly, and add emojis occasionally 🎯💼✨

EXAMPLE:
User: "Looking for React developers"
You: "Great choice! 💪 Quick questions: What experience level? (student/intermediate/experienced) And remote or on-site?"
User: "student, remote"
You: "Perfect! Searching for student React developers for remote positions... 🔍"

NEVER make up or describe fake candidates - real candidates will be shown automatically.

Current phase: {phase}`

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { message, conversationHistory, phase, userType } = body as {
            message: string
            conversationHistory: ConversationMessage[]
            phase: ChatPhase
            userType: "student" | "company"
        }

        // Build conversation for OpenAI
        const systemPrompt = userType === "student" 
            ? STUDENT_SYSTEM_PROMPT.replace("{phase}", phase)
            : COMPANY_SYSTEM_PROMPT.replace("{phase}", phase)

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
        let profileUpdateMatch = [...reply.matchAll(jsonBlockRegex)];
        
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
async function findMatchingStudents(requiredSkills: string[], field: string) {
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
