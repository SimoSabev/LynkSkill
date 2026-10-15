import { NextRequest, NextResponse } from "next/server"
import type OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { openai } from "@/lib/openai"

type ChatPhase = "intro" | "gathering" | "portfolio" | "matching" | "results"
const VALID_PHASES: ChatPhase[] = ["intro", "gathering", "portfolio", "matching", "results"]

const MAX_MESSAGE_CHARS = 4000
const MAX_HISTORY_MESSAGES = 30

// Best-effort per-instance limiter (serverless instances don't share memory).
// For a hard global limit use the Upstash Ratelimit already in dependencies.
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 20
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(userId)
    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        return true
    }
    if (entry.count >= RATE_LIMIT_MAX) return false
    entry.count++
    return true
}

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
const STUDENT_SYSTEM_PROMPT = `You are Linky, the friendly AI Career Assistant for LynkSkill - a platform that connects students with internship opportunities.

Your personality:
- Your name is Linky and you should introduce yourself as such
- You're friendly, encouraging, and supportive
- You use casual but professional language
- Add occasional emojis to be engaging 💡🚀✨
- You're part of the LynkSkill team, helping students succeed

Your tasks:
1. GATHERING PHASE: Ask questions to understand the student better:
   - What are their skills (programming languages, tools, frameworks)?
   - What field are they interested in (web development, data science, design, etc.)?
   - What is their educational background?
   - Do they have any projects or experience?
   - What are their career goals?

2. PORTFOLIO PHASE: Once you have enough info, generate a professional portfolio including:
   - A compelling headline (e.g., "Aspiring Full-Stack Developer | React & Node.js Enthusiast")
   - An about section (2-3 sentences, professional and engaging)
   - List of key skills
   - Career interests

3. MATCHING PHASE: After portfolio is generated, you'll help match them with internships on LynkSkill.

IMPORTANT:
- Always remember you are Linky from LynkSkill
- Be friendly but professional
- Ask follow-up questions if answers are vague
- When you have enough information (at least: skills, interests, and some background), transition to portfolio generation
- Output JSON when generating portfolio with format: {"type": "portfolio", "data": {headline, about, skills: [], interests: []}}
- When ready for matching, output: {"type": "ready_for_matching"}

Current conversation phase: {phase}

If you need to transition phases, include in your response:
- To move to portfolio: Add [PHASE:portfolio] at the end
- To move to matching: Add [PHASE:matching] at the end`

