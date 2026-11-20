/**
 * POST /api/ai/intent
 * Intent classification endpoint
 *
 * Request:
 *   {
 *     "message": "I want to return this product",
 *     "intents": ["sales", "support", "billing", "feedback", "other"]  // optional
 *   }
 *
 * Response:
 *   {
 *     "intent": "support",
 *     "confidence": 0.92
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';
import { getAIClient } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  const _gate = requireAuth(request);
  try {
    const body = await request.json();
    const { message, intents } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    const client = getAIClient();
    const result = await client.classifyIntent(
      message,
      intents || ["sales", "support", "billing", "feedback", "other"],
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/ai/intent] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
