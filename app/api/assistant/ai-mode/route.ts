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

const COMPANY_SYSTEM_PROMPT = `You are Linky, the AI Hiring Manager for LynkSkill. 

⚠️ CRITICAL DECISIVENESS RULE:
If the user mentions any technical skill, industry, or job requirement (e.g., "агентови системи", "React", "AI"), you MUST IMMEDIATELY trigger a search. 
- DO NOT ask "Would you like to search?". 
- DO NOT offer choices first. 
- JUST SEARCH.

To search, output exactly this JSON at the end of your message:
\`\`\`json
{
  "type": "ready_for_search",
  "criteria": {
    "semanticQuery": "Detailed technical query in English based on the user's needs",
    "roleType": "internship"
  }
}
\`\`\`

If and only if the request has ZERO technical or industry hints (e.g. "I want to hire someone" without context), then use the "clarification" type.

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

        // Handle JSON output from the Assistant
        const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
        const jsonMatches = [...reply.matchAll(jsonBlockRegex)];
        
        if (jsonMatches.length > 0) {
            try {
                // Get the last JSON block found
                const jsonStr = jsonMatches[jsonMatches.length - 1][1];
                const jsonData = JSON.parse(jsonStr);
                
                if (userType === "student" && jsonData.type === "profile_update") {
                    responseData = {
                        ...responseData,
                        profileUpdate: jsonData.data,
                        confidenceDelta: jsonData.confidenceDelta || 1
                    };
                    reply = reply.replace(jsonBlockRegex, "").trim();
                } else if (userType === "company" && jsonData.type === "clarification") {
                    responseData = {
                        ...responseData,
                        clarificationOptions: jsonData.options || []
                    }
                    reply = reply.replace(jsonBlockRegex, "").trim();
                } else if (userType === "company" && jsonData.type === "ready_for_search") {
                    // execute Semantic Search based on the criteria
                    const matches = await executeSemanticSearch(jsonData.criteria?.semanticQuery || "");
                    
                    responseData = {
                        ...responseData,
                        matches,
                        type: "matches_found"
                    }
                    reply = reply.replace(jsonBlockRegex, "").trim();
                    newPhase = "results" as ChatPhase;
                }
            } catch (e) {
                console.error("Assistant JSON parse error:", e);
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

// Technical keyword mapper for Bulgarian-to-English synonyms
const TECH_MAPPER: Record<string, string[]> = {
    "агентови": ["agent", "agents", "multi-agent", "agentic"],
    "агенти": ["agent", "agents", "multi-agent"],
    "системи": ["systems"],
    "изкуствен интелект": ["ai", "artificial intelligence"],
    "програмиране": ["programming", "developer", "coding"],
    "стаж": ["internship", "intern"],
    "предна част": ["frontend", "react"],
    "задна част": ["backend", "node", "python"],
}

function _preprocessBulgarianQuery(query: string): string {
    let processed = query.toLowerCase()
    for (const [bg, engs] of Object.entries(TECH_MAPPER)) {
        if (processed.includes(bg)) {
            processed += " " + engs.join(" ")
        }
    }
    return processed
}

// Use OpenAI to expand a conceptual query into an array of concrete skills and synonyms
async function expandSearchQuery(semanticQuery: string): Promise<string[]> {
    const preprocessed = _preprocessBulgarianQuery(semanticQuery)
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a specialized CV search expander. The user will give you a job requirement. Output a comma-separated list of 20-30 synonyms, related technologies, and variations. \nExample: 'AI Agents' -> 'agents, multi-agent systems, autonomous agents, langchain, autogen, llm, artificial intelligence, multiagent'. \nCRITICAL: Output terms in English. Include common Bulgarian translations if applicable as well, but focus on tech terms. ONLY output the comma-separated list."
                },
                {
                    role: "user",
                    content: preprocessed
                }
            ],
            temperature: 0.3,
        })
        const text = response.choices[0]?.message?.content || ""
        // Normalize: lowercase, remove non-alphanumeric except spaces
        const expanded = text.split(",").map(s => s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " ")).filter(Boolean)
        
        // Ensure the original query is always included (normalized)
        const originalNormalized = semanticQuery.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim()
        if (originalNormalized && !expanded.includes(originalNormalized)) {
            expanded.unshift(originalNormalized)
        }
        
        return expanded
    } catch (e) {
        console.error("Query expansion failed:", e)
        return [semanticQuery.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim()]
    }
}

// Semantic Candidate Search leveraging Confidence Scores
async function executeSemanticSearch(semanticQuery: string) {
    try {
        const expandedSkills = await expandSearchQuery(semanticQuery)
        console.log(`[Semantic Search] Original: "${semanticQuery}", Expanded to:`, expandedSkills)
        
        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT"
            },
            include: {
                profile: true,
                portfolio: true,
                experiences: true,
                projects: true,
                aiProfile: {
                    include: { confidenceScore: true }
                }
            },
            take: 500
        })

        console.log(`[Semantic Search] Query: "${semanticQuery}", Expanded to: [${expandedSkills.join(", ")}], Students pool: ${students.length}`)

        const matches = students.map(student => {
            let score = 0
            const reasons: Set<string> = new Set()
            const foundSkills: Set<string> = new Set()

            const studentSkills = student.portfolio?.skills || []
            const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim()).filter(s => s.length > 1)

            // Normalize all student data for matching. Filter out empty strings and very short noise.
            const studentTextPieces = [
                ...studentSkills,
                ...(student.portfolio?.interests || []),
                student.portfolio?.bio || "",
                student.portfolio?.headline || "",
                student.portfolio?.experience || "",
                ...(student.projects?.map((p: any) => `${p.title} ${p.description} ${(p.technologies || []).join(" ")}`) || [])
            ]
            .map(t => t?.toLowerCase()?.replace(/[^a-z0-9 ]/g, " ")?.trim())
            .filter(t => t && t.length > 1) 

            const fullStudentText = studentTextPieces.join(" ")
            const studentWords = fullStudentText.split(/\s+/).filter(w => w.length > 2)

            // Match expanded skills
            for (const skill of expandedSkills) {
                const skillNormalized = skill.toLowerCase().trim()
                if (!skillNormalized || skillNormalized.length < 2) continue

                // 1. Core Skill Direct Match (Highest Weight)
                const isDirectSkill = normalizedStudentSkills.some(s => s === skillNormalized || s.includes(skillNormalized) || skillNormalized.includes(s))
                
                if (isDirectSkill) {
                    score += 45
                    foundSkills.add(skill)
                    reasons.add(`Direct specialized skill: ${skill}`)
                    continue
                }

                // 2. Phrase match in bio/projects
                const hasPhrase = studentTextPieces.some(p => p.includes(skillNormalized) || (p.length > 2 && skillNormalized.includes(p)))
                
                if (hasPhrase) {
                    score += 25
                    foundSkills.add(skill)
                    reasons.add(`Match in profile context: ${skill}`)
                    continue
                }

                // 3. Fuzzy word-level overlap
                const skillWords = skillNormalized.split(/\s+/).filter(w => w.length > 2)
                let matchedWordsCount = 0
                
                for (const sw of skillWords) {
                    if (studentWords.some(w => w.includes(sw) || sw.includes(w))) {
                        matchedWordsCount++
                    }
                }
                
                const wordMatchRatio = skillWords.length > 0 ? matchedWordsCount / skillWords.length : 0

                if (wordMatchRatio >= 0.5) {
                    score += 15 * wordMatchRatio
                    foundSkills.add(skill)
                    reasons.add(`Related context: ${skill}`)
                }
            }

            // Include Confidence Score in evaluation
            const confidenceScore = student.aiProfile?.confidenceScore?.overallScore || 0
            if (confidenceScore > 0) {
                // Boost score by up to 20 points based on confidence density
                score += (confidenceScore / 100) * 20
                if (confidenceScore >= 75) {
                    reasons.add(`High confidence profile (${confidenceScore}%)`)
                }
            }

            // Cap and ensure diversity
            score = Math.min(score, 98)

            return {
                id: student.id,
                name: student.profile?.name || student.portfolio?.fullName || "Student",
                email: student.email || "",
                matchPercentage: Math.round(score),
                reasons: Array.from(reasons).slice(0, 3),
                skills: Array.from(foundSkills).slice(0, 5).length > 0 ? Array.from(foundSkills).slice(0, 5) : studentSkills.slice(0, 5),
                allSkills: studentSkills,
                portfolio: {
                    headline: student.portfolio?.headline || undefined,
                    about: student.portfolio?.bio || undefined
                }
            }
        })

        // Sort by match percentage and return top 10
        console.log(`[Semantic Search] Found ${matches.length} matches after filtering (>15%)`)

        return matches
            .filter(m => m.matchPercentage > 15) // Needs at least some relevance
            .sort((a, b) => b.matchPercentage - a.matchPercentage)
            .slice(0, 10)

    } catch (error) {
        console.error("Error finding semantic candidates:", error)
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
