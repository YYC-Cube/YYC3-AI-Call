import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
  retryAfter?: number;
}

class RateLimiter {
  private redis: Redis | null = null;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();
  private useMemoryFallback: boolean = true;

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });

        this.redis.on('error', (err) => {
          console.error('[RateLimiter] Redis connection error:', err.message);
          this.useMemoryFallback = true;
        });
      } catch (error) {
        console.warn('[RateLimiter] Failed to connect to Redis, using memory fallback');
        this.useMemoryFallback = true;
      }
    }
  }

  async check(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix || 'ratelimit'}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (this.redis && !this.useMemoryFallback) {
      return this.checkRedis(key, config, now);
    }

    return this.checkMemory(key, config, now, windowStart);
  }

  private async checkRedis(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<RateLimitResult> {
    try {
      const windowStart = now - config.windowMs;
      const pipeline = this.redis!.pipeline();
      
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.pexpireat(key, now + config.windowMs);
      
      const results = await pipeline.exec();
      
      if (!results || results.some(r => r?.[0])) {
        throw new Error('Pipeline execution failed');
      }

      const currentCount = results[1]?.[1] as number || 0;

      if (currentCount >= config.maxRequests) {
        const oldestRequest = await this.redis!.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = new Date(parseInt(oldestRequest[1]) + config.windowMs);
        
        return {
          success: false,
          remaining: 0,
          resetTime,
          limit: config.maxRequests,
          retryAfter: Math.ceil((resetTime.getTime() - now) / 1000),
        };
      }

      await this.redis!.zadd(key, now.toString(), `${now}-${Math.random()}`);
      
      return {
        success: true,
        remaining: config.maxRequests - currentCount - 1,
        resetTime: new Date(now + config.windowMs),
        limit: config.maxRequests,
      };
    } catch (error) {
      console.error('[RateLimiter] Redis error, falling back to memory:', error);
      this.useMemoryFallback = true;
      return this.checkMemory(key, config, now, now - config.windowMs);
    }
  }

  private checkMemory(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): RateLimitResult {
    const stored = this.memoryStore.get(key);

    if (!stored || stored.resetTime < now) {
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });

      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now + config.windowMs),
        limit: config.maxRequests,
      };
    }

    if (stored.count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: new Date(stored.resetTime),
        limit: config.maxRequests,
        retryAfter: Math.ceil((stored.resetTime - now) / 1000),
      };
    }

    stored.count += 1;

    return {
      success: true,
      remaining: config.maxRequests - stored.count,
      resetTime: new Date(stored.resetTime),
      limit: config.maxRequests,
    };
  }

  async reset(identifier: string, keyPrefix?: string): Promise<void> {
    const key = `${keyPrefix || 'ratelimit'}:${identifier}`;

    if (this.redis && !this.useMemoryFallback) {
      await this.redis.del(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  cleanup(): void {
    const now = Date.now();
    
    for (const [key, value] of this.memoryStore.entries()) {
      if (value.resetTime < now) {
        this.memoryStore.delete(key);
      }
    }

    if (this.memoryStore.size > 10000) {
      console.warn('[RateLimiter] Memory store too large, clearing old entries');
      const entries = Array.from(this.memoryStore.entries())
        .sort((a, b) => a[1].resetTime - b[1].resetTime);
      
      for (let i = 0; i < entries.length / 2; i++) {
        this.memoryStore.delete(entries[i][0]);
      }
    }
  }
}

export const rateLimiter = new RateLimiter(process.env.REDIS_URL);

export const RateLimitConfigs = {
  api: {
    general: {
      windowMs: 60 * 1000,
      maxRequests: 100,
      keyPrefix: 'api_general',
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      keyPrefix: 'api_auth',
    },
    upload: {
      windowMs: 60 * 1000,
      maxRequests: 10,
      keyPrefix: 'api_upload',
    },
    aiCall: {
      windowMs: 60 * 1000,
      maxRequests: 20,
      keyPrefix: 'ai_call',
    },
    export: {
      windowMs: 5 * 60 * 1000,
      maxRequests: 3,
      keyPrefix: 'api_export',
    },
  },

  websocket: {
    connections: {
      windowMs: 60 * 1000,
      maxRequests: 10,
      keyPrefix: 'ws_connect',
    },
    messages: {
      windowMs: 1000,
      maxRequests: 30,
      keyPrefix: 'ws_message',
    },
  },
};

export type { RateLimitConfig, RateLimitResult };
export { RateLimiter };
