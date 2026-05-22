/**
 * @file types/multi-instance.ts
 * @description 应用多开系统核心类型定义，包含实例、窗口、工作区、会话、IPC 消息等类型
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,types,workspace,session
 */

/** 实例类型 */
export type InstanceType = "main" | "secondary" | "popup" | "preview";

/** 窗口类型 */
export type WindowType =
  | "main"
  | "editor"
  | "preview"
  | "terminal"
  | "ai-chat"
  | "settings";

/** 工作区类型 */
export type WorkspaceType = "project" | "ai-session" | "debug" | "custom";

/** 会话类型 */
export type SessionType =
  | "ai-chat"
  | "code-edit"
  | "debug"
  | "preview"
  | "terminal";

/** 会话状态 */
export type SessionStatus = "active" | "idle" | "suspended" | "closed";

/** 应用实例 */
export interface AppInstance {
  id: string;
  type: InstanceType;
  windowId: string;
  windowType: WindowType;
  title: string;
  createdAt: number;
  lastActiveAt: number;
  isMain: boolean;
  isVisible: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  workspaceId?: string;
  sessionIds: string[];
  state: Record<string, unknown>;
}

/** 窗口创建配置 */
export interface WindowConfig {
  title?: string;
  size?: { width: number; height: number };
  position?: { x: number; y: number };
  resizable?: boolean;
  alwaysOnTop?: boolean;
  workspaceId?: string;
}

/** 编辑器配置 */
export interface EditorConfig {
  fontSize?: number;
  tabSize?: number;
  theme?: string;
  wordWrap?: boolean;
  minimap?: boolean;
}

/** AI 配置 */
export interface AIConfig {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/** 面板布局 */
export interface PanelLayout {
  leftWidth?: number;
  rightWidth?: number;
  bottomHeight?: number;
  visiblePanels?: string[];
}

/** 主题配置 */
export interface ThemeConfig {
  mode?: "light" | "dark" | "system";
  customColors?: Record<string, string>;
}

/** 快捷键配置 */
export interface ShortcutConfig {
  [action: string]: string;
}

/** 工作区配置 */
export interface WorkspaceConfig {
  editor?: EditorConfig;
  ai?: AIConfig;
  panelLayout?: PanelLayout;
  theme?: ThemeConfig;
  shortcuts?: ShortcutConfig;
}

/** 工作区 */
export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  icon?: string;
  createdAt: number;
  updatedAt: number;
  projectPath?: string;
  config: WorkspaceConfig;
  sessionIds: string[];
  windowIds: string[];
  isActive: boolean;
}

/** 会话数据 */
export interface SessionData {
  aiMessages?: Array<{ role: string; content: string }>;
  editedFiles?: Array<{ path: string; content: string }>;
  terminalHistory?: Array<{ command: string; output: string }>;
  debugState?: unknown;
  previewUrl?: string;
}

/** 会话 */
export interface Session {
  id: string;
  type: SessionType;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: SessionStatus;
  data: SessionData;
  workspaceId: string;
  windowId: string;
}

/** IPC 消息类型 */
export type IPCMessageType =
  | "instance-created"
  | "instance-closed"
  | "workspace-created"
  | "workspace-updated"
  | "workspace-closed"
  | "session-created"
  | "session-updated"
  | "session-closed"
  | "state-sync"
  | "resource-share"
  | "clipboard-share";

/** IPC 消息 */
export interface IPCMessage {
  id: string;
  type: IPCMessageType;
  senderId: string;
  receiverId?: string;
  data: unknown;
  timestamp: number;
}
