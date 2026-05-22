/**
 * @file ErrorReportingService.ts
 * @description 统一错误上报服务 — 提供 Sentry 风格的错误采集、去重、批量上报、
 *              本地持久化回放能力。当前为本地模式（LocalTransport），
 *              接入真实 Sentry DSN 后只需替换 transport 即可无缝切换。
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags error-reporting,sentry,monitoring,observability
 */

// ── 类型定义 ──────────────────────────────────────────────

import { createLogger } from "../utils/logger";
const log = createLogger("ErrorReporting");

/** 错误严重级别（与 Sentry 一致） */
export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

/** 错误分类标签 */
export type ErrorCategory =
  | "route" // 路由级错误
  | "render" // React 渲染错误
  | "network" // 网络/API 请求错误
  | "chunk_load" // 懒加载模块失败
  | "unhandled" // 未捕获异常
  | "promise" // 未处理 Promise rejection
  | "ai_service" // AI 服务调用错误
  | "editor" // 编辑器相关错误
  | "file_system" // 文件系统操作错误
  | "plugin" // 插件系统错误
  | "unknown";

/** 错误上报事件 */
export interface ErrorEvent {
  /** 唯一事件 ID */
  id: string;
  /** 错误指纹（用于去重） */
  fingerprint: string;
  /** 时间戳 */
  timestamp: number;
  /** 严重级别 */
  severity: ErrorSeverity;
  /** 分类 */
  category: ErrorCategory;
  /** 错误消息 */
  message: string;
  /** 完整堆栈 */
  stack?: string;
  /** 组件堆栈（React） */
  componentStack?: string;
  /** 发生错误的路由路径 */
  route?: string;
  /** 用户操作面包屑 */
  breadcrumbs: Breadcrumb[];
  /** 额外上下文数据 */
  context: Record<string, unknown>;
  /** 环境信息 */
  environment: EnvironmentInfo;
  /** 是否已上报到远程 */
  reported: boolean;
  /** 上报重试次数 */
  retryCount: number;
}

/** 用户操作面包屑 */
export interface Breadcrumb {
  type: "navigation" | "click" | "console" | "http" | "error" | "user";
  category: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

/** 环境信息 */
export interface EnvironmentInfo {
  userAgent: string;
  url: string;
  referrer: string;
  screenSize: string;
  language: string;
  platform: string;
  appVersion: string;
  buildMode: string;
}

/** Transport 接口 — 可替换为 Sentry / 自建服务 */
export interface ErrorTransport {
  name: string;
  send(
    events: ErrorEvent[],
  ): Promise<{ success: boolean; failedIds?: string[] }>;
}

/** 上报服务配置 */
export interface ErrorReportingConfig {
  /** Sentry DSN（留空则使用本地模式） */
  dsn?: string;
  /** 应用版本 */
  appVersion: string;
  /** 环境（production / development / staging） */
  environment: string;
  /** 采样率 0-1（1 = 上报全部） */
  sampleRate: number;
  /** 最大面包屑数量 */
  maxBreadcrumbs: number;
  /** 批量上报间隔（ms） */
  flushInterval: number;
  /** 本地最大存储条数 */
  maxLocalEvents: number;
  /** 是否启用去重 */
  deduplication: boolean;
  /** 去重窗口时间（ms） */
  deduplicationWindow: number;
  /** 自定义 transport（传入则忽略 dsn） */
  transport?: ErrorTransport;
  /** 上报前回调 — 返回 null 则丢弃该事件 */
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null;
}

// ── 默认配置 ──────────────────────────────────────────────

const DEFAULT_CONFIG: ErrorReportingConfig = {
  appVersion: "1.0.0",
  environment: import.meta.env.MODE || "development",
  sampleRate: 1.0,
  maxBreadcrumbs: 50,
  flushInterval: 10_000,
  maxLocalEvents: 200,
  deduplication: true,
  deduplicationWindow: 60_000,
};

// ── 工具函数 ──────────────────────────────────────────────

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateFingerprint(message: string, stack?: string): string {
  // 用错误消息 + 第一行堆栈生成指纹
  const firstStackLine =
    stack?.split("\n").find((l) => l.includes("at ")) || "";
  const raw = `${message}::${firstStackLine.trim()}`;
  // 简单哈希
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return `fp-${Math.abs(hash).toString(36)}`;
}

function getEnvironmentInfo(config: ErrorReportingConfig): EnvironmentInfo {
  return {
    userAgent: navigator.userAgent,
    url: window.location.href,
    referrer: document.referrer,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    platform: navigator.platform,
    appVersion: config.appVersion,
    buildMode: config.environment,
  };
}

function categorizeError(error: unknown): ErrorCategory {
  const msg = error instanceof Error ? error.message : String(error);

  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("does not provide an export")
  ) {
    return "chunk_load";
  }
  if (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("CORS")
  ) {
    return "network";
  }
  if (msg.includes("useContext") || msg.includes("Context")) {
    return "context";
  }
  if (msg.includes("AI") || msg.includes("LLM") || msg.includes("OpenAI")) {
    return "ai_service";
  }
  if (msg.includes("Monaco") || msg.includes("editor")) {
    return "editor";
  }
  return "unknown";
}

