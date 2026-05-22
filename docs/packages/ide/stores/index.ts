/**
 * @file stores/index.ts
 * @description Zustand Store Hub — 统一导出所有 Zustand stores，
 *              包括文件管理、模型注册、代理、AI 修复、预览、滚动同步等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.3.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,hub,exports,wave3
 */

// ================================================================
// Zustand Store Hub — 统一导出所有 Zustand stores
// ================================================================
// 迁移策略说明：
//   现阶段 Zustand stores 与原有 Context providers 并存：
//   - 原有 FileStoreProvider / ModelRegistryProvider 保持不变，确保向后兼容
//   - Zustand stores 可被新组件直接使用，无需 Provider 嵌套
//   - 逐步迁移：新功能优先使用 Zustand，旧组件在重构时切换
//
// 使用方式：
//   import { useFileStoreZustand } from './stores'
//   const fileContents = useFileStoreZustand(state => state.fileContents)
//
// 对比原有 Context：
//   import { useFileStore } from './FileStore'
//   const { fileContents } = useFileStore()
//
// Zustand 的优势：
//   1. 无需 Provider 嵌套，任何组件可直接使用
//   2. 精细化 selector，减少不必要的重渲染
//   3. Immer 支持直接 mutation 写法，代码更简洁
//   4. 内置 persist 中间件，自动 localStorage 持久化
//   5. 可在 React 组件外部访问（如 LLMService.ts）
// ================================================================

export {
  useFileStoreZustand,
  selectFileContents,
  selectOpenTabs,
  selectActiveFile,
  selectGitBranch,
  selectGitChanges,
  selectGitLog,
} from "./useFileStoreZustand";

export type { OpenTab, GitChange, GitLogEntry } from "./useFileStoreZustand";

export {
  useModelStoreZustand,
  selectActiveModelId,
  selectCustomModels,
  selectConnectivityResults,
  selectHeartbeatEnabled,
  selectHeartbeatIntervalMs,
  selectLatencyHistory,
  selectOllamaStatus,
  selectShowSettings,
} from "./useModelStoreZustand";

export type {
  ModelType,
  ModelStatus,
  ConnectivityResult,
  LatencyRecord,
  AIModel,
  PerfDataPoint,
} from "./useModelStoreZustand";

export { useProxyStoreZustand } from "./useProxyStoreZustand";

export { useAIFixStore } from "./useAIFixStore";

export { usePreviewStore, DEVICE_PRESETS } from "./usePreviewStore";

export type {
  PreviewMode,
  DeviceType,
  DevicePreset,
  PreviewSnapshot,
  ConsoleEntry,
  PreviewError,
  PreviewEngineType,
} from "./usePreviewStore";

export { useScrollSyncStore } from "./useScrollSyncStore";

export { usePanelTabGroupStore } from "./usePanelTabGroupStore";

export type { TabGroup } from "./usePanelTabGroupStore";

export { usePanelPinStore } from "./usePanelPinStore";

export { useFloatingPanelStore } from "./useFloatingPanelStore";

export type { FloatingPanelConfig } from "./useFloatingPanelStore";

export { usePreviewHistoryStore } from "./usePreviewHistoryStore";

export type {
  PreviewSnapshot as PreviewHistorySnapshot,
  SnapshotDiff,
  SnapshotFileChange,
} from "./usePreviewHistoryStore";

export { useSettingsStore } from "./useSettingsStore";

export type {
  Settings,
  UserProfile,
  GeneralSettings,
  AgentConfig,
  MCPConfig,
  ModelConfig,
  ContextSettings,
  ConversationSettings,
  RuleConfig,
  SkillConfig,
  ImportSettings,
  DocumentSet,
  SearchResult,
} from "./useSettingsStore";

export { useQuickActionsStore, QUICK_ACTIONS } from "./useQuickActionsStore";

export type {
  ActionType,
  ActionTarget,
  ActionStatus,
  QuickAction,
  ActionContext,
  ActionResult,
  ClipboardHistoryItem,
} from "./useQuickActionsStore";

export {
  useTaskBoardStore,
  KANBAN_COLUMNS,
  PRIORITY_COLORS,
  TYPE_ICONS,
} from "./useTaskBoardStore";

export type {
  Task,
  SubTask,
  TaskStatus,
  TaskPriority,
  TaskType,
  Reminder,
  ReminderType,
  TaskInference,
  BoardView,
  SortField,
  TaskFilters,
} from "./useTaskBoardStore";

export {
  useQuickActionBridge,
  buildActionPrompt,
} from "./useQuickActionBridge";

export type { PendingQuickAction } from "./useQuickActionBridge";

// ── P2: Multi-Instance Stores ──
export { useWindowStore } from "./useWindowStore";

export { useWorkspaceStore } from "./useWorkspaceStore";

export { useSessionStore } from "./useSessionStore";

export { useIPCStore } from "./useIPCStore";
