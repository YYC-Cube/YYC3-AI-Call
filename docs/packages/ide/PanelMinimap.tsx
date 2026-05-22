/**
 * @file PanelMinimap.tsx
 * @description 面板布局小地图，实时可视化当前布局结构缩略图，
 *              支持点击聚焦面板、布局概览、面板状态指示
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags minimap,layout,visualization,overview,wave3
 */

import { useState, useMemo } from "react";
import { Map, ChevronDown, X } from "lucide-react";
import { usePanelManager, type LayoutNode, type PanelId } from "./PanelManager";

// ── Color map for panels ──

const PANEL_COLORS: Record<PanelId, string> = {
  ai: "#818cf8", // indigo
  files: "#f87171", // red
  code: "#60a5fa", // blue
  preview: "#34d399", // emerald
  terminal: "#a3a3a3", // neutral
  git: "#fb923c", // orange
  agents: "#a78bfa", // violet
  market: "#fbbf24", // amber
  knowledge: "#4ade80", // green
  rag: "#38bdf8", // sky
  collab: "#f472b6", // pink
  ops: "#c084fc", // purple
  workflow: "#2dd4bf", // teal
  diagnostics: "#ef4444", // red-500
  performance: "#facc15", // yellow
  security: "#f97316", // orange-500
  "test-gen": "#a3e635", // lime
  quality: "#06b6d4", // cyan
  "document-editor": "#6366f1", // slate
  taskboard: "#8b5cf6", // blue-500
  "multi-instance": "#d946ef", // violet
};

const PANEL_SHORT_LABELS: Record<PanelId, string> = {
  ai: "AI",
  files: "文件",
  code: "代码",
  preview: "预览",
  terminal: "终端",
  git: "Git",
  agents: "Agent",
  market: "市场",
  knowledge: "知识",
  rag: "RAG",
  collab: "协作",
  ops: "运维",
  workflow: "流程",
  diagnostics: "诊断",
  performance: "性能",
  security: "安全",
  "test-gen": "测试",
  quality: "质量",
  "document-editor": "文档",
  taskboard: "任务",
  "multi-instance": "实例",
};

// ── Recursive minimap renderer ──

interface MinimapNodeProps {
  node: LayoutNode;
  onPanelClick?: (panelId: PanelId) => void;
}

function MinimapNode({ node, onPanelClick }: MinimapNodeProps) {
  if (node.type === "leaf" && node.panelId) {
    const color = PANEL_COLORS[node.panelId] || "#64748b";
    const label = PANEL_SHORT_LABELS[node.panelId] || node.panelId;

    return (
      <div
        onClick={() => onPanelClick?.(node.panelId!)}
        className="rounded-[2px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
        style={{
          flex: `${node.size || 1} 1 0%`,
          backgroundColor: `${color}22`,
          border: `1px solid ${color}55`,
          minWidth: 0,
          minHeight: 0,
        }}
        title={label}
      >
        <span className="text-[0.4rem] truncate px-0.5" style={{ color }}>
          {label}
        </span>
      </div>
    );
  }

  if (node.type === "split" && node.children) {
    const isHorizontal = node.direction === "horizontal";
    return (
      <div
        className={`flex gap-[1px] ${isHorizontal ? "flex-row" : "flex-col"}`}
        style={{
          flex: `${node.size || 1} 1 0%`,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {node.children.map((child) => (
          <MinimapNode
            key={child.id}
            node={child}
            onPanelClick={onPanelClick}
          />
        ))}
      </div>
    );
  }

  return null;
}

// ── Collect all visible panels ──

function collectPanels(node: LayoutNode): PanelId[] {
  if (node.type === "leaf" && node.panelId) return [node.panelId];
  if (node.children) return node.children.flatMap(collectPanels);
  return [];
}

// ── Main Component ──

export default function PanelMinimap() {
  const ctx = usePanelManager();
  const [open, setOpen] = useState(false);

  const visiblePanels = useMemo(() => {
    if (!ctx) return [];
    return collectPanels(ctx.layout);
  }, [ctx?.layout]);

  if (!ctx) return null;

  const handlePanelClick = (panelId: PanelId) => {
    // Focus the panel (maximize temporarily or just highlight)
    ctx.openPanel(panelId);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.62rem] text-slate-600 hover:text-sky-400 hover:bg-white/5 transition-colors"
        title="布局小地图"
      >
        <Map className="w-3 h-3" />
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Minimap popup */}
          <div className="absolute right-0 top-full mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-xl z-50 w-[260px] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-1.5 border-b border-[var(--ide-border-faint)] flex items-center justify-between">
              <span className="text-[0.62rem] text-[var(--ide-text-muted)] flex items-center gap-1.5">
                <Map className="w-3 h-3 text-sky-400/60" />
                布局概览
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[0.5rem] text-[var(--ide-text-dim)]">
                  {visiblePanels.length} 个面板
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/5"
                >
                  <X className="w-3 h-3 text-[var(--ide-text-dim)]" />
                </button>
              </div>
            </div>

            {/* Minimap area */}
            <div className="p-3">
              <div
                className="w-full bg-[var(--ide-bg-inset)] rounded border border-[var(--ide-border-dim)] p-1"
                style={{ height: 120 }}
              >
                <MinimapNode
                  node={ctx.layout}
                  onPanelClick={handlePanelClick}
                />
              </div>
            </div>

            {/* Panel legend */}
            <div className="px-3 pb-2">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {visiblePanels.map((pid) => {
                  const color = PANEL_COLORS[pid] || "#64748b";
                  const label = PANEL_SHORT_LABELS[pid] || pid;
                  return (
                    <span
                      key={pid}
                      className="flex items-center gap-1 text-[0.5rem]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[var(--ide-text-dim)]">
                        {label}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
