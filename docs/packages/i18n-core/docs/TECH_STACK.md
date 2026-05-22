# @yyc3/i18n-core 技术栈与适用环境

> **版本**: 2.0.1 | **最后更新**: 2026-04-15

---

## 🛠️ 技术栈概览

### 核心语言与运行时

| 技术 | 版本 | 用途 | 必需性 |
|------|------|------|--------|
| **TypeScript** | ≥5.3 | 源代码编写 | ✅ 必须 |
| **Node.js** | ≥16.0.0 | 运行环境 / 构建 | ✅ 必须 |
| **ES Modules** | ES2020+ | 模块系统 | ✅ 必须 |

### 构建工具链

| 工具 | 版本 | 用途 |
|------|------|------|
| **TypeScript Compiler** (tsc) | 5.3+ | 类型检查 & 编译 |
| **Vitest** | 1.2+ | 单元测试框架 |
| **@vitest/coverage-v8** | 1.6+ | 代码覆盖率 |
| **ESLint** | 8.56+ | 代码规范 |
| **Prettier** | 3.2+ | 代码格式化 |

### 开发依赖 (devDependencies)

```json
{
  "@types/node": "^20.11.0",
  "@typescript-eslint/eslint-plugin": "^6.19.0",
  "@typescript-eslint/parser": "^6.19.0",
  "@vitest/coverage-v8": "^1.6.1",
  "eslint": "^8.56.0",
  "prettier": "^3.2.0",
  "typescript": "^5.3.0",
  "vitest": "^1.2.0"
}
```

### 运行时依赖 (dependencies)

```
✅ 零外部运行时依赖
```

**设计决策**: 所有功能均使用 Node.js 内置模块实现：
- `crypto` — 安全随机数、时序安全比较
- `fs` / `path` — 文件操作
- `perf_hooks` — 性能计时
- 无第三方库依赖

---

## 🌍 适用环境矩阵

### 浏览器支持

| 浏览器 | 最低版本 | 状态 |
|--------|---------|------|
| Chrome | 89+ | ✅ 完全支持 |
| Firefox | 89+ | ✅ 完全支持 |
| Safari | 15+ | ✅ 完全支持 |
| Edge | 89+ | ✅ 完全支持 |
| IE | - | ❌ 不支持 (无 ES Module) |

### Node.js 环境

| 场景 | 支持情况 | 说明 |
|------|---------|------|
| CommonJS (CJS) | ⚠️ 通过 bundler | 原生仅 ESM |
| ES Modules (ESM) | ✅ 原生支持 | 推荐 |
| TypeScript | ✅ 原生支持 | strict mode |
| Bun | ✅ 兼容 | ESM 支持 |
| Deno | ✅ 兼容 | Node compat mode |

### 框架集成

#### 原生支持

| 框架 | 集成方式 | 状态 |
|------|---------|------|
| **Lit (Web Components)** | `I18nController` | ✅ 内置 |
| **Vanilla JS** | 直接 import | ✅ 完整 API |
| **TypeScript 项目** | 类型完整 | ✅ 完整类型 |

#### 社区集成模式

| 框架 | 推荐集成方式 | 示例 |
|------|-------------|------|
| **React** | Custom Hook + Context | `useI18n()` hook |
| **Vue 3** | Composable + Plugin | `useI18n()` composable |
| **Angular** | Service + Pipe | `I18nService` + `TranslatePipe` |
| **Svelte** | Store + Directive | `$i18n` store |
| **SolidJS** | Reactive primitive | `createI18n()` |
| **Next.js** | SSR adapter (计划中) | 服务端渲染 |
| **Nuxt.js** | Module (计划中) | Nuxt 模块 |

### 构建工具兼容性

