/**
 * @file SentryService.ts
 * @description Sentry 错误追踪服务 - 集成 Sentry SDK，提供错误上报、性能监控、用户追踪功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags sentry,error-tracking,monitoring,performance
 */

import * as Sentry from "@sentry/react";
import { createLogger } from "../utils/logger";
const log = createLogger("Sentry");

export interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  sampleRate: number;
  tracesSampleRate: number;
}

/**
 * Sentry 错误追踪服务
 */
class SentryService {
  private initialized = false;
  private config: SentryConfig | null = null;

  /**
   * 初始化 Sentry
   */
  init(config: SentryConfig): void {
    if (this.initialized) {
      log.warn("Already initialized");
      return;
    }

    this.config = config;

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      
      // 错误采样率
      sampleRate: config.sampleRate,
      
      // 性能追踪采样率
      tracesSampleRate: config.tracesSampleRate,
      
      // 集成
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // 性能追踪配置
      enableTracing: true,
      
      // 会话配置
      autoSessionTracking: true,
      sessionSamplingRate: config.sampleRate,
      
      //  beforeSend - 发送前处理
      beforeSend: (event, hint) => {
        // 开发环境不上报
        if (config.environment === "development") {
          log.info("Development mode, skipping error:", event);
          return null;
        }
        
        // 过滤某些错误
        const error = event.exception?.values?.[0];
        if (error?.type === "NetworkError") {
          return null; // 忽略网络错误
        }
        
        return event;
      },
      
      // beforeBreadcrumb - 面包屑处理
      beforeBreadcrumb: (breadcrumb) => {
        // 过滤某些面包屑
        if (breadcrumb.category === "ui.click") {
          return breadcrumb;
        }
        return breadcrumb;
      },
      
      // 忽略某些错误
      ignoreErrors: [
        // 浏览器插件错误
        "top.GLOBALS",
        // 随机插件
        "chrome-extension://",
        "moz-extension://",
        // 网络错误
        "NetworkError",
        "Network request failed",
      ],
      
      // 忽略某些 URL
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    this.initialized = true;
    log.info("Initialized successfully");
  }

  /**
   * 捕获错误
   */
  captureError(error: Error, context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: {
      id?: string;
      username?: string;
      email?: string;
    };
  }): void {
    if (!this.initialized) {
      log.error("Not initialized");
      return;
    }

    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });
  }

  /**
   * 捕获消息
   */
  captureMessage(message: string, level?: Sentry.SeverityLevel): void {
    if (!this.initialized) {
      log.warn("Not initialized");
      return;
    }

    Sentry.captureMessage(message, level);
  }

  /**
   * 添加面包屑
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.initialized) {
      return;
    }

    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * 设置用户
   */
  setUser(user: {
    id?: string;
    username?: string;
    email?: string;
  } | null): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser(user);
  }

  /**
   * 设置标签
   */
  setTag(key: string, value: string): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setTag(key, value);
  }

  /**
   * 设置上下文
   */
  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setContext(name, context);
  }

  /**
   * 开始事务 (性能追踪)
   */
  startTransaction(name: string, op?: string): Sentry.Span | undefined {
    if (!this.initialized) {
      return;
    }

    return Sentry.startSpan({
      name,
      op: op || "custom",
    });
  }

  /**
   * 清理
   */
  close(): Promise<boolean> {
    return Sentry.close();
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 导出单例
export const sentryService = new SentryService();

// 导出工具函数
export const captureError = sentryService.captureError.bind(sentryService);
export const captureMessage = sentryService.captureMessage.bind(sentryService);
export const addBreadcrumb = sentryService.addBreadcrumb.bind(sentryService);
export const setUser = sentryService.setUser.bind(sentryService);
export const setTag = sentryService.setTag.bind(sentryService);

export default sentryService;
