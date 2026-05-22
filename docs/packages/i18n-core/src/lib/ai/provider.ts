/**
 * file provider.ts
 * description AI 翻译提供者管理
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief AI 翻译提供者管理
 */
import { logger } from "../infra/logger.js";

export type AIProviderType = "openai" | "ollama" | "anthropic" | "azure" | "custom";

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface TranslationRequest {
  sourceText: string;
  sourceLocale: string;
  targetLocale: string;
  context?: string;
  glossary?: Record<string, string>;
  style?: "formal" | "informal" | "technical";
}

export interface TranslationResponse {
  translatedText: string;
  qualityScore: number;
  provider: AIProviderType;
  model: string;
  cached: boolean;
}

export interface AIProvider {
  readonly type: AIProviderType;
  readonly isReady: boolean;

  initialize(): Promise<void>;
  translate(request: TranslationRequest): Promise<TranslationResponse>;
  batchTranslate(requests: TranslationRequest[]): Promise<TranslationResponse[]>;
  validate(): Promise<boolean>;
  dispose(): Promise<void>;
}

export interface AIProviderInfo {
  type: AIProviderType;
  displayName: string;
  isAvailable: boolean;
  isLocal: boolean;
  models: string[];
  defaultModel?: string;
}

export class AIProviderManager {
  private providers = new Map<AIProviderType, AIProvider>();
  private activeProvider: AIProviderType | null = null;
  private cache = new Map<string, TranslationResponse>();

  constructor(private config?: { preferLocal?: boolean; autoDetect?: boolean }) {}

  register(provider: AIProvider): void {
    this.providers.set(provider.type, provider);
    if (!this.activeProvider) {
      this.activeProvider = provider.type;
    }
    logger.info(`AI provider "${provider.type}" registered`);
  }

  async autoDetect(): Promise<AIProviderInfo[]> {
    const results: AIProviderInfo[] = [];

    for (const [type, provider] of this.providers) {
      try {
        const isValid = await provider.validate();
        if (isValid) {
          await provider.initialize();
          results.push({
            type,
            displayName: type,
            isAvailable: true,
            isLocal: type === "ollama",
            models: [],
          });
        }
      } catch {
        logger.warn(`AI provider "${type}" not available`);
      }
    }

    if (results.length > 0 && this.config?.preferLocal) {
      const local = results.find((r) => r.isLocal);
      if (local) this.activeProvider = local.type;
    }

    return results;
  }

  setActive(type: AIProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`AI provider "${type}" not registered`);
    }
    this.activeProvider = type;
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const cacheKey = `${request.sourceLocale}:${request.targetLocale}:${request.sourceText}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const provider = this.getActiveProvider();
    const result = await provider.translate(request);

    this.cache.set(cacheKey, result);
    return result;
  }

  async batchTranslate(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    const provider = this.getActiveProvider();
    return provider.batchTranslate(requests);
  }

  private getActiveProvider(): AIProvider {
    if (!this.activeProvider) {
      throw new Error("No AI provider registered");
    }
    const provider = this.providers.get(this.activeProvider);
    if (!provider || !provider.isReady) {
      throw new Error(`AI provider "${this.activeProvider}" not ready`);
    }
    return provider;
  }

  getActiveProviderType(): AIProviderType | null {
    return this.activeProvider;
  }

  getRegisteredProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  clearCache(): void {
    this.cache.clear();
  }

  async disposeAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.dispose();
    }
    this.providers.clear();
    this.activeProvider = null;
    this.cache.clear();
  }
}
