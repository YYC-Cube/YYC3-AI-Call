/**
 * @file left-panel/ModelSelector.tsx
 * @description 模型选择器子组件 — 按 Provider 分组展示可用 AI 模型，
 *              支持快速切换、API Key 配置入口、连通状态指示
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags left-panel,model-selector,provider,ai
 */

import { useState, useMemo } from "react";
import {
  Cloud,
  Server,
  Sparkles,
  Settings2,
} from "lucide-react";
import type { ProviderId } from "../LLMService";

// ── Provider visual config ──

export const PROVIDER_ICONS: Record<
  ProviderId,
  { icon: typeof Server; color: string }
> = {
  ollama: { icon: Server, color: "text-emerald-400" },
  zhipu: { icon: Cloud, color: "text-blue-400" },
  dashscope: { icon: Cloud, color: "text-orange-400" },
  openai: { icon: Cloud, color: "text-slate-300" },
  deepseek: { icon: Cloud, color: "text-sky-400" },
  custom: { icon: Cloud, color: "text-violet-400" },
};

// ── Types ──

export interface ModelSelectorModel {
  id: string;
  name: string;
  type: string;
  status: string;
  provider: string;
  providerId: ProviderId;
  modelId: string;
}

export interface ModelSelectorProvider {
  id: ProviderId;
  name: string;
  nameEn: string;
  baseUrl: string;
  authType: string;
  models: any[];
  isLocal: boolean;
  detected: boolean;
  description: string;
  docsUrl: string;
}

export interface ModelSelectorProps {
  models: ModelSelectorModel[];
  providers: ModelSelectorProvider[];
  activeModelId: string | null;
  activeModel: ModelSelectorModel | null;
  ollamaStatus: string;
  setActiveModelId: (id: string) => void;
  hasProviderKey: (id: ProviderId) => boolean;
}

export default function ModelSelector({
  models,
  providers,
  activeModelId,
  activeModel,
  ollamaStatus,
  setActiveModelId,
  hasProviderKey,
}: ModelSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Group models by provider
  const allGroupedModels = useMemo(() => {
    const grouped = providers
      .map((p) => ({
        provider: p,
        models: models.filter((m) => m.providerId === p.id),
      }))
      .filter((g) => g.models.length > 0);

    const customModels = models.filter((m) => m.providerId === "custom");
    if (
      customModels.length > 0 &&
      !grouped.some((g) => g.provider.id === "custom")
    ) {
      grouped.push({
        provider: {
          id: "custom" as const,
          name: "自定义模型",
          nameEn: "Custom",
          baseUrl: "",
          authType: "none",
          models: [],
          isLocal: false,
          detected: false,
          description: "",
          docsUrl: "",
        },
        models: customModels,
      });
    }
    return grouped;
  }, [models, providers]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-7 h-7 rounded flex items-center justify-center transition-all hover:bg-white/[0.08]"
        title="选择模型"
      >
        {activeModel ? (
          (() => {
            const pi = PROVIDER_ICONS[activeModel.providerId];
            const Icon = pi?.icon || Cloud;
            return (
              <Icon
                className={`w-4 h-4 ${pi?.color || "text-slate-500"}`}
              />
            );
          })()
        ) : (
          <Cloud className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Dropdown - Grouped by provider */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border)] rounded-md shadow-2xl z-40 py-1 max-h-[300px] overflow-y-auto min-w-[200px]">
            {allGroupedModels.length === 0 ? (
              <div className="px-3 py-2 text-[0.6rem] text-slate-600">
                暂无可用模型
              </div>
            ) : (
              <>
              {allGroupedModels.map(({ provider, models: provModels }) => {
              const isOllama = provider.id === "ollama";
              const hasKey =
                provider.authType === "none" || hasProviderKey(provider.id);
              const pi = PROVIDER_ICONS[provider.id];

              return (
                <div key={provider.id}>
                  {/* Provider header */}
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--ide-border-faint)]">
                    {(() => {
                      const Icon = pi?.icon || Cloud;
                      return (
                        <Icon
                          className={`w-3 h-3 ${pi?.color || "text-slate-500"}`}
                        />
                      );
                    })()}
                    <span className="text-[0.58rem] text-slate-500 flex-1">
                      {provider.name}
                    </span>
                    {isOllama ? (
                      <span
                        className={`text-[0.5rem] ${
                          ollamaStatus === "available"
                            ? "text-emerald-400"
                            : "text-slate-700"
                        }`}
                      >
                        {ollamaStatus === "available"
                          ? "本地"
                          : ollamaStatus === "checking"
                            ? "检测中"
                            : "离线"}
                      </span>
                    ) : (
                      <span
                        className={`text-[0.5rem] ${hasKey ? "text-emerald-400" : "text-amber-500"}`}
                      >
                        {hasKey ? "已配置" : "需配置"}
                      </span>
                    )}
                  </div>

                  {/* Models */}
                  {provModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setActiveModelId(model.id);
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-[0.68rem] hover:bg-[var(--ide-border-faint)] transition-colors ${
                        model.id === activeModelId
                          ? "text-sky-400"
                          : "text-slate-400"
                      }`}
                    >
                      <span>{model.name}</span>
                    </button>
                  ))}
                </div>
              );
            })}

            {/* If Ollama has no models */}
            {allGroupedModels.length > 0 && ollamaStatus === "available" &&
              !allGroupedModels.find((g) => g.provider.id === "ollama")?.models.length && (
                <div className="px-3 py-2 text-[0.6rem] text-slate-600">
                  Ollama 已连接但无模型。运行:{" "}
                  <code className="text-amber-400/70">
                    ollama pull llama3
                  </code>
                </div>
              )}
          </>
          )}
      </div>
        </>
        )}
    </div>
  );
}
