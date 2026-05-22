/**
 * file i18n-tools.test.ts
 * description @yyc3/i18n-core i18n-tools.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[mcp],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core i18n-tools.ts 单元测试
 */
import { beforeEach, describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { registerI18nTools } from "../../lib/mcp/i18n-tools.js";
import { MCPServer } from "../../lib/mcp/server.js";
import type { MCPToolResult, MCPTransport } from "../../lib/mcp/types.js";

function createMockServer(): {
  server: MCPServer;
  getHandler: (name: string) => ((args: Record<string, unknown>) => Promise<MCPToolResult>) | undefined;
} {
  const handlers = new Map<string, (args: Record<string, unknown>) => Promise<MCPToolResult>>();
  const mockTransport: MCPTransport = {
    connected: true,
    connect: async () => { },
    send: async () => { },
    onMessage: () => { },
    close: async () => { },
  };

  const server = new MCPServer({
    name: "test-server",
    version: "1.0.0",
    transport: mockTransport,
  });

  const origRegister = server.registerTool.bind(server);
  server.registerTool = (tool, handler) => {
    handlers.set(tool.name, handler);
    origRegister(tool, handler);
  };

  return {
    server,
    getHandler: (name) => handlers.get(name),
  };
}

describe("I18n MCP Tools", () => {
  let engine: I18nEngine;
  let getHandler: (name: string) => ((args: Record<string, unknown>) => Promise<MCPToolResult>) | undefined;

  beforeEach(() => {
    engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", {
      app: { title: "My App", greeting: "Hello {name}" },
      common: { save: "Save", cancel: "Cancel" },
    });
    engine.registerTranslation("zh-CN", {
      app: { title: "我的应用" },
      common: { save: "保存" },
    });

    const mock = createMockServer();
    getHandler = mock.getHandler;
    registerI18nTools(mock.server, engine);
  });

  function extractText(result: { content: Array<{ type: string; text?: string }> }): string {
    return result.content.map((c) => (c.type === "text" ? c.text ?? "" : "")).join(" ");
  }

  it("should register all 7 tools", () => {
    const toolNames = [
      "search_translations",
      "add_translation_key",
      "translate_key",
      "check_missing_keys",
      "get_locale_stats",
      "set_locale",
      "quality_report",
    ];
    for (const name of toolNames) {
      expect(getHandler(name)).toBeDefined();
    }
  });

  it("should search translations", async () => {
    const handler = getHandler("search_translations")!;
    const result = await handler({ query: "app" });
    const text = extractText(result);
    expect(text).toContain("app.title");
  });

  it("should add translation key", async () => {
    const handler = getHandler("add_translation_key")!;
    await handler({
      key: "newFeature",
      locale: "en",
      value: "New Feature",
    });

    const searchHandler = getHandler("search_translations")!;
    const searchResult = await searchHandler({ query: "newFeature" });
    const text = extractText(searchResult);
    expect(text).toContain("newFeature");
  });

  it("should translate key", async () => {
    const handler = getHandler("translate_key")!;
    const result = await handler({ key: "app.title" });
    const text = extractText(result);
    expect(text).toContain("My App");
  });

  it("should check missing keys", async () => {
    const handler = getHandler("check_missing_keys")!;
    const result = await handler({ locale: "zh-CN" });
    const text = extractText(result);
    expect(text).toContain("app.greeting");
  });

  it("should get locale stats", async () => {
    const handler = getHandler("get_locale_stats")!;
    const result = await handler({});
    const text = extractText(result);
    expect(text).toContain("en");
    expect(text).toContain("zh-CN");
  });

  it("should set locale", async () => {
    const handler = getHandler("set_locale")!;
    const result = await handler({ locale: "zh-CN" });
    const text = extractText(result);
    expect(text).toContain("zh-CN");
  });

  it("should generate quality report", async () => {
    const handler = getHandler("quality_report")!;
    const result = await handler({});
    expect(result.content).toBeDefined();
  });
});