| Bundler | 支持情况 | 配置要求 |
|---------|---------|---------|
| **Vite** | ✅ 完全支持 | 默认即可 |
| **Webpack 5** | ✅ 支持 | 需配置 ESM |
| **esbuild** | ✅ 支持 | 原生 ESM |
| **Rollup** | ✅ 支持 | 原生 ESM |
| **Parcel** | ✅ 支持 | 自动检测 |
| **tsup** | ✅ 推荐 | ESM 输出 |

---

## 📦 包体积分析

### Tree-Shaking 效果

```bash
# 最小化导入 (~5 KB gzipped)
import { t } from '@yyc3/i18n-core';

# 核心 API (~15 KB gzipped)
import { i18n, t, I18nEngine } from '@yyc3/i18n-core';

# 完整功能 (~45 KB gzipped)
import * as I18n from '@yyc3/i18n-core';
```

### 模块体积分布

| 模块组 | 大小 (未压缩) | Gzip 后 | 说明 |
|-------|--------------|---------|------|
| Core Engine | ~8 KB | ~3 KB | 引擎核心 |
| Cache System | ~4 KB | ~1.5 KB | LRU 缓存 |
| Plugin System | ~5 KB | ~2 KB | 插件管理 |
| Formatter | ~3 KB | ~1 KB | 格式化工具 |
| Detector | ~4 KB | ~1.5 KB | 语言检测 |
| RTL Utils | ~5 KB | ~2 KB | RTL 布局 |
| Infra (3 modules) | ~12 KB | ~4 KB | 基础设施 |
| Security (3 modules) | ~10 KB | ~3.5 KB | 安全模块 |
| Utils (3 modules) | ~10 KB | ~3.5 KB | 工具函数 |
| Plugins (3 built-in) | ~15 KB | ~5 KB | 内置插件 |
| **总计** | **~76 KB** | **~27 KB** | 全量导入 |

---

## 🔒 安全特性

### OWASP 合规性

| OWASP 类别 | 实现 | 状态 |
|-----------|------|------|
| **A01:2021-Broken Access Control** | 路径遍历防护 (`path-guards.ts`) | ✅ |
| **A03:2021-Injection** | 危险操作检测 (`dangerous-operations.ts`) | ✅ |
| **A04:2021-Insecure Design** | ReDoS 防护 (`safe-regex.ts`) | ✅ |
| **A02:2021-Cryptographic Failures** | 时序攻击防护 (`secret-equal.ts`) | ✅ |
| **A07:2021-Identification Failures** | 安全随机数 (`secure-random.ts`) | ✅ |

### 安全等级: **Level 4 (Enterprise)**

