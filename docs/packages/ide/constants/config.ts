/**
 * @file constants/config.ts
 * @description 应用配置参数常量 — 对齐 YYC3-变量-配置参数.md，集中管理运行时配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags constants,config,parameters,design-prompt
 */

// ================================================================
// App Configuration — 应用配置参数 (对齐 YYC3-Design-Prompt/变量词库/YYC3-变量-配置参数.md)
// ================================================================

// ── 应用基本信息 ──
export const APP_NAME = "YYC³ AI Code";
export const APP_SLUG = "yyc3-ai-code";
export const APP_VERSION = "1.0.0";

// ── 服务器配置 ──
export const SERVER_PORT = 3201;
export const API_BASE_URL = `http://localhost:${SERVER_PORT}/api`;
export const API_TIMEOUT = 30000;
export const WS_URL = `ws://localhost:${SERVER_PORT}`;

// ── 数据库配置 ──
export const DB_TYPE = "indexeddb" as const;
export const DB_NAME = "yyc3-ai-code";
export const DB_VERSION = 1;

// ── 存储配置 ──
export const STORAGE_AUTO_SAVE_INTERVAL = 30000; // 30s 自动保存
export const STORAGE_DEBOUNCE_DELAY = 1000; // 1s 防抖延迟
export const STORAGE_MAX_SNAPSHOTS = 50; // 最大快照数
export const STORAGE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB 单文件限制

// ── 编辑器配置 ──
export const EDITOR_FONT_SIZE = 14;
export const EDITOR_TAB_SIZE = 2;
export const EDITOR_MINIMAP_ENABLED = true;
export const EDITOR_WORD_WRAP = "on" as const;
export const EDITOR_LINE_NUMBERS = "on" as const;
export const EDITOR_SCROLL_BEYOND_LAST_LINE = false;

// ── AI 配置 ──
export const AI_DEFAULT_PROVIDER = "openai";
export const AI_DEFAULT_MODEL = "gpt-4o";
export const AI_TEMPERATURE = 0.7;
export const AI_MAX_TOKENS = 4096;
export const AI_STREAM_ENABLED = true;
export const AI_TIMEOUT = 60000; // 60s AI 请求超时
export const AI_RETRY_COUNT = 3; // 失败重试次数
export const AI_RETRY_DELAY = 1000; // 重试间隔

// ── 性能配置 ──
export const PERF_DEBOUNCE_DELAY = 300; // 通用防抖延迟
export const PERF_VIRTUAL_SCROLL_THRESHOLD = 100; // 虚拟滚动触发阈值
export const PERF_MAX_FILE_TREE_DEPTH = 10; // 文件树最大深度
export const PERF_LAZY_LOAD_THRESHOLD = 50; // 懒加载触发阈值

// ── 安全配置 ──
export const SECURITY_ENCRYPTION_ALGORITHM = "AES-GCM" as const;
export const SECURITY_KEY_LENGTH = 256;
export const SECURITY_IV_LENGTH = 12;
export const SECURITY_SALT_LENGTH = 16;
export const SECURITY_PBKDF2_ITERATIONS = 100000;

// ── UI 配置 ──
export const UI_THEME_DEFAULT = "dark" as const;
export const UI_LANGUAGE_DEFAULT = "zh-CN";
export const UI_SIDEBAR_WIDTH = 52; // px
export const UI_PANEL_MIN_WIDTH = 200; // px
export const UI_PANEL_MIN_HEIGHT = 150; // px
export const UI_TOAST_DURATION = 3000; // ms
export const UI_ANIMATION_DURATION = 300; // ms

// ── 协作配置 ──
export const COLLAB_HEARTBEAT_INTERVAL = 30000; // 30s 心跳
export const COLLAB_RECONNECT_DELAY = 5000; // 5s 重连延迟
export const COLLAB_MAX_RECONNECT_ATTEMPTS = 10;

// ── 终端配置 ──
export const TERMINAL_MAX_HISTORY = 1000; // 命令历史最大条数
export const TERMINAL_MAX_OUTPUT_LINES = 5000; // 输出最大行数
export const TERMINAL_DEFAULT_SHELL = "bash";

// ── 预览配置 ──
export const PREVIEW_DEBOUNCE = 500; // 预览更新防抖
export const PREVIEW_MAX_ERRORS = 50; // 最大错误显示数

// ── 项目配置 ──
export const PROJECT_MAX_FILES = 500; // 单项目最大文件数
export const PROJECT_MAX_NAME_LENGTH = 64; // 项目名最大长度
export const PROJECT_TEMPLATE_COUNT = 6; // 内置模板数量
