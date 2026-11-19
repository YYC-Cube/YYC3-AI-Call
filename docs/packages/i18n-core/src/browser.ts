/**
 * file browser.ts
 * description @yyc3/i18n-core 浏览器安全入口（不含 Node 内置模块依赖）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.5.0
 * created 2026-11-20
 * updated 2026-11-20
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 浏览器安全入口（不含 Node 内置模块依赖）
 */
// Core Engine
export { I18nEngine, i18n, t } from "./lib/engine.js";
export type { I18nEngineConfig } from "./lib/engine.js";

// Cache System
export { LRUCache } from "./lib/cache.js";
export type { CacheConfig, CacheStats } from "./lib/cache.js";

// Plugin System
export { PluginManager } from "./lib/plugins.js";
export type { I18nContext, I18nPlugin } from "./lib/plugins.js";

// Built-in Plugins (from plugins/index.ts)
export {
  MissingKeyReporter,
  PerformanceTracker, createConsoleLogger
} from "./lib/plugins/index.js";

// Formatter utilities
export { formatRelativeTime, interpolate, pluralize } from "./lib/formatter.js";
export type { TranslateParams } from "./lib/formatter.js";

// Locale detection
export {
  detectSystemLocale, isChineseLocale, normalizeLocale
} from "./lib/detector.js";
export type { LocaleDetectionResult } from "./lib/detector.js";

// RTL Utilities
export {
  RTL_LOCALES, createMirroredLayout, flipSpacing, getAlignment, getDirection, getOppositeAlignment, isRTL, mirrorPosition, setupDocumentDirection, transformClassForRTL
} from "./lib/rtl-utils.js";

// Core Types
export type { HorizontalAlignment, Locale, RTLLocale, SpacingProperty, TextDirection, TranslationMap } from "./lib/types.js";
