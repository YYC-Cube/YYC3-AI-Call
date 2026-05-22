/**
 * YYC³ AI Calling - Prisma 查询优化中间件
 * 
 * 功能：
 * 1. 自动查询日志记录
 * 2. N+1查询检测
 * 3. 慢查询告警
 * 4. 连接池监控
 * 5. 查询缓存（可选）
 */

import { Prisma, PrismaClient } from '@prisma/client';

// ============================================
// 配置
// ============================================
const QUERY_OPTIMIZATION_CONFIG = {
  // 慢查询阈值（毫秒）
  slowQueryThreshold: 1000,
  
  // N+1检测：同一请求中相同模式的查询次数
  nPlusOneThreshold: 5,
  
  // 启用查询缓存（Redis）
  enableCache: process.env.ENABLE_QUERY_CACHE === 'true',
  
  // 缓存TTL（秒）
  cacheTTL: {
    customers: 300,    // 客户列表：5分钟
    calls: 60,         // 通话记录：1分钟
    analytics: 180,   // 分析数据：3分钟
    config: 3600,     // 配置数据：1小时
  },
  
  // 最大连接数建议
  poolConfig: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECT_TIMEOUT || '5000'),
  },
};

// ============================================
// 查询统计收集器
// ============================================
interface QueryStats {
  queryHash: string;
  pattern: string;
  count: number;
  totalDuration: number;
  lastExecuted: Date;
  isNPlusOne: boolean;
}

class QueryStatsCollector {
  private stats: Map<string, QueryStats> = new Map();
  private requestStats: Map<string, QueryStats> = new Map();
  
  record(query: string, duration: number): void {
    const queryHash = this.hashQuery(query);
    const pattern = this.extractPattern(query);
    
    const existing = this.stats.get(queryHash) || {
      queryHash,
      pattern,
      count: 0,
      totalDuration: 0,
      lastExecuted: new Date(),
      isNPlusOne: false,
    };

    existing.count++;
    existing.totalDuration += duration;
    existing.lastExecuted = new Date();

    this.stats.set(queryHash, existing);

    // 检测N+1问题（同一请求中）
    if (this.requestStats.has(queryHash)) {
      const reqStat = this.requestStats.get(queryHash)!;
      reqStat.count++;
      if (reqStat.count > QUERY_OPTIMIZATION_CONFIG.nPlusOneThreshold) {
        reqStat.isNPlusOne = true;
        console.warn(`⚠️  Possible N+1 Query Detected:`);
        console.warn(`   Pattern: ${pattern}`);
        console.warn(`   Count in current request: ${reqStat.count}`);
      }
    } else {
      this.requestStats.set(queryHash, { ...existing, count: 1 });
    }
  }

  getSlowQueries(): Array<{ pattern: string; count: number; avgDuration: number }> {
    const result: Array<{ pattern: string; count: number; avgDuration: number }> = [];
    
    for (const [, stat] of this.stats) {
      const avgDuration = stat.totalDuration / stat.count;
      
      if (avgDuration > QUERY_OPTIMIZATION_CONFIG.slowQueryThreshold) {
        result.push({
          pattern: stat.pattern,
          count: stat.count,
          avgDuration: Math.round(avgDuration),
        });
      }
    }

    return result.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  getNPlusOneQueries(): string[] {
    const patterns: string[] = [];
    
    for (const [, stat] of this.requestStats) {
      if (stat.isNPlusOne) {
        patterns.push(stat.pattern);
      }
    }

    return patterns;
  }

  clearRequestStats(): void {
    this.requestStats.clear();
  }

  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `q_${Math.abs(hash).toString(36)}`;
  }

  private extractPattern(query: string): string {
    return query
      .replace(/\b\d+\b/g, '?')           // 数字替换为?
      .replace(/'[^']*'/g, "'?'")         // 字符串替换为'?'
      .replace(/\s+/g, ' ')               // 多空格合并
      .trim();
  }
}

export const queryStats = new QueryStatsCollector();

