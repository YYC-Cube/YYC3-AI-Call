import { createLogger } from "./utils/logger";
const log = createLogger("useSentry");
/**
 * @file useSentry.ts
 * @description Sentry Hook - 提供 React 组件级别的错误追踪和性能监控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags sentry,react,hook,monitoring
 */

import { useEffect, useCallback } from "react";
import * as Sentry from "@sentry/react";
import { sentryService, type SentryConfig } from "./SentryService";

interface UseSentryOptions extends Partial<SentryConfig> {
  enabled?: boolean;
  userId?: string;
  userEmail?: string;
  username?: string;
}

/**
 * Sentry Hook
 */
export function useSentry(options: UseSentryOptions = {}) {
  const {
    enabled = true,
    userId,
    userEmail,
    username,
    ...config
  } = options;

  // 初始化 Sentry
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 从环境变量读取配置
    const dsn = config.dsn || import.meta.env.VITE_SENTRY_DSN;
    
    if (!dsn) {
      log.warn("DSN not configured");
      return;
    }

    sentryService.init({
      dsn,
      environment: config.environment || import.meta.env.MODE || "development",
      release: config.release || import.meta.env.VITE_APP_VERSION || "dev",
      sampleRate: config.sampleRate || 1.0,
      tracesSampleRate: config.tracesSampleRate || 0.1,
    });

    // 设置用户信息
    if (userId || userEmail || username) {
      sentryService.setUser({
        id: userId,
        username: username,
        email: userEmail,
      });
    }

    return () => {
      sentryService.close();
    };
  }, [
    enabled,
    config.dsn,
    config.environment,
    config.release,
    config.sampleRate,
    config.tracesSampleRate,
    userId,
    userEmail,
    username,
  ]);

  // 捕获错误
  const captureError = useCallback(
    (error: Error, context?: {
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    }) => {
      sentryService.captureError(error, context);
    },
    []
  );

  // 捕获消息
  const captureMessage = useCallback(
    (message: string, level?: Sentry.SeverityLevel) => {
      sentryService.captureMessage(message, level);
    },
    []
  );

  // 添加面包屑
  const addBreadcrumb = useCallback(
    (breadcrumb: Sentry.Breadcrumb) => {
      sentryService.addBreadcrumb(breadcrumb);
    },
    []
  );

  // 设置标签
  const setTag = useCallback(
    (key: string, value: string) => {
      sentryService.setTag(key, value);
    },
    []
  );

  // 开始事务
  const startTransaction = useCallback(
    (name: string, op?: string) => {
      return sentryService.startTransaction(name, op);
    },
    []
  );

  return {
    isInitialized: sentryService.isInitialized(),
    captureError,
    captureMessage,
    addBreadcrumb,
    setTag,
    startTransaction,
  };
}

export default useSentry;
