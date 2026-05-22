/**
 * @file stores/optimizedHooks.ts
 * @description Zustand Store 优化 Hooks，提供细粒度订阅，减少重渲染
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,hooks,performance,optimization
 */

import { useCallback, useMemo } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import {
  useFileStoreZustand,
  selectFileContents,
  selectOpenTabs,
  selectActiveFile,
  selectGitBranch,
  selectGitChanges,
  selectGitLog,
  type FileStoreState,
} from "./useFileStoreZustand";
import {
  useSettingsStore,
  type Settings,
  type GeneralSettings,
  type AgentConfig,
  type MCPConfig,
  type ModelConfig,
  type ContextSettings,
  type ConversationSettings,
  type RuleConfig,
  type SkillConfig,
} from "./useSettingsStore";
import {
  useModelStoreZustand,
  selectActiveModelId,
  selectCustomModels,
  selectConnectivityResults,
  selectHeartbeatEnabled,
  selectLatencyHistory,
  type ModelStoreState,
  type AIModel,
} from "./useModelStoreZustand";
import {
  useTaskBoardStore,
  type Task,
  type Reminder,
  type TaskFilters,
  type TaskBoardState,
} from "./useTaskBoardStore";

// ===== File Store 优化 Hooks =====

/**
 * 仅订阅单个文件内容，避免订阅整个 fileContents
 */
export function useFileContent(path: string) {
  return useStore(
    useFileStoreZustand,
    useCallback(
      (state: FileStoreState) => state.fileContents[path],
      [path],
    ),
  );
}

/**
 * 仅订阅当前激活文件路径
 */
export function useActiveFilePath() {
  return useStore(useFileStoreZustand, selectActiveFile);
}

/**
 * 仅订阅打开的标签页列表（带 shallow 比较）
 */
export function useOpenTabs() {
  const tabs = useStore(useFileStoreZustand, selectOpenTabs);
  return useMemo(() => tabs, [tabs]);
}

/**
 * 订阅文件操作方法（不触发重渲染）
 */
export function useFileActions() {
  const store = useFileStoreZustand;
  return useMemo(
    () => ({
      updateFile: store.getState().updateFile,
      createFile: store.getState().createFile,
      deleteFile: store.getState().deleteFile,
      renameFile: store.getState().renameFile,
      setActiveFile: store.getState().setActiveFile,
      openFile: store.getState().openFile,
      closeTab: store.getState().closeTab,
    }),
    [store],
  );
}

/**
 * 订阅 Git 状态（带 shallow 比较）
 */
export function useGitState() {
  const branch = useStore(useFileStoreZustand, selectGitBranch);
  const changes = useStore(
    useFileStoreZustand,
    useCallback((state: FileStoreState) => state.gitChanges, []),
  );
  const log = useStore(
    useFileStoreZustand,
    useCallback((state: FileStoreState) => state.gitLog.slice(0, 10), []),
  );
  
  return useMemo(
    () => ({ branch, changes, log }),
    [branch, changes, log],
  );
}

// ===== Settings Store 优化 Hooks =====

/**
 * 仅订阅用户配置
 */
export function useUserProfile() {
  return useStore(
    useSettingsStore,
    useCallback((state: { settings: Settings }) => state.settings.userProfile, []),
    shallow,
  );
}

/**
 * 仅订阅通用设置
 */
export function useGeneralSettings() {
  return useStore(
    useSettingsStore,
    useCallback(
      (state: { settings: Settings }) => state.settings.general,
      [],
    ),
    shallow,
  );
}

/**
 * 仅订阅主题设置
 */
export function useThemeSettings() {
  const theme = useStore(
    useSettingsStore,
    useCallback((state: { settings: Settings }) => state.settings.general.theme, []),
  );
  const editorFont = useStore(
    useSettingsStore,
    useCallback((state: { settings: Settings }) => state.settings.general.editorFont, []),
  );
  const editorFontSize = useStore(
    useSettingsStore,
    useCallback((state: { settings: Settings }) => state.settings.general.editorFontSize, []),
  );

  return useMemo(
    () => ({ theme, editorFont, editorFontSize }),
    [theme, editorFont, editorFontSize],
  );
}

/**
 * 仅订阅代理列表
 */
export function useAgents() {
  return useStore(
    useSettingsStore,
    useCallback(
      (state: { settings: Settings }) => state.settings.agents,
      [],
    ),
    shallow,
  );
}

/**
 * 仅订阅 MCP 配置
 */
export function useMCPConfigs() {
  return useStore(
    useSettingsStore,
    useCallback(
      (state: { settings: Settings }) => state.settings.mcpConfigs,
      [],
    ),
    shallow,
  );
}

/**
 * 仅订阅模型配置
 */
export function useModelConfigs() {
  return useStore(
    useSettingsStore,
    useCallback(
      (state: { settings: Settings }) => state.settings.models,
      [],
    ),
    shallow,
  );
}

/**
 * 仅订阅对话设置
 */
export function useConversationSettings() {
  return useStore(
    useSettingsStore,
    useCallback(
      (state: { settings: Settings }) => state.settings.conversation,
      [],
    ),
    shallow,
  );
}

/**
 * 仅订阅上下文设置
 */
export function useContextSettings() {
  return useStore(
    useSettingsStore,
    useCallback(
      (state: { settings: Settings }) => state.settings.context,
      [],
    ),
    shallow,
  );
}

