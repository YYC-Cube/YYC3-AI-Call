/**
 * @file TabGroupBar.tsx
 * @description 面板标签页分组栏，展示面板分组、支持折叠/展开、
 *              颜色标识、快速切换、分组管理，以弹出面板形式集成到 ViewSwitcher
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tab-group,panels,navigation,organization,wave3
 */

import { useState, useCallback, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Edit3,
  FolderOpen,
  Check,
  Layers,
} from "lucide-react";
import {
  usePanelTabGroupStore,
  type TabGroup,
} from "./stores/usePanelTabGroupStore";
import { usePanelManager, type PanelId } from "./PanelManager";

// ── Panel title map ──

const PANEL_TITLES: Record<PanelId, string> = {
  ai: "AI 对话",
  files: "文件管理",
  code: "代码编辑",
  preview: "实时预览",
  terminal: "终端",
  git: "Git",
  agents: "Agent 编排",
  market: "Agent 市场",
  knowledge: "知识库",
  rag: "RAG 问答",
  collab: "实时协作",
  ops: "智能运维",
  workflow: "工作流闭环",
  diagnostics: "诊断工具",
  performance: "性能监控",
  security: "安全扫描",
  "test-gen": "测试生成",
  quality: "代码质量",
  "document-editor": "文档编辑",
  taskboard: "任务看板",
  "multi-instance": "多实例",
};

// ── Color options ──

const COLOR_OPTIONS = [
  "#818cf8",
  "#f87171",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f472b6",
  "#a78bfa",
  "#2dd4bf",
  "#fb923c",
  "#4ade80",
  "#38bdf8",
  "#c084fc",
];

// ── Group Item ──

interface GroupItemProps {
  group: TabGroup;
  onPanelOpen?: () => void;
}

