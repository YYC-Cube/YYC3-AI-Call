import { describe, it, expect } from "vitest";
import {
  SERVER_DEFINITIONS,
  getServerDefinition,
  getServersByCategory,
  getAllTools,
  getToolByName,
} from "../registry/index.js";

describe("MCP Server Registry", () => {
  describe("SERVER_DEFINITIONS", () => {
    it("应该包含7个Server定义", () => {
      expect(SERVER_DEFINITIONS.length).toBe(7);
    });

    it("每个Server都有必需字段", () => {
      for (const server of SERVER_DEFINITIONS) {
        expect(server.id).toBeTruthy();
        expect(server.name).toBeTruthy();
        expect(server.description).toBeTruthy();
        expect(server.version).toBeTruthy();
        expect(server.tools.length).toBeGreaterThan(0);
        expect(server.configTemplate).toBeDefined();
        expect(server.category).toBeTruthy();
      }
    });

    it("每个Server的tools都有必需字段", () => {
      for (const server of SERVER_DEFINITIONS) {
        for (const tool of server.tools) {
          expect(tool.name).toBeTruthy();
          expect(tool.description).toBeTruthy();
          expect(tool.inputSchema.type).toBe("object");
          expect(tool.inputSchema.properties).toBeDefined();
        }
      }
    });

    it("应该包含所有预期的Server", () => {
      const ids = SERVER_DEFINITIONS.map((s) => s.id);
      expect(ids).toContain("brave-search");
      expect(ids).toContain("github");
      expect(ids).toContain("filesystem");
      expect(ids).toContain("docker");
      expect(ids).toContain("postgresql");
      expect(ids).toContain("claude-prompts");
      expect(ids).toContain("yyc3cn-assistant");
    });
  });

  describe("getServerDefinition", () => {
    it("应该按ID查找Server", () => {
      const server = getServerDefinition("github");
      expect(server).toBeDefined();
      expect(server!.name).toBe("GitHub");
    });

    it("不存在的ID返回undefined", () => {
      expect(getServerDefinition("nonexistent")).toBeUndefined();
    });
  });

  describe("getServersByCategory", () => {
    it("应该按分类过滤", () => {
      const searchServers = getServersByCategory("search");
      expect(searchServers.length).toBe(1);
      expect(searchServers[0].id).toBe("brave-search");
    });

    it("code分类包含github", () => {
      const codeServers = getServersByCategory("code");
      expect(codeServers.length).toBe(1);
      expect(codeServers[0].id).toBe("github");
    });

    it("ai分类包含2个Server", () => {
      const aiServers = getServersByCategory("ai");
      expect(aiServers.length).toBe(2);
    });
  });

  describe("getAllTools", () => {
    it("应该返回所有工具", () => {
      const tools = getAllTools();
      expect(tools.length).toBeGreaterThan(10);
    });
  });

  describe("getToolByName", () => {
    it("应该按名称查找工具", () => {
      const tool = getToolByName("brave_web_search");
      expect(tool).toBeDefined();
      expect(tool!.description).toContain("Brave Search");
    });

    it("应该跨Server查找工具", () => {
      const tool = getToolByName("github_create_issue");
      expect(tool).toBeDefined();
    });

    it("不存在的工具返回undefined", () => {
      expect(getToolByName("nonexistent_tool")).toBeUndefined();
    });
  });
});