/**
 * 订阅设置操作方法（不触发重渲染）
 */
export function useSettingsActions() {
  const store = useSettingsStore;
  return useMemo(
    () => ({
      updateGeneralSettings: store.getState().updateGeneralSettings,
      updateUserProfile: store.getState().updateUserProfile,
      addAgent: store.getState().addAgent,
      updateAgent: store.getState().updateAgent,
      removeAgent: store.getState().removeAgent,
      addMCP: store.getState().addMCP,
      updateMCP: store.getState().updateMCP,
      removeMCP: store.getState().removeMCP,
    }),
    [store],
  );
}

// ===== Model Store 优化 Hooks =====

/**
 * 仅订阅当前激活模型ID
 */
export function useActiveModelId() {
  return useStore(useModelStoreZustand, selectActiveModelId);
}

/**
 * 仅订阅自定义模型列表
 */
export function useCustomModels() {
  return useStore(
    useModelStoreZustand,
    selectCustomModels,
    shallow,
  );
}

/**
 * 仅订阅单个模型的连接状态
 */
export function useModelConnectivity(modelId: string) {
  return useStore(
    useModelStoreZustand,
    useCallback(
      (state: ModelStoreState) => state.connectivityResults[modelId],
      [modelId],
    ),
    shallow,
  );
}

/**
 * 仅订阅心跳配置
 */
export function useHeartbeatConfig() {
  return useStore(
    useModelStoreZustand,
    useCallback(
      (state: ModelStoreState) => ({
        enabled: state.heartbeatEnabled,
        intervalMs: state.heartbeatIntervalMs,
      }),
      [],
    ),
    shallow,
  );
}

/**
 * 仅订阅延迟历史（最近20条）
 */
export function useRecentLatencyHistory(limit = 20) {
  return useStore(
    useModelStoreZustand,
    useCallback(
      (state: ModelStoreState) => state.latencyHistory.slice(-limit),
      [limit],
    ),
    shallow,
  );
}

/**
 * 订阅模型操作方法（不触发重渲染）
 */
export function useModelActions() {
  const store = useModelStoreZustand;
  return useMemo(
    () => ({
      setActiveModelId: store.getState().setActiveModelId,
      addCustomModel: store.getState().addCustomModel,
      removeCustomModel: store.getState().removeCustomModel,
      updateCustomModel: store.getState().updateCustomModel,
      setConnectivityResult: store.getState().setConnectivityResult,
      toggleHeartbeat: store.getState().toggleHeartbeat,
    }),
    [store],
  );
}

// ===== Task Board Store 优化 Hooks =====

/**
 * 仅订阅任务列表（支持过滤）
 */
export function useTasks(filter?: (task: Task) => boolean) {
  return useStore(
    useTaskBoardStore,
    useCallback(
      (state: TaskBoardState) => {
        let tasks = state.tasks;
        if (filter) {
          tasks = tasks.filter(filter);
        }
        return tasks;
      },
      [filter],
    ),
    shallow,
  );
}

/**
 * 仅订阅单个任务
 */
export function useTask(taskId: string) {
  return useStore(
    useTaskBoardStore,
    useCallback(
      (state: TaskBoardState) => state.tasks.find((t) => t.id === taskId),
      [taskId],
    ),
  );
}

/**
 * 仅订阅提醒列表
 */
export function useReminders() {
  return useStore(
    useTaskBoardStore,
    useCallback((state: TaskBoardState) => state.reminders, []),
    shallow,
  );
}

/**
 * 仅订阅过滤器状态
 */
export function useTaskFilters() {
  return useStore(
    useTaskBoardStore,
    useCallback((state: TaskBoardState) => state.filters, []),
    shallow,
  );
}

/**
 * 仅订阅看板视图设置
 */
export function useBoardViewSettings() {
  return useStore(
    useTaskBoardStore,
    useCallback(
      (state: TaskBoardState) => ({
        view: state.boardView,
        sortField: state.sortField,
        sortAsc: state.sortAsc,
        selectedTaskId: state.selectedTaskId,
      }),
      [],
    ),
    shallow,
  );
}

/**
 * 订阅任务操作方法（不触发重渲染）
 */
export function useTaskActions() {
  const store = useTaskBoardStore;
  return useMemo(
    () => ({
      addTask: store.getState().addTask,
      updateTask: store.getState().updateTask,
      removeTask: store.getState().removeTask,
      moveTask: store.getState().moveTask,
      setPriority: store.getState().setPriority,
      addReminder: store.getState().addReminder,
      setFilters: store.getState().setFilters,
    }),
    [store],
  );
}

// ===== 组合 Hooks =====

/**
 * 订阅编辑器所需的所有状态（优化的组合）
 */
export function useEditorState() {
  const activeFile = useActiveFilePath();
  const fileContent = useFileContent(activeFile);
  const themeSettings = useThemeSettings();

  return useMemo(
    () => ({
      activeFile,
      fileContent,
      ...themeSettings,
    }),
    [activeFile, fileContent, themeSettings],
  );
}

/**
 * 订阅 Git 面板所需的所有状态
 */
export function useGitPanelState() {
  const gitState = useGitState();
  const activeFile = useActiveFilePath();

  return useMemo(
    () => ({
      ...gitState,
      activeFile,
    }),
    [gitState, activeFile],
  );
}
