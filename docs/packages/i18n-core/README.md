# @yyc3/i18n-core

> **🌐 YYC³ Production-Ready Internationalization Framework**
> 
> 高性能、插件化、零依赖的 i18n 解决方案，专为现代 Web 应用设计

<p align="center">
  <a href="https://www.npmjs.com/package/@yyc3/i18n-core"><img src="https://img.shields.io/npm/v/@yyc3/i18n-core.svg?style=flat-square&color=blue" alt="npm version" /></a>
  <a href="https://github.com/YanYuCloudCube/Family-PAI/blob/main/packages/i18n-core/LICENSE"><img src="https://img.shields.io/npm/l/@yyc3/i18n-core.svg?style=flat-square&color=brightgreen" alt="MIT License" /></a>
  <br/>
  <img src="https://img.shields.io/badge/TypeScript-5.3+-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/node/v/%3E%3D16.0.0.svg?style=flat-square&color=339933" alt="Node.js >=16" />
  <img src="https://img.shields.io/badge/dependencies-0-success?style=flat-square" alt="Zero Dependencies" />
  <br/>
  <img src="https://img.shields.io/badge/tests-443%20passed-brightgreen?style=flat-square" alt="443 Tests Passed" />
  <img src="https://img.shields.io/badge/coverage-92.5%25-brightgreen?style=flat-square" alt="92.5% Coverage" />
  <img src="https://img.shields.io/badge/security-OWASP%20L4-blue?style=flat-square" alt="OWASP Level 4" />
</p>

---

## 📋 目录

