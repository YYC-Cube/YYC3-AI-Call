/**
 * @file LayoutPresets.tsx
 * @description 用户自定义布局预设管理，支持保存当前布局、加载预设、
 *              删除预设、内置预设切换
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags layout,presets,persistence,panel-management
 */

import { useState, useCallback, useMemo } from "react";
import {
  Save,
  FolderOpen,
  Trash2,
  ChevronDown,
  Layout,
  Columns3,
  Rows3,
  Monitor,
  Code2,
  Bot,
  X,
  Check,
  Pencil,
} from "lucide-react";
import {
  usePanelManager,
  type LayoutNode,
  LAYOUT_PRESETS,
} from "./PanelManager";
import { loadJSON, saveJSON } from "./constants/storage-keys";

// ── Storage ──

const SK_SAVED_PRESETS = "yyc3_layout_presets";

interface SavedPreset {
  id: string;
  name: string;
  layout: LayoutNode;
  createdAt: number;
}

function loadSavedPresets(): SavedPreset[] {
  return loadJSON<SavedPreset[]>(SK_SAVED_PRESETS, []);
}

function saveSavedPresets(presets: SavedPreset[]): void {
  saveJSON(SK_SAVED_PRESETS, presets);
}

// ── Built-in presets ──

interface BuiltInPreset {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  layout: LayoutNode;
}

const FOUR_PANEL_LAYOUT: LayoutNode = {
  id: "root",
  type: "split",
  direction: "horizontal",
  children: [
    {
      id: "left-col",
      type: "split",
      direction: "vertical",
      size: 50,
      children: [
        { id: "tl", type: "leaf", panelId: "ai", size: 50 },
        { id: "bl", type: "leaf", panelId: "git", size: 50 },
      ],
    },
    {
      id: "right-col",
      type: "split",
      direction: "vertical",
      size: 50,
      children: [
        { id: "tr", type: "leaf", panelId: "files", size: 50 },
        { id: "br", type: "leaf", panelId: "code", size: 50 },
      ],
    },
  ],
};

const QUALITY_LAYOUT: LayoutNode = {
  id: "root",
  type: "split",
  direction: "horizontal",
  children: [
    { id: "left", type: "leaf", panelId: "quality", size: 30 },
    {
      id: "right-col",
      type: "split",
      direction: "vertical",
      size: 70,
      children: [
        { id: "tr", type: "leaf", panelId: "files", size: 50 },
        {
          id: "br-split",
          type: "split",
          direction: "horizontal",
          size: 50,
          children: [
            { id: "br-l", type: "leaf", panelId: "diagnostics", size: 50 },
            { id: "br-r", type: "leaf", panelId: "security", size: 50 },
          ],
        },
      ],
    },
  ],
};

const BUILTIN_PRESETS: BuiltInPreset[] = [
  {
    id: "default-3col",
    name: "标准三栏",
    icon: Columns3,
    layout: LAYOUT_PRESETS.designer,
  },
  {
    id: "ai-workspace",
    name: "AI 工作台",
    icon: Bot,
    layout: LAYOUT_PRESETS["ai-workspace"],
  },
  {
    id: "four-panel",
    name: "四分屏",
    icon: Layout,
    layout: FOUR_PANEL_LAYOUT,
  },
  {
    id: "quality-focus",
    name: "质量审查",
    icon: Monitor,
    layout: QUALITY_LAYOUT,
  },
];

// ── Component ──

export default function LayoutPresets() {
  const ctx = usePanelManager();
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedPresets, setSavedPresets] =
    useState<SavedPreset[]>(loadSavedPresets);
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState("");

  if (!ctx) return null;

  const handleLoadBuiltin = (preset: BuiltInPreset) => {
    ctx.setLayout(JSON.parse(JSON.stringify(preset.layout)));
    setMenuOpen(false);
  };

  const handleLoadSaved = (preset: SavedPreset) => {
    ctx.setLayout(JSON.parse(JSON.stringify(preset.layout)));
    setMenuOpen(false);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    const newPreset: SavedPreset = {
      id: `preset_${Date.now()}`,
      name: saveName.trim(),
      layout: JSON.parse(JSON.stringify(ctx.layout)),
      createdAt: Date.now(),
    };
    const next = [...savedPresets, newPreset];
    setSavedPresets(next);
    saveSavedPresets(next);
    setSaveMode(false);
    setSaveName("");
  };

  const handleDelete = (id: string) => {
    const next = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(next);
    saveSavedPresets(next);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.62rem] text-slate-600 hover:text-sky-400 hover:bg-white/5 transition-colors"
        title="布局预设"
      >
        <Layout className="w-3 h-3" />
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setMenuOpen(false);
              setSaveMode(false);
            }}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-1.5 border-b border-[var(--ide-border-faint)] flex items-center justify-between">
              <span className="text-[0.62rem] text-[var(--ide-text-muted)]">
                布局预设
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/5"
              >
                <X className="w-3 h-3 text-[var(--ide-text-dim)]" />
              </button>
            </div>

            {/* Built-in Presets */}
            <div className="px-2 py-1 text-[0.52rem] text-[var(--ide-text-dim)]">
              内置预设
            </div>
            {BUILTIN_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleLoadBuiltin(preset)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.65rem] text-[var(--ide-text-secondary)] hover:bg-white/[0.04] transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-sky-400/60" />
                  {preset.name}
                </button>
              );
            })}

            {/* Saved Presets */}
            {savedPresets.length > 0 && (
              <>
                <div className="px-2 py-1 text-[0.52rem] text-[var(--ide-text-dim)] border-t border-[var(--ide-border-faint)] mt-1 pt-1.5">
                  我的预设 ({savedPresets.length})
                </div>
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-1 px-3 py-1.5 group hover:bg-white/[0.04] transition-colors"
                  >
                    <button
                      onClick={() => handleLoadSaved(preset)}
                      className="flex-1 flex items-center gap-2 text-[0.65rem] text-[var(--ide-text-secondary)] text-left"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-400/60" />
                      <span className="truncate">{preset.name}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                      title="删除预设"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Save Current */}
            <div className="border-t border-[var(--ide-border-faint)] mt-1">
              {saveMode ? (
                <div className="flex items-center gap-1 px-3 py-1.5">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="预设名称..."
                    autoFocus
                    className="flex-1 bg-[var(--ide-bg-inset)] border border-[var(--ide-border-dim)] rounded px-2 py-1 text-[0.62rem] text-[var(--ide-text-primary)] placeholder:text-[var(--ide-text-dim)] outline-none focus:border-[var(--ide-accent)]"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                    className="w-6 h-6 rounded flex items-center justify-center bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-30 transition-colors"
                  >
                    <Check className="w-3 h-3 text-sky-400" />
                  </button>
                  <button
                    onClick={() => {
                      setSaveMode(false);
                      setSaveName("");
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
                  >
                    <X className="w-3 h-3 text-[var(--ide-text-dim)]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSaveMode(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[0.65rem] text-sky-400 hover:bg-sky-500/5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存当前布局
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
