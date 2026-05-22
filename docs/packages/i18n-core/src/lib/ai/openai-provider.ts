/**
 * file openai-provider.ts
 * description OpenAI 认证提供者
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
 * brief OpenAI 认证提供者
 */
import { logger } from "../infra/logger.js";
import type {
  AIProvider,
  AIProviderConfig,
  AIProviderInfo,
  TranslationRequest,
  TranslationResponse,
} from "./provider.js";

export class OpenAIProvider implements AIProvider {
  readonly type = "openai" as const;
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private _isReady = false;

  constructor(config?: AIProviderConfig) {
    this.apiKey = config?.apiKey ?? (typeof process !== "undefined" ? process.env?.OPENAI_API_KEY ?? "" : "");
    this.baseUrl = config?.baseUrl ?? "https://api.openai.com/v1";
    this.defaultModel = config?.defaultModel ?? "gpt-4o-mini";
  }

  get isReady(): boolean {
    return this._isReady && !!this.apiKey;
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error("OpenAI API Key not configured. Set OPENAI_API_KEY or pass apiKey.");
    }
    this._isReady = true;
    logger.info("OpenAI provider initialized");
  }

  async validate(): Promise<boolean> {
    return !!this.apiKey;
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    if (!this.isReady) await this.initialize();

    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
    };

    const translatedText = data.choices[0]?.message?.content?.trim() ?? "";

    return {
      translatedText,
      qualityScore: 85,
      provider: "openai",
      model: data.model ?? this.defaultModel,
      cached: false,
    };
  }

  async batchTranslate(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    const results: TranslationResponse[] = [];
    for (const req of requests) {
      results.push(await this.translate(req));
    }
    return results;
  }

  getInfo(): AIProviderInfo {
    return {
      type: "openai",
      displayName: "OpenAI",
      isAvailable: this.isReady,
      isLocal: false,
      models: [this.defaultModel],
      defaultModel: this.defaultModel,
    };
  }

  async dispose(): Promise<void> {
    this._isReady = false;
  }

  private buildSystemPrompt(request: TranslationRequest): string {
    let prompt = `You are a professional translator. Translate from ${request.sourceLocale} to ${request.targetLocale}. Output ONLY the translated text, nothing else.`;
    if (request.style === "formal") prompt += " Use formal language.";
    if (request.style === "technical") prompt += " Use technical terminology accurately.";
    return prompt;
  }

  private buildUserPrompt(request: TranslationRequest): string {
    let prompt = `Translate: ${request.sourceText}`;
    if (request.context) prompt += `\nContext: ${request.context}`;
    if (request.glossary) {
      const terms = Object.entries(request.glossary)
        .map(([k, v]) => `${k} → ${v}`)
        .join(", ");
      prompt += `\nGlossary: ${terms}`;
    }
    return prompt;
  }
}
