/**
 * POST /api/ai/chat
 * Chat endpoint - delegates to vLLM-backed ChatGLM3-6B
 *
 * Request:
 *   {
 *     "messages": [{"role": "user", "content": "..."}],
 *     "model": "chatglm3-6b",  // optional
 *     "temperature": 0.6,       // optional
 *     "max_tokens": 1024        // optional
 *   }
 *
 * Response:
 *   {
 *     "id": "...",
 *     "model": "chatglm3-6b",
 *     "choices": [{"message": {"role": "assistant", "content": "..."}}],
 *     "usage": {...}
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';
import { getAIClient } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  const gate = requireAuth(request);
  try {
    const body = await request.json();
    const { messages, model, temperature, max_tokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 },
      );
    }

    const client = getAIClient();
    const response = await client.chat(messages, {
      model,
      temperature,
      max_tokens,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/ai/chat] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
