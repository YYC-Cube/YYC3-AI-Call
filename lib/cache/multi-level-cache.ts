/**
 * YYC³ AI Calling - Redis 多层缓存系统
 * 
 * 架构：
 * L1: 内存缓存（Node.js进程内，最快，单实例）
 * L2: Redis缓存（分布式，跨实例共享）
 * L3: 数据库（最终数据源）
 * 
 * 策略：
 * - Cache-Aside（旁路缓存）：读时先查缓存
 * - Write-Through（写穿透）：写时同步更新缓存
 * - Write-Behind（异步写入）：高并发场景延迟写入
 * 
 * 特性：
 * - 多级TTL（热点数据长期，冷门数据短期）
 * - 预热机制（启动时加载关键数据）
 * - 缓存击穿防护（互斥锁）
 * - 缓存雪崩保护（随机TTL抖动）
 */

import Redis from 'ioredis';
import crypto from 'crypto';

// ============================================
// 类型定义
// ============================================
interface CacheOptions {
  ttl?: number;           // 过期时间（秒）
  ttlJitter?: boolean;    // TTL随机抖动（防雪崩）
  namespace?: string;     // 命名空间前缀
  compress?: boolean;     // 压缩大值
  version?: string;       // 版本号（用于批量失效）
}

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  version: string;
  compressed?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  avgHitDuration: number;
  avgMissDuration: number;
}

// ============================================
// 配置
// ============================================
const CACHE_CONFIG = {
  // Redis连接
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // 默认TTL（秒）
  defaultTTL: 300,        // 5分钟
  
  // 各业务模块TTL
  ttlByCategory: {
    session: 3600,         // 会话：1小时
    user: 1800,            // 用户信息：30分钟
    customer: 300,         // 客户：5分钟
    call: 60,              // 通话记录：1分钟
    ai_response: 900,      // AI响应：15分钟
    analytics: 180,        // 分析数据：3分钟
    config: 86400,         // 配置：24小时
    permission: 3600,      // 权限：1小时
    rate_limit: 300,       // 速率限制：5分钟
  },
  
  // L1内存缓存配置
  l1: {
    enabled: true,
    maxSize: 1000,         // 最大条目数
    defaultTTL: 60,        // 内存缓存默认1分钟
  },
  
  // 安全配置
  keyPrefix: 'yyc3:',
  maxKeyLength: 200,
};

// ============================================
// L1: 进程内内存缓存
// ============================================
class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;
  private currentSize: number = 0;

  constructor(maxSize: number = CACHE_CONFIG.l1.maxSize) {
    this.maxSize = maxSize;

    // 定期清理过期条目
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.currentSize--;
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = CACHE_CONFIG.l1.defaultTTL): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else {
      // 检查容量
      if (this.currentSize >= this.maxSize) {
        this.evictLRU();
      }
      this.currentSize++;
    }

    const entry: CacheEntry<T> = {
      data: value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttlSeconds * 1000),
      version: '1',
    };

    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    if (this.cache.delete(key)) {
      this.currentSize--;
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.currentSize--;
      return false;
    }

    return true;
  }

  size(): number {
    return this.currentSize;
  }

  private evictLRU(): void {
    // 找到最早创建的条目（LRU）
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.currentSize--;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.currentSize--;
      }
    }
  }
}

// ============================================
// L2: Redis分布式缓存
// ============================================
class RedisCache {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) return;

    try {
      this.client = new Redis(CACHE_CONFIG.redisUrl, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      await this.client.connect();
      this.isConnected = true;

      console.log('✅ Redis cache connected');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const raw = await this.client.get(this.buildKey(key));
      
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);

      // 检查是否过期（双重检查）
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Redis GET error:', error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const {
        ttl = CACHE_CONFIG.defaultTTL,
        ttlJitter = true,
        version = '1',
      } = options;

      // TTL随机抖动（防止雪崩）
      const actualTTL = ttlJitter ? this.addJitter(ttl) : ttl;

      const entry: CacheEntry<T> = {
        data: value,
        createdAt: Date.now(),
        expiresAt: Date.now() + (actualTTL * 1000),
        version,
      };

      const result = await this.client.setex(
        this.buildKey(key),
        actualTTL,
        JSON.stringify(entry)
      );

      return result === 'OK';
    } catch (error) {
      console.warn('Redis SET error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const result = await this.client.del(this.buildKey(key));
      return result > 0;
    } catch (error) {
      console.warn('Redis DEL error:', error);
      return false;
    }
  }

  async exists(keys: string[]): Promise<number> {
    if (!this.client || !this.isConnected) return 0;

    try {
      const redisKeys = keys.map(k => this.buildKey(k));
      return await this.client.exists(...redisKeys);
    } catch (error) {
      console.warn('Redis EXISTS error:', error);
      return 0;
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) return 0;

    try {
      const fullPattern = `${CACHE_CONFIG.keyPrefix}${pattern}*`;
      const stream = this.client.scanStream({ match: fullPattern, count: 100 });
      
      let deletedCount = 0;
      
      return new Promise((resolve, reject) => {
        stream.on('data', async (keys: string[]) => {
          if (keys.length > 0) {
            deletedCount += await this.client!.del(...keys);
          }
        });
        
        stream.on('end', () => resolve(deletedCount));
        stream.on('error', reject);
      });
    } catch (error) {
      console.warn('Redis CLEAR_PATTERN error:', error);
      return 0;
    }
  }

  private buildKey(key: string): string {
    return `${CACHE_CONFIG.keyPrefix}${key}`;
  }

  private addJitter(ttl: number): number {
    // 在原TTL基础上添加±10%的随机偏移
    const jitter = Math.floor(ttl * 0.1 * (Math.random() * 2 - 1));
    return Math.max(1, ttl + jitter);
  }
}

