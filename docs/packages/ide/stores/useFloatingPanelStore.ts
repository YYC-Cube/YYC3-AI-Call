/**
 * @file stores/useFloatingPanelStore.ts
 * @description 浮动面板窗口 Store，支持将面板从布局中分离为独立浮动窗口，
 *              自由拖拽位置、调整大小、最小化/还原、Z-index 管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,floating,panels,windows,wave3
 */

import { create } from "zustand";
import type { PanelId } from "../PanelManager";

// ── Types ──

export interface FloatingPanelConfig {
  id: string;
  panelId: PanelId;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
}

export interface FloatingPanelState {
  floatingPanels: FloatingPanelConfig[];
  nextZIndex: number;

  // Actions
  detachPanel: (panelId: PanelId, x?: number, y?: number) => string;
  attachPanel: (floatingId: string) => PanelId | null;
  movePanel: (floatingId: string, x: number, y: number) => void;
  resizePanel: (floatingId: string, width: number, height: number) => void;
  toggleMinimize: (floatingId: string) => void;
  bringToFront: (floatingId: string) => void;
  isFloating: (panelId: PanelId) => boolean;
  getFloatingPanel: (floatingId: string) => FloatingPanelConfig | undefined;
  closeAll: () => void;
}

let floatCounter = 0;
function genFloatId(): string {
  return `float_${Date.now()}_${++floatCounter}`;
}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 360;

export const useFloatingPanelStore = create<FloatingPanelState>()(
  (set, get) => ({
    floatingPanels: [],
    nextZIndex: 1000,

    detachPanel: (panelId: PanelId, x?: number, y?: number) => {
      const id = genFloatId();
      const zIndex = get().nextZIndex;
      set((state) => ({
        floatingPanels: [
          ...state.floatingPanels,
          {
            id,
            panelId,
            x: x ?? 100 + state.floatingPanels.length * 30,
            y: y ?? 100 + state.floatingPanels.length * 30,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            minimized: false,
            zIndex,
          },
        ],
        nextZIndex: zIndex + 1,
      }));
      return id;
    },

    attachPanel: (floatingId: string) => {
      const panel = get().floatingPanels.find((p) => p.id === floatingId);
      if (!panel) return null;
      set((state) => ({
        floatingPanels: state.floatingPanels.filter((p) => p.id !== floatingId),
      }));
      return panel.panelId;
    },

    movePanel: (floatingId: string, x: number, y: number) => {
      set((state) => ({
        floatingPanels: state.floatingPanels.map((p) =>
          p.id === floatingId ? { ...p, x, y } : p,
        ),
      }));
    },

    resizePanel: (floatingId: string, width: number, height: number) => {
      set((state) => ({
        floatingPanels: state.floatingPanels.map((p) =>
          p.id === floatingId
            ? {
                ...p,
                width: Math.max(240, width),
                height: Math.max(180, height),
              }
            : p,
        ),
      }));
    },

    toggleMinimize: (floatingId: string) => {
      set((state) => ({
        floatingPanels: state.floatingPanels.map((p) =>
          p.id === floatingId ? { ...p, minimized: !p.minimized } : p,
        ),
      }));
    },

    bringToFront: (floatingId: string) => {
      const zIndex = get().nextZIndex;
      set((state) => ({
        floatingPanels: state.floatingPanels.map((p) =>
          p.id === floatingId ? { ...p, zIndex } : p,
        ),
        nextZIndex: zIndex + 1,
      }));
    },

    isFloating: (panelId: PanelId) => {
      return get().floatingPanels.some((p) => p.panelId === panelId);
    },

    getFloatingPanel: (floatingId: string) => {
      return get().floatingPanels.find((p) => p.id === floatingId);
    },

    closeAll: () => {
      set({ floatingPanels: [], nextZIndex: 1000 });
    },
  }),
);
