import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { openai } from "@/lib/openai";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Represents a chat session with proper typing
 */
export interface ChatSessionData {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
}

/**
 * Request body for the chat endpoint
 */
interface ChatRequestBody {
  mode: string;
  message: string;
}

// ============================================================================
// IN-MEMORY SESSION STORAGE
// ============================================================================

/**
 * In-memory cache for chat sessions
 * Key: userId, Value: ChatSessionData
 * Sessions are kept in memory for the duration of the server process
 */
const sessionCache = new Map<string, ChatSessionData>();

// Clean up old sessions every 30 minutes (sessions older than 2 hours)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of sessionCache.entries()) {
    if (now - session.createdAt.getTime() > SESSION_TTL_MS) {
      sessionCache.delete(userId);
    }
  }
}, 30 * 60 * 1000);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets or creates a chat session for the user
 * Uses in-memory storage for simplicity
 */
function getOrCreateChatSession(userId: string): ChatSessionData {
  const existing = sessionCache.get(userId);
  if (existing) {
    return existing;
  }

  const newSession: ChatSessionData = {
    id: `session_${userId}_${Date.now()}`,
    userId,
    messages: [],
    createdAt: new Date(),
  };

  sessionCache.set(userId, newSession);
  return newSession;
}

/**
 * Parses OpenAI response to extract text content
 * Handles different response formats from the API
 */
function parseOpenAIResponse(response: unknown): string {
  const responseObj = response as {
    output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
  };

  const textParts: string[] = [];
  for (const item of responseObj.output ?? []) {
    // Check if item has content property
    if ('content' in item && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part.type === "output_text" && typeof part.text === "string") {
          textParts.push(part.text);
        }
      }
    }
  }

  return textParts.join(" ") || "No response text found.";
}

/**
 * Generates a simple chat response without portfolio context
 * Used when no evaluation is available
 */
async function generateSimpleChatResponse(
  message: string,
  sessionMessages: ChatMessage[]
): Promise<string> {
  // Build conversation history for context - last 8 messages for better memory
  const recentMessages = sessionMessages.slice(-8);
  const historyText = recentMessages
    .map((msg) => `**${msg.role === 'user' ? 'Student' : 'Linky'}**: ${msg.content}`)
    .join("\n\n");

  const simplePrompt = `You are Linky, a friendly and knowledgeable AI career advisor helping students aged 16-22 improve their portfolios and land internships.

## YOUR PERSONALITY:
- Warm, supportive, and encouraging
- Direct and actionable - no fluffy advice
- Use casual language with occasional emojis
- Be like a helpful mentor, not a formal advisor
- Remember what's been discussed in the conversation

## CONVERSATION HISTORY:
${historyText || 'This is the start of our conversation.'}

## STUDENT'S CURRENT QUESTION:
${message}

## HOW TO RESPOND:
1. Answer their specific question directly
2. Give actionable, specific advice
3. Provide examples in code blocks when helpful:
\`\`\`
Example text here
\`\`\`
4. If you need more context, ask ONE clarifying question
5. Reference earlier parts of the conversation if relevant

## RULES:
- Keep responses under 150 words unless they ask for detailed examples
- Be specific and practical
- If they mention a portfolio section, give concrete suggestions
- End with encouragement or a helpful follow-up suggestion
- Never repeat advice from earlier in the conversation`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: simplePrompt,
    });

    return parseOpenAIResponse(response);
  } catch (error) {
    console.error("OpenAI API error in simple chat:", error);
    throw new Error("Failed to generate response from AI");
  }
}

// ============================================================================
// MAIN API ROUTE
// ============================================================================

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to access the AI assistant." },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit(`assistant-chat:${userId}`, { limit: 20, windowSeconds: 60 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    // Validate OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in server environment" },
        { status: 500 }
      );
    }

    // Validate request size (max 10KB)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10240) {
      return NextResponse.json(
        { error: "Request payload too large. Maximum 10KB allowed." },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body: ChatRequestBody = await req.json();
    const { mode, message } = body;

    if (mode !== "CHAT_ADVISOR") {
      return NextResponse.json(
        { error: "Invalid mode. Expected 'CHAT_ADVISOR'." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid request: 'message' field is required and must be a string." },
        { status: 400 }
      );
    }

    // Get or create chat session (in-memory)
    const session = getOrCreateChatSession(userId);

    // Generate response using simple chat (no portfolio context needed for now)
    const responseText = await generateSimpleChatResponse(message, session.messages);

    // Store messages in session (in-memory)
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    });

    session.messages.push({
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    });

    // Keep only the last 20 messages to prevent memory bloat
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    // Update the cache
    sessionCache.set(userId, session);

    return NextResponse.json({
      success: true,
      response: responseText,
    });

  } catch (error) {
    console.error("Chat error:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (error.name === "AbortError" || errorMessage.includes("timeout")) {
        return NextResponse.json(
          { error: "AI request timed out. Please try again." },
          { status: 504 }
        );
      }

      if (errorMessage.includes("api key") || errorMessage.includes("authentication")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API configuration." },
          { status: 500 }
        );
      }

      if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
        return NextResponse.json(
          { error: "AI service rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      if (errorMessage.includes("invalid request") || errorMessage.includes("validation")) {
        return NextResponse.json(
          { error: "Invalid request to AI service." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to get response from AI. Please try again." },
      { status: 500 }
    );
  }
}
