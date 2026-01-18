import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { openai } from "@/lib/openai";
import {
  generatePortfolioAudit,
  PortfolioData,
} from "../prompts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Request body for the evaluation endpoint
 */
interface EvaluationRequestBody {
  mode: string;
  portfolioData: PortfolioData;
}

/**
 * API response structure
 */
interface EvaluationResponse {
  success: boolean;
  evaluation?: string;
  error?: string;
}

/**
 * Error types for better error handling
 */
enum EvaluationErrorType {
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_REQUEST = "INVALID_REQUEST",
  API_KEY_MISSING = "API_KEY_MISSING",
  OPENAI_TIMEOUT = "OPENAI_TIMEOUT",
  OPENAI_API_ERROR = "OPENAI_API_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Custom error class for evaluation errors
 */
class EvaluationError extends Error {
  constructor(
    public type: EvaluationErrorType,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

// ============================================================================
// IN-MEMORY RATE LIMITING
// ============================================================================

/**
 * Simple in-memory rate limiter to prevent abuse
 * Key: userId, Value: { count, resetTime }
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_EVALUATIONS_PER_WINDOW = 5; // Max 5 evaluations per hour

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(userId);
    }
  }
}, 10 * 60 * 1000);

/**
 * Checks and updates rate limit for a user
 * Returns true if the request should be allowed
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userData = rateLimitMap.get(userId);

  if (!userData || now > userData.resetTime) {
    // First request or window expired - reset
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (userData.count >= MAX_EVALUATIONS_PER_WINDOW) {
    return false;
  }

  userData.count++;
  return true;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates the request body structure
 */
function validateRequestBody(body: unknown): body is EvaluationRequestBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const { mode, portfolioData } = body as Partial<EvaluationRequestBody>;

  if (typeof mode !== "string") {
    return false;
  }

  if (typeof portfolioData !== "object" || portfolioData === null) {
    return false;
  }

  const pd = portfolioData as Partial<PortfolioData>;
  if (typeof pd.fullName !== "string" || pd.fullName.trim() === "") {
    return false;
  }

  return true;
}

/**
 * Validates the mode is PORTFOLIO_AUDIT
 */
function validateMode(mode: string): void {
  if (mode !== "PORTFOLIO_AUDIT") {
    throw new EvaluationError(
      EvaluationErrorType.INVALID_REQUEST,
      "Invalid mode. Expected 'PORTFOLIO_AUDIT'.",
      400
    );
  }
}

/**
 * Validates portfolio data structure
 */
function validatePortfolioData(portfolioData: PortfolioData): void {
  if (!portfolioData.fullName || typeof portfolioData.fullName !== "string") {
    throw new EvaluationError(
      EvaluationErrorType.INVALID_REQUEST,
      "Invalid request: 'portfolioData.fullName' is required and must be a string.",
      400
    );
  }
}

/**
 * Validates request size to prevent large payloads
 */
function validateRequestSize(req: Request): void {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 10240) {
    throw new EvaluationError(
      EvaluationErrorType.INVALID_REQUEST,
      "Request payload too large. Maximum 10KB allowed.",
      400
    );
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Converts errors to appropriate HTTP responses
 */
function handleError(error: unknown): NextResponse<EvaluationResponse> {
  console.error("Evaluation error:", error);

  // Handle custom EvaluationError
  if (error instanceof EvaluationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Handle OpenAI timeout errors
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "AI request timed out. Please try again.",
        },
        { status: 504 }
      );
    }

    if (error.message.includes("API key")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OpenAI API configuration.",
        },
        { status: 500 }
      );
    }
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: "Failed to generate evaluation. Please try again.",
    },
    { status: 500 }
  );
}

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

export async function POST(req: Request): Promise<NextResponse<EvaluationResponse>> {
  try {
    // -----------------------------------------------------------------------
    // STEP 1: Authentication
    // -----------------------------------------------------------------------
    const { userId } = await auth();
    if (!userId) {
      throw new EvaluationError(
        EvaluationErrorType.UNAUTHORIZED,
        "Unauthorized: Please sign in to access the AI assistant.",
        401
      );
    }

    // -----------------------------------------------------------------------
    // STEP 2: Environment validation
    // -----------------------------------------------------------------------
    if (!process.env.OPENAI_API_KEY) {
      throw new EvaluationError(
        EvaluationErrorType.API_KEY_MISSING,
        "Missing OPENAI_API_KEY in server environment",
        500
      );
    }

    // -----------------------------------------------------------------------
    // STEP 3: Rate limiting check
    // -----------------------------------------------------------------------
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. You can generate up to 5 evaluations per hour.",
        },
        { status: 429 }
      );
    }

    // -----------------------------------------------------------------------
    // STEP 4: Request validation
    // -----------------------------------------------------------------------
    validateRequestSize(req);

    const body = await req.json();

    if (!validateRequestBody(body)) {
      throw new EvaluationError(
        EvaluationErrorType.INVALID_REQUEST,
        "Invalid request body structure.",
        400
      );
    }

    const { mode, portfolioData } = body;

    validateMode(mode);
    validatePortfolioData(portfolioData);

    // -----------------------------------------------------------------------
    // STEP 5: Generate portfolio audit using OpenAI
    // -----------------------------------------------------------------------
    const evaluationResult = await generatePortfolioAudit(portfolioData, openai);

    // -----------------------------------------------------------------------
    // STEP 6: Return response
    // -----------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      evaluation: evaluationResult,
    } as EvaluationResponse);

  } catch (error) {
    return handleError(error);
  }
}