// ============================================
// 统一缓存接口（多层缓存）
// ============================================
export class MultiLevelCache {
  private l1: MemoryCache;
  private l2: RedisCache;
  private stats: CacheStats;

  constructor() {
    this.l1 = new MemoryCache();
    this.l2 = new RedisCache();
    this.stats = this.initStats();

    // 初始化L2连接（如果可用）
    if (process.env.REDIS_URL) {
      this.l2.connect().catch(() => {
        console.warn('⚠️  Redis unavailable, using memory-only cache');
      });
    }
  }

  /**
   * 获取缓存（多层查找）
   */
  async get<T>(
    category: keyof typeof CACHE_CONFIG.ttlByCategory,
    key: string
  ): Promise<T | null> {
    const startTime = Date.now();

    // L1: 内存缓存（最快）
    let result = this.l1.get<T>(`${category}:${key}`);
    
    if (result !== null) {
      this.recordHit(startTime);
      return result;
    }

    // L2: Redis缓存
    result = await this.l2.get<T>(`${category}:${key}`);
    
    if (result !== null) {
      // 回填L1缓存
      const ttl = CACHE_CONFIG.ttlByCategory[category] || CACHE_CONFIG.defaultTTL;
      this.l1.set(`${category}:${key}`, result, Math.min(ttl, CACHE_CONFIG.l1.defaultTTL));
      
      this.recordHit(startTime);
      return result;
    }

    // 未命中
    this.recordMiss(startTime);
    return null;
  }

  /**
   * 设置缓存（多层写入）
   */
  async set<T>(
    category: keyof typeof CACHE_CONFIG.ttlByCategory,
    key: string,
    value: T,
    customTTL?: number
  ): Promise<void> {
    const ttl = customTTL || CACHE_CONFIG.ttlByCategory[category] || CACHE_CONFIG.defaultTTL;
    const cacheKey = `${category}:${key}`;

    // 写入L1
    this.l1.set(cacheKey, value, Math.min(ttl, CACHE_CONFIG.l1.defaultTTL));

    // 写入L2
    if (this.l2) {
      await this.l2.set(cacheKey, value, { ttl });
    }

    this.stats.sets++;
  }

  /**
   * 删除缓存（多层删除）
   */
  async delete(
    category: keyof typeof CACHE_CONFIG.ttlByCategory,
    key: string
  ): Promise<void> {
    const cacheKey = `${category}:${key}`;

    // 从L1删除
    this.l1.delete(cacheKey);

    // 从L2删除
    if (this.l2) {
      await this.l2.delete(cacheKey);
    }

    this.stats.deletes++;
  }

  /**
   * 批量清除分类下的所有缓存
   */
  async clearCategory(category: keyof typeof CACHE_CONFIG.ttlByCategory): Promise<number> {
    // 清除L1中该分类的所有键
    // （内存缓存无法按模式匹配，只能清除全部或等待过期）

    // 清除L2中该分类的所有键
    let cleared = 0;
    if (this.l2) {
      cleared = await this.l2.clearPattern(`${category}:`);
    }

    console.log(`🗑️  Cleared ${cleared} cache entries in category: ${category}`);
    return cleared;
  }

  /**
   * 获取或设置（Cache-Aside模式）
   */
  async getOrSet<T>(
    category: keyof typeof CACHE_CONFIG.ttlByCategory,
    key: string,
    fetchFn: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.get<T>(category, key);
    
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行获取函数
    const value = await fetchFn();

    // 写入缓存
    await this.set(category, key, value, customTTL);

    return value;
  }

