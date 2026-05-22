/**
 * @file stores/usePanelPinStore.ts
 * @description 面板固定/锁定 Store，支持固定面板防止拖拽移动/关闭，
 *              锁定面板防止内容变更，持久化配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,pin,lock,panels,wave3
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──

export interface PanelPinState {
  /** Pinned panels cannot be dragged, closed, or resized */
  pinnedPanels: Set<string>;
  /** Locked panels cannot have their content type changed (replacePanel blocked) */
  lockedPanels: Set<string>;

  // Actions
  togglePin: (nodeId: string) => void;
  toggleLock: (nodeId: string) => void;
  isPinned: (nodeId: string) => boolean;
  isLocked: (nodeId: string) => boolean;
  pinPanel: (nodeId: string) => void;
  unpinPanel: (nodeId: string) => void;
  lockPanel: (nodeId: string) => void;
  unlockPanel: (nodeId: string) => void;
  clearAll: () => void;
}

export const usePanelPinStore = create<PanelPinState>()(
  persist(
    (set, get) => ({
      pinnedPanels: new Set<string>(),
      lockedPanels: new Set<string>(),

      togglePin: (nodeId: string) => {
        set((state) => {
          const next = new Set(state.pinnedPanels);
          if (next.has(nodeId)) {
            next.delete(nodeId);
          } else {
            next.add(nodeId);
          }
          return { pinnedPanels: next };
        });
      },

      toggleLock: (nodeId: string) => {
        set((state) => {
          const next = new Set(state.lockedPanels);
          if (next.has(nodeId)) {
            next.delete(nodeId);
          } else {
            next.add(nodeId);
          }
          return { lockedPanels: next };
        });
      },

      isPinned: (nodeId: string) => get().pinnedPanels.has(nodeId),
      isLocked: (nodeId: string) => get().lockedPanels.has(nodeId),

      pinPanel: (nodeId: string) => {
        set((state) => {
          const next = new Set(state.pinnedPanels);
          next.add(nodeId);
          return { pinnedPanels: next };
        });
      },

      unpinPanel: (nodeId: string) => {
        set((state) => {
          const next = new Set(state.pinnedPanels);
          next.delete(nodeId);
          return { pinnedPanels: next };
        });
      },

      lockPanel: (nodeId: string) => {
        set((state) => {
          const next = new Set(state.lockedPanels);
          next.add(nodeId);
          return { lockedPanels: next };
        });
      },

      unlockPanel: (nodeId: string) => {
        set((state) => {
          const next = new Set(state.lockedPanels);
          next.delete(nodeId);
          return { lockedPanels: next };
        });
      },

      clearAll: () => {
        set({ pinnedPanels: new Set(), lockedPanels: new Set() });
      },
    }),
    {
      name: "yyc3_panel_pins",
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            // Convert arrays back to Sets
            return {
              ...parsed,
              state: {
                ...parsed.state,
                pinnedPanels: new Set(parsed.state.pinnedPanels || []),
                lockedPanels: new Set(parsed.state.lockedPanels || []),
              },
            };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const serializable = {
              ...value,
              state: {
                ...value.state,
                pinnedPanels: Array.from(value.state.pinnedPanels || []),
                lockedPanels: Array.from(value.state.lockedPanels || []),
              },
            };
            localStorage.setItem(name, JSON.stringify(serializable));
          } catch {}
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {}
        },
      },
    },
  ),
);
