/**
 * @file SandpackPreview.tsx
 * @description 基于 Sandpack 的完整 React 应用实时预览面板，
 *              将 FileStore 中的文件实时渲染在 Sandpack 沙箱 iframe 中，
 *              支持设备模拟、控制台、自动重编译
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,sandpack,react,sandbox,live-preview
 */

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewPane,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useFileStore } from "./FileStore";
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Tablet,
  TerminalSquare,
  ExternalLink,
  Eye,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

// ── Types ──

type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

// ── File conversion: FileStore paths → Sandpack paths ──

function toSandpackFiles(
  fileContents: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [path, content] of Object.entries(fileContents)) {
    // Sandpack expects paths starting with /
    const sandpackPath = path.startsWith("/") ? path : `/${path}`;
    result[sandpackPath] = content;
  }

  // Ensure we have an entry point
  if (
    !result["/src/app/App.tsx"] &&
    !result["/App.tsx"] &&
    !result["/src/App.tsx"]
  ) {
    // Find a likely entry file
    const entryKey = Object.keys(result).find(
      (k) =>
        k.includes("App.tsx") ||
        k.includes("App.jsx") ||
        k.includes("index.tsx"),
    );
    if (entryKey) {
      result["/App.tsx"] = result[entryKey];
    }
  }

  return result;
}

function buildSandpackSetup(fileContents: Record<string, string>) {
  const files = toSandpackFiles(fileContents);

  // Build a minimal index that imports the user's App
  // Check which entry file exists
  let appImportPath = "./App";
  if (files["/src/app/App.tsx"]) appImportPath = "./src/app/App";
  else if (files["/src/App.tsx"]) appImportPath = "./src/App";

  // Create bootstrap files if they don't already exist
  if (!files["/index.tsx"] && !files["/src/index.tsx"]) {
    files["/index.tsx"] = `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "${appImportPath}";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`.trim();
  }

  // Minimal package.json for Sandpack
  if (!files["/package.json"]) {
    files["/package.json"] = JSON.stringify(
      {
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "react-router": "^7.0.0",
          "lucide-react": "^0.400.0",
        },
      },
      null,
      2,
    );
  }

  return files;
}

// ── Inner component (has access to Sandpack context) ──

