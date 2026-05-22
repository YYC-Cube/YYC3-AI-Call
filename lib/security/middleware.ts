import { NextRequest, NextResponse } from 'next/server';
import { validateInput, preventXSS, ValidationError } from './validation';
import { rateLimiter, RateLimitConfigs } from './rate-limiter';
import { rbac, Permission, Role, type UserContext } from './rbac';

export type { UserContext };

export interface SecurityContext {
  request: NextRequest;
  user?: UserContext;
  clientIp: string;
  userAgent?: string;
  requestId: string;
  timestamp: number;
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;

  private constructor() {}

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  extractClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    if (cfConnectingIp && this.isValidIp(cfConnectingIp)) {
      return cfConnectingIp.split(',')[0].trim();
    }

    if (realIp && this.isValidIp(realIp)) {
      return realIp.trim();
    }

    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      for (const ip of ips) {
        if (this.isValidIp(ip) && !this.isPrivateIp(ip)) {
          return ip;
        }
      }
      return ips[0];
    }

    return '127.0.0.1';
  }

  private isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private isPrivateIp(ip: string): boolean {
    return (
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.2') ||
      ip.startsWith('172.3') ||
      ip.startsWith('192.168.') ||
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.startsWith('fc00:') ||
      ip.startsWith('fd')
    );
  }

  async rateLimitCheck(
    request: NextRequest,
    configType: keyof typeof RateLimitConfigs.api
  ): Promise<NextResponse | null> {
    const clientIp = this.extractClientIp(request);
    const config = RateLimitConfigs.api[configType];

    const result = await rateLimiter.check(clientIp, config);

    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          error: '请求过于频繁，请稍后再试',
          retryAfter: result.retryAfter,
          limit: result.limit,
          remaining: result.remaining,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toISOString(),
            'Retry-After': (result.retryAfter || 60).toString(),
          },
        }
      );
    }

    return null;
  }

  async validateAndSanitize<T>(
    request: NextRequest,
    schema: { body?: unknown; query?: unknown; params?: unknown }
  ): Promise<{ data: T; error?: ValidationError }> {
    try {
      let bodyData: unknown = {};
      let queryData: unknown = {};

      if (schema.body && request.method !== 'GET' && request.method !== 'HEAD') {
        bodyData = await request.json().catch(() => ({}));
      }

      if (schema.query) {
        queryData = Object.fromEntries(request.nextUrl.searchParams);
      }

      const combinedData = { ...(queryData as Record<string, unknown>), ...(bodyData as Record<string, unknown>) };

      if (schema.body) {
        const validatedBody: Record<string, unknown> = validateInput(schema.body as Parameters<typeof validateInput>[0], bodyData) as Record<string, unknown>;
        
        Object.keys(validatedBody).forEach(key => {
          if (typeof validatedBody[key] === 'string') {
            validatedBody[key] = preventXSS(validatedBody[key] as string);
          }
        });

        return { data: validatedBody as T };
      }

      return { data: combinedData as T };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { data: {} as T, error };
      }
      throw error;
    }
  }

  checkPermission(
    user: UserContext | undefined,
    permission: Permission
  ): NextResponse | null {
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: '未授权：请先登录' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!rbac.hasPermission(user, permission)) {
      return new NextResponse(
        JSON.stringify({
          error: '权限不足',
          requiredPermission: permission,
          userRole: user.role,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return null;
  }

  addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    return response;
  }

  generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `req_${timestamp}_${random}`;
  }

  createSecurityContext(request: NextRequest): SecurityContext {
    return {
      request,
      clientIp: this.extractClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
      requestId: this.generateRequestId(),
      timestamp: Date.now(),
    };
  }

  logSecurityEvent(
    context: SecurityContext,
    event: string,
    details?: Record<string, unknown>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      event,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
      ...details,
    };

    console.log('[Security]', JSON.stringify(logEntry));

    if (event === 'RATE_LIMIT_EXCEEDED' || event === 'PERMISSION_DENIED') {
      console.warn('[Security Alert]', JSON.stringify(logEntry));
    }
  }
}

export const securityMiddleware = SecurityMiddleware.getInstance();

export function withSecurityHandler(handler: (req: NextRequest, ctx: SecurityContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ctx = securityMiddleware.createSecurityContext(request);

    try {
      const rateLimitResponse = await securityMiddleware.rateLimitCheck(request, 'general');
      if (rateLimitResponse) {
        securityMiddleware.logSecurityEvent(ctx, 'RATE_LIMIT_EXCEEDED', {
          endpoint: request.nextUrl.pathname,
        });
        return rateLimitResponse;
      }

      const response = await handler(request, ctx);

      return securityMiddleware.addSecurityHeaders(response);
    } catch (error) {
      securityMiddleware.logSecurityEvent(ctx, 'UNHANDLED_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return new NextResponse(
        JSON.stringify({
          error: process.env.NODE_ENV === 'development'
            ? (error as Error)?.message
            : '服务器内部错误',
          requestId: ctx.requestId,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': ctx.requestId,
          },
        }
      );
    }
  };
}
