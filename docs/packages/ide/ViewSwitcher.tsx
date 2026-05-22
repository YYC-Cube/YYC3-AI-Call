/**
 * @file ViewSwitcher.tsx
 * @description IDE 视图切换栏，支持预览/代码/默认三种视图模式切换，
 *              集成搜索开关、命令面板、快捷键帮助、子控件插槽
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags view-switcher,navigation,toolbar,shortcuts,command-palette,wave3
 */

import {
  ChevronLeft,
  Eye,
  Code2,
  Search,
  MoreHorizontal,
  X,
  Command,
  Keyboard,
} from "lucide-react";
import type { ReactNode } from "react";

export type ViewMode = "default" | "preview" | "code";

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onBack: () => void;
  searchOpen: boolean;
  onSearchToggle: () => void;
  onCommandPalette?: () => void;
  onShortcutsHelp?: () => void;
  children?: ReactNode;
}

export default function ViewSwitcher({
  viewMode,
  onViewModeChange,
  onBack,
  searchOpen,
  onSearchToggle,
  onCommandPalette,
  onShortcutsHelp,
  children,
}: ViewSwitcherProps) {
  return (
    <div className="h-8 bg-[var(--ide-bg-surface)] border-b border-[var(--ide-border)] flex items-center px-3 gap-1 flex-shrink-0">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors text-[0.72rem] text-slate-400 hover:text-slate-200"
        title="返回首页"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* View Toggle */}
      <div className="flex items-center gap-0.5 bg-[var(--ide-bg-inset)] rounded p-0.5 border border-[var(--ide-border-dim)]">
        <button
          onClick={() => onViewModeChange("preview")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[0.72rem] transition-colors ${
            viewMode === "preview"
              ? "bg-[var(--ide-border-dim)] text-[var(--ide-accent)] shadow-sm"
              : "text-[var(--ide-text-muted)] hover:text-[var(--ide-text-primary)]"
          }`}
          title="预览 (Ctrl+1)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>预览</span>
        </button>
        <button
          onClick={() =>
            onViewModeChange(viewMode === "default" ? "code" : "default")
          }
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[0.72rem] transition-colors ${
            viewMode === "default" || viewMode === "code"
              ? "bg-[var(--ide-border-dim)] text-[var(--ide-accent)] shadow-sm"
              : "text-[var(--ide-text-muted)] hover:text-[var(--ide-text-primary)]"
          }`}
          title="代码 (Ctrl+2)"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>代码</span>
        </button>
      </div>

      {/* Separator */}
      <div className="h-3.5 w-px bg-[var(--ide-border)] mx-1" />

      {/* Search */}
      <button
        onClick={onSearchToggle}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.72rem] transition-colors ${
          searchOpen
            ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
            : "text-[var(--ide-text-muted)] hover:text-[var(--ide-text-primary)] hover:bg-white/5"
        }`}
        title="搜索 (Ctrl+Shift+F)"
      >
        {searchOpen ? (
          <X className="w-3.5 h-3.5" />
        ) : (
          <Search className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Command Palette */}
      {onCommandPalette && (
        <button
          onClick={onCommandPalette}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.72rem] text-[var(--ide-text-muted)] hover:text-[var(--ide-text-primary)] hover:bg-white/5 transition-colors"
          title="命令面板 (Ctrl+Shift+P)"
        >
          <Command className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Keyboard Shortcuts */}
      {onShortcutsHelp && (
        <button
          onClick={onShortcutsHelp}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.72rem] text-[var(--ide-text-muted)] hover:text-[var(--ide-text-primary)] hover:bg-white/5 transition-colors"
          title="快捷键帮助 (Ctrl+/)"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>
      )}

      {/* More */}
      <button
        className="flex items-center px-1.5 py-0.5 rounded text-[0.72rem] text-[var(--ide-text-muted)] hover:text-[var(--ide-text-primary)] hover:bg-white/5 transition-colors"
        title="更多"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {/* Extra controls from parent - wrapped in flex container */}
      <div className="flex items-center gap-0.5">
        {children}
      </div>

      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-2 text-[0.62rem] text-[var(--ide-text-dim)]">
        <span className="px-1.5 py-0.5 bg-[var(--ide-border-faint)] rounded text-[var(--ide-text-muted)]">
          TypeScript React
        </span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
