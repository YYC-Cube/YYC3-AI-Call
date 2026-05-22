# 🔍 YYC³ AI Calling 故障排查指南

> **版本**: 1.0  
> **最后更新**: 2026-05-02  
> **适用环境**: Production / Staging / Development

---

## 📋 目录

1. [快速诊断流程](#快速诊断流程)
2. [常见问题分类](#常见问题分类)
3. [服务启动失败](#服务启动失败)
4. [数据库连接问题](#数据库连接问题)
5. [Redis缓存异常](#redis缓存异常)
6. [AI外呼功能故障](#ai外呼功能故障)
7. [性能问题排查](#性能问题排查)
8. [安全相关告警](#安全相关告警)
9. [日志分析与定位](#日志分析与定位)
10. [紧急恢复流程](#紧急恢复流程)

---

## 🚀 快速诊断流程

```
用户报告问题
    ↓
检查健康端点: GET /api/health
    ↓
┌─────────────────┬──────────────────┐
│ 状态码          │ 下一步操作        │
├─────────────────┼──────────────────┤
│ 200 (healthy)   │ 检查业务逻辑     │
│ 503 (unhealthy) │ 检查依赖服务     │
│ 超时            │ 检查资源耗尽     │
│ 连接拒绝         │ 检查进程状态     │
└─────────────────┴──────────────────┘
```

### 健康检查命令

```bash
# 基础健康检查
curl -f http://localhost:3000/api/health | jq .

# 详细就绪检查（包含依赖）
curl -f http://localhost:3000/api/health/ready | jq .

# 带超时的检查（5秒）
curl --max-time 5 http://localhost:3000/api/health || echo "❌ 服务不可达"
```

---

## 🐛 常见问题分类

| 类别 | 典型症状 | 紧急程度 | 平均解决时间 |
|------|----------|----------|-------------|
| **网络层** | 连接超时、DNS解析失败 | 🔴 高 | 10-30分钟 |
| **应用层** | 500错误、功能异常 | 🔴 高 | 15-60分钟 |
| **数据层** | 数据库慢查询、连接池满 | 🟡 中 | 30分钟-2小时 |
| **AI服务** | ASR/TTS/LLM调用失败 | 🟠 中高 | 15-45分钟 |
| **资源** | CPU/内存/OOM | 🔴 高 | 5-20分钟 |
| **安全** | 限流触发、权限错误 | 🟢 低 | 5-15分钟 |

---

## 🔄 服务启动失败

### 问题现象
```
Error: listen EADDRINUSE :::3000
或
npm ERR! code ELIFECYCLE
```

### 排查步骤

#### 1. 检查端口占用
```bash
# 查找占用3000端口的进程
lsof -i :3000
netstat -tlnp | grep :3000

# 强制结束占用进程
kill -9 $(lsof -t -i:3000)
```

#### 2. 检查依赖缺失
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
pnpm install

# 验证关键依赖
pnpm list @prisma/client ioredis next
```

#### 3. 检查环境变量
```bash
# 验证必需的环境变量
env | grep -E "^(DATABASE_URL|REDIS_URL|JWT_SECRET)"

# 缺失变量会导致启动失败
cat .env.example  # 对比参考配置
```

#### 4. 查看详细错误日志
```bash
# 开发模式查看完整堆栈
NODE_ENV=development pnpm dev

# 生产模式查看日志
tail -f logs/app.log | grep ERROR
```

### 常见解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `EADDRINUSE` | 端口被占用 | 更换端口或杀掉进程 |
| `MODULE_NOT_FOUND` | 依赖未安装 | `pnpm install` |
| `EINVAL: invalid config` | 配置文件格式错误 | 检查 `.env` 或 JSON 文件 |
| `EACCES: permission denied` | 权限不足 | `chmod +x scripts/*.sh` |

---

## 🗄️ 数据库连接问题

### 问题现象
```text
PrismaClientKnownRequestError: Connection timeout
或
Error: getaddrinfo ENOTFOUND postgresql
```

### 排查步骤

#### 1. 测试数据库连通性
```bash
# 使用 psql 直接测试
psql $DATABASE_URL -c "SELECT 1"

# 或使用 Prisma CLI
npx prisma db execute --stdin <<< "SELECT 1;"
```

#### 2. 检查连接字符串
```bash
# 验证 DATABASE_URL 格式
echo $DATABASE_URL
# 应该是: postgresql://user:password@host:port/database?schema=public

# 常见问题：
# ❌ 缺少 schema 参数
# ✅ 正确: ?schema=public
```

#### 3. 检查连接池状态
```sql
-- 在 PostgreSQL 中查询活跃连接
SELECT 
  state,
  count(*) 
FROM pg_stat_activity 
WHERE datname = 'yyc3_ai_calling' 
GROUP BY state;

-- 结果示例:
--  active     | 15  ← 正常
--  idle       | 8
--  idle in transaction | 2  ← ⚠️ 可能需要关注
```

#### 4. Prisma 特定问题
```bash
# 重新生成客户端
npx prisma generate

# 重置数据库（⚠️ 会删除数据！）
npx prisma migrate reset

# 检查迁移状态
npx prisma migrate status
```

### 性能优化建议

**调整连接池大小**（在 `prisma/schema.prisma`）:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 在代码中设置连接限制
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=20"
    }
  }
});
```

---

## ⚡ Redis缓存异常

### 问题现象
```text
Error: Redis connection to redis:6379 failed
或
ioredis: Unhandled error event
```

### 排查步骤

#### 1. Redis连通性测试
```bash
# 使用 redis-cli 测试
redis-cli -u $REDIS_URL ping
# 应返回: PONG

# 检查 Redis 服务器状态
redis-cli INFO server | grep redis_version
```

#### 2. 检查内存使用
```bash
# 查看 Redis 内存占用
redis-cli INFO memory | grep used_memory_human

# 查看键空间
redis-cli DBSIZE
redis-cli KEYS "*" | wc -l  # 键数量

# 清理过期键（如果内存过高）
redis-cli --scan --pattern "ratelimit:*" | xargs redis-cli DEL
```

#### 3. 检查持久化状态
```bash
# AOF/RDB 状态
redis-cli INFO persistence | grep -E "(aof_enabled|rdb_*)"

# 如果需要修复损坏的AOF文件
redis-cli --fix-aof
```

### 常见场景与解决方案

| 场景 | 症状 | 解决方案 |
|------|------|---------|
| **连接数过多** | `max clients reached` | 增加 `maxclients` 或优化连接复用 |
| **内存溢出** | `OOM command not allowed` | 设置 `maxmemory-policy allkeys-lru` |
| **主从同步延迟** | 数据不一致 | 检查网络延迟，考虑降级为单机 |
| **慢查询阻塞** | 操作卡住 | 使用 `SLOWLOG GET 10` 分析 |

---

## 🤖 AI外呼功能故障

### 问题分类

#### ASR (语音识别) 失败
```bash
# 检查音频文件格式
file recording.wav
# 应该是: RIFF (WAVE) audio, PCM, 8000 Hz, mono

# 检查API密钥
echo $ASR_API_KEY | head -c 10 # 应该显示前10字符

# 测试ASR服务连通性
curl -X POST $ASR_ENDPOINT \
  -H "Authorization: Bearer $ASR_API_KEY" \
  -F "audio=@test.wav" \
  -F "format=wav"
```

#### LLM (大模型) 响应异常
```bash
# 检查LLM API状态
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# 常见错误码处理:
# 401 → API Key 无效
# 429 → Rate Limit，需实现退避重试
# 500 → 服务端错误，增加重试次数
```

#### TTS (语音合成) 超时
```javascript
// 检查TTS配置
{
  voiceType: 'male',     // ✅ 支持的类型
  language: 'zh',        // ✅ 中文支持
  sampleRate: 16000,     // ✅ 标准采样率
  format: 'mp3',         // ✅ 压缩格式
}

// 超时设置建议
const TTS_TIMEOUT_MS = 15000; // 15秒超时
```

### 完整调用链路调试

```
用户请求 → 任务创建 → 队列调度 → 拨号 → ASR → LLM推理 → TTS → 播放 → 记录结果
   ↑           ↑        ↑       ↑      ↑       ↑      ↑       ↑        ↑
[验证]     [DB]     [Redis]  [网关]  [音频]  [文本]  [音频]  [播放器]  [存储]
```

**逐级检查清单**:

- [ ] 任务是否成功入队？→ 检查 `tasks` 表 status 字段
- [ ] 是否成功发起呼叫？→ 检查运营商API响应
- [ ] 音频录制是否正常？→ 检查录音文件大小 (>0 bytes)
- [ ] ASR识别准确率？→ 对比原始音频和识别文本
- [ ] LLM回复是否合理？→ 检查 prompt 和 temperature
- [ ] TTS合成质量？→ 试听生成的音频文件
- [ ] 用户是否听到声音？→ 检查音量和播放设备

---

## ⚡ 性能问题排查

### 1. 请求延迟过高

**症状**: P95 > 1秒, P99 > 3秒

**定位方法**:
```bash
# 使用 /api/metrics 端点获取性能数据
curl http://localhost:3000/api/metrics | jq '.histograms'

# 查看慢请求数据
curl http://localhost:3000/api/metrics | \
  jq '.histgrams[] | select(.p95 > 1000)'
```

**常见瓶颈及优化**:

| 瓶颈位置 | 优化措施 | 预期提升 |
|---------|---------|---------|
| **数据库查询** | 添加索引、优化N+1查询 | 50-80% |
| **Redis操作** | Pipeline批量操作、本地缓存 | 30-50% |
| **LLM调用** | 流式输出、缓存常用回复 | 取决于场景 |
| **序列化** | 移除不必要字段、使用更快的库 | 10-20% |

### 2. 内存泄漏检测

```bash
# 监控Node.js进程内存
node --inspect app.js
# 然后在 Chrome DevTools 中查看 Memory 面板

# 或使用命令行工具
pid=$(pgrep -f "next-server")
top -p $pid -o %MEM

# 每隔30秒记录一次内存使用情况
while true; do
  echo "$(date): $(ps -o rss= -p $pid) KB"
  sleep 30
done
```

**常见泄漏源**:

1. **事件监听器未移除**
   ```javascript
   // ❌ 错误：每次请求都添加新监听器
   emitter.on('data', handler);
   
   // ✅ 正确：使用 once 或及时移除
   emitter.once('data', handler);
   // 或
   emitter.on('data', handler);
   setTimeout(() => emitter.off('data', handler), 5000);
   ```

2. **闭包持有大对象**
   ```javascript
   // ❌ 错误：大数据被闭包引用
   function processData() {
     const largeData = fetchLargeArray(); // 100MB
     return () => {
       console.log(largeData.length); // largeData 无法释放
     };
   }
   
   // ✅ 正确：用完即释
   function processData() {
     const largeData = fetchLargeArray();
     const result = largeData.length;
     largeData = null; // 手动释放引用
     return () => console.log(result);
   }
   ```

3. **缓存无限增长**
   ```javascript
   // ✅ 使用LRU缓存限制大小
   import LRU from 'lru-cache';
   const cache = new LRU({ max: 1000, ttl: 1000 * 60 * 5 });
   ```

### 3. CPU使用率飙升

**诊断工具**:
```bash
# 生成CPU profile
kill -USR1 <pid>  # 触发CPU profiling

# 使用 node --prof
node --prof app.js
# 运行一段时间后 Ctrl+C，生成分析文件
node --prof-process isolate-*.log > processed.txt
```

**优化策略**:

- **算法复杂度优化**: O(n²) → O(n log n) 或 O(n)
- **避免同步阻塞**: 将 CPU 密集操作移到 Worker Threads
- **启用压缩**: gzip/brotli 减少传输数据量

---

## 🔒 安全相关告警

### 速率限制触发 (HTTP 429)

**原因**: 单IP短时间内请求过于频繁

**排查**:
```bash
# 查看当前限流状态
redis-cli HGETALL ratelimit:<client_ip>

# 检查是否有攻击行为
grep "RATE_LIMIT_EXCEEDED" logs/app.log | tail -20
```

**应对措施**:
1. **临时解除**: `redis-cli DEL ratelimit:<ip>`
2. **调整阈值**: 修改 `RateLimitConfigs.api.general.maxRequests`
3. **IP黑名单**: 在 Nginx/WAF 层拦截恶意 IP

### 权限错误 (HTTP 403)

**排查步骤**:
```bash
# 检查用户角色和权限
# 1. 从 JWT Token 解析用户ID
# 2. 查询数据库确认角色
# 3. 对照 RBAC 权限矩阵

# 示例查询
SELECT u.id, u.role, rp.permission 
FROM users u 
JOIN role_permissions rp ON u.role = rp.role 
WHERE u.id = '<user_id>';
```

**常见原因**:
- Token 过期 → 刷新 Token
- 角色变更未生效 → 清除权限缓存
- 权限配置错误 → 检查 `RolePermissions` 映射

---

## 📊 日志分析与定位

### 日志级别说明

| 级别 | 用途 | 示例场景 |
|------|------|---------|
| TRACE | 最详细的调试信息 | 变量值、函数入口/出口 |
| DEBUG | 开发调试信息 | SQL查询、API调用参数 |
| INFO | 一般业务信息 | 用户登录、任务完成 |
| WARN | 警告信息 | 降级运行、重试操作 |
| ERROR | 错误但可恢复 | 外部API失败、验证失败 |
| FATAL | 致命错误 | 无法启动、数据丢失 |

### 高效搜索技巧

```bash
# 搜索特定请求的错误日志
grep "<request-id>" logs/app.log | grep ERROR

# 统计最近1小时的错误数量
awk '/2026-05-02T(09|10|11)/ && /ERROR/' logs/app.log | wc -l

# 提取所有FATAL错误及其上下文
grep -B 5 -A 5 "FATAL" logs/app.log

# 实时监控ERROR及以上级别的日志
tail -f logs/app.log | grep --color=always -E "(ERROR|FATAL)"
```

### 关键日志模式

**正常请求流程**:
```
[INFO] Request started: GET /api/tasks
[DEBUG] Database query: SELECT * FROM tasks WHERE...
[INFO] Request completed: 200 (123ms)
```

**异常请求**:
```
[WARN] Retry attempt 2/3 for external API
[ERROR] External API failed: timeout after 5000ms
[FATAL] Unhandled exception: Cannot read property 'id' of undefined
```

---

## 🚨 紧急恢复流程

### 场景1: 服务完全不可用

```bash
# Step 1: 快速重启（1分钟内）
kubectl rollout restart deployment/yyc3-ai-calling -n production

# Step 2: 检查Pod状态
kubectl get pods -n production -l app=yyc3-ai-calling -w

# Step 3: 查看最新日志
kubectl logs -f deployment/yyc3-ai-calling -n production --tail=100
```

### 场景2: 数据库宕机

```bash
# Step 1: 切换到只读模式（如果有主从）
# 修改环境变量: DATABASE_URL=postgresql://readonly:...

# Step 2: 启用降级功能
export ENABLE_CACHE_ONLY=true
# 所有读操作走Redis缓存

# Step 3: 通知DBA修复数据库
```

### 场景3: Redis故障

```bash
# Step 1: 启用Memory fallback
# 速率限制器和缓存自动切换到内存模式

# Step 2: 重启Redis服务
systemctl restart redis

# Step 3: 验证恢复
redis-cli ping
```

### 场景4: 遭受DDoS攻击

```bash
# Step 1: 启用严格限流
export RATE_LIMIT_MAX_REQUESTS=10

# Step 2: 在CDN/WAF层开启防护
# Cloudflare: Security → WAF → Enable DDoS protection

# Step 3: 收集攻击证据
tcpdump -i eth0 -w attack_capture.pcap host <attack_ip>

# Step 4: 联系云服务商
# AWS: Support → Create case → DDoS incident
```

---

## 📞 升级支持

如果以上步骤无法解决问题：

1. **收集诊断信息**:
   ```bash
   # 生成诊断包
   ./scripts/generate-diagnostic-bundle.sh
   
   # 包含内容:
   # - 最近1000行日志
   # - 系统资源快照
   # - 健康检查结果
   # - 配置文件（脱敏）
   ```

2. **联系渠道**:
   - 📧 Email: support@yyc3-ai-call.com
   - 💬 Slack: #yyc3-support
   - 📱 紧急电话: +86-xxx-xxxx-xxxx (仅生产事故)

3. **提供信息**:
   - 问题发生时间（精确到秒）
   - 影响范围（用户数/功能模块）
   - 已尝试的解决步骤
   - 相关的 request_id 或 task_id

---

**文档维护**: 此文档应随着系统演进持续更新。发现问题或有改进建议，请提交 PR 到仓库。
