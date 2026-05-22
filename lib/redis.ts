/**
 * @fileoverview Redis 缓存配置
 * @description Redis 客户端配置和缓存工具函数
 * @module lib/redis
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 3) {
        console.error('Redis 连接重试次数超过限制');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

redis.on('connect', () => {
  console.log('✅ Redis 连接成功');
});

redis.on('error', (error) => {
  console.error('❌ Redis 连接错误:', error.message);
});

export default redis;

// 缓存工具函数
export class CacheService {
  private static readonly DEFAULT_TTL = 3600; // 默认1小时

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ 缓存读取失败 [${key}]:`, error);
      return null;
    }
  }

  static async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, 'EX', ttlSeconds ?? this.DEFAULT_TTL);
    } catch (error) {
      console.error(`❌ 缓存写入失败 [${key}]:`, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`❌ 缓存删除失败 [${key}]:`, error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ 缓存检查失败 [${key}]:`, error);
      return false;
    }
  }

  static async increment(
    key: string,
    ttlSeconds?: number
  ): Promise<number> {
    try {
      const result = await redis.incr(key);
      if (ttlSeconds && result === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      console.error(`❌ 计数器递增失败 [${key}]:`, error);
      return 0;
    }
  }
}