function GroupItem({ group, onPanelOpen }: GroupItemProps) {
  const { toggleGroupCollapse, renameGroup, setGroupColor, removeGroup } =
    usePanelTabGroupStore();
  const panelCtx = usePanelManager();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = useCallback(() => {
    if (editName.trim()) {
      renameGroup(group.id, editName.trim());
    }
    setEditing(false);
  }, [editName, group.id, renameGroup]);

  const handleOpenPanel = useCallback(
    (panelId: PanelId) => {
      if (panelCtx) {
        panelCtx.openPanel(panelId);
        onPanelOpen?.();
      }
    },
    [panelCtx, onPanelOpen],
  );

  return (
    <div className="mb-0.5">
      {/* Group header */}
      <div className="flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-white/5 transition-colors group/hdr">
        {/* Collapse toggle */}
        <button
          onClick={() => toggleGroupCollapse(group.id)}
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
        >
          {group.collapsed ? (
            <ChevronRight className="w-3 h-3 text-[var(--ide-text-faint)]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[var(--ide-text-faint)]" />
          )}
        </button>

        {/* Color dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 cursor-pointer relative"
          style={{ backgroundColor: group.color }}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="更改颜色"
        />

        {/* Name */}
        {editing ? (
          <div className="flex items-center gap-0.5 flex-1">
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setEditing(false);
              }}
              onBlur={handleRename}
              className="flex-1 bg-transparent border border-[var(--ide-border)] rounded px-1 py-0 text-[0.62rem] text-[var(--ide-text-secondary)] outline-none focus:border-[var(--ide-accent-solid)]"
              autoFocus
            />
            <button onClick={handleRename} className="w-3 h-3 text-emerald-400">
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span
            className="flex-1 text-[0.62rem] text-[var(--ide-text-muted)] truncate cursor-default"
            onDoubleClick={() => {
              setEditName(group.name);
              setEditing(true);
            }}
          >
            {group.name}
            <span className="ml-1 text-[var(--ide-text-dim)]">
              ({group.panelIds.length})
            </span>
          </span>
        )}

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-0 opacity-0 group-hover/hdr:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditName(group.name);
              setEditing(true);
            }}
            className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10"
            title="重命名"
          >
            <Edit3 className="w-2.5 h-2.5 text-[var(--ide-text-faint)]" />
          </button>
          <button
            onClick={() => removeGroup(group.id)}
            className="w-4 h-4 rounded flex items-center justify-center hover:bg-red-900/20"
            title="删除分组"
          >
            <X className="w-2.5 h-2.5 text-[var(--ide-text-faint)]" />
          </button>
        </div>
      </div>

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div className="ml-5 mb-1 flex flex-wrap gap-1 p-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded shadow-lg">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setGroupColor(group.id, c);
                setShowColorPicker(false);
              }}
              className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${
                c === group.color ? "border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Panel list (collapsed hidden) */}
      {!group.collapsed && (
        <div className="ml-5 flex flex-col gap-0">
          {group.panelIds.map((pid) => (
            <button
              key={pid}
              onClick={() => handleOpenPanel(pid)}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[0.6rem] text-[var(--ide-text-secondary)] hover:bg-white/5 hover:text-[var(--ide-text-primary)] transition-colors text-left"
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color, opacity: 0.6 }}
              />
              {PANEL_TITLES[pid] || pid}
            </button>
          ))}
          {group.panelIds.length === 0 && (
            <span className="text-[0.56rem] text-[var(--ide-text-dim)] px-1.5 py-0.5 italic">
              空分组
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab Group Bar (popover style, for ViewSwitcher integration) ──

export default function TabGroupBar() {
  const { groups, createGroup } = usePanelTabGroupStore();
  const [open, setOpen] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const handleCreate = useCallback(() => {
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim());
      setNewGroupName("");
      setShowAddInput(false);
    }
  }, [newGroupName, createGroup]);

  const totalPanels = groups.reduce((sum, g) => sum + g.panelIds.length, 0);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.62rem] text-slate-600 hover:text-sky-400 hover:bg-white/5 transition-colors"
        title="面板分组"
      >
        <Layers className="w-3 h-3" />
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setShowAddInput(false);
            }}
          />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-xl z-50 w-[240px] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-1.5 border-b border-[var(--ide-border-faint)] flex items-center justify-between">
              <span className="text-[0.62rem] text-[var(--ide-text-muted)] flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3 text-sky-400/60" />
                面板分组
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[0.5rem] text-[var(--ide-text-dim)]">
                  {groups.length} 组 / {totalPanels} 面板
                </span>
                <button
                  onClick={() => setShowAddInput(!showAddInput)}
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                  title="新建分组"
                >
                  <Plus className="w-3 h-3 text-[var(--ide-text-faint)]" />
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setShowAddInput(false);
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/5"
                >
                  <X className="w-3 h-3 text-[var(--ide-text-dim)]" />
                </button>
              </div>
            </div>

            {/* Add new group input */}
            {showAddInput && (
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--ide-border-faint)]">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setShowAddInput(false);
                  }}
                  placeholder="分组名称..."
                  className="flex-1 bg-transparent border border-[var(--ide-border)] rounded px-1.5 py-0.5 text-[0.6rem] text-[var(--ide-text-secondary)] outline-none focus:border-[var(--ide-accent-solid)] placeholder:text-[var(--ide-text-dim)]"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  className="px-1.5 py-0.5 rounded bg-[var(--ide-accent-solid)] text-white text-[0.56rem] hover:opacity-80"
                >
                  创建
                </button>
              </div>
            )}

            {/* Groups */}
            <div className="px-1 py-1 max-h-[320px] overflow-y-auto">
              {groups.map((group) => (
                <GroupItem
                  key={group.id}
                  group={group}
                  onPanelOpen={() => setOpen(false)}
                />
              ))}
              {groups.length === 0 && (
                <div className="flex flex-col items-center gap-1 py-4 text-[var(--ide-text-dim)]">
                  <Layers className="w-5 h-5 opacity-30" />
                  <span className="text-[0.58rem]">暂无分组</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
