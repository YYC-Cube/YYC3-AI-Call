/**
 * @file SettingsBridge.ts
 * @description 设置模块与 IDE 核心模块的协同桥接层 —
 *              实现 Settings Store ↔ ModelRegistry / FileStore / LLMService / MCP 的双向数据同步，
 *              包含快捷键全局映射绑定、MCP 运行时注入、规则注入到 AI 系统提示词
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,bridge,sync,keybindings,mcp,rules,integration
 */

import { useSettingsStore } from "./stores/useSettingsStore";
import { setApiKey, type ProviderId, PROVIDER_CONFIGS } from "./LLMService";
import { createLogger } from "./utils/logger";
const log = createLogger("Settings");
import {
  saveJSON,
  SK_MCP_SERVERS,
  SK_PROVIDER_API_KEYS,
} from "./constants/storage-keys";
import { useI18nStore } from "./i18n";
import { SK_THEME } from "./constants/storage-keys";

// ================================================================
// 1. 模型配置同步 — Settings Store ↔ ModelRegistry / LLMService
// ================================================================

/**
 * 从 Settings Store 的 models 配置同步 API Key 到 LLMService 的 localStorage 层
 * 调用时机：Settings 页面保存时、应用启动时
 */
export function syncModelConfigToLLMService(): void {
  const { settings } = useSettingsStore.getState();

  // 同步模型 API Key 到 LLMService 层 (yyc3_llm_key_{providerId})
  for (const model of settings.models) {
    if (model.apiKey && model.enabled) {
      const providerId = mapProviderNameToId(model.provider);
      if (providerId) {
        setApiKey(providerId, model.apiKey);
      }
    }
  }

  // 同步到旧版 yyc3-provider-api-keys 格式 (向后兼容)
  const apiKeyMap: Record<string, string> = {};
  for (const model of settings.models) {
    if (model.apiKey && model.enabled) {
      const pid = mapProviderNameToId(model.provider);
      if (pid) apiKeyMap[pid] = model.apiKey;
    }
  }
  saveJSON(SK_PROVIDER_API_KEYS, apiKeyMap);
}

/**
 * 从 LLMService localStorage 层反向同步模型配置到 Settings Store
 * 调用时机：首次进入 Settings 页面时
 */
export function syncLLMServiceToSettings(): void {
  const store = useSettingsStore.getState();
  const existingModels = store.settings.models;

  // 扫描所有已知 Provider 的 API Key
  for (const providerCfg of PROVIDER_CONFIGS) {
    if (providerCfg.authType === "none") continue;

    let storedKey = "";
    try {
      storedKey = localStorage.getItem(`yyc3_llm_key_${providerCfg.id}`) || "";
    } catch {
      /* ignore */
    }

    if (!storedKey) continue;

    // 检查 Settings 中是否已有该 Provider 的模型配置
    const hasExisting = existingModels.some(
      (m) => mapProviderNameToId(m.provider) === providerCfg.id,
    );

    if (!hasExisting) {
      // 自动从 LLMService 导入到 Settings
      for (const model of providerCfg.models) {
        store.addModel({
          id: `synced-${providerCfg.id}-${model.id}`,
          provider: providerCfg.name,
          model: model.id,
          apiKey: storedKey,
          enabled: true,
        });
      }
    }
  }
}

/**
 * 将 Provider 显示名映射到 ProviderId
 */
function mapProviderNameToId(name: string): ProviderId | null {
  const map: Record<string, ProviderId> = {
    OpenAI: "openai",
    openai: "openai",
    Anthropic: "custom",
    Google: "custom",
    Zhipu: "zhipu",
    "智谱 BigModel": "zhipu",
    Baidu: "dashscope",
    Alibaba: "dashscope",
    通义千问: "dashscope",
    DeepSeek: "deepseek",
    Ollama: "ollama",
    Custom: "custom",
  };
  return map[name] || null;
}

// ================================================================
// 2. MCP 运行时动态注入
// ================================================================

export interface MCPRuntimeEndpoint {
  id: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  projectLevel: boolean;
  type: "market" | "manual";
}

/**
 * 从 Settings Store 获取当前已启用的 MCP 端点列表
 * 供 AI Pipeline 在运行时注入到上下文中
 */
export function getActiveMCPEndpoints(): MCPRuntimeEndpoint[] {
  const { settings } = useSettingsStore.getState();
  return settings.mcpConfigs
    .filter((mcp) => mcp.enabled)
    .map((mcp) => ({
      id: mcp.id,
      name: mcp.name,
      endpoint: mcp.endpoint || "",
      enabled: mcp.enabled,
      projectLevel: mcp.projectLevel,
      type: mcp.type,
    }));
}

