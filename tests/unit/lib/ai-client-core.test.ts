import { AIClient } from "@/lib/ai-client";

describe("AIClient core methods", () => {
  it("extractText returns empty string on empty choices", () => {
    const client = new AIClient("http://x", "m");
    const res = { choices: [] as any[] };
    expect(client.extractText(res as any)).toBe("");
  });

  it("extractText returns message content when present", () => {
    const client = new AIClient("http://x", "m");
    const res = {
      choices: [{ message: { role: "assistant", content: "hello" } }],
    };
    expect(client.extractText(res as any)).toBe("hello");
  });

  it("classifyIntent falls back when JSON parse fails", async () => {
    const client = new AIClient("http://x", "m");
    const spy = jest
      .spyOn(client as any, "chat")
      .mockResolvedValue({ choices: [{ message: { content: "not json" } }] });

    const out = await client.classifyIntent("refund");
    expect(out.intent).toBe("other");
    expect(out.confidence).toBeCloseTo(0.5);
    spy.mockRestore();
  });

  it("classifyIntent returns parsed JSON and respects custom intents", async () => {
    const client = new AIClient("http://x", "m");
    const payload = { intent: "billing", confidence: 0.88 };
    const spy = jest
      .spyOn(client as any, "chat")
      .mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(payload) } }],
      });

    const out = await client.classifyIntent("pay", ["billing", "sales"]);
    expect(out).toEqual(payload);
    spy.mockRestore();
  });

  it("analyzeSentiment falls back on parse error", async () => {
    const client = new AIClient("http://x", "m");
    const spy = jest
      .spyOn(client as any, "chat")
      .mockResolvedValue({ choices: [{ message: { content: "oops" } }] });

    const out = await client.analyzeSentiment("text");
    expect(out.sentiment).toBe("neutral");
    expect(out.score).toBe(0);
    spy.mockRestore();
  });

  it("analyzeSentiment returns parsed JSON", async () => {
    const client = new AIClient("http://x", "m");
    const payload = { sentiment: "positive", score: 0.9 } as const;
    const spy = jest
      .spyOn(client as any, "chat")
      .mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(payload) } }],
      });

    const out = await client.analyzeSentiment("yay");
    expect(out).toEqual(payload);
    spy.mockRestore();
  });
});

describe("AIClient.chat advanced", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    (global.fetch as any)?.mockReset?.();
  });

  it("throws error with status and statusText when response not ok", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "detailed error",
    });

    const client = new AIClient("http://x", "m");
    await expect(
      client.chat([{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/502.*Bad Gateway.*detailed error/);
  });

  it("throws error on timeout via AbortController", async () => {
    (global.fetch as any).mockImplementation((_url: string, init: any) => {
      const { signal } = init;
      signal.dispatchEvent(new Event("abort"));
      return Promise.reject(new Error("The operation was aborted"));
    });

    const client = new AIClient("http://x", "m", 100);
    await expect(
      client.chat([{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/aborted|timeout/i);
  });

  it("clears timeout after successful response", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "123",
        choices: [{ message: { role: "assistant", content: "ok" } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
    });

    const client = new AIClient("http://x", "m");
    await client.chat([{ role: "user", content: "hi" }]);
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

describe("AIClient.getModels advanced", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    (global.fetch as any)?.mockReset?.();
  });

  it("throws error when response not ok", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      statusText: "Unauthorized",
    });

    const client = new AIClient("http://x", "m");
    await expect(client.getModels()).rejects.toThrow(
      /Failed to fetch models.*Unauthorized/i,
    );
  });

  it("returns empty array when data is undefined", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const client = new AIClient("http://x", "m");
    const models = await client.getModels();
    expect(models).toEqual([]);
  });

  it("handles malformed response structure gracefully", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: "not an array" }),
    });

    const client = new AIClient("http://x", "m");
    const models = await client.getModels();
    expect(models).toEqual([]);
  });

  it("extracts model ids from data array", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: "model-1", name: "Model 1" },
          { id: "model-2", name: "Model 2" },
        ],
      }),
    });

    const client = new AIClient("http://x", "m");
    const models = await client.getModels();
    expect(models).toEqual(["model-1", "model-2"]);
  });
});

describe("AIClient.healthCheck advanced", () => {
  it("returns false when getModels throws", async () => {
    const client = new AIClient("http://x", "m");
    const spy = jest
      .spyOn(client, "getModels")
      .mockRejectedValue(new Error("connection failed"));

    const healthy = await client.healthCheck();
    expect(healthy).toBe(false);
    spy.mockRestore();
  });

  it("returns true when getModels returns non-empty array", async () => {
    const client = new AIClient("http://x", "m");
    const spy = jest
      .spyOn(client, "getModels")
      .mockResolvedValue(["model-1", "model-2"]);

    const healthy = await client.healthCheck();
    expect(healthy).toBe(true);
    spy.mockRestore();
  });

  it("returns false when getModels returns empty array", async () => {
    const client = new AIClient("http://x", "m");
    const spy = jest.spyOn(client, "getModels").mockResolvedValue([]);

    const healthy = await client.healthCheck();
    expect(healthy).toBe(false);
    spy.mockRestore();
  });
});
