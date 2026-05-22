/**
 * YYC³ AI Calling - 全局功能优化与增强模块
 * 
 * 优化内容：
 * 1. 错误处理增强
 * 2. 输入验证强化
 * 3. 性能监控与优化
 * 4. 安全性加固
 * 5. 日志系统完善
 */

import { performance } from 'perf_hooks';

// ============================================
// 全局错误处理类
// ============================================
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorLog: Array<{
    timestamp: Date;
    error: Error;
    context: string;
    severity: 'error' | 'warning' | 'info';
  }> = [];

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  handleError(error: Error, context: string, severity: 'error' | 'warning' | 'info' = 'error'): void {
    const errorEntry = {
      timestamp: new Date(),
      error,
      context,
      severity,
    };

    this.errorLog.push(errorEntry);

    // 保持日志大小在合理范围内
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-500);
    }

    // 根据严重级别输出日志
    switch (severity) {
      case 'error':
        console.error(`[ERROR] ${context}:`, error.message, error.stack);
        break;
      case 'warning':
        console.warn(`[WARNING] ${context}:`, error.message);
        break;
      case 'info':
        console.info(`[INFO] ${context}:`, error.message);
        break;
    }
  }

  getErrorLog(): typeof this.errorLog {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// ============================================
// 输入验证器
// ============================================
export class InputValidator {
  static validateString(value: unknown, fieldName: string, options?: { minLength?: number; maxLength?: number; required?: boolean }): string | null {
    if (options?.required && (!value || value === '')) {
      return `${fieldName} is required`;
    }

    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }

    if (options?.minLength && value.length < options.minLength) {
      return `${fieldName} must be at least ${options.minLength} characters`;
    }

    if (options?.maxLength && value.length > options.maxLength) {
      return `${fieldName} must not exceed ${options.maxLength} characters`;
    }

    return null;
  }

  static validateNumber(value: unknown, fieldName: string, options?: { min?: number; max?: number; required?: boolean }): string | null {
    if (options?.required && (value === undefined || value === null)) {
      return `${fieldName} is required`;
    }

    if (typeof value !== 'number' || isNaN(value)) {
      return `${fieldName} must be a valid number`;
    }

    if (options?.min !== undefined && value < options.min) {
      return `${fieldName} must be at least ${options.min}`;
    }

    if (options?.max !== undefined && value > options.max) {
      return `${fieldName} must not exceed ${options.max}`;
    }

    return null;
  }

  static validateObject(value: unknown, fieldName: string, options?: { requiredFields?: string[] }): string | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return `${fieldName} must be an object`;
    }

    if (options?.requiredFields) {
      const obj = value as Record<string, unknown>;
      for (const field of options.requiredFields) {
        if (!(field in obj)) {
          return `${fieldName}.${field} is required`;
        }
      }
    }

    return null;
  }

  static validateArray(value: unknown, fieldName: string, options?: { minLength?: number; maxLength?: number; itemType?: string }): string | null {
    if (!Array.isArray(value)) {
      return `${fieldName} must be an array`;
    }

    if (options?.minLength && value.length < options.minLength) {
      return `${fieldName} must have at least ${options.minLength} items`;
    }

    if (options?.maxLength && value.length > options.maxLength) {
      return `${fieldName} must not exceed ${options.maxLength} items`;
    }

    if (options?.itemType) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== options.itemType) {
          return `${fieldName}[${i}] must be of type ${options.itemType}`;
        }
      }
    }

    return null;
  }

  static validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    return null;
  }

  static validateURL(url: string): string | null {
    try {
      new URL(url);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  }
}

