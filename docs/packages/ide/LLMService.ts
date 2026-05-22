/**
 * @file LLMService.ts
 * @description 真实 LLM API 调用层，统一支持 Ollama / OpenAI / 智谱 GLM / 通义千问 / DeepSeek / 自定义，
 *              采用 OpenAI-compatible chat/completions 接口 + Ollama 原生接口，支持 SSE 流式响应
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.5.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags llm,api,streaming,sse,providers,openai,ollama
 */

export type ProviderId =
  | "ollama"
  | "openai"
  | "zhipu"
  | "dashscope"
  | "deepseek"
  | "custom";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  nameEn: string;
  baseUrl: string;
  authType: "none" | "bearer";
  apiKey?: string;
  models: ProviderModel[];
  isLocal: boolean;
  detected: boolean; // 是否已探测到（Ollama）
  description: string;
  docsUrl: string;
}

export interface ProviderModel {
  id: string; // API model id
  name: string; // 显示名
  type: "llm" | "code" | "vision" | "embedding";
  maxTokens: number;
  contextWindow?: number;
  description?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

// ── Provider 定义 ──

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: "ollama",
    name: "Ollama 本地",
    nameEn: "Ollama Local",
    baseUrl: "http://localhost:11434",
    authType: "none",
    isLocal: true,
    detected: false,
    description: "本地部署的 Ollama 推理服务，自动探测",
    docsUrl: "https://ollama.com",
    models: [], // 动态从 Ollama API 获取
  },
  {
    id: "zhipu",
    name: "智谱 BigModel",
    nameEn: "ZhipuAI GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    authType: "bearer",
    isLocal: false,
    detected: false,
    description: "智谱AI开放平台 — GLM 系列大模型",
    docsUrl: "https://open.bigmodel.cn",
    models: [
      {
        id: "glm-4-plus",
        name: "GLM-4.7 (Plus)",
        type: "llm",
        maxTokens: 4096,
        contextWindow: 128000,
        description: "最强推理能力",
      },
      {
        id: "glm-4-0520",
        name: "GLM-4.6 (0520)",
        type: "llm",
        maxTokens: 4096,
        contextWindow: 128000,
        description: "均衡性能",
      },
      {
        id: "glm-4-flash",
        name: "GLM-4.5 Flash",
        type: "llm",
        maxTokens: 4096,
        contextWindow: 128000,
        description: "高速低价",
      },
      {
        id: "glm-4-long",
        name: "GLM-4 Long",
        type: "llm",
        maxTokens: 4096,
        contextWindow: 1000000,
        description: "超长上下文",
      },
      {
        id: "codegeex-4",
        name: "CodeGeeX-4",
        type: "code",
        maxTokens: 8192,
        contextWindow: 128000,
        description: "代码生成专用",
      },
    ],
  },
  {
    id: "dashscope",
    name: "通义千问",
    nameEn: "Tongyi Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    authType: "bearer",
    isLocal: false,
    detected: false,
    description: "阿里云百炼 DashScope — Qwen 系列，OpenAI 兼容接口",
    docsUrl: "https://dashscope.console.aliyun.com",
    models: [
      {
        id: "qwen-max",
        name: "Qwen3-Max",
        type: "llm",
        maxTokens: 8192,
        contextWindow: 32768,
        description: "最强旗舰模型",
      },
      {
        id: "qwen-plus",
        name: "Qwen3.5-Plus",
        type: "llm",
        maxTokens: 8192,
        contextWindow: 131072,
        description: "均衡高性价比",
      },
      {
        id: "qwen-vl-max",
        name: "Qwen3-VL",
        type: "vision",
        maxTokens: 4096,
        contextWindow: 32768,
        description: "多模态视觉理解",
      },
      {
        id: "qwen-coder-plus",
        name: "Qwen-Coder-Plus",
        type: "code",
        maxTokens: 16384,
        contextWindow: 131072,
        description: "代码专用增强",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    nameEn: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    authType: "bearer",
    isLocal: false,
    detected: false,
    description: "OpenAI GPT 系列模型",
    docsUrl: "https://platform.openai.com",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        type: "llm",
        maxTokens: 4096,
        contextWindow: 128000,
        description: "多模态旗舰",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        type: "llm",
        maxTokens: 4096,
        contextWindow: 128000,
        description: "高效低价",
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        type: "llm",
        maxTokens: 4096,
        contextWindow: 128000,
        description: "高性能推理",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    nameEn: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    authType: "bearer",
    isLocal: false,
    detected: false,
    description: "DeepSeek 开源大模型 API 服务",
    docsUrl: "https://platform.deepseek.com",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek-V3",
        type: "llm",
        maxTokens: 8192,
        contextWindow: 65536,
        description: "通用对话",
      },
      {
        id: "deepseek-coder",
        name: "DeepSeek-Coder",
        type: "code",
        maxTokens: 16384,
        contextWindow: 65536,
        description: "代码生成专用",
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek-R1",
        type: "llm",
        maxTokens: 8192,
        contextWindow: 65536,
        description: "深度推理",
      },
    ],
  },
  {
    id: "custom",
    name: "自定义",
    nameEn: "Custom",
    baseUrl: "",
    authType: "bearer",
    isLocal: false,
    detected: true,
    description: "自定义 OpenAI 兼容接口 / 本地模型服务",
    docsUrl: "",
    models: [],
  },
];

