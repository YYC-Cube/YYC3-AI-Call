/**
 * @file hooks/useMultiInstanceSync.ts
 * @description 跨标签页多实例自动同步 Hook — 基于 BroadcastChannel + storage 事件
 *              监听其他标签页的 Window/Workspace/Session store 变更，
 *              自动拉取 localStorage 最新状态刷新本地 Zustand store
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,sync,broadcast-channel,storage-event
 */

import { useEffect, useRef } from "react";
import { useWindowStore } from "../stores/useWindowStore";
import { useWorkspaceStore } from "../stores/useWorkspaceStore";
import { useSessionStore } from "../stores/useSessionStore";
import { useIPCStore } from "../stores/useIPCStore";

const SYNC_CHANNEL = "yyc3-store-sync";
const STORAGE_KEYS = {
  window: "yyc3-window-storage",
  workspace: "yyc3-workspace-storage",
  session: "yyc3-session-storage",
} as const;

type SyncMessage = {
  type: "store-updated";
  store: "window" | "workspace" | "session";
  senderId: string;
  timestamp: number;
};

/**
 * Rehydrate a Zustand persisted store from localStorage
 */
function rehydrateFromStorage<T>(
  storageKey: string,
  setter: (data: Partial<T>) => void,
) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    // Zustand persist wraps state in { state: {...}, version: number }
    const state = parsed?.state;
    if (state) {
      setter(state);
    }
  } catch {
    // silently ignore parse errors
  }
}

/**
 * Hook: useMultiInstanceSync
 *
 * Call once at IDE root level. It:
 * 1. Initializes IPC BroadcastChannel
 * 2. Listens for `storage` events (cross-tab localStorage changes)
 * 3. Listens for BroadcastChannel sync messages
 * 4. Broadcasts own store changes to other tabs
 */
export function useMultiInstanceSync() {
  const ipcInstanceId = useIPCStore((s) => s.instanceId);
  const ipcInitialize = useIPCStore((s) => s.initialize);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize IPC channel
  useEffect(() => {
    const cleanup = ipcInitialize();
    return cleanup;
  }, [ipcInitialize]);

  // Setup sync BroadcastChannel + storage event listener
  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel(SYNC_CHANNEL);
      channelRef.current = channel;

      // Handle incoming sync messages from other tabs
      channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        const msg = event.data;
        if (!msg || msg.senderId === ipcInstanceId) return;

        if (msg.type === "store-updated") {
          switch (msg.store) {
            case "window":
              rehydrateFromStorage(STORAGE_KEYS.window, (data: any) => {
                if (data.instances) {
                  useWindowStore.setState({
                    instances: data.instances,
                    mainInstanceId:
                      data.mainInstanceId ??
                      useWindowStore.getState().mainInstanceId,
                  });
                }
              });
              break;
            case "workspace":
              rehydrateFromStorage(STORAGE_KEYS.workspace, (data: any) => {
                if (data.workspaces) {
                  useWorkspaceStore.setState({ workspaces: data.workspaces });
                }
              });
              break;
            case "session":
              rehydrateFromStorage(STORAGE_KEYS.session, (data: any) => {
                if (data.sessions) {
                  useSessionStore.setState({ sessions: data.sessions });
                }
              });
              break;
          }
        }
      };
    } catch {
      // BroadcastChannel not available
    }

    // Also listen for raw storage events (works cross-tab even without BroadcastChannel)
    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;

      if (e.key === STORAGE_KEYS.window) {
        rehydrateFromStorage(STORAGE_KEYS.window, (data: any) => {
          if (data.instances) {
            useWindowStore.setState({ instances: data.instances });
          }
        });
      } else if (e.key === STORAGE_KEYS.workspace) {
        rehydrateFromStorage(STORAGE_KEYS.workspace, (data: any) => {
          if (data.workspaces) {
            useWorkspaceStore.setState({ workspaces: data.workspaces });
          }
        });
      } else if (e.key === STORAGE_KEYS.session) {
        rehydrateFromStorage(STORAGE_KEYS.session, (data: any) => {
          if (data.sessions) {
            useSessionStore.setState({ sessions: data.sessions });
          }
        });
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      channel?.close();
      channelRef.current = null;
    };
  }, [ipcInstanceId]);

  // Subscribe to local store changes and broadcast to other tabs
  useEffect(() => {
    const broadcastChange = (store: SyncMessage["store"]) => {
      try {
        const channel = channelRef.current;
        if (channel) {
          const msg: SyncMessage = {
            type: "store-updated",
            store,
            senderId: ipcInstanceId,
            timestamp: Date.now(),
          };
          channel.postMessage(msg);
        }
      } catch {
        // channel may be closed
      }
    };

    const unsubWindow = useWindowStore.subscribe((state, prev) => {
      if (state.instances !== prev.instances) {
        broadcastChange("window");
      }
    });

    const unsubWorkspace = useWorkspaceStore.subscribe((state, prev) => {
      if (state.workspaces !== prev.workspaces) {
        broadcastChange("workspace");
      }
    });

    const unsubSession = useSessionStore.subscribe((state, prev) => {
      if (state.sessions !== prev.sessions) {
        broadcastChange("session");
      }
    });

    return () => {
      unsubWindow();
      unsubWorkspace();
      unsubSession();
    };
  }, [ipcInstanceId]);
}
