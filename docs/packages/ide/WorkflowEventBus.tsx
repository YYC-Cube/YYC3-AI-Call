/**
 * @file WorkflowEventBus.tsx
 * @description 跨面板工作流事件总线，IDE 各操作面板发射事件，
 *              WorkflowPipeline 订阅并驱动阶段状态，支持 50+ 事件类型
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.3.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags event-bus,workflow,cross-panel,communication
 */

import React, { createContext, useContext, useCallback, useRef } from "react";

// ===================================================================
//  Workflow Event Bus — 跨面板事件通信
//  IDE 各操作面板发射事件 → WorkflowPipeline 订阅并驱动阶段状态
// ===================================================================

export type WorkflowEventType =
  // Design Input Loop
  | "user-input" // 用户输入需求
  | "multimodal-parse" // 多模态解析
  | "intent-analyzed" // 意图识别完成
  | "design-generated" // 设计数据生成
  | "preview-updated" // 预览刷新
  | "user-confirmed" // 用户确认
  // Code Generation Loop
  | "design-read" // 读取设计数据
  | "template-matched" // 模板匹配
  | "data-transformed" // 数据转换
  | "code-generated" // 代码生成完成
  | "code-applied" // 代码应用到文件
  | "type-checked" // 类型检查
  | "file-written" // 文件写入
  | "compile-run" // 编译运行
  | "error-feedback" // 错误反馈
  // Preview Loop
  | "change-detected" // 变更检测
  | "diff-computed" // 差异计算
  | "patch-applied" // 增量更新
  | "recompiled" // 重新编译
  | "preview-refreshed" // 预览刷新
  | "user-interaction" // 用户交互
  | "design-adjusted" // 设计调整
  // AI Assist Loop
  | "ai-triggered" // AI 触发
  | "context-collected" // 上下文收集
  | "ai-understood" // AI 理解
  | "suggestions-ready" // 建议生成
  | "suggestions-shown" // 建议展示
  | "user-decided" // 用户选择
  | "suggestion-applied" // 建议应用
  | "effect-feedback" // 效果反馈
  // Collab Loop
  | "user-operation" // 用户操作
  | "ot-transformed" // OT 转换
  | "crdt-updated" // CRDT 更新
  | "state-synced" // 状态同步
  | "conflict-resolved" // 冲突解决
  | "views-updated" // 视图更新
  // Generic
  | "file-saved" // 文件保存
  | "file-created" // 文件创建
  | "file-deleted" // 文件删除
  | "terminal-command" // 终端命令
  | "git-operation" // Git 操作
  | "model-switched" // 模型切换
  | "connectivity-ping" // 连通性 Ping
  // Diagnostics
  | "diagnostics-run" // 诊断分析执行
  | "diagnostics-found" // 诊断发现问题
  | "diagnostics-fixed"; // 诊断修复完成

export interface WorkflowEvent {
  type: WorkflowEventType;
  timestamp: number;
  detail?: string;
  workflowId?: string; // target workflow loop
  stageId?: string; // target stage
  data?: Record<string, any>;
}

type EventHandler = (event: WorkflowEvent) => void;

interface WorkflowEventBusContextType {
  emit: (event: Omit<WorkflowEvent, "timestamp">) => void;
  subscribe: (handler: EventHandler) => () => void;
  lastEvent: WorkflowEvent | null;
}

const WorkflowEventBusContext =
  createContext<WorkflowEventBusContextType | null>(null);

export function useWorkflowEventBus() {
  const ctx = useContext(WorkflowEventBusContext);
  if (!ctx) {
    // Return a no-op bus if outside provider (e.g. HomePage)
    return {
      emit: () => {},
      subscribe: () => () => {},
      lastEvent: null,
    };
  }
  return ctx;
}