```
┌─────────────────────────────────────┐
│        Security Level 4             │
│    ┌───────────────────────────┐    │
│    │ ✓ ReDoS Protection        │    │
│    │ ✓ Timing Attack Safe      │    │
│    │ ✓ Path Traversal Guard    │    │
│    │ ✓ SQL Injection Detect    │    │
│    │ ✓ Crypto-Secure Random    │    │
│    └───────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## ⚡ 性能基准

### 翻译性能指标

| 操作 | 时间复杂度 | 平均耗时 | P99 耗时 |
|------|-----------|---------|---------|
| `t(key)` 缓存命中 | O(1) | <0.01ms | <0.05ms |
| `t(key)` 缓存未命中 | O(n) | <0.1ms | <0.5ms |
| `setLocale()` 切换 | O(n) | <100ms | <200ms |
| `batchTranslate(10)` | O(10n) | <1ms | <5ms |
| `interpolate(template)` | O(k) | <0.05ms | <0.1ms |

*基准环境: Node.js 20 LTS, MacBook M2, n=10000*

### 内存占用

| 场景 | 内存占用 | 说明 |
|------|---------|------|
| 空引擎初始化 | ~2 MB | 仅类实例 |
| 加载 1 个语言包 | ~5 MB | 含翻译数据 |
| 加载全部 10 语言 | ~25 MB | 可按需懒加载 |
| LRU 缓存 (500条) | ~1 MB | 可配置大小 |

---

## 🎯 使用场景推荐

### 最佳适用场景

| 场景 | 推荐度 | 理由 |
|------|-------|------|
| **企业级 SaaS 应用** | ⭐⭐⭐⭐⭐ | 多语言、高可用需求 |
| **电商平台国际化** | ⭐⭐⭐⭐⭐ | 10语言支持、RTL布局 |
| **Web Components 应用** | ⭐⭐⭐⭐⭐ | Lit 原生集成 |
| **微前端架构** | ⭐⭐⭐⭐⭐ | 零依赖、独立部署 |
| **开源项目 i18n 方案** | ⭐⭐⭐⭐⭐ | MIT 许可、完善文档 |
| **内部管理系统** | ⭐⭐⭐⭐ | 快速上手、零配置 |
| **移动端 Web App** | ⭐⭐⭐⭐ | 轻量级、高性能 |
| **静态站点生成 (SSG)** | ⭐⭐⭐⭐ | ESM 支持 |

### 不太适合的场景

| 场景 | 原因 | 替代方案 |
|------|------|---------|
| **纯后端服务端渲染** | 浏览器 API 依赖 | next-i18next, i18next |
| **需要 ICU MessageFormat** | 当前不支持复数规则集 | @formatjs/icu-messageformat |
| **遗留系统 (IE11)** | 需要 ES2015+ | jquery.i18n |
| **简单静态页面** | 功能过剩 | 自定义 JSON 方案 |

---

## 🔄 与其他 i18n 库对比

| 特性 | @yyc3/i18n-core | i18next | vue-i18n | react-intl |
|------|------------------|---------|----------|------------|
| **零依赖** | ✅ | ❌ | ❌ | ❌ |
| **TypeScript 原生** | ✅ | ⚠️ | ⚠️ | ✅ |
| **Tree-shaking** | ✅ | ❌ | ❌ | ⚠️ |
| **插件系统** | ✅ | ✅ | ✅ | ❌ |
| **RTL 支持** | ✅ | ⚠️ | ⚠️ | ✅ |
| **安全模块** | ✅ (内置) | ❌ | ❌ | ❌ |
| **包体积** | ~27KB (gz) | ~15KB | ~30KB | ~40KB |
| **学习曲线** | 低 | 中 | 低 | 中 |
| **社区生态** | 新兴 | 成熟 | 成熟 | 成熟 |
| **MIT 许可** | ✅ | ✅ | ✅ | BSD-3 |

---

## 📋 环境检测清单

### 生产部署前检查

```bash
# 1. Node.js 版本检查
node --version  # 应显示 >= v16.0.0

# 2. TypeScript 编译
npm run build   # 无错误输出

# 3. 测试通过
npm test        # 显示 "Tests: 321 passed"

# 4. 覆盖率达标
npm run test:coverage  # Statements > 70%

# 5. 类型检查
npx tsc --noEmit     # 无类型错误

# 6. Lint 检查
npm run lint         # 无警告或错误
```

### CI/CD 环境变量

```yaml
# GitHub Actions 示例
env:
  NODE_VERSION: '20'
  TZ: Asia/Shanghai
```

---

## 🚀 快速迁移指南

### 从 i18next 迁移

```typescript
// Before (i18next)
import i18n from 'i18next';
i18n.init({ lng: 'en' });
i18n.t('key');

// After (@yyc3/i18n-core)
import { i18n, t } from '@yyc3/i18n-core';
await i18n.init({ defaultLocale: 'en' });
t('key');
```

### 从 vue-i18n 迁移

```typescript
// Before (vue-i18n)
import { createI18n } from 'vue-i18n';
const i18n = createI18n({ locale: 'zh-CN' });

// After (@yyc3/i18n-core)
import { i18n } from '@yyc3/i18n-core';
await i18n.init({ defaultLocale: 'zh-CN' });
```

---

*本文档由 YYC³ Team 维持更新 | 技术支持: team@yyc3.dev*
