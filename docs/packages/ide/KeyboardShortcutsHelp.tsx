/**
 * @file KeyboardShortcutsHelp.tsx
 * @description 快捷键帮助面板，Ctrl+/ 打开，展示所有可用快捷键，
 *              按分类分组、支持搜索过滤
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags keyboard,shortcuts,help,accessibility,wave3
 */

import { useState, useMemo } from "react";
import { Keyboard, Search, X } from "lucide-react";

// ── Shortcut Definition ──

interface ShortcutDef {
  keys: string;
  label: string;
  category: "视图切换" | "面板操作" | "编辑器" | "终端" | "导航" | "命令";
}

const SHORTCUTS: ShortcutDef[] = [
  // 命令
  { keys: "Ctrl+Shift+P", label: "打开命令面板", category: "命令" },
  { keys: "Ctrl+/", label: "显示快捷键帮助", category: "命令" },
  { keys: "Ctrl+Shift+A", label: "打开快速操作栏", category: "命令" },

  // 视图切换
  { keys: "Ctrl+1", label: "切换到预览视图", category: "视图切换" },
  { keys: "Ctrl+2", label: "切换代码/默认视图", category: "视图切换" },
  { keys: "Ctrl+Shift+F", label: "全局搜索", category: "视图切换" },

  // 终端
  { keys: "Ctrl+`", label: "切换终端", category: "终端" },

  // 编辑器
  { keys: "Ctrl+S", label: "保存文件", category: "编辑器" },
  { keys: "Ctrl+Z", label: "撤销", category: "编辑器" },
  { keys: "Ctrl+Shift+Z", label: "重做", category: "编辑器" },
  { keys: "Ctrl+C", label: "复制", category: "编辑器" },
  { keys: "Ctrl+V", label: "粘贴", category: "编辑器" },
  { keys: "Ctrl+X", label: "剪切", category: "编辑器" },
  { keys: "Ctrl+A", label: "全选", category: "编辑器" },
  { keys: "Ctrl+F", label: "文件内搜索", category: "编辑器" },
  { keys: "Ctrl+H", label: "替换", category: "编辑器" },
  { keys: "Ctrl+D", label: "选择下一个匹配", category: "编辑器" },
  { keys: "Alt+↑/↓", label: "移动行", category: "编辑器" },
  { keys: "Ctrl+Shift+K", label: "删除行", category: "编辑器" },

  // 导航
  { keys: "Esc", label: "关闭弹窗 / 取消", category: "导航" },

  // 面板操作
  { keys: "拖拽标题栏", label: "拖拽合并面板", category: "面板操作" },
  {
    keys: "点击拆分按钮",
    label: "拆分面板（水平/垂直）",
    category: "面板操作",
  },
  { keys: "点击最大化", label: "最大化/还原面板", category: "面板操作" },
  { keys: "拖拽分隔线", label: "调整面板大小", category: "面板操作" },
  { keys: "点击固定图标", label: "固定/取消固定面板", category: "面板操作" },
  { keys: "点击锁定图标", label: "锁定/解锁面板内容", category: "面板操作" },
  { keys: "点击浮动图标", label: "将面板分离为浮动窗口", category: "面板操作" },
];

// ── Category colors ──

const CATEGORY_COLORS: Record<string, string> = {
  命令: "#818cf8",
  视图切换: "#60a5fa",
  终端: "#a3a3a3",
  编辑器: "#34d399",
  导航: "#fbbf24",
  面板操作: "#f472b6",
};

const CATEGORY_ORDER: ShortcutDef["category"][] = [
  "命令",
  "视图切换",
  "编辑器",
  "终端",
  "导航",
  "面板操作",
];

// ── Component ──

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({
  open,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter shortcuts based on search query
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return SHORTCUTS;
    const q = searchQuery.toLowerCase();
    return SHORTCUTS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.keys.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Group filtered shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, ShortcutDef[]> = {};
    for (const s of filteredShortcuts) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filteredShortcuts]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
        <div
          className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-xl shadow-2xl w-[520px] max-h-[70vh] flex flex-col pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--ide-border-faint)] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-sky-400/80" />
              <span className="text-[0.75rem] text-[var(--ide-text-secondary)]">
                快捷键帮助
              </span>
              <span className="text-[0.55rem] text-[var(--ide-text-dim)] ml-2">
                Ctrl+/ 关闭
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-[var(--ide-text-faint)]" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-[var(--ide-border-faint)] flex-shrink-0">
            <div className="flex items-center gap-2 bg-[var(--ide-bg-inset)] border border-[var(--ide-border-dim)] rounded px-2 py-1">
              <Search className="w-3 h-3 text-[var(--ide-text-dim)] flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索快捷键..."
                className="flex-1 bg-transparent text-[0.68rem] text-[var(--ide-text-secondary)] outline-none placeholder:text-[var(--ide-text-dim)]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/10"
                >
                  <X className="w-3 h-3 text-[var(--ide-text-dim)]" />
                </button>
              )}
            </div>
          </div>

          {/* Shortcuts list */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {CATEGORY_ORDER.map((category) => {
              const shortcuts = groupedShortcuts[category];
              if (!shortcuts || shortcuts.length === 0) return null;

              const color = CATEGORY_COLORS[category] || "#94a3b8";

              return (
                <div key={category} className="mb-3">
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[var(--ide-border-subtle)]">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[0.62rem]" style={{ color }}>
                      {category}
                    </span>
                    <span className="text-[0.5rem] text-[var(--ide-text-dim)]">
                      ({shortcuts.length})
                    </span>
                  </div>

                  {/* Shortcut items */}
                  {shortcuts.map((shortcut, i) => (
                    <div
                      key={`${shortcut.keys}-${i}`}
                      className="flex items-center justify-between py-1 px-1 rounded hover:bg-white/3 transition-colors"
                    >
                      <span className="text-[0.65rem] text-[var(--ide-text-secondary)]">
                        {shortcut.label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {shortcut.keys.split("+").map((key, ki) => (
                          <span key={ki} className="flex items-center gap-0.5">
                            {ki > 0 && (
                              <span className="text-[0.45rem] text-[var(--ide-text-dim)]">
                                +
                              </span>
                            )}
                            <kbd className="px-1.5 py-0.5 rounded bg-[var(--ide-bg-dark)] border border-[var(--ide-border-dim)] text-[0.58rem] text-[var(--ide-text-muted)] min-w-[20px] text-center">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {filteredShortcuts.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-[var(--ide-text-dim)]">
                <Search className="w-5 h-5 opacity-30" />
                <span className="text-[0.62rem]">未找到匹配的快捷键</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[var(--ide-border-faint)] text-[0.5rem] text-[var(--ide-text-dim)] flex-shrink-0">
            共 {SHORTCUTS.length} 个快捷键 / {filteredShortcuts.length} 个匹配
          </div>
        </div>
      </div>
    </>
  );
}