// ============================================
// 性能监控器
// ============================================
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static thresholds: Record<string, number> = {
    'api-response': 1000,       // API响应时间阈值：1秒
    'ai-processing': 5000,      // AI处理时间阈值：5秒
    'database-query': 500,      // 数据库查询阈值：500ms
    'cache-operation': 100,     // 缓存操作阈值：100ms
    'file-processing': 3000,    // 文件处理阈值：3秒
  };

  static startTimer(name: string, metadata?: Record<string, unknown>): () => PerformanceMetric {
    const startTime = performance.now();

    return (): PerformanceMetric => {
      const duration = performance.now() - startTime;
      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: new Date(),
        metadata,
      };

      PerformanceMonitor.metrics.push(metric);

      // 检查是否超过阈值
      const threshold = PerformanceMonitor.thresholds[name];
      if (threshold && duration > threshold) {
        console.warn(
          `[PERFORMANCE] ${name} exceeded threshold: ${duration.toFixed(2)}ms > ${threshold}ms`
        );
      }

      // 保持指标数量在合理范围
      if (PerformanceMonitor.metrics.length > 10000) {
        PerformanceMonitor.metrics = PerformanceMonitor.metrics.slice(-5000);
      }

      return metric;
    };
  }

  static getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return PerformanceMonitor.metrics.filter((m) => m.name === name);
    }
    return [...PerformanceMonitor.metrics];
  }

  static getAverageDuration(name: string): number {
    const metrics = PerformanceMonitor.getMetrics(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  static getP95Duration(name: string): number {
    const metrics = PerformanceMonitor.getMetrics(name)
      .map((m) => m.duration)
      .sort((a, b) => a - b);

    if (metrics.length === 0) return 0;

    const p95Index = Math.floor(metrics.length * 0.95);
    return metrics[p95Index];
  }

  static setThreshold(name: string, durationMs: number): void {
    PerformanceMonitor.thresholds[name] = durationMs;
  }

  static clearMetrics(): void {
    PerformanceMonitor.metrics = [];
  }
}

// ============================================
// 安全工具类
// ============================================
export class SecurityUtils {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '')           // 移除HTML标签
      .replace(/['"]/g, '')          // 移除引号
      .replace(/\\/g, '')            // 移除反斜杠
      .trim();
  }

  static sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = SecurityUtils.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = SecurityUtils.sanitizeObject(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? SecurityUtils.sanitizeString(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  static maskSensitiveData(data: Record<string, unknown>, fieldsToMask: string[]): Record<string, unknown> {
    const masked = { ...data };

    for (const field of fieldsToMask) {
      if (field in masked) {
        const value = masked[field];
        if (typeof value === 'string' && value.length > 4) {
          masked[field] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
        } else if (value !== undefined && value !== null) {
          masked[field] = '***MASKED***';
        }
      }
    }

    return masked;
  }

  static generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static rateLimitCheck(
    identifier: string,
    windowMs: number = 60000,
    maxRequests: number = 100
  ): { allowed: boolean; remaining: number; resetTime: Date } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // 使用内存存储速率限制数据（生产环境应使用Redis）
    const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
    
    let entry = rateLimitStore.get(identifier);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(identifier, entry);
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: new Date(entry.resetTime),
      };
    }

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.resetTime),
      };
    }

    entry.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: new Date(entry.resetTime),
    };
  }
}

// ============================================
// 响应格式化器
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  requestId: string;
  metadata?: Record<string, unknown>;
}

export class ResponseFormatter {
  static success<T>(
    data: T,
    message?: string,
    metadata?: Record<string, unknown>
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date(),
      requestId: SecurityUtils.generateRequestId(),
      metadata,
    };
  }

  static error(
    error: string,
    statusCode: number = 500,
    metadata?: Record<string, unknown>
  ): ApiResponse<never> {
    return {
      success: false,
      error,
      timestamp: new Date(),
      requestId: SecurityUtils.generateRequestId(),
      metadata: { ...metadata, statusCode },
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number,
    message?: string
  ): ApiResponse<{
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const totalPages = Math.ceil(total / pageSize);
    
    return ResponseFormatter.success(
      {
        items: data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      message
    );
  }
}

// ============================================
// 重试机制
// ============================================
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: RegExp[];
}

export class RetryHandler {
  private static defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      /ECONNREFUSED/,
      /ECONNRESET/,
      /ETIMEDOUT/,
      /network error/i,
      /timeout/i,
      /rate limit/i,
      /too many requests/i,
    ],
  };

  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const config = { ...RetryHandler.defaultOptions, ...options };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 检查是否可重试
        const isRetryable = config.retryableErrors.some((regex) =>
          regex.test(lastError!.message)
        );

        if (attempt === config.maxRetries || !isRetryable) {
          throw lastError;
        }

        // 计算延迟（指数退避）
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.warn(
          `[RETRY] Attempt ${attempt + 1}/${config.maxRetries + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// ============================================
// 导出单例实例
// ============================================
export const globalErrorHandler = GlobalErrorHandler.getInstance();
export const inputValidator = InputValidator;
export const performanceMonitor = PerformanceMonitor;
export const securityUtils = SecurityUtils;
export const responseFormatter = ResponseFormatter;
export const retryHandler = RetryHandler;