/**
 * 将 MCP 配置同步到 localStorage (供 SettingsPage 的 AIModelSettingsSection 读取)
 */
export function syncMCPToStorage(): void {
  const { settings } = useSettingsStore.getState();
  const mcpSummaries = settings.mcpConfigs.map((mcp) => ({
    id: mcp.id,
    name: mcp.name,
    enabled: mcp.enabled,
  }));
  saveJSON(SK_MCP_SERVERS, mcpSummaries);
}

/**
 * 构建 MCP 工具描述文本，注入到 AI System Prompt
 */
export function buildMCPToolsDescription(): string {
  const endpoints = getActiveMCPEndpoints();
  if (endpoints.length === 0) return "";

  const toolList = endpoints
    .map(
      (ep) =>
        `- **${ep.name}** (${ep.type === "market" ? "市场" : "手动"}) → \`${ep.endpoint}\``,
    )
    .join("\n");

  return `
## 可用 MCP 工具

以下 MCP 工具服务已启用，你可以在需要时调用：

${toolList}

当用户请求涉及这些工具能力时，可以建议使用对应的 MCP 工具。`;
}

// ================================================================
// 3. 规则内容注入到 AI 系统提示词
// ================================================================

/**
 * 从 Settings Store 获取所有已启用的规则，构建注入到 System Prompt 的规则文本
 * @param scope 如果指定，仅返回该作用域的规则；不指定则返回所有已启用规则
 */
export function buildRulesPromptInjection(
  scope?: "personal" | "project",
): string {
  const { settings } = useSettingsStore.getState();
  const enabledRules = settings.rules.filter((r) => {
    if (!r.enabled) return false;
    if (scope && r.scope !== scope) return false;
    return true;
  });

  if (enabledRules.length === 0) return "";

  const ruleTexts = enabledRules
    .map(
      (rule, idx) =>
        `${idx + 1}. **${rule.name}** (${rule.scope === "project" ? "项目规则" : "个人规则"})\n   ${rule.content}`,
    )
    .join("\n\n");

  return `
## 编码规则与约束

以下规则必须严格遵守：

${ruleTexts}

请在生成代码时确保符合以上所有规则。`;
}

/**
 * 从 Settings Store 获取所有已启用的技能描述，构建注入到 System Prompt 的技能文本
 */
export function buildSkillsPromptInjection(): string {
  const { settings } = useSettingsStore.getState();
  const enabledSkills = settings.skills.filter((s) => s.enabled);

  if (enabledSkills.length === 0) return "";

  const skillTexts = enabledSkills
    .map((skill) => `- **${skill.name}**: ${skill.content}`)
    .join("\n");

  return `
## 可用技能

你具备以下特殊技能，在相关场景下可以调用：

${skillTexts}`;
}

/**
 * 从 Settings Store 获取当前活跃的智能体配置
 * 如果没有活跃智能体，返回 null
 */
export function getActiveAgentPrompt(): string | null {
  const { settings } = useSettingsStore.getState();
  // 默认使用第一个已启用的智能体
  const activeAgent =
    settings.agents.find((a) => a.isBuiltIn) || settings.agents[0];
  if (!activeAgent) return null;
  return activeAgent.systemPrompt || null;
}

/**
 * 获取完整的设置增强指令（规则 + 技能 + MCP + 智能体提示词），
 * 拼接为一个 customInstructions 字符串传入 AIPipeline
 */
export function getSettingsEnhancedInstructions(): string {
  const parts: string[] = [];

  // 1. 智能体自定义提示词
  const agentPrompt = getActiveAgentPrompt();
  if (agentPrompt) {
    parts.push(`## 智能体角色\n\n${agentPrompt}`);
  }

  // 2. 规则注入
  const rules = buildRulesPromptInjection();
  if (rules) parts.push(rules);

  // 3. 技能注入
  const skills = buildSkillsPromptInjection();
  if (skills) parts.push(skills);

  // 4. MCP 工具注入
  const mcpTools = buildMCPToolsDescription();
  if (mcpTools) parts.push(mcpTools);

  // 5. 导入设置
  const { settings } = useSettingsStore.getState();
  if (settings.importSettings.includeAgentsMD) {
    parts.push("注意：请遵循项目根目录 AGENTS.md 中定义的规则。");
  }
  if (settings.importSettings.includeClaudeMD) {
    parts.push("注意：请遵循项目根目录 CLAUDE.md 中定义的规则。");
  }

  return parts.join("\n\n");
}

