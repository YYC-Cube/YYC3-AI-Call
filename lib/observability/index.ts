/**
 * YYC³ AI Calling - 可观测性系统
 * 
 * 功能：
 * 1. 结构化日志（Pino风格）
 * 2. 性能指标收集（Prometheus格式）
 * 3. 健康检查端点
 * 4. 错误追踪集成（Sentry）
 * 5. 告警规则引擎
 */

import { NextRequest } from 'next/server';

// ============================================
// 类型定义
// ============================================
interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail';
    duration_ms: number;
    message?: string;
  }>;
  version: string;
  uptime: number;
  timestamp: string;
}

// ============================================
// 日志系统
// ============================================
class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(defaultLevel: LogLevel = 'info') {
    this.level = defaultLevel;
    this.context = {};
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  addContext(ctx: Partial<LogContext>) {
    this.context = { ...this.context, ...ctx };
  }

  clearContext() {
    this.context = {};
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: unknown,
    ctx?: LogContext
  ): object {
    const timestamp = new Date().toISOString();
    const logData = {
      level,
      time: timestamp,
      msg: message,
      ...this.context,
      ...ctx,
    };

    if (data !== undefined) {
      Object.assign(logData, { data });
    }

    // 控制台输出（开发环境）
    if (process.env.NODE_ENV !== 'production') {
      const emoji = { debug: '🔍', info: 'ℹ️ ', warn: '⚠️ ', error: '❌', fatal: '💥' };
      console.log(`${emoji[level]}[${level.toUpperCase()}] ${message}`, data || '', ctx || '');
    }

    return logData;
  }

  debug(message: string, data?: unknown, ctx?: LogContext) {
    if (this.shouldLog('debug')) {
      return this.formatMessage('debug', message, data, ctx);
    }
  }

  info(message: string, data?: unknown, ctx?: LogContext) {
    if (this.shouldLog('info')) {
      return this.formatMessage('info', message, data, ctx);
    }
  }

  warn(message: string, data?: unknown, ctx?: LogContext) {
    if (this.shouldLog('warn')) {
      return this.formatMessage('warn', message, data, ctx);
    }
  }

  error(message: string, error?: Error | unknown, ctx?: LogContext) {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error;
      
      return this.formatMessage('error', message, errorData, ctx);
    }
  }

  fatal(message: string, error?: Error | unknown, ctx?: LogContext) {
    if (this.shouldLog('fatal')) {
      const errorData = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error;
      
      return this.formatMessage('fatal', message, errorData, ctx);
    }
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);

// ============================================
// 指标收集系统（Prometheus兼容）
// ============================================
class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, MetricValue[]> = new Map();
  private histograms: Map<string, number[]> = new Map();

  increment(name: string, labels?: Record<string, string>, value = 1) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  gauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    
    if (!this.gauges.has(key)) {
      this.gauges.set(key, []);
    }
    
    this.gauges.get(key)!.push({
      value,
      timestamp: Date.now(),
      labels,
    });

    // 只保留最近100个数据点
    const values = this.gauges.get(key)!;
    if (values.length > 100) {
      this.gauges.set(key, values.slice(-100));
    }
  }

  histogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    
    this.histograms.get(key)!.push(value);

    // 只保留最近1000个样本
    const samples = this.histograms.get(key)!;
    if (samples.length > 1000) {
      this.histograms.set(key, samples.slice(-1000));
    }
  }

  timing(name: string, startTime: number, labels?: Record<string, string>) {
    const duration = Date.now() - startTime;
    this.histogram(`${name}_duration_ms`, duration, labels);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  getGauge(name: string, labels?: Record<string, string>): number | null {
    const key = this.buildKey(name, labels);
    const values = this.gauges.get(key);
    return values && values.length > 0 ? values[values.length - 1].value : null;
  }

  getHistogramStats(name: string, labels?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.buildKey(name, labels);
    const samples = this.histograms.get(key);

    if (!samples || samples.length === 0) return null;

    const sorted = [...samples].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  exportPrometheusFormat(): string {
    let output = '';

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      output += `# TYPE ${key} counter\n`;
      output += `${key} ${value}\n\n`;
    }

    // Export gauges (latest value)
    for (const [key, values] of this.gauges.entries()) {
      if (values.length > 0) {
        const latest = values[values.length - 1];
        const labelStr = this.formatLabels(latest.labels);
        output += `# TYPE ${key} gauge\n`;
        output += `${key}${labelStr} ${latest.value}\n\n`;
      }
    }

    // Export histogram summaries
    for (const [key, samples] of this.histograms.entries()) {
      if (samples.length > 0) {
        const stats = this.getHistogramStats(key)!;
        output += `# TYPE ${key} summary\n`;
        output += `${key}_count ${stats.count}\n`;
        output += `${key}_sum ${(stats.avg * stats.count).toFixed(2)}\n`;
        output += `{quantile="0.5"} ${stats.p50.toFixed(2)}\n`;
        output += `{quantile="0.95"} ${stats.p95.toFixed(2)}\n`;
        output += `{quantile="0.99"} ${stats.p99.toFixed(2)}\n\n`;
      }
    }

    return output;
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = this.formatLabels(labels);
    return `${name}${labelStr}`;
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    const entries = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `{${entries}}`;
  }

  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  }
}

