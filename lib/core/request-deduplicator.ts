import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface DeduplicationConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

class InMemoryStore {
  private store: Map<string, { count: number; expiresAt: number }> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private cleanupIntervalMs = 60000) {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.expiresAt > now) {
      existing.count++;
      return existing.count;
    }

    this.store.set(key, {
      count: 1,
      expiresAt: now + ttlSeconds * 1000,
    });

    return 1;
  }

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.count;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  getSize(): number {
    return this.store.size;
  }
}

const defaultStore = new InMemoryStore();

function generateRequestHash(request: NextRequest, body?: any): string {
  const url = new URL(request.url);
  const data = {
    method: request.method,
    url: url.pathname,
    userId: request.headers.get('x-user-id') || 'anonymous',
    contentType: request.headers.get('content-type'),
    ...(body && { bodyHash: hashObject(body) }),
  };

  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function hashObject(obj: unknown): string {
  const str = JSON.stringify(
    obj,
    Object.keys(obj as object).sort()
  );
  return crypto.createHash('md5').update(str).digest('hex').substring(0, 16);
}

export class RequestDeduplicator {
  private store: InMemoryStore;
  private config: DeduplicationConfig;

  constructor(config?: Partial<DeduplicationConfig>) {
    this.config = {
      windowMs: config?.windowMs || 5000,
      maxRequests: config?.maxRequests || 1,
      keyGenerator: config?.keyGenerator,
    };

    this.store = defaultStore;
  }

  async check(
    request: NextRequest,
    body?: any
  ): Promise<{
    isDuplicate: boolean;
    requestId: string;
    remainingAttempts: number;
  }> {
    const requestId = crypto.randomUUID();

    const dedupKey = this.config.keyGenerator
      ? this.config.keyGenerator(request)
      : generateRequestHash(request, body);

    const ttlSeconds = Math.ceil(this.config.windowMs / 1000);

    const count = await this.store.increment(dedupKey, ttlSeconds);

    return {
      isDuplicate: count > this.config.maxRequests,
      requestId,
      remainingAttempts: Math.max(0, this.config.maxRequests - count),
    };
  }

  async markCompleted(requestId: string): Promise<void> {
    // Can be used to explicitly clear dedup lock after successful processing
  }

  getConfig(): DeduplicationConfig {
    return { ...this.config };
  }

  getStats(): { storeSize: number; config: DeduplicationConfig } {
    return {
      storeSize: this.store.getSize(),
      config: this.getConfig(),
    };
  }
}

export async function deduplicationMiddleware(
  request: NextRequest,
  options?: {
    excludePatterns?: RegExp[];
    customDeduplicator?: RequestDeduplicator;
  }
): Promise<{
  allowed: boolean;
  errorResponse?: NextResponse;
}> {
  try {
    const excludePatterns = options?.excludePatterns || [];
    const url = new URL(request.url);

    const shouldExclude = excludePatterns.some((pattern) =>
      pattern.test(url.pathname)
    );

    if (shouldExclude) {
      return { allowed: true };
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      return { allowed: true };
    }

    let body: any;
    try {
      const clonedRequest = request.clone();
      body = await clonedRequest.json().catch(() => ({}));
    } catch {
      body = {};
    }

    const deduplicator = options?.customDeduplicator || new RequestDeduplicator();

    const result = await deduplicator.check(request, body);

    if (result.isDuplicate) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Duplicate request detected. Please wait before retrying.',
          code: 'E0007',
          requestId: result.requestId,
          retryAfterMs: deduplicator.getConfig().windowMs,
        },
        {
          status: 429,
          headers: {
            'X-Request-ID': result.requestId,
            'Retry-After': String(Math.ceil(deduplicator.getConfig().windowMs / 1000)),
          },
        }
      );

      return { allowed: false, errorResponse };
    }

    request.headers.set('X-Request-ID', result.requestId);

    return { allowed: true };
  } catch (error) {
    console.error('[Deduplication Middleware] Error:', error);

    // Allow request through if deduplication fails (fail-open approach)
    return { allowed: true };
  }
}

export function createDeduplicationMiddleware(options?: {
  windowMs?: number;
  maxRequests?: number;
  excludePaths?: string[];
}) {
  const deduplicator = new RequestDeduplicator({
    windowMs: options?.windowMs,
    maxRequests: options?.maxRequests,
  });

  const excludePatterns = (options?.excludePaths || []).map(
    (path) => new RegExp(`^${path.replace(/\*/g, '.*')}$`)
  );

  return async (request: NextRequest) =>
    deduplicationMiddleware(request, {
      excludePatterns,
      customDeduplicator: deduplicator,
    });
}

export const globalRequestDeduplicator = new RequestDeduplicator({
  windowMs: 5000,
  maxRequests: 1,
});
