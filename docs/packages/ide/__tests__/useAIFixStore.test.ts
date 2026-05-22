/**
 * @file __tests__/useAIFixStore.test.ts
 * @description AIFixStore 单元测试 — 覆盖 requestFix/consumeRequest/clearRequest
 *              生命周期、幂等性、并发请求覆盖行为
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,zustand,ai-fix,cross-panel
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAIFixStore } from "../stores/useAIFixStore";

describe("useAIFixStore", () => {
  beforeEach(() => {
    useAIFixStore.setState({ pendingRequest: null });
  });

  // ── 初始状态 ──

  describe("初始状态", () => {
    it("pendingRequest 初始为 null", () => {
      expect(useAIFixStore.getState().pendingRequest).toBeNull();
    });
  });

  // ── requestFix ──

  describe("requestFix", () => {
    it("创建修复请求", () => {
      useAIFixStore.getState().requestFix("修复类型错误", "src/App.tsx");
      const req = useAIFixStore.getState().pendingRequest;
      expect(req).not.toBeNull();
      expect(req!.prompt).toBe("修复类型错误");
      expect(req!.filepath).toBe("src/App.tsx");
    });

    it("生成唯一 ID", async () => {
      useAIFixStore.getState().requestFix("fix1", "a.ts");
      const id1 = useAIFixStore.getState().pendingRequest!.id;

      useAIFixStore.setState({ pendingRequest: null });

      // 等待 10ms 确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 10));

      useAIFixStore.getState().requestFix("fix2", "b.ts");
      const id2 = useAIFixStore.getState().pendingRequest!.id;

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^fix-\d+$/);
      expect(id2).toMatch(/^fix-\d+$/);
    });

    it("包含 timestamp", () => {
      const before = Date.now();
      useAIFixStore.getState().requestFix("fix", "test.ts");
      const after = Date.now();
      const ts = useAIFixStore.getState().pendingRequest!.timestamp;
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it("新请求覆盖旧请求", () => {
      useAIFixStore.getState().requestFix("first fix", "a.ts");
      useAIFixStore.getState().requestFix("second fix", "b.ts");
      expect(useAIFixStore.getState().pendingRequest!.prompt).toBe(
        "second fix",
      );
      expect(useAIFixStore.getState().pendingRequest!.filepath).toBe("b.ts");
    });
  });

  // ── consumeRequest ──

  describe("consumeRequest", () => {
    it("返回 pending 请求并清空", () => {
      useAIFixStore.getState().requestFix("修复 bug", "src/component.tsx");
      const consumed = useAIFixStore.getState().consumeRequest();
      expect(consumed).not.toBeNull();
      expect(consumed!.prompt).toBe("修复 bug");
      expect(useAIFixStore.getState().pendingRequest).toBeNull();
    });

    it("无 pending 时返回 null", () => {
      const consumed = useAIFixStore.getState().consumeRequest();
      expect(consumed).toBeNull();
    });

    it("幂等性 — 连续 consume 只有第一次有值", () => {
      useAIFixStore.getState().requestFix("fix", "test.ts");
      const first = useAIFixStore.getState().consumeRequest();
      const second = useAIFixStore.getState().consumeRequest();
      expect(first).not.toBeNull();
      expect(second).toBeNull();
    });

    it("consume 后可以再次 requestFix", () => {
      useAIFixStore.getState().requestFix("fix1", "a.ts");
      useAIFixStore.getState().consumeRequest();
      useAIFixStore.getState().requestFix("fix2", "b.ts");
      expect(useAIFixStore.getState().pendingRequest!.prompt).toBe("fix2");
    });
  });

  // ── clearRequest ──

  describe("clearRequest", () => {
    it("清空 pendingRequest", () => {
      useAIFixStore.getState().requestFix("fix", "test.ts");
      useAIFixStore.getState().clearRequest();
      expect(useAIFixStore.getState().pendingRequest).toBeNull();
    });

    it("无 pending 时调用不报错", () => {
      expect(() => useAIFixStore.getState().clearRequest()).not.toThrow();
    });
  });
});