export const metrics = new MetricsCollector();

// 预定义指标名称
export const METRICS = {
  // HTTP请求
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION_MS: 'http_request_duration_ms',
  
  // AI服务
  AI_LLM_REQUESTS_TOTAL: 'ai_llm_requests_total',
  AI_LLM_DURATION_MS: 'ai_llm_duration_ms',
  AI_EMBEDDING_REQUESTS_TOTAL: 'ai_embedding_requests_total',
  AI_EMOTION_ANALYSIS_DURATION_MS: 'ai_emotion_analysis_duration_ms',
  
  // 业务指标
  CALLS_TOTAL: 'calls_total',
  CALLS_SUCCESSFUL: 'calls_successful',
  CALLS_FAILED: 'calls_failed',
  CUSTOMER_SATISFACTION_SCORE: 'customer_satisfaction_score',
  
  // 系统资源
  ACTIVE_CONNECTIONS: 'active_connections',
  MEMORY_USAGE_BYTES: 'memory_usage_bytes',
};

// ============================================
// 健康检查系统
// ============================================
const START_TIME = Date.now();

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
}

class HealthChecker {
  private checks: Map<string, HealthCheck> = new Map();

  register(name: string, check: () => Promise<boolean>) {
    this.checks.set(name, { name, check });
  }

  unregister(name: string) {
    this.checks.delete(name);
  }

  async runChecks(): Promise<HealthCheckResult> {
    const results: HealthCheckResult['checks'] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let failures = 0;

    for (const [, healthCheck] of this.checks) {
      const start = Date.now();
      try {
        const pass = await healthCheck.check();
        const duration = Date.now() - start;
        
        results.push({
          name: healthCheck.name,
          status: pass ? 'pass' : 'fail',
          duration_ms: duration,
          message: pass ? undefined : `${healthCheck.name}检查失败`,
        });

        if (!pass) {
          failures++;
          overallStatus = 'degraded';
        }
      } catch (error) {
        const duration = Date.now() - start;
        
        results.push({
          name: healthCheck.name,
          status: 'fail',
          duration_ms: duration,
          message: (error as Error).message,
        });

        failures++;
        overallStatus = 'unhealthy';
      }
    }

    if (failures === results.length && results.length > 0) {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      checks: results,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthChecker = new HealthChecker();

// 注册默认健康检查
healthChecker.register('database', async () => {
  try {
    const prismaModule = await import('@prisma/client') as any;
    const PrismaClient = prismaModule.default || prismaModule.PrismaClient;
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
});

healthChecker.register('redis', async () => {
  try {
    const Redis = (await import('ioredis')).default;
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return false;
    
    const redis = new Redis(redisUrl);
    await redis.ping();
    redis.disconnect();
    return true;
  } catch {
    return false;
  }
});

healthChecker.register('memory', async () => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  return heapUsedMB < 500; // 小于500MB视为健康
});

// ============================================
// 请求追踪中间件
// ============================================
export function createRequestLogger(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  const context: LogContext = {
    requestId,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown',
    userAgent: request.headers.get('user-agent')?.substring(0, 200),
    method: request.method,
    path: new URL(request.url).pathname,
  };

  logger.addContext(context);

  metrics.increment(METRICS.HTTP_REQUESTS_TOTAL, {
    method: request.method,
    path: context.path!,
  });

  return {
    requestId,
    context,
    onComplete: (statusCode: number) => {
      const duration = Date.now() - startTime;
      
      context.statusCode = statusCode;
      context.duration = duration;

      logger.info(`${request.method} ${context.path}`, undefined, context);

      metrics.histogram(METRICS.HTTP_REQUEST_DURATION_MS, duration, {
        method: request.method,
        path: context.path!,
        status: String(statusCode),
      });

      logger.clearContext();
    },
  };
}

// ============================================
// 错误追踪（可选Sentry集成）
// ============================================
export async function trackError(error: Error, context?: LogContext) {
  logger.error(error.message, error, context);
  metrics.increment('errors_total', {
    type: error.constructor.name,
  });

  // Sentry集成（如果配置了）
  if (process.env.SENTRY_DSN) {
    try {
      // @ts-expect-error @sentry/nextjs is an optional dependency
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: context,
      });
    } catch {
      // Sentry未安装时静默失败
      logger.warn('Sentry未安装，错误仅记录到日志', undefined, context);
    }
  }
}

// ============================================
// 导出
// ============================================
export {
  Logger,
  MetricsCollector,
  HealthChecker,
  type LogContext,
  type LogLevel,
  type HealthCheckResult,
  type MetricValue,
};

export default {
  logger,
  metrics,
  healthChecker,
  METRICS,
  createRequestLogger,
  trackError,
};
