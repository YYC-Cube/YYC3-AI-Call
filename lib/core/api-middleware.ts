/**
 * YYC³ AI Calling - 增强型API中间件
 * 
 * 功能：
 * 1. 请求验证与清洗
 * 2. 性能监控集成
 * 3. 错误处理标准化
 * 4. 安全防护增强
 * 5. 日志记录完善
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  globalErrorHandler,
  inputValidator,
  performanceMonitor,
  securityUtils as SecurityUtils,
  responseFormatter as ResponseFormatter,
} from './optimization';

// ============================================
// 增强型API处理器基类
// ============================================
export class EnhancedAPIHandler {
  protected request: NextRequest;
  protected requestId: string;
  protected startTime: number;

  constructor(request: NextRequest) {
    this.request = request;
    this.requestId = SecurityUtils.generateRequestId();
    this.startTime = Date.now();

    // 添加请求ID到日志上下文
    console.log(`[API] Request ${this.requestId}: ${request.method} ${request.url}`);
  }

  protected validateRequiredFields(body: Record<string, unknown>, fields: string[]): string | null {
    for (const field of fields) {
      if (!(field in body)) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  protected sanitizeInput(data: Record<string, unknown>): Record<string, unknown> {
    return SecurityUtils.sanitizeObject(data);
  }

  protected createSuccessResponse<T>(data: T, message?: string): NextResponse {
    const duration = Date.now() - this.startTime;
    
    return NextResponse.json(
      ResponseFormatter.success(data, message, {
        requestId: this.requestId,
        processingTime: duration,
      })
    );
  }

  protected createErrorResponse(error: string, status: number = 500): NextResponse {
    const duration = Date.now() - this.startTime;
    
    globalErrorHandler.handleError(
        new Error(error),
        `API ${this.request.method} ${this.url}`,
        'error'
      );

    return NextResponse.json(
      ResponseFormatter.error(error, status, {
        requestId: this.requestId,
        processingTime: duration,
      }),
      { status }
    );
  }

  protected get url(): string {
    return this.request.url.split('?')[0];
  }

  protected get method(): string {
    return this.request.method;
  }
}

// ============================================
// 请求验证中间件
// ============================================
export async function validationMiddleware(
  request: NextRequest,
  rules: {
    body?: {
      requiredFields?: string[];
      optionalFields?: string[];
      validators?: Record<string, (value: unknown) => string | null>;
    };
    query?: {
      requiredParams?: string[];
      optionalParams?: string[];
    };
  }
): Promise<{ valid: boolean; errors?: string[]; sanitizedBody?: Record<string, unknown> }> {
  const errors: string[] = [];

  // 验证请求体
  if (rules.body) {
    try {
      const body = await request.clone().json();

      // 检查必填字段
      if (rules.body.requiredFields) {
        for (const field of rules.body.requiredFields) {
          if (!(field in body)) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }

      // 执行自定义验证器
      if (rules.body.validators) {
        for (const [field, validator] of Object.entries(rules.body.validators)) {
          if (field in body) {
            const error = validator(body[field]);
            if (error) {
              errors.push(`${field}: ${error}`);
            }
          }
        }
      }

      // 清洗输入数据
      const sanitizedBody = SecurityUtils.sanitizeObject(body);
      
      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        sanitizedBody,
      };
    } catch {
      errors.push('Invalid JSON in request body');
    }
  }

  // 验证查询参数
  if (rules.query) {
    const url = new URL(request.url);
    
    if (rules.query.requiredParams) {
      for (const param of rules.query.requiredParams) {
        if (!url.searchParams.get(param)) {
          errors.push(`Missing required query parameter: ${param}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ============================================
// 性能监控中间件
// ============================================
export function withPerformanceMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>,
  metricName: string
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const stopTimer = performanceMonitor.startTimer(metricName, {
      method: request.method,
      url: request.url,
    });

    try {
      const response = await handler(request);
      
      const metric = stopTimer();
      console.log(
        `[PERFORMANCE] ${metricName}: ${metric.duration.toFixed(2)}ms`
      );

      // 在响应头中添加性能信息
      response.headers.set('X-Processing-Time', `${metric.duration.toFixed(2)}ms`);
      response.headers.set('X-Request-ID', SecurityUtils.generateRequestId());

      return response;
    } catch (error) {
      stopTimer();
      throw error;
    }
  };
}

// ============================================
// 错误处理中间件
// ============================================
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      const statusCode = error instanceof Error && 'statusCode' in error 
        ? (error as { statusCode: number }).statusCode 
        : 500;

      globalErrorHandler.handleError(
        error instanceof Error ? error : new Error(errorMessage),
        `API Handler: ${request.method} ${request.url}`,
        'error'
      );

      return NextResponse.json(
        ResponseFormatter.error(errorMessage, statusCode),
        { status: statusCode }
      );
    }
  };
}

// ============================================
// 安全头中间件
// ============================================
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // 安全相关响应头
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CORS头（根据需要调整）
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// ============================================
// 速率限制中间件（简化版）
// ============================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimitMiddleware(
  request: NextRequest,
  options?: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (request: NextRequest) => string;
  }
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  const windowMs = options?.windowMs || 60000; // 默认1分钟窗口
  const maxRequests = options?.maxRequests || 100; // 默认每分钟100次请求
  
  // 生成速率限制键
  const key = options?.keyGenerator 
    ? options.keyGenerator(request)
    : request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';
  
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

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

// ============================================
// 组合中间件
// ============================================
export function composeMiddlewares(
  ...middlewares: Array<(handler: (req: NextRequest) => Promise<NextResponse>) => (req: NextRequest) => Promise<NextResponse>>
) {
  return (
    handler: (request: NextRequest) => Promise<NextResponse>
  ): ((request: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// 导出SecurityUtils别名以供使用
export { SecurityUtils };
