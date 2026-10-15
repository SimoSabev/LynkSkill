import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  generatePortfolioAudit,
  generateChatAdvisorResponse,
  StudentMemory,
  ConversationMessage,
  extractInsightsFromAudit
} from "./prompts";
import { openai, isOpenAIConfigured } from "@/lib/openai";

// Enhanced In-Memory Cache for Session Context with Conversation History
const memoryCache = new Map<string, {
    memory: StudentMemory;
    conversation: ConversationMessage[];
    timestamp: number;
}>();

// Clean up old sessions (older than 2 hours)
setInterval(() => {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    for (const [userId, data] of memoryCache.entries()) {
        if (now - data.timestamp > twoHours) {
            memoryCache.delete(userId);
        }
    }
}, 60 * 60 * 1000); // Run every hour

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!isOpenAIConfigured()) return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });

        const contentLength = Number(req.headers.get("content-length") || 0);
        if (contentLength > 100 * 1024) {
            return NextResponse.json({ error: "Request payload too large" }, { status: 413 });
        }

        const body = await req.json();
        const { message, portfolio, resetChat } = body;

        if (message !== undefined && (typeof message !== "string" || message.length > 4000)) {
            return NextResponse.json({ error: "Invalid message (max 4000 characters)" }, { status: 400 });
        }

        // Get or initialize session data
        let sessionData = memoryCache.get(userId);
        
        if (!sessionData || resetChat) {
            sessionData = {
                memory: {
                    reviewedSections: [],
                    identifiedWeaknesses: [],
                    strengths: [],
                    lastFocusedSection: null,
                    careerGoal: null,
                    auditGenerated: false,
                    improvementSuggestions: [],
                    questionsAsked: [],
                    topicsDiscussed: []
                },
                conversation: [],
                timestamp: Date.now()
            };
        }

        let reply: string;
        let mode = 'PORTFOLIO_AUDIT';

        // Handle chat mode after audit is generated
        if (message && sessionData.memory.auditGenerated) {
            mode = 'CHAT_ADVISOR';
            
            // Add user message to conversation history
            sessionData.conversation.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
            
            // Track questions asked for memory
            sessionData.memory.questionsAsked.push(message);
            
            // Generate response with full conversation context
            reply = await generateChatAdvisorResponse(
                portfolio,
                sessionData.memory,
                sessionData.conversation,
                openai
            );
            
            // Add assistant response to conversation
            sessionData.conversation.push({
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString()
            });
            
            // Update timestamp
            sessionData.timestamp = Date.now();
            
        } else {
            // Generate initial portfolio audit
            mode = 'PORTFOLIO_AUDIT';
            reply = await generatePortfolioAudit(portfolio, openai);
            
            // Extract insights from the audit to build memory
            const insights = await extractInsightsFromAudit(reply, openai);
            
            // Update memory with extracted insights
            sessionData.memory.auditGenerated = true;
            sessionData.memory.identifiedWeaknesses = insights.weaknesses || [];
            sessionData.memory.strengths = insights.strengths || [];
            sessionData.memory.improvementSuggestions = insights.suggestions || [];
            sessionData.memory.reviewedSections = insights.sections || [];
            
            // Add the audit as the first assistant message
            sessionData.conversation.push({
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString()
            });
            
            sessionData.timestamp = Date.now();
        }

        // Save updated session data
        memoryCache.set(userId, sessionData);
        
        return NextResponse.json({
            reply,
            mode,
            conversation: sessionData.conversation,
            memory: sessionData.memory
        });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "AI Service Unavailable" }, { status: 500 });
    }
}