export function WorkflowEventBusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const handlersRef = useRef<Set<EventHandler>>(new Set());
  const lastEventRef = useRef<WorkflowEvent | null>(null);

  const emit = useCallback((event: Omit<WorkflowEvent, "timestamp">) => {
    const full: WorkflowEvent = { ...event, timestamp: Date.now() };
    lastEventRef.current = full;
    handlersRef.current.forEach((handler) => {
      try {
        handler(full);
      } catch {}
    });
  }, []);

  const subscribe = useCallback((handler: EventHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const ctx: WorkflowEventBusContextType = {
    emit,
    subscribe,
    lastEvent: lastEventRef.current,
  };

  return (
    <WorkflowEventBusContext.Provider value={ctx}>
      {children}
    </WorkflowEventBusContext.Provider>
  );
}

// ===================================================================
//  Event → Workflow Stage Mapping
//  Maps IDE events to the workflow loop stage they should activate
// ===================================================================

export const EVENT_STAGE_MAP: Record<
  WorkflowEventType,
  { workflowId: string; stageId: string }
> = {
  // Design Input Loop
  "user-input": { workflowId: "design-input", stageId: "di-1" },
  "multimodal-parse": { workflowId: "design-input", stageId: "di-2" },
  "intent-analyzed": { workflowId: "design-input", stageId: "di-3" },
  "design-generated": { workflowId: "design-input", stageId: "di-4" },
  "preview-updated": { workflowId: "design-input", stageId: "di-5" },
  "user-confirmed": { workflowId: "design-input", stageId: "di-6" },
  // Code Generation Loop
  "design-read": { workflowId: "code-gen", stageId: "cg-1" },
  "template-matched": { workflowId: "code-gen", stageId: "cg-2" },
  "data-transformed": { workflowId: "code-gen", stageId: "cg-3" },
  "code-generated": { workflowId: "code-gen", stageId: "cg-4" },
  "code-applied": { workflowId: "code-gen", stageId: "cg-5" },
  "type-checked": { workflowId: "code-gen", stageId: "cg-6" },
  "file-written": { workflowId: "code-gen", stageId: "cg-7" },
  "compile-run": { workflowId: "code-gen", stageId: "cg-8" },
  "error-feedback": { workflowId: "code-gen", stageId: "cg-9" },
  // Preview Loop
  "change-detected": { workflowId: "preview", stageId: "pv-1" },
  "diff-computed": { workflowId: "preview", stageId: "pv-2" },
  "patch-applied": { workflowId: "preview", stageId: "pv-3" },
  recompiled: { workflowId: "preview", stageId: "pv-4" },
  "preview-refreshed": { workflowId: "preview", stageId: "pv-5" },
  "user-interaction": { workflowId: "preview", stageId: "pv-6" },
  "design-adjusted": { workflowId: "preview", stageId: "pv-7" },
  // AI Assist Loop
  "ai-triggered": { workflowId: "ai-assist", stageId: "ai-1" },
  "context-collected": { workflowId: "ai-assist", stageId: "ai-2" },
  "ai-understood": { workflowId: "ai-assist", stageId: "ai-3" },
  "suggestions-ready": { workflowId: "ai-assist", stageId: "ai-4" },
  "suggestions-shown": { workflowId: "ai-assist", stageId: "ai-5" },
  "user-decided": { workflowId: "ai-assist", stageId: "ai-6" },
  "suggestion-applied": { workflowId: "ai-assist", stageId: "ai-7" },
  "effect-feedback": { workflowId: "ai-assist", stageId: "ai-8" },
  // Collab Loop
  "user-operation": { workflowId: "collab", stageId: "co-1" },
  "ot-transformed": { workflowId: "collab", stageId: "co-2" },
  "crdt-updated": { workflowId: "collab", stageId: "co-3" },
  "state-synced": { workflowId: "collab", stageId: "co-4" },
  "conflict-resolved": { workflowId: "collab", stageId: "co-5" },
  "views-updated": { workflowId: "collab", stageId: "co-6" },
  // Generic → mapped to most relevant workflow
  "file-saved": { workflowId: "code-gen", stageId: "cg-7" },
  "file-created": { workflowId: "code-gen", stageId: "cg-7" },
  "file-deleted": { workflowId: "code-gen", stageId: "cg-7" },
  "terminal-command": { workflowId: "code-gen", stageId: "cg-8" },
  "git-operation": { workflowId: "collab", stageId: "co-1" },
  "model-switched": { workflowId: "ai-assist", stageId: "ai-1" },
  "connectivity-ping": { workflowId: "ai-assist", stageId: "ai-1" },
  // Diagnostics
  "diagnostics-run": { workflowId: "code-gen", stageId: "cg-8" },
  "diagnostics-found": { workflowId: "code-gen", stageId: "cg-8" },
  "diagnostics-fixed": { workflowId: "code-gen", stageId: "cg-8" },
};
