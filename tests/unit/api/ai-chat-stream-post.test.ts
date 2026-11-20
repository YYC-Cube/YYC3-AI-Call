/* @jest-environment jsdom */
// Polyfills for Node/Jest if needed
// @ts-ignore
if (typeof (global as any).TextEncoder === "undefined") {
   
  const { TextEncoder, TextDecoder } = require("util");
  // @ts-ignore
  (global as any).TextEncoder = TextEncoder;
  // @ts-ignore
  (global as any).TextDecoder = TextDecoder;
}
// @ts-ignore
if (typeof (global as any).ReadableStream === "undefined") {
   
  const { ReadableStream } = require("stream/web");
  // @ts-ignore
  (global as any).ReadableStream = ReadableStream;
}

// 鉴权网关在专门的 API 测试覆盖，路由逻辑测试直接放行
jest.mock("@/lib/api-auth", () => ({
  requireAuth: () => ({
    ok: true,
    userId: "test-user",
    email: "test@yyc3.ai",
    role: "ADMIN",
  }),
}));

// Mock next/server so new NextResponse(...) returns a simple object
jest.mock("next/server", () => ({
  NextResponse: class {
    status: number;
    headers: any;
    body: any;
    constructor(body: any, init?: any) {
      this.status = init?.status ?? 200;
      this.headers = init?.headers ?? {};
      this.body = body;
    }
    static json(data: any, init?: any) {
      return {
        status: init?.status ?? 200,
        json: async () => data,
      } as any;
    }
  },
}));

// Mock AI client for streaming route
jest.mock("@/lib/ai-client", () => ({
  getAIClient: () => ({
    chatStream: jest.fn(async () => {
      const encoder = new TextEncoder();
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode("foo"));
          controller.enqueue(encoder.encode("bar"));
          controller.close();
        },
      });
    }),
  }),
}));

import { POST } from "@/app/api/ai/chat/stream/route";

async function readAll(rs: ReadableStream<Uint8Array>): Promise<string> {
  const reader = rs.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

describe("POST /api/ai/chat/stream", () => {
  it("returns 200 and streams data", async () => {
    const req = {
      json: async () => ({ messages: [{ role: "user", content: "hi" }] }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = res.body!;
    const text = await readAll(body);
    expect(text).toBe("foobar");
  });

  it("returns 400 when messages missing", async () => {
    const res = await POST({ json: async () => ({}) } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/messages/);
  });

  it("returns 500 when client throws", async () => {
    jest.resetModules();
    jest.doMock("@/lib/ai-client", () => ({
      getAIClient: () => ({
        chatStream: jest.fn(async () => {
          throw new Error("stream failed");
        }),
      }),
    }));

    const { POST: POSTWithThrow } = await import(
      "@/app/api/ai/chat/stream/route"
    );

    const res = await POSTWithThrow({
      json: async () => ({ messages: [{ role: "user", content: "x" }] }),
    } as any);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/stream failed|internal/i);
  });
});
