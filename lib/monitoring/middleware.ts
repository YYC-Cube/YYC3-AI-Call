import { type NextRequest, type NextFetchEvent } from 'next/server';
import { metrics } from './metrics';

export function createMonitoringMiddleware() {
  return {
    requestHandler: (request: NextRequest): { requestId: string; startTime: number } => {
      const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
      const startTime = Date.now();

      return { requestId, startTime };
    },

    responseHandler: (
      response: Response,
      context: { request: NextRequest; startTime: number; requestId?: string }
    ): void => {
      const durationMs = Date.now() - context.startTime;
      const method = context.request.method;
      const route = new URL(context.request.url).pathname;
      
      let statusCode = 200;
      if (response.status) {
        statusCode = response.status;
      }

      metrics.trackHttpRequest(method, route, statusCode, durationMs);

      if (statusCode >= 400) {
        const severity = statusCode >= 500 ? 'high' : 'medium';
        metrics.trackError('http_error', severity as 'high' | 'medium');
      }

      response.headers.set('X-Response-Time', `${durationMs}ms`);
      response.headers.set('X-Request-ID', context.requestId || '');
    },
  };
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private activeTrackers: Map<string, { startTime: number; operation: string }> = new Map();

  private constructor() {}

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  startTracking(operation: string): string {
    const trackerId = `track_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    
    this.activeTrackers.set(trackerId, {
      startTime: performance.now(),
      operation,
    });

    return trackerId;
  }

  endTracking(trackerId: string): number | null {
    const tracker = this.activeTrackers.get(trackerId);
    
    if (!tracker) {
      console.warn(`[Performance] Tracker not found: ${trackerId}`);
      return null;
    }

    const durationMs = performance.now() - tracker.startTime;
    
    this.activeTrackers.delete(trackerId);
    
    metrics.observeHistogram(
      'operation_duration_ms',
      durationMs,
      { operation: tracker.operation }
    );

    if (durationMs > 1000) {
      console.warn(`[Performance] Slow operation detected: ${tracker.operation} took ${durationMs.toFixed(2)}ms`);
    }

    return durationMs;
  }

  async trackAsyncOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; durationMs: number }> {
    const trackerId = this.startTracking(operation);
    
    try {
      const result = await fn();
      const durationMs = this.endTracking(trackerId) || 0;
      
      return { result, durationMs };
    } catch (error) {
      this.endTracking(trackerId);
      throw error;
    }
  }

  getActiveTrackersCount(): number {
    return this.activeTrackers.size;
  }

  cleanupOldTrackers(maxAgeMs: number = 60000): void {
    const now = performance.now();
    
    for (const [id, tracker] of this.activeTrackers.entries()) {
      if (now - tracker.startTime > maxAgeMs) {
        console.warn(`[Performance] Cleaning up stale tracker: ${id} (${tracker.operation})`);
        this.activeTrackers.delete(id);
      }
    }
  }
}

export const performanceTracker = PerformanceTracker.getInstance();

export function trackPerformance(operationName: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const trackerId = performanceTracker.startTracking(`${target?.constructor?.name}.${propertyKey}`);

      try {
        const result = await originalMethod.apply(this, args);
        
        const durationMs = performanceTracker.endTracking(trackerId);
        
        if (durationMs && durationMs > 1000) {
          console.log(`[Performance] ${operationName}: ${durationMs.toFixed(2)}ms`);
        }

        return result;
      } catch (error) {
        performanceTracker.endTracking(trackerId);
        throw error;
      }
    };

    return descriptor;
  };
}

export function withMonitoring(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const monitoring = createMonitoringMiddleware();
    const context = monitoring.requestHandler(request);

    try {
      const response = await handler(request);
      monitoring.responseHandler(response, { ...context, request });
      return response;
    } catch (error) {
      const errorResponse = new Response(
        JSON.stringify({
          error: process.env.NODE_ENV === 'development'
            ? (error as Error)?.message
            : 'Internal Server Error',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      monitoring.responseHandler(errorResponse, { ...context, request });
      metrics.trackError('unhandled_error', 'critical');
      
      return errorResponse;
    }
  };
}

export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, () => Promise<boolean>> = new Map();

  private constructor() {}

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  registerCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn);
  }

  async runChecks(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: { name: string; status: boolean; latency?: number }[];
    timestamp: string;
  }> {
    const results = [];
    let allHealthy = true;

    for (const [name, checkFn] of this.checks.entries()) {
      const startTime = Date.now();
      
      try {
        const isHealthy = await checkFn();
        const latency = Date.now() - startTime;

        results.push({ name, status: isHealthy, latency });

        if (!isHealthy) {
          allHealthy = false;
        }
      } catch (error) {
        results.push({ name, status: false });
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: results,
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthChecker = HealthChecker.getInstance();

healthChecker.registerCheck('database', async () => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
});

healthChecker.registerCheck('redis', async () => {
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
