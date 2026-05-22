/**
 * @file stores/useWindowStore.ts
 * @description 窗口管理 Zustand Store — 管理应用多实例窗口的创建、关闭、激活、
 *              位置/尺寸调整，使用 BroadcastChannel 实现跨标签页 IPC 通信
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,window-manager,zustand,broadcast-channel
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppInstance,
  WindowType,
  WindowConfig,
} from "../types/multi-instance";

// ── BroadcastChannel for cross-tab IPC ──
const IPC_CHANNEL_NAME = "yyc3-multi-instance";

function getBroadcastChannel(): BroadcastChannel | null {
  try {
    return new BroadcastChannel(IPC_CHANNEL_NAME);
  } catch {
    return null;
  }
}

interface WindowState {
  instances: AppInstance[];
  activeInstanceId: string | null;
  mainInstanceId: string | null;
}

interface WindowActions {
  createWindow: (type: WindowType, config?: WindowConfig) => AppInstance;
  closeWindow: (windowId: string) => void;
  activateWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  moveWindow: (windowId: string, position: { x: number; y: number }) => void;
  resizeWindow: (
    windowId: string,
    size: { width: number; height: number },
  ) => void;
  updateWindowState: (windowId: string, updates: Partial<AppInstance>) => void;
  getAllWindows: () => AppInstance[];
  getActiveWindow: () => AppInstance | undefined;
  broadcastMessage: (type: string, data: unknown) => void;
}

export const useWindowStore = create<WindowState & WindowActions>()(
  persist(
    (set, get) => ({
      instances: [],
      activeInstanceId: null,
      mainInstanceId: null,

      createWindow: (type, config = {}) => {
        const instanceId = crypto.randomUUID();
        const windowId = `window-${instanceId}`;
        const existingCount = get().instances.length;

        const instance: AppInstance = {
          id: instanceId,
          type: existingCount === 0 ? "main" : "secondary",
          windowId,
          windowType: type,
          title: config.title || `YYC³ - ${type}`,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isMain: existingCount === 0,
          isVisible: true,
          isMinimized: false,
          position: config.position || {
            x: 100 + existingCount * 50,
            y: 100 + existingCount * 50,
          },
          size: config.size || { width: 1200, height: 800 },
          workspaceId: config.workspaceId,
          sessionIds: [],
          state: {},
        };

        set((state) => ({
          instances: [...state.instances, instance],
          activeInstanceId: instance.id,
          mainInstanceId: state.mainInstanceId || instance.id,
        }));

        get().broadcastMessage("instance-created", instance);
        return instance;
      },

      closeWindow: (windowId) => {
        const instance = get().instances.find((i) => i.windowId === windowId);
        set((state) => ({
          instances: state.instances.filter((i) => i.windowId !== windowId),
          activeInstanceId:
            state.activeInstanceId === instance?.id
              ? state.instances.find((i) => i.id !== instance?.id)?.id || null
              : state.activeInstanceId,
        }));
        if (instance) {
          get().broadcastMessage("instance-closed", instance);
        }
      },

      activateWindow: (windowId) => {
        const instance = get().instances.find((i) => i.windowId === windowId);
        if (!instance) return;
        set((state) => ({
          activeInstanceId: instance.id,
          instances: state.instances.map((i) =>
            i.id === instance.id ? { ...i, lastActiveAt: Date.now() } : i,
          ),
        }));
      },

      minimizeWindow: (windowId) => {
        set((state) => ({
          instances: state.instances.map((i) =>
            i.windowId === windowId ? { ...i, isMinimized: true } : i,
          ),
        }));
      },

      restoreWindow: (windowId) => {
        set((state) => ({
          instances: state.instances.map((i) =>
            i.windowId === windowId ? { ...i, isMinimized: false } : i,
          ),
        }));
      },

      moveWindow: (windowId, position) => {
        set((state) => ({
          instances: state.instances.map((i) =>
            i.windowId === windowId ? { ...i, position } : i,
          ),
        }));
      },

      resizeWindow: (windowId, size) => {
        set((state) => ({
          instances: state.instances.map((i) =>
            i.windowId === windowId ? { ...i, size } : i,
          ),
        }));
      },

      updateWindowState: (windowId, updates) => {
        set((state) => ({
          instances: state.instances.map((i) =>
            i.windowId === windowId ? { ...i, ...updates } : i,
          ),
        }));
      },

      getAllWindows: () => get().instances,

      getActiveWindow: () => {
        const { instances, activeInstanceId } = get();
        return instances.find((i) => i.id === activeInstanceId);
      },

      broadcastMessage: (type, data) => {
        const channel = getBroadcastChannel();
        if (channel) {
          channel.postMessage({
            type,
            senderId: get().mainInstanceId,
            data,
            timestamp: Date.now(),
          });
          channel.close();
        }
      },
    }),
    {
      name: "yyc3-window-storage",
      partialize: (state) => ({
        instances: state.instances,
        mainInstanceId: state.mainInstanceId,
      }),
    },
  ),
);
