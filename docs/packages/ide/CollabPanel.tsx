/**
 * @file CollabPanel.tsx
 * @description 实时协同编辑面板，展示在线用户、编辑状态、权限管理、
 *              协同会话信息及通信状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags collaboration,realtime,users,panel
 */

import { useState } from "react";
import {
  Users,
  Edit3,
  Lock,
  MessageCircle,
  Clock,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";

interface CollabUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  status: "online" | "editing" | "idle" | "offline";
  currentFile?: string;
  cursor?: { line: number; col: number };
  role: "owner" | "editor" | "viewer";
}

interface CollabEvent {
  id: string;
  user: string;
  action: string;
  file?: string;
  timestamp: string;
  type: "edit" | "cursor" | "join" | "leave" | "comment" | "conflict";
}

interface Permission {
  userId: string;
  role: "owner" | "editor" | "viewer";
}

const MOCK_USERS: CollabUser[] = [
  {
    id: "u1",
    name: "开发者 (你)",
    avatar: "🧑‍💻",
    color: "#38bdf8",
    status: "editing",
    currentFile: "src/app/App.tsx",
    cursor: { line: 12, col: 8 },
    role: "owner",
  },
  {
    id: "u2",
    name: "张三",
    avatar: "👨‍🔬",
    color: "#a78bfa",
    status: "editing",
    currentFile: "src/app/components/Header.tsx",
    cursor: { line: 5, col: 22 },
    role: "editor",
  },
  {
    id: "u3",
    name: "李四",
    avatar: "👩‍🎨",
    color: "#34d399",
    status: "online",
    currentFile: "src/styles/theme.css",
    role: "editor",
  },
  {
    id: "u4",
    name: "王五",
    avatar: "🧑‍🏫",
    color: "#fbbf24",
    status: "idle",
    role: "viewer",
  },
  {
    id: "u5",
    name: "赵六",
    avatar: "👩‍💻",
    color: "#f87171",
    status: "offline",
    role: "viewer",
  },
];

const MOCK_EVENTS: CollabEvent[] = [
  {
    id: "e1",
    user: "张三",
    action: "正在编辑",
    file: "Header.tsx",
    timestamp: "刚刚",
    type: "edit",
  },
  {
    id: "e2",
    user: "李四",
    action: "打开了文件",
    file: "theme.css",
    timestamp: "1 分钟前",
    type: "cursor",
  },
  {
    id: "e3",
    user: "开发者",
    action: "解决了冲突",
    file: "App.tsx",
    timestamp: "3 分钟前",
    type: "conflict",
  },
  {
    id: "e4",
    user: "张三",
    action: "加入了协作",
    timestamp: "5 分钟前",
    type: "join",
  },
  {
    id: "e5",
    user: "王五",
    action: "添加了评论",
    file: "Dashboard.tsx",
    timestamp: "10 分钟前",
    type: "comment",
  },
  {
    id: "e6",
    user: "赵六",
    action: "离开了协作",
    timestamp: "15 分钟前",
    type: "leave",
  },
];

