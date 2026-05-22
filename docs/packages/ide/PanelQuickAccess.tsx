/**
 * @file PanelQuickAccess.tsx
 * @description 面板快速访问组件，提供面板目录、快速切换、搜索过滤、
 *              分类导航等功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panels,quick-access,navigation,search
 */

import { useState } from "react";
import {
  Workflow,
  Store,
  BookOpen,
  MessageSquareText,
  Users,
  Activity,
  ChevronDown,
  GitBranch,
  Eye,
  Terminal,
  Waypoints,
  Bug,
  Gauge,
  ShieldAlert,
  FlaskConical,
  BarChart3,
  FileText,
  ListTodo,
  AppWindow,
} from "lucide-react";
import { usePanelManager, type PanelId } from "./PanelManager";

interface QuickAccessPanel {
  id: PanelId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  group: "core" | "ai" | "collab";
}

const QUICK_PANELS: QuickAccessPanel[] = [
  // AI & Agent group
  {
    id: "agents",
    label: "Agent 编排",
    icon: Workflow,
    color: "text-violet-400",
    group: "ai",
  },
  {
    id: "market",
    label: "Agent 市场",
    icon: Store,
    color: "text-amber-400",
    group: "ai",
  },
  {
    id: "knowledge",
    label: "知识库",
    icon: BookOpen,
    color: "text-emerald-400",
    group: "ai",
  },
  {
    id: "rag",
    label: "RAG 问答",
    icon: MessageSquareText,
    color: "text-sky-400",
    group: "ai",
  },
  // Collab & Ops group
  {
    id: "collab",
    label: "实时协作",
    icon: Users,
    color: "text-cyan-400",
    group: "collab",
  },
  {
    id: "ops",
    label: "智能运维",
    icon: Activity,
    color: "text-emerald-400",
    group: "collab",
  },
  {
    id: "workflow",
    label: "工作流闭环",
    icon: Waypoints,
    color: "text-violet-400",
    group: "collab",
  },
  // Core panels
  {
    id: "git",
    label: "Git",
    icon: GitBranch,
    color: "text-orange-400",
    group: "core",
  },
  {
    id: "terminal",
    label: "终端",
    icon: Terminal,
    color: "text-slate-400",
    group: "core",
  },
  {
    id: "preview",
    label: "预览",
    icon: Eye,
    color: "text-sky-400",
    group: "core",
  },
  {
    id: "diagnostics",
    label: "错误诊断",
    icon: Bug,
    color: "text-red-400",
    group: "core",
  },
  {
    id: "performance",
    label: "性能优化",
    icon: Gauge,
    color: "text-amber-400",
    group: "core",
  },
  {
    id: "security",
    label: "安全扫描",
    icon: ShieldAlert,
    color: "text-rose-400",
    group: "core",
  },
  {
    id: "test-gen",
    label: "测试生成",
    icon: FlaskConical,
    color: "text-emerald-400",
    group: "core",
  },
  {
    id: "quality",
    label: "代码质量",
    icon: BarChart3,
    color: "text-sky-400",
    group: "core",
  },
  {
    id: "document-editor",
    label: "文档编辑器",
    icon: FileText,
    color: "text-emerald-400",
    group: "core",
  },
  {
    id: "taskboard",
    label: "任务看板",
    icon: ListTodo,
    color: "text-amber-400",
    group: "core",
  },
  {
    id: "multi-instance",
    label: "应用多开",
    icon: AppWindow,
    color: "text-cyan-400",
    group: "core",
  },
];

export default function PanelQuickAccess() {
  const ctx = usePanelManager();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!ctx) return null;

  const handleOpen = (panelId: PanelId) => {
    ctx.openPanel(panelId);
    setMenuOpen(false);
  };

  // Show first 4 panels as direct buttons, rest in dropdown
  const directPanels = QUICK_PANELS.slice(0, 4);
  const morePanels = QUICK_PANELS.slice(4);

  return (
    <div className="flex items-center gap-0.5">
      {/* Direct quick buttons */}
      {directPanels.map((panel) => {
        const Icon = panel.icon;
        return (
          <button
            key={panel.id}
            onClick={() => handleOpen(panel.id)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.62rem] text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
            title={`打开${panel.label}`}
          >
            <Icon className={`w-3 h-3 ${panel.color}`} />
            <span className="hidden xl:inline">{panel.label}</span>
          </button>
        );
      })}

      {/* More dropdown */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.62rem] text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
          title="更多面板"
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            {/* Menu */}
            <div className="absolute left-0 top-full mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
              <div className="px-3 py-1.5 text-[0.55rem] text-[var(--ide-text-faint)] border-b border-[var(--ide-border-faint)]">
                快速打开面板
              </div>

              {/* All panels grouped */}
              <div className="px-2 py-1 text-[0.5rem] text-[var(--ide-text-faint)] mt-1">
                AI & Agent
              </div>
              {QUICK_PANELS.filter((p) => p.group === "ai").map((panel) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    onClick={() => handleOpen(panel.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.65rem] text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)] hover:text-[var(--ide-text-bright)] transition-colors"
                  >
                    <Icon className={`w-3.5 h-3.5 ${panel.color}`} />
                    <span>{panel.label}</span>
                  </button>
                );
              })}

              <div className="px-2 py-1 text-[0.5rem] text-[var(--ide-text-faint)] mt-0.5 border-t border-[var(--ide-border-subtle)] pt-1.5">
                协作 & 运维
              </div>
              {QUICK_PANELS.filter((p) => p.group === "collab").map((panel) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    onClick={() => handleOpen(panel.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.65rem] text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)] hover:text-[var(--ide-text-bright)] transition-colors"
                  >
                    <Icon className={`w-3.5 h-3.5 ${panel.color}`} />
                    <span>{panel.label}</span>
                  </button>
                );
              })}

              <div className="px-2 py-1 text-[0.5rem] text-[var(--ide-text-faint)] mt-0.5 border-t border-[var(--ide-border-subtle)] pt-1.5">
                核心
              </div>
              {morePanels
                .filter((p) => p.group === "core")
                .map((panel) => {
                  const Icon = panel.icon;
                  return (
                    <button
                      key={panel.id}
                      onClick={() => handleOpen(panel.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.65rem] text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)] hover:text-[var(--ide-text-bright)] transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 ${panel.color}`} />
                      <span>{panel.label}</span>
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