  /**
   * 带互斥锁的缓存（防止缓存击穿）
   */
  async getOrSetWithLock<T>(
    category: keyof typeof CACHE_CONFIG.ttlByCategory,
    key: string,
    fetchFn: () => Promise<T>,
    lockTimeout: number = 10,
    customTTL?: number
  ): Promise<T> {
    const cacheKey = `${category}:${key}`;
    const lockKey = `${cacheKey}:lock`;

    // 尝试从缓存获取
    const cached = await this.get<T>(category, key);
    
    if (cached !== null) {
      return cached;
    }

    // 尝试获取分布式锁
    const lockAcquired = await this.acquireLock(lockKey, lockTimeout);
    
    if (lockAcquired) {
      try {
        // 双重检查（其他线程可能已经重建了缓存）
        const doubleCheck = await this.get<T>(category, key);
        if (doubleCheck !== null) {
          return doubleCheck;
        }

        // 执行数据获取
        const value = await fetchFn();

        // 写入缓存
        await this.set(category, key, value, customTTL);

        return value;
      } finally {
        // 释放锁
        await this.releaseLock(lockKey);
      }
    } else {
      // 未获取到锁，短暂等待后重试读取缓存
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const retryResult = await this.get<T>(category, key);
      if (retryResult !== null) {
        return retryResult;
      }

      // 最后降级：直接调用fetchFn（不写入缓存避免雪崩）
      return fetchFn();
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      ...this.stats,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      avgHitDuration: this.stats.hits > 0 ? 0 : 0, // TODO: 实现耗时追踪
      avgMissDuration: this.stats.misses > 0 ? 0 : 0,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initStats();
  }

  private initStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      avgHitDuration: 0,
      avgMissDuration: 0,
    };
  }

  private recordHit(startTime: number): void {
    this.stats.hits++;
    // TODO: 记录命中耗时
  }

  private recordMiss(startTime: number): void {
    this.stats.misses++;
    // TODO: 记录未命中耗时
  }

  private async acquireLock(key: string, timeout: number): Promise<boolean> {
    if (!this.l2) return false;

    try {
      const result = await (this.l2 as any).client?.set(
        `${CACHE_CONFIG.keyPrefix}${key}`,
        '1',
        'EX',
        timeout,
        'NX'
      );

      return result === 'OK';
    } catch {
      return false;
    }
  }

  private async releaseLock(key: string): Promise<void> {
    if (this.l2) {
      await this.l2.delete(key);
    }
  }
}

// ============================================
// 全局缓存实例
// ============================================
export const cache = new MultiLevelCache();

// ============================================
// 缓存预热器
// ============================================
export class CacheWarmer {
  private warmupTasks: Array<{
    category: keyof typeof CACHE_CONFIG.ttlByCategory;
    key: string;
    fetchFn: () => Promise<unknown>;
    priority: number; // 1-5, 5最高优先级
  }> = [];

  /**
   * 注册预热任务
   */
  register(
    category: keyof typeof CACHE_CONFIG.ttlByCategory,
    key: string,
    fetchFn: () => Promise<unknown>,
    priority: number = 3
  ): void {
    this.warmupTasks.push({ category, key, fetchFn, priority });
  }

  /**
   * 执行预热（按优先级排序）
   */
  async warmup(): Promise<{
    success: number;
    failed: number;
    skipped: number;
    duration: number;
  }> {
    const startTime = Date.now();
    let success = 0;
    let failed = 0;
    let skipped = 0;

    // 按优先级降序排列
    this.warmupTasks.sort((a, b) => b.priority - a.priority);

    console.log(`🔥 Starting cache warmup with ${this.warmupTasks.length} tasks...`);

    for (const task of this.warmupTasks) {
      try {
        const value = await task.fetchFn();
        
        if (value !== undefined && value !== null) {
          await cache.set(task.category, task.key, value);
          success++;
          console.log(`  ✓ ${task.category}:${task.key}`);
        } else {
          skipped++;
          console.log(`  - ${task.category}:${task.key} (empty value, skipped)`);
        }
      } catch (error) {
        failed++;
        console.error(`  ✗ ${task.category}:${task.key}`, error);
      }

      // 避免过快请求导致压力过大
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const duration = Date.now() - startTime;

    console.log(`\n✅ Cache warmup completed:`);
    console.log(`   Success: ${success}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

    return { success, failed, skipped, duration };
  }

  /**
   * 清空预热任务列表
   */
  clear(): void {
    this.warmupTasks = [];
  }
}

export const cacheWarmer = new CacheWarmer();

// ============================================
// 导出
// ============================================
export { CACHE_CONFIG };
export type { CacheOptions, CacheStats };

export default {
  cache,
  cacheWarmer,
  MultiLevelCache,
};
