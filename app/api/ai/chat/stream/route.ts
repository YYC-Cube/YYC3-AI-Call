/**
 * POST /api/ai/chat/stream
 * Returns a streaming response from the AI model.
 */

import { NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';
import { getAIClient } from "@/lib/ai-client";

export async function POST(request: Request) {
  const gate = requireAuth(request);
  try {
    const body = await request.json();
    const { messages, model, temperature, max_tokens } = body || {};

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 },
      );
    }

    const client = getAIClient();
    const stream = await client.chatStream(messages, {
      model,
      temperature,
      max_tokens,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
