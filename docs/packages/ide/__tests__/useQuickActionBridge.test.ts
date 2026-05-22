/**
 * @file __tests__/useQuickActionBridge.test.ts
 * @description QuickActionBridge Store 单元测试 — 覆盖 dispatch/consume/clear 生命周期、
 *              actionLog 记录与上限、幂等性、buildActionPrompt 提示词构建
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,zustand,quick-actions,bridge
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useQuickActionBridge,
  buildActionPrompt,
  type PendingQuickAction,
} from "../stores/useQuickActionBridge";

// Helper to create a mock PendingQuickAction
function createMockAction(
  overrides?: Partial<PendingQuickAction>,
): PendingQuickAction {
  return {
    id: `qa-${Date.now()}`,
    type: "refactor",
    prompt: "请重构这段代码",
    codeSnippet: "const x = 1",
    language: "typescript",
    filePath: "src/app/App.tsx",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("useQuickActionBridge", () => {
  beforeEach(() => {
    // Reset store state before each test
    useQuickActionBridge.setState({
      pendingAction: null,
      actionLog: [],
    });
  });

  // ── 初始状态 ──

  describe("初始状态", () => {
    it("pendingAction 初始为 null", () => {
      expect(useQuickActionBridge.getState().pendingAction).toBeNull();
    });

    it("actionLog 初始为空数组", () => {
      expect(useQuickActionBridge.getState().actionLog).toEqual([]);
    });
  });

  // ── dispatchToChat ──

  describe("dispatchToChat", () => {
    it("设置 pendingAction", () => {
      const action = createMockAction();
      useQuickActionBridge.getState().dispatchToChat(action);
      expect(useQuickActionBridge.getState().pendingAction).toEqual(action);
    });

    it("记录到 actionLog", () => {
      const action = createMockAction({
        type: "optimize",
        filePath: "test.ts",
      });
      useQuickActionBridge.getState().dispatchToChat(action);
      const log = useQuickActionBridge.getState().actionLog;
      expect(log.length).toBe(1);
      expect(log[0].type).toBe("optimize");
      expect(log[0].filePath).toBe("test.ts");
    });

    it("新 action 覆盖旧的 pendingAction", () => {
      const action1 = createMockAction({ id: "qa-1", type: "refactor" });
      const action2 = createMockAction({ id: "qa-2", type: "explain" });
      const { dispatchToChat } = useQuickActionBridge.getState();
      dispatchToChat(action1);
      dispatchToChat(action2);
      expect(useQuickActionBridge.getState().pendingAction!.id).toBe("qa-2");
    });

    it("actionLog 最新在前（倒序）", () => {
      const { dispatchToChat } = useQuickActionBridge.getState();
      dispatchToChat(createMockAction({ type: "refactor", timestamp: 100 }));
      dispatchToChat(createMockAction({ type: "optimize", timestamp: 200 }));
      const log = useQuickActionBridge.getState().actionLog;
      expect(log[0].type).toBe("optimize");
      expect(log[1].type).toBe("refactor");
    });

    it("actionLog 上限 50 条", () => {
      const { dispatchToChat } = useQuickActionBridge.getState();
      for (let i = 0; i < 60; i++) {
        dispatchToChat(createMockAction({ id: `qa-${i}`, timestamp: i }));
      }
      expect(useQuickActionBridge.getState().actionLog.length).toBe(50);
    });
  });

  // ── consumePending ──

  describe("consumePending", () => {
    it("返回当前 pendingAction 并清空", () => {
      const action = createMockAction();
      useQuickActionBridge.getState().dispatchToChat(action);

      const consumed = useQuickActionBridge.getState().consumePending();
      expect(consumed).toEqual(action);
      expect(useQuickActionBridge.getState().pendingAction).toBeNull();
    });

    it("无 pending 时返回 null", () => {
      const consumed = useQuickActionBridge.getState().consumePending();
      expect(consumed).toBeNull();
    });

    it("幂等性 — 连续调用只有第一次返回值", () => {
      useQuickActionBridge.getState().dispatchToChat(createMockAction());

      const first = useQuickActionBridge.getState().consumePending();
      const second = useQuickActionBridge.getState().consumePending();
      expect(first).not.toBeNull();
      expect(second).toBeNull();
    });

    it("consume 不影响 actionLog", () => {
      useQuickActionBridge.getState().dispatchToChat(createMockAction());
      expect(useQuickActionBridge.getState().actionLog.length).toBe(1);

      useQuickActionBridge.getState().consumePending();
      expect(useQuickActionBridge.getState().actionLog.length).toBe(1);
    });
  });

  // ── clearPending ──

  describe("clearPending", () => {
    it("清空 pendingAction", () => {
      useQuickActionBridge.getState().dispatchToChat(createMockAction());
      useQuickActionBridge.getState().clearPending();
      expect(useQuickActionBridge.getState().pendingAction).toBeNull();
    });

    it("无 pending 时调用不报错", () => {
      expect(() =>
        useQuickActionBridge.getState().clearPending(),
      ).not.toThrow();
    });
  });
});

// ── buildActionPrompt ──

describe("buildActionPrompt", () => {
  const CODE = 'function hello() { return "world" }';
  const LANG = "typescript";
  const FILE = "src/utils.ts";

  it("refactor 类型生成重构提示词", () => {
    const prompt = buildActionPrompt("refactor", CODE, LANG, FILE);
    expect(prompt).toContain("重构");
    expect(prompt).toContain(CODE);
    expect(prompt).toContain(FILE);
    expect(prompt).toContain(LANG);
  });

  it("optimize 类型生成性能优化提示词", () => {
    const prompt = buildActionPrompt("optimize", CODE, LANG, FILE);
    expect(prompt).toContain("性能优化");
    expect(prompt).toContain(CODE);
  });

  it("explain 类型生成解释提示词", () => {
    const prompt = buildActionPrompt("explain", CODE, LANG, FILE);
    expect(prompt).toContain("解释");
    expect(prompt).toContain(CODE);
  });

  it("test-generate 类型生成测试提示词", () => {
    const prompt = buildActionPrompt("test-generate", CODE, LANG, FILE);
    expect(prompt).toContain("Vitest");
    expect(prompt).toContain("测试");
  });

  it("document-generate 类型生成文档提示词", () => {
    const prompt = buildActionPrompt("document-generate", CODE, LANG, FILE);
    expect(prompt).toContain("文档");
    expect(prompt).toContain("JSDoc");
  });

  it("translate 类型生成翻译提示词", () => {
    const prompt = buildActionPrompt("translate", CODE, LANG, FILE);
    expect(prompt).toContain("翻译");
  });

  it("summarize 类型生成摘要提示词", () => {
    const prompt = buildActionPrompt("summarize", CODE, LANG, FILE);
    expect(prompt).toContain("摘要");
  });

  it("未知类型返回默认提示词", () => {
    const prompt = buildActionPrompt("unknown-action" as any, CODE, LANG, FILE);
    expect(prompt).toContain(CODE);
    expect(prompt).toContain(LANG);
  });
});
