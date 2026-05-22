/**
 * @file stores/useQuickActionBridge.ts
 * @description QuickActions → LeftPanel 对话桥接 Store — 将一键操作（AI 重构/优化/解释等）
 *              转化为预构建的 AI 提示词，注入 LeftPanel 对话流，实现选中代码一键 AI 处理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,quick-actions,bridge,ai-chat
 */

import { create } from "zustand";
import type { ActionType } from "./useQuickActionsStore";

// ── Pending Action ──

export interface PendingQuickAction {
  id: string;
  type: ActionType;
  prompt: string;
  codeSnippet: string;
  language: string;
  filePath: string;
  timestamp: number;
}

interface QuickActionBridgeState {
  /** 待处理的 AI 操作（LeftPanel 消费后清空） */
  pendingAction: PendingQuickAction | null;
  /** 操作历史 */
  actionLog: Array<{ type: ActionType; filePath: string; timestamp: number }>;
}

interface QuickActionBridgeActions {
  /** 派发一个 AI 操作到 LeftPanel */
  dispatchToChat: (action: PendingQuickAction) => void;
  /** LeftPanel 消费后清空 */
  consumePending: () => PendingQuickAction | null;
  /** 清空 */
  clearPending: () => void;
}

export const useQuickActionBridge = create<
  QuickActionBridgeState & QuickActionBridgeActions
>()((set, get) => ({
  pendingAction: null,
  actionLog: [],

  dispatchToChat: (action) => {
    set({
      pendingAction: action,
      actionLog: [
        {
          type: action.type,
          filePath: action.filePath,
          timestamp: action.timestamp,
        },
        ...get().actionLog,
      ].slice(0, 50),
    });
  },

  consumePending: () => {
    const pending = get().pendingAction;
    if (pending) set({ pendingAction: null });
    return pending;
  },

  clearPending: () => set({ pendingAction: null }),
}));

// ── Prompt Builders ──

const ACTION_PROMPTS: Record<
  string,
  (code: string, lang: string, file: string) => string
> = {
  refactor: (code, lang, file) =>
    `请对以下 ${lang} 代码进行重构优化，提升代码质量、可读性和可维护性：\n\n文件：${file}\n\`\`\`${lang}\n${code}\n\`\`\`\n\n请保持功能不变，输出重构后的完整代码，并简要说明改进点。`,

  optimize: (code, lang, file) =>
    `请对以下 ${lang} 代码进行性能优化：\n\n文件：${file}\n\`\`\`${lang}\n${code}\n\`\`\`\n\n请分析性能瓶颈，输出优化后的代码，并说明优化策略。`,

  explain: (code, lang, file) =>
    `请详细解释以下 ${lang} 代码的功能和逻辑：\n\n文件：${file}\n\`\`\`${lang}\n${code}\n\`\`\`\n\n请逐段说明代码作用、关键逻辑、设计模式和潜在问题。`,

  "test-generate": (code, lang, file) =>
    `请为以下 ${lang} 代码生成全面的 Vitest 单元测试：\n\n文件：${file}\n\`\`\`${lang}\n${code}\n\`\`\`\n\n请生成覆盖正常路径、边界情况和异常处理的测试用例。`,

  "document-generate": (code, lang, file) =>
    `请为以下 ${lang} 代码生成详细的文档注释（JSDoc/TSDoc）：\n\n文件：${file}\n\`\`\`${lang}\n${code}\n\`\`\`\n\n请为每个函数/类/接口添加完整的文档注释。`,

  translate: (code, lang, file) =>
    `请将以下文本翻译为中英双语对照：\n\n来源：${file}\n\`\`\`\n${code}\n\`\`\`\n\n请保留代码/技术术语不翻译，输出双语对照版本。`,

  rewrite: (code, lang, file) =>
    `请改写以下文本，使其更清晰专业：\n\n来源：${file}\n\`\`\`\n${code}\n\`\`\`\n\n请改善表达、修正语法、提升可读性。`,

  summarize: (code, lang, file) =>
    `请对以下内容生成简明摘要：\n\n来源：${file}\n\`\`\`\n${code}\n\`\`\`\n\n请提炼核心要点，按重要性排列，不超过 5 个要点。`,

  replace: (code, lang, file) =>
    `请根据最佳实践替换以下 ${lang} 代码：\n\n文件：${file}\n\`\`\`${lang}\n${code}\n\`\`\`\n\n请输出替换后的完整代码。`,

  format: (code, lang, file) =>
    `请格式化以下 ${lang} 代码，使其符合团队规范：\n\n文件：${file}\n\`\`\`${lang}\n${code}\n\`\`\`\n\n请输出格式化后的代码。`,

  convert: (code, _lang, file) =>
    `请将以下文档转换为 Markdown 格式：\n\n来源：${file}\n\`\`\`\n${code}\n\`\`\`\n\n请保持内容结构不变。`,
};

/**
 * 构建 AI 操作提示词
 */
export function buildActionPrompt(
  actionType: ActionType,
  code: string,
  language: string,
  filePath: string,
): string {
  const builder = ACTION_PROMPTS[actionType];
  if (builder) return builder(code, language, filePath);
  return `请处理以下 ${language} 代码：\n\`\`\`${language}\n${code}\n\`\`\``;
}
