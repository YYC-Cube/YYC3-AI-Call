import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ACTIONS = [
  'initialize',
  'create-task',
  'submit-task',
  'recommend-agents',
  'collaborate',
  'update-config',
];

const ALLOWED_TASK_TYPES = [
  'text-generation',
  'intent-recognition',
  'dialogue-management',
  'data-analysis',
  'image-analysis',
  'document-processing',
  'audio-transcription',
  'sentiment-analysis',
  'translation',
  'summarization',
];

const ALLOWED_COLLABORATION_MODES = ['parallel', 'sequential', 'hierarchical', 'consensus'];

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_STRING_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 100;

function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .trim()
    .slice(0, MAX_STRING_LENGTH);
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof key !== 'string' || key.length > 255) continue;

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, MAX_ARRAY_LENGTH).map((item) =>
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function securityMiddleware(
  request: NextRequest,
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > MAX_BODY_SIZE) {
      return {
        success: false,
        error: `Request body too large. Maximum size is ${MAX_BODY_SIZE / 1024 / 1024}MB`,
      };
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch (parseError) {
      return { success: false, error: 'Invalid JSON in request body' };
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { success: false, error: 'Request body must be a JSON object' };
    }

    const action = body.action;
    if (!action || typeof action !== 'string') {
      return { success: false, error: 'Missing or invalid "action" field' };
    }

    if (!ALLOWED_ACTIONS.includes(action)) {
      return {
        success: false,
        error: `Invalid action: "${action}". Allowed actions: ${ALLOWED_ACTIONS.join(', ')}`,
      };
    }

    if (body.type && !ALLOWED_TASK_TYPES.includes(body.type as string)) {
      return {
        success: false,
        error: `Invalid task type: "${body.type}". Allowed types: ${ALLOWED_TASK_TYPES.join(', ')}`,
      };
    }

    if (body.mode && !ALLOWED_COLLABORATION_MODES.includes(body.mode as string)) {
      return {
        success: false,
        error: `Invalid collaboration mode: "${body.mode}". Allowed modes: ${ALLOWED_COLLABORATION_MODES.join(', ')}`,
      };
    }

    if (body.tasks && Array.isArray(body.tasks)) {
      if (body.tasks.length > MAX_ARRAY_LENGTH) {
        return {
          success: false,
          error: `Too many tasks in array. Maximum allowed: ${MAX_ARRAY_LENGTH}`,
        };
      }
    }

    const sanitizedBody = sanitizeObject(body);

    return { success: true, data: sanitizedBody };
  } catch (error) {
    console.error('[Security Middleware] Error:', error);
    return { success: false, error: 'Security validation failed' };
  }
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'");
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    setInterval(() => this.cleanup(), this.windowMs * 2);
  }

  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.requests.get(identifier) || [];
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    const remaining = Math.max(0, this.maxRequests - timestamps.length);

    if (timestamps.length >= this.maxRequests) {
      const oldestTimestamp = timestamps[0];
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(oldestTimestamp + this.windowMs),
      };
    }

    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt: new Date(now + this.windowMs),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs * 2;

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter((t) => t > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

export const globalRateLimiter = new RateLimiter(60000, 100);