// ============================================
// Prisma 中间件定义
// ============================================
export const prismaOptimizationMiddleware: Prisma.Middleware = async (params, next) => {
  const startTime = Date.now();
  
  try {
    const result = await next(params);
    
    const duration = Date.now() - startTime;

    // 记录查询统计
    const queryString = params.model ? `${params.action} ${params.model}` : params.action;
    queryStats.record(queryString, duration);

    // 慢查询告警
    if (duration > QUERY_OPTIMIZATION_CONFIG.slowQueryThreshold) {
      console.warn(`⏱️  Slow Query (${duration}ms): ${queryString}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('   Params:', JSON.stringify(params.args).substring(0, 200));
      }
    }

    // N+1查询警告
    const nPlusOneQueries = queryStats.getNPlusOneQueries();
    if (nPlusOneQueries.length > 0 && params.model === nPlusOneQueries[0]) {
      console.warn('🔄 Consider using include/select or batch queries to avoid N+1');
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Query Error (${duration}ms):`, error);
    throw error;
  }
};

// ============================================
// 查询缓存装饰器（可选）
// ============================================
export function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  if (!QUERY_OPTIMIZATION_CONFIG.enableCache) {
    return fetchFn();
  }

  // Redis缓存实现（需要安装ioredis）
  return import('ioredis').then(async ({ default: Redis }) => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return fetchFn();

    const redis = new Redis(redisUrl);
    
    try {
      // 尝试从缓存获取
      const cached = await redis.get(key);
      
      if (cached) {
        console.log(`📦 Cache HIT: ${key}`);
        return JSON.parse(cached);
      }

      // 缓存未命中，执行查询
      console.log(`💨 Cache MISS: ${key}`);
      const data = await fetchFn();

      // 写入缓存
      await redis.setex(key, ttlSeconds, JSON.stringify(data));

      return data;
    } finally {
      redis.disconnect();
    }
  }).catch(() => {
    // Redis不可用时降级为直接查询
    return fetchFn();
  });
}

// ============================================
// 批量操作优化工具
// ============================================
export class BatchOperations {
  /**
   * 批量创建（使用createMany）
   */
  static async batchCreate<T extends Record<string, unknown>>(
    model: keyof Prisma.TypeMap['model'],
    items: T[],
    batchSize: number = 100
  ): Promise<{ count: number; errors: number }> {
    let createdCount = 0;
    let errorCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      try {
        const prisma = new PrismaClient();
        
        // @ts-ignore - 动态模型访问
        const result = await prisma[model].createMany({
          data: batch as any,
          skipDuplicates: true,
        });

        createdCount += result.count;
        await prisma.$disconnect();
      } catch (error) {
        console.error(`Batch create error at index ${i}:`, error);
        errorCount += batch.length;
      }
    }

    return { count: createdCount, errors: errorCount };
  }

  /**
   * 批量更新（分批执行）
   */
  static async batchUpdate<T extends { id: string }>(
    model: keyof Prisma.TypeMap['model'],
    updates: Array<{ id: string; data: Partial<T> }>,
    batchSize: number = 50
  ): Promise<{ updated: number; errors: number }> {
    let updatedCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        const prisma = new PrismaClient();
        
        // @ts-ignore
        await prisma[model].update({
          where: { id: update.id },
          data: update.data as any,
        });

        updatedCount++;
        await prisma.$disconnect();
      } catch (error) {
        errorCount++;
      }

      // 每 batchSize 条后暂停一下，避免过载
      if (updatedCount % batchSize === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return { updated: updatedCount, errors: errorCount };
  }
}

// ============================================
// 连接池健康检查
// ============================================
export async function checkConnectionPoolHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  waitingCount: number;
}> {
  const prisma = new PrismaClient();

  try {
    const stats = (await prisma.$queryRaw`
      SELECT
        state,
        count(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `) as Array<{ state: string; connection_count: bigint }>;

    const maxConnResult = (await prisma.$queryRaw`
      SELECT setting::int as max_connections
      FROM pg_settings
      WHERE name = 'max_connections'
    `) as Array<{ max_connections: number }>;

    await prisma.$disconnect();

    const activeConnections = parseInt(
      stats.find(s => s.state === 'active')?.connection_count.toString() || '0'
    );
    const idleConnections = parseInt(
      stats.find(s => s.state === 'idle')?.connection_count.toString() || '0'
    );
    const maxConnections = maxConnResult[0]?.max_connections || 100;
    const totalConnections = activeConnections + idleConnections;
    const usageRatio = totalConnections / maxConnections;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (usageRatio > 0.9) {
      status = 'critical';
    } else if (usageRatio > 0.7) {
      status = 'warning';
    }

    return {
      status,
      activeConnections,
      idleConnections,
      maxConnections,
      waitingCount: Math.max(0, totalConnections - maxConnections),
    };
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

// ============================================
// 导出
// ============================================
export {
  QUERY_OPTIMIZATION_CONFIG,
  QueryStatsCollector,
};

export default {
  prismaOptimizationMiddleware,
  withCache,
  BatchOperations,
  checkConnectionPoolHealth,
  queryStats,
};