// ================================================================
// 4. 快捷键全局映射绑定
// ================================================================

/** 快捷键定义 */
export interface KeybindingDef {
  /** 快捷键字符串 (如 'ctrl+s', 'ctrl+shift+f') */
  keys: string;
  /** 动作标识符 */
  action: string;
  /** 显示名称 */
  label: string;
  /** 分类 */
  category: string;
}

/** 默认快捷键映射 */
const DEFAULT_KEYBINDINGS: KeybindingDef[] = [
  {
    keys: "ctrl+s",
    action: "file.save",
    label: "保存文件",
    category: "编辑器",
  },
  {
    keys: "ctrl+shift+f",
    action: "search.global",
    label: "全局搜索",
    category: "视图切换",
  },
  {
    keys: "ctrl+`",
    action: "terminal.toggle",
    label: "切换终端",
    category: "终端",
  },
  {
    keys: "ctrl+b",
    action: "sidebar.toggle",
    label: "切换侧边栏",
    category: "面板操作",
  },
  {
    keys: "ctrl+1",
    action: "view.preview",
    label: "切换预览视图",
    category: "视图切换",
  },
  {
    keys: "ctrl+2",
    action: "view.code",
    label: "切换代码视图",
    category: "视图切换",
  },
  {
    keys: "ctrl+p",
    action: "file.quickOpen",
    label: "快速打开文件",
    category: "导航",
  },
  {
    keys: "ctrl+shift+p",
    action: "command.palette",
    label: "命令面板",
    category: "命令",
  },
  {
    keys: "escape",
    action: "panel.close",
    label: "关闭面板/弹窗",
    category: "导航",
  },
  {
    keys: "ctrl+/",
    action: "editor.commentLine",
    label: "行注释",
    category: "编辑器",
  },
  { keys: "ctrl+z", action: "editor.undo", label: "撤销", category: "编辑器" },
  {
    keys: "ctrl+shift+z",
    action: "editor.redo",
    label: "重做",
    category: "编辑器",
  },
  {
    keys: "ctrl+f",
    action: "editor.find",
    label: "文件内搜索",
    category: "编辑器",
  },
  {
    keys: "ctrl+h",
    action: "editor.replace",
    label: "替换",
    category: "编辑器",
  },
];

/** 快捷键动作回调注册表 */
const actionHandlers = new Map<string, () => void>();

/**
 * 注册快捷键动作处理函数
 */
export function registerKeybindingAction(
  action: string,
  handler: () => void,
): () => void {
  actionHandlers.set(action, handler);
  return () => {
    actionHandlers.delete(action);
  };
}

/**
 * 获取合并后的快捷键映射（默认 + 自定义覆盖）
 */
export function getEffectiveKeybindings(): KeybindingDef[] {
  const { settings } = useSettingsStore.getState();
  const customBindings = settings.general.customKeybindings;

  if (
    settings.general.keybindingScheme === "vscode" &&
    Object.keys(customBindings).length === 0
  ) {
    return DEFAULT_KEYBINDINGS;
  }

  // 合并：自定义覆盖默认
  return DEFAULT_KEYBINDINGS.map((def) => {
    const customKeys = customBindings[def.action];
    if (customKeys) {
      return { ...def, keys: customKeys };
    }
    return def;
  });
}

/**
 * 解析 KeyboardEvent 为规范化的快捷键字符串
 */
export function normalizeKeyEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("ctrl");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");

  const key = e.key.toLowerCase();
  if (!["control", "shift", "alt", "meta"].includes(key)) {
    parts.push(key === " " ? "space" : key);
  }

  return parts.join("+");
}

/**
 * 全局键盘事件处理器 — 匹配快捷键并执行对应动作
 * 返回清理函数
 */
export function installGlobalKeybindings(): () => void {
  const handler = (e: KeyboardEvent) => {
    // 忽略输入框中的快捷键（除了 Escape 和特定组合键）
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;
    if (isInput && !e.ctrlKey && !e.metaKey && e.key !== "Escape") return;

    const normalized = normalizeKeyEvent(e);
    const bindings = getEffectiveKeybindings();

    for (const binding of bindings) {
      if (binding.keys === normalized) {
        const handler = actionHandlers.get(binding.action);
        if (handler) {
          e.preventDefault();
          e.stopPropagation();
          handler();
          return;
        }
      }
    }
  };

  document.addEventListener("keydown", handler, { capture: true });
  return () =>
    document.removeEventListener("keydown", handler, { capture: true });
}

