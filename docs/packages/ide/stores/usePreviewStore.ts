/**
 * @file stores/usePreviewStore.ts
 * @description 实时预览系统 Zustand Store，管理预览模式、设备模拟、控制台日志、
 *              历史快照、缩放、滚动同步、预览引擎切换等状态，支持 localStorage 持久化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,preview,zustand,device-simulation,console,history
 */

// ================================================================
// Preview Store — Zustand store for realtime preview state
// ================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──

export type PreviewMode = "realtime" | "manual" | "delayed" | "smart";
export type DeviceType = "desktop" | "tablet" | "mobile" | "custom";
export type PreviewEngineType = "iframe" | "sandpack";

export interface DevicePreset {
  id: string;
  name: string;
  type: DeviceType;
  width: number;
  height: number;
  userAgent?: string;
  pixelRatio?: number;
}

export interface PreviewSnapshot {
  id: string;
  code: string;
  language: string;
  timestamp: number;
  label?: string;
}

export interface ConsoleEntry {
  id: string;
  level: "log" | "warn" | "error" | "info" | "debug";
  message: string;
  timestamp: number;
  count?: number;
}

export interface PreviewError {
  message: string;
  line?: number;
  column?: number;
  source?: string;
  stack?: string;
}

// ── Device Presets ──

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: "desktop",
    name: "桌面",
    type: "desktop",
    width: 1920,
    height: 1080,
    pixelRatio: 1,
  },
  {
    id: "laptop",
    name: "笔记本",
    type: "desktop",
    width: 1440,
    height: 900,
    pixelRatio: 1,
  },
  {
    id: "ipad-pro",
    name: "iPad Pro",
    type: "tablet",
    width: 1024,
    height: 1366,
    pixelRatio: 2,
  },
  {
    id: "ipad",
    name: "iPad",
    type: "tablet",
    width: 768,
    height: 1024,
    pixelRatio: 2,
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    type: "mobile",
    width: 393,
    height: 852,
    pixelRatio: 3,
  },
  {
    id: "iphone-se",
    name: "iPhone SE",
    type: "mobile",
    width: 375,
    height: 667,
    pixelRatio: 2,
  },
  {
    id: "pixel-7",
    name: "Pixel 7",
    type: "mobile",
    width: 412,
    height: 915,
    pixelRatio: 2.625,
  },
  {
    id: "galaxy-s21",
    name: "Galaxy S21",
    type: "mobile",
    width: 360,
    height: 800,
    pixelRatio: 3,
  },
];

// ── Store ──

export interface PreviewState {
  // Preview mode
  mode: PreviewMode;
  setMode: (mode: PreviewMode) => void;

  // Preview engine
  previewEngine: PreviewEngineType;
  setPreviewEngine: (engine: PreviewEngineType) => void;

  // Auto refresh
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (ms: number) => void;

  // Delay for "delayed" mode
  previewDelay: number;
  setPreviewDelay: (ms: number) => void;

  // Device simulation
  activeDevice: DevicePreset;
  setActiveDevice: (device: DevicePreset) => void;
  customWidth: number;
  customHeight: number;
  setCustomSize: (w: number, h: number) => void;
  showDeviceFrame: boolean;
  setShowDeviceFrame: (show: boolean) => void;

  // Console
  consoleLogs: ConsoleEntry[];
  addConsoleLog: (entry: Omit<ConsoleEntry, "id" | "timestamp">) => void;
  clearConsole: () => void;
  showConsole: boolean;
  setShowConsole: (show: boolean) => void;
  consoleFilter: ConsoleEntry["level"] | "all";
  setConsoleFilter: (filter: ConsoleEntry["level"] | "all") => void;

  // Error state
  previewError: PreviewError | null;
  setPreviewError: (error: PreviewError | null) => void;

  // History
  history: PreviewSnapshot[];
  historyIndex: number;
  addSnapshot: (snapshot: Omit<PreviewSnapshot, "id" | "timestamp">) => void;
  undo: () => void;
  redo: () => void;
  restoreSnapshot: (index: number) => void;
  clearHistory: () => void;

