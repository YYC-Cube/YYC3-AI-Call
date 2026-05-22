/**
 * @file types/index.ts
 * @description 核心类型定义 — 对齐 P0-架构-类型定义.md，集中管理 Design JSON、面板、组件等接口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags types,interfaces,design-json,panel,component
 */

// ================================================================
// Core Type Definitions (对齐 YYC3-Design-Prompt/P0-核心架构/YYC3-P0-架构-类型定义.md)
// ================================================================

// ── Design JSON 根节点 ──

export interface DesignRoot {
  version: string;
  theme: "light" | "dark";
  tokens: string;
  panels: PanelSpec[];
  components: ComponentSpec[];
  styles: StyleSpec;
  metadata?: ProjectMetadata;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  techStack?: string[];
  tags?: string[];
}

// ── 面板规范 ──

export interface PanelSpec {
  id: string;
  type: PanelType;
  layout: PanelLayout;
  style?: PanelStyle;
  children?: PanelSpec[];
  components?: ComponentSpec[];
  locked?: boolean;
  pinned?: boolean;
}

export type PanelType =
  | "container"
  | "content"
  | "preview"
  | "terminal"
  | "editor";

export interface PanelLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface PanelStyle {
  background?: string;
  border?: string;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  shadow?: string;
  opacity?: number;
}

// ── 面板 ID 注册表 ──
// NOTE: 权威定义在 PanelManager.tsx，此处为类型参考
// 直接使用 PanelManager.tsx 导出的 PanelId 即可
export type PanelId =
  | "ai"
  | "files"
  | "code"
  | "git"
  | "agents"
  | "market"
  | "knowledge"
  | "rag"
  | "collab"
  | "ops"
  | "workflow"
  | "preview"
  | "diagnostics"
  | "performance"
  | "security"
  | "test-gen"
  | "quality"
  | "terminal";

// ── 组件规范 ──

export interface ComponentSpec {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  style?: ComponentStyle;
  children?: ComponentSpec[];
  events?: Record<string, string>;
}

export type ComponentType =
  | "Button"
  | "Input"
  | "Text"
  | "Image"
  | "Container"
  | "List"
  | "Card"
  | "Modal"
  | "Dropdown"
  | "Checkbox"
  | "Radio"
  | "Switch"
  | "Slider"
  | "DatePicker"
  | "TimePicker"
  | "Upload"
  | "Progress"
  | "Spinner"
  | "Badge"
  | "Avatar"
  | "Divider"
  | "Tooltip"
  | "Popover"
  | "Tabs"
  | "Accordion"
  | "Breadcrumb"
  | "Pagination"
  | "Table"
  | "Form"
  | "Alert"
  | "Message"
  | "Notification"
  | "Drawer"
  | "Skeleton"
  | "Empty"
  | "Result"
  | "Statistic"
  | "Timeline"
  | "Tree"
  | "Transfer"
  | "Calendar"
  | "Carousel"
  | "Collapse"
  | "Tag"
  | "Rate"
  | "Space"
  | "Layout"
  | "Menu"
  | "Steps";

export interface ComponentStyle {
  width?: string | number;
  height?: string | number;
  padding?: string | number;
  margin?: string | number;
  background?: string;
  border?: string;
  borderRadius?: string | number;
  boxShadow?: string;
  opacity?: number;
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string | number;
  position?: string;
  zIndex?: number;
  overflow?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  lineHeight?: string | number;
  color?: string;
  textAlign?: string;
  cursor?: string;
  transition?: string;
  transform?: string;
  animation?: string;
}

// ── 样式规范 ──

export interface StyleSpec {
  tokens: DesignTokens;
  theme: ThemeSpec;
  components: Record<string, ComponentStyle>;
}

export interface DesignTokens {
  colors: ColorTokenMap;
  spacing: Record<string, string>;
  typography: TypographyTokens;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}

export interface ColorTokenMap {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  neutral: ColorScale;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface TypographyTokens {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
}

export interface ThemeSpec {
  name: string;
  mode: "light" | "dark";
  colors: ThemeColors;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
  input: string;
  ring: string;
}

// ── AI 相关类型 ──

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    duration?: number;
  };
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  model?: string;
  provider?: string;
}

export type AIIntent =
  | "code-generation"
  | "code-review"
  | "code-fix"
  | "code-explain"
  | "code-optimize"
  | "code-refactor"
  | "code-test"
  | "general-chat";

// ── 文件系统类型 ──

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  children?: FileNode[];
  metadata?: {
    size?: number;
    modified?: number;
    language?: string;
  };
}

export interface FileChange {
  path: string;
  type: "create" | "modify" | "delete" | "rename";
  oldPath?: string;
  content?: string;
  timestamp: number;
}

// ── 事件总线类型 ──

export interface WorkflowEvent {
  type: string;
  payload: unknown;
  timestamp: number;
  source?: string;
}

// ── 插件系统类型 ──

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main?: string;
  entry?: string;
  icon?: string;
  category?: string;
  permissions?: string[];
  dependencies?: Record<string, string>;
  activationEvents?: string[];
  tags?: string[];
}

export type PluginStatus = "installed" | "active" | "disabled" | "error";

export interface PluginInstance {
  manifest: PluginManifest;
  status: PluginStatus;
  exports?: Record<string, unknown>;
  error?: string;
}

// ── 协作类型 ──

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number; file?: string };
  isOnline: boolean;
  lastSeen: number;
}

export interface CollabOperation {
  type: "insert" | "delete" | "retain";
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

// ── 预览类型 ──

export interface PreviewState {
  mode: "desktop" | "tablet" | "mobile";
  url?: string;
  isLoading: boolean;
  errors: PreviewError[];
  console: ConsoleEntry[];
}

export interface PreviewError {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  severity: "error" | "warning";
}

export interface ConsoleEntry {
  type: "log" | "warn" | "error" | "info";
  args: string[];
  timestamp: number;
}

// ── 安全类型 ──

export interface EncryptedData {
  iv: string; // Base64 encoded IV
  salt: string; // Base64 encoded salt
  ciphertext: string; // Base64 encoded encrypted data
  algorithm: string;
  version: number;
}

// ── 国际化类型 ──

export type SupportedLocale = "zh-CN" | "en-US" | "ja-JP";

export interface I18nTranslation {
  [key: string]: string | I18nTranslation;
}
