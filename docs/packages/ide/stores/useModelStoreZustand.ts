/**
 * @file stores/useModelStoreZustand.ts
 * @description Zustand + Immer AI 模型管理 Store，替代 ModelRegistry Context，
 *              管理模型注册、连通性状态、心跳配置、延迟历史
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,immer,models,ai,connectivity
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { ProviderId, ProviderConfig, ProviderModel } from "../LLMService";

// ===== Types =====
export type ModelType =
  | "llm"
  | "embedding"
  | "vision"
  | "audio"
  | "code"
  | "qa";
export type ModelStatus = "active" | "offline" | "loading" | "error";

export interface ConnectivityResult {
  status: "idle" | "testing" | "success" | "fail";
  latencyMs: number | null;
  error: string | null;
  timestamp: number;
}

export interface LatencyRecord {
  timestamp: number;
  latencyMs: number | null;
  status: "success" | "fail";
  modelId: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerId: ProviderId;
  type: ModelType;
  status: ModelStatus;
  endpoint: string;
  modelId: string;
  apiKey?: string;
  description?: string;
  maxTokens?: number;
  temperature?: number;
  isDetected?: boolean;
  isActive?: boolean;
}

export interface PerfDataPoint {
  modelId: string;
  modelName: string;
  providerId: string;
  latencyMs: number;
  success: boolean;
  timestamp: number;
  source: "heartbeat" | "manual";
}

// ===== Store State =====
interface ModelStoreState {
  // Active model selection
  activeModelId: string;

  // Custom models (user-added, non-provider)
  customModels: AIModel[];

  // Connectivity results (global, keyed by model id)
  connectivityResults: Record<string, ConnectivityResult>;

  // Heartbeat configuration (persisted)
  heartbeatEnabled: boolean;
  heartbeatIntervalMs: number;

  // Latency history for trend chart (last 50 records)
  latencyHistory: LatencyRecord[];

  // Ollama detection state
  ollamaStatus: "checking" | "available" | "unavailable";
  ollamaDetectedModels: ProviderModel[];
  importedOllamaIds: string[];

  // Settings modal visibility
  showSettings: boolean;
}

interface ModelStoreActions {
  // Active model
  setActiveModelId: (id: string) => void;

  // Custom models
  addCustomModel: (
    name: string,
    provider: string,
    endpoint: string,
    apiKey?: string,
  ) => void;
  removeCustomModel: (id: string) => void;
  updateCustomModel: (id: string, updates: Partial<AIModel>) => void;

  // Connectivity
  setConnectivityResult: (modelId: string, result: ConnectivityResult) => void;
  clearConnectivityResults: () => void;

  // Heartbeat
  toggleHeartbeat: (enabled: boolean) => void;
  setHeartbeatIntervalMs: (ms: number) => void;

  // Latency history
  addLatencyRecord: (record: LatencyRecord) => void;
  clearLatencyHistory: () => void;

  // Ollama
  setOllamaStatus: (status: "checking" | "available" | "unavailable") => void;
  setOllamaDetectedModels: (models: ProviderModel[]) => void;
  importOllamaModel: (modelId: string) => void;

  // Settings
  setShowSettings: (show: boolean) => void;

  // Perf data sync to localStorage (for OpsPanel PerfTab)
  syncPerfData: (data: PerfDataPoint) => void;
}

const MAX_LATENCY_HISTORY = 50;

// ===== Zustand Store =====
export const useModelStoreZustand = create<
  ModelStoreState & ModelStoreActions
>()(
  persist(
    immer((set, get) => ({
      // ── Initial state ──
      activeModelId: "",
      customModels: [],
      connectivityResults: {},
      heartbeatEnabled: true,
      heartbeatIntervalMs: 60000,
      latencyHistory: [],
      ollamaStatus: "checking" as const,
      ollamaDetectedModels: [],
      importedOllamaIds: [],
      showSettings: false,

      // ── Actions ──
      setActiveModelId: (id) =>
        set((state) => {
          state.activeModelId = id;
        }),

      addCustomModel: (name, provider, endpoint, apiKey) =>
        set((state) => {
          state.customModels.push({
            id: `custom::${name}-${Date.now()}`,
            name,
            provider,
            providerId: "custom",
            type: "llm",
            status: "active",
            endpoint,
            modelId: name,
            apiKey: apiKey || "",
            description: `自定义 · ${endpoint}`,
            maxTokens: 4096,
            temperature: 0.7,
          });
        }),

      removeCustomModel: (id) =>
        set((state) => {
          state.customModels = state.customModels.filter((m) => m.id !== id);
          if (state.activeModelId === id) {
            state.activeModelId = "";
          }
        }),

      updateCustomModel: (id, updates) =>
        set((state) => {
          const model = state.customModels.find((m) => m.id === id);
          if (model) {
            Object.assign(model, updates);
          }
        }),

      setConnectivityResult: (modelId, result) =>
        set((state) => {
          state.connectivityResults[modelId] = result;
        }),

      clearConnectivityResults: () =>
        set((state) => {
          state.connectivityResults = {};
        }),

      toggleHeartbeat: (enabled) =>
        set((state) => {
          state.heartbeatEnabled = enabled;
        }),

      setHeartbeatIntervalMs: (ms) =>
        set((state) => {
          state.heartbeatIntervalMs = Math.max(10000, Math.min(600000, ms));
        }),

      addLatencyRecord: (record) =>
        set((state) => {
          state.latencyHistory.push(record);
          if (state.latencyHistory.length > MAX_LATENCY_HISTORY) {
            state.latencyHistory =
              state.latencyHistory.slice(-MAX_LATENCY_HISTORY);
          }
        }),

      clearLatencyHistory: () =>
        set((state) => {
          state.latencyHistory = [];
        }),

      setOllamaStatus: (status) =>
        set((state) => {
          state.ollamaStatus = status;
        }),

      setOllamaDetectedModels: (models) =>
        set((state) => {
          state.ollamaDetectedModels = models;
        }),

      importOllamaModel: (modelId) =>
        set((state) => {
          if (!state.importedOllamaIds.includes(modelId)) {
            state.importedOllamaIds.push(modelId);
          }
        }),

      setShowSettings: (show) =>
        set((state) => {
          state.showSettings = show;
        }),

      syncPerfData: (data) => {
        try {
          const PK = "yyc3_model_perf_data";
          const existing = JSON.parse(localStorage.getItem(PK) || "[]");
          existing.push(data);
          localStorage.setItem(PK, JSON.stringify(existing.slice(-200)));
        } catch {}
      },
    })),
    {
      name: "yyc3-model-store",
      // Only persist specific fields
      partialize: (state) => ({
        activeModelId: state.activeModelId,
        customModels: state.customModels,
        heartbeatEnabled: state.heartbeatEnabled,
        heartbeatIntervalMs: state.heartbeatIntervalMs,
        importedOllamaIds: state.importedOllamaIds,
      }),
    },
  ),
);

// ===== Selectors =====
export const selectActiveModelId = (state: ModelStoreState) =>
  state.activeModelId;
export const selectCustomModels = (state: ModelStoreState) =>
  state.customModels;
export const selectConnectivityResults = (state: ModelStoreState) =>
  state.connectivityResults;
export const selectHeartbeatEnabled = (state: ModelStoreState) =>
  state.heartbeatEnabled;
export const selectHeartbeatIntervalMs = (state: ModelStoreState) =>
  state.heartbeatIntervalMs;
export const selectLatencyHistory = (state: ModelStoreState) =>
  state.latencyHistory;
export const selectOllamaStatus = (state: ModelStoreState) =>
  state.ollamaStatus;
export const selectShowSettings = (state: ModelStoreState) =>
  state.showSettings;
