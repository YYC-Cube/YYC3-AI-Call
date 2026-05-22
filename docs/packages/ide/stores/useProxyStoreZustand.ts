/**
 * @file stores/useProxyStoreZustand.ts
 * @description Zustand + Immer 代理配置 Store，管理 CORS 代理设置、
 *              代理模式切换、自定义代理 URL
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,immer,proxy,cors
 */

// ================================================================
// Zustand + Immer ProxyStore — 代理配置状态管理
// ================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { DEFAULT_PROXY_CONFIG, type ProxyConfig } from "../ProxyService";

interface ProxyStoreState {
  config: ProxyConfig;
  healthStatus: "unknown" | "healthy" | "unhealthy" | "checking";
  healthLatencyMs: number | null;
  healthVersion: string | null;
  healthError: string | null;
}

interface ProxyStoreActions {
  updateConfig: (updates: Partial<ProxyConfig>) => void;
  resetConfig: () => void;
  setHealthStatus: (
    status: ProxyStoreState["healthStatus"],
    details?: {
      latencyMs?: number;
      version?: string;
      error?: string;
    },
  ) => void;
}

export const useProxyStoreZustand = create<
  ProxyStoreState & ProxyStoreActions
>()(
  persist(
    immer((set) => ({
      config: { ...DEFAULT_PROXY_CONFIG },
      healthStatus: "unknown",
      healthLatencyMs: null,
      healthVersion: null,
      healthError: null,

      updateConfig: (updates) =>
        set((state) => {
          Object.assign(state.config, updates);
        }),

      resetConfig: () =>
        set((state) => {
          state.config = { ...DEFAULT_PROXY_CONFIG };
          state.healthStatus = "unknown";
          state.healthLatencyMs = null;
          state.healthVersion = null;
          state.healthError = null;
        }),

      setHealthStatus: (status, details) =>
        set((state) => {
          state.healthStatus = status;
          if (details?.latencyMs !== undefined)
            state.healthLatencyMs = details.latencyMs;
          if (details?.version !== undefined)
            state.healthVersion = details.version;
          if (details?.error !== undefined) state.healthError = details.error;
        }),
    })),
    {
      name: "yyc3-proxy-store",
      partialize: (state) => ({
        config: state.config,
      }),
    },
  ),
);
