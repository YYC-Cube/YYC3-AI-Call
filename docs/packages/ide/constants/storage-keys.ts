/**
 * @file constants/storage-keys.ts
 * @description 统一管理所有 localStorage 键名，命名规范 yyc3_{module}_{key}
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags constants,storage,localStorage,keys
 */

// ================================================================
// Storage Keys — 统一管理所有 localStorage 键名
// ================================================================
//
// 命名规范：
//   前缀：yyc3_
//   分隔符：下划线 _
//   格式：yyc3_{module}_{key}
//
// 注意：部分遗留键使用连字符 (yyc3-xxx)，新键一律使用下划线。
// 清除缓存时需同时匹配两种前缀。
// ================================================================

/** 应用统一前缀 */
export const STORAGE_PREFIX = "yyc3";

/** 匹配所有应用 localStorage 键的前缀列表 */
export const STORAGE_PREFIXES = ["yyc3_", "yyc3-"] as const;

// ── 主题系统 ──
export const SK_THEME = "yyc3-theme";
export const SK_CUSTOM_THEMES = "yyc3_custom_themes";
export const SK_ACTIVE_THEME_ID = "yyc3_active_theme_id";
export const SK_THEME_VERSIONS = "yyc3_theme_versions";

// ── 模型 / Provider ──
export const SK_PROVIDER_API_KEYS = "yyc3-provider-api-keys";
export const SK_PROVIDER_URLS = "yyc3-provider-urls";
export const SK_CUSTOM_PROVIDERS = "yyc3-custom-providers";
export const SK_MCP_SERVERS = "yyc3-mcp-servers";
export const SK_MODEL_PERF_DATA = "yyc3_model_perf_data";
export const SK_MODEL_USAGE_DATA = "yyc3_model_usage_data";
export const SK_ACTIVE_MODEL = "yyc3_active_model";
export const SK_LLM_KEY_PREFIX = "yyc3_llm_key_";
export const SK_OLLAMA_CACHE_PREFIX = "yyc3_ollama_cache_";

// ── 心跳 ──
export const SK_HEARTBEAT_ENABLED = "yyc3_heartbeat_enabled";
export const SK_HEARTBEAT_INTERVAL = "yyc3_heartbeat_interval";

// ── 面板布局 ──
export const SK_PANEL_LAYOUT = "yyc3_panel_layout";
export const SK_PANEL_TAB_GROUPS = "yyc3_panel_tab_groups";
export const SK_PANEL_PINS = "yyc3_panel_pins";

// ── 预览设置 ──
export const SK_PREVIEW_STORE = "yyc3_preview_store";

// ── 代理配置 ──
export const SK_PROXY_CONFIG = "yyc3_proxy_config";

// ── 项目 ──
export const SK_PROJECTS = "yyc3_projects";
export const SK_PROJECT_PREFIX = "yyc3_project_";

// ── Zustand Persist Store Names ──
export const SK_ZUSTAND_MODEL_STORE = "yyc3-model-store";
export const SK_ZUSTAND_PROXY_STORE = "yyc3-proxy-store";

// ================================================================
// Helpers — 统一 localStorage 读写
// ================================================================

/** 安全读取 JSON，解析失败时返回 fallback */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** 安全写入 JSON */
export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** 清除所有 yyc3 前缀的 localStorage 条目，返回清除数量 */
export function clearAllYYC3Storage(): number {
  try {
    let cleared = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
        cleared++;
        i--;
      }
    }
    return cleared;
  } catch {
    return 0;
  }
}
