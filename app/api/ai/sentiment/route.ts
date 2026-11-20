/**
 * POST /api/ai/sentiment
 * Sentiment analysis endpoint
 *
 * Request:
 *   {
 *     "text": "I love your product, it's amazing!"
 *   }
 *
 * Response:
 *   {
 *     "sentiment": "positive",
 *     "score": 0.95
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';
import { getAIClient } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  const _gate = requireAuth(request);
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const client = getAIClient();
    const result = await client.analyzeSentiment(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/ai/sentiment] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