  // UI state
  isUpdating: boolean;
  setIsUpdating: (updating: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  zoom: number;
  setZoom: (zoom: number) => void;

  // Scroll sync
  scrollSyncEnabled: boolean;
  setScrollSyncEnabled: (enabled: boolean) => void;

  // Manual refresh trigger
  refreshCounter: number;
  triggerRefresh: () => void;
}

let entryCounter = 0;

export const usePreviewStore = create<PreviewState>()(
  persist(
    (set, get) => ({
      // Preview mode
      mode: "realtime",
      setMode: (mode) => set({ mode }),

      // Preview engine
      previewEngine: "iframe",
      setPreviewEngine: (previewEngine) => set({ previewEngine }),

      // Auto refresh
      autoRefresh: false,
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      refreshInterval: 3000,
      setRefreshInterval: (refreshInterval) => set({ refreshInterval }),

      // Delay
      previewDelay: 500,
      setPreviewDelay: (previewDelay) => set({ previewDelay }),

      // Device
      activeDevice: DEVICE_PRESETS[0],
      setActiveDevice: (activeDevice) => set({ activeDevice }),
      customWidth: 1024,
      customHeight: 768,
      setCustomSize: (customWidth, customHeight) =>
        set({ customWidth, customHeight }),
      showDeviceFrame: true,
      setShowDeviceFrame: (showDeviceFrame) => set({ showDeviceFrame }),

      // Console
      consoleLogs: [],
      addConsoleLog: (entry) =>
        set((state) => {
          const newEntry: ConsoleEntry = {
            ...entry,
            id: `log_${Date.now()}_${++entryCounter}`,
            timestamp: Date.now(),
          };
          // Keep max 500 entries
          const logs = [...state.consoleLogs, newEntry].slice(-500);
          return { consoleLogs: logs };
        }),
      clearConsole: () => set({ consoleLogs: [] }),
      showConsole: false,
      setShowConsole: (showConsole) => set({ showConsole }),
      consoleFilter: "all",
      setConsoleFilter: (consoleFilter) => set({ consoleFilter }),

      // Error
      previewError: null,
      setPreviewError: (previewError) => set({ previewError }),

      // History
      history: [],
      historyIndex: -1,
      addSnapshot: (snapshot) =>
        set((state) => {
          const newSnapshot: PreviewSnapshot = {
            ...snapshot,
            id: `snap_${Date.now()}_${++entryCounter}`,
            timestamp: Date.now(),
          };
          // Truncate forward history
          const trimmed = state.history.slice(0, state.historyIndex + 1);
          const history = [...trimmed, newSnapshot].slice(-50); // max 50 snapshots
          return { history, historyIndex: history.length - 1 };
        }),
      undo: () =>
        set((state) => ({
          historyIndex: Math.max(0, state.historyIndex - 1),
        })),
      redo: () =>
        set((state) => ({
          historyIndex: Math.min(
            state.history.length - 1,
            state.historyIndex + 1,
          ),
        })),
      restoreSnapshot: (index) =>
        set((state) => ({
          historyIndex: Math.max(0, Math.min(index, state.history.length - 1)),
        })),
      clearHistory: () => set({ history: [], historyIndex: -1 }),

      // UI
      isUpdating: false,
      setIsUpdating: (isUpdating) => set({ isUpdating }),
      showGrid: false,
      setShowGrid: (showGrid) => set({ showGrid }),
      zoom: 100,
      setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),

      // Scroll sync
      scrollSyncEnabled: false,
      setScrollSyncEnabled: (scrollSyncEnabled) => set({ scrollSyncEnabled }),

      // Manual refresh
      refreshCounter: 0,
      triggerRefresh: () =>
        set((s) => ({ refreshCounter: s.refreshCounter + 1 })),
    }),
    {
      name: "yyc3_preview_store",
      partialize: (state) => ({
        mode: state.mode,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        previewDelay: state.previewDelay,
        activeDevice: state.activeDevice,
        showDeviceFrame: state.showDeviceFrame,
        showConsole: state.showConsole,
        showGrid: state.showGrid,
        zoom: state.zoom,
        scrollSyncEnabled: state.scrollSyncEnabled,
        previewEngine: state.previewEngine,
      }),
    },
  ),
);
