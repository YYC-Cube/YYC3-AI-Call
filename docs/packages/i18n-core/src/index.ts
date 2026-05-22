/**
 * file index.ts
 * description @yyc3/i18n-core 模块入口
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.4.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core 模块入口
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

// ============================================================
// MCP Server (Model Context Protocol - AI Agent Integration)
// ============================================================

export { registerI18nTools } from "./lib/mcp/i18n-tools.js";
export { MCPServer } from "./lib/mcp/server.js";
export type { ToolHandler } from "./lib/mcp/server.js";
export type {
  MCPMessage, MCPResource, MCPServerCapabilities, MCPServerConfig,
  MCPServerInfo, MCPTool, MCPToolResult, MCPTransport
} from "./lib/mcp/types.js";

// ============================================================
// AI Enhancement Layer (LLM-Powered Translation)
// ============================================================

export { AIProviderManager } from "./lib/ai/provider.js";
export type {
  AIProvider, AIProviderConfig, AIProviderInfo, AIProviderType, TranslationRequest,
  TranslationResponse
} from "./lib/ai/provider.js";

export { QualityEstimator } from "./lib/ai/quality-estimator.js";
export type {
  QEContext, QEIssue,
  QEResult,
  QERule, QESeverity
} from "./lib/ai/quality-estimator.js";

export { OpenAIProvider } from "./lib/ai/openai-provider.js";
export { OllamaProvider } from "./lib/ai/ollama-provider.js";

// ============================================================
// ICU MessageFormat Engine (Based on Unicode ICU Specification)
// ============================================================

export { ICUParser } from "./lib/icu/parser.js";
export { ICUCompiler } from "./lib/icu/compiler.js";
export type { ICUCompileContext } from "./lib/icu/compiler.js";
export type {
  ICUNode, ICULiteral, ICUArgument, ICUPlural, ICUSelect,
  ICUSelectOrdinal, ICUNumber, ICUDate, ICUTime,
  ICUParseResult, ICUParseError, ICUPluralClause, ICUSelectClause
} from "./lib/icu/types.js";

// ============================================================
// MCP Transport Layer
// ============================================================

export { StdioTransport } from "./lib/mcp/stdio-transport.js";

// ============================================================
// CLI Tools (AST Analysis & Chinese Detection)
// ============================================================

export { ChineseDetector } from "./lib/cli/chinese-detector.js";
export type { DetectionResult } from "./lib/cli/chinese-detector.js";

// ============================================================
// Infrastructure Utilities (from FAmily π³ - High Availability)
// ============================================================

// Backoff & Retry
export {
  DEFAULT_BACKOFF_POLICY, computeBackoff, createRetryRunner, sleepWithAbort
} from "./lib/infra/backoff.js";
export type { BackoffPolicy } from "./lib/infra/backoff.js";

// Rate Limiting
export { createFixedWindowRateLimiter } from "./lib/infra/rate-limit.js";
export type { FixedWindowRateLimiter } from "./lib/infra/rate-limit.js";

// Logger
export { createLogger, getLogLevel, logger, setLogLevel } from "./lib/infra/logger.js";
export type { LogLevel, Logger } from "./lib/infra/logger.js";

// Secure Random
export {
  generateSecureFraction, generateSecureHex, generateSecureInt, generateSecureToken, generateSecureUuid
} from "./lib/infra/secure-random.js";

// ============================================================
// Security Utilities (from FAmily π³ - Enterprise Security)
// ============================================================

// Dangerous Operations Detection
export {
  DANGEROUS_OPERATIONS_SET, DANGEROUS_OPERATION_NAMES, getDangerousOperations, isDangerousOperation
} from "./lib/security/dangerous-operations.js";
export type { DangerousOperation } from "./lib/security/dangerous-operations.js";

// Safe Regex (ReDoS Protection)
export {
  clearSafeRegexCache, compileSafeRegex,
  testSafeRegex
} from "./lib/security/safe-regex.js";
export type { SafeRegexCompileResult, SafeRegexRejectReason } from "./lib/security/safe-regex.js";

// Secret Comparison (Timing Attack Safe)
export { safeEqualSecret } from "./lib/security/secret-equal.js";

// ============================================================
// General Utilities (from FAmily π³ - Production Ready)
// ============================================================

// Time Formatting
export { formatRelativeTimestamp, formatTimeAgo } from "./lib/utils/format-time.js";
export type { FormatRelativeTimestampOptions, FormatTimeAgoOptions } from "./lib/utils/format-time.js";

// Path Guards (Traversal Prevention)
export {
  hasNodeErrorCode, isNodeError, isNotFoundPathError, isPathInside, isSymlinkOpenError, normalizeWindowsPathForComparison
} from "./lib/utils/path-guards.js";

// JSON File Operations
export {
  deleteJsonFile, jsonFileExists, loadJsonFile,
  saveJsonFile
} from "./lib/utils/json-file.js";