function PreviewToolbar({
  deviceMode,
  onDeviceChange,
  showConsole,
  onToggleConsole,
}: {
  deviceMode: DeviceMode;
  onDeviceChange: (mode: DeviceMode) => void;
  showConsole: boolean;
  onToggleConsole: () => void;
}) {
  const { dispatch, sandpack } = useSandpack();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch({ type: "refresh" });
    setTimeout(() => setRefreshing(false), 600);
  };

  const statusColor =
    sandpack.status === "running"
      ? "bg-emerald-500"
      : sandpack.status === "idle"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="h-8 bg-[var(--ide-bg-dark)] border-b border-[var(--ide-border-faint)] flex items-center px-3 gap-1.5 flex-shrink-0">
      {/* Address Bar */}
      <div className="flex items-center gap-1.5 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-dim)] rounded-full px-3 py-0.5 flex-1 max-w-[300px]">
        <div className={`w-2 h-2 rounded-full ${statusColor} flex-shrink-0`} />
        <span className="text-[0.62rem] text-[var(--ide-text-muted)] truncate">
          localhost:5173
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Device Toggle */}
      <div className="flex items-center gap-0.5 bg-[var(--ide-bg-inset)] rounded p-0.5 border border-[var(--ide-border-faint)]">
        {[
          { mode: "desktop" as const, icon: Monitor, label: "桌面" },
          { mode: "tablet" as const, icon: Tablet, label: "平板" },
          { mode: "mobile" as const, icon: Smartphone, label: "手机" },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onDeviceChange(mode)}
            className={`w-6 h-5 rounded flex items-center justify-center transition-colors ${
              deviceMode === mode
                ? "bg-[var(--ide-border-dim)] text-[var(--ide-accent)]"
                : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)]"
            }`}
            title={label}
          >
            <Icon className="w-3 h-3" />
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="h-3.5 w-px bg-[var(--ide-border-faint)]" />

      {/* Console Toggle */}
      <button
        onClick={onToggleConsole}
        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
          showConsole
            ? "bg-[var(--ide-accent-bg)] text-[var(--ide-accent)]"
            : "text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5"
        }`}
        title="控制台"
      >
        <TerminalSquare className="w-3.5 h-3.5" />
      </button>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        className="w-6 h-6 rounded flex items-center justify-center text-[var(--ide-text-dim)] hover:text-[var(--ide-text-muted)] hover:bg-white/5 transition-colors"
        title="刷新预览"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );
}

// ── Main Component ──

export default function SandpackPreviewPanel() {
  const { fileContents } = useFileStore();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [showConsole, setShowConsole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert FileStore files to Sandpack format
  const sandpackFiles = useMemo(() => {
    try {
      const files = buildSandpackSetup(fileContents);
      setError(null);
      return files;
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件转换失败");
      return {};
    }
  }, [fileContents]);

  // Convert to Sandpack file format (with code property)
  const sandpackFileEntries = useMemo(() => {
    const entries: Record<string, { code: string; active?: boolean }> = {};
    for (const [path, content] of Object.entries(sandpackFiles)) {
      entries[path] = {
        code: content,
        active: path === "/src/app/App.tsx" || path === "/App.tsx",
      };
    }
    return entries;
  }, [sandpackFiles]);

  if (error) {
    return (
      <div className="size-full bg-[var(--ide-bg)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-[0.78rem] text-red-400 mb-1">预览错误</p>
          <p className="text-[0.65rem] text-[var(--ide-text-dim)] max-w-[300px]">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="size-full bg-[var(--ide-bg)] flex items-center justify-center">
        <div className="text-center">
          <Eye className="w-8 h-8 text-sky-500/30 mx-auto mb-2" />
          <p className="text-[0.78rem] text-[var(--ide-text-secondary)]">
            暂无可预览内容
          </p>
          <p className="text-[0.65rem] text-[var(--ide-text-dim)]">
            添加文件后将自动显示预览
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-[var(--ide-bg)] flex flex-col overflow-hidden">
      <SandpackProvider
        template="react-ts"
        files={sandpackFileEntries}
        options={{
          autorun: true,
          autoReload: true,
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
        theme="dark"
      >
        {/* Toolbar */}
        <PreviewToolbar
          deviceMode={deviceMode}
          onDeviceChange={setDeviceMode}
          showConsole={showConsole}
          onToggleConsole={() => setShowConsole(!showConsole)}
        />

        {/* Preview Area */}
        <div
          className="flex-1 min-h-0 flex items-start justify-center overflow-auto bg-[var(--ide-bg-deep)]"
          style={{ padding: deviceMode !== "desktop" ? "16px" : 0 }}
        >
          <div
            style={{
              width: DEVICE_WIDTHS[deviceMode],
              height: deviceMode === "desktop" ? "100%" : "auto",
              minHeight: deviceMode !== "desktop" ? "600px" : undefined,
              maxWidth: "100%",
            }}
            className={
              deviceMode !== "desktop"
                ? "border border-[var(--ide-border)] rounded-lg overflow-hidden shadow-2xl"
                : "h-full"
            }
          >
            <SandpackPreviewPane
              showOpenInCodeSandbox={false}
              showRefreshButton={false}
              style={{
                height: "100%",
                minHeight: deviceMode !== "desktop" ? "600px" : "100%",
              }}
            />
          </div>
        </div>

        {/* Console Panel */}
        {showConsole && (
          <div className="h-[180px] flex-shrink-0 border-t border-[var(--ide-border-faint)]">
            <SandpackConsole style={{ height: "100%" }} showHeader={false} />
          </div>
        )}
      </SandpackProvider>
    </div>
  );
}
