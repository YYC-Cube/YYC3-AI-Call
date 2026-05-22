# 📚 API 参考 | API Reference

> **@yyc3/i18n-core 完整 API 文档** - 所有导出模块、类型定义和使用示例

## 📋 目录 (Table of Contents)

- [核心引擎 (Core Engine)](#-核心引擎-core-engine)
  - [I18nEngine](#i18nengine)
  - [全局实例](#全局实例)
- [翻译函数 (Translation Functions)](#-翻译函数-translation-functions)
- [缓存系统 (Cache System)](#-缓存系统-cache-system)
- [插件系统 (Plugin System)](#-插件系统-plugin-system)
- [格式化工具 (Formatter Utilities)](#-格式化工具-formatter-utilities)
- [语言检测 (Locale Detection)](#-语言检测-locale-detection)
- [RTL 工具 (RTL Utilities)](#-rtl-utilities-rtl-utilities)
- [AI 翻译 (AI Translation)](#-ai-translation-ai-translation)
- [MCP 服务器 (MCP Server)](#-mcp-服务器-mcp-server)
- [安全模块 (Security Modules)](#-安全模块-security-modules)
- [基础设施 (Infrastructure)](#-基础设施-infrastructure)

---

## 🎯 核心引擎 (Core Engine)

### I18nEngine

国际化引擎的主类，提供完整的翻译功能。

```typescript
import { I18nEngine, i18n } from '@yyc3/i18n-core';
```

#### 构造函数 (Constructor)

```typescript
constructor(config?: I18nEngineConfig)
```

**参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:----:|--------|------|
| `config` | `I18nEngineConfig` | ❌ | `{}` | 配置对象 |

**配置接口 `I18nEngineConfig`：**

```typescript
interface I18nEngineConfig {
  locale?: Locale;                    // 初始语言
  fallbackLocale?: Locale;            // 回退语言
  cache?: {
    enabled?: boolean;                // 是否启用缓存（默认 true）
    maxSize?: number;                 // 最大缓存条目数（默认 1000）
    ttl?: number;                     // 缓存过期时间毫秒（默认 5 分钟）
  };
  debug?: boolean;                    // 调试模式（默认 false）
  onError?: (error: Error, context: {
    key: string;
    locale: Locale;
  }) => void;                         // 错误处理回调
  missingKeyHandler?: (key: string, locale: Locale) => string;
                                      // 缺失键处理回调
}
```

**示例：**

```typescript
const engine = new I18nEngine({
  defaultLocale: 'zh-CN',
  fallbackLocale: 'en',
  cache: {
    enabled: true,
    maxSize: 500,
    ttl: 10 * 60 * 1000,  // 10 分钟
  },
  debug: true,
});
```

#### 方法 (Methods)

##### `init(config)`

初始化引擎。

```typescript
async init(config?: I18nEngineConfig): Promise<void>
```

**示例：**

```typescript
await i18n.init({
  defaultLocale: 'zh-CN',
  fallbackLocale: 'en',
});
```

##### `t(key, params?)`

翻译文本（核心方法）。

```typescript
t(key: string, params?: Record<string, string>): string
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 翻译键（支持点号分隔的命名空间） |
| `params` | `Record<string, string>` | 插值参数 |

**返回值：** `string` - 翻译后的文本

**示例：**

```typescript
// 基础翻译
i18n.t('common.welcome');           // "欢迎"

// 带参数插值
i18n.t('greeting', { name: '世界' });  // "你好，世界！"

// ICU 复数规则
i18n.t('itemCount', { count: 5 });   // "5 个项目"
```

##### `setLocale(locale)`

切换当前语言。

```typescript
async setLocale(locale: Locale): Promise<void>
```

**示例：**

```typescript
await i18n.setLocale('en');
console.log(i18n.getLocale());  // "en"
```

##### `getLocale()`

获取当前语言。

```typescript
getLocale(): Locale
```

**返回值：** `Locale` - 当前语言代码

##### `registerTranslation(locale, map)`

注册翻译资源。

```typescript
registerTranslation(locale: Locale, map: TranslationMap): void
```

**示例：**

```typescript
i18n.registerTranslation('zh-CN', {
  app: {
    title: '应用标题',
  },
  common: {
    submit: '提交',
  },
});
```

##### `createNamespace(prefix)`

创建命名空间翻译器。

```typescript
createNamespace(prefix: string): {
  t: (key: string, params?: Record<string, string>) => string;
  batchTranslate: (keys: string[]) => Record<string, string>;
  getLocale: () => Locale;
}
```

**示例：**

```typescript
const appT = i18n.createNamespace('app');
appT('title');                    // 等同于 t('app.title')
appT.batchTranslate(['title', 'description']);
```

##### `batchTranslate(keys, params?)`

批量翻译多个键。

```typescript
batchTranslate(
  keys: string[],
  params?: Record<string, Record<string, string>>
): Record<string, string>
```

**示例：**

```typescript
const results = i18n.batchTranslate([
  'common.submit',
  'common.cancel',
  'common.save',
]);
// { common.submit: "提交", common.cancel: "取消", common.save: "保存" }
```

##### `subscribe(sub)`

订阅语言变化事件。

```typescript
subscribe(sub: (locale: Locale) => void): () => void
```

**返回值：** 取消订阅函数

**示例：**

```typescript
const unsubscribe = i18n.subscribe((newLocale) => {
  console.log(`Language changed to: ${newLocale}`);
});

// 取消订阅
unsubscribe();
```

##### `getStats()`

获取引擎统计信息。

```typescript
getStats(): {
  locale: Locale;
  cache: CacheStats;
  plugins: string[];
  subscriberCount: number;
  loadedLocales: string[];
}
```

##### `setDebug(enabled)`

启用/禁用调试模式。

```typescript
setDebug(enabled: boolean): void
```

##### `destroy()`

销毁引擎实例（清理资源）。

```typescript
async destroy(): Promise<void>
```

---

### 全局实例

#### `i18n`

预配置的全局 `I18nEngine` 实例。

```typescript
import { i18n } from '@yyc3/i18n-core';

await i18n.init({ defaultLocale: 'zh-CN' });
```

#### `t`

全局便捷翻译函数，等同于 `i18n.t()`。

```typescript
import { t } from '@yyc3/i18n-core';

t('common.welcome');  // "欢迎"
```

#### `setLocale`

全局便捷函数，等同于 `i18n.setLocale()`。

```typescript
import { setLocale } from '@yyc3/i18n-core';

await setLocale('en');
```

---

## 🔤 翻译函数 (Translation Functions)

### `interpolate(template, params)`

模板插值。

```typescript
import { interpolate } from '@yyc3/i18n-core';

interpolate('Hello {{name}}, you have {{count}} messages', {
  name: 'World',
  count: '5'
});
// => "Hello World, you have 5 messages"
```

**签名：**

```typescript
function interpolate(
  template: string,
  params: Record<string, string>
): string
```

### `pluralize(template, count)`

复数形式处理。

```typescript
import { pluralize } from '@yyc3/i18n-core';

pluralize('{{count}} message(s)', 1);   // => "1 message"
pluralize('{{count}} message(s)', 5);   // => "5 messages"
```

**签名：**

```typescript
function pluralize(template: string, count: number): string
```

### `formatRelativeTime(timestamp, locale?)`

相对时间格式化。

```typescript
import { formatRelativeTime } from '@yyc3/i18n-core';

formatRelativeTime(Date.now() - 3600000, 'zh-CN');
// => "1 小时前"

formatRelativeTime(Date.now() - 86400000, 'en');
// => "1 day ago"
```

**签名：**

```typescript
function formatRelativeTime(
  timestamp: number,
  locale?: Locale
): string
```

---

## 💾 缓存系统 (Cache System)

### LRUCache

LRU（最近最少使用）缓存实现。

```typescript
import { LRUCache } from '@yyc3/i18n-core';
```

#### 构造函数

```typescript
constructor(config?: CacheConfig)
```

**配置接口 `CacheConfig`：**

```typescript
interface CacheConfig {
  enabled?: boolean;      // 是否启用（默认 true）
  maxSize?: number;       // 最大条目数（默认 1000）
  defaultTTL?: number;    // 默认过期时间毫秒（默认 5 分钟）
}
```

#### 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `get` | `get(key: K): V \| null` | 获取缓存值 |
| `set` | `set(key: K, value: V, ttl?: number): void` | 设置缓存值 |
| `has` | `has(key: K): boolean` | 检查键是否存在 |
| `delete` | `delete(key: K): boolean` | 删除指定键 |
| `clear` | `clear(): void` | 清空缓存 |
| `getStats` | `getStats(): CacheStats` | 获取统计信息 |

**示例：**

```typescript
const cache = new LRUCache({ maxSize: 500, defaultTTL: 300000 });

cache.set('key1', 'value1');
cache.get('key1');  // "value1"

console.log(cache.getStats());
// { size: 1, maxSize: 500, hitRate: 1.0, ... }
```

---

## 🔌 插件系统 (Plugin System)

### PluginManager

插件管理器，管理插件的生命周期。

```typescript
import { PluginManager } from '@yyc3/i18n-core';
```

#### 方法

##### `register(plugin)`

注册插件。

```typescript
register(plugin: I18nPlugin): void
```

**插件接口 `I18nPlugin`：**

```typescript
interface I18nPlugin {
  name: string;
  version?: string;

  beforeTranslate?(key: string, params?: Record<string, string>): {
    key: string;
    params?: Record<string, string>;
  };

  afterTranslate?(
    result: string,
    key: string,
    params?: Record<string, string>
  ): string | undefined;

  onLocaleChange?(from: string, to: string): void;

  onError?(error: Error, context: {
    key: string;
    locale: Locale;
  }): void;
}
```

##### `getRegisteredPlugins()`

获取已注册插件列表。

```typescript
getRegisteredPlugins(): string[]
```

---

### 内置插件 (Built-in Plugins)

#### `createConsoleLogger(options?)`

控制台日志插件。

```typescript
import { createConsoleLogger } from '@yyc3/i18n-core';

i18n.plugins.register(createConsoleLogger({
  logTranslations: false,
  logLocaleChanges: true,
  logMissingKeys: true,
  logErrors: true,
}));
```

**选项 `ConsoleLoggerConfig`：**

```typescript
interface ConsoleLoggerConfig {
  logTranslations?: boolean;   // 记录翻译调用（默认 false）
  logLocaleChanges?: boolean;  // 记录语言切换（默认 false）
  logMissingKeys?: boolean;    // 记录缺失键（默认 true）
  logErrors?: boolean;         // 记录错误（默认 true）
}
```

#### `MissingKeyReporter`

缺失键报告器。

```typescript
import { MissingKeyReporter } from '@yyc3/i18n-core';

const reporter = new MissingKeyReporter({ maxEntries: 1000 });
i18n.plugins.register(reporter.createPlugin());

// 生成报告
reporter.generateReport();     // 格式化字符串
reporter.exportJSON();         // JSON 格式
```

**方法：**

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `generateReport()` | `string` | 生成格式化报告 |
| `exportJSON()` | `string` | 导出 JSON 数据 |
| `getMissingKeys()` | `string[]` | 获取所有缺失键 |
| `clear()` | `void` | 清空记录 |
| `getCount()` | `number` | 获取缺失键总数 |

#### `PerformanceTracker`

性能追踪器。

```typescript
import { PerformanceTracker } from '@yyc3/i18n-core';

const tracker = new PerformanceTracker({
  slowThreshold: 10,        // 慢查询阈值（毫秒）
  maxSlowEntries: 50,       // 最大慢查询记录数
  samplingRate: 1,          // 采样率（1 = 全部记录）
});

i18n.plugins.register(tracker.createPlugin());

// 获取指标
tracker.getMetrics();
tracker.getCacheHitRate();       // 缓存命中率百分比
tracker.getPercentile(99);      // P99 延迟（毫秒）

// 生成报告
tracker.generateReport();
```

**方法：**

| 方法 | 返回类型 | 说明 |
|------|----------|------|
| `getMetrics()` | `PerformanceMetrics` | 获取完整指标 |
| `getCacheHitRate()` | `number` | 缓存命中率（0-100） |
| `getPercentile(p)` | `number` | 获取 P50/P95/P99 延迟 |
| `generateReport()` | `string` | 生成格式化报告 |
| `reset()` | `void` | 重置统计数据 |

---

## 🧭 语言检测 (Locale Detection)

### `detectSystemLocale(sourceLocale?)`

多源自动检测系统语言。

```typescript
import { detectSystemLocale } from '@yyc3/i18n-core';

const result = detectSystemLocale();
console.log(result.locale);   // 'zh-CN'
console.log(result.source);   // 'system' | 'storage' | 'env' | 'default'
```

**返回类型 `LocaleDetectionResult`：**

```typescript
interface LocaleDetectionResult {
  locale: Locale;
  source: 'system' | 'storage' | 'env' | 'default';
}
```

**检测优先级：**
1. 环境变量 (`NEXT_LOCALE`, `PUBLIC_LOCALE`)
2. LocalStorage 存储值
3. 浏览器/系统语言
4. 默认值 (`en`)

### `normalizeLocale(locale)`

规范化语言代码。

```typescript
import { normalizeLocale } from '@yyc3/i18n-core';

normalizeLocale('zh_cn');   // 'zh-CN'
normalizeLocale('EN-US');   // 'en'
normalizeLocale('ZH_TW');   // 'zh-TW'
```

### `isChineseLocale(locale)`

检测是否为中文环境。

```typescript
import { isChineseLocale } from '@yyc3/i18n-core';

isChineseLocale('zh-CN');   // true
isChineseLocale('zh-TW');   // true
isChineseLocale('en');      // false
isChineseLocale('ja');      // false
```

---

## ↔️ RTL 工具 (RTL Utilities)

处理从右到左（Right-to-Left）语言的布局工具集。

```typescript
import {
  isRTL,
  getDirection,
  getAlignment,
  getOppositeAlignment,
  setupDocumentDirection,
  flipSpacing,
  mirrorPosition,
  createMirroredLayout,
} from '@yyc3/i18n-core';
```

### `isRTL(locale)`

检查是否为 RTL 语言。

```typescript
isRTL('ar');     // true
isRTL('zh-CN');  // false
```

### `getDirection(locale)`

获取文本方向。

```typescript
getDirection('ar');     // 'rtl'
getDirection('zh-CN');  // 'ltr'
```

### `setupDocumentDirection(locale)`

设置文档方向（修改 `<html dir="...">`）。

```typescript
setupDocumentDirection('ar');  // <html dir="rtl">
setupDocumentDirection('en');  // <html dir="ltr">
```

### `flipSpacing(styles, direction)`

翻转间距属性。

```typescript
flipSpacing({ marginLeft: 10, marginRight: 20 }, 'rtl');
// => { marginLeft: 20, marginRight: 10 }
```

### `mirrorPosition(position, direction)`

镜像位置（用于绝对定位元素）。

```typescript
mirrorPosition({ left: 10, right: 'auto' }, 'rtl');
// => { left: 'auto', right: 10 }
```

---

## 🤖 AI 翻译 (AI Translation)

LLM 驱动的智能翻译集成层。

### AIProviderManager

AI 提供者管理器。

```typescript
import { AIProviderManager } from '@yyc3/i18n-core';

const ai = new AIProviderManager({
  preferLocal: true,    // 优先使用本地模型
  autoDetect: true,     // 自动检测可用提供者
});
```

#### 方法

##### `register(provider)`

注册 AI 提供者。

```typescript
register(provider: AIProvider): void
```

##### `translate(request)`

执行翻译请求。

```typescript
async translate(request: TranslationRequest): Promise<TranslationResponse>
```

**请求接口 `TranslationRequest`：**

```typescript
interface TranslationRequest {
  sourceText: string;              // 源文本
  sourceLocale: string;            // 源语言
  targetLocale: string;            // 目标语言
  context?: string;                // 上下文信息
  glossary?: Record<string, string>;  // 术语表
  style?: 'formal' | 'informal' | 'technical';  // 风格
}
```

**响应接口 `TranslationResponse`：**

```typescript
interface TranslationResponse {
  translatedText: string;          // 翻译结果
  qualityScore: number;            // 质量评分 (0-1)
  provider: AIProviderType;        // 提供者类型
  model: string;                   // 使用模型
  cached: boolean;                 // 是否来自缓存
}
```

**示例：**

```typescript
const result = await ai.translate({
  sourceText: 'Hello World',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
  context: 'Greeting message',
  style: 'formal',
});

console.log(result.translatedText);  // "你好世界"
console.log(result.qualityScore);    // 0.95
console.log(result.provider);        // "openai"
```

##### `batchTranslate(requests)`

批量翻译。

```typescript
async batchTranslate(
  requests: TranslationRequest[]
): Promise<TranslationResponse[]>
```

##### `autoDetect()`

自动检测可用的 AI 提供者。

```typescript
async autoDetect(): Promise<AIProviderInfo[]>
```

### OpenAIProvider

OpenAI GPT 翻译提供者。

```typescript
import { OpenAIProvider } from '@yyc3/i18n-core';

const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',  // 或 'gpt-3.5-turbo'
});

ai.register(openai);
```

### OllamaProvider

Ollama 本地模型翻译提供者。

```typescript
import { OllamaProvider } from '@yyc3/i18n-core';

const ollama = new OllamaProvider({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:7b',  // 或其他支持中文的模型
});

ai.register(ollama);
```

### QualityEstimator

翻译质量评估器。

```typescript
import { QualityEstimator } from '@yyc3/i18n-core';

const qe = new QualityEstimator();

const result = qe.evaluate({
  sourceText: 'Hello World',
  translatedText: '你好世界',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
});

console.log(result.score);      // 0.92
console.log(result.issues);     // []
console.log(result.isReliable); // true
```

---

## 🔌 MCP 服务器 (MCP Server)

Model Context Protocol 服务器实现，用于 AI Agent 集成。

### MCPServer

MCP 服务器类。

```typescript
import { MCPServer } from '@yyc3/i18n-core';
import { StdioTransport } from '@yyc3/i18n-core';

const server = new MCPServer({
  name: 'i18n-tools',
  version: '2.1.0',
  transport: new StdioTransport(),
});
```

#### 方法

##### `start()`

启动服务器。

```typescript
async start(): Promise<void>
```

##### `registerTool(tool, handler)`

注册工具。

```typescript
registerTool(tool: MCPTool, handler: ToolHandler): void
```

**工具接口 `MCPTool`：**

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
```

### `registerI18nTools(server)`

注册内置 i18n 工具到 MCP 服务器。

```typescript
import { registerI18nTools } from '@yyc3/i18n-core';

registerI18nTools(server);

// 注册的工具包括：
// - translate_text: 文本翻译
// - detect_locale: 语言检测
// - list_locales: 列出支持的语言
// - get_translation: 获取翻译
// - validate_translation: 验证翻译质量
```

**完整示例：**

```typescript
import { MCPServer, registerI18nTools, StdioTransport } from '@yyc3/i18n-core';

const server = new MCPServer({
  name: 'yyc3-i18n-tools',
  version: '2.1.0',
  transport: new StdioTransport(),
});

registerI18nTools(server);

await server.start();
console.log('MCP Server started on stdio');
```

---

## 🛡️ 安全模块 (Security Modules)

企业级安全防护工具集。

### ReDoS 防护 (Safe Regex)

防止正则表达式拒绝服务攻击。

```typescript
import {
  compileSafeRegex,
  testSafeRegex,
  clearSafeRegexCache,
} from '@yyc3/i18n-core';
```

#### `compileSafeRegex(regex)`

安全编译正则表达式。

```typescript
function compileSafeRegex(regex: RegExp): SafeRegexCompileResult
```

**返回类型：**

```typescript
interface SafeRegexCompileResult {
  safe: boolean;           // 是否安全
  regex?: RegExp;          // 编译后的正则（仅安全时）
  reason?: SafeRegexRejectReason;  // 拒绝原因（仅不安全时）
}

type SafeRegexRejectReason =
  | 'nested_repetition'    // 嵌套重复
  | 'alternation_quantifier'  // 选择与量词组合
  | 'deep_nesting';        // 深度嵌套
```

**示例：**

```typescript
const result = compileSafeRegex(/^[a-z]+$/);
if (result.safe && result.regex) {
  result.regex.test('hello');  // true
}

const unsafe = compileSafeRegex(/^(a+)+$/);
console.log(unsafe.safe);     // false
console.log(unsafe.reason);   // 'nested_repetition'
```

#### `testSafeRegex(pattern)`

快速测试正则表达式模式（不编译）。

```typescript
function testSafeRegex(pattern: string): {
  safe: boolean;
  reason?: SafeRegexRejectReason;
}
```

### 时序攻击防护 (Secret Comparison)

常量时间字符串比较，防止时序攻击。

```typescript
import { safeEqualSecret } from '@yyc3/i18n-core';

safeEqualSecret('token123', 'token123');  // true
safeEqualSecret('token123', 'wrong');     // false
```

### 危险操作检测 (Dangerous Operations)

检测 SQL 注入、文件系统危险操作等。

```typescript
import {
  isDangerousOperation,
  DANGEROUS_OPERATION_NAMES,
  DANGEROUS_OPERATIONS_SET,
} from '@yyc3/i18n-core';

isDangerousOperation('DROP TABLE users');  // true
isDangerousOperation('SELECT * FROM users');  // false

console.log(DANGEROUS_OPERATION_NAMES);
// ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', ...]
```

---

## ⚡ 基础设施 (Infrastructure)

高可用性基础设施组件。

### 指数退避重试 (Exponential Backoff)

```typescript
import {
  computeBackoff,
  createRetryRunner,
  DEFAULT_BACKOFF_POLICY,
  sleepWithAbort,
} from '@yyc3/i18n-core';
```

#### `computeBackoff(attempt, policy?)`

计算退避延迟时间。

```typescript
function computeBackoff(
  attempt: number,
  policy?: BackoffPolicy
): number
```

**策略接口 `BackoffPolicy`：**

```typescript
interface BackoffPolicy {
  baseDelayMs?: number;    // 基础延迟（默认 1000ms）
  maxDelayMs?: number;     // 最大延迟（默认 30000ms）
  multiplier?: number;      // 乘数因子（默认 2）
  jitter?: boolean;        // 是否添加抖动（默认 true）
}
```

#### `createRetryRunner(fn, options?)`

创建带自动重试的运行器。

```typescript
async function createRetryRunner<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;       // 最大重试次数（默认 3）
    baseDelayMs?: number;      // 基础延迟
    maxDelayMs?: number;       // 最大延迟
    retryableErrorFilter?: (error: Error) => boolean;  // 可重试错误过滤
  }
): Promise<T>
```

**示例：**

```typescript
const result = await createRetryRunner(
  async () => fetchData(),
  {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  }
);
```

### 固定窗口限流 (Rate Limiting)

```typescript
import { createFixedWindowRateLimiter } from '@yyc3/i18n-core';

const limiter = createFixedWindowRateLimiter({
  windowMs: 60000,      // 时间窗口（毫秒）
  maxRequests: 100,     // 最大请求数
});

if (limiter.tryAcquire()) {
  // 请求允许通过
} else {
  // 触发限流
}

console.log(limiter.getStats());
// { remaining: 98, resetTime: Date, totalRequests: 2 }
```

### 安全随机数生成 (Secure Random)

密码学安全的随机数生成器。

```typescript
import {
  generateSecureUuid,
  generateSecureToken,
  generateSecureHex,
  generateSecureInt,
  generateSecureFraction,
} from '@yyc3/i18n-core';

generateSecureUuid();                    // "550e8400-e29b-41d4-a716-446655440000"
generateSecureToken(32);                // "xJ7cK9mN2pQ4rS6..." (32 字节)
generateSecureHex(16);                  // "a1b2c3d4e5f67890" (16 字符)
generateSecureInt(1, 100);              // 42 (1-100 范围内整数)
generateSecureFraction();               // 0.723456789 (0-1 浮点数)
```

### 结构化日志 (Logger)

```typescript
import {
  logger,
  createLogger,
  setLogLevel,
  getLogLevel,
} from '@yyc3/i18n-core';

// 设置日志级别
setLogLevel('debug');  // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'

// 使用全局 logger
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');

// 创建自定义 logger
const customLogger = createLogger({
  name: 'my-app',
  level: 'debug',
});
```

---

## 📝 类型定义 (Type Definitions)

### 核心类型

```typescript
type Locale =
  | 'en'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja'
  | 'ko'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt-BR'
  | 'ar';

type RTLLocale = Extract<Locale, 'ar'>;

type TextDirection = 'ltr' | 'rtl' | 'auto';

type HorizontalAlignment = 'left' | 'right';

type SpacingProperty =
  | 'marginLeft'
  | 'marginRight'
  | 'paddingLeft'
  | 'paddingRight';

type TranslationMap = {
  [key: string]: string | TranslationMap;
};
```

---

## 🔗 相关链接 (Related Links)

- [快速开始](./guide/getting-started.md) - 5 分钟上手指南
- [最佳实践](./guide/best-practices.md) - 生产环境建议
- [AI 翻译](./guide/ai-translation.md) - LLM 集成详细文档
- [MCP 协议](./guide/mcp-integration.md) - AI Agent 工具集成
- [GitHub Issues](https://github.com/YanYuCloudCube/yyc3-i18n-core/issues) - 问题反馈

---

<div align="center">

**📖 完整 API 文档持续更新中...**

[⬆️ 返回主页](../README.md) | [⬅️ 快速开始](./guide/getting-started.md) | [➡️ 最佳实践](./guide/best-practices.md)

</div>
