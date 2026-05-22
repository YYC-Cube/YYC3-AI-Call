import { AIClient } from "@/lib/ai-client";

// Polyfill TextEncoder/TextDecoder if missing (Jest Node env)
const needPolyfill = typeof (global as any).TextEncoder === "undefined";
if (needPolyfill) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require("util");
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Polyfill ReadableStream if missing
if (typeof (global as any).ReadableStream === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ReadableStream } = require("stream/web");
  (global as any).ReadableStream = ReadableStream;
}

describe("AIClient.chatStream", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    (global.fetch as any)?.mockReset?.();
    jest.restoreAllMocks();
  });

  function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    });
  }

  async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
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

  it("returns a stream and yields chunks", async () => {
    const body = makeStream(["part1 ", "part2"]);
    (global.fetch as any).mockResolvedValue({ ok: true, body });

    const client = new AIClient("http://localhost:9999/v1", "chatglm3-6b");
    const rs = await client.chatStream([{ role: "user", content: "hi" }]);
    expect(rs).toBeTruthy();
    const text = await readAll(rs);
    expect(text).toBe("part1 part2");
  });

  it("throws when response not ok", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "x",
    });
    const client = new AIClient("http://localhost:9999/v1", "chatglm3-6b");
    await expect(
      client.chatStream([{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/AI API error/i);
  });

  it("throws when body missing", async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, body: null });
    const client = new AIClient("http://localhost:9999/v1", "chatglm3-6b");
    await expect(
      client.chatStream([{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/No response body/i);
  });
});
