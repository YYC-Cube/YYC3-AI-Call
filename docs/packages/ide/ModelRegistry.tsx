/**
 * @file ModelRegistry.tsx
 * @description AI 模型注册中心 Context Provider，基于真实 Provider 动态注册模型，
 *              管理模型选择、连通性检测、心跳监控、延迟历史
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.5.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,models,registry,context,provider,connectivity
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  PROVIDER_CONFIGS,
  detectOllama,
  getApiKey,
  setApiKey as storeApiKey,
  hasApiKey,
  testModelConnectivity,
  type ProviderId,
  type ProviderConfig,
  type ProviderModel,
} from "./LLMService";

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
  modelId: string; // actual API model id
  apiKey?: string; // per-model API key (custom models)
  description?: string;
  maxTokens?: number;
  temperature?: number;
  isDetected?: boolean; // auto-detected (e.g. Ollama import)
  isActive?: boolean; // explicitly activated by user
}

// ===== Context =====
interface ModelRegistryContextType {
  // Models
  models: AIModel[];
  activeModelId: string;
  activeModel: AIModel | undefined;
  setActiveModelId: (id: string) => void;
  addModel: (model: AIModel) => void;
  removeModel: (id: string) => void;
  updateModel: (id: string, updates: Partial<AIModel>) => void;
  getModelsByType: (type: ModelType) => AIModel[];
  getActiveModels: () => AIModel[];
  // Providers
  providers: ProviderConfig[];
  getProvider: (id: ProviderId) => ProviderConfig | undefined;
  getActiveProvider: () => ProviderConfig | undefined;
  // API Key management
  setProviderApiKey: (providerId: ProviderId, key: string) => void;
  getProviderApiKey: (providerId: ProviderId) => string;
  hasProviderKey: (providerId: ProviderId) => boolean;
  // Connectivity state (global)
  connectivityResults: Record<string, ConnectivityResult>;
  setConnectivityResult: (modelId: string, result: ConnectivityResult) => void;
  // Heartbeat
  heartbeatEnabled: boolean;
  toggleHeartbeat: (enabled: boolean) => void;
  heartbeatIntervalMs: number;
  setHeartbeatIntervalMs: (ms: number) => void;
  // Latency history for trend chart
  latencyHistory: LatencyRecord[];
  // Ollama
  ollamaStatus: "checking" | "available" | "unavailable";
  ollamaDetectedModels: ProviderModel[];
  importedOllamaIds: Set<string>;
  importOllamaModel: (model: ProviderModel) => void;
  recheckOllama: () => void;
  // Custom models
  addCustomModel: (
    name: string,
    provider: string,
    endpoint: string,
    apiKey?: string,
  ) => void;
  removeCustomModel: (id: string) => void;
  updateCustomModel: (id: string, updates: Partial<AIModel>) => void;
  // Settings
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  // Model Settings v2 (ModelSettings.tsx)
  showModelSettingsV2: boolean;
  setShowModelSettingsV2: (show: boolean) => void;
}

const ModelRegistryContext = createContext<ModelRegistryContextType | null>(
  null,
);

export function useModelRegistry() {
  const ctx = useContext(ModelRegistryContext);
  if (!ctx) {
    throw new Error(
      "useModelRegistry must be used within ModelRegistryProvider",
    );
  }
  return ctx;
}

export function useModelRegistryOptional() {
  return useContext(ModelRegistryContext);
}

// ===== Build models from providers =====
function buildModelsFromProviders(providers: ProviderConfig[]): AIModel[] {
  const models: AIModel[] = [];

  for (const provider of providers) {
    for (const model of provider.models) {
      const hasKey = provider.authType === "none" || hasApiKey(provider.id);
      const isDetected = provider.id === "ollama" ? provider.detected : true;

      models.push({
        id: `${provider.id}::${model.id}`,
        name: model.name,
        provider: provider.name,
        providerId: provider.id,
        type: model.type as ModelType,
        status: hasKey && isDetected ? "active" : "offline",
        endpoint: provider.baseUrl,
        modelId: model.id,
        description: model.description,
        maxTokens: model.maxTokens,
        temperature: model.type === "code" ? 0.2 : 0.7,
      });
    }
  }

  return models;
}

// ===== Provider =====
export function ModelRegistryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [providers, setProviders] = useState<ProviderConfig[]>(() =>
    PROVIDER_CONFIGS.map((p) => ({ ...p })),
  );
  const [ollamaStatus, setOllamaStatus] = useState<
    "checking" | "available" | "unavailable"
  >("checking");
  const [ollamaDetectedModels, setOllamaDetectedModels] = useState<
    ProviderModel[]
  >([]);
  const [importedOllamaIds, setImportedOllamaIds] = useState<Set<string>>(
    new Set(),
  );
  const [customModels, setCustomModels] = useState<AIModel[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelSettingsV2, setShowModelSettingsV2] = useState(false);
  const ollamaChecked = useRef(false);
  
  useEffect(() => {
    console.log('[ModelRegistry] State changed:', { showSettings, showModelSettingsV2 });
  }, [showSettings, showModelSettingsV2]);

  // Global connectivity results — shared across all panels
  const [connectivityResults, setConnectivityResults] = useState<
    Record<string, ConnectivityResult>
  >({});
  const setConnectivityResult = useCallback(
    (modelId: string, result: ConnectivityResult) => {
      setConnectivityResults((prev) => ({ ...prev, [modelId]: result }));
    },
    [],
  );

  // ── Latency history for trend chart (last 50 records) ──
  const MAX_LATENCY_HISTORY = 50;
  const [latencyHistory, setLatencyHistory] = useState<LatencyRecord[]>([]);

  // ── Heartbeat: auto-ping active model every N seconds ──
  const HEARTBEAT_STORAGE_KEY = "yyc3_heartbeat_enabled";
  const HEARTBEAT_INTERVAL_KEY = "yyc3_heartbeat_interval";
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatMountedRef = useRef(true);

  useEffect(() => {
    heartbeatMountedRef.current = true;
    return () => {
      heartbeatMountedRef.current = false;
    };
  }, []);

  // Heartbeat enabled state — persisted
  const [heartbeatEnabled, setHeartbeatEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HEARTBEAT_STORAGE_KEY) !== "false";
    } catch {
      return true;
    }
  });

  // Heartbeat interval (ms) — persisted, default 60s
  const [heartbeatIntervalMs, setHeartbeatIntervalMsState] = useState<number>(
    () => {
      try {
        const stored = localStorage.getItem(HEARTBEAT_INTERVAL_KEY);
        if (stored) {
          const val = parseInt(stored, 10);
          if (val >= 10000 && val <= 600000) return val;
        }
      } catch {}
      return 60000;
    },
  );

  const toggleHeartbeat = useCallback((enabled: boolean) => {
    setHeartbeatEnabled(enabled);
    try {
      localStorage.setItem(HEARTBEAT_STORAGE_KEY, String(enabled));
    } catch {}
  }, []);

  const setHeartbeatIntervalMs = useCallback((ms: number) => {
    const clamped = Math.max(10000, Math.min(600000, ms));
    setHeartbeatIntervalMsState(clamped);
    try {
      localStorage.setItem(HEARTBEAT_INTERVAL_KEY, String(clamped));
    } catch {}
  }, []);

  // Heartbeat ping function — uses current active model
  const performHeartbeat = useCallback(async () => {
    if (!heartbeatMountedRef.current) return;
    // Read active model & provider at call time
    const model = allModelsRef.current.find(
      (m) => m.id === activeModelIdRef.current,
    );
    if (!model) return;

    const provider = providersRef.current.find(
      (p) => p.id === model.providerId,
    );
    if (!provider) return;
    if (provider.authType === "bearer" && !hasApiKey(provider.id)) return;

    const modelKey = model.id;
    setConnectivityResults((prev) => ({
      ...prev,
      [modelKey]: {
        status: "testing",
        latencyMs: null,
        error: null,
        timestamp: Date.now(),
      },
    }));

    try {
      const result = await testModelConnectivity(provider, model.modelId, {
        timeoutMs: 10000,
      });
      if (!heartbeatMountedRef.current) return;
      setConnectivityResults((prev) => ({
        ...prev,
        [modelKey]: {
          status: result.success ? "success" : "fail",
          latencyMs: result.latencyMs,
          error: result.error || null,
          timestamp: Date.now(),
        },
      }));
      // Add to latency history
      setLatencyHistory((prev) => {
        const newRecord: LatencyRecord = {
          timestamp: Date.now(),
          latencyMs: result.latencyMs,
          status: result.success ? "success" : "fail",
          modelId: model.id,
        };
        return [...prev.slice(-MAX_LATENCY_HISTORY + 1), newRecord];
      });
      // Sync to perf localStorage (used by PerfTab in APIKeySettings)
      try {
        const PK = "yyc3_model_perf_data";
        const existing = JSON.parse(localStorage.getItem(PK) || "[]");
        existing.push({
          modelId: model.id,
          modelName: model.name,
          providerId: model.providerId,
          latencyMs: result.latencyMs,
          success: result.success,
          timestamp: Date.now(),
          source: "heartbeat",
        });
        localStorage.setItem(PK, JSON.stringify(existing.slice(-200)));
      } catch {}
    } catch (err: any) {
      if (!heartbeatMountedRef.current) return;
      setConnectivityResults((prev) => ({
        ...prev,
        [modelKey]: {
          status: "fail",
          latencyMs: null,
          error: err.message || "心跳异常",
          timestamp: Date.now(),
        },
      }));
      // Add to latency history
      setLatencyHistory((prev) => {
        const newRecord: LatencyRecord = {
          timestamp: Date.now(),
          latencyMs: null,
          status: "fail",
          modelId: model.id,
        };
        return [...prev.slice(-MAX_LATENCY_HISTORY + 1), newRecord];
      });
      // Sync to perf localStorage (used by PerfTab in APIKeySettings)
      try {
        const PK = "yyc3_model_perf_data";
        const existing = JSON.parse(localStorage.getItem(PK) || "[]");
        existing.push({
          modelId: model.id,
          modelName: model.name,
          providerId: model.providerId,
          latencyMs: 0,
          success: false,
          timestamp: Date.now(),
          source: "heartbeat",
        });
        localStorage.setItem(PK, JSON.stringify(existing.slice(-200)));
      } catch {}
    }
  }, []);

  // Refs for heartbeat to read latest values
  const allModelsRef = useRef<AIModel[]>([]);
  const activeModelIdRef = useRef("");
  const providersRef = useRef<ProviderConfig[]>([]);

  // Keep refs in sync
  useEffect(() => {
    providersRef.current = providers;
  }, [providers]);

  // Ollama auto-detect on mount
  useEffect(() => {
    if (ollamaChecked.current) return;
    ollamaChecked.current = true;

    setOllamaStatus("checking");
    detectOllama().then(({ available, models }) => {
      console.log('[ModelRegistry] Initial Ollama detection result:', { available, models });
      setOllamaStatus(available ? "available" : "unavailable");
      setProviders((prev) =>
        prev.map((p) =>
          p.id === "ollama"
            ? {
                ...p,
                detected: available,
                models: available ? models : [],
              }
            : p,
        ),
      );
      setOllamaDetectedModels(models);
    }).catch((error) => {
      console.error('[ModelRegistry] Initial Ollama detection error:', error);
      setOllamaStatus("unavailable");
      setOllamaDetectedModels([]);
    });
  }, []);

  const recheckOllama = useCallback(() => {
    console.log('[ModelRegistry] Rechecking Ollama...');
    setOllamaStatus("checking");
    detectOllama().then(({ available, models }) => {
      console.log('[ModelRegistry] Ollama detection result:', { available, models });
      setOllamaStatus(available ? "available" : "unavailable");
      setProviders((prev) =>
        prev.map((p) =>
          p.id === "ollama"
            ? { ...p, detected: available, models: available ? models : [] }
            : p,
        ),
      );
      setOllamaDetectedModels(models);
    }).catch((error) => {
      console.error('[ModelRegistry] Ollama detection error:', error);
      setOllamaStatus("unavailable");
      setOllamaDetectedModels([]);
    });
  }, []);

  // Build models from providers
  const models = useMemo(
    () => buildModelsFromProviders(providers),
    [providers],
  );

  // Combine provider models + custom models
  const allModels = useMemo(
    () => [...models, ...customModels],
    [models, customModels],
  );

  // Find first active model as default (search ALL models including custom)
  const defaultModelId = useMemo(() => {
    const active = allModels.find((m) => m.status === "active");
    return active?.id || allModels[0]?.id || "";
  }, [allModels]);

  const [activeModelId, setActiveModelId] = useState<string>("");

  // Set default active model once models are built — use allModels, not just provider models
  useEffect(() => {
    if (!activeModelId || !allModels.find((m) => m.id === activeModelId)) {
      if (defaultModelId) setActiveModelId(defaultModelId);
    }
  }, [defaultModelId, activeModelId, allModels]);

  const activeModel = useMemo(
    () => allModels.find((m) => m.id === activeModelId),
    [allModels, activeModelId],
  );

  // Sync refs for heartbeat
  useEffect(() => {
    allModelsRef.current = allModels;
  }, [allModels]);
  useEffect(() => {
    activeModelIdRef.current = activeModelId;
  }, [activeModelId]);

  // Heartbeat interval management
  useEffect(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (heartbeatEnabled && activeModelId) {
      heartbeatRef.current = setInterval(performHeartbeat, heartbeatIntervalMs);
    }
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [heartbeatEnabled, activeModelId, performHeartbeat, heartbeatIntervalMs]);

  const addModel = useCallback((model: AIModel) => {
    // Dynamic model addition (for custom endpoints)
    setProviders((prev) => {
      const providerIdx = prev.findIndex((p) => p.id === model.providerId);
      if (providerIdx < 0) return prev;
      const updated = [...prev];
      const provider = { ...updated[providerIdx] };
      if (provider.models.some((m) => m.id === model.modelId)) return prev;
      provider.models = [
        ...provider.models,
        {
          id: model.modelId,
          name: model.name,
          type: model.type as any,
          maxTokens: model.maxTokens || 4096,
          description: model.description,
        },
      ];
      updated[providerIdx] = provider;
      return updated;
    });
  }, []);

  const removeModel = useCallback(
    (id: string) => {
      // Check if it's a custom model first
      if (id.startsWith("custom::")) {
        setCustomModels((prev) => prev.filter((m) => m.id !== id));
      } else {
        const parts = id.split("::");
        const providerId = parts[0];
        const modelId = parts.slice(1).join("::");
        setProviders((prev) =>
          prev.map((p) =>
            p.id === providerId
              ? { ...p, models: p.models.filter((m) => m.id !== modelId) }
              : p,
          ),
        );
      }
      if (activeModelId === id) {
        setActiveModelId(defaultModelId);
      }
    },
    [activeModelId, defaultModelId],
  );

  const updateModel = useCallback((id: string, updates: Partial<AIModel>) => {
    if (id.startsWith("custom::")) {
      setCustomModels((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
    } else {
      // Update provider model name/description if applicable
      const parts = id.split("::");
      const providerId = parts[0];
      const modelId = parts.slice(1).join("::");
      if (updates.name || updates.description) {
        setProviders((prev) =>
          prev.map((p) =>
            p.id === providerId
              ? {
                  ...p,
                  models: p.models.map((m) =>
                    m.id === modelId
                      ? {
                          ...m,
                          ...(updates.name && { name: updates.name }),
                          ...(updates.description && {
                            description: updates.description,
                          }),
                        }
                      : m,
                  ),
                }
              : p,
          ),
        );
      }
    }
  }, []);

  const getModelsByType = useCallback(
    (type: ModelType) => allModels.filter((m) => m.type === type),
    [allModels],
  );

  const getActiveModels = useCallback(
    () => allModels.filter((m) => m.status === "active"),
    [allModels],
  );

  const getProvider = useCallback(
    (id: ProviderId) => providers.find((p) => p.id === id),
    [providers],
  );

  const getActiveProvider = useCallback(() => {
    if (!activeModel) return undefined;
    const prov = providers.find((p) => p.id === activeModel.providerId);

    // For custom models, build a virtual ProviderConfig from the model's endpoint
    if (!prov && activeModel.providerId === "custom" && activeModel.endpoint) {
      const ep = activeModel.endpoint;
      const isOllamaEndpoint =
        /\/api\/(chat|generate)\/?$/i.test(ep) || /localhost:11434/i.test(ep);
      const base = ep
        .replace(/\/api\/(chat|generate)\/?$/i, "")
        .replace(/\/chat\/completions\/?$/i, "")
        .replace(/\/v1\/?$/, "");

      return {
        id: (isOllamaEndpoint ? "ollama" : "custom") as ProviderId,
        name: activeModel.provider || "自定义",
        nameEn: "Custom",
        baseUrl: base,
        authType: (activeModel.apiKey
          ? "bearer"
          : isOllamaEndpoint
            ? "none"
            : "bearer") as "none" | "bearer",
        isLocal: isOllamaEndpoint,
        detected: true,
        description: "",
        docsUrl: "",
        models: [],
      };
    }

    // For custom models that found the "custom" provider config, override baseUrl
    if (prov && activeModel.providerId === "custom" && activeModel.endpoint) {
      const ep = activeModel.endpoint;
      const isOllamaEndpoint =
        /\/api\/(chat|generate)\/?$/i.test(ep) || /localhost:11434/i.test(ep);
      const base = ep
        .replace(/\/api\/(chat|generate)\/?$/i, "")
        .replace(/\/chat\/completions\/?$/i, "")
        .replace(/\/v1\/?$/, "");

      return {
        ...prov,
        id: (isOllamaEndpoint ? "ollama" : "custom") as ProviderId,
        baseUrl: base,
        authType: (activeModel.apiKey
          ? "bearer"
          : isOllamaEndpoint
            ? "none"
            : prov.authType) as "none" | "bearer",
      };
    }

    return prov;
  }, [activeModel, providers]);

  // API Key management
  const setProviderApiKey = useCallback(
    (providerId: ProviderId, key: string) => {
      storeApiKey(providerId, key);
      // Refresh provider status
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p } : p)),
      );
    },
    [],
  );

  const getProviderApiKey = useCallback((providerId: ProviderId) => {
    return getApiKey(providerId);
  }, []);

  const hasProviderKey = useCallback((providerId: ProviderId) => {
    return hasApiKey(providerId);
  }, []);

  const importOllamaModel = useCallback((model: ProviderModel) => {
    setImportedOllamaIds((prev) => new Set([...prev, model.id]));
    // Also add to ollama provider models if not already there
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== "ollama") return p;
        if (p.models.some((m) => m.id === model.id)) return p;
        return { ...p, models: [...p.models, model] };
      }),
    );
  }, []);

  const addCustomModel = useCallback(
    (name: string, provider: string, endpoint: string, apiKey?: string) => {
      const newModel: AIModel = {
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
      };
      setCustomModels((prev) => [...prev, newModel]);
      if (apiKey) {
        storeApiKey("custom", apiKey);
      }
    },
    [],
  );

  const removeCustomModel = useCallback(
    (id: string) => {
      setCustomModels((prev) => prev.filter((m) => m.id !== id));
      if (activeModelId === id) {
        setActiveModelId(defaultModelId);
      }
    },
    [activeModelId, defaultModelId],
  );

  const updateCustomModel = useCallback(
    (id: string, updates: Partial<AIModel>) => {
      setCustomModels((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
    },
    [],
  );

  const ctx = useMemo(
    () => ({
      models: allModels,
      activeModelId,
      activeModel,
      setActiveModelId,
      addModel,
      removeModel,
      updateModel,
      getModelsByType,
      getActiveModels,
      providers,
      getProvider,
      getActiveProvider,
      setProviderApiKey,
      getProviderApiKey,
      hasProviderKey,
      ollamaStatus,
      ollamaDetectedModels,
      importedOllamaIds,
      importOllamaModel,
      recheckOllama,
      addCustomModel,
      removeCustomModel,
      updateCustomModel,
      showSettings,
      setShowSettings,
      showModelSettingsV2,
      setShowModelSettingsV2,
      connectivityResults,
      setConnectivityResult,
      toggleHeartbeat,
      heartbeatEnabled,
      heartbeatIntervalMs,
      setHeartbeatIntervalMs,
      // Latency history for trend chart
      latencyHistory,
    }),
    [
      allModels,
      activeModelId,
      activeModel,
      addModel,
      removeModel,
      updateModel,
      getModelsByType,
      getActiveModels,
      providers,
      getProvider,
      getActiveProvider,
      setProviderApiKey,
      getProviderApiKey,
      hasProviderKey,
      ollamaStatus,
      ollamaDetectedModels,
      importedOllamaIds,
      importOllamaModel,
      recheckOllama,
      addCustomModel,
      removeCustomModel,
      updateCustomModel,
      showSettings,
      showModelSettingsV2,
      connectivityResults,
      setConnectivityResult,
      toggleHeartbeat,
      heartbeatEnabled,
      heartbeatIntervalMs,
      setHeartbeatIntervalMs,
      latencyHistory,
    ],
  );

  return (
    <ModelRegistryContext.Provider value={ctx}>
      {children}
    </ModelRegistryContext.Provider>
  );
}
