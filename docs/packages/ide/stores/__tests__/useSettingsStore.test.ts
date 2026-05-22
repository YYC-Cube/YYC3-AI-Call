/**
 * @file stores/__tests__/useSettingsStore.test.ts
 * @description Settings Store 单元测试 — 覆盖 CRUD、深层搜索、导入导出、重置等核心功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,settings,store,unit
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
  });

  // ── 初始状态 ──

  describe("初始状态", () => {
    it("应有默认的用户信息", () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.userProfile.id).toBe("local-user");
      expect(settings.userProfile.username).toBe("YYC3 Developer");
    });

    it("应有默认的通用设置", () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.general.theme).toBe("dark");
      expect(settings.general.language).toBe("zh-CN");
      expect(settings.general.editorFont).toBe("Monaco");
      expect(settings.general.editorFontSize).toBe(14);
      expect(settings.general.wordWrap).toBe(true);
      expect(settings.general.keybindingScheme).toBe("vscode");
    });

    it("应有默认的内置智能体", () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.agents.length).toBeGreaterThanOrEqual(2);
      expect(settings.agents[0].isBuiltIn).toBe(true);
    });

    it("应有默认的对话流设置", () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.conversation.useTodoList).toBe(true);
      expect(settings.conversation.autoFixCodeIssues).toBe(true);
      expect(settings.conversation.codeReviewScope).toBe("all");
      expect(settings.conversation.commandRunMode).toBe("sandbox");
      expect(settings.conversation.volume).toBe(80);
    });

    it("应有默认的上下文设置", () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.context.indexStatus).toBe("idle");
      expect(settings.context.ignoreRules).toContain("node_modules");
      expect(settings.context.ignoreRules).toContain(".git");
    });

    it("应有默认规则和技能", () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.rules.length).toBeGreaterThanOrEqual(1);
      expect(settings.skills.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── 用户信息管理 ──

  describe("用户信息管理", () => {
    it("应能更新用户名", () => {
      useSettingsStore.getState().updateUserProfile({ username: "测试用户" });
      expect(useSettingsStore.getState().settings.userProfile.username).toBe(
        "测试用户",
      );
    });

    it("应能部分更新并保留其他字段", () => {
      useSettingsStore
        .getState()
        .updateUserProfile({ email: "test@yyc3.com", bio: "全栈开发者" });
      const { userProfile } = useSettingsStore.getState().settings;
      expect(userProfile.email).toBe("test@yyc3.com");
      expect(userProfile.bio).toBe("全栈开发者");
      expect(userProfile.username).toBe("YYC3 Developer");
    });
  });

  // ── 通用设置管理 ──

  describe("通用设置管理", () => {
    it("应能更新主题", () => {
      useSettingsStore.getState().updateGeneralSettings({ theme: "light" });
      expect(useSettingsStore.getState().settings.general.theme).toBe("light");
    });

    it("应能更新编辑器字号", () => {
      useSettingsStore.getState().updateGeneralSettings({ editorFontSize: 18 });
      expect(useSettingsStore.getState().settings.general.editorFontSize).toBe(
        18,
      );
    });

    it("应能更新语言", () => {
      useSettingsStore.getState().updateGeneralSettings({ language: "en-US" });
      expect(useSettingsStore.getState().settings.general.language).toBe(
        "en-US",
      );
    });

    it("应能更新自定义快捷键", () => {
      useSettingsStore.getState().updateGeneralSettings({
        keybindingScheme: "custom",
        customKeybindings: { "file.save": "ctrl+shift+s" },
      });
      const { general } = useSettingsStore.getState().settings;
      expect(general.keybindingScheme).toBe("custom");
      expect(general.customKeybindings["file.save"]).toBe("ctrl+shift+s");
    });

    it("应能更新编辑器字体", () => {
      useSettingsStore
        .getState()
        .updateGeneralSettings({ editorFont: "Fira Code" });
      expect(useSettingsStore.getState().settings.general.editorFont).toBe(
        "Fira Code",
      );
    });

    it("应能更新 Node.js 版本", () => {
      useSettingsStore
        .getState()
        .updateGeneralSettings({ nodeVersion: "20.0.0" });
      expect(useSettingsStore.getState().settings.general.nodeVersion).toBe(
        "20.0.0",
      );
    });
  });

  // ── 智能体 CRUD ──

  describe("智能体 CRUD", () => {
    it("应能添加智能体", () => {
      const beforeCount = useSettingsStore.getState().settings.agents.length;
      useSettingsStore.getState().addAgent({
        id: "test-agent",
        name: "测试智能体",
        systemPrompt: "你是测试助手",
        model: "auto",
        temperature: 0.5,
        maxTokens: 2048,
        isBuiltIn: false,
        isCustom: true,
      });
      expect(useSettingsStore.getState().settings.agents.length).toBe(
        beforeCount + 1,
      );
    });

    it("应能更新智能体名称和温度", () => {
      useSettingsStore.getState().addAgent({
        id: "upd-agent",
        name: "待更新",
        systemPrompt: "",
        model: "auto",
        temperature: 0.7,
        maxTokens: 4096,
        isBuiltIn: false,
        isCustom: true,
      });
      useSettingsStore
        .getState()
        .updateAgent("upd-agent", { name: "已更新", temperature: 0.3 });
      const agent = useSettingsStore
        .getState()
        .settings.agents.find((a) => a.id === "upd-agent");
      expect(agent?.name).toBe("已更新");
      expect(agent?.temperature).toBe(0.3);
    });

    it("应能删除智能体", () => {
      useSettingsStore.getState().addAgent({
        id: "del-agent",
        name: "待删除",
        systemPrompt: "",
        model: "auto",
        temperature: 0.7,
        maxTokens: 4096,
        isBuiltIn: false,
        isCustom: true,
      });
      useSettingsStore.getState().removeAgent("del-agent");
      expect(
        useSettingsStore
          .getState()
          .settings.agents.find((a) => a.id === "del-agent"),
      ).toBeUndefined();
    });

    it("删除不存在的 ID 应不影响列表", () => {
      const beforeCount = useSettingsStore.getState().settings.agents.length;
      useSettingsStore.getState().removeAgent("nonexistent");
      expect(useSettingsStore.getState().settings.agents.length).toBe(
        beforeCount,
      );
    });
  });

  // ── MCP CRUD ──

  describe("MCP CRUD", () => {
    it("应能添加和删除 MCP", () => {
      useSettingsStore.getState().addMCP({
        id: "test-mcp",
        name: "测试 MCP",
        type: "manual",
        endpoint: "mcp://test",
        enabled: true,
        projectLevel: false,
      });
      expect(
        useSettingsStore
          .getState()
          .settings.mcpConfigs.find((m) => m.id === "test-mcp"),
      ).toBeDefined();
      useSettingsStore.getState().removeMCP("test-mcp");
      expect(
        useSettingsStore
          .getState()
          .settings.mcpConfigs.find((m) => m.id === "test-mcp"),
      ).toBeUndefined();
    });

    it("应能更新 MCP 启用状态", () => {
      useSettingsStore.getState().addMCP({
        id: "toggle-mcp",
        name: "切换 MCP",
        type: "manual",
        enabled: true,
        projectLevel: false,
      });
      useSettingsStore.getState().updateMCP("toggle-mcp", { enabled: false });
      expect(
        useSettingsStore
          .getState()
          .settings.mcpConfigs.find((m) => m.id === "toggle-mcp")?.enabled,
      ).toBe(false);
    });
  });

  // ── 模型 CRUD ──

  describe("模型 CRUD", () => {
    it("应能添加和删除模型", () => {
      useSettingsStore.getState().addModel({
        id: "test-model",
        provider: "OpenAI",
        model: "gpt-4o",
        apiKey: "sk-test",
        enabled: true,
      });
      expect(
        useSettingsStore
          .getState()
          .settings.models.find((m) => m.id === "test-model"),
      ).toBeDefined();
      useSettingsStore.getState().removeModel("test-model");
      expect(
        useSettingsStore
          .getState()
          .settings.models.find((m) => m.id === "test-model"),
      ).toBeUndefined();
    });

    it("应能更新模型启用状态", () => {
      useSettingsStore.getState().addModel({
        id: "upd-model",
        provider: "DeepSeek",
        model: "deepseek-chat",
        apiKey: "",
        enabled: true,
      });
      useSettingsStore
        .getState()
        .updateModel("upd-model", { enabled: false, apiKey: "new-key" });
      const model = useSettingsStore
        .getState()
        .settings.models.find((m) => m.id === "upd-model");
      expect(model?.enabled).toBe(false);
      expect(model?.apiKey).toBe("new-key");
    });
  });

  // ── 规则 CRUD ──

  describe("规则 CRUD", () => {
    it("应能添加、更新、删除规则", () => {
      useSettingsStore.getState().addRule({
        id: "crud-rule",
        name: "CRUD 规则",
        content: "测试内容",
        scope: "project",
        enabled: true,
      });
      expect(
        useSettingsStore
          .getState()
          .settings.rules.find((r) => r.id === "crud-rule"),
      ).toBeDefined();

      useSettingsStore
        .getState()
        .updateRule("crud-rule", { content: "新内容", scope: "personal" });
      const rule = useSettingsStore
        .getState()
        .settings.rules.find((r) => r.id === "crud-rule");
      expect(rule?.content).toBe("新内容");
      expect(rule?.scope).toBe("personal");

      useSettingsStore.getState().removeRule("crud-rule");
      expect(
        useSettingsStore
          .getState()
          .settings.rules.find((r) => r.id === "crud-rule"),
      ).toBeUndefined();
    });
  });

  // ── 技能 CRUD ──

  describe("技能 CRUD", () => {
    it("应能添加、更新、删除技能", () => {
      useSettingsStore.getState().addSkill({
        id: "crud-skill",
        name: "CRUD 技能",
        content: "技能内容",
        scope: "global",
        enabled: true,
      });
      expect(
        useSettingsStore
          .getState()
          .settings.skills.find((s) => s.id === "crud-skill"),
      ).toBeDefined();

      useSettingsStore.getState().updateSkill("crud-skill", { enabled: false });
      expect(
        useSettingsStore
          .getState()
          .settings.skills.find((s) => s.id === "crud-skill")?.enabled,
      ).toBe(false);

      useSettingsStore.getState().removeSkill("crud-skill");
      expect(
        useSettingsStore
          .getState()
          .settings.skills.find((s) => s.id === "crud-skill"),
      ).toBeUndefined();
    });
  });

  // ── 对话流 + 上下文 设置 ──

  describe("对话流和上下文设置", () => {
    it("应能更新对话流设置", () => {
      useSettingsStore.getState().updateConversationSettings({
        useTodoList: false,
        codeReviewScope: "changed",
        autoRunMCP: true,
        volume: 50,
      });
      const { conversation } = useSettingsStore.getState().settings;
      expect(conversation.useTodoList).toBe(false);
      expect(conversation.codeReviewScope).toBe("changed");
      expect(conversation.autoRunMCP).toBe(true);
      expect(conversation.volume).toBe(50);
    });

    it("应能更新白名单命令", () => {
      useSettingsStore.getState().updateConversationSettings({
        whitelistCommands: ["ls", "cat", "echo", "pwd", "grep"],
      });
      expect(
        useSettingsStore.getState().settings.conversation.whitelistCommands,
      ).toContain("grep");
    });

    it("应能更新上下文忽略规则", () => {
      useSettingsStore.getState().updateContextSettings({
        ignoreRules: ["node_modules", ".git", "dist", "coverage"],
      });
      expect(
        useSettingsStore.getState().settings.context.ignoreRules,
      ).toContain("coverage");
    });

    it("应能更新索引状态", () => {
      useSettingsStore
        .getState()
        .updateContextSettings({ indexStatus: "completed" });
      expect(useSettingsStore.getState().settings.context.indexStatus).toBe(
        "completed",
      );
    });
  });

  // ── 深层搜索功能 ──

  describe("深层搜索功能", () => {
    it("空查询应返回空数组", () => {
      expect(useSettingsStore.getState().searchSettings("")).toHaveLength(0);
      expect(useSettingsStore.getState().searchSettings("   ")).toHaveLength(0);
    });

    it("应能通过标题搜索通用设置", () => {
      const results = useSettingsStore.getState().searchSettings("主题");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.title.includes("主题"))).toBe(true);
    });

    it("应能通过别名搜索通用设置 (dark → 主题)", () => {
      const results = useSettingsStore.getState().searchSettings("dark");
      expect(results.some((r) => r.section === "general")).toBe(true);
    });

    it("应能通过别名搜索 (font → 编辑器字体)", () => {
      const results = useSettingsStore.getState().searchSettings("font");
      expect(results.some((r) => r.title.includes("字体"))).toBe(true);
    });

    it("应能搜索到智能体 (温度 → agents)", () => {
      const results = useSettingsStore.getState().searchSettings("温度");
      expect(results.some((r) => r.type === "agent")).toBe(true);
    });

    it("应能通过英文别名搜索 (temperature → agents)", () => {
      const results = useSettingsStore.getState().searchSettings("temperature");
      expect(results.some((r) => r.type === "agent")).toBe(true);
    });

    it("应能搜索 MCP 端点", () => {
      useSettingsStore.getState().addMCP({
        id: "search-mcp",
        name: "Git MCP",
        type: "manual",
        endpoint: "mcp://git-tools",
        enabled: true,
        projectLevel: false,
      });
      const results = useSettingsStore.getState().searchSettings("git");
      expect(results.some((r) => r.type === "mcp")).toBe(true);
    });

    it("应能搜索对话流设置别名 (沙箱 → conversation)", () => {
      const results = useSettingsStore.getState().searchSettings("沙箱");
      expect(results.some((r) => r.section === "conversation")).toBe(true);
    });

    it("应能搜索上下文相关 (索引)", () => {
      const results = useSettingsStore.getState().searchSettings("索引");
      expect(results.some((r) => r.section === "context")).toBe(true);
    });

    it("应能搜索规则内容", () => {
      const results = useSettingsStore.getState().searchSettings("ESLint");
      expect(results.some((r) => r.type === "rule")).toBe(true);
    });

    it("应能搜索技能内容", () => {
      const results = useSettingsStore.getState().searchSettings("props");
      expect(results.some((r) => r.type === "skill")).toBe(true);
    });

    it("不匹配时应返回空数组", () => {
      expect(
        useSettingsStore.getState().searchSettings("xyznotfound123"),
      ).toHaveLength(0);
    });
  });

  // ── 导入导出 ──

  describe("导入导出", () => {
    it("应能导出完整配置", () => {
      const exported = useSettingsStore.getState().exportConfig();
      expect(exported.userProfile).toBeDefined();
      expect(exported.general).toBeDefined();
      expect(exported.agents).toBeDefined();
      expect(exported.mcpConfigs).toBeDefined();
      expect(exported.models).toBeDefined();
      expect(exported.conversation).toBeDefined();
      expect(exported.rules).toBeDefined();
      expect(exported.skills).toBeDefined();
    });

    it("应能导入配置", () => {
      useSettingsStore.getState().importConfig({
        userProfile: {
          id: "imported",
          username: "导入用户",
          email: "imported@test.com",
        },
      });
      expect(useSettingsStore.getState().settings.userProfile.username).toBe(
        "导入用户",
      );
    });

    it("导入应用默认值填充未提供的字段", () => {
      useSettingsStore.getState().importConfig({
        userProfile: { id: "p", username: "部分", email: "" },
      });
      expect(useSettingsStore.getState().settings.general.theme).toBe("dark");
    });
  });

  // ── 重置设置 ──

  describe("重置设置", () => {
    it("应能重置所有设置为默认值", () => {
      useSettingsStore
        .getState()
        .updateGeneralSettings({ theme: "light", editorFontSize: 20 });
      useSettingsStore.getState().updateUserProfile({ username: "修改后" });
      useSettingsStore.getState().resetSettings();
      const { settings } = useSettingsStore.getState();
      expect(settings.general.theme).toBe("dark");
      expect(settings.general.editorFontSize).toBe(14);
      expect(settings.userProfile.username).toBe("YYC3 Developer");
    });
  });

  // ── 导入设置选项 ──

  describe("导入设置选项", () => {
    it("应能更新 AGENTS.md 和 CLAUDE.md 包含选项", () => {
      useSettingsStore
        .getState()
        .updateImportSettings({ includeAgentsMD: true, includeClaudeMD: true });
      const { importSettings } = useSettingsStore.getState().settings;
      expect(importSettings.includeAgentsMD).toBe(true);
      expect(importSettings.includeClaudeMD).toBe(true);
    });
  });

  // ── 搜索查询状态 ──

  describe("搜索查询状态", () => {
    it("应能设置和清除搜索查询", () => {
      useSettingsStore.getState().setSearchQuery("测试查询");
      expect(useSettingsStore.getState().searchQuery).toBe("测试查询");
      useSettingsStore.getState().setSearchQuery("");
      expect(useSettingsStore.getState().searchQuery).toBe("");
    });
  });
});
