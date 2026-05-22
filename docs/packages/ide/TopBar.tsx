/**
 * @file TopBar.tsx
 * @description IDE 顶部导航栏，包含 Logo、项目标题编辑、工具栏图标组、
 *              主题切换、通知中心、分享对话框、项目导出（ZIP/JSON）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.4.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags topbar,navigation,toolbar,export,theme
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Wrench,
  FolderOpen,
  Zap,
  Bell,
  Settings,
  Share2,
  Rocket,
  User,
  GitBranch,
  Search,
  Command,
  Home,
  X,
  Pencil,
  Check,
  Download,
  FileArchive,
  FileJson,
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import NotificationDrawer from "./NotificationDrawer";
import ShareDialog from "./ShareDialog";
import { useFileStore } from "./FileStore";
import { exportAsZip, exportAsJson } from "./adapters/ProjectExporter";
import yyc3Logo from "/Web App/favicon-32.png";
import ModelSelector from "./left-panel/ModelSelector";
import ConnectivityIndicator from "./left-panel/ConnectivityIndicator";
import { useModelRegistry } from "./ModelRegistry";

interface TopBarProps {
  projectName: string;
  onBack: () => void;
  onToolAction?: (action: string) => void;
}

interface ToolbarItem {
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  color: string;
  action: string;
  badge?: number;
}

const TOOLBAR_ICONS: ToolbarItem[] = [
  { icon: Wrench, tooltip: "工具", color: "text-amber-400", action: "tools" },
  {
    icon: FolderOpen,
    tooltip: "项目管理",
    color: "text-red-400",
    action: "projects",
  },
  { icon: GitBranch, tooltip: "Git", color: "text-orange-400", action: "git" },
  {
    icon: Zap,
    tooltip: "扩展插件",
    color: "text-yellow-300",
    action: "plugins",
  },
  { icon: Share2, tooltip: "分享", color: "text-cyan-400", action: "share" },
  {
    icon: Bell,
    tooltip: "通知中心",
    color: "text-orange-400",
    action: "notifications",
    badge: 3,
  },
  {
    icon: Settings,
    tooltip: "设置",
    color: "text-slate-300",
    action: "settings",
  },
];

export default function TopBar({
  projectName,
  onBack,
  onToolAction,
}: TopBarProps) {
  const { fileContents } = useFileStore();
  const {
    models,
    providers,
    activeModelId,
    activeModel,
    ollamaStatus,
    setActiveModelId,
    hasProviderKey,
  } = useModelRegistry();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(projectName);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Drawer/Dialog states
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (isEditingName && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditingName]);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  const handleToolClick = (action: string) => {
    // Handle share and notifications with their own UI
    if (action === "share") {
      setShareOpen(true);
      return;
    }
    if (action === "notifications") {
      setNotificationOpen(true);
      return;
    }

    // Toggle active state for panel-opening actions
    if (activeAction === action) {
      setActiveAction(null);
    } else {
      setActiveAction(action);
    }
    onToolAction?.(action);
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
  };

  const handleExportAsZip = useCallback(() => {
    exportAsZip(fileContents, { projectName: editName }).catch(console.error);
  }, [fileContents, editName]);

  const handleExportAsJson = useCallback(() => {
    exportAsJson(fileContents, { projectName: editName });
  }, [fileContents, editName]);

  return (
    <>
      <div className="h-11 flex items-center px-3 gap-2 flex-shrink-0 bg-gradient-to-r from-[var(--ide-bg-inset)] via-[var(--ide-bg-surface)] to-[var(--ide-bg-inset)] border-b border-[var(--ide-border)]">
        {/* Logo - brand only, no navigation */}
        <div className="flex items-center gap-2 px-1 flex-shrink-0">
          <div className="w-6 h-6 rounded overflow-hidden flex items-center justify-center">
            <img src={yyc3Logo} alt="YYC³" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-[0.82rem] text-[var(--ide-text-bright)] tracking-wide">
            YYC³
          </span>
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-[var(--ide-border-dim)] flex-shrink-0" />

        {/* Home button - explicit navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white/5 transition-colors flex-shrink-0 group"
          title="返回首页"
        >
          <Home className="w-3.5 h-3.5 text-[var(--ide-text-muted)] group-hover:text-[var(--ide-accent)]" />
        </button>

        {/* Separator */}
        <div className="h-4 w-px bg-[var(--ide-border-dim)] flex-shrink-0" />

        {/* Project Title - editable */}
        <div className="flex items-center gap-1.5 flex-shrink-0 max-w-[180px]">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                ref={editInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSubmit();
                  if (e.key === "Escape") {
                    setEditName(projectName);
                    setIsEditingName(false);
                  }
                }}
                className="bg-[var(--ide-bg-elevated)] border border-[var(--ide-accent-solid)]/50 rounded px-1.5 py-0.5 text-[0.78rem] text-[var(--ide-text-bright)] outline-none w-[140px]"
              />
              <button
                onClick={handleNameSubmit}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Check className="w-3 h-3 text-emerald-400" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 group cursor-pointer"
              onClick={() => setIsEditingName(true)}
            >
              <span className="text-[0.78rem] text-[var(--ide-text-secondary)] truncate">
                {editName}
              </span>
              <Pencil className="w-2.5 h-2.5 text-[var(--ide-text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Center Command/Search Bar */}
        <div className="flex-1 flex justify-center px-4">
          <div
            className={`relative flex items-center w-full max-w-[400px] h-7 rounded-md transition-all ${
              searchFocused
                ? "bg-[var(--ide-bg-elevated)] border border-[var(--ide-accent-solid)]/50 shadow-sm shadow-[var(--ide-accent-solid)]/10"
                : "bg-[var(--ide-bg-inset)] border border-[var(--ide-border-dim)] hover:border-[var(--ide-border)]"
            }`}
          >
            <Search className="w-3 h-3 text-[var(--ide-text-dim)] ml-2 flex-shrink-0" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="搜索文件、命令、组件..."
              className="flex-1 bg-transparent border-0 outline-none text-[0.72rem] text-[var(--ide-text-secondary)] placeholder:text-[var(--ide-text-dim)] px-2 h-full"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue("")}
                className="mr-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-2.5 h-2.5 text-[var(--ide-text-dim)]" />
              </button>
            )}
            <div className="flex items-center gap-0.5 mr-2 flex-shrink-0">
              <kbd className="px-1 py-0 h-4 rounded bg-[var(--ide-border-faint)] text-[0.55rem] text-[var(--ide-text-dim)] flex items-center justify-center">
                <Command className="w-2.5 h-2.5" />
              </kbd>
              <kbd className="px-1 py-0 h-4 rounded bg-[var(--ide-border-faint)] text-[0.55rem] text-[var(--ide-text-dim)] flex items-center justify-center">
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher compact />

        {/* Model Selector & Connectivity - moved from LeftPanel */}
        <div className="flex items-center gap-1">
          <ModelSelector
            models={models as any}
            providers={providers as any}
            activeModelId={activeModelId}
            activeModel={activeModel as any}
            ollamaStatus={ollamaStatus}
            setActiveModelId={setActiveModelId}
            hasProviderKey={hasProviderKey}
          />
          <ConnectivityIndicator
            activeModel={activeModel as any}
            activeModelId={activeModelId}
            activeFile={""}
            globalConn={undefined}
            getActiveProvider={() => {
              if (!activeModel) return undefined;
              return providers.find((p: any) => p.id === activeModel.providerId);
            }}
            setConnectivityResult={() => {}}
          />
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-[var(--ide-border-dim)]" />

        {/* Right Action Container -整合按钮和图标到右上角 */}
        <div className="flex items-center gap-0.5">
          {/* Toolbar Icons - functional, stay on page */}
          {TOOLBAR_ICONS.map((item) => {
            const isActive =
              (item.action === "share" && shareOpen) ||
              (item.action === "notifications" && notificationOpen) ||
              activeAction === item.action;

            return (
              <button
                key={item.action}
                onClick={() => handleToolClick(item.action)}
                className={`relative w-7 h-7 rounded flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[var(--ide-accent-bg)] ring-1 ring-[var(--ide-accent-solid)]/30"
                    : "hover:bg-white/[0.08]"
                }`}
                title={item.tooltip}
              >
                <item.icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[var(--ide-accent)]" : item.color
                  }`}
                />
                {"badge" in item && item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[0.5rem] rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Separator */}
          <div className="h-4 w-px bg-[var(--ide-border-dim)] mx-0.5" />

          {/* Publish - icon only */}
          <button className="flex items-center justify-center w-7 h-7 bg-gradient-to-r from-[var(--ide-gradient-from)] to-[var(--ide-gradient-to)] text-white rounded-md hover:opacity-90 transition-opacity" title="发布">
            <Rocket className="w-3 h-3" />
          </button>

          {/* Separator */}
          <div className="h-4 w-px bg-[var(--ide-border-dim)] mx-0.5" />

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                showExportMenu
                  ? "bg-[var(--ide-accent-bg)] ring-1 ring-[var(--ide-accent-solid)]/30"
                  : "hover:bg-white/[0.08]"
              }`}
              title="导出项目"
            >
              <Download
                className={`w-4 h-4 ${showExportMenu ? "text-[var(--ide-accent)]" : "text-emerald-400"}`}
              />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-[var(--ide-border)] bg-[var(--ide-bg-elevated)] shadow-xl z-50 py-1 text-[0.72rem]">
                <button
                  onClick={() => {
                    handleExportAsZip();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[var(--ide-text-secondary)] hover:bg-white/5 hover:text-[var(--ide-text-bright)] transition-colors"
                >
                  <FileArchive className="w-3.5 h-3.5 text-sky-400" />
                  导出为 ZIP
                </button>
                <button
                  onClick={() => {
                    handleExportAsJson();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[var(--ide-text-secondary)] hover:bg-white/5 hover:text-[var(--ide-text-bright)] transition-colors"
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-400" />
                  导出为 JSON
                </button>
                <div className="mx-2 my-1 border-t border-[var(--ide-border-faint)]" />
                <div className="px-3 py-1 text-[0.6rem] text-[var(--ide-text-dim)]">
                  {Object.keys(fileContents).length} 个文件
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-[var(--ide-border-dim)] mx-0.5" />

          {/* User */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-sky-400/30 transition-all">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        projectName={editName}
      />
    </>
  );
}