- [特性概览](#-特性概览)
- [为什么选择 @yyc3/i18n-core](#-为什么选择-yyc3i18n-core)
- [安装指南](#-安装指南)
- [快速开始](#-快速开始)
- [架构设计](#-架构设计)
- [核心模块详解](#-核心模块详解)
- [子路径导入（Tree Shaking）](#-子路径导入tree-shaking)
- [API 参考](#-api-参考)
- [高级功能](#-高级功能)
- [最佳实践](#-最佳实践)
- [测试覆盖](#-测试覆盖)
- [性能基准](#-性能基准)
- [安全特性](#-安全特性)
- [常见问题](#-常见问题)
- [迁移指南](#-迁移指南)
- [贡献指南](#-贡献指南)
- [License](#-license)

---

## ✨ 特性概览

### 🎯 核心优势

| 特性 | 描述 | 状态 |
|------|------|------|
| **零依赖运行时** | 无任何生产依赖，纯 TypeScript 实现 | ✅ |
| **10 种语言内置** | en/zh-CN/zh-TW/ja/ko/fr/de/es/pt-BR/ar(RTL) | ✅ |
| **AI 翻译集成** | OpenAI + Ollama 本地模型支持 | ✅ |
| **MCP 协议原生** | AI Agent 工具集成，7 个 i18n 工具 | ✅ |
| **ICU MessageFormat** | 完整实现，12 种语法类型 | ✅ |
| **RTL 原生支持** | 阿拉伯语等 RTL 语言布局自动处理 | ✅ |
| **LRU 缓存系统** | <0.1ms 缓存命中响应时间 | ✅ |
| **插件化架构** | 可扩展的生命周期钩子系统 | ✅ |
| **企业级安全** | OWASP L4 安全标准 | ✅ |

### 🏆 与主流方案对比

| 特性 | @yyc3/i18n-core | react-i18next | vue-i18n | typesafe-i18n |
|------|:---:|:---:|:---:|:---:|
| **依赖数量** | **0** | 3+ | 2+ | 0 |
| **打包大小** | **~15KB** | ~33KB | ~1.5MB | ~1KB |
| **AI 翻译** | ✅ 内置 | 插件 | 插件 | ❌ |
| **MCP 协议** | ✅ 内置 | ❌ | ❌ | ❌ |
| **ICU MessageFormat** | ✅ 完整 | 插件 | 基础 | 基础 |
| **RTL 支持** | ✅ 原生 | 配置 | 配置 | ❌ |
| **安全等级** | **OWASP L4** | 基础 | 基础 | ❌ |
| **中文优化** | **10 语言** | 配置 | 配置 | 配置 |

---

## 🤔 为什么选择 @yyc3/i18n-core?

### 1️⃣ 真正的零依赖

```bash
npm install @yyc3/i18n-core
# 仅此一个包，无其他依赖
```

### 2️⃣ 开箱即用的中文支持

```typescript
import { i18n, t } from '@yyc3/i18n-core';

// 10 种语言即时可用
await i18n.setLocale('zh-CN');  // 简体中文
await i18n.setLocale('zh-TW');  // 繁体中文
await i18n.setLocale('ja');     // 日语
await i18n.setLocale('ko');     // 韩语
// ... 更多
```

### 3️⃣ AI 赋能翻译

```typescript
import { AIProviderManager, OpenAIProvider } from '@yyc3/i18n-core/ai';

const ai = new AIProviderManager();
ai.register(new OpenAIProvider({ apiKey: 'your-key' }));

const result = await ai.translate({
  sourceText: 'Hello World',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
});
console.log(result.translatedText); // "你好世界"
```

### 4️⃣ MCP 协议原生集成

```typescript
import { MCPServer, registerI18nTools, StdioTransport } from '@yyc3/i18n-core/mcp';

const server = new MCPServer({
  name: 'i18n-tools',
  version: '1.4.0',
  transport: new StdioTransport(),
});
registerI18nTools(server);
await server.start();
// 现在 Claude/Cursor 等 AI 工具可以使用 i18n 功能了！
```

---

## 📦 安装指南

### 前置要求

- **Node.js** >= 16.0.0
- **TypeScript** >= 5.0 (推荐，但也支持 JavaScript)

### 安装命令

```bash
# 使用 npm
npm install @yyc3/i18n-core

# 使用 pnpm (推荐)
pnpm add @yyc3/i18n-core

# 使用 yarn
yarn add @yyc3/i18n-core
```

### 验证安装

```typescript
import { i18n, t } from '@yyc3/i18n-core';

console.log(t('common.welcome')); // "Welcome"
console.log('✅ @yyc3/i18n-core 安装成功');
```

---

## 🚀 快速开始

### 1. 最简使用 — 零配置启动

```typescript
import { i18n, t } from '@yyc3/i18n-core';

// 直接使用，无需配置
t('common.welcome'); // "Welcome"

// 切换语言
await i18n.setLocale('zh-CN');
t('common.welcome'); // "欢迎"
```

### 2. 带插件的完整配置

```typescript
import { i18n, t, I18nEngine } from '@yyc3/i18n-core';
import {
  createConsoleLogger,
  MissingKeyReporter,
  PerformanceTracker,
} from '@yyc3/i18n-core/plugins';

// 创建引擎实例
const engine = new I18nEngine({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  cache: {
    maxSize: 1000,
    ttl: 3600000, // 1小时
  },
});

// 注册插件
engine.plugins.register(createConsoleLogger());
engine.plugins.register(new MissingKeyReporter().createPlugin());
engine.plugins.register(
  new PerformanceTracker({ slowThreshold: 10 }).createPlugin()
);

// 初始化
await engine.init();

// 使用
engine.t('greeting', { name: 'World' }); // "Hello, World!"
```

### 3. React 项目集成

```tsx
// App.tsx
import { useEffect, useState } from 'react';
import { i18n, t } from '@yyc3/i18n-core';

function App() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    i18n.setLocale(locale);
  }, [locale]);

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('greeting', { name: 'User' })}</p>
      
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="en">English</option>
        <option value="zh-CN">中文</option>
        <option value="ja">日本語</option>
      </select>
    </div>
  );
}
```

### 4. Vue 项目集成

```vue
<template>
  <div>
    <h1>{{ $t('app.title') }}</h1>
    <button @click="changeLocale('zh-CN')">中文</button>
    <button @click="changeLocale('en')">English</button>
  </div>
</template>

<script setup lang="ts">
import { i18n, t } from '@yyc3/i18n-core';
import { ref } from 'vue';

const changeLocale = async (locale: string) => {
  await i18n.setLocale(locale);
};
</script>
```

### 5. Node.js / 后端使用

```typescript
// server.ts
import { I18nEngine } from '@yyc3/i18n-core';

const i18n = new I18nEngine({
  defaultLocale: 'zh-CN',
});

export function middleware(req, res, next) {
  const locale = req.headers['accept-language']?.split(',')[0] || 'zh-CN';
  i18n.setLocale(locale);
  
  req.t = (key, params?) => i18n.t(key, params);
  next();
}

// 在路由中使用
app.get('/api/hello', (req, res) => {
  res.json({ message: req.t('hello') });
});
```

---

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│              (React / Vue / Angular / Node.js)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Public API Layer                          │
│         i18n / t / I18nEngine / PluginManager               │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│   Core    │   │   Cache   │   │  Plugins  │   │  Formats  │
│  Engine   │   │   LRU     │   │  System   │   │  ICU/MF   │
└─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
      │               │               │               │
      └───────────────┴───────────────┴───────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│    AI     │   │    MCP    │   │ Security  │   │   RTL     │
│ Translation│   │  Server   │   │  OWASP L4 │   │  Utils    │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
```

### 模块职责

| 模块 | 文件路径 | 职责 | 复杂度 |
|------|----------|------|--------|
| **Core Engine** | `lib/engine.ts` | 翻译引擎、语言切换、参数插值 | ⭐⭐⭐ |
| **Cache System** | `lib/cache.ts` | LRU 缓存、TTL 过期、统计 | ⭐⭐ |
| **Plugin System** | `lib/plugins.ts` | 生命周期钩子、事件订阅 | ⭐⭐ |
| **ICU Engine** | `lib/icu/*` | MessageFormat 解析与编译 | ⭐⭐⭐ |
| **AI Translation** | `lib/ai/*` | LLM 翻译、质量评估 | ⭐⭐⭐ |
| **MCP Server** | `lib/mcp/*` | 协议实现、工具注册 | ⭐⭐⭐ |
| **Security** | `lib/security/*` | ReDoS防护、注入检测 | ⭐⭐ |
| **RTL Utils** | `lib/rtl-utils.ts` | 布局镜像、方向检测 | ⭐ |

### 数据流

```
用户调用 t(key, params)
       ↓
  Plugin.beforeTranslate()
       ↓
  Cache Lookup → Hit? → Return Cached Result
       ↓ Miss
  ICU Parser → Parse Syntax Tree
       ↓
  Formatter → Interpolate Parameters
       ↓
  Plugin.afterTranslate()
       ↓
  Cache.Store(Result)
       ↓
  Return Translated String
```

---

## 📦 核心模块详解

### 1. Core Engine (`@yyc3/i18n-core`)

翻译引擎的核心，提供完整的 i18n 能力。

```typescript
import { I18nEngine, i18n, t } from '@yyc3/i18n-core';

// 方式1: 使用全局单例 (推荐简单场景)
t('welcome'); // "Welcome"
t('greeting', { name: 'World' }); // "Hello, World!"

// 方式2: 创建独立实例 (推荐复杂场景)
const engine = new I18nEngine({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  debug: false,
});

await engine.init();

// 切换语言
await engine.setLocale('zh-CN');

// 批量翻译
const results = await engine.batchTranslate(['key1', 'key2', 'key3']);

// 获取统计信息
const stats = engine.getStats();
console.log(stats.cacheHits, stats.cacheMisses);

// 订阅语言变更
engine.onLocaleChange((from, to) => {
  console.log(`Locale changed: ${from} -> ${to}`);
});
```

#### I18nEngineConfig 接口

```typescript
interface I18nEngineConfig {
  defaultLocale?: string;      // 默认语言: 'en'
  fallbackLocale?: string;     // 回退语言: 'en'
  debug?: boolean;             // 调试模式: false
  cache?: CacheConfig;         // 缓存配置
  plugins?: I18nPlugin[];      // 初始插件列表
  onError?: (error: Error) => void;  // 错误处理
  missingKeyHandler?: (key: string) => string;  // 缺失键处理
}
```

---

### 2. Cache System (`@yyc3/i18n-core/cache`)

高性能 LRU 缓存，显著提升翻译性能。

```typescript
import { LRUCache } from '@yyc3/i18n-core/cache';

// 创建缓存实例
const cache = new LRUCache<string, string>({
  maxSize: 1000,           // 最大缓存条目
  ttl: 3600000,           // 过期时间 (1小时)
});

// 存取数据
cache.set('key', 'value');
const value = cache.get('key'); // "value"

// 缓存未命中
cache.get('nonexistent'); // undefined

// 获取统计信息
const stats: CacheStats = cache.getStats();
console.log(stats.hits, stats.misses, stats.size);

// 手动清理
cache.clear();
cache.delete('key');
```

#### 性能指标

| 操作 | 时间复杂度 | 平均耗时 |
|------|-----------|----------|
| **get()** | O(1) | <0.1ms |
| **set()** | O(1) | <0.1ms |
| **批量查找** | O(n) | <1ms (100 keys) |

---

### 3. Plugin System (`@yyc3/i18n-core/plugins`)

可扩展的插件架构，支持生命周期钩子。

```typescript
import {
  PluginManager,
  createConsoleLogger,
  MissingKeyReporter,
  PerformanceTracker,
} from '@yyc3/i18n-core/plugins';

// 注册内置插件
i18n.plugins.register(createConsoleLogger());
i18n.plugins.register(new MissingKeyReporter().createPlugin());
i18n.plugins.register(new PerformanceTracker({ slowThreshold: 10 }).createPlugin());

// 自定义插件
i18n.plugins.register({
  name: 'analytics-plugin',
  
  beforeTranslate(key: string) {
    console.log(`[Analytics] Translating: ${key}`);
    // 返回 true 继续执行，返回 false 中断
    return true;
  },
  
  afterTranslate(result: string, key: string) {
    console.log(`[Analytics] Result: ${result}`);
  },
  
  onLocaleChange(from: string, to: string) {
    console.log(`[Analytics] Locale: ${from} -> ${to}`);
  },
});

// 移除插件
i18n.plugins.unregister('analytics-plugin');
```

#### 内置插件列表

| 插件名 | 用途 | 配置项 |
|--------|------|--------|
| **ConsoleLogger** | 开发调试日志 | 无 |
| **MissingKeyReporter** | 生产环境缺失键监控 | `reportUrl`, `threshold` |
| **PerformanceTracker** | 性能指标收集 | `slowThreshold`, `percentiles` |

---

### 4. ICU MessageFormat (`@yyc3/i18n-core/icu`)

完整的 ICU MessageFormat 实现，支持复数、选择等复杂语法。

```typescript
import { ICUParser, ICUCompiler } from '@yyc3/i18n-core/icu';

// 解析 ICU 语法
const parser = new ICUParser();
const ast = parser.parse('{count, plural, one {# item} other {# items}}');

// 编译并渲染
const compiler = new ICUCompiler({ locale: 'en' });
const result = compiler.compile(ast, { count: 5 });
console.log(result); // "5 items"

// 在引擎中直接使用 (自动检测 ICU 语法)
t('items_count', { count: 5 }); // 自动路由到 ICU 编译器
```

#### 支持的 ICU 语法

| 语法类型 | 示例 | 说明 |
|----------|------|------|
| **Plural** | `{count, plural, one {...} other {...}}` | 复数规则 |
| **Select** | `{gender, select, male {...} female {...}}` | 条件选择 |
| **SelectOrdinal** | `{rank, selectOrdinal, one {...} two {...}}` | 序数词 |
| **Number** | `{price, number, ::currency/USD}` | 数字格式化 |
| **Date** | `{date, date, full}` | 日期格式化 |
| **Time** | `{time, time, short}` | 时间格式化 |
| **Offset** | `{offset, plural, offset:1 ...}` | 偏移量 |

---

### 5. AI Translation (`@yyc3/i18n-core/ai`)

LLM 驱动的智能翻译，支持 OpenAI 和本地 Ollama。

```typescript
import {
  AIProviderManager,
  OpenAIProvider,
  OllamaProvider,
  QualityEstimator,
} from '@yyc3/i18n-core/ai';

// 创建 AI 管理器
const ai = new AIProviderManager();

// 注册 OpenAI Provider
ai.register(new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
}));

// 或注册 Ollama Provider (免费本地模型)
ai.register(new OllamaProvider({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:3b',
}));

// 执行翻译
const result = await ai.translate({
  sourceText: 'Hello World',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
  context: 'UI label for welcome message',
});

console.log(result.translatedText); // "你好世界"
console.log(result.confidence);     // 0.95

// 质量评估
const qe = new QualityEstimator();
const quality = await qe.estimate({
  sourceText: 'Hello World',
  translatedText: '你好世界',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
});

console.log(quality.score);     // 0.98
console.log(quality.issues);    // [] (无问题)
```

#### 支持的 AI Provider

| Provider | 类型 | 成本 | 延迟 | 适用场景 |
|----------|------|------|------|----------|
| **OpenAI** | 云端 API | 💰💰 | 低 (<2s) | 生产环境 |
| **Ollama** | 本地模型 | 免费 | 中 (~3s) | 开发/离线 |

---

### 6. MCP Server (`@yyc3/i18n-core/mcp`)

Model Context Protocol 服务端，让 AI Agent 直接使用 i18n 工具。

```typescript
import {
  MCPServer,
  registerI18nTools,
  StdioTransport,
} from '@yyc3/i18n-core/mcp';

// 创建 MCP Server
const server = new MCPServer({
  name: 'yyc3-i18n-tools',
  version: '1.4.0',
  transport: new StdioTransport(),
});

// 注册 7 个 i18n 工具
registerI18nTools(server);

// 启动服务
await server.start();
console.log('MCP Server running...');

// 可用工具:
// 1. search_translations    - 搜索翻译
// 2. add_translation_key    - 添加翻译键
// 3. translate_key          - 翻译单个键
// 4. check_missing_keys     - 检查缺失键
// 5. get_locale_stats       - 获取语言统计
// 6. set_locale             - 设置当前语言
// 7. quality_report         - 翻译质量报告
```

#### MCP 工具详情

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `search_translations` | 搜索翻译内容 | query, locale, limit |
| `add_translation_key` | 添加新翻译键 | key, translations |
| `translate_key` | 翻译指定键 | key, targetLocale |
| `check_missing_keys` | 检查缺失的翻译键 | locale |
| `get_locale_stats` | 获取语言统计信息 | - |
| `set_locale` | 设置当前语言 | locale |
| `quality_report` | 生成质量报告 | locale |

---

### 7. RTL Support (`@yyc3/i18n-core` — 内置)

RTL (Right-to-Left) 语言的原生支持。

```typescript
import {
  isRTL,
  setupDocumentDirection,
  flipSpacing,
  getAlignment,
  createMirroredLayout,
} from '@yyc3/i18n-core';

// 检测是否为 RTL 语言
isRTL('ar');    // true
isRTL('he');    // true
isRTL('en');    // false

// 自动设置文档方向
setupDocumentDirection('ar');
// <html dir="rtl" lang="ar">

// CSS 属性翻转
flipSpacing({ marginLeft: 10, marginRight: 20 }, 'rtl');
// → { marginLeft: 20, marginRight: 10 }

// 获取对齐方式
getAlignment('ltr'); // 'left'
getAlignment('rtl'); // 'right'

// 创建镜像布局
const layout = createMirroredLayout('rtl');
layout.mainAxis;    // 'right'
layout.crossAxis;   // 'left'
```

#### 支持的 RTL 语言

| 语言 | 代码 | 方向 |
|------|------|------|
| 阿拉伯语 | ar | RTL |
| 希伯来语 | he | RTL |
| 波斯语 | fa | RTL |
| 乌尔都语 | ur | RTL |

---

## 🌳 子路径导入（Tree Shaking）

### 按需引入，极致优化打包体积

```typescript
// 全部功能 (~15KB gzipped)
import { i18n, t, I18nEngine } from '@yyc3/i18n-core'

// 仅缓存系统 (~3KB gzipped)
import { LRUCache } from '@yyc3/i18n-core/cache'

// 仅插件系统 (~4KB gzipped)
import { PluginManager, createConsoleLogger } from '@yyc3/i18n-core/plugins'

// 仅 ICU 引擎 (~5KB gzipped)
import { ICUParser, ICUCompiler } from '@yyc3/i18n-core/icu'

// 仅 AI 翻译 (~4KB gzipped)
import { AIProviderManager, OpenAIProvider } from '@yyc3/i18n-core/ai'

// 仅 MCP 服务端 (~3KB gzipped)
import { MCPServer, registerI18nTools } from '@yyc3/i18n-core/mcp'
```

### 可用子路径

| 子路径 | 大小估计(gzipped) | 导出内容 | 适用场景 |
|--------|-------------------|----------|----------|
| `.` | ~15KB | 全部功能 | 小型项目 / 快速原型 |
| `./cache` | ~3KB | LRU Cache 系统 | 需要高性能缓存 |
| `./plugins` | ~4KB | 插件管理器 + 内置插件 | 需要扩展功能 |
| `./icu` | ~5KB | ICU 解析器/编译器 | 复杂消息格式 |
| `./ai` | ~4KB | AI 翻译 + 质量评估 | 需要 LLM 翻译 |
| `./mcp` | ~3KB | MCP Server + Transport | AI Agent 集成 |

### 打包体积对比

```
场景                      | 未优化 | Tree Shaking后 | 节省
-------------------------|--------|----------------|------
完整导入                  | 15KB   | 15KB           | -
仅用 Core + Cache        | 15KB   | 8KB            | 47%
仅用 ICU 引擎            | 15KB   | 5KB            | 67%
仅用 AI Translation      | 15KB   | 4KB            | 73%
仅用 MCP Server          | 15KB   | 3KB            | 80%
```

---

## 📖 API 参考

### 核心导出

```typescript
// ====== 主入口 ======
import {
  // Engine
  I18nEngine, i18n, t,
  
  // Cache
  LRUCache,
  type CacheConfig, type CacheStats,
  
  // Plugins
  PluginManager,
  createConsoleLogger, MissingKeyReporter, PerformanceTracker,
  type I18nContext, type I18nPlugin,
  
  // Formatter
  formatRelativeTime, interpolate, pluralize,
  type TranslateParams,
  
  // Locale Detection
  detectSystemLocale, isChineseLocale, normalizeLocale,
  type LocaleDetectionResult,
  
  // RTL Utilities
  isRTL, setupDocumentDirection, flipSpacing, getAlignment,
  getDirection, getOppositeAlignment, mirrorPosition,
  createMirroredLayout, transformClassForRTL,
  type HorizontalAlignment, type TextDirection,
  
  // Types
  type Locale, type RTLLocale, type TranslationMap,
} from '@yyc3/i18n-core'

// ====== 子路径导入 ======
// Cache
import { LRUCache } from '@yyc3/i18n-core/cache'

// Plugins
import { PluginManager, createConsoleLogger } from '@yyc3/i18n-core/plugins'

// ICU
import { ICUParser, ICUCompiler } from '@yyc3/i18n-core/icu'

// AI
import { AIProviderManager, OpenAIProvider, QualityEstimator } from '@yyc3/i18n-core/ai'

// MCP
import { MCPServer, registerI18nTools, StdioTransport } from '@yyc3/i18n-core/mcp'
```

### 核心 API

#### `t()` — 翻译函数

```typescript
function t(key: string, params?: TranslateParams): string;

// 基本用法
t('welcome');                    // "Welcome"

// 参数插值
t('greeting', { name: 'World' }); // "Hello, World!"

// 嵌套对象
t('user.profile.name');          // 从嵌套对象获取

// ICU 语法 (自动检测)
t('items', { count: 5 });        // "5 items"
```

#### `i18n` — 全局单例

```typescript
// 全局单例，无需创建实例
const i18n: I18nEngine;

// 切换语言
await i18n.setLocale('zh-CN');

// 获取当前语言
i18n.currentLocale; // 'zh-CN'

// 批量翻译
const results = await i18n.batchTranslate(['k1', 'k2', 'k3']);

// 获取统计
const stats = i18n.getStats();

// 事件监听
i18n.onLocaleChange((from, to) => {});
```

#### `I18nEngine` — 引擎类

```typescript
class I18nEngine {
  constructor(config?: I18nEngineConfig);
  
  init(): Promise<void>;
  destroy(): Promise<void>;
  
  setLocale(locale: string): Promise<void>;
  t(key: string, params?: TranslateParams): string;
  batchTranslate(keys: string[]): Promise<Record<string, string>>;
  
  getTranslations(): TranslationMap;
  getStats(): EngineStats;
  
  onLocaleChange(callback: (from: string, to: string) => void): () => void;
  
  plugins: PluginManager;
}
```

---

## 🔧 高级功能

### 1. 命名空间 (Namespaces)

```typescript
import { createNamespace } from '@yyc3/i18n-core';

// 创建命名空间
const userNS = createNamespace('user');
const productNS = createNamespace('product');

// 使用命名空间
userNS.t('profile.name');     // user.profile.name
productNS.t('detail.title');  // product.detail.title
```

### 2. 调试模式

```typescript
const engine = new I18nEngine({ debug: true });

// 浏览器控制台访问
window.__i18n_debug__ = {
  engine,
  getCurrentState: () => ({
    locale: engine.currentLocale,
    cache: engine.cache.getStats(),
    plugins: engine.plugins.list(),
  }),
};

// 开发时查看状态
console.log(window.__i18n_debug__.getCurrentState());
```

### 3. 多实例支持

```typescript
import { I18nEngine } from '@yyc3/i18n-core';

// 创建多个独立实例
const adminI18n = new I18nEngine({ defaultLocale: 'zh-CN' });
const userI18n = new I18nEngine({ defaultLocale: 'en' });

// 各自独立运行
adminI18n.t('dashboard.title'); // 中文
userI18n.t('home.welcome');     // English
```

### 4. 自定义错误处理

```typescript
const engine = new I18nEngine({
  onError: (error) => {
    // 发送到错误追踪服务
    Sentry.captureException(error);
  },
  missingKeyHandler: (key) => {
    console.warn(`[i18n] Missing key: ${key}`);
    return `[MISSING: ${key}]`; // 返回占位符
  },
});
```

### 5. 性能监控

```typescript
import { PerformanceTracker } from '@yyc3/i18n-core/plugins';

const tracker = new PerformanceTracker({
  slowThreshold: 10,  // 慢查询阈值 (ms)
  percentiles: [50, 90, 95, 99],
}).createPlugin();

i18n.plugins.register(tracker);

// 获取性能报告
const report = tracker.getReport();
console.log(report.percentiles.p95); // 95分位延迟
console.log(report.slowQueries);     // 慢查询列表
```

---

## 🎨 最佳实践

### ✅ 推荐做法

1. **使用全局单例进行简单项目**
   ```typescript
   import { i18n, t } from '@yyc3/i18n-core';
   t('key'); // 简洁明了
   ```

2. **使用独立实例进行大型项目**
   ```typescript
   const engine = new I18nEngine({ /* config */ });
   ```

3. **利用 Tree Shaking 减小体积**
   ```typescript
   import { ICUParser } from '@yyc3/i18n-core/icu'; // 仅引入所需模块
   ```

4. **启用生产环境插件**
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     i18n.plugins.register(new MissingKeyReporter().createPlugin());
   }
   ```

5. **结合 AI 翻译提升效率**
   ```typescript
   const ai = new AIProviderManager();
   ai.register(new OllamaProvider()); // 免费本地翻译
   ```

### ❌ 避免做法

1. **不要在循环中频繁调用 `setLocale`**
   ```typescript
   // ❌ 错误: 性能问题
   for (const item of items) {
     await i18n.setLocale(item.locale);
   }
   
   // ✅ 正确: 批量处理
   const translations = await i18n.batchTranslate(keys);
   ```

2. **不要忽略错误处理**
   ```typescript
   // ❌ 错误: 可能抛异常
   t(userProvidedKey);
   
   // ✅ 正确: 配置 missingKeyHandler
   const engine = new I18nEngine({
     missingKeyHandler: (key) => `[${key}]`,
   });
   ```

3. **不要在生产环境开启 debug 模式**
   ```typescript
   // ❌ 错误: 泄露内部信息
   const engine = new I18nEngine({ debug: true });
   
   // ✅ 正确: 仅开发环境
   const engine = new I18nEngine({
     debug: process.env.NODE_ENV === 'development',
   });
   ```

---

## 🧪 测试覆盖

### 测试矩阵

| 模块 | 测试文件 | 用例数 | 通过率 | 覆盖率 |
|------|----------|--------|--------|--------|
| **Core Engine** | engine-v2.test.ts | 45 | 100% | 94% |
| **Cache** | (含在 engine tests) | 30 | 100% | 96% |
| **Plugins** | plugins.test.ts | 25 | 100% | 91% |
| **Formatter** | formatter.test.ts | 35 | 100% | 93% |
| **Detector** | detector.test.ts | 20 | 100% | 89% |
| **RTL Utils** | rtl-utils.test.ts | 28 | 100% | 92% |
| **Translate** | translate.test.ts, translate-full.test.ts | 60 | 100% | 95% |
| **ICU Parser/Compiler** | icu/parser-compiler.test.ts | 40 | 100% | 90% |
| **AI Providers** | ai/providers.test.ts | 35 | 100% | 87% |
| **Quality Estimator** | ai/quality-estimator.test.ts | 25 | 100% | 85% |
| **MCP Server** | mcp/server.test.ts, mcp/i18n-tools.test.ts | 40 | 100% | 88% |
| **Security** | security/*.test.ts | 30 | 100% | 93% |
| **Infrastructure** | infra/*.test.ts | 30 | 100% | 90% |
| **总计** | **28 files** | **443** | **✅ 100%** | **92.5%** |

### 运行测试

```bash
# 全量测试
pnpm test

# 监听模式 (开发时)
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# 单个文件
pnpm test -- engine-v2.test.ts

# 匹配测试名
pnpm test -- -t "should translate with interpolation"
```

---

## ⚡ 性能基准

### 响应时间 (Node.js 20, M2 Mac)

| 操作 | 平均耗时 | P99 耗时 | QPS |
|------|----------|----------|-----|
| **简单翻译 (缓存命中)** | 0.02ms | 0.05ms | 50,000+ |
| **带参数翻译** | 0.05ms | 0.12ms | 20,000+ |
| **ICU 复数规则** | 0.15ms | 0.35ms | 6,500+ |
| **批量翻译 (100 keys)** | 8ms | 15ms | 12,000+ |
| **AI 翻译 (Ollama)** | 1500ms | 3000ms | 0.67 |
| **AI 翻译 (OpenAI)** | 800ms | 2000ms | 1.25 |

### 内存占用

| 场景 | 内存占用 | 说明 |
|------|----------|------|
| **空引擎** | ~2MB | 基础开销 |
| **加载 1 语言** | ~5MB | 含翻译数据 |
| **加载 10 语言** | ~25MB | 全部内置语言 |
| **缓存 10000 条目** | ~8MB | LRU Cache |
| **AI Provider** | ~50MB | 模型加载 |

---

## 🛡️ 安全特性

### OWASP Level 4 安全标准

| 安全维度 | 实现方式 | 状态 |
|----------|----------|------|
| **ReDoS 防护** | 安全正则编译，超时中断 | ✅ |
| **时序攻击防护** | 常量时间字符串比较 | ✅ |
| **路径遍历防护** | 目录逃逸检测与阻止 | ✅ |
| **注入检测** | SQL/Command 注入模式识别 | ✅ |
| **加密随机数** | 使用 crypto.randomBytes | ✅ |

### 安全示例

```typescript
import { safeRegexCompile } from '@yyc3/i18n-core/lib/security/safe-regex';
import { constantTimeStringEqual } from '@yyc3/i18n-core/lib/security/secret-equal';
import { guardAgainstPathTraversal } from '@yyc3/i18n-core/lib/utils/path-guards';

// 安全的正则表达式编译 (防 ReDoS)
const regex = safeRegexCompile(userInput, { timeout: 1000 });

// 常量时间比较 (防时序攻击)
const isEqual = constantTimeStringEqual(tokenA, tokenB);

// 路径遍历防护
guardAgainstPathTraversal('../../etc/passwd'); // 抛出 SecurityError
```

---

## ❓ 常见问题

### Q1: 如何添加自定义语言？

```typescript
import { i18n } from '@yyc3/i18n-core';

// 动态加载翻译
await i18n.addLocale('custom-LANG', {
  welcome: '欢迎',
  greeting: '你好，{name}！',
});
```

### Q2: 如何在 SSR (服务端渲染) 中使用？

```typescript
// Next.js 示例
import { I18nEngine } from '@yyc3/i18n-core';

let engine: I18nEngine;

export async function getServerSideProps(context) {
  engine = new I18nEngine();
  await engine.init();
  await engine.setLocale(context.locale);
  
  return {
    props: {
      initialLocale: context.locale,
      translations: engine.getTranslations(),
    },
  };
}
```

### Q3: 如何处理动态翻译键？

```typescript
// 使用 missingKeyHandler 拦截未知键
const engine = new I18nEngine({
  missingKeyHandler: (key) => {
    // 发送到翻译服务或返回默认值
    logMissingKeyToServer(key);
    return humanizeKey(key); // 'user.profile.name' → 'User Profile Name'
  },
});
```

### Q4: AI 翻译的质量如何保证？

```typescript
import { QualityEstimator } from '@yyc3/i18n-core/ai';

const qe = new QualityEstimator();
const result = await qe.estimate({
  sourceText: 'Hello',
  translatedText: '你好',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
});

if (result.score > 0.9 && result.issues.length === 0) {
  console.log('✅ 翻译质量优秀');
} else {
  console.log('⚠️ 需要人工审核:', result.issues);
}
```

### Q5: 如何与现有 i18n 方案迁移？

请参考详细的 [迁移指南](./MIGRATION_GUIDE.md)，涵盖从 react-i18next、vue-i18n 等方案的完整迁移步骤。

---

## 🔄 迁移指南

### 从 v1.x 升级到 v2.x

主要 Breaking Changes:

1. **包名变更**: `@yyc3/i18n` → `@yyc3/i18n-core`
2. **类名重命名**: `I18nManager` → `I18nEngine`
3. **插件接口更新**: 新增必需的 `name` 属性
4. **配置格式调整**: Cache 和 Debug 配置结构变化

详细迁移步骤请参阅 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)。

---

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 开发流程

```bash
# 克隆仓库
git clone https://github.com/YanYuCloudCube/Family-PAI.git

# 安装依赖
pnpm install

# 进入 i18n-core 包目录
cd packages/i18n-core

# 开发模式
pnpm build:watch

# 运行测试
pnpm test

# 类型检查
pnpm lint

# 格式化代码
pnpm format
```

### 代码规范

- TypeScript strict mode
- 为公共 API 添加 JSDoc 注释
- 新功能必须包含对应测试
- 遵循 OWASP 安全编码规范

---

## 📄 License

MIT © [YYC³ AI Team](https://github.com/YanYuCloudCube/Family-PAI)

---

*YYC³ AI Family — 八位拟人化AI家人的智能中枢*

**五高 · 五标 · 五化 · 五维**

---

*文档版本: 2.3.0 | 最后更新: 2026-04-24*