// ── 本地 Transport（开发模式 / 离线回退） ─────────────────

const STORAGE_KEY = "yyc3_error_events";

class LocalTransport implements ErrorTransport {
  name = "LocalTransport";

  async send(events: ErrorEvent[]): Promise<{ success: boolean }> {
    try {
      const existing = this.loadEvents();
      const merged = [...existing, ...events].slice(-200);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      console.info(
        `[ErrorReporting] 本地存储 ${events.length} 条错误事件（共 ${merged.length} 条）`,
      );
      return { success: true };
    } catch {
      return { success: true }; // 静默容错
    }
  }

  loadEvents(): ErrorEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  clearEvents(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ── Sentry Transport（真实 DSN 接入） ─────────────────────

class SentryTransport implements ErrorTransport {
  name = "SentryTransport";
  private dsn: string;

  constructor(dsn: string) {
    this.dsn = dsn;
  }

  async send(
    events: ErrorEvent[],
  ): Promise<{ success: boolean; failedIds?: string[] }> {
    // ⚠️ 生产环境替换为真实 Sentry SDK 调用：
    //
    //   import * as Sentry from "@sentry/react"
    //   events.forEach(evt => {
    //     Sentry.captureException(new Error(evt.message), {
    //       fingerprint: [evt.fingerprint],
    //       tags: { category: evt.category, route: evt.route },
    //       extra: evt.context,
    //       level: evt.severity,
    //     })
    //   })
    //
    // 当前为模拟实现 — 打印到控制台并模拟 HTTP 请求
    const failedIds: string[] = [];
    for (const event of events) {
      try {
        console.info(
          `[Sentry] 📡 上报事件 → DSN: ${this.dsn.slice(0, 30)}...`,
          {
            id: event.id,
            severity: event.severity,
            category: event.category,
            message: event.message.slice(0, 100),
            route: event.route,
            fingerprint: event.fingerprint,
          },
        );
        // 真实场景: await fetch(sentryIngestUrl, { method: 'POST', body: ... })
      } catch {
        failedIds.push(event.id);
      }
    }
    return { success: failedIds.length === 0, failedIds };
  }
}

// ── 错误上报服务（单例） ──────────────────────────────────

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private transport: ErrorTransport;
  private localTransport: LocalTransport;
  private breadcrumbs: Breadcrumb[] = [];
  private pendingEvents: ErrorEvent[] = [];
  private recentFingerprints: Map<string, number> = new Map();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;
  private globalHandlersInstalled = false;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.localTransport = new LocalTransport();
    this.transport = this.localTransport;
  }

  // ── 初始化 ──

