/**
 * file providers.test.ts
 * description @yyc3/i18n-core providers.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core providers.ts 单元测试
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OllamaProvider } from "../../lib/ai/ollama-provider.js";
import { OpenAIProvider } from "../../lib/ai/openai-provider.js";
import { AIProviderManager } from "../../lib/ai/provider.js";

describe("OpenAI Provider", () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({ type: "openai", apiKey: "test-key-123" });
  });

  it("should initialize with config", () => {
    expect(provider.type).toBe("openai");
    expect(provider.isReady).toBe(false);
  });

  it("should become ready after initialize", async () => {
    await provider.initialize();
    expect(provider.isReady).toBe(true);
  });

  it("should throw without API key", async () => {
    const noKey = new OpenAIProvider({ type: "openai", apiKey: "" });
    await expect(noKey.initialize()).rejects.toThrow("OpenAI API Key not configured");
  });

  it("should return correct info", async () => {
    await provider.initialize();
    const info = provider.getInfo();
    expect(info.type).toBe("openai");
    expect(info.isLocal).toBe(false);
    expect(info.defaultModel).toBe("gpt-4o-mini");
  });

  it("should validate with API key", async () => {
    const valid = await provider.validate();
    expect(valid).toBe(true);
  });

  it("should validate without API key", async () => {
    const noKey = new OpenAIProvider({ type: "openai", apiKey: "" });
    const valid = await noKey.validate();
    expect(valid).toBe(false);
  });

  it("should translate text via fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "你好世界" } }],
        model: "gpt-4o-mini",
      }),
    } as Response);

    await provider.initialize();
    const result = await provider.translate({
      sourceText: "Hello World",
      sourceLocale: "en",
      targetLocale: "zh-CN",
    });

    expect(result.translatedText).toBe("你好世界");
    expect(result.provider).toBe("openai");
    expect(result.cached).toBe(false);
  });

  it("should handle API errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    } as Response);

    await provider.initialize();
    await expect(
      provider.translate({
        sourceText: "test",
        sourceLocale: "en",
        targetLocale: "zh-CN",
      })
    ).rejects.toThrow("OpenAI API error (429)");
  });

  it("should batch translate", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "翻译结果" } }],
        model: "gpt-4o-mini",
      }),
    } as Response);

    await provider.initialize();
    const results = await provider.batchTranslate([
      { sourceText: "Hello", sourceLocale: "en", targetLocale: "zh-CN" },
      { sourceText: "World", sourceLocale: "en", targetLocale: "zh-CN" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].translatedText).toBe("翻译结果");
  });

  it("should include glossary in prompt", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "result" } }],
        model: "gpt-4o-mini",
      }),
    } as Response);

    await provider.initialize();
    await provider.translate({
      sourceText: "test",
      sourceLocale: "en",
      targetLocale: "zh-CN",
      glossary: { API: "接口" },
    });

    const body = JSON.parse((fetchSpy.mock.calls[0]?.[1] as RequestInit)?.body as string);
    expect(body.messages[1].content).toContain("Glossary");
    expect(body.messages[1].content).toContain("API → 接口");
  });

  it("should dispose correctly", async () => {
    await provider.initialize();
    expect(provider.isReady).toBe(true);
    await provider.dispose();
    expect(provider.isReady).toBe(false);
  });
});

describe("Ollama Provider", () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    provider = new OllamaProvider({ type: "ollama", baseUrl: "http://localhost:11434" });
  });

  it("should initialize with config", () => {
    expect(provider.type).toBe("ollama");
    expect(provider.isReady).toBe(false);
  });

  it("should return correct info", () => {
    const info = provider.getInfo();
    expect(info.type).toBe("ollama");
    expect(info.isLocal).toBe(true);
    expect(info.defaultModel).toBe("qwen2.5:3b");
  });

  it("should validate successfully when Ollama available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: true } as Response);
    const valid = await provider.validate();
    expect(valid).toBe(true);
  });

  it("should validate unsuccessfully when Ollama unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Connection refused"));
    const valid = await provider.validate();
    expect(valid).toBe(false);
  });

  it("should initialize when Ollama available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: true } as Response);
    await provider.initialize();
    expect(provider.isReady).toBe(true);
  });

  it("should throw when Ollama unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Connection refused"));
    await expect(provider.initialize()).rejects.toThrow("Ollama not available");
  });

  it("should translate text via Ollama API", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: "你好" },
          model: "qwen2.5:3b",
        }),
      } as Response);

    await provider.initialize();
    const result = await provider.translate({
      sourceText: "Hello",
      sourceLocale: "en",
      targetLocale: "zh-CN",
    });

    expect(result.translatedText).toBe("你好");
    expect(result.provider).toBe("ollama");
  });

  it("should handle Ollama API errors", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal error",
      } as Response);

    await provider.initialize();
    await expect(
      provider.translate({
        sourceText: "test",
        sourceLocale: "en",
        targetLocale: "zh-CN",
      })
    ).rejects.toThrow("Ollama API error (500)");
  });

  it("should batch translate", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({ message: { content: "结果" }, model: "qwen2.5:3b" }),
      } as Response);

    await provider.initialize();
    const results = await provider.batchTranslate([
      { sourceText: "a", sourceLocale: "en", targetLocale: "zh-CN" },
    ]);
    expect(results).toHaveLength(1);
  });

  it("should dispose correctly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: true } as Response);
    await provider.initialize();
    await provider.dispose();
    expect(provider.isReady).toBe(false);
  });
});

describe("AIProviderManager", () => {
  let manager: AIProviderManager;

  beforeEach(() => {
    manager = new AIProviderManager();
  });

  it("should register provider and set active", () => {
    const provider = new OpenAIProvider({ type: "openai", apiKey: "test" });
    manager.register(provider);
    expect(manager.getActiveProviderType()).toBe("openai");
  });

  it("should list registered provider types", () => {
    manager.register(new OpenAIProvider({ type: "openai", apiKey: "test" }));
    manager.register(new OllamaProvider({ type: "ollama" }));
    const types = manager.getRegisteredProviders();
    expect(types).toContain("openai");
    expect(types).toContain("ollama");
  });

  it("should set active provider", () => {
    manager.register(new OpenAIProvider({ type: "openai", apiKey: "test" }));
    manager.register(new OllamaProvider({ type: "ollama" }));
    manager.setActive("ollama");
    expect(manager.getActiveProviderType()).toBe("ollama");
  });

  it("should throw when setting unregistered provider", () => {
    expect(() => manager.setActive("nonexistent")).toThrow("not registered");
  });

  it("should auto-detect providers", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);
    manager.register(new OpenAIProvider({ type: "openai", apiKey: "test" }));
    const results = await manager.autoDetect();
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it("should throw when no provider registered", async () => {
    await expect(
      manager.translate({
        sourceText: "test",
        sourceLocale: "en",
        targetLocale: "zh-CN",
      })
    ).rejects.toThrow("No AI provider registered");
  });

  it("should clear cache", () => {
    manager.clearCache();
  });

  it("should dispose all providers", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);
    const p1 = new OpenAIProvider({ type: "openai", apiKey: "test" });
    await p1.initialize();
    manager.register(p1);
    await manager.disposeAll();
    expect(manager.getActiveProviderType()).toBeNull();
  });
});
