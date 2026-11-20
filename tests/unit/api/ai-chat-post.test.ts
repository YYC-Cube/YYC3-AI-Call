jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

// 鉴权网关在专门的 API 测试覆盖，路由逻辑测试直接放行
jest.mock("@/lib/api-auth", () => ({
  requireAuth: () => ({
    ok: true,
    userId: "test-user",
    email: "test@yyc3.ai",
    role: "ADMIN",
  }),
}));

// Mock AI client
jest.mock("@/lib/ai-client", () => {
  return {
    getAIClient: () => ({
      chat: jest.fn(async (_messages: any, _opts?: any) => ({
        id: "test-id",
        object: "chat.completion",
        created: Date.now() / 1000,
        model: "chatglm3-6b",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "你好" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      })),
    }),
  };
});

import { POST } from "@/app/api/ai/chat/route";

describe("POST /api/ai/chat", () => {
  it("returns 200 with completion when messages provided", async () => {
    const req = {
      json: async () => ({
        messages: [{ role: "user", content: "hi" }],
        temperature: 0.6,
        max_tokens: 64,
      }),
    } as any;

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.choices?.[0]?.message?.content).toBe("你好");
  });

  it("returns 400 when messages missing", async () => {
    const req = { json: async () => ({}) } as any;
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/messages array is required/i);
  });

  it("returns 500 when client throws", async () => {
    jest.resetModules();
    jest.doMock("@/lib/ai-client", () => ({
      getAIClient: () => ({
        chat: jest.fn(async () => {
          throw new Error("boom");
        }),
      }),
    }));

    const { POST: POSTWithThrow } = await import("@/app/api/ai/chat/route");

    const req = {
      json: async () => ({ messages: [{ role: "user", content: "hi" }] }),
    } as any;
    const res = await POSTWithThrow(req);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toMatch(/boom|internal/i);
  });
});