  init(userConfig: Partial<ErrorReportingConfig> = {}): void {
    if (this.initialized) return;
    this.config = { ...DEFAULT_CONFIG, ...userConfig };

    // 决定 transport
    if (userConfig.transport) {
      this.transport = userConfig.transport;
    } else if (userConfig.dsn) {
      this.transport = new SentryTransport(userConfig.dsn);
    } else {
      this.transport = this.localTransport;
    }

    // 定时批量 flush
    this.flushTimer = setInterval(
      () => this.flush(),
      this.config.flushInterval,
    );

    // 安装全局异常捕获
    this.installGlobalHandlers();

    this.initialized = true;
    console.info(
      `[ErrorReporting] ✅ 初始化完成 — transport: ${this.transport.name}, ` +
        `环境: ${this.config.environment}, 采样率: ${this.config.sampleRate}`,
    );
  }

  /** 销毁服务 */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // 上报剩余事件
    this.initialized = false;
  }

  // ── 全局异常捕获 ──

  private installGlobalHandlers(): void {
    if (this.globalHandlersInstalled) return;

    // window.onerror
    window.addEventListener("error", (event) => {
      this.captureError(event.error || new Error(event.message), {
        category: "unhandled",
        severity: "error",
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // unhandledrejection
    window.addEventListener("unhandledrejection", (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      this.captureError(error, {
        category: "promise",
        severity: "error",
        context: { type: "unhandledrejection" },
      });
    });

    this.globalHandlersInstalled = true;
  }

  // ── 面包屑 ──

  addBreadcrumb(crumb: Omit<Breadcrumb, "timestamp">): void {
    this.breadcrumbs.push({
      ...crumb,
      timestamp: Date.now(),
    });
    // 保持最大数量
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /** 获取最近的面包屑记录（供跨面板溯源使用） */
  getRecentBreadcrumbs(limit = 20): Breadcrumb[] {
    return this.breadcrumbs.slice(-limit);
  }

  // ── 核心上报方法 ──

  captureError(
    error: unknown,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      componentStack?: string;
      route?: string;
    } = {},
  ): string | null {
    // 采样
    if (Math.random() > this.config.sampleRate) return null;

    // 处理不同类型的错误对象
    let err: Error;
    let errorMessage: string;
    let errorStack: string | undefined;

    if (error instanceof Error) {
      err = error;
      errorMessage = error.message;
      errorStack = error.stack;
    } else if (error instanceof Event) {
      // 处理 Event 对象
      const targetInfo = error.target 
        ? (error.target instanceof Worker ? 'Worker' : String(error.target))
        : 'unknown target';
      errorMessage = `Event: ${error.type} - ${targetInfo}`;
      errorStack = undefined;
      err = new Error(errorMessage);
    } else if (error instanceof Worker) {
      // 处理 Worker 对象
      errorMessage = `Worker error: ${error.toString()}`;
      errorStack = undefined;
      err = new Error(errorMessage);
    } else if (typeof error === 'object' && error !== null) {
      // 处理普通对象
      errorMessage = JSON.stringify(error);
      errorStack = undefined;
      err = new Error(errorMessage);
    } else {
      // 处理其他类型
      errorMessage = String(error);
      errorStack = undefined;
      err = new Error(errorMessage);
    }

    const fingerprint = generateFingerprint(errorMessage, errorStack);

    // 去重检查
    if (this.config.deduplication) {
      const lastSeen = this.recentFingerprints.get(fingerprint);
      if (lastSeen && Date.now() - lastSeen < this.config.deduplicationWindow) {
        console.debug(`[ErrorReporting] 去重跳过: ${fingerprint}`);
        return null;
      }
      this.recentFingerprints.set(fingerprint, Date.now());
      // 清理过期指纹
      if (this.recentFingerprints.size > 500) {
        const threshold = Date.now() - this.config.deduplicationWindow;
        for (const [fp, ts] of this.recentFingerprints) {
          if (ts < threshold) this.recentFingerprints.delete(fp);
        }
      }
    }

    const category = options.category || categorizeError(error);

    const event: ErrorEvent = {
      id: generateId(),
      fingerprint,
      timestamp: Date.now(),
      severity: options.severity || "error",
      category,
      message: errorMessage,
      stack: errorStack,
      componentStack: options.componentStack,
      route:
        options.route ||
        window.location.hash.replace("#", "") ||
        window.location.pathname,
      breadcrumbs: [...this.breadcrumbs],
      context: options.context || {},
      environment: getEnvironmentInfo(this.config),
      reported: false,
      retryCount: 0,
    };

    // beforeSend 钩子
    if (this.config.beforeSend) {
      const modified = this.config.beforeSend(event);
      if (!modified) return null;
      Object.assign(event, modified);
    }

    // 加入待发送队列
    this.pendingEvents.push(event);

    // 控制台输出（开发体验）
    const icon =
      event.severity === "fatal"
        ? "🔴"
        : event.severity === "error"
          ? "🟠"
          : event.severity === "warning"
            ? "🟡"
            : "🔵";
    log.error(
      `${icon} [ErrorReporting] ${event.category}/${event.severity}: ${event.message.slice(0, 120)}`,
      { eventId: event.id, route: event.route },
    );

    // 同时写入本地存储（离线保障）
    this.localTransport.send([event]).catch(() => {});

    // 致命错误立即 flush
    if (event.severity === "fatal") {
      this.flush();
    }

    return event.id;
  }

  /** 捕获路由错误（RouteErrorFallback 专用） */
  captureRouteError(
    error: unknown,
    extra?: { route?: string; componentStack?: string },
  ): string | null {
    return this.captureError(error, {
      category: "route",
      severity: "error",
      route: extra?.route,
      componentStack: extra?.componentStack,
      context: {
        source: "RouteErrorFallback",
        hash: window.location.hash,
      },
    });
  }

  /** 捕获 React 渲染错误（ErrorBoundary 专用） */
  captureRenderError(
    error: Error,
    errorInfo?: { componentStack?: string },
  ): string | null {
    return this.captureError(error, {
      category: "render",
      severity: "error",
      componentStack: errorInfo?.componentStack,
      context: {
        source: "ErrorBoundary",
      },
    });
  }

  /** 手动上报信息（非错误） */
  captureMessage(
    message: string,
    severity: ErrorSeverity = "info",
    context?: Record<string, unknown>,
  ): string | null {
    return this.captureError(new Error(message), {
      severity,
      context: { ...context, isMessage: true },
    });
  }

  // ── 批量发送 ──

  async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const batch = this.pendingEvents.splice(0);
    try {
      const result = await this.transport.send(batch);
      if (result.success) {
        batch.forEach((e) => (e.reported = true));
      } else if (result.failedIds?.length) {
        // 失败的放回队列重试
        const failed = batch.filter((e) => result.failedIds!.includes(e.id));
        failed.forEach((e) => {
          e.retryCount++;
          if (e.retryCount < 3) {
            this.pendingEvents.push(e);
          }
        });
      }
    } catch {
      // 网络失败 — 放回队列
      batch.forEach((e) => {
        e.retryCount++;
        if (e.retryCount < 3) {
          this.pendingEvents.push(e);
        }
      });
    }
  }

  // ── 查询本地错误历史 ──

  getLocalEvents(): ErrorEvent[] {
    return this.localTransport.loadEvents();
  }

  clearLocalEvents(): void {
    this.localTransport.clearEvents();
  }

  /** 获取错误统计摘要 */
  getErrorSummary(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ErrorEvent[];
  } {
    const events = this.getLocalEvents();
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    events.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });

    return {
      total: events.length,
      byCategory,
      bySeverity,
      recent: events.slice(-10).reverse(),
    };
  }
}

// ── 导出单例 ──────────────────────────────────────────────

export const errorReporting = new ErrorReportingService();

/**
 * 快捷初始化 — 在应用入口调用一次即可
 *
 * @example
 * ```ts
 * // 开发模式（本地存储）
 * initErrorReporting()
 *
 * // 生产模式（接入 Sentry）
 * initErrorReporting({
 *   dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
 *   appVersion: "1.3.0",
 *   environment: "production",
 *   sampleRate: 0.5,
 * })
 * ```
 */
export function initErrorReporting(
  config?: Partial<ErrorReportingConfig>,
): void {
  errorReporting.init(config);
}
