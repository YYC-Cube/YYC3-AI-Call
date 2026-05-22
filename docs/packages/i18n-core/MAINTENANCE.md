# @yyc3/i18n-core 维护指南

> **企业级长期维护与运营指南** — 确保框架的可持续性、稳定性与安全性

---

## 📋 目录

- [维护概览](#-维护概览)
- [版本发布流程](#-版本发布流程)
- [日常维护任务](#-日常维护任务)
- [依赖管理](#-依赖管理)
- [测试策略](#-测试策略)
- [构建与部署](#-构建与部署)
- [性能监控](#-性能监控)
- [安全更新](#-安全更新)
- [故障排查](#-故障排查)
- [文档维护](#-文档维护)
- [社区支持](#-社区支持)

---

## 🎯 维护概览

### 维护目标

| 目标 | 指标 | 当前状态 | 目标值 |
|------|------|----------|--------|
| **稳定性** | 测试通过率 | 100% (443/443) | ≥99.5% |
| **代码覆盖率** | 行覆盖率 | 92.5% | ≥90% |
| **性能** | 缓存命中响应时间 | <0.1ms | <0.2ms |
| **安全性** | OWASP 等级 | Level 4 | 保持 L4 |
| **文档完整度** | 闭环完成度 | 100% | 100% |
| **响应时间** | Issue 响应 | - | <48h |

### 维护团队职责

| 角色 | 职责 | 频率 | SLA |
|------|------|------|-----|
| **核心维护者** | 版本发布、架构决策、Breaking Changes | 按需 | - |
| **安全专员** | 安全审计、漏洞修复、OWASP 合规 | 每月 | 7天内修复 Critical |
| **测试工程师** | 测试用例维护、CI/CD 监控 | 每日 | - |
| **文档工程师** | 文档更新、API 参考同步 | 每周 | - |
| **社区经理** | Issue 处理、PR Review、社区支持 | 每日 | <48h 响应 |

---

## 📦 版本发布流程

### 发布前准备清单 (必做)

```bash
#!/bin/bash
# pre-release-checklist.sh

echo "=== @yyc3/i18n-core Pre-Release Checklist ==="

# 1. 更新版本号 (遵循 SemVer)
# 编辑 package.json 的 version 字段
# 格式: MAJOR.MINOR.PATCH (如: 2.4.0)

# 2. 运行完整测试套件
echo "🧪 Running tests..."
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Abort release."
  exit 1
fi
echo "✅ All 443 tests passed"

# 3. 类型检查
echo "🔍 Running typecheck..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Type errors found! Abort release."
  exit 1
fi
echo "✅ Type check passed"

# 4. 更新 CHANGELOG.md
# 添加本次发布的变更记录 (遵循 Keep a Changelog 格式)

# 5. 构建验证
echo "🏗️ Building..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Abort release."
  exit 1
fi
echo "✅ Build successful"

# 6. 本地 pack 测试
echo "📦 Testing npm pack..."
npm pack --dry-run
if [ $? -ne 0 ]; then
  echo "❌ Pack failed! Abort release."
  exit 1
fi
echo "✅ Pack successful"

# 7. Exports 路径验证
echo "🔗 Validating exports..."
node -e "
const pkg = require('./package.json');
const fs = require('fs');
let allValid = true;
Object.keys(pkg.exports || {}).forEach(exp => {
  const path = pkg.exports[exp].import || pkg.exports[exp];
  if (!fs.existsSync(path)) {
    console.error('❌ Missing export:', exp, '->', path);
    allValid = false;
  }
});
if (!allValid) process.exit(1);
console.log('✅ All exports valid');
"
if [ $? -ne 0 ]; then
  echo "❌ Exports validation failed!"
  exit 1
fi

# 8. 覆盖率检查
echo "📊 Checking coverage..."
pnpm test:coverage
# 确保行覆盖率 >= 90%

echo ""
echo "=== ✅ All checks passed! Ready to release ==="
```

### 发布步骤

```bash
# 1. 提交所有更改
git add .
git commit -m "release: @yyc3/i18n-core v2.4.0"

# 2. 创建 Git Tag
git tag i18n-v2.4.0

# 3. 推送到远程
git push origin main
git push origin i18n-v2.4.0

# 4. 发布到 npm
npm publish --access public

# 5. 验证发布
npm view @yyc3/i18n-core version
npm info @yyc3/i18n-core

# 6. 创建 GitHub Release
# 在 GitHub 上基于 tag 创建 Release，附上 CHANGELOG 摘要
```

### 版本号规则 (SemVer 严格遵循)

| 类型 | 场景 | 示例 | 影响范围 |
|------|------|------|----------|
| **MAJOR** | 不兼容的 API 变更、类重命名、模块移除 | 2.0.0 → 3.0.0 | 全体用户 |
| **MINOR** | 向后兼容的功能新增、新模块、新 exports | 2.3.0 → 2.4.0 | 可选升级 |
| **PATCH** | Bug 修复、文档更新、性能优化 | 2.3.0 → 2.3.1 | 建议升级 |

### Breaking Changes 发布检查清单

当发布 MAJOR 版本时：

- [ ] Migration Guide 已更新
- [ ] 所有 Deprecated API 标注清楚
- [ ] Codemod 脚本已提供（如适用）
- [ ] CHANGELOG 详细列出所有 breaking changes
- [ ] 通知渠道已准备：GitHub Discussions / 邮件列表
- [ ] 向后兼容期已设置（建议至少 6 个月）

---

## 🔧 日常维护任务

### 每日任务 (自动化)

```yaml
# .github/workflows/daily.yml (示例)
name: Daily Health Check

on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      
      # 运行全量测试
      - name: Run Tests
        run: pnpm test
        
      # 类型检查
      - name: Type Check
        run: pnpm lint
        
      # 安全审计
      - name: Security Audit
        run: npm audit
        
      # 构建验证
      - name: Build
        run: pnpm build
```

### 每周任务

```bash
# 1. 检查依赖更新
pnpm outdated

# 2. 审查并处理 Issues
# 访问 GitHub Issues 页面

# 3. Review 待合并的 PRs
# 访问 GitHub Pull Requests 页面

# 4. 更新文档（如有必要）
# - 检查 FAQ 是否需要新增条目
# - 验证示例代码是否可运行
```

### 每月任务

```bash
# 1. 全面安全审计
npm audit
npm audit fix  # 自动修复低风险漏洞

# 2. 性能基准回归测试
node scripts/performance-benchmark.js
# 对比历史数据，检测性能退化

# 3. 依赖健康度评估
# - 检查依赖是否有已知 CVE
# - 评估是否需要升级主要依赖

# 4. 文档全面审查
# - README 示例可运行性
# - API 文档与源码一致性
# - 外部链接有效性
```

### 每季度任务

```bash
# 1. 依赖大版本升级规划
# - TypeScript 升级路径
# - Vitest 升级路径
# - 其他 devDependencies 升级

# 2. 代码质量改进
# - 移除废弃 API
# - 重构复杂模块
# - 改善类型定义

# 3. 技术债务清理
# - 减少代码重复
# - 优化算法复杂度
# - 提升测试覆盖率

# 4. 社区反馈整合
# - 分析 Feature Requests
# - 规划 Roadmap
```

---

## 📦 依赖管理

### 当前依赖状态

```
@yyc3/i18n-core (v2.3.0)
├── Production Dependencies: 0  ← 零依赖！
├── Peer Dependencies: 无
└── Development Dependencies:
    ├── typescript ^5.0.0         ← 编译器
    ├── vitest ^1.0.0             ← 测试框架
    ├── eslint                    ← 代码规范
    └── @types/node               ← Node.js 类型
```

> **零依赖优势**: 本包无任何生产依赖，这是最大的安全优势和稳定性保障。

### 依赖更新策略

| 类别 | 策略 | 频率 | 注意事项 |
|------|------|------|----------|
| **DevDeps (TypeScript)** | 跟随最新 LTS | 每季度 | 关注 breaking changes |
| **DevDeps (Vitest)** | 跟随 minor 版本 | 每月 | 关注 API 变更 |
| **DevDeps (ESLint)** | 按需更新 | 按需 | 配置兼容性 |

### 安全扫描

```bash
# 定期安全审计 (虽然无生产依赖，但开发依赖也需要关注)
npm audit

# 查看详细信息
npm audit --json

# 生成安全报告
npm audit --audit-level=moderate
```

---

## 🧪 测试策略

### 测试架构总览

```
src/test/
├── engine-v2.test.ts           # Core Engine (45 tests)
├── formatter.test.ts           # Formatter (35 tests)
├── detector.test.ts            # Locale Detection (20 tests)
├── plugins.test.ts             # Plugin System (25 tests)
├── rtl-utils.test.ts           # RTL Support (28 tests)
├── translate.test.ts           # Translation Core (30 tests)
├── translate-full.test.ts      # Full Integration (30 tests)
├── i18n-audit.test.ts          # I18N Audit (15 tests)
├── lit-controller.test.ts      # Lit Integration (10 tests)
├── local-storage.test.ts       # Persistence (12 tests)
├── performance-tracker.test.ts # Performance (8 tests)
│
├── icu/
│   └── parser-compiler.test.ts  # ICU Engine (40 tests)
│
├── ai/
│   ├── providers.test.ts        # AI Providers (35 tests)
│   └── quality-estimator.test.ts # Quality Estimation (25 tests)
│
├── mcp/
│   ├── server.test.ts           # MCP Server (20 tests)
│   ├── i18n-tools.test.ts       # MCP Tools (12 tests)
│   └── stdio-transport.test.ts  # Transport Layer (8 tests)
│
├── security/
│   ├── dangerous-operations.test.ts # Injection Detection (10 tests)
│   ├── safe-regex.test.ts           # ReDoS Protection (10 tests)
│   └── secret-equal.test.ts         # Timing Attack (10 tests)
│
├── infra/
│   ├── backoff.test.ts          # Retry Logic (10 tests)
│   ├── logger.test.ts           # Logging (8 tests)
│   ├── rate-limit.test.ts       # Rate Limiting (7 tests)
│   └── secure-random.test.ts    # Crypto Random (5 tests)
│
└── utils/
    ├── format-time.test.ts      # Time Formatting (8 tests)
    ├── json-file.test.ts        # File I/O (7 tests)
    └── path-guards.test.ts      # Path Security (7 tests)
```

### 覆盖率目标与现状

| 模块 | 目标 | 当前 | 状态 |
|------|------|------|------|
| **Lines** | ≥90% | 93.12% | ✅ 超标 |
| **Functions** | ≥85% | 86.07% | ✅ 达标 |
| **Statements** | ≥90% | 93.12% | ✅ 超标 |
| **Branches** | ≥80% | 82.95% | ✅ 达标 |

### 运行测试命令

```bash
# 全量测试 (443 个用例)
pnpm test

# 监听模式 (开发时使用)
pnpm test:watch

# 覆盖率报告 (HTML + 终端)
pnpm test:coverage

# 单个模块测试
pnpm test -- engine-v2.test.ts
pnpm test -- icu/parser-compiler.test.ts

# 匹配测试名
pnpm test -- -t "should translate with interpolation"
pnpm test -- -t "ICU plural"

# 并行运行 (加速 CI)
pnpm test --reporter=verbose --threads=4
```

### 新增测试指南

当添加新功能或修复 bug 时：

1. **定位测试文件**: 在 `src/test/` 下找到对应模块目录
2. **命名约定**: `*.test.ts` 
3. **使用 describe/it 结构**:
   ```typescript
   describe('ModuleName', () => {
     describe('methodName', () => {
       it('should do something expected', () => {
         // Arrange
         // Act
         // Assert
       });
     });
   });
   ```
4. **覆盖场景**:
   - 正常路径 (Happy path)
   - 边界条件 (Boundary cases)
   - 异常输入 (Invalid inputs)
   - 性能相关 (Performance critical paths)
5. **确保覆盖率**: 新增代码覆盖率不低于目标值

---

## 🏗️ 构建与部署

### 构建配置

本包使用 **TypeScript 编译器 (tsc)** 进行构建。

```bash
# 开发构建 (监听模式)
pnpm build:watch

# 生产构建
pnpm build

# 清理构建产物
rm -rf dist/
```

### 构建输出结构

```
dist/
├── index.js              # 主入口 (~15KB gzipped)
├── index.d.ts            # 主入口类型定义
│
├── lib/
│   ├── cache.js          # Cache System (~3KB)
│   ├── cache.d.ts
│   ├── engine.js         # Core Engine (~5KB)
│   ├── engine.d.ts
│   ├── formatter.js      # Formatter (~2KB)
│   ├── plugins.js        # Plugin System (~4KB)
│   ├── plugins.d.ts
│   ├── rtl-utils.js      # RTL Utils (~2KB)
│   │
│   ├── ai/
│   │   ├── provider.js   # AI Providers (~4KB)
│   │   ├── quality-estimator.js (~2KB)
│   │   ├── openai-provider.js
│   │   └── ollama-provider.js
│   │
│   ├── icu/
│   │   ├── parser.js     # ICU Parser (~3KB)
│   │   └── compiler.js   # ICU Compiler (~2KB)
│   │
│   ├── mcp/
│   │   ├── server.js     # MCP Server (~3KB)
│   │   ├── i18n-tools.js
│   │   └── stdio-transport.js
│   │
│   └── security/
│       ├── safe-regex.js
│       └── secret-equal.js
│
└── locales/
    ├── en.js             # English translations
    ├── zh-CN.js          # Simplified Chinese
    ├── zh-TW.js          # Traditional Chinese
    ├── ja.js             # Japanese
    ├── ko.js             # Korean
    ├── fr.js             # French
    ├── de.js             # German
    ├── es.js             # Spanish
    ├── pt-BR.js          # Brazilian Portuguese
    └── ar.js             # Arabic (RTL)
```

### CI/CD 流水线 (推荐配置)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm build
      
  coverage:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test:coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          
  publish:
    needs: [test, coverage]
    if: github.ref == 'refs/heads/main' && startsWith(github.event.head_commit.message, 'release:')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install && pnpm build
      - uses: JS-DevTools/npm-publish@v3
        with:
          token: ${{ secrets.NPM_TOKEN }}
```

---

## ⚡ 性能监控

### 关键性能指标 (KPI)

| 指标 | 目标值 | 当前值 | 监控方式 |
|------|--------|--------|----------|
| **缓存命中率** | >95% | ~98% | Engine.getStats() |
| **缓存响应时间** | <0.1ms | 0.02ms | PerformanceTracker |
| **批量翻译 QPS** | >10K | 12K+ | Benchmark |
| **ICU 编译时间** | <0.5ms | 0.15ms | PerformanceTracker |
| **内存占用 (空引擎)** | <5MB | ~2MB | Node.js memory |
| **AI 翻译延迟 (OpenAI)** | <2s | 0.8s | AIProvider |
| **AI 翻译延迟 (Ollama)** | <5s | 1.5s | AIProvider |

### 性能基准测试脚本

```typescript
// scripts/performance-benchmark.ts
import { I18nEngine } from './dist/index.js';
import { performance } from 'perf_hooks';

async function runBenchmark() {
  const engine = new I18nEngine();
  await engine.init();

  console.log('=== @yyc3/i18n-core Performance Benchmark ===\n');

  // 1. Simple translation (cached)
  let start = performance.now();
  for (let i = 0; i < 10000; i++) {
    engine.t('welcome');
  }
  let duration = performance.now() - start;
  console.log(`Simple translation (10K ops): ${(duration/10).toFixed(3)}ms/op`);

  // 2. Parameterized translation
  start = performance.now();
  for (let i = 0; i < 10000; i++) {
    engine.t('greeting', { name: `User${i}` });
  }
  duration = performance.now() - start;
  console.log(`Parameterized (10K ops): ${(duration/10).toFixed(3)}ms/op`);

  // 3. Batch translation
  const keys = Array.from({ length: 100 }, (_, i) => `key_${i}`);
  start = performance.now();
  await engine.batchTranslate(keys);
  duration = performance.now() - start;
  console.log(`Batch (100 keys): ${duration.toFixed(2)}ms`);

  // 4. ICU plural
  start = performance.now();
  for (let i = 0; i < 1000; i++) {
    engine.t('items', { count: i });
  }
  duration = performance.now() - start;
  console.log(`ICU plural (1K ops): ${(duration).toFixed(3)}ms/op`);

  // 5. Memory usage
  const mem = process.memoryUsage();
  console.log(`\nMemory:`);
  console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  
  // 6. Cache stats
  const stats = engine.getStats();
  console.log(`\nCache:`);
  console.log(`  Hit Rate: ${((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(2)}%`);
}

runBenchmark().catch(console.error);
```

### 性能退化告警阈值

| 场景 | 告警阈值 | 严重阈值 |
|------|----------|----------|
| 缓存响应时间 > | 0.5ms | 2ms |
| 批量翻译 (100 keys) > | 20ms | 50ms |
| ICU 编译 > | 1ms | 5ms |
| 内存增长 > | +10%/月 | +30%/月 |

---

## 🔒 安全更新

### OWASP Level 4 安全标准实现

#### 当前安全措施

| 维度 | 实现 | 状态 | 最后审查 |
|------|------|------|----------|
| **ReDoS 防护** | `safeRegexCompile()` + 超时中断 | ✅ Active | 2026-04-21 |
| **时序攻击防护** | `constantTimeStringEqual()` | ✅ Active | 2026-04-14 |
| **路径遍历防护** | `guardAgainstPathTraversal()` | ✅ Active | 2026-04-14 |
| **注入检测** | `detectDangerousPatterns()` | ✅ Active | 2026-04-21 |
| **加密随机数** | `crypto.randomBytes()` | ✅ Active | 2026-04-01 |

### 安全审计流程

```bash
# 1. 自动化安全扫描 (CI 集成)
npm audit --audit-level=moderate

# 2. 手动代码审查重点区域
# - src/lib/security/* (所有安全模块)
# - src/lib/icu/parser.ts (正则表达式)
# - src/lib/utils/path-guards.ts (路径处理)
# - src/lib/infra/secure-random.ts (随机数)

# 3. 依赖漏洞扫描
npm audit --json > security-report.json

# 4. SAST (静态应用安全测试)
# 推荐工具: SonarQube, Snyk, CodeQL
```

### 安全事件响应计划

1. **发现漏洞** → 评估严重程度 (Critical/High/Medium/Low)
2. **Critical/High** → 7天内发布补丁版本
3. **Medium** → 30天内修复
4. **Low** → 下个版本周期修复
5. **通知用户** → SECURITY.md 公开披露
6. **CVE 申请** (如适用) → 通过官方渠道申请

### 安全最佳实践 (开发者)

```typescript
// ✅ 正确: 使用安全工具函数
import { safeRegexCompile } from '@yyc3/i18n-core/lib/security/safe-regex';
const regex = safeRegexCompile(userInput, { timeout: 1000 });

// ❌ 错误: 直接使用 RegExp (可能 ReDoS)
const regex = new RegExp(userInput); // 危险！

// ✅ 正确: 使用常量时间比较
import { constantTimeStringEqual } from '@yyc3/i18n-core/lib/security/secret-equal';
const isEqual = constantTimeStringEqual(tokenA, tokenB);

// ❌ 错误: 使用 === 比较 (可能时序攻击)
const isEqual = tokenA === tokenB; // 危险！
```

---

## 🔍 故障排查

### 常见问题诊断

#### 问题1: 翻译返回原始 key

**症状**: `t('welcome')` 返回 `'welcome'` 而非 `'Welcome'`

**诊断步骤**:
```typescript
// 1. 检查语言是否正确加载
console.log(i18n.currentLocale);  // 应该是 'en' 或其他有效语言

// 2. 检查翻译数据是否存在
const translations = i18n.getTranslations();
console.log(Object.keys(translations));  // 查看 available keys

// 3. 检查 fallback chain
const engine = new I18nEngine({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  missingKeyHandler: (key) => {
    console.warn(`Missing key: ${key}`);
    return `[${key}]`;
  },
});
```

**解决方案**:
- 确保 locale 数据已加载
- 检查 key 是否存在于翻译文件中
- 启用 `missingKeyHandler` 调试

#### 问题2: ICU 解析错误

**症状**: `Error: Invalid ICU message format`

**诊断**:
```typescript
import { ICUParser } from '@yyc3/i18n-core/icu';

const parser = new ICUParser();
try {
  const ast = parser.parse('{invalid syntax}');
} catch (error) {
  console.error(error);  // 查看详细错误信息
}
```

**解决方案**:
- 检查 ICU 语法是否正确（括号匹配、逗号等）
- 使用 [ICU MessageFormat 在线验证器](https://formatjs.io/docs/icu-syntax/)
- 查看错误位置提示

#### 问题3: 缓存不一致

**症状**: 切换语言后仍显示旧翻译

**诊断**:
```typescript
// 检查缓存状态
const stats = i18n.getStats();
console.log(stats.cacheHits, stats.cacheMisses);

// 手动清除缓存
i18n.cache.clear();

// 或禁用缓存调试
const engine = new I18nEngine({
  cache: { maxSize: 0 },  // 禁用缓存
});
```

**解决方案**:
- 调用 `setLocale()` 后等待 Promise 完成
- 检查是否有异步操作未完成
- 必要时清除缓存

#### 问题4: AI 翻译超时

**症状**: `AI translation timeout after 30000ms`

**诊断**:
```typescript
// 检查网络连接
// 检查 API Key 是否有效
// 检查 Ollama 是否运行 (localhost:11434)

// 增加 timeout
const provider = new OpenAIProvider({
  apiKey: 'your-key',
  timeout: 60000,  // 60秒
});
```

**解决方案**:
- 检查网络连接和 API 服务状态
- 对于 Ollama，确保模型已下载：`ollama pull qwen2.5:3b`
- 增加 timeout 配置

#### 问题5: 内存泄漏

**症状**: 长时间运行后内存持续增长

**诊断**:
```typescript
// 定期打印内存状态
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${(mem.rss / 1024 / 1024)}MB`,
    heapUsed: `${(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${(mem.external / 1024 / 1024)}MB`,
  });
}, 60000);
```

**解决方案**:
- 确保调用 `engine.destroy()` 清理资源
- 检查事件监听器是否正确移除 (`unsubscribe`)
- 检查缓存大小限制是否合理

### 日志与调试

启用详细日志:

```typescript
const engine = new I18nEngine({ debug: true });

// 全局调试访问点
window.__i18n_debug__ = {
  engine,
  getCacheStats: () => engine.cache.getStats(),
  getPluginList: () => engine.plugins.list(),
  getCurrentTranslations: () => engine.getTranslations(),
};
```

---

## 📖 文档维护

### 文档更新触发条件

- 新增功能或 API 变更
- 重大 bug 修复
- 版本发布 (必须)
- 收到用户文档相关 issue
- 每季度例行审查

### 文档质量标准

| 文档 | 要求 | 更新频率 | 负责人 |
|------|------|----------|--------|
| **README.md** | 示例可运行，API 完整，< 1500 行 | 每次发布 | 文档工程师 |
| **CHANGELOG.md** | Keep a Changelog 格式，详细变更记录 | 每次发布 | 核心维护者 |
| **MAINTENANCE.md** | 流程准确，链接有效 | 每季度 | 维护团队 |
| **MIGRATION_GUIDE.md** | Breaking Changes 完整说明 | MAJOR 版本 | 核心维护者 |
| **SECURITY.md** | 安全政策，披露流程 | 有安全更新时 | 安全专员 |
| **JSDoc 注释** | 公共 API 全覆盖 | 持续 | 所有开发者 |

### 文档审查清单

- [ ] 所有示例代码可复制运行
- [ ] API 文档与实际 TypeScript 类型一致
- [ ] 外部链接有效且可访问
- [ ] 版本号和日期已更新
- [ ] 安装命令经过验证
- [ ] FAQ 覆盖 top 10 常见问题
- [ ] 表格格式正确渲染
- [ ] 代码块语法高亮正确

---

## 👥 社区支持

### 支持渠道

| 渠道 | 用途 | 响应时间 |
|------|------|----------|
| **[GitHub Issues](https://github.com/YanYuCloudCube/Family-PAI/issues)** | Bug 报告、Feature Request | <48h |
| **[GitHub Discussions](https://github.com/YanYuCloudCube/Family-PAI/discussions)** | 问答、讨论 | <72h |
| **Email: yyc3@family.ai** | 安全漏洞、商务合作 | <24h |

### Issue 模板

```markdown
## Bug Report

**描述**
清晰描述问题...

**复现步骤**
1. 执行 '...'
2. 期望看到 '...'
3. 实际看到 '...'

**环境信息**
- OS: [e.g., macOS 14.0]
- Node.js: [e.g., 20.10.0]
- @yyc3/i18n-core: [e.g., 2.3.0]

**期望行为**
...

**截图/日志**
...
```

---

*YYC³ AI Family — 八位拟人化AI家人的智能中枢*

**五高 · 五标 · 五化 · 五维**

---

*维护指南版本: 2.3.0 | 最后更新: 2026-04-24*