// ================================================================
// 5. 通用设置同步到 IDE 模块
// ================================================================

/**
 * 将通用设置（编辑器字体、字号等）同步为 CSS 变量
 * 供 Monaco Editor 等组件读取
 */
export function syncGeneralSettingsToCSS(): void {
  const { settings } = useSettingsStore.getState();
  const root = document.documentElement;

  root.style.setProperty("--editor-font-family", settings.general.editorFont);
  root.style.setProperty(
    "--editor-font-size",
    `${settings.general.editorFontSize}px`,
  );
  root.style.setProperty(
    "--editor-word-wrap",
    settings.general.wordWrap ? "on" : "off",
  );
}

/**
 * 将 Settings 中的主题设置同步到 ThemeStore (localStorage SK_THEME)
 * 映射：dark → navy, light → navy (暂无 light 主题), auto → 跟随系统
 */
export function syncThemeToThemeStore(): void {
  const { settings } = useSettingsStore.getState();
  const themeMode = settings.general.theme;
  try {
    // 当前仅有 navy / cyberpunk 两套，dark 映射为 navy
    if (themeMode === "dark" || themeMode === "auto") {
      localStorage.setItem(SK_THEME, "navy");
    }
    // light 也暂用 navy（未来可扩展）
  } catch {
    /* ignore */
  }
}

/**
 * 将 Settings 中的语言设置同步到 i18nStore
 */
export function syncLanguageToI18nStore(): void {
  const { settings } = useSettingsStore.getState();
  const lang = settings.general.language;
  const i18nLocale = useI18nStore.getState().locale;

  // 映射 LanguageCode → SupportedLocale
  const localeMap: Record<string, string> = {
    "zh-CN": "zh-CN",
    "en-US": "en-US",
    "ja-JP": "ja-JP",
  };
  const target = localeMap[lang];
  if (target && target !== i18nLocale) {
    useI18nStore.getState().setLocale(target as "zh-CN" | "en-US" | "ja-JP");
  }
}

/**
 * 反向同步：从 i18nStore / ThemeStore 同步回 Settings Store
 * 调用时机：应用启动时
 */
export function syncExternalStoresToSettings(): void {
  const i18nLocale = useI18nStore.getState().locale;
  const settingsLang = useSettingsStore.getState().settings.general.language;
  if (i18nLocale !== settingsLang) {
    useSettingsStore
      .getState()
      .updateGeneralSettings({
        language: i18nLocale as "zh-CN" | "en-US" | "ja-JP",
      });
  }
}

// ================================================================
// 6. API Key 验证逻辑
// ================================================================

export interface APIKeyValidationResult {
  valid: boolean;
  error?: string;
  latencyMs?: number;
}

/**
 * 验证 API Key 是否有效 — 发送最小化请求测试连通性
 */
