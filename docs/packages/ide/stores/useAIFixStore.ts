/**
 * @file stores/useAIFixStore.ts
 * @description 跨面板 AI 修复请求通道 Zustand Store，
 *              ErrorDiagnosticsPanel 写入修复请求 → LeftPanel 消费并触发 LLM 调用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,ai-fix,cross-panel,diagnostics
 */

import { create } from "zustand";

interface AIFixRequest {
  id: string;
  prompt: string;
  filepath: string;
  timestamp: number;
}

interface AIFixStoreState {
  pendingRequest: AIFixRequest | null;
  /** ErrorDiagnosticsPanel 调用: 发起 AI 修复请求 */
  requestFix: (prompt: string, filepath: string) => void;
  /** LeftPanel 调用: 消费并清除请求 */
  consumeRequest: () => AIFixRequest | null;
  /** 清除挂起的请求 */
  clearRequest: () => void;
}

export const useAIFixStore = create<AIFixStoreState>((set, get) => ({
  pendingRequest: null,

  requestFix: (prompt, filepath) =>
    set({
      pendingRequest: {
        id: `fix-${Date.now()}`,
        prompt,
        filepath,
        timestamp: Date.now(),
      },
    }),

  consumeRequest: () => {
    const req = get().pendingRequest;
    if (req) set({ pendingRequest: null });
    return req;
  },

  clearRequest: () => set({ pendingRequest: null }),
}));
