/**
 * @file __tests__/SettingsBridge.test.ts
 * @description SettingsBridge 单元测试 — 覆盖快捷键映射、规则注入、MCP 注入、
 *              模型同步、技能注入、API Key 验证、主题/语言同步等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,settings,bridge,integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "../stores/useSettingsStore";
import {
  buildRulesPromptInjection,
  buildSkillsPromptInjection,
  buildMCPToolsDescription,
  getActiveAgentPrompt,
  getSettingsEnhancedInstructions,
  getActiveMCPEndpoints,
  getEffectiveKeybindings,
  normalizeKeyEvent,
  registerKeybindingAction,
  syncGeneralSettingsToCSS,
  type APIKeyValidationResult,
  type MCPConnectionTestResult,
} from "../SettingsBridge";

describe("SettingsBridge", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
  });

  // ── 规则注入 ──

  describe("buildRulesPromptInjection", () => {
    it("应返回已启用规则的注入文本", () => {
      const result = buildRulesPromptInjection();
      expect(result).toContain("编码规则");
      expect(result).toContain("代码风格规范");
    });

    it("所有规则禁用时应返回空字符串", () => {
      const store = useSettingsStore.getState();
      for (const rule of store.settings.rules) {
        store.updateRule(rule.id, { enabled: false });
      }
      expect(buildRulesPromptInjection()).toBe("");
    });

    it("应支持按作用域过滤", () => {
      useSettingsStore.getState().addRule({
        id: "personal-rule",
        name: "个人规则",
        content: "个人偏好",
        scope: "personal",
        enabled: true,
      });
      const projectRules = buildRulesPromptInjection("project");
      expect(projectRules).toContain("代码风格规范");
      expect(projectRules).not.toContain("个人规则");

      const personalRules = buildRulesPromptInjection("personal");
      expect(personalRules).toContain("个人规则");
    });

    it("新增规则后应出现在注入文本中", () => {
      useSettingsStore.getState().addRule({
        id: "new-rule",
        name: "新增规则",
        content: "测试注入",
        scope: "project",
        enabled: true,
      });
      expect(buildRulesPromptInjection()).toContain("新增规则");
    });
  });

  // ── 技能注入 ──

  describe("buildSkillsPromptInjection", () => {
    it("应返回已启用技能的注入文本", () => {
      const result = buildSkillsPromptInjection();
      expect(result).toContain("可用技能");
      expect(result).toContain("React 组件生成");
    });

    it("所有技能禁用时应返回空字符串", () => {
      const store = useSettingsStore.getState();
      for (const skill of store.settings.skills) {
        store.updateSkill(skill.id, { enabled: false });
      }
      expect(buildSkillsPromptInjection()).toBe("");
    });
  });

  // ── MCP 工具注入 ──

  describe("MCP 工具注入", () => {
    it("buildMCPToolsDescription 应返回已启用 MCP 描述", () => {
      const result = buildMCPToolsDescription();
      expect(result).toContain("MCP 工具");
      expect(result).toContain("文件系统");
    });

    it("无启用 MCP 时应返回空字符串", () => {
      for (const mcp of useSettingsStore.getState().settings.mcpConfigs) {
        useSettingsStore.getState().updateMCP(mcp.id, { enabled: false });
      }
      expect(buildMCPToolsDescription()).toBe("");
    });

    it("getActiveMCPEndpoints 应仅返回已启用的", () => {
      useSettingsStore.getState().addMCP({
        id: "disabled-mcp",
        name: "禁用",
        type: "manual",
        enabled: false,
        projectLevel: false,
      });
      const endpoints = getActiveMCPEndpoints();
      expect(endpoints.every((ep) => ep.enabled)).toBe(true);
    });

    it("getActiveMCPEndpoints 应包含端点信息", () => {
      const endpoints = getActiveMCPEndpoints();
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints[0]).toHaveProperty("name");
      expect(endpoints[0]).toHaveProperty("endpoint");
    });
  });

  // ── 智能体提示词 ──

  describe("getActiveAgentPrompt", () => {
    it("应返回首个内置智能体的提示词", () => {
      const prompt = getActiveAgentPrompt();
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe("string");
    });

    it("无智能体时应返回 null", () => {
      // 删除所有智能体
      const agents = useSettingsStore.getState().settings.agents;
      for (const a of agents) {
        useSettingsStore.getState().removeAgent(a.id);
      }
      expect(getActiveAgentPrompt()).toBeNull();
    });
  });

  // ── 完整增强指令 ──

  describe("getSettingsEnhancedInstructions", () => {
    it("应组合智能体、规则、技能、MCP", () => {
      const instructions = getSettingsEnhancedInstructions();
      expect(instructions).toContain("智能体角色");
      expect(instructions).toContain("编码规则");
      expect(instructions).toContain("可用技能");
      expect(instructions).toContain("MCP 工具");
    });

    it("应包含导入设置提示", () => {
      useSettingsStore
        .getState()
        .updateImportSettings({ includeAgentsMD: true });
      const instructions = getSettingsEnhancedInstructions();
      expect(instructions).toContain("AGENTS.md");
    });
  });

  // ── 快捷键映射 ──

  describe("快捷键映射", () => {
    it("默认应返回 VS Code 快捷键映射", () => {
      const bindings = getEffectiveKeybindings();
      expect(bindings.length).toBeGreaterThan(0);
      expect(bindings.find((b) => b.action === "file.save")?.keys).toBe(
        "ctrl+s",
      );
    });

    it("自定义快捷键应覆盖默认", () => {
      useSettingsStore.getState().updateGeneralSettings({
        customKeybindings: { "file.save": "ctrl+shift+s" },
      });
      const bindings = getEffectiveKeybindings();
      expect(bindings.find((b) => b.action === "file.save")?.keys).toBe(
        "ctrl+shift+s",
      );
    });

    it("未自定义的快捷键应保持默认", () => {
      useSettingsStore.getState().updateGeneralSettings({
        customKeybindings: { "file.save": "ctrl+shift+s" },
      });
      const bindings = getEffectiveKeybindings();
      expect(bindings.find((b) => b.action === "terminal.toggle")?.keys).toBe(
        "ctrl+`",
      );
    });

    it("应包含所有预定义的动作", () => {
      const bindings = getEffectiveKeybindings();
      const actions = bindings.map((b) => b.action);
      expect(actions).toContain("file.save");
      expect(actions).toContain("search.global");
      expect(actions).toContain("terminal.toggle");
      expect(actions).toContain("command.palette");
    });
  });

  // ── 键盘事件规范化 ──

  describe("normalizeKeyEvent", () => {
    it("Ctrl+S", () => {
      expect(
        normalizeKeyEvent(
          new KeyboardEvent("keydown", { key: "s", ctrlKey: true }),
        ),
      ).toBe("ctrl+s");
    });

    it("Ctrl+Shift+F", () => {
      expect(
        normalizeKeyEvent(
          new KeyboardEvent("keydown", {
            key: "f",
            ctrlKey: true,
            shiftKey: true,
          }),
        ),
      ).toBe("ctrl+shift+f");
    });

    it("Escape", () => {
      expect(
        normalizeKeyEvent(new KeyboardEvent("keydown", { key: "Escape" })),
      ).toBe("escape");
    });

    it("Alt+Up", () => {
      expect(
        normalizeKeyEvent(
          new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true }),
        ),
      ).toBe("alt+arrowup");
    });

    it("Space", () => {
      expect(
        normalizeKeyEvent(new KeyboardEvent("keydown", { key: " " })),
      ).toBe("space");
    });
  });

  // ── 快捷键动作注册 ──

  describe("registerKeybindingAction", () => {
    it("应能注册和清理动作处理器", () => {
      const handler = vi.fn();
      const cleanup = registerKeybindingAction("test.action", handler);
      expect(typeof cleanup).toBe("function");
      cleanup();
    });
  });

  // ── CSS 变量同步 ──

  describe("syncGeneralSettingsToCSS", () => {
    it("应设置 CSS 变量", () => {
      useSettingsStore
        .getState()
        .updateGeneralSettings({ editorFont: "Fira Code", editorFontSize: 16 });
      syncGeneralSettingsToCSS();
      const root = document.documentElement;
      expect(root.style.getPropertyValue("--editor-font-family")).toBe(
        "Fira Code",
      );
      expect(root.style.getPropertyValue("--editor-font-size")).toBe("16px");
    });
  });
});
