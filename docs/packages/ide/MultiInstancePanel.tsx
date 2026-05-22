/**
 * @file MultiInstancePanel.tsx
 * @description 应用多开管理面板 — 提供窗口实例管理、工作区管理、会话管理、
 *              IPC 消息日志四大标签页，支持创建/切换/删除/导出等完整操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,panel,window,workspace,session,ipc
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AppWindow,
  FolderKanban,
  MessageSquare,
  Radio,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  X,
  Search,
  Filter,
  Monitor,
  Code,
  Terminal as TerminalIcon,
  Bot,
  Settings,
  Layers,
  Bug,
  Palette,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useWindowStore } from "./stores/useWindowStore";
import { useWorkspaceStore } from "./stores/useWorkspaceStore";
import { useSessionStore } from "./stores/useSessionStore";
import { useIPCStore } from "./stores/useIPCStore";
import type {
  WindowType,
  WorkspaceType,
  SessionType,
  AppInstance,
  Workspace,
  Session,
} from "./types/multi-instance";

// ── Tab definitions ──
type TabId = "windows" | "workspaces" | "sessions" | "ipc";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "windows", label: "窗口", icon: <AppWindow className="w-3.5 h-3.5" /> },
  {
    id: "workspaces",
    label: "工作区",
    icon: <FolderKanban className="w-3.5 h-3.5" />,
  },
  {
    id: "sessions",
    label: "会话",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  { id: "ipc", label: "IPC", icon: <Radio className="w-3.5 h-3.5" /> },
];

const WINDOW_TYPE_META: Record<
  WindowType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  main: {
    label: "主窗口",
    icon: <Monitor className="w-3 h-3" />,
    color: "#00e5ff",
  },
  editor: {
    label: "编辑器",
    icon: <Code className="w-3 h-3" />,
    color: "#76ff03",
  },
  preview: {
    label: "预览",
    icon: <Eye className="w-3 h-3" />,
    color: "#ffab40",
  },
  terminal: {
    label: "终端",
    icon: <TerminalIcon className="w-3 h-3" />,
    color: "#e040fb",
  },
  "ai-chat": {
    label: "AI 对话",
    icon: <Bot className="w-3 h-3" />,
    color: "#40c4ff",
  },
  settings: {
    label: "设置",
    icon: <Settings className="w-3 h-3" />,
    color: "#ff6e40",
  },
};

const WORKSPACE_TYPE_META: Record<
  WorkspaceType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  project: {
    label: "项目",
    icon: <FolderKanban className="w-3 h-3" />,
    color: "#00e5ff",
  },
  "ai-session": {
    label: "AI 会话",
    icon: <Bot className="w-3 h-3" />,
    color: "#40c4ff",
  },
  debug: { label: "调试", icon: <Bug className="w-3 h-3" />, color: "#ff5252" },
  custom: {
    label: "自定义",
    icon: <Palette className="w-3 h-3" />,
    color: "#e040fb",
  },
};

const SESSION_TYPE_META: Record<
  SessionType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  "ai-chat": {
    label: "AI 对话",
    icon: <Bot className="w-3 h-3" />,
    color: "#40c4ff",
  },
  "code-edit": {
    label: "代码编辑",
    icon: <Code className="w-3 h-3" />,
    color: "#76ff03",
  },
  debug: { label: "调试", icon: <Bug className="w-3 h-3" />, color: "#ff5252" },
  preview: {
    label: "预览",
    icon: <Eye className="w-3 h-3" />,
    color: "#ffab40",
  },
  terminal: {
    label: "终端",
    icon: <TerminalIcon className="w-3 h-3" />,
    color: "#e040fb",
  },
};

// ── Shared button ──
function ActionBtn({
  icon,
  title,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1 rounded transition-colors ${
        danger
          ? "hover:bg-red-500/20 text-red-400 hover:text-red-300"
          : "hover:bg-white/10 text-[var(--ide-text-secondary,#8899aa)]"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {icon}
    </button>
  );
}

// ── Create dialog ──
function CreateDialog({
  title,
  children,
  onClose,
  onConfirm,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
      <div className="bg-[var(--ide-bg-panel,#0d1b2a)] border border-[var(--ide-border,#1b2b3a)] rounded-lg p-4 w-[280px] shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[var(--ide-text-primary,#e0e6ed)] text-[13px]">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-[var(--ide-text-secondary)] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {children}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[12px] rounded bg-white/5 text-[var(--ide-text-secondary)] hover:bg-white/10"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-[12px] rounded bg-[var(--ide-accent,#00e5ff)]/20 text-[var(--ide-accent,#00e5ff)] hover:bg-[var(--ide-accent)]/30"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Windows Tab
// ═══════════════════════════════════════════
function WindowsTab() {
  const {
    instances,
    activeInstanceId,
    createWindow,
    closeWindow,
    activateWindow,
    minimizeWindow,
    restoreWindow,
  } = useWindowStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<WindowType>("editor");
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = () => {
    createWindow(newType, { title: newTitle || undefined });
    setShowCreate(false);
    setNewTitle("");
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--ide-border,#1b2b3a)]">
        <span className="text-[11px] text-[var(--ide-text-secondary,#8899aa)] uppercase tracking-wider">
          实例 ({instances.length})
        </span>
        <ActionBtn
          icon={<Plus className="w-3.5 h-3.5" />}
          title="创建窗口"
          onClick={() => setShowCreate(true)}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {instances.length === 0 && (
          <div className="text-center py-8 text-[var(--ide-text-secondary,#8899aa)] text-[12px]">
            暂无实例，点击 + 创建
          </div>
        )}
        {instances.map((inst) => {
          const meta = WINDOW_TYPE_META[inst.windowType];
          const isActive = inst.id === activeInstanceId;
          return (
            <div
              key={inst.id}
              onClick={() => activateWindow(inst.windowId)}
              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                isActive
                  ? "bg-[var(--ide-accent,#00e5ff)]/10 border border-[var(--ide-accent,#00e5ff)]/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <span style={{ color: meta.color }}>{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--ide-text-primary,#e0e6ed)] truncate">
                  {inst.title}
                </div>
                <div className="text-[10px] text-[var(--ide-text-secondary,#8899aa)] flex items-center gap-1">
                  <span style={{ color: meta.color }}>{meta.label}</span>
                  {inst.isMain && (
                    <span className="px-1 py-0.5 bg-[var(--ide-accent,#00e5ff)]/20 text-[var(--ide-accent)] rounded text-[9px]">
                      主
                    </span>
                  )}
                  {inst.isMinimized && (
                    <Minimize2 className="w-2.5 h-2.5 text-yellow-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {inst.isMinimized ? (
                  <ActionBtn
                    icon={<Maximize2 className="w-3 h-3" />}
                    title="恢复"
                    onClick={() => restoreWindow(inst.windowId)}
                  />
                ) : (
                  <ActionBtn
                    icon={<Minimize2 className="w-3 h-3" />}
                    title="最小化"
                    onClick={() => minimizeWindow(inst.windowId)}
                  />
                )}
                {!inst.isMain && (
                  <ActionBtn
                    icon={<X className="w-3 h-3" />}
                    title="关闭"
                    onClick={() => closeWindow(inst.windowId)}
                    danger
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <CreateDialog
          title="创建新窗口"
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreate}
        >
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[var(--ide-text-secondary)] block mb-1">
                窗口类型
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as WindowType)}
                className="w-full bg-[var(--ide-bg-deep,#060d1a)] text-[var(--ide-text-primary)] text-[12px] border border-[var(--ide-border)] rounded px-2 py-1.5"
              >
                {Object.entries(WINDOW_TYPE_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[var(--ide-text-secondary)] block mb-1">
                窗口标题
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="可选，默认自动生成"
                className="w-full bg-[var(--ide-bg-deep,#060d1a)] text-[var(--ide-text-primary)] text-[12px] border border-[var(--ide-border)] rounded px-2 py-1.5 placeholder:text-[var(--ide-text-secondary)]/50"
              />
            </div>
          </div>
        </CreateDialog>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Workspaces Tab
// ═══════════════════════════════════════════
function WorkspacesTab() {
  const {
    workspaces,
    activeWorkspaceId,
    createWorkspace,
    deleteWorkspace,
    activateWorkspace,
    duplicateWorkspace,
    exportWorkspace,
    filter,
    updateFilter,
  } = useWorkspaceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WorkspaceType>("project");

  const filtered = useMemo(() => {
    return workspaces.filter((w) => {
      if (filter.type && w.type !== filter.type) return false;
      if (
        filter.search &&
        !w.name.toLowerCase().includes(filter.search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [workspaces, filter]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWorkspace(newName.trim(), newType);
    setShowCreate(false);
    setNewName("");
  };

  const handleExport = (id: string) => {
    try {
      const data = exportWorkspace(id);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workspace-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--ide-border,#1b2b3a)]">
        <span className="text-[11px] text-[var(--ide-text-secondary)] uppercase tracking-wider">
          工作区 ({filtered.length})
        </span>
        <ActionBtn
          icon={<Plus className="w-3.5 h-3.5" />}
          title="创建工作区"
          onClick={() => setShowCreate(true)}
        />
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1 bg-[var(--ide-bg-deep,#060d1a)] border border-[var(--ide-border)] rounded px-2 py-1">
          <Search className="w-3 h-3 text-[var(--ide-text-secondary)]" />
          <input
            value={filter.search || ""}
            onChange={(e) => updateFilter({ search: e.target.value })}
            placeholder="搜索工作区..."
            className="flex-1 bg-transparent text-[12px] text-[var(--ide-text-primary)] placeholder:text-[var(--ide-text-secondary)]/50 outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[var(--ide-text-secondary)] text-[12px]">
            暂无工作区
          </div>
        )}
        {filtered.map((ws) => {
          const meta = WORKSPACE_TYPE_META[ws.type];
          const isActive = ws.id === activeWorkspaceId;
          return (
            <div
              key={ws.id}
              onClick={() => activateWorkspace(ws.id)}
              className={`p-2 rounded-md cursor-pointer transition-colors ${
                isActive
                  ? "bg-[var(--ide-accent,#00e5ff)]/10 border border-[var(--ide-accent,#00e5ff)]/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[var(--ide-text-primary)] truncate">
                    {ws.name}
                  </div>
                  <div className="text-[10px] text-[var(--ide-text-secondary)] flex items-center gap-1.5">
                    <span style={{ color: meta.color }}>{meta.label}</span>
                    <span>·</span>
                    <span>{ws.sessionIds.length} 会话</span>
                    {ws.isActive && (
                      <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px]">
                        活跃
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <ActionBtn
                    icon={<Copy className="w-3 h-3" />}
                    title="复制"
                    onClick={() => duplicateWorkspace(ws.id)}
                  />
                  <ActionBtn
                    icon={<Download className="w-3 h-3" />}
                    title="导出"
                    onClick={() => handleExport(ws.id)}
                  />
                  <ActionBtn
                    icon={<Trash2 className="w-3 h-3" />}
                    title="删除"
                    onClick={() => deleteWorkspace(ws.id)}
                    danger
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <CreateDialog
          title="创建工作区"
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreate}
        >
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[var(--ide-text-secondary)] block mb-1">
                工作区名称
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入名称..."
                className="w-full bg-[var(--ide-bg-deep,#060d1a)] text-[var(--ide-text-primary)] text-[12px] border border-[var(--ide-border)] rounded px-2 py-1.5 placeholder:text-[var(--ide-text-secondary)]/50"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--ide-text-secondary)] block mb-1">
                工作区类型
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as WorkspaceType)}
                className="w-full bg-[var(--ide-bg-deep,#060d1a)] text-[var(--ide-text-primary)] text-[12px] border border-[var(--ide-border)] rounded px-2 py-1.5"
              >
                {Object.entries(WORKSPACE_TYPE_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CreateDialog>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Sessions Tab
// ═══════════════════════════════════════════
function SessionsTab() {
  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    activateSession,
    suspendSession,
    resumeSession,
  } = useSessionStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<SessionType>("ai-chat");

  const handleCreate = () => {
    if (!newName.trim()) return;
    createSession(newName.trim(), newType, activeWorkspaceId || "default");
    setShowCreate(false);
    setNewName("");
  };

  const statusColors: Record<string, string> = {
    active: "#76ff03",
    idle: "#ffab40",
    suspended: "#ff6e40",
    closed: "#78909c",
  };
  const statusLabels: Record<string, string> = {
    active: "活跃",
    idle: "空闲",
    suspended: "已暂停",
    closed: "已关闭",
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--ide-border,#1b2b3a)]">
        <span className="text-[11px] text-[var(--ide-text-secondary)] uppercase tracking-wider">
          会话 ({sessions.length})
        </span>
        <ActionBtn
          icon={<Plus className="w-3.5 h-3.5" />}
          title="创建会话"
          onClick={() => setShowCreate(true)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sessions.length === 0 && (
          <div className="text-center py-8 text-[var(--ide-text-secondary)] text-[12px]">
            暂无会话
          </div>
        )}
        {sessions.map((sess) => {
          const meta = SESSION_TYPE_META[sess.type];
          const isActive = sess.id === activeSessionId;
          return (
            <div
              key={sess.id}
              onClick={() => activateSession(sess.id)}
              className={`p-2 rounded-md cursor-pointer transition-colors ${
                isActive
                  ? "bg-[var(--ide-accent,#00e5ff)]/10 border border-[var(--ide-accent,#00e5ff)]/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[var(--ide-text-primary)] truncate">
                    {sess.name}
                  </div>
                  <div className="text-[10px] text-[var(--ide-text-secondary)] flex items-center gap-1.5">
                    <span style={{ color: meta.color }}>{meta.label}</span>
                    <span>·</span>
                    <span
                      className="flex items-center gap-0.5"
                      style={{ color: statusColors[sess.status] }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: statusColors[sess.status] }}
                      />
                      {statusLabels[sess.status]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {sess.status === "active" && (
                    <ActionBtn
                      icon={<Pause className="w-3 h-3" />}
                      title="暂停"
                      onClick={() => suspendSession(sess.id)}
                    />
                  )}
                  {sess.status === "suspended" && (
                    <button
                      onClick={() => resumeSession(sess.id)}
                      className="p-1 rounded hover:bg-white/10 text-[var(--ide-text-secondary,#8899aa)] transition-colors"
                      title="恢复"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  <ActionBtn
                    icon={<Trash2 className="w-3 h-3" />}
                    title="删除"
                    onClick={() => deleteSession(sess.id)}
                    danger
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateDialog
          title="创建会话"
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreate}
        >
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[var(--ide-text-secondary)] block mb-1">
                会话名称
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入名称..."
                className="w-full bg-[var(--ide-bg-deep,#060d1a)] text-[var(--ide-text-primary)] text-[12px] border border-[var(--ide-border)] rounded px-2 py-1.5 placeholder:text-[var(--ide-text-secondary)]/50"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--ide-text-secondary)] block mb-1">
                会话类型
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as SessionType)}
                className="w-full bg-[var(--ide-bg-deep,#060d1a)] text-[var(--ide-text-primary)] text-[12px] border border-[var(--ide-border)] rounded px-2 py-1.5"
              >
                {Object.entries(SESSION_TYPE_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CreateDialog>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// IPC Tab
// ═══════════════════════════════════════════
function IPCTab() {
  const {
    instanceId,
    messageLog,
    isConnected,
    initialize,
    broadcast,
    clearLog,
  } = useIPCStore();

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  const handlePing = () => {
    broadcast("state-sync", {
      ping: true,
      from: instanceId,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--ide-border,#1b2b3a)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--ide-text-secondary)] uppercase tracking-wider">
            IPC 通信
          </span>
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}
            title={isConnected ? "已连接" : "未连接"}
          />
        </div>
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={<Radio className="w-3.5 h-3.5" />}
            title="发送 Ping"
            onClick={handlePing}
          />
          <ActionBtn
            icon={<Trash2 className="w-3.5 h-3.5" />}
            title="清空日志"
            onClick={clearLog}
            danger
          />
        </div>
      </div>

      {/* Instance ID */}
      <div className="px-3 py-1.5 border-b border-[var(--ide-border,#1b2b3a)]">
        <div className="text-[10px] text-[var(--ide-text-secondary)]">
          实例 ID:{" "}
          <code className="text-[var(--ide-accent,#00e5ff)]">
            {instanceId.slice(0, 8)}...
          </code>
        </div>
      </div>

      {/* Message Log */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {messageLog.length === 0 && (
          <div className="text-center py-8 text-[var(--ide-text-secondary)] text-[12px]">
            暂无消息记录
          </div>
        )}
        {messageLog.map((msg) => (
          <div
            key={msg.id}
            className="p-1.5 rounded bg-white/3 border border-[var(--ide-border,#1b2b3a)]/50 text-[10px]"
          >
            <div className="flex items-center gap-1 text-[var(--ide-text-secondary)]">
              <span className="px-1 py-0.5 bg-[var(--ide-accent,#00e5ff)]/10 text-[var(--ide-accent)] rounded text-[9px]">
                {msg.type}
              </span>
              <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              {msg.senderId === instanceId && (
                <span className="text-yellow-400">(自身)</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Panel
// ═══════════════════════════════════════════
export default function MultiInstancePanel() {
  const [activeTab, setActiveTab] = useState<TabId>("windows");

  return (
    <div className="flex flex-col h-full bg-[var(--ide-bg-panel,#0d1b2a)] text-[var(--ide-text-primary,#e0e6ed)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--ide-border,#1b2b3a)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] transition-colors ${
              activeTab === tab.id
                ? "text-[var(--ide-accent,#00e5ff)] border-b-2 border-[var(--ide-accent,#00e5ff)]"
                : "text-[var(--ide-text-secondary,#8899aa)] hover:text-[var(--ide-text-primary)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "windows" && <WindowsTab />}
        {activeTab === "workspaces" && <WorkspacesTab />}
        {activeTab === "sessions" && <SessionsTab />}
        {activeTab === "ipc" && <IPCTab />}
      </div>
    </div>
  );
}
