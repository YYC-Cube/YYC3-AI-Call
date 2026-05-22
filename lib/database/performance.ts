/**
 * YYC³ AI Calling - 数据库性能优化工具
 * 
 * 功能：
 * 1. 慢查询分析与优化建议
 * 2. 索引管理（创建/删除/重建）
 * 3. 查询性能监控
 * 4. 连接池优化配置
 * 5. 表统计信息维护
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'stdout',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
  ],
});

// ============================================
// 类型定义
// ============================================
interface SlowQueryInfo {
  queryId: string;
  query: string;
  duration: number;
  calls: number;
  meanTime: number;
  rows: number;
  suggestion?: string;
}

interface IndexAnalysis {
  tableName: string;
  indexName: string;
  columns: string[];
  sizeMB: number;
  usageCount: number;
  efficiency: number; // 0-100
  recommendation: 'KEEP' | 'REMOVE' | 'REBUILD' | 'CREATE';
}

interface TableStats {
  tableName: string;
  rowCount: number;
  totalSizeMB: number;
  indexSizeMB: number;
  dataSizeMB: number;
  bloatRatio: number;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
}

// ============================================
// 1. 慢查询分析
// ============================================
export async function analyzeSlowQueries(
  thresholdMs: number = 1000,
  limit: number = 20
): Promise<SlowQueryInfo[]> {
  
  const slowQueries = await prisma.$queryRaw`
    SELECT 
      queryid,
      query,
      calls,
      total_exec_time / 1000 as duration_ms,
      mean_exec_time / 1000 as mean_time_ms,
      rows
    FROM pg_stat_statements 
    WHERE mean_exec_time > ${thresholdMs} * 1000
    ORDER BY total_exec_time DESC
    LIMIT ${limit}
  ` as SlowQueryInfo[];

  const analyzedQueries = slowQueries.map(query => ({
    ...query,
    suggestion: generateOptimizationSuggestion(query.query),
  }));

  return analyzedQueries;
}

function generateOptimizationSuggestion(sql: string): string {
  const upperSQL = sql.toUpperCase();

  if (upperSQL.includes('SELECT') && !upperSQL.includes('WHERE')) {
    return '⚠️ 全表扫描：考虑添加WHERE条件或LIMIT限制返回行数';
  }

  if (upperSQL.includes('LIKE')) {
    return '💡 LIKE查询：考虑使用全文搜索索引(pg_trgm)或前缀索引';
  }

  if (upperSQL.includes('ORDER BY') && !upperSQL.includes('INDEX')) {
    return '📊 排序操作：确保排序列有相应索引';
  }

  if (upperSQL.includes('JOIN') && upperSQL.includes('ON')) {
    return '🔗 JOIN操作：检查JOIN条件是否有复合索引支持';
  }

  if (upperSQL.includes('COUNT(*)') || upperSQL.includes('COUNT(1)')) {
    return '🔢 COUNT聚合：大表考虑使用物化视图或缓存计数结果';
  }

  if (sql.length > 500) {
    return '📝 复杂查询：考虑拆分为多个简单查询或使用存储过程';
  }

  return '✅ 查询结构良好，继续监控';
}

// ============================================
// 2. 索引分析与优化
// ============================================
export async function analyzeIndexes(): Promise<IndexAnalysis[]> {
  const indexes = await prisma.$queryRaw`
    SELECT
      schemaname || '.' || tablename as "tableName",
      indexrelname as "indexName",
      pg_get_indexdef(indexrelid) as definition,
      pg_relation_size(indexrelid) / 1024 / 1024 as "sizeMB",
      idx_scan as "usageCount",
      idx_tup_read + idx_tup_fetch as "rowsAccessed"
    FROM pg_stat_user_indexes
    JOIN pg_indexes ON pg_stat_user_indexes.indexrelname = pg_indexes.indexname
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC
  ` as any[];

  const analysis: IndexAnalysis[] = indexes.map(idx => {
    const efficiency = calculateIndexEfficiency(idx.usageCount, idx.sizeMB);
    
    return {
      tableName: idx.tableName,
      indexName: idx.indexName,
      columns: extractColumnsFromDefinition(idx.definition),
      sizeMB: parseFloat(idx.sizeMB),
      usageCount: parseInt(idx.usageCount),
      efficiency,
      recommendation: getIndexRecommendation(efficiency, idx.sizeMB, idx.usageCount),
    };
  });

  return analysis;
}

function calculateIndexEfficiency(usageCount: number, sizeMB: number): number {
  if (usageCount === 0) return 0;
  
  // 效率 = 使用次数 / 大小(MB)，归一化到0-100
  const rawScore = (usageCount / Math.max(sizeMB, 1)) * 10;
  return Math.min(100, Math.round(rawScore));
}

function getIndexRecommendation(
  efficiency: number,
  sizeMB: number,
  usageCount: number
): IndexAnalysis['recommendation'] {
  if (usageCount === 0 && sizeMB > 10) {
    return 'REMOVE'; // 未使用且占用空间大
  }
  
  if (efficiency < 20 && sizeMB > 50) {
    return 'REBUILD'; // 效率低且体积大，可能需要重建
  }
  
  if (efficiency < 30) {
    return 'CREATE'; // 可能需要更好的索引设计
  }

  return 'KEEP'; // 索引状态良好
}

function extractColumnsFromDefinition(definition: string): string[] {
  const match = definition.match(/\(([^)]+)\)/);
  if (!match) return [];
  
  return match[1]
    .split(',')
    .map(col => col.trim().replace(/^(ASC|DESC)\s/i, '').replace(/['"]/g, ''));
}

// ============================================
// 3. 表统计分析
// ============================================
export async function analyzeTables(): Promise<TableStats[]> {
  const tables = await prisma.$queryRaw`
    SELECT
      relname as "tableName",
      n_live_tup as "rowCount",
      pg_total_relation_size(relid) / 1024 / 1024 as "totalSizeMB",
      pg_relation_size(relid) / 1024 / 1024 as "indexSizeMB",
      pg_relation_size(relid) / 1024 / 1024 - 
        (pg_total_relation_size(relid) - pg_relation_size(relid)) / 1024 / 1024 as "dataSizeMB",
      CASE 
        WHEN n_dead_tup > 0 THEN round(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2)
        ELSE 0 
      END as "bloatRatio",
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(relid) DESC
  ` as TableStats[];

  return tables;
}

// ============================================
// 4. 索引优化建议生成器
// ============================================
export async function generateIndexOptimizationPlan(): Promise<{
  create: Array<{ table: string; columns: string; type: string; reason: string }>;
  remove: Array<{ name: string; table: string; reason: string }>;
  rebuild: Array<{ name: string; table: string; reason: string }>;
}> {
  const plan = {
    create: [] as Array<{ table: string; columns: string; type: string; reason: string }>,
    remove: [] as Array<{ name: string; table: string; reason: string }>,
    rebuild: [] as Array<{ name: string; table: string; reason: string }>,
  };

  // 分析现有索引使用情况
  const indexes = await analyzeIndexes();
  
  for (const idx of indexes) {
    switch (idx.recommendation) {
      case 'REMOVE':
        plan.remove.push({
          name: idx.indexName,
          table: idx.tableName,
          reason: `未使用(${idx.usageCount}次), 占用${idx.sizeMB.toFixed(1)}MB`,
        });
        break;
        
      case 'REBUILD':
        plan.rebuild.push({
          name: idx.indexName,
          table: idx.tableName,
          reason: `效率低(${idx.efficiency}%), 体积大(${idx.sizeMB.toFixed(1)}MB)`,
        });
        break;
    }
  }

  // 基于查询模式推荐新索引
  const slowQueries = await analyzeSlowQueries(500, 50);
  
  for (const query of slowQueries) {
    const suggestion = suggestMissingIndex(query.query);
    if (suggestion) {
      plan.create.push(suggestion);
    }
  }

  // 针对业务表的特定建议
  plan.create.push(
    {
      table: '"Call"',
      columns: '(customerId, status, "createdAt")',
      type: 'BTREE',
      reason: '高频查询：按客户筛选通话记录并按时间排序',
    },
    {
      table: '"Customer"',
      columns: 'USING gin(to_tsvector(\'simple\', name || \' \' || company))',
      type: 'GIN',
      reason: '全文搜索：客户名称和公司搜索优化',
    },
    {
      table: '"Call"',
      columns: '("createdAt" DESC)',
      type: 'BTREE',
      reason: '排序优化：按创建时间倒序查询最新通话',
    }
  );

  return plan;
}

function suggestMissingIndex(sql: string): { table: string; columns: string; type: string; reason: string } | null {
  const upperSQL = sql.toUpperCase();

  // 检测FROM子句中的表名
  const fromMatch = sql.match(/FROM\s+"?(\w+)"?\s+/i);
  if (!fromMatch) return null;

  const table = fromMatch[1];

  // 检测WHERE条件中的列
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+GROUP BY|\s+LIMIT|$)/is);
  if (!whereMatch) return null;

  const whereClause = whereMatch[1];
  const columns = extractWhereColumns(whereClause);

  if (columns.length >= 1) {
    return {
      table,
      columns: `(${columns.join(', ')})`,
      type: 'BTREE',
      reason: `基于慢查询模式：${columns.join(', ')}列频繁用于过滤`,
    };
  }

  return null;
}

function extractWhereColumns(whereClause: string): string[] {
  const columns: string[] = [];
  const regex = /"?(\w+)"?\s*(?:=|>|<|LIKE|IN|BETWEEN)/gi;
  let match;

  while ((match = regex.exec(whereClause)) !== null) {
    const col = match[1];
    if (!columns.includes(col) && !['AND', 'OR', 'NOT'].includes(col.toUpperCase())) {
      columns.push(col);
    }
  }

  return columns.slice(0, 3); // 最多3个列组成复合索引
}

// ============================================
// 5. 执行优化操作
// ============================================
export async function executeOptimization(
  plan: Awaited<ReturnType<typeof generateIndexOptimizationPlan>>,
  dryRun: boolean = true
): Promise<string[]> {
  const results: string[] = [];

  if (!dryRun) {
    results.push('⚠️  生产环境执行模式：将实际修改数据库！');
  } else {
    results.push('📋 Dry Run模式：仅显示将要执行的操作');
  }

  results.push('\n--- 待移除的索引 ---');
  for (const idx of plan.remove) {
    const sql = `DROP INDEX IF EXISTS "${idx.name}";`;
    results.push(`\n${sql}`);
    results.push(`   原因: ${idx.reason}`);

    if (!dryRun) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push(`   ✅ 已移除`);
      } catch (error) {
        results.push(`   ❌ 错误: ${(error as Error).message}`);
      }
    }
  }

  results.push('\n--- 待重建的索引 ---');
  for (const idx of plan.rebuild) {
    const sql = `REINDEX INDEX "${idx.name}";`;
    results.push(`\n${sql}`);
    results.push(`   原因: ${idx.reason}`);

    if (!dryRun) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push(`   ✅ 已重建`);
      } catch (error) {
        results.push(`   ❌ 错误: ${(error as Error).message}`);
      }
    }
  }

  results.push('\n--- 待创建的索引 ---');
  for (const idx of plan.create) {
    const sql = `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${idx.table.replace(/"/g, '')}_${idx.columns.replace(/[()]/g, '_').replace(/,/g, '_').replace(/ /g, '')} ON ${idx.table} ${idx.type} ${idx.columns};`;
    results.push(`\n${sql}`);
    results.push(`   原因: ${idx.reason}`);

    if (!dryRun) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push(`   ✅ 已创建`);
      } catch (error) {
        results.push(`   ❌ 错误: ${(error as Error).message}`);
      }
    }
  }

  return results;
}

// ============================================
// 6. 性能健康检查
// ============================================
export async function performanceHealthCheck(): Promise<{
  score: number; // 0-100
  issues: Array<{ severity: 'CRITICAL' | 'WARNING' | 'INFO'; message: string }>;
  metrics: {
    connectionPoolUsage: number;
    cacheHitRatio: number;
    deadTuplesRatio: number;
    avgQueryDuration: number;
    indexUsageEfficiency: number;
  };
}> {
  const issues: Array<{ severity: 'CRITICAL' | 'WARNING' | 'INFO'; message: string }> = [];
  let score = 100;

  // 检查连接池使用率
  const poolStats = await prisma.$queryRaw`
    SELECT 
      count(*) as active_connections,
      setting as max_connections,
      round(count(*)::numeric / setting::numeric * 100, 2) as usage_percent
    FROM pg_stat_activity
    CROSS JOIN pg_settings WHERE name = 'max_connections'
  ` as any[];

  const poolUsage = parseFloat(poolStats[0]?.usage_percent || 0);
  if (poolUsage > 80) {
    issues.push({ severity: 'CRITICAL', message: `连接池使用率过高: ${poolUsage}% (>80%)` });
    score -= 25;
  } else if (poolUsage > 60) {
    issues.push({ severity: 'WARNING', message: `连接池使用率偏高: ${poolUsage}%` });
    score -= 10;
  }

  // 检查缓存命中率
  const cacheStats = await prisma.$queryRaw`
    SELECT 
      round(sum(blks_hit)::numeric / (sum(blks_hit) + sum(blks_read)) * 100, 2) as cache_hit_ratio
    FROM pg_stat_database
    WHERE datname = current_database()
  ` as any[];

  const cacheHitRatio = parseFloat(cacheStats[0]?.cache_hit_ratio || 0);
  if (cacheHitRatio < 90) {
    issues.push({ severity: 'WARNING', message: `缓存命中率偏低: ${cacheHitRatio}% (<95%理想值)` });
    score -= 15;
  }

  // 检查死元组比例
  const deadTupleStats = await prisma.$queryRaw`
    SELECT 
      round(sum(n_dead_tup)::numeric / NULLIF(sum(n_live_tup), 0) * 100, 2) as dead_tuple_ratio
    FROM pg_stat_user_tables
  ` as any[];

  const deadTuplesRatio = parseFloat(deadTupleStats[0]?.dead_tuple_ratio || 0);
  if (deadTuplesRatio > 20) {
    issues.push({ severity: 'WARNING', message: `死元组比例过高: ${deadTuplesRatio}% (需执行VACUUM)` });
    score -= 15;
  }

  // 检查平均查询时长
  const queryStats = await prisma.$queryRaw`
    SELECT 
      round(avg(mean_exec_time) / 1000, 2) as avg_query_duration_ms
    FROM pg_stat_statements
    WHERE calls > 10
  ` as any[];

  const avgQueryDuration = parseFloat(queryStats[0]?.avg_query_duration_ms || 0);
  if (avgQueryDuration > 500) {
    issues.push({ severity: 'WARNING', message: `平均查询时长偏长: ${avgQueryDuration}ms` });
    score -= 10;
  }

  // 索引使用效率
  const indexStats = await prisma.$queryRaw`
    SELECT 
      round(count(CASE WHEN idx_scan = 0 THEN 1 END)::numeric / count(*) * 100, 2) as unused_index_ratio
    FROM pg_stat_user_indexes
  ` as any[];

  const unusedIndexRatio = parseFloat(indexStats[0]?.unused_index_ratio || 0);
  const indexEfficiency = 100 - unusedIndexRatio;
  if (unusedIndexRatio > 30) {
    issues.push({ severity: 'INFO', message: `${unusedIndexRatio.toFixed(1)}%的索引未被使用` });
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    issues,
    metrics: {
      connectionPoolUsage: poolUsage,
      cacheHitRatio,
      deadTuplesRatio,
      avgQueryDuration,
      indexUsageEfficiency: indexEfficiency,
    },
  };
}

// ============================================
// 导出
// ============================================
export default {
  analyzeSlowQueries,
  analyzeIndexes,
  analyzeTables,
  generateIndexOptimizationPlan,
  executeOptimization,
  performanceHealthCheck,
};
