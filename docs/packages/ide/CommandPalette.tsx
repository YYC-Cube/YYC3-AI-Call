/**
 * @file CommandPalette.tsx
 * @description 全局命令面板，支持 Ctrl+Shift+P 快速访问面板、操作、布局预设、
 *              模糊搜索、分类导航、快捷键提示、历史记录
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags command-palette,search,navigation,shortcuts,wave3
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search,
  MessageSquare,
  FolderOpen,
  Code2,
  Eye,
  Terminal as TerminalIcon,
  GitBranch,
  Workflow,
  Store,
  BookOpen,
  MessageSquareText,
  Users,
  Activity,
  Waypoints,
  Bug,
  Gauge,
  ShieldAlert,
  FlaskConical,
  BarChart3,
  Layout,
  Columns3,
  Bot,
  Monitor,
  RotateCcw,
  Settings,
  Zap,
  ArrowLeftRight,
  Maximize2,
  X,
  Command,
  Keyboard,
  Save,
  Download,
  Share2,
  Home,
  FileText,
  KanbanSquare,
  Layers,
} from "lucide-react";
import { usePanelManager, type PanelId, LAYOUT_PRESETS } from "./PanelManager";

// ── Command Definition ──

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "panel" | "layout" | "action" | "navigation" | "view";
  shortcut?: string;
  action: () => void;
}

// ── Panel icon map ──

const PANEL_ICONS: Record<
  PanelId,
  React.ComponentType<{ className?: string }>
> = {
  ai: MessageSquare,
  files: FolderOpen,
  code: Code2,
  preview: Eye,
  terminal: TerminalIcon,
  git: GitBranch,
  agents: Workflow,
  market: Store,
  knowledge: BookOpen,
  rag: MessageSquareText,
  collab: Users,
  ops: Activity,
  workflow: Waypoints,
  diagnostics: Bug,
  performance: Gauge,
  security: ShieldAlert,
  "test-gen": FlaskConical,
  quality: BarChart3,
  "document-editor": FileText,
  taskboard: KanbanSquare,
  "multi-instance": Layers,
};

const PANEL_LABELS: Record<PanelId, string> = {
  ai: "AI 对话",
  files: "文件管理",
  code: "代码编辑",
  preview: "实时预览",
  terminal: "终端",
  git: "Git 版本控制",
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

const CATEGORY_LABELS: Record<string, string> = {
  panel: "面板",
  layout: "布局",
  action: "操作",
  navigation: "导航",
  view: "视图",
};

const CATEGORY_ORDER = ["panel", "layout", "action", "navigation", "view"];

// ── Fuzzy match helper ──

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  // Simple character-by-character fuzzy
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── Props ──

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigateHome: () => void;
  onViewModeChange: (mode: "default" | "preview" | "code") => void;
  onSearchToggle: () => void;
  onTerminalToggle: () => void;
}

export default function CommandPalette({
  open,
  onClose,
  onNavigateHome,
  onViewModeChange,
  onSearchToggle,
  onTerminalToggle,
}: CommandPaletteProps) {
  const ctx = usePanelManager();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands list
  const commands = useMemo<CommandItem[]>(() => {
    if (!ctx) return [];

    const items: CommandItem[] = [];

    // ── Panel commands ──
    const panelIds = Object.keys(PANEL_LABELS) as PanelId[];
    for (const pid of panelIds) {
      items.push({
        id: `open-panel-${pid}`,
        label: `打开 ${PANEL_LABELS[pid]}`,
        description: `在布局中打开 ${PANEL_LABELS[pid]} 面板`,
        icon: PANEL_ICONS[pid],
        category: "panel",
        action: () => {
          ctx.openPanel(pid);
          onClose();
        },
      });
    }

    // ── Layout commands ──
    items.push({
      id: "layout-default",
      label: "标准三栏布局",
      description: "AI + 文件 + 代码 三栏默认布局",
      icon: Columns3,
      category: "layout",
      action: () => {
        ctx.setLayout(JSON.parse(JSON.stringify(LAYOUT_PRESETS.designer)));
        onClose();
      },
    });
    items.push({
      id: "layout-ai",
      label: "AI 工作台布局",
      description: "AI 为主 + 代码/预览 侧边布局",
      icon: Bot,
      category: "layout",
      action: () => {
        ctx.setLayout(
          JSON.parse(JSON.stringify(LAYOUT_PRESETS["ai-workspace"])),
        );
        onClose();
      },
    });
    items.push({
      id: "layout-reset",
      label: "重置布局",
      description: "恢复到初始默认布局",
      icon: RotateCcw,
      category: "layout",
      shortcut: "",
      action: () => {
        ctx.resetLayout();
        onClose();
      },
    });

    // ── View commands ──
    items.push({
      id: "view-preview",
      label: "切换到预览视图",
      description: "全屏预览模式",
      icon: Eye,
      category: "view",
      shortcut: "Ctrl+1",
      action: () => {
        onViewModeChange("preview");
        onClose();
      },
    });
    items.push({
      id: "view-code",
      label: "切换到代码视图",
      description: "代码编辑模式",
      icon: Code2,
      category: "view",
      shortcut: "Ctrl+2",
      action: () => {
        onViewModeChange("code");
        onClose();
      },
    });
    items.push({
      id: "view-default",
      label: "切换到默认视图",
      description: "标准三栏布局视图",
      icon: Layout,
      category: "view",
      action: () => {
        onViewModeChange("default");
        onClose();
      },
    });

    // ── Action commands ──
    items.push({
      id: "action-search",
      label: "全局搜索",
      description: "在文件和代码中搜索",
      icon: Search,
      category: "action",
      shortcut: "Ctrl+Shift+F",
      action: () => {
        onSearchToggle();
        onClose();
      },
    });
    items.push({
      id: "action-terminal",
      label: "切换终端",
      description: "显示或隐藏集成终端",
      icon: TerminalIcon,
      category: "action",
      shortcut: "Ctrl+`",
      action: () => {
        onTerminalToggle();
        onClose();
      },
    });

    // ── Navigation commands ──
    items.push({
      id: "nav-home",
      label: "返回首页",
      description: "回到首页入口",
      icon: Home,
      category: "navigation",
      action: () => {
        onNavigateHome();
        onClose();
      },
    });

    return items;
  }, [
    ctx,
    onClose,
    onNavigateHome,
    onViewModeChange,
    onSearchToggle,
    onTerminalToggle,
  ]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter(
      (cmd) =>
        fuzzyMatch(query, cmd.label) ||
        fuzzyMatch(query, cmd.description || "") ||
        fuzzyMatch(query, CATEGORY_LABELS[cmd.category] || ""),
    );
  }, [commands, query]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    for (const cmd of filteredCommands) {
      if (!groups.has(cmd.category)) groups.set(cmd.category, []);
      groups.get(cmd.category)!.push(cmd);
    }
    // Sort by category order
    const sorted: { category: string; items: CommandItem[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = groups.get(cat);
      if (items) sorted.push({ category: cat, items });
    }
    return sorted;
  }, [filteredCommands]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => filteredCommands, [filteredCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`,
    );
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatList[selectedIndex]) {
          flatList[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [flatList, selectedIndex, onClose],
  );

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-[560px] max-w-[90vw] bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--ide-border-dim)]">
          <Command className="w-4 h-4 text-[var(--ide-accent)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入命令搜索... (面板、布局、操作)"
            className="flex-1 bg-transparent text-[0.8rem] text-[var(--ide-text-primary)] placeholder:text-[var(--ide-text-dim)] outline-none"
          />
          <kbd className="text-[0.55rem] text-[var(--ide-text-dim)] bg-[var(--ide-bg-inset)] px-1.5 py-0.5 rounded border border-[var(--ide-border-dim)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1">
          {flatList.length === 0 ? (
            <div className="px-4 py-8 text-center text-[0.72rem] text-[var(--ide-text-dim)]">
              未找到匹配的命令
            </div>
          ) : (
            groupedCommands.map(({ category, items }) => (
              <div key={category}>
                {/* Category header */}
                <div className="px-4 py-1.5 text-[0.55rem] text-[var(--ide-text-dim)] uppercase tracking-wider">
                  {CATEGORY_LABELS[category] || category}
                </div>
                {/* Commands */}
                {items.map((cmd) => {
                  flatIndex++;
                  const idx = flatIndex;
                  const Icon = cmd.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      data-index={idx}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? "bg-[var(--ide-accent-solid)]/10 text-[var(--ide-accent)]"
                          : "text-[var(--ide-text-secondary)] hover:bg-white/[0.03]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isSelected
                            ? "text-[var(--ide-accent)]"
                            : "text-[var(--ide-text-muted)]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.72rem] truncate">
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="text-[0.58rem] text-[var(--ide-text-dim)] truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="text-[0.52rem] text-[var(--ide-text-dim)] bg-[var(--ide-bg-inset)] px-1.5 py-0.5 rounded border border-[var(--ide-border-dim)] flex-shrink-0">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--ide-border-dim)] flex items-center gap-4 text-[0.52rem] text-[var(--ide-text-dim)]">
          <span className="flex items-center gap-1">
            <kbd className="bg-[var(--ide-bg-inset)] px-1 py-0.5 rounded border border-[var(--ide-border-dim)]">
              ↑↓
            </kbd>
            导航
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[var(--ide-bg-inset)] px-1 py-0.5 rounded border border-[var(--ide-border-dim)]">
              Enter
            </kbd>
            执行
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-[var(--ide-bg-inset)] px-1 py-0.5 rounded border border-[var(--ide-border-dim)]">
              Esc
            </kbd>
            关闭
          </span>
          <span className="ml-auto">{flatList.length} 个命令</span>
        </div>
      </div>
    </>
  );
}