export default function CollabPanel({ nodeId }: { nodeId: string }) {
  const [users] = useState(MOCK_USERS);
  const [events] = useState(MOCK_EVENTS);
  const [activeTab, setActiveTab] = useState<
    "users" | "activity" | "permissions"
  >("users");
  const [showCursors, setShowCursors] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const onlineCount = users.filter((u) => u.status !== "offline").length;
  const editingCount = users.filter((u) => u.status === "editing").length;

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    online: { label: "在线", color: "text-emerald-400", bg: "bg-emerald-500" },
    editing: { label: "编辑中", color: "text-sky-400", bg: "bg-sky-500" },
    idle: { label: "空闲", color: "text-amber-400", bg: "bg-amber-500" },
    offline: { label: "离线", color: "text-slate-600", bg: "bg-slate-600" },
  };

  const roleConfig: Record<string, { label: string; color: string }> = {
    owner: { label: "所有者", color: "text-amber-400" },
    editor: { label: "编辑者", color: "text-sky-400" },
    viewer: { label: "查看者", color: "text-slate-500" },
  };

  const eventIcons: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    edit: { icon: Edit3, color: "text-sky-400" },
    cursor: { icon: Edit3, color: "text-emerald-400" },
    join: { icon: Users, color: "text-emerald-400" },
    leave: { icon: WifiOff, color: "text-slate-600" },
    comment: { icon: MessageCircle, color: "text-amber-400" },
    conflict: { icon: Shield, color: "text-red-400" },
  };

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="collab"
        title="实时协作"
        icon={<Users className="w-3 h-3 text-cyan-400/70" />}
      >
        <div className="flex items-center gap-1 ml-2">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`}
          />
          <span className="text-[0.55rem] text-slate-600">
            {isConnected ? "已连接" : "断开"}
          </span>
        </div>
      </PanelHeader>

      {/* Status bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)] flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-slate-500" />
          <span className="text-[0.65rem] text-slate-400">
            {onlineCount} 在线
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Edit3 className="w-3 h-3 text-sky-500" />
          <span className="text-[0.65rem] text-slate-400">
            {editingCount} 编辑中
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowCursors(!showCursors)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.55rem] transition-colors ${showCursors ? "bg-sky-900/40 text-sky-300" : "text-slate-600"}`}
        >
          <Edit3 className="w-2.5 h-2.5" />
          光标
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-[var(--ide-border-dim)]">
        {[
          { key: "users", label: "协作者", icon: Users },
          { key: "activity", label: "动态", icon: Clock },
          { key: "permissions", label: "权限", icon: Lock },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[0.65rem] transition-colors ${activeTab === tab.key ? "text-sky-400 border-b border-sky-500" : "text-slate-600"}`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "users" && (
          <div className="p-2 space-y-1">
            {/* User avatars strip */}
            <div className="flex items-center gap-1 px-1 pb-2 border-b border-[var(--ide-border-subtle)] mb-2">
              {users
                .filter((u) => u.status !== "offline")
                .map((u) => (
                  <div key={u.id} className="relative" title={u.name}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[0.7rem]"
                      style={{
                        border: `2px solid ${u.color}`,
                        background: `${u.color}15`,
                      }}
                    >
                      {u.avatar}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0b1729] ${statusConfig[u.status].bg}`}
                    />
                  </div>
                ))}
            </div>
            {/* User list */}
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-lg border border-[var(--ide-border-faint)] p-2 hover:border-[var(--ide-border-mid)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[0.62rem]"
                    style={{
                      border: `2px solid ${u.color}`,
                      background: `${u.color}15`,
                    }}
                  >
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[0.68rem] text-slate-300 truncate">
                        {u.name}
                      </span>
                      <span
                        className={`text-[0.5rem] ${roleConfig[u.role].color}`}
                      >
                        ({roleConfig[u.role].label})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig[u.status].bg}`}
                      />
                      <span
                        className={`text-[0.52rem] ${statusConfig[u.status].color}`}
                      >
                        {statusConfig[u.status].label}
                      </span>
                      {u.currentFile && (
                        <span className="text-[0.5rem] text-slate-700 ml-1">
                          {u.currentFile.split("/").pop()}
                        </span>
                      )}
                    </div>
                  </div>
                  {u.cursor && u.status === "editing" && (
                    <span className="text-[0.5rem] text-slate-700 font-mono">
                      L{u.cursor.line}:{u.cursor.col}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="p-2 space-y-0.5">
            {events.map((ev) => {
              const evConfig = eventIcons[ev.type];
              const Icon = evConfig.icon;
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/3 transition-colors"
                >
                  <Icon
                    className={`w-3 h-3 ${evConfig.color} flex-shrink-0 mt-0.5`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.65rem]">
                      <span className="text-slate-300">{ev.user}</span>{" "}
                      <span className="text-slate-500">{ev.action}</span>
                      {ev.file && (
                        <span className="text-sky-400/70 ml-1">{ev.file}</span>
                      )}
                    </div>
                    <span className="text-[0.5rem] text-slate-700">
                      {ev.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="p-2 space-y-1.5">
            <div className="px-2 py-1.5 text-[0.62rem] text-slate-600 border-b border-dashed border-[var(--ide-border-subtle)]">
              权限管理
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-[var(--ide-border-faint)]"
              >
                <span className="text-[0.62rem]">{u.avatar}</span>
                <span className="text-[0.65rem] text-slate-300 flex-1">
                  {u.name}
                </span>
                <select
                  defaultValue={u.role}
                  className="px-1.5 py-0.5 bg-[var(--ide-bg)] border border-[var(--ide-border-dim)] rounded text-[0.6rem] text-slate-400 outline-none"
                >
                  <option value="owner">所有者</option>
                  <option value="editor">编辑者</option>
                  <option value="viewer">查看者</option>
                </select>
              </div>
            ))}
            <div className="mt-3 px-2 py-2 border border-dashed border-[var(--ide-border-faint)] rounded text-center">
              <p className="text-[0.62rem] text-slate-600">冲突解决策略</p>
              <select className="mt-1 px-2 py-1 bg-[var(--ide-bg)] border border-[var(--ide-border-mid)] rounded text-[0.65rem] text-slate-300 outline-none">
                <option>OT (Operational Transform)</option>
                <option>CRDT (最终一致性)</option>
                <option>手动合并</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Connection footer */}
      <div className="flex-shrink-0 border-t border-[var(--ide-border-faint)] px-3 py-1.5 flex items-center gap-2 text-[0.55rem] text-slate-700">
        {isConnected ? (
          <Wifi className="w-2.5 h-2.5 text-emerald-500" />
        ) : (
          <WifiOff className="w-2.5 h-2.5 text-red-500" />
        )}
        <span>{isConnected ? "WebSocket 已连接" : "连接断开"}</span>
        <div className="flex-1" />
        <span>延迟: 12ms</span>
      </div>
    </div>
  );
}