const COMPANY_SYSTEM_PROMPT = `You are Linky, the AI Talent Scout for LynkSkill.

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

        // userType comes from the DB role, never from the client: a student
        // claiming "company" would otherwise get the full student search.
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true }
        })
        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        const userType: "student" | "company" = dbUser.role === "COMPANY" ? "company" : "student"

        if (!checkRateLimit(userId)) {
            return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
        }

        const body = await req.json()
        const { message, phase: rawPhase } = body as { message: unknown; phase: unknown }

        if (typeof message !== "string" || !message.trim() || message.length > MAX_MESSAGE_CHARS) {
            return NextResponse.json({ error: `Message is required (max ${MAX_MESSAGE_CHARS} characters)` }, { status: 400 })
        }

        const phase: ChatPhase = VALID_PHASES.includes(rawPhase as ChatPhase) ? (rawPhase as ChatPhase) : "intro"

        // Only user/assistant turns, bounded - blocks injected "system" turns and token-cost abuse
        const conversationHistory: ConversationMessage[] = (Array.isArray(body.conversationHistory) ? body.conversationHistory : [])
            .filter((m: unknown): m is ConversationMessage => {
                const msg = m as ConversationMessage
                return (msg?.role === "user" || msg?.role === "assistant") && typeof msg.content === "string"
            })
            .slice(-MAX_HISTORY_MESSAGES)
            .map((m: ConversationMessage) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))

        // Build conversation for OpenAI
        const systemPrompt = userType === "student" 
            ? STUDENT_SYSTEM_PROMPT.replace("{phase}", phase)
            : COMPANY_SYSTEM_PROMPT.replace("{phase}", phase)

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
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
        if (reply.includes("[PHASE:portfolio]")) {
            newPhase = "portfolio"
            reply = reply.replace("[PHASE:portfolio]", "").trim()
        } else if (reply.includes("[PHASE:matching]")) {
            newPhase = "matching"
            reply = reply.replace("[PHASE:matching]", "").trim()
        }

        // Check for [SEARCH] tag for companies (new format)
        if (userType === "company") {
            const searchTagRegex = /\[SEARCH\]([\s\S]*?)\[\/SEARCH\]/
            const searchTagMatch = reply.match(searchTagRegex)
            
            if (searchTagMatch) {
                try {
                    const jsonStr = searchTagMatch[1].trim()
                    const searchData = JSON.parse(jsonStr)
                    
                    // Clean the reply - remove the search tag
                    let cleanReply = reply.replace(searchTagRegex, "").trim()
                    if (!cleanReply || cleanReply.length < 5) {
                        cleanReply = "Searching for the best candidates... 🔍"
                    }
                    
                    // Fetch matching students
                    const skills = searchData.skills || []
                    const matches = await findMatchingStudents(skills, searchData.field || "")
                    
                    return NextResponse.json({
                        reply: cleanReply,
                        phase: "results",
                        matches,
                        type: "search_complete"
                    })
                } catch (e) {
                    console.error("Search tag parse error:", e)
                }
            }
            
            // Also try old JSON format as fallback
            const searchJsonRegex = /\{\s*"type"\s*:\s*"ready_for_search"\s*,\s*"criteria"\s*:\s*\{[^}]*\}\s*\}/g
            const searchMatch = reply.match(searchJsonRegex)
            if (searchMatch) {
                try {
                    const jsonData = JSON.parse(searchMatch[searchMatch.length - 1])
                    if (jsonData.type === "ready_for_search") {
                        newPhase = "results"
                        
                        // Fetch matching students immediately
                        const matches = await findMatchingStudents(jsonData.criteria?.skills || [], jsonData.criteria?.field || "")
                        
                        // Clean the reply - remove ALL JSON patterns
                        let cleanReply = reply
                            .replace(searchJsonRegex, "")
                            .replace(/\{[^{}]*"type"[^{}]*\}/g, "")
                            .trim()
                        
                        // If reply is empty or just whitespace, provide a default
                        if (!cleanReply || cleanReply.length < 10) {
                            cleanReply = "Got it! Searching for the best candidates for you... ✨"
                        }
                        
                        return NextResponse.json({
                            reply: cleanReply,
                            phase: "results",
                            matches,
                            type: "search_complete"
                        })
                    }
                } catch (e) {
                    console.error("JSON parse error for search:", e)
                }
            }
            
            // NO FALLBACK AUTO-SEARCH - Only search when AI explicitly triggers with JSON
            // This ensures Linky finishes gathering context before searching
            
            // Smart fallback: If AI says it's searching, extract skills and search
            const isSearchingNow = reply.toLowerCase().includes("searching") || 
                                    reply.toLowerCase().includes("let me find") ||
                                    reply.toLowerCase().includes("finding") ||
                                    reply.toLowerCase().includes("looking for the best") ||
                                    reply.toLowerCase().includes("find the best")
            
            if (isSearchingNow) {
                // Extract skills from the entire conversation including current message
                const fullConversation = conversationHistory.map(m => m.content).join(" ") + " " + message + " " + reply
                const extractedSkills = extractSkillsFromText(fullConversation)
                
                console.log("Search triggered! Extracted skills:", extractedSkills)
                
                if (extractedSkills.length > 0) {
                    const matches = await findMatchingStudents(extractedSkills, "")
                    console.log("Found matches:", matches.length)
                    
                    return NextResponse.json({
                        reply,
                        phase: "results",
                        matches,
                        type: "search_complete"
                    })
                }
            }
        }

        // Handle other JSON patterns
        const jsonMatch = reply.match(/\{[\s\S]*?"type"[\s\S]*?\}/g)
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[jsonMatch.length - 1])
                responseData = jsonData
                
                // Handle portfolio generation for students
                if (jsonData.type === "portfolio" && userType === "student") {
                    newPhase = "matching"
                    
                    // Fetch matching internships
                    const matches = await findMatchingInternships(jsonData.data?.skills || [], jsonData.data?.interests || [])
                    
                    return NextResponse.json({
                        reply: reply.replace(jsonMatch[jsonMatch.length - 1], "").trim() + 
                               "\n\n✨ I've generated your portfolio! Now let me find internships that match your profile...",
                        phase: "results",
                        portfolio: jsonData.data,
                        matches,
                        type: "portfolio_generated"
                    })
                }

                // Handle ready for matching (student)
                if (jsonData.type === "ready_for_matching" && userType === "student") {
                    newPhase = "matching"
                }
            } catch (_e) {
                // JSON parsing failed, continue normally
            }
        }

        // If in matching phase and we have enough context, auto-fetch matches
        if (newPhase === "matching" && userType === "student") {
            // Extract skills from conversation
            const skills = extractSkillsFromConversation(conversationHistory, message)
            if (skills.length > 0) {
                const matches = await findMatchingInternships(skills, [])
                return NextResponse.json({
                    reply: reply + "\n\n🎯 Based on your profile, I found some internships that might interest you!",
                    phase: "results",
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
