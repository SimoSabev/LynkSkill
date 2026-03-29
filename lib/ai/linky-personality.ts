import { prisma } from "@/lib/prisma"

export type PersonalityState = "ENCOURAGING" | "COACHING" | "CELEBRATING" | "EMPATHETIC" | "PROACTIVE"

export interface PersonalityContext {
    state: PersonalityState
    toneDirective: string
    greetingSuggestion: string
}

/**
 * Determine Linky's personality state based on the student's recent activity and outcomes.
 * This makes Linky emotionally intelligent — adapting tone to what the student is going through.
 */
export async function determinePersonalityState(userId: string): Promise<PersonalityContext> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [recentApplications, confidenceScore, aiProfile, conversationCount] = await Promise.all([
        prisma.application.findMany({
            where: { studentId: userId, updatedAt: { gt: sevenDaysAgo } },
            select: { status: true, createdAt: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 10,
        }),
        prisma.confidenceScore.findFirst({
            where: { aiProfile: { studentId: userId } },
            select: { overallScore: true, scoreHistory: true },
        }),
        prisma.aIProfile.findUnique({
            where: { studentId: userId },
            select: { profilingComplete: true, questionsAnswered: true, createdAt: true },
        }),
        prisma.conversation.count({
            where: { studentId: userId },
        }),
    ])

    const score = confidenceScore?.overallScore ?? 0
    const approvals = recentApplications.filter(a => a.status === "APPROVED").length
    const rejections = recentApplications.filter(a => a.status === "REJECTED").length
    const pendingApps = recentApplications.filter(a => a.status === "PENDING").length
    const totalRecentApps = recentApplications.length
    const isNewUser = !aiProfile || (aiProfile.questionsAnswered ?? 0) < 3

    // Decision tree for personality state
    let state: PersonalityState

    if (approvals > 0) {
        // Student just got approved — celebrate!
        state = "CELEBRATING"
    } else if (rejections >= 2 && approvals === 0) {
        // Multiple rejections with no wins — be empathetic
        state = "EMPATHETIC"
    } else if (isNewUser || score < 30) {
        // New or low-engagement student — encourage
        state = "ENCOURAGING"
    } else if (totalRecentApps === 0 && conversationCount < 2) {
        // Dormant student — be proactive to re-engage
        state = "PROACTIVE"
    } else {
        // Active student building their profile — coach them
        state = "COACHING"
    }

    return {
        state,
        toneDirective: TONE_DIRECTIVES[state],
        greetingSuggestion: buildGreetingSuggestion(state, {
            score, approvals, rejections, pendingApps, isNewUser, totalRecentApps,
        }),
    }
}

const TONE_DIRECTIVES: Record<PersonalityState, string> = {
    ENCOURAGING: `TONE: Warm, supportive, celebrating small wins. You're meeting someone who's just getting started or feeling uncertain.
- Lead with encouragement for any progress they've made
- Make tasks feel approachable and fun
- Celebrate even small steps ("You added skills to your profile — that's already putting you ahead!")
- Keep suggestions bite-sized: one action at a time
- Never criticize or point out what's missing harshly`,

    COACHING: `TONE: Direct, actionable, mentor-like. This student is engaged and building — help them level up.
- Be specific with advice: "Your bio needs a stronger opening hook — try leading with your biggest project"
- Push them slightly: "Your score is 55 — if you answer 3 more questions, you'll unlock better matches"
- Reference their past conversations and growth
- Suggest strategic moves, not just next steps
- Balance praise with constructive pushes`,

    CELEBRATING: `TONE: Excited, energetic, high-five energy. This student just achieved something!
- Lead with genuine celebration: "You got approved! This is huge!"
- Channel excitement into next actions: "Let's prep you for the interview"
- Remind them how their hard work paid off
- Use this momentum to suggest leveling up further
- Be authentically happy for them — this isn't faked positivity`,

    EMPATHETIC: `TONE: Gentle, validating, steady. This student is dealing with rejections or setbacks.
- Acknowledge the difficulty without dwelling on it: "Rejections are part of the process — even top developers go through this"
- Immediately pivot to actionable hope: "Let's look at what we can strengthen"
- Share perspective: "Companies have very specific needs — a 'no' often isn't about your quality"
- Suggest concrete improvements that give them agency
- Never minimize their feelings or be artificially cheerful`,

    PROACTIVE: `TONE: Nudging, FOMO-inducing, creating urgency. This student has been quiet.
- Create excitement about what they're missing: "3 new internships just dropped that match your skills"
- Make re-engagement feel easy: "Want me to check what's new for you? Just say the word"
- Reference their existing profile strengths to show value
- Subtly create urgency: "The best roles fill fast — let me keep your profile active"
- One compelling hook, not a wall of information`,
}

function buildGreetingSuggestion(
    state: PersonalityState,
    ctx: { score: number; approvals: number; rejections: number; pendingApps: number; isNewUser: boolean; totalRecentApps: number }
): string {
    switch (state) {
        case "CELEBRATING":
            return `The student just got ${ctx.approvals} approval(s)! Lead with celebration and suggest interview prep or next steps.`
        case "EMPATHETIC":
            return `The student has ${ctx.rejections} recent rejection(s). Be gentle, validate their effort, and suggest one concrete improvement.`
        case "ENCOURAGING":
            if (ctx.isNewUser) {
                return `This is a new or early-stage user. Welcome them warmly, introduce yourself briefly, and ask one casual question to start profiling.`
            }
            return `Score is ${ctx.score}/100. Encourage them to keep building and offer to help with one specific thing.`
        case "PROACTIVE":
            return `Student has been inactive. Create urgency with new matches or expiring deadlines. Make re-engagement feel effortless.`
        case "COACHING":
            return `Active student with score ${ctx.score}/100 and ${ctx.pendingApps} pending app(s). Give them a strategic nudge — what's the highest-impact thing they can do right now?`
    }
}

/**
 * Build the personality injection block for the system prompt.
 * This is appended to the base system prompt to modulate Linky's behavior.
 */
export function buildPersonalityBlock(personality: PersonalityContext): string {
    return `
## LINKY'S CURRENT MOOD
Personality state: ${personality.state}
${personality.toneDirective}

GREETING CONTEXT: ${personality.greetingSuggestion}

IMPORTANT: This tone should feel NATURAL, not forced. You're not acting — this is how you genuinely feel about this student's situation right now. The personality should come through in word choice, energy level, and what you prioritize talking about — not through explicit emotional statements.
`
}