// ── API Key 存储 (localStorage) ──

const KEY_PREFIX = "yyc3_llm_key_";

export function getApiKey(providerId: ProviderId): string {
  try {
    return localStorage.getItem(`${KEY_PREFIX}${providerId}`) || "";
  } catch {
    return "";
  }
}

export function setApiKey(providerId: ProviderId, key: string): void {
  try {
    if (key) {
      localStorage.setItem(`${KEY_PREFIX}${providerId}`, key);
    } else {
      localStorage.removeItem(`${KEY_PREFIX}${providerId}`);
    }
  } catch {}
}

export function hasApiKey(providerId: ProviderId): boolean {
  return !!getApiKey(providerId);
}

// ── Ollama 本地探测 ──

export async function detectOllama(): Promise<{
  available: boolean;
  models: ProviderModel[];
}> {
  try {
    log.info('Attempting to detect Ollama at http://localhost:11434/api/tags');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("http://localhost:11434/api/tags", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    log.info('Ollama response status:', res.status, res.ok);

    if (!res.ok) {
      log.error('Ollama response not OK:', res.status, res.statusText);
      return { available: false, models: [] };
    }

    const data = await res.json();
    log.info('Ollama detected models:', data.models?.length || 0);
    
    const models: ProviderModel[] = (data.models || []).map((m: any) => ({
      id: m.name || m.model,
      name: (m.name || m.model).split(":")[0],
      type: /code|coder|starcoder|deepseek-coder/i.test(m.name)
        ? ("code" as const)
        : ("llm" as const),
      maxTokens: 4096,
      contextWindow: m.details?.parameter_size
        ? parseInt(m.details.parameter_size)
        : undefined,
      description: `${m.details?.family || "Local"} · ${m.details?.parameter_size || "?"}`,
    }));

    return { available: true, models };
  } catch (error) {
    log.error('Ollama detection failed:', error);
    return { available: false, models: [] };
  }
}

// ── 模型连通性测试 ──

export interface ConnectivityTestResult {
  success: boolean;
  latencyMs: number;
  modelId: string;
  providerId: ProviderId;
  reply?: string; // first few chars of the model's reply
  error?: string; // human-readable error reason
  errorCode?: string; // HTTP status or error type
  timestamp: number;
}

/**
 * Send a minimal "ping" message to the model and measure round-trip time.
 * Uses a very short prompt so the response is fast and cheap.
 */
export async function testModelConnectivity(
  provider: ProviderConfig,
  modelId: string,
  options?: { timeoutMs?: number },
): Promise<ConnectivityTestResult> {
  const timeoutMs = options?.timeoutMs ?? 15000;
  const start = Date.now();
  const base: Omit<ConnectivityTestResult, "success" | "latencyMs"> = {
    modelId,
    providerId: provider.id,
    timestamp: Date.now(),
  };

  // 1) For non-Ollama providers, check if API key is configured
  if (provider.authType === "bearer" && !getApiKey(provider.id)) {
    return {
      ...base,
      success: false,
      latencyMs: Date.now() - start,
      error: `未配置 ${provider.name} 的 API Key`,
      errorCode: "NO_API_KEY",
    };
  }

  // 2) Build a minimal chat request
  const endpoint = getChatEndpoint(provider);
  const headers = buildHeaders(provider);

  const body: any = {
    model: modelId,
    messages: [{ role: "user", content: "Hi" }],
    temperature: 0,
    max_tokens: 8,
    stream: false,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      let errBody = "";
      try {
        errBody = await res.text();
      } catch {}
      // Parse common error patterns
      let reason = `HTTP ${res.status}`;
      if (res.status === 401 || res.status === 403) {
        reason = "认证失败 — API Key 无效或已过期";
      } else if (res.status === 404) {
        reason = `模型 "${modelId}" 不存在或端点路径错误`;
      } else if (res.status === 429) {
        reason = "请求频率超限 — 请稍后重试";
      } else if (
        res.status === 500 ||
        res.status === 502 ||
        res.status === 503
      ) {
        reason = `服务端错误 (${res.status}) — 模型服务可能未就绪`;
      } else if (errBody) {
        // Try to extract a short message
        try {
          const parsed = JSON.parse(errBody);
          reason =
            parsed.error?.message || parsed.message || parsed.error || reason;
        } catch {
          reason = errBody.slice(0, 120);
        }
      }
      return {
        ...base,
        success: false,
        latencyMs,
        error: reason,
        errorCode: `HTTP_${res.status}`,
      };
    }

    // Parse response
    const data = await res.json();
    let reply = "";
    if (provider.id === "ollama") {
      reply = data.message?.content || "";
    } else {
      reply = data.choices?.[0]?.message?.content || "";
    }

    return {
      ...base,
      success: true,
      latencyMs,
      reply: reply.slice(0, 50),
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    if (err.name === "AbortError") {
      return {
        ...base,
        success: false,
        latencyMs,
        error: `请求超时 (${(timeoutMs / 1000).toFixed(0)}s) — 模型未响应`,
        errorCode: "TIMEOUT",
      };
    }

    // Network-level errors
    let reason = err.message || "未知网络错误";
    if (/failed to fetch|network|cors|blocked/i.test(reason)) {
      reason = `网络连接失败 — 可能是 CORS 限制或服务未运行 (${provider.baseUrl})`;
    }

    return {
      ...base,
      success: false,
      latencyMs,
      error: reason,
      errorCode: "NETWORK",
    };
  }
}

// ── 获取聊天完成的 endpoint ──

function getChatEndpoint(provider: ProviderConfig): string {
  if (provider.id === "ollama") {
    return `${provider.baseUrl}/api/chat`;
  }
  // 使用代理 URL 避免跨域问题
  if (provider.id === "zhipu") {
    return `/api/zhipu/chat/completions`;
  }
  if (provider.id === "deepseek") {
    return `/api/deepseek/chat/completions`;
  }
  if (provider.id === "dashscope") {
    return `/api/dashscope/chat/completions`;
  }
  if (provider.id === "openai") {
    return `/api/openai/chat/completions`;
  }
  // For custom providers, check if baseUrl already includes the path
  if (provider.id === "custom") {
    const base = provider.baseUrl;
    if (/\/chat\/completions\/?$/i.test(base)) return base;
    if (/\/api\/chat\/?$/i.test(base)) return base;
    if (/\/v1\/?$/i.test(base)) return `${base}/chat/completions`;
    return `${base}/v1/chat/completions`;
  }
  // OpenAI-compatible: openai, dashscope, deepseek
  return `${provider.baseUrl}/chat/completions`;
}

// ── 构建请求 headers ──

function buildHeaders(provider: ProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (provider.authType === "bearer") {
    const key = getApiKey(provider.id);
    if (key) {
      headers["Authorization"] = `Bearer ${key}`;
    }
  }

  return headers;
}

// ── 非流式调用 ──

export async function chatCompletion(
  provider: ProviderConfig,
  modelId: string,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const endpoint = getChatEndpoint(provider);
  const headers = buildHeaders(provider);

  const body: any = {
    model: modelId,
    messages,
    temperature: options?.temperature ?? 0.7,
    stream: false,
  };

  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  // Ollama uses a slightly different format
  if (provider.id === "ollama") {
    body.stream = false;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`[${provider.name}] API 错误 ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Ollama response format
  if (provider.id === "ollama") {
    return data.message?.content || "";
  }

  // OpenAI-compatible format
  return data.choices?.[0]?.message?.content || "";
}

// ── 流式调用 (SSE) ──

export async function chatCompletionStream(
  provider: ProviderConfig,
  modelId: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal },
): Promise<void> {
  const endpoint = getChatEndpoint(provider);
  const headers = buildHeaders(provider);

  const body: any = {
    model: modelId,
    messages,
    temperature: options?.temperature ?? 0.7,
    stream: true,
  };

  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  let res: Response;

  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options?.signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      callbacks.onError("请求已取消");
      return;
    }
    callbacks.onError(`网络错误: ${err.message}`);
    return;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    callbacks.onError(`[${provider.name}] API 错误 ${res.status}: ${errText}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("无法获取响应流");
    return;
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed === ":" || trimmed.startsWith(": ")) continue;

        // Handle Ollama streaming (JSON per line, not SSE)
        if (provider.id === "ollama") {
          try {
            const json = JSON.parse(trimmed);
            const token = json.message?.content || "";
            if (token) {
              fullText += token;
              callbacks.onToken(token);
            }
            if (json.done) {
              callbacks.onDone(fullText);
              return;
            }
          } catch {}
          continue;
        }

        // Standard SSE format: data: {...}
        if (!trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();

        if (dataStr === "[DONE]") {
          callbacks.onDone(fullText);
          return;
        }

        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta;
          const token = delta?.content || "";
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }

          // Check finish_reason
          if (json.choices?.[0]?.finish_reason) {
            // Don't return yet, wait for [DONE]
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    // If we exit the loop without [DONE], still call onDone
    if (fullText) {
      callbacks.onDone(fullText);
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      callbacks.onDone(fullText);
    } else {
      callbacks.onError(`流式读取错误: ${err.message}`);
    }
  } finally {
    reader.releaseLock();
  }
}

// ── 辅助: 从完成文本中提取代码块 ──

export function extractCodeBlock(
  text: string,
): { lang: string; code: string } | null {
  const match = text.match(/```(\w*)\n([\s\S]*?)```/);
  if (match) {
    return {
      lang: match[1] || "tsx",
      code: match[2].trim(),
    };
  }
  return null;
}

// ── AI 语义意图分类 ──

export interface AIIntentResult {
  mode: "designer" | "ai-workspace";
  confidence: number;
  category: string;
  summary: string;
  suggestion: string;
}

const INTENT_SYSTEM_PROMPT = `你是一个用户意图分类器。根据用户输入判断其意图属于以下哪个类别：

A) "designer" — 用户想要 **创建/构建** 某个界面、应用、组件、页面、系统、网站、工具。
   关键信号：帮我做/做一个/搭建/创建/设计/开发、项目类名词（仪表板、管理系统、商城、官网等）

B) "ai-workspace" — 用户想要 **咨询/学习/分析/讨论/调试** 技术问题。
   关键信号：问句、怎么/为什么/什么是、帮我解释/分析/优化、比较/对比、概念性讨论

请严格按以下 JSON 格式回复，不要输出任何其他内容：
{"mode":"designer 或 ai-workspace","confidence":0.0到1.0的数字,"category":"简短分类标签","summary":"一句话总结识别结果","suggestion":"一句话操作建议"}`;

/**
 * Use a real LLM to classify user intent (designer vs ai-workspace).
 * Attempts to find any available provider with a configured API key.
 * Returns null if no provider is available — caller should fall back to regex.
 */
export async function analyzeIntentAI(
  userInput: string,
  options?: { timeoutMs?: number },
): Promise<AIIntentResult | null> {
  const timeoutMs = options?.timeoutMs ?? 8000;

  // Find a usable provider + model from localStorage config
  const provider = findAvailableProvider();
  if (!provider) return null;

  const { config, modelId } = provider;

  try {
    const endpoint = getChatEndpoint(config);
    const headers = buildHeaders(config);

    const body: any = {
      model: modelId,
      messages: [
        { role: "system", content: INTENT_SYSTEM_PROMPT },
        { role: "user", content: userInput },
      ],
      temperature: 0.1,
      max_tokens: 200,
      stream: false,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const data = await res.json();
    let content = "";
    if (config.id === "ollama") {
      content = data.message?.content || "";
    } else {
      content = data.choices?.[0]?.message?.content || "";
    }

    // Parse JSON from response (tolerate markdown code blocks)
    const jsonStr = content
      .replace(/```json\s*/i, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    // Validate
    if (parsed.mode !== "designer" && parsed.mode !== "ai-workspace")
      return null;
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.8;

    return {
      mode: parsed.mode,
      confidence,
      category: parsed.category || "AI 分类",
      summary:
        parsed.summary ||
        (parsed.mode === "designer"
          ? "AI 识别为创建意图"
          : "AI 识别为咨询意图"),
      suggestion: parsed.suggestion || "正在导航到对应工作台",
    };
  } catch {
    return null;
  }
}

/**
 * Find the first available provider that has a configured API key (or is Ollama).
 * Reads from localStorage — usable outside of React context.
 */
function findAvailableProvider(): {
  config: ProviderConfig;
  modelId: string;
} | null {
  // Preferred order: deepseek (cheap+fast) → zhipu → dashscope → openai → ollama
  const preferredOrder: ProviderId[] = [
    "deepseek",
    "zhipu",
    "dashscope",
    "openai",
    "ollama",
  ];

  // Read active model from localStorage
  const activeModelRaw = localStorage.getItem("yyc3_active_model");
  if (activeModelRaw) {
    try {
      const parsed = JSON.parse(activeModelRaw);
      if (parsed.providerId && parsed.modelId) {
        const cfg = PROVIDER_CONFIGS.find((p) => p.id === parsed.providerId);
        if (cfg) {
          const hasKey = cfg.authType === "none" || !!getApiKey(cfg.id);
          if (hasKey)
            return {
              config: { ...cfg, apiKey: getApiKey(cfg.id) },
              modelId: parsed.modelId,
            };
        }
      }
    } catch {}
  }

  // Fallback: scan providers in preferred order
  for (const pid of preferredOrder) {
    const cfg = PROVIDER_CONFIGS.find((p) => p.id === pid);
    if (!cfg) continue;
    const hasKey = cfg.authType === "none" || !!getApiKey(pid);
    if (!hasKey) continue;

    // Pick first model or a default
    const defaultModelId =
      pid === "deepseek"
        ? "deepseek-chat"
        : pid === "zhipu"
          ? "glm-4-flash"
          : pid === "dashscope"
            ? "qwen-turbo"
            : pid === "openai"
              ? "gpt-4o-mini"
              : pid === "ollama"
                ? "llama3.1:8b"
                : "";

    if (defaultModelId) {
      return {
        config: { ...cfg, apiKey: getApiKey(pid) },
        modelId: defaultModelId,
      };
    }
  }

  return null;
}