export async function validateAPIKey(
  providerId: ProviderId,
  apiKey: string,
  options?: { timeoutMs?: number },
): Promise<APIKeyValidationResult> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const provider = PROVIDER_CONFIGS.find((p) => p.id === providerId);
  if (!provider) return { valid: false, error: "未知的 Provider" };
  if (provider.authType === "none") return { valid: true };
  if (!apiKey) return { valid: false, error: "API Key 不能为空" };

  // 构建测试请求
  const baseUrl = provider.baseUrl;
  
  // 特殊处理不同 Provider 的 endpoint
  // 使用代理 URL 避免跨域问题
  let endpoint = `${baseUrl}/chat/completions`;
  if (providerId === "ollama") {
    endpoint = `${baseUrl}/api/tags`;
  } else if (providerId === "zhipu") {
    endpoint = `/api/zhipu/chat/completions`;
  } else if (providerId === "deepseek") {
    endpoint = `/api/deepseek/chat/completions`;
  } else if (providerId === "dashscope") {
    endpoint = `/api/dashscope/chat/completions`;
  } else if (providerId === "openai") {
    endpoint = `/api/openai/chat/completions`;
  }
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (provider.authType === "bearer") {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  log.info(`Testing ${providerId}:`, {
    endpoint,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey.length,
  });

  try {
    if (providerId === "ollama") {
      // Ollama: 仅测试连通性
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timer);
      return {
        valid: res.ok,
        latencyMs: Date.now() - start,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    }

    // OpenAI-compatible: 发送最小化请求
    const body = JSON.stringify({
      model: provider.models[0]?.id || "gpt-4o-mini",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 1,
      stream: false,
    });

    log.info(`Request body:`, body);

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    log.info(`Response:`, {
      status: res.status,
      ok: res.ok,
      latencyMs,
    });

    if (res.ok) return { valid: true, latencyMs };
    if (res.status === 401 || res.status === 403)
      return { valid: false, error: "API Key 无效或已过期", latencyMs };
    if (res.status === 429)
      return { valid: false, error: "请求频率超限", latencyMs };
    if (res.status === 400)
      return { valid: false, error: "请求参数错误", latencyMs };
    
    // 尝试读取错误响应
    let errorDetail = "";
    try {
      const errText = await res.text();
      errorDetail = errText.substring(0, 200);
      log.info(`Error response:`, errorDetail);
    } catch {
      /* ignore */
    }
    
    return { valid: false, error: `HTTP ${res.status}${errorDetail ? `: ${errorDetail}` : ""}`, latencyMs };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      log.info(`Timeout for ${providerId}`);
      return { valid: false, error: "连接超时" };
    }
    log.error(`Error for ${providerId}:`, err);
    return { valid: false, error: `网络错误: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ================================================================
// 7. MCP 连接测试
// ================================================================

export interface MCPConnectionTestResult {
  connected: boolean;
  latencyMs?: number;
  error?: string;
  capabilities?: string[];
}

/**
 * 测试 MCP 端点连接 — 模拟 Tauri 桥接层调用
 * 在 Web 环境中通过 HTTP 探测，Tauri 环境中可替换为 invoke()
 */
export async function testMCPConnection(
  endpoint: string,
  options?: { timeoutMs?: number },
): Promise<MCPConnectionTestResult> {
  const timeoutMs = options?.timeoutMs ?? 5000;

  // Tauri 环境检测
  const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

  if (isTauri) {
    // Tauri 桥接层：调用 Rust 后端测试 MCP 连接
    try {
      // @ts-expect-error Tauri invoke API
      const result = await window.__TAURI__.invoke("test_mcp_connection", {
        endpoint,
      });
      return {
        connected: result.connected,
        latencyMs: result.latencyMs,
        capabilities: result.capabilities,
        error: result.error,
      };
    } catch (err: unknown) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : "Tauri invoke 失败",
      };
    }
  }

  // Web 环境：HTTP 探测模拟
  if (!endpoint) return { connected: false, error: "端点地址为空" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    // 尝试 HTTP 探测
    const url = endpoint.replace(/^mcp:\/\//, "http://localhost:");
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timer);

    return {
      connected: res.ok || res.status === 405,
      latencyMs: Date.now() - start,
      capabilities: ["tools", "resources"],
    };
  } catch {
    clearTimeout(timer);
    // MCP 协议端点通常不是 HTTP，这里作为模拟返回
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: "MCP 端点不可达（Web 环境仅支持 HTTP 探测）",
    };
  }
}

// ================================================================
// 8. 启动全局设置同步
// ================================================================

/**
 * 启动全局设置同步：订阅 Settings Store 变更，自动同步到各子系统
 * 返回清理函数
 */
export function startSettingsSync(): () => void {
  // 初始同步
  syncModelConfigToLLMService();
  syncMCPToStorage();
  syncGeneralSettingsToCSS();
  syncLanguageToI18nStore();
  syncExternalStoresToSettings();

  // 订阅 Settings Store 变更
  const unsub = useSettingsStore.subscribe((state, prevState) => {
    // 模型配置变更 → 同步到 LLMService
    if (state.settings.models !== prevState.settings.models) {
      syncModelConfigToLLMService();
    }

    // MCP 配置变更 → 同步到 localStorage
    if (state.settings.mcpConfigs !== prevState.settings.mcpConfigs) {
      syncMCPToStorage();
    }

    // 通用设置变更 → 同步 CSS 变量 + 主题 + 语言
    if (state.settings.general !== prevState.settings.general) {
      syncGeneralSettingsToCSS();

      if (state.settings.general.theme !== prevState.settings.general.theme) {
        syncThemeToThemeStore();
      }

      if (
        state.settings.general.language !== prevState.settings.general.language
      ) {
        syncLanguageToI18nStore();
      }
    }
  });

  // 反向订阅：i18nStore 变更 → 同步回 Settings
  const unsubI18n = useI18nStore.subscribe((state) => {
    const settingsLang = useSettingsStore.getState().settings.general.language;
    if (state.locale !== settingsLang) {
      useSettingsStore
        .getState()
        .updateGeneralSettings({
          language: state.locale as "zh-CN" | "en-US" | "ja-JP",
        });
    }
  });

  return () => {
    unsub();
    unsubI18n();
  };
}
