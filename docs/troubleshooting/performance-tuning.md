# ⚡ YYC³ AI Calling 性能调优手册

> **版本**: 1.0  
> **最后更新**: 2026-05-02  
> **目标环境**: Production (生产环境)

---

## 📋 目录

1. [性能基线与目标](#性能基线与目标)
2. [数据库性能优化](#数据库性能优化)
3. [Redis缓存优化](#redis缓存优化)
4. [应用层优化](#应用层优化)
5. [AI服务调用优化](#ai服务调用优化)
6. [前端性能优化](#前端性能优化)
7. [Kubernetes资源调优](#kubernetes资源调优)
8. [监控与持续优化](#监控与持续优化)

---

## 🎯 性能基线与目标

### 关键指标 (KPIs)

| 指标 | 基线值 | 目标值 | 优秀值 | 测量方法 |
|------|--------|--------|--------|----------|
| **API响应时间 (P50)** | < 100ms | < 50ms | < 20ms | Prometheus histogram |
| **API响应时间 (P95)** | < 500ms | < 200ms | < 100ms | Prometheus histogram |
| **API响应时间 (P99)** | < 2000ms | < 500ms | < 300ms | Prometheus histogram |
| **错误率** | < 1% | < 0.1% | < 0.01% | Error counter / Total requests |
| **吞吐量** | 100 req/s | 500 req/s | 1000 req/s | Load testing (k6) |
| **AI通话成功率** | > 90% | > 95% | > 99% | 业务指标 |
| **CPU使用率** | < 70% | < 60% | < 50% | Node.js process metrics |
| **内存使用** | < 512MB | < 384MB | < 256MB | RSS monitoring |

### 性能测试场景

使用 k6 进行定期压测（见 `tests/performance/`）:

```bash
# 快速冒烟测试（开发阶段）
pnpm test:perf:smoke

# 负载测试（预发布）
pnpm test:perf:load

# 压力测试（容量规划）
pnpm test:perf:stress
```

---

## 🗄️ 数据库性能优化

### 1. 查询优化

#### 识别慢查询

```sql
-- 启用PostgreSQL慢查询日志（> 1秒的查询）
ALTER SYSTEM SET log_min_duration_statement = '1000';
SELECT pg_reload_conf();

-- 查看当前慢查询统计
SELECT query, calls, total_time, mean_time, rows 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 常见优化模式

**N+1查询问题**:
```typescript
// ❌ 错误：N+1查询
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  const records = await prisma.callRecord.findMany({  // N次额外查询
    where: { taskId: task.id }
  });
}

// ✅ 正确：批量查询 + include
const tasksWithRecords = await prisma.task.findMany({
  include: {
    callRecords: true,  // 一次JOIN查询
  }
});

// 或使用 in 查询
const taskIds = tasks.map(t => t.id);
const allRecords = await prisma.callRecord.findMany({
  where: { taskId: { in: taskIds } }
});
```

**分页优化**:
```typescript
// ❌ 错误：OFFSET在大数据集时很慢
const page1 = await prisma.task.findMany({
  skip: 100000,  // 需要扫描10万行！
  take: 20,
});

// ✅ 正确：基于游标的分页（Cursor-based Pagination）
const page1 = await prisma.task.findMany({
  take: 20,
  orderBy: { id: 'asc' },
  cursor: { id: lastSeenId },  // 直接定位
});
```

### 2. 索引策略

#### 必要索引清单

```sql
-- 任务表索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- 复合索引（常用查询组合）
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status, created_at DESC);

-- 通话记录索引
CREATE INDEX idx_call_records_task_id ON call_records(task_id);
CREATE INDEX idx_call_records_created_at ON call_records(created_at DESC);
CREATE INDEX idx_call_records_status ON call_records(status);

-- 全文搜索（如果需要）
CREATE INDEX idx_call_records_transcript 
ON call_records USING gin(to_tsvector('chinese', transcript));
```

#### 索引维护

```bash
-- 分析索引使用情况
SELECT 
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan ASC NULLS LAST;

-- 删除未使用的索引（节省写入开销）
DROP INDEX IF EXISTS idx_unused_index;

-- 重建碎片化严重的索引
REINDEX INDEX CONCURRENTLY idx_heavily_used;
```

### 3. 连接池配置

```typescript
// Prisma 连接池优化
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=25&pool_timeout=10`
    }
  },
  // 中间件级别的超时设置
  log: [
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
    { emit: 'event', event: 'query' },
  ],
});

// 监控连接池状态
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
  }
});
```

**推荐配置**（根据Pod副本数调整）:

| Pod数量 | connection_limit | pool_timeout |
|---------|-----------------|--------------|
| 1-2     | 15              | 10           |
| 3-5     | 12              | 10           |
| 6-10    | 8               | 15           |
| 10+     | 5               | 20           |

---

## ⚡ Redis缓存优化

### 1. 缓存策略选择

| 数据类型 | 策略 | TTL | 示例 |
|---------|------|-----|------|
| 用户会话 | Write-through | 24h | JWT黑名单 |
| 配置数据 | Cache-aside | 1h | Agent配置、系统参数 |
| 热点数据 | Read-through + LRU | 5min | 统计数据、排行榜 |
| 计数器 | Increment-only | 滑动窗口 | API限流计数 |
| AI回复 | Write-behind | 30min | 相似问题的LLM回复 |

### 2. 内存管理

```bash
# Redis内存限制（建议不超过可用内存的75%）
CONFIG SET maxmemory 256mb
CONFIG SET maxmemory-policy allkeys-lru

# 监控内存使用
INFO memory | grep used_memory_human
DBSIZE                    # 键总数

# 清理过期键
-- 自动清理（已启用默认配置）

# 手动清理特定模式
SCAN 0 MATCH "ratelimit:*" COUNT 1000
# 对返回的键执行 DEL
```

### 3. 批量操作优化

```typescript
// ❌ 错误：多次往返
for (const taskId of taskIds) {
  await redis.get(`task:${taskId}`);
}

// ✅ 正确：Pipeline批量操作
const pipeline = redis.pipeline();
for (const taskId of taskIds) {
  pipeline.get(`task:${taskId}`);
}
const results = await pipeline.exec();

// ✅ 更好：MGET命令
const keys = taskIds.map(id => `task:${id}`);
const results = await redis.mget(keys);
```

### 4. 缓存穿透防护

```typescript
// 使用布隆过滤器防止缓存穿透
import BloomFilter from 'bloomfilter';

const validTaskIds = new BloomFilter.Filter(
  1024 * 1024,  // 1M bits (~128KB)
  6              // hash functions
);

async function getTask(taskId: string) {
  // Step 1: 检查布隆过滤器
  if (!validTaskIds.test(taskId)) {
    return null;  // 肯定不存在，直接返回
  }

  // Step 2: 查询Redis
  const cached = await redis.get(`task:${taskId}`);
  if (cached) return JSON.parse(cached);

  // Step 3: 查询数据库
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  
  if (task) {
    validTaskIds.add(taskId);  // 添加到过滤器
    await redis.setex(`task:${taskId}`, 300, JSON.stringify(task));
  }

  return task;
}
```

---

## 🚀 应用层优化

### 1. Node.js 运行时优化

```bash
# 启动参数优化
NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size" node server.js

# V8引擎标志（谨慎使用）
NODE_OPTIONS="--max-old-space-size=512 --gc-interval=100"
```

### 2. Next.js 特定优化

```javascript
// next.config.js
module.exports = {
  // 启用SWC编译器（更快）
  swcMinify: true,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,  // 1年缓存
  },
  
  // 实验性功能
  experimental: {
    // 启用Server Components（如果适用）
    serverComponentsExternalPackages: ['@prisma/client'],
    
    // 优化打包
    optimizePackageImports: ['lodash', '@yyc3/*'],
  },
  
  // 压缩配置
  compress: true,
  
  // Headers优化
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};
```

### 3. 代码级优化

#### 异步操作并发控制

```typescript
// ❌ 错误：顺序等待
const results = [];
for (const item of items) {
  const result = await processItem(item);  // 串行执行
  results.push(result);
}

// ✅ 正确：Promise.all 并发
const results = await Promise.all(
  items.map(item => processItem(item))
);

// ✅ 更好：p-limit 控制并发数
import pLimit from 'p-limit';
const limit = pLimit(10);  // 最多10个并发

const results = await Promise.all(
  items.map(item => limit(() => processItem(item)))
);
```

#### 大JSON序列化优化

```typescript
// ❌ 错误：序列化完整对象（包含不必要字段）
return res.json(fullObjectWithAllFields);

// ✅ 正确：只返回必要字段（Projection）
return res.json({
  id: task.id,
  name: task.name,
  status: task.status,
  // 不包含: createdAt, updatedAt, metadata...
});

// ✅ 更快：使用 fast-json-stringify（预编译schema）
import FastJsonStringify from 'fast-json-stringify';
const stringify = FastJsonStringify({
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
  }
});

return res.send(stringify(data));
```

### 4. 流式响应

```typescript
// 对于大量数据导出，使用流式响应
export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const data = await fetchLargeDataset();  // 游标迭代
        
        for (const row of data) {
          controller.enqueue(JSON.stringify(row) + '\n');
          
          // 背压处理
          if (controller.desiredSize <= 0) {
            await new Promise(resolve => controller.once('drain', resolve));
          }
        }
        
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
    }
  });
}
```

---

## 🤖 AI服务调用优化

### 1. LLM调用优化

#### Prompt缓存

```typescript
// 缓存相似prompt的结果
const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
const cacheKey = `llm:response:${promptHash}`;

let response = await redis.get(cacheKey);

if (!response) {
  response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  
  // 缓存30分钟
  await redis.setex(cacheKey, 1800, JSON.stringify(response));
}
```

#### Token使用优化

```typescript
// ✅ 使用更小、更专注的模型处理简单任务
function selectModel(complexity: 'simple' | 'medium' | 'complex') {
  switch (complexity) {
    case 'simple':
      return 'gpt-3.5-turbo';  // 快速便宜
    case 'medium':
      return 'gpt-4-turbo';    // 平衡
    case 'complex':
      return 'gpt-4';          // 最强能力
  }
}

// ✅ 控制输出token数量
const completion = await openai.chat.completions.create({
  max_tokens: 150,  // 根据需求设定上限
  stop: ['\n\n'],   // 提前终止条件
});
```

### 2. ASR/TTS优化

#### 音频格式选择

| 格式 | 文件大小 | 质量 | 适用场景 |
|------|---------|------|---------|
| WAV (PCM) | 最大 | 最高 | 归档存储 |
| MP3 | 小 | 好 | 传输和播放 |
| Opus | 最小 | 较好 | 低带宽环境 |

```typescript
// 动态选择编码
function selectAudioFormat(networkCondition: 'good' | 'poor') {
  return networkCondition === 'good' ? 'mp3' : 'opus';
}
```

#### 并行处理

```typescript
// ASR和情感分析并行执行
const [transcript, emotion] = await Promise.all([
  asrService.transcribe(audioBuffer),
  emotionAnalyzer.analyze(audioBuffer),
]);

// 减少总延迟: max(ASR, Emotion) vs (ASR + Emotion)
```

---

## 🖥️ Kubernetes资源调优

### Requests和Limits配置

```yaml
resources:
  requests:
    cpu: "250m"       # 0.25核
    memory: "256Mi"   # 256MB
  limits:
    cpu: "1000m"      # 1核（允许突发）
    memory: "512Mi"   # 512MB（OOM kill阈值）
```

### HPA自动扩缩容配置

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: yyc3-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: yyc3-ai-calling
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### Pod反亲和性（高可用）

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app.kubernetes.io/name
            operator: In
            values:
            - yyc3-ai-calling
        topologyKey: kubernetes.io/hostname
```

---

## 📊 监控与持续优化

### 设置性能告警

基于[monitoring/alert-rules.yml](../monitoring/alert-rules.yml)中的规则：

| 告警名称 | 触发条件 | 响应级别 |
|---------|---------|---------|
| HighErrorRate | 错误率 > 5%（2分钟） | 🔴 P1 - 立即处理 |
| HighLatency | P95延迟 > 1秒（5分钟） | 🟠 P2 - 1小时内 |
| DBConnectionPoolExhausted | 连接数 > 20（3分钟） | 🔴 P1 - 立即处理 |
| MemoryUsageHigh | 内存 > 512MB（10分钟） | 🟡 P3 - 当天处理 |

### 定期性能审查流程

**每周**:
- [ ] 检查Grafana Dashboard趋势
- [ ] 审查Top 10慢查询
- [ ] 验证错误率是否在目标范围内

**每月**:
- [ ] 运行完整的k6性能测试套件
- [ ] 分析容量规划数据
- [ ] 更新性能基线和目标

**每季度**:
- [ ] 全面架构评审
- [ ] 技术债务清理计划
- [ ] 成本优化评估（云资源使用率）

### 性能回归检测

在CI/CD流水线中集成性能测试：

```yaml
# .github/workflows/performance.yml
performance_test:
  script: |
    # 运行负载测试
    k6 run --summary-export=results.json tests/performance/load-test.js
    
    # 断言检查
    if jq '.metrics.http_req_duration.values.p95 > 0.5' results.json; then
      echo "❌ Performance regression detected!"
      exit 1
    fi
    
    echo "✅ Performance baseline maintained"
```

---

## 📈 性能优化检查清单

### 部署前必检项

- [ ] 数据库索引已创建并验证
- [ ] Redis连接池大小已配置
- [ ] 慢查询日志已启用
- [ ] 应用内存限制已设置（Node.js --max-old-space-size）
- [ ] Gzip/Brotli压缩已启用
- [ ] CDN静态资源缓存策略已配置
- [ ] HPA扩缩容策略已部署
- [ ] 监控和告警规则已激活
- [ ] 性能基线测试已通过

### 上线后监控项

- [ ] P95/P99延迟在目标范围内
- [ ] CPU/Memory使用率健康
- [ ] 数据库连接池未耗尽
- [ ] Redis命中率 > 90%
- [ ] 错误率 < 0.1%
- [ ] 无内存泄漏迹象

---

**文档维护**: 此文档应随技术栈演进和业务增长持续更新。每次重大优化后，请更新相关章节。
