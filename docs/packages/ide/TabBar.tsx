/**
 * @file TabBar.tsx
 * @description 编辑器标签栏组件，支持多标签页切换、文件类型图标、
 *              修改状态指示、关闭标签、右键菜单等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tabs,editor,file-navigation,ui
 */

import { useRef, useState } from "react";
import { X, FileCode2, FileJson, FileText, MoreHorizontal } from "lucide-react";
import { useFileStore } from "./FileStore";

function getTabIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts"))
    return <FileCode2 className="w-3 h-3 text-blue-400 flex-shrink-0" />;
  if (name.endsWith(".json"))
    return <FileJson className="w-3 h-3 text-amber-400 flex-shrink-0" />;
  if (name.endsWith(".css"))
    return <FileText className="w-3 h-3 text-pink-400 flex-shrink-0" />;
  return <FileText className="w-3 h-3 text-slate-500 flex-shrink-0" />;
}

export default function TabBar() {
  const {
    openTabs,
    activeFile,
    setActiveFile,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
  } = useFileStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    path: string;
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ path, x: e.clientX, y: e.clientY });
  };

  if (openTabs.length === 0) return null;

  return (
    <>
      <div className="flex-shrink-0 flex items-center bg-[var(--ide-bg-dark)] border-b border-[var(--ide-border-dim)] overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 flex items-center overflow-x-auto scrollbar-none"
        >
          {openTabs.map((tab) => {
            const fileName = tab.path.split("/").pop() || tab.path;
            const isActive = tab.path === activeFile;
            return (
              <button
                key={tab.path}
                onClick={() => setActiveFile(tab.path)}
                onContextMenu={(e) => handleContextMenu(e, tab.path)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 border-r border-[var(--ide-border-faint)] transition-colors ${
                  isActive
                    ? "bg-[var(--ide-bg)] text-slate-300 border-b-2 border-b-sky-500"
                    : "bg-[var(--ide-bg-deep)] text-slate-600 hover:text-slate-400 hover:bg-[var(--ide-bg-inset)]"
                }`}
              >
                {getTabIcon(fileName)}
                <span className="text-[0.68rem] max-w-[100px] truncate">
                  {fileName}
                </span>
                {tab.modified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                )}
                {openTabs.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.path);
                    }}
                    className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* Tab actions */}
        <div className="flex-shrink-0 flex items-center px-1.5 gap-0.5">
          <button
            onClick={closeAllTabs}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
            title="关闭所有标签"
          >
            <MoreHorizontal className="w-3 h-3 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded shadow-xl py-1 z-50 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                closeTab(contextMenu.path);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-slate-400 hover:bg-[var(--ide-border-faint)] transition-colors"
            >
              关闭
            </button>
            <button
              onClick={() => {
                closeOtherTabs(contextMenu.path);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-slate-400 hover:bg-[var(--ide-border-faint)] transition-colors"
            >
              关闭其他
            </button>
            <button
              onClick={() => {
                closeAllTabs();
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[0.68rem] text-slate-400 hover:bg-[var(--ide-border-faint)] transition-colors"
            >
              关闭全部
            </button>
          </div>
        </>
      )}
    </>
  );
}
