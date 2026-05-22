/**
 * @file RealtimePreviewPanel.tsx
 * @description 全功能实时代码预览面板，支持 HTML/CSS/JS/React/Markdown/SVG/JSON
 *              实时预览、设备模拟（8 种预设）、控制台（含级别过滤）、历史快照（含 Diff 对比）、
 *              滚动同步、Sandpack 切换、缩放控制、网格叠加、错误边界等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,realtime,device-simulation,console,history,scroll-sync,sandpack
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  lazy,
  Suspense,
} from "react";
import {
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  TerminalSquare,
  Clock,
  Zap,
  Hand,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  ChevronDown,
  AlertCircle,
  Eye,
  Trash2,
  Info,
  AlertTriangle,
  Bug,
  ChevronRight,
  X,
  Copy,
  Check,
  History,
  Link2,
  Package,
  GitCompareArrows,
} from "lucide-react";
import { useFileStore } from "./FileStore";
import { PanelHeader } from "./PanelManager";
import { copyToClipboard } from "./utils/clipboard";
import {
  buildPreviewHtml,
  detectLanguage,
  type PreviewLanguage,
} from "./PreviewEngine";
import {
  usePreviewStore,
  DEVICE_PRESETS,
  type DevicePreset,
  type ConsoleEntry,
  type PreviewMode,
  type PreviewEngineType,
  type PreviewState,
} from "./stores/usePreviewStore";
import { useScrollSyncStore } from "./stores/useScrollSyncStore";

// Lazy-load heavy components
const SandpackPreviewPanel = lazy(() => import("./SandpackPreview"));
const SnapshotDiffModal = lazy(() => import("./SnapshotDiffModal"));

// ── Mode Icons & Labels ──

const MODE_CONFIG: Record<
  PreviewMode,
  { icon: typeof Zap; label: string; desc: string }
> = {
  realtime: { icon: Zap, label: "实时", desc: "代码修改后立即更新" },
  manual: { icon: Hand, label: "手动", desc: "手动触发更新" },
  delayed: { icon: Clock, label: "延迟", desc: "修改后延迟更新" },
  smart: { icon: Zap, label: "智能", desc: "根据文件类型自动选择" },
};

// ── Device Type Icon ──

function DeviceIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "mobile":
      return <Smartphone className={className} />;
    case "tablet":
      return <Tablet className={className} />;
    default:
      return <Monitor className={className} />;
  }
}

// ── Console Level Colors ──

const CONSOLE_LEVEL_STYLES: Record<ConsoleEntry["level"], string> = {
  log: "text-[#e2e8f0]",
  info: "text-[#38bdf8]",
  warn: "text-[#fbbf24]",
  error: "text-[#f87171]",
  debug: "text-[#a78bfa]",
};

const CONSOLE_LEVEL_ICONS: Record<ConsoleEntry["level"], typeof Info> = {
  log: ChevronRight,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug,
};

// ================================================================
// Main Component
// ================================================================

interface RealtimePreviewPanelProps {
  nodeId: string;
}

function RealtimePreviewPanelInner({ nodeId }: RealtimePreviewPanelProps) {
  const { fileContents, activeFile } = useFileStore();
  const store: PreviewState = usePreviewStore();
  const { publishPreviewScroll, editorScrollRatio, scrollSource } =
    useScrollSyncStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [diffModalState, setDiffModalState] = useState<{
    left: number;
    right: number;
  } | null>(null);

  // Stable ref to track iframe readiness — prevents posting to destroyed ports
  const iframeReadyRef = useRef(false);
  // Ref to track last snapshot code — deduplicates addSnapshot calls
  const lastSnapshotCodeRef = useRef("");

  // Current file code & detected language
  const currentCode = fileContents[activeFile] || "";
  const detectedLanguage = useMemo(
    () => detectLanguage(activeFile),
    [activeFile],
  );

  // Effective preview mode
  const effectiveMode = useMemo<PreviewMode>(() => {
    if (store.mode === "smart") {
      if (currentCode.length > 5000) return "delayed";
      if (detectedLanguage === "tsx" || detectedLanguage === "jsx")
        return "delayed";
      return "realtime";
    }
    return store.mode;
  }, [store.mode, currentCode.length, detectedLanguage]);

  // Build preview HTML
  const previewHtml = useMemo(() => {
    return buildPreviewHtml(currentCode, detectedLanguage, {
      showGrid: store.showGrid,
    });
  }, [currentCode, detectedLanguage, store.showGrid]);

  // ── Update Preview ──

  const doUpdate = useCallback(() => {
    if (!iframeRef.current || store.previewEngine === "sandpack") return;
    const start = performance.now();
    store.setIsUpdating(true);
    store.setPreviewError(null);
    // Mark iframe as not ready — blocks postMessage until re-loaded
    iframeReadyRef.current = false;

    try {
      iframeRef.current.srcdoc = previewHtml.html;
      setIframeLoaded(false);
    } catch (err) {
      store.setPreviewError({
        message: err instanceof Error ? err.message : String(err),
      });
    }

    requestAnimationFrame(() => {
      setLastUpdateTime(Math.round(performance.now() - start));
      store.setIsUpdating(false);
    });
  }, [previewHtml.html, store.previewEngine]);

  // ── Listen for messages from iframe ──

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data.type !== "string") return;
      // Only accept messages from our own iframe
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow)
        return;

      switch (e.data.type) {
        case "preview-console":
          store.addConsoleLog({
            level: e.data.level || "log",
            message: e.data.message || "",
          });
          break;

        case "preview-error":
          store.setPreviewError({
            message: e.data.message || "Unknown error",
            line: e.data.line,
            column: e.data.column,
            source: e.data.source,
            stack: e.data.stack,
          });
          store.addConsoleLog({
            level: "error",
            message: `${e.data.message}${e.data.line ? ` (line ${e.data.line})` : ""}`,
          });
          break;

        case "preview-loaded":
          iframeReadyRef.current = true;
          setIframeLoaded(true);
          store.setIsUpdating(false);
          // 自动捕获快照：每次成功加载预览时记录（去重）
          if (
            currentCode.trim().length > 0 &&
            currentCode !== lastSnapshotCodeRef.current
          ) {
            store.addSnapshot({
              code: currentCode,
              language: detectedLanguage,
              label: activeFile.split("/").pop() || undefined,
            });
            lastSnapshotCodeRef.current = currentCode;
          }
          break;

        case "preview-scroll":
          // Scroll sync: preview → editor
          if (store.scrollSyncEnabled && e.data.scrollHeight > 0) {
            const maxScroll = e.data.scrollHeight - e.data.clientHeight;
            if (maxScroll > 0) {
              publishPreviewScroll(e.data.scrollTop / maxScroll);
            }
          }
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [
    store.scrollSyncEnabled,
    publishPreviewScroll,
    currentCode,
    detectedLanguage,
    activeFile,
  ]);

  // ── Scroll Sync: Editor → Preview (via iframe postMessage) ──

  useEffect(() => {
    if (
      !store.scrollSyncEnabled ||
      scrollSource !== "editor" ||
      !iframeRef.current ||
      !iframeReadyRef.current
    )
      return;
    try {
      iframeRef.current.contentWindow?.postMessage(
        {
          type: "sync-scroll",
          ratio: editorScrollRatio,
        },
        "*",
      );
    } catch {
      // iframe contentWindow may be null during srcdoc transitions — safe to ignore
    }
  }, [editorScrollRatio, store.scrollSyncEnabled, scrollSource]);

  // ── Realtime / Delayed update logic ──

  useEffect(() => {
    if (effectiveMode === "manual" || store.previewEngine === "sandpack")
      return;

    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);

    const delay = effectiveMode === "delayed" ? store.previewDelay : 100;

    updateTimerRef.current = setTimeout(() => {
      doUpdate();
    }, delay);

    return () => {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, [
    currentCode,
    activeFile,
    effectiveMode,
    store.previewDelay,
    store.refreshCounter,
    store.previewEngine,
  ]);

  // ── Auto-refresh timer ──

  useEffect(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    if (
      store.autoRefresh &&
      store.refreshInterval > 0 &&
      store.previewEngine === "iframe"
    ) {
      autoRefreshTimerRef.current = setInterval(() => {
        doUpdate();
      }, store.refreshInterval);
    }

    return () => {
      if (autoRefreshTimerRef.current)
        clearInterval(autoRefreshTimerRef.current);
    };
  }, [store.autoRefresh, store.refreshInterval, doUpdate, store.previewEngine]);

  // Initial render
  useEffect(() => {
    if (store.previewEngine === "iframe") doUpdate();
  }, [store.previewEngine]);

  // ── Handlers ──

  const handleRefresh = useCallback(() => {
    store.clearConsole();
    doUpdate();
  }, [doUpdate]);

  const handleCopyUrl = useCallback(() => {
    copyToClipboard(`preview://${activeFile}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [activeFile]);

  // ── Device dimensions ──

  const deviceWidth = useMemo(() => {
    const d = store.activeDevice;
    if (d.type === "desktop") return "100%";
    return `${d.width}px`;
  }, [store.activeDevice]);

  const deviceHeight = useMemo(() => {
    const d = store.activeDevice;
    if (d.type === "desktop") return "100%";
    return `${d.height}px`;
  }, [store.activeDevice]);

  const isDesktop = store.activeDevice.type === "desktop";

  // ── Filtered console logs ──

  const filteredLogs = useMemo(() => {
    if (store.consoleFilter === "all") return store.consoleLogs;
    return store.consoleLogs.filter((l) => l.level === store.consoleFilter);
  }, [store.consoleLogs, store.consoleFilter]);

  // ── Close menus on outside click ──

  useEffect(() => {
    const handler = () => {
      setShowModeMenu(false);
      setShowDeviceMenu(false);
      setShowSettingsMenu(false);
    };
    if (showModeMenu || showDeviceMenu || showSettingsMenu) {
      setTimeout(() => window.addEventListener("click", handler), 0);
      return () => window.removeEventListener("click", handler);
    }
  }, [showModeMenu, showDeviceMenu, showSettingsMenu]);

  // ── Sandpack vs iframe rendering ──

  const isSandpack = store.previewEngine === "sandpack";

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)] overflow-hidden">
      {/* Panel Header */}
      <PanelHeader
        nodeId={nodeId}
        panelId="preview"
        title="实时预览"
        icon={<Eye className="w-3 h-3" />}
      >
        {/* Engine badge */}
        <span
          className={`ml-2 px-1.5 py-0.5 rounded text-[0.55rem] ${
            isSandpack
              ? "bg-amber-500/15 text-amber-400"
              : "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
          }`}
        >
          {isSandpack ? "Sandpack" : detectedLanguage.toUpperCase()}
        </span>
        {/* Update time */}
        {!isSandpack && lastUpdateTime > 0 && (
          <span className="text-[0.55rem] text-[var(--ide-text-faint)] ml-1">
            {lastUpdateTime}ms
          </span>
        )}
      </PanelHeader>

      {/* Preview Toolbar */}
      <PreviewToolbar
        effectiveMode={effectiveMode}
        showModeMenu={showModeMenu}
        setShowModeMenu={setShowModeMenu}
        showDeviceMenu={showDeviceMenu}
        setShowDeviceMenu={setShowDeviceMenu}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        showHistoryPanel={showHistoryPanel}
        setShowHistoryPanel={setShowHistoryPanel}
        onRefresh={handleRefresh}
        onCopy={handleCopyUrl}
        copied={copied}
        activeFile={activeFile}
        iframeLoaded={iframeLoaded}
        store={store}
        isSandpack={isSandpack}
      />

      {/* Main Preview Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isSandpack ? (
          /* ── Sandpack Engine ── */
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center bg-[var(--ide-bg-deep)]">
                <div className="flex items-center gap-2 text-[var(--ide-text-dim)] text-[0.72rem]">
                  <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <span>加载 Sandpack...</span>
                </div>
              </div>
            }
          >
            <SandpackPreviewPanel />
          </Suspense>
        ) : (
          /* ── iframe Engine ── */
          <>
            <div
              className="flex-1 min-h-0 flex items-start justify-center overflow-auto bg-[var(--ide-bg-deep)]"
              style={{ padding: isDesktop ? 0 : "16px" }}
            >
              <div
                className={`relative ${
                  !isDesktop
                    ? "border border-[var(--ide-border)] rounded-xl overflow-hidden shadow-2xl"
                    : "size-full"
                }`}
                style={{
                  width: deviceWidth,
                  height: isDesktop ? "100%" : "auto",
                  maxWidth: "100%",
                  minHeight: isDesktop ? "100%" : deviceHeight,
                  transform: `scale(${store.zoom / 100})`,
                  transformOrigin: isDesktop ? "top left" : "top center",
                }}
              >
                {!isDesktop && store.showDeviceFrame && (
                  <div className="h-6 bg-[#0a0f1a] flex items-center justify-center gap-1 border-b border-[var(--ide-border-faint)]">
                    <div className="w-12 h-1 bg-[#1e293b] rounded-full" />
                  </div>
                )}

                {store.isUpdating && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 z-10">
                    <div
                      className="h-full bg-[var(--ide-accent)] animate-pulse"
                      style={{ width: "60%" }}
                    />
                  </div>
                )}

                {store.previewError && (
                  <div className="absolute top-0 left-0 right-0 z-20 bg-red-900/90 text-red-200 text-[0.65rem] px-3 py-1.5 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {store.previewError.message}
                    </span>
                    <button
                      onClick={() => store.setPreviewError(null)}
                      className="ml-auto flex-shrink-0 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <iframe
                  ref={iframeRef}
                  className="w-full bg-[#0b1729]"
                  style={{
                    height: isDesktop ? "100%" : deviceHeight,
                    border: "none",
                    display: "block",
                  }}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  title="Preview"
                />
              </div>
            </div>
          </>
        )}

        {/* Console Panel */}
        {store.showConsole && (
          <ConsolePanel
            logs={filteredLogs}
            filter={store.consoleFilter}
            onFilterChange={store.setConsoleFilter}
            onClear={store.clearConsole}
            onClose={() => store.setShowConsole(false)}
          />
        )}

        {/* History Panel */}
        {showHistoryPanel && (
          <HistoryPanel
            history={store.history}
            currentIndex={store.historyIndex}
            onRestore={store.restoreSnapshot}
            onClear={store.clearHistory}
            onClose={() => setShowHistoryPanel(false)}
            onDiff={(left, right) => setDiffModalState({ left, right })}
          />
        )}
      </div>

      {/* Status Bar */}
      <PreviewStatusBar
        activeFile={activeFile}
        language={detectedLanguage}
        mode={effectiveMode}
        device={store.activeDevice}
        zoom={store.zoom}
        logCount={store.consoleLogs.length}
        errorCount={store.consoleLogs.filter((l) => l.level === "error").length}
        isUpdating={store.isUpdating}
        engine={store.previewEngine}
        scrollSync={store.scrollSyncEnabled}
      />

      {/* Snapshot Diff Modal */}
      {diffModalState && store.history.length >= 2 && (
        <Suspense fallback={null}>
          <SnapshotDiffModal
            snapshots={store.history}
            initialLeftIndex={diffModalState.left}
            initialRightIndex={diffModalState.right}
            onClose={() => setDiffModalState(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

// ================================================================
// Preview Toolbar
// ================================================================

interface PreviewToolbarProps {
  effectiveMode: PreviewMode;
  showModeMenu: boolean;
  setShowModeMenu: (v: boolean) => void;
  showDeviceMenu: boolean;
  setShowDeviceMenu: (v: boolean) => void;
  showSettingsMenu: boolean;
  setShowSettingsMenu: (v: boolean) => void;
  showHistoryPanel: boolean;
  setShowHistoryPanel: (v: boolean) => void;
  onRefresh: () => void;
  onCopy: () => void;
  copied: boolean;
  activeFile: string;
  iframeLoaded: boolean;
  store: PreviewState;
  isSandpack: boolean;
}

const PreviewToolbar = memo(({
  effectiveMode,
  showModeMenu,
  setShowModeMenu,
  showDeviceMenu,
  setShowDeviceMenu,
  showSettingsMenu,
  setShowSettingsMenu,
  showHistoryPanel,
  setShowHistoryPanel,
  onRefresh,
  onCopy,
  copied,
  activeFile,
  iframeLoaded,
  store,
  isSandpack,
}: PreviewToolbarProps) => {
  const ModeIcon = MODE_CONFIG[effectiveMode].icon;

  return (
    <div className="h-8 bg-[var(--ide-bg-dark)] border-b border-[var(--ide-border-faint)] flex items-center px-2 gap-1 flex-shrink-0">
      {/* Address bar */}
      <div className="flex items-center gap-1.5 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded-full px-2.5 py-0.5 flex-1 max-w-[220px] min-w-0">
        <div
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            iframeLoaded
              ? "bg-emerald-500"
              : store.isUpdating
                ? "bg-amber-500 animate-pulse"
                : "bg-slate-600"
          }`}
        />
        <span className="text-[0.6rem] text-[var(--ide-text-muted)] truncate">
          {activeFile || "preview://empty"}
        </span>
        <button
          onClick={onCopy}
          className="ml-auto flex-shrink-0 w-4 h-4 flex items-center justify-center hover:text-[var(--ide-text-secondary)]"
          title="复制路径"
        >
          {copied ? (
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          ) : (
            <Copy className="w-2.5 h-2.5 text-[var(--ide-text-faint)]" />
          )}
        </button>
      </div>

      <div className="flex-1" />

      {/* Engine toggle: iframe ↔ Sandpack */}
      <button
        onClick={() =>
          store.setPreviewEngine(isSandpack ? "iframe" : "sandpack")
        }
        className={`h-6 px-1.5 rounded flex items-center gap-1 text-[0.6rem] transition-colors ${
          isSandpack
            ? "bg-amber-500/15 text-amber-400"
            : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
        }`}
        title={
          isSandpack ? "切换到轻量预览" : "切换到 Sandpack (完整 React 环境)"
        }
      >
        <Package className="w-3 h-3" />
        <span className="hidden xl:inline">
          {isSandpack ? "Sandpack" : "轻量"}
        </span>
      </button>

      {/* Separator */}
      <div className="h-3.5 w-px bg-[var(--ide-border-faint)]" />

      {/* Scroll Sync toggle */}
      <button
        onClick={() => store.setScrollSyncEnabled(!store.scrollSyncEnabled)}
        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
          store.scrollSyncEnabled
            ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
            : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
        }`}
        title={store.scrollSyncEnabled ? "关闭滚动同步" : "开启滚动同步"}
      >
        <Link2 className="w-3.5 h-3.5" />
      </button>

      {/* Separator */}
      <div className="h-3.5 w-px bg-[var(--ide-border-faint)]" />

      {/* Preview Mode Selector (hidden when Sandpack) */}
      {!isSandpack && (
        <>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModeMenu(!showModeMenu);
              }}
              className="h-6 px-1.5 rounded flex items-center gap-1 text-[0.6rem] text-[var(--ide-text-muted)] hover:bg-white/5 transition-colors"
              title="预览模式"
            >
              <ModeIcon className="w-3 h-3" />
              <span>{MODE_CONFIG[effectiveMode].label}</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {showModeMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-xl z-50 py-1 min-w-[160px]"
                onClick={(e) => e.stopPropagation()}
              >
                {(Object.keys(MODE_CONFIG) as PreviewMode[]).map((m) => {
                  const cfg = MODE_CONFIG[m];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        store.setMode(m);
                        setShowModeMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[0.65rem] transition-colors ${
                        store.mode === m
                          ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
                          : "text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)]"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <div className="text-left">
                        <div>{cfg.label}</div>
                        <div className="text-[0.55rem] text-[var(--ide-text-dim)]">
                          {cfg.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {store.mode === "delayed" && (
                  <div className="border-t border-[var(--ide-border-faint)] mt-1 pt-1 px-3 pb-1">
                    <label className="text-[0.55rem] text-[var(--ide-text-dim)]">
                      延迟 (ms)
                    </label>
                    <input
                      type="range"
                      min={100}
                      max={3000}
                      step={100}
                      value={store.previewDelay}
                      onChange={(e) =>
                        store.setPreviewDelay(Number(e.target.value))
                      }
                      className="w-full h-1 mt-1"
                    />
                    <div className="text-[0.55rem] text-[var(--ide-text-muted)] text-right">
                      {store.previewDelay}ms
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-3.5 w-px bg-[var(--ide-border-faint)]" />
        </>
      )}

      {/* Device Selector */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeviceMenu(!showDeviceMenu);
          }}
          className="h-6 px-1.5 rounded flex items-center gap-1 text-[0.6rem] text-[var(--ide-text-muted)] hover:bg-white/5 transition-colors"
          title="设备模拟"
        >
          <DeviceIcon type={store.activeDevice.type} className="w-3 h-3" />
          <ChevronDown className="w-2.5 h-2.5" />
        </button>

        {showDeviceMenu && (
          <div
            className="absolute right-0 top-full mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-lg shadow-xl z-50 py-1 min-w-[180px] max-h-[300px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {["desktop", "tablet", "mobile"].map((type) => {
              const devices = DEVICE_PRESETS.filter((d) => d.type === type);
              return (
                <div key={type}>
                  <div className="px-3 py-1 text-[0.55rem] text-[var(--ide-text-dim)] uppercase tracking-wider">
                    {type === "desktop"
                      ? "桌面"
                      : type === "tablet"
                        ? "平板"
                        : "手机"}
                  </div>
                  {devices.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        store.setActiveDevice(d);
                        setShowDeviceMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[0.65rem] transition-colors ${
                        store.activeDevice.id === d.id
                          ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
                          : "text-[var(--ide-text-secondary)] hover:bg-[var(--ide-border-faint)]"
                      }`}
                    >
                      <DeviceIcon type={d.type} className="w-3 h-3" />
                      <span>{d.name}</span>
                      <span className="ml-auto text-[0.55rem] text-[var(--ide-text-dim)]">
                        {d.width}x{d.height}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="h-3.5 w-px bg-[var(--ide-border-faint)]" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => store.setZoom(store.zoom - 10)}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5 transition-colors"
          title="缩小"
          disabled={store.zoom <= 25}
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[0.55rem] text-[var(--ide-text-muted)] w-8 text-center">
          {store.zoom}%
        </span>
        <button
          onClick={() => store.setZoom(store.zoom + 10)}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5 transition-colors"
          title="放大"
          disabled={store.zoom >= 200}
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-[var(--ide-border-faint)]" />

      {/* Grid toggle */}
      <button
        onClick={() => store.setShowGrid(!store.showGrid)}
        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
          store.showGrid
            ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
            : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
        }`}
        title="网格线"
      >
        <Grid3X3 className="w-3.5 h-3.5" />
      </button>

      {/* Console toggle */}
      <button
        onClick={() => store.setShowConsole(!store.showConsole)}
        className={`w-6 h-6 rounded flex items-center justify-center transition-colors relative ${
          store.showConsole
            ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
            : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
        }`}
        title="控制台"
      >
        <TerminalSquare className="w-3.5 h-3.5" />
        {store.consoleLogs.filter((l: ConsoleEntry) => l.level === "error")
          .length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 text-white text-[0.4rem] flex items-center justify-center">
            {Math.min(
              9,
              store.consoleLogs.filter((l: ConsoleEntry) => l.level === "error")
                .length,
            )}
          </span>
        )}
      </button>

      {/* History toggle */}
      <button
        onClick={() => setShowHistoryPanel(!showHistoryPanel)}
        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
          showHistoryPanel
            ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
            : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
        }`}
        title="预览历史"
      >
        <History className="w-3.5 h-3.5" />
      </button>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        className="w-6 h-6 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5 transition-colors"
        title="刷新预览"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${store.isUpdating ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );
});

// ================================================================
// Console Panel
// ================================================================

interface ConsolePanelProps {
  logs: ConsoleEntry[];
  filter: ConsoleEntry["level"] | "all";
  onFilterChange: (f: ConsoleEntry["level"] | "all") => void;
  onClear: () => void;
  onClose: () => void;
}

function ConsolePanel({
  logs,
  filter,
  onFilterChange,
  onClear,
  onClose,
}: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const filterButtons: {
    label: string;
    value: ConsoleEntry["level"] | "all";
  }[] = [
    { label: "全部", value: "all" },
    { label: "Log", value: "log" },
    { label: "Info", value: "info" },
    { label: "Warn", value: "warn" },
    { label: "Error", value: "error" },
  ];

  return (
    <div className="h-[180px] flex-shrink-0 border-t border-[var(--ide-border-faint)] bg-[var(--ide-bg-dark)] flex flex-col">
      <div className="h-7 flex items-center px-2 gap-1 border-b border-[var(--ide-border-faint)] flex-shrink-0">
        <TerminalSquare className="w-3 h-3 text-[var(--ide-text-dim)]" />
        <span className="text-[0.6rem] text-[var(--ide-text-muted)]">
          控制台
        </span>
        <div className="flex items-center gap-0.5 ml-2">
          {filterButtons.map((fb) => (
            <button
              key={fb.value}
              onClick={() => onFilterChange(fb.value)}
              className={`px-1.5 py-0.5 rounded text-[0.55rem] transition-colors ${
                filter === fb.value
                  ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
                  : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)]"
              }`}
            >
              {fb.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={onClear}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
          title="清除"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
          title="关闭"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-[0.65rem] leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--ide-text-dim)] text-[0.62rem]">
            暂无控制台输出
          </div>
        ) : (
          logs.map((entry) => {
            const Icon = CONSOLE_LEVEL_ICONS[entry.level];
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-1.5 px-2 py-1 border-b border-[var(--ide-border-faint)]/50 hover:bg-white/[0.02] ${CONSOLE_LEVEL_STYLES[entry.level]}`}
              >
                <Icon className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-60" />
                <pre className="flex-1 whitespace-pre-wrap break-all m-0 p-0 bg-transparent">
                  {entry.message}
                </pre>
                <span className="text-[0.5rem] text-[var(--ide-text-faint)] flex-shrink-0 mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString("zh-CN", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ================================================================
// History Panel (with Diff button)
// ================================================================

interface HistoryPanelProps {
  history: {
    id: string;
    code: string;
    timestamp: number;
    label?: string;
    language: string;
  }[];
  currentIndex: number;
  onRestore: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
  onDiff: (leftIndex: number, rightIndex: number) => void;
}

function HistoryPanel({
  history,
  currentIndex,
  onRestore,
  onClear,
  onClose,
  onDiff,
}: HistoryPanelProps) {
  const [diffSelect, setDiffSelect] = useState<number | null>(null);

  const handleDiffClick = (idx: number) => {
    if (diffSelect === null) {
      setDiffSelect(idx);
    } else {
      const left = Math.min(diffSelect, idx);
      const right = Math.max(diffSelect, idx);
      if (left !== right) {
        onDiff(left, right);
      }
      setDiffSelect(null);
    }
  };

  return (
    <div className="h-[180px] flex-shrink-0 border-t border-[var(--ide-border-faint)] bg-[var(--ide-bg-dark)] flex flex-col">
      <div className="h-7 flex items-center px-2 gap-1 border-b border-[var(--ide-border-faint)] flex-shrink-0">
        <History className="w-3 h-3 text-[var(--ide-text-dim)]" />
        <span className="text-[0.6rem] text-[var(--ide-text-muted)]">
          预览历史 ({history.length})
        </span>

        {diffSelect !== null && (
          <span className="text-[0.52rem] text-amber-400 ml-1">
            选择第二个快照进行对比...
          </span>
        )}

        <div className="flex-1" />

        {diffSelect !== null && (
          <button
            onClick={() => setDiffSelect(null)}
            className="px-1.5 py-0.5 rounded text-[0.55rem] text-[var(--ide-text-dim)] hover:bg-white/5"
          >
            取消
          </button>
        )}

        <button
          onClick={onClear}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
          title="清除"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--ide-text-dim)] text-[0.62rem]">
            暂无历史记录
          </div>
        ) : (
          history
            .slice()
            .reverse()
            .map((snap, revIdx) => {
              const idx = history.length - 1 - revIdx;
              const isActive = idx === currentIndex;
              const isDiffSelected = diffSelect === idx;
              return (
                <div
                  key={snap.id}
                  className={`flex items-center gap-1 px-2 py-1.5 transition-colors ${
                    isDiffSelected
                      ? "bg-amber-500/10 border-l-2 border-amber-400"
                      : isActive
                        ? "bg-[var(--ide-accent-bg)]"
                        : "hover:bg-[var(--ide-border-faint)]"
                  }`}
                >
                  {/* Diff select button */}
                  <button
                    onClick={() => handleDiffClick(idx)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      isDiffSelected
                        ? "text-amber-400 bg-amber-500/20"
                        : "text-[var(--ide-text-faint)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
                    }`}
                    title={
                      diffSelect === null
                        ? "选择此快照进行差异对比"
                        : "与此快照对比"
                    }
                  >
                    <GitCompareArrows className="w-3 h-3" />
                  </button>

                  {/* Restore button (the main content) */}
                  <button
                    onClick={() => onRestore(idx)}
                    className={`flex-1 flex items-center gap-2 text-left min-w-0 ${
                      isActive
                        ? "text-[var(--ide-accent)]"
                        : "text-[var(--ide-text-secondary)]"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-[var(--ide-accent)]" : "bg-[var(--ide-border)]"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.62rem] truncate">
                        {snap.label || `快照 #${idx + 1}`}
                      </div>
                      <div className="text-[0.52rem] text-[var(--ide-text-dim)]">
                        {new Date(snap.timestamp).toLocaleString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                        {" - "}
                        {snap.language.toUpperCase()}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

// ================================================================
// Status Bar
// ================================================================

interface PreviewStatusBarProps {
  activeFile: string;
  language: PreviewLanguage;
  mode: PreviewMode;
  device: DevicePreset;
  zoom: number;
  logCount: number;
  errorCount: number;
  isUpdating: boolean;
  engine: PreviewEngineType;
  scrollSync: boolean;
}

function PreviewStatusBar({
  activeFile,
  language,
  mode,
  device,
  zoom,
  logCount,
  errorCount,
  isUpdating,
  engine,
  scrollSync,
}: PreviewStatusBarProps) {
  return (
    <div className="h-5 bg-[var(--ide-bg-surface)] border-t border-[var(--ide-border-faint)] flex items-center px-2 gap-3 text-[0.52rem] text-[var(--ide-text-dim)] flex-shrink-0">
      <div className="flex items-center gap-1">
        <div
          className={`w-1.5 h-1.5 rounded-full ${isUpdating ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
        />
        <span>{isUpdating ? "更新中..." : "就绪"}</span>
      </div>

      <span className="truncate max-w-[120px]" title={activeFile}>
        {activeFile.split("/").pop()}
      </span>

      <span className="uppercase">{language}</span>

      <span>
        {engine === "sandpack" ? "Sandpack" : `${MODE_CONFIG[mode].label  }模式`}
      </span>

      {scrollSync && (
        <span className="flex items-center gap-0.5 text-[var(--ide-accent)]">
          <Link2 className="w-2.5 h-2.5" />
          同步
        </span>
      )}

      <div className="flex-1" />

      <span>{device.name}</span>
      <span>{zoom}%</span>

      <div className="flex items-center gap-1">
        <TerminalSquare className="w-2.5 h-2.5" />
        <span>{logCount}</span>
      </div>

      {errorCount > 0 && (
        <div className="flex items-center gap-1 text-red-400">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>{errorCount}</span>
        </div>
      )}
    </div>
  );
}

// ── Export ──

const RealtimePreviewPanel = memo(RealtimePreviewPanelInner);
export default RealtimePreviewPanel;
