/**
 * @file stores/useQuickActionsStore.ts
 * @description 智能一键操作 Zustand Store — 管理代码/文档/文本操作、剪贴板历史、
 *              上下文感知操作、AI 辅助操作，对齐 YYC3-P1-AI-一键操作交互.md 规范
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,quick-actions,clipboard,code-operations
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──

export type ActionType =
  | "copy"
  | "copy-markdown"
  | "copy-html"
  | "replace"
  | "refactor"
  | "optimize"
  | "format"
  | "convert"
  | "summarize"
  | "translate"
  | "rewrite"
  | "explain"
  | "test-generate"
  | "document-generate";

export type ActionTarget = "code" | "text" | "document" | "file";

export type ActionStatus = "idle" | "processing" | "success" | "error";

export interface QuickAction {
  id: string;
  type: ActionType;
  target: ActionTarget;
  title: string;
  description?: string;
  icon: string;
  shortcut?: string;
  requiresAI: boolean;
  isAvailable: boolean;
}

export interface ActionContext {
  selection: {
    text: string;
    startLine?: number;
    endLine?: number;
    startColumn?: number;
    endColumn?: number;
  };
  file?: {
    path: string;
    name: string;
    language: string;
    content: string;
  };
  editor?: {
    cursorPosition: { line: number; column: number };
    selectionRange?: { start: number; end: number };
  };
  project?: {
    path: string;
    name: string;
  };
}

export interface ActionResult {
  actionId: string;
  type: ActionType;
  status: ActionStatus;
  output?: string;
  error?: string;
  duration?: number;
  timestamp: number;
}

export interface ClipboardHistoryItem {
  id: string;
  content: string;
  type: "text" | "code" | "image";
  copiedAt: number;
  sourceFile?: string;
  language?: string;
  size: number;
}

// ── Store ──

interface QuickActionsState {
  // 操作上下文
  currentContext: ActionContext | null;
  // 当前执行状态
  activeActionId: string | null;
  actionStatus: ActionStatus;
  // 操作历史
  actionHistory: ActionResult[];
  // 剪贴板历史
  clipboardHistory: ClipboardHistoryItem[];
  // 快速操作面板显示
  showQuickBar: boolean;
  // 最近使用的操作
  recentActions: ActionType[];
}

interface QuickActionsActions {
  // 上下文
  setContext: (ctx: ActionContext | null) => void;
  // 操作执行
  startAction: (actionId: string) => void;
  completeAction: (result: ActionResult) => void;
  failAction: (actionId: string, error: string) => void;
  // 剪贴板
  addToClipboard: (
    item: Omit<ClipboardHistoryItem, "id" | "copiedAt" | "size">,
  ) => void;
  clearClipboard: () => void;
  removeClipboardItem: (id: string) => void;
  // 面板
  toggleQuickBar: () => void;
  setShowQuickBar: (show: boolean) => void;
  // 最近操作
  trackRecentAction: (type: ActionType) => void;
  // 清理
  clearHistory: () => void;
}

const MAX_CLIPBOARD_ITEMS = 50;
const MAX_HISTORY_ITEMS = 100;
const MAX_RECENT_ACTIONS = 10;

export const useQuickActionsStore = create<
  QuickActionsState & QuickActionsActions
>()(
  persist(
    (set, get) => ({
      // ── State ──
      currentContext: null,
      activeActionId: null,
      actionStatus: "idle",
      actionHistory: [],
      clipboardHistory: [],
      showQuickBar: false,
      recentActions: [],

      // ── Actions ──

      setContext: (ctx) => set({ currentContext: ctx }),

      startAction: (actionId) =>
        set({
          activeActionId: actionId,
          actionStatus: "processing",
        }),

      completeAction: (result) =>
        set((state) => ({
          activeActionId: null,
          actionStatus: "idle",
          actionHistory: [result, ...state.actionHistory].slice(
            0,
            MAX_HISTORY_ITEMS,
          ),
        })),

      failAction: (actionId, error) =>
        set((state) => ({
          activeActionId: null,
          actionStatus: "idle",
          actionHistory: [
            {
              actionId,
              type: "copy" as ActionType,
              status: "error" as ActionStatus,
              error,
              timestamp: Date.now(),
            },
            ...state.actionHistory,
          ].slice(0, MAX_HISTORY_ITEMS),
        })),

      addToClipboard: (item) =>
        set((state) => ({
          clipboardHistory: [
            {
              ...item,
              id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              copiedAt: Date.now(),
              size: item.content.length,
            },
            ...state.clipboardHistory,
          ].slice(0, MAX_CLIPBOARD_ITEMS),
        })),

      clearClipboard: () => set({ clipboardHistory: [] }),

      removeClipboardItem: (id) =>
        set((state) => ({
          clipboardHistory: state.clipboardHistory.filter((c) => c.id !== id),
        })),

      toggleQuickBar: () =>
        set((state) => ({ showQuickBar: !state.showQuickBar })),

      setShowQuickBar: (show) => set({ showQuickBar: show }),

      trackRecentAction: (type) =>
        set((state) => {
          const filtered = state.recentActions.filter((a) => a !== type);
          return {
            recentActions: [type, ...filtered].slice(0, MAX_RECENT_ACTIONS),
          };
        }),

      clearHistory: () => set({ actionHistory: [], clipboardHistory: [] }),
    }),
    {
      name: "yyc3-quick-actions",
      partialize: (state) => ({
        clipboardHistory: state.clipboardHistory,
        recentActions: state.recentActions,
      }),
    },
  ),
);

// ── Action Definitions ──

export const QUICK_ACTIONS: QuickAction[] = [
  // 代码操作
  {
    id: "copy-code",
    type: "copy",
    target: "code",
    title: "复制代码",
    icon: "Copy",
    requiresAI: false,
    isAvailable: true,
  },
  {
    id: "copy-markdown",
    type: "copy-markdown",
    target: "code",
    title: "复制为 Markdown",
    icon: "FileText",
    requiresAI: false,
    isAvailable: true,
  },
  {
    id: "copy-html",
    type: "copy-html",
    target: "code",
    title: "复制为 HTML",
    icon: "Code2",
    requiresAI: false,
    isAvailable: true,
  },
  {
    id: "format-code",
    type: "format",
    target: "code",
    title: "格式化代码",
    icon: "AlignLeft",
    shortcut: "Ctrl+Shift+I",
    requiresAI: false,
    isAvailable: true,
  },
  {
    id: "refactor-code",
    type: "refactor",
    target: "code",
    title: "AI 重构",
    icon: "RefreshCw",
    requiresAI: true,
    isAvailable: true,
  },
  {
    id: "optimize-code",
    type: "optimize",
    target: "code",
    title: "AI 优化",
    icon: "Zap",
    requiresAI: true,
    isAvailable: true,
  },
  {
    id: "explain-code",
    type: "explain",
    target: "code",
    title: "AI 解释",
    icon: "MessageSquare",
    requiresAI: true,
    isAvailable: true,
  },
  {
    id: "test-generate",
    type: "test-generate",
    target: "code",
    title: "生成测试",
    icon: "FlaskConical",
    requiresAI: true,
    isAvailable: true,
  },
  {
    id: "doc-generate",
    type: "document-generate",
    target: "code",
    title: "生成文档",
    icon: "BookOpen",
    requiresAI: true,
    isAvailable: true,
  },

  // 文本操作
  {
    id: "translate-text",
    type: "translate",
    target: "text",
    title: "AI 翻译",
    icon: "Languages",
    requiresAI: true,
    isAvailable: true,
  },
  {
    id: "rewrite-text",
    type: "rewrite",
    target: "text",
    title: "AI 改写",
    icon: "PenTool",
    requiresAI: true,
    isAvailable: true,
  },
  {
    id: "summarize-text",
    type: "summarize",
    target: "text",
    title: "AI 摘要",
    icon: "ListCollapse",
    requiresAI: true,
    isAvailable: true,
  },

  // 文档操作
  {
    id: "format-doc",
    type: "format",
    target: "document",
    title: "格式化文档",
    icon: "FileCheck",
    requiresAI: false,
    isAvailable: true,
  },
  {
    id: "convert-doc",
    type: "convert",
    target: "document",
    title: "格式转换",
    icon: "ArrowRightLeft",
    requiresAI: true,
    isAvailable: true,
  },
];
