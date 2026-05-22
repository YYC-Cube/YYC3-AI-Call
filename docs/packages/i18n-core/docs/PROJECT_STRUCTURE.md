# @yyc3/i18n-core 项目文件树与功能标注

> **版本**: 2.0.1 | **生成时间**: 2026-04-15  
> **测试覆盖**: 321 tests / 73.78% statements / 84.32% functions

---

## 📂 项目根目录结构

```
packages/i18n-core/
│
├── .github/workflows/ci.yml          # CI/CD 配置
├── docs/.i18n/glossary.zh-CN.json    # 翻译术语表
├── examples/basic-usage.ts           # 使用示例代码
├── scripts/                          # 工具脚本 (3个)
├── src/                              # 源代码主目录
├── test-helpers/                     # 测试辅助工具
├── package.json                      # 包配置
├── tsconfig.json                     # TypeScript 基础配置
├── tsconfig.build.json               # TypeScript 构建配置
├── vitest.config.ts                  # 测试框架配置
├── CHANGELOG.md                      # 版本变更记录
├── CONTRIBUTING.md                   # 贡献指南
├── LICENSE                           # MIT 许可证
└── README.md                         # 项目文档
```

---

## 📁 源代码目录详解 (`src/`)

### 1️⃣ 入口文件

#### `src/index.ts` — 公共 API 导出入口
**职责**: 统一导出所有公共 API，提供清晰的模块分界

**导出分类**:
```
┌─ Core Engine ─────────────────────────────┐
│  I18nEngine, i18n, t                       │
│  类型: I18nEngineConfig                    │
└────────────────────────────────────────────┘

┌─ Cache System ────────────────────────────┐
│  LRUCache                                   │
│  类型: CacheConfig, CacheStats              │
└────────────────────────────────────────────┘

┌─ Plugin System ───────────────────────────┐
│  PluginManager                              │
│  类型: I18nPlugin, I18nContext              │
│                                            │
│  内置插件:                                  │
│  • createConsoleLogger()                    │
│  • MissingKeyReporter (class)               │
│  • PerformanceTracker (class)               │
└────────────────────────────────────────────┘

┌─ Formatter Utilities ─────────────────────┐
│  interpolate, pluralize, formatRelativeTime │
│  类型: TranslateParams                      │
└────────────────────────────────────────────┘

┌─ Locale Detection ────────────────────────┐
│  detectSystemLocale, normalizeLocale        │
│  isChineseLocale                            │
│  类型: LocaleDetectionResult                │
└────────────────────────────────────────────┘

┌─ Infrastructure (OpenClaw) ──────────────┐
│  • backoff: computeBackoff, createRetryRunner │
│  • rate-limit: createFixedWindowRateLimiter   │
│  • secure-random: generateSecureUuid/Token... │
└────────────────────────────────────────────┘

┌─ Security (OpenClaw) ────────────────────┐
│  • dangerous-operations: isDangerousOperation │
│  • safe-regex: compileSafeRegex, testSafeRegex │
│  • secret-equal: safeEqualSecret            │
└────────────────────────────────────────────┘

┌─ General Utilities (OpenClaw) ──────────┐
│  • format-time: formatTimeAgo, formatRelativeTimestamp │
│  • path-guards: isPathInside, normalizeWindowsPath     │
│  • json-file: loadJsonFile, saveJsonFile, deleteJsonFile │
└────────────────────────────────────────────┘
```

---

### 2️⃣ 核心库 (`src/lib/`)

#### `engine.ts` — I18nEngine 核心引擎
| 属性 | 说明 |
|------|------|
| **行数** | ~400 行 |
| **覆盖率** | 85.14% statements |
| **核心类** | `I18nEngine` |
| **主要功能** | 翻译初始化、语言切换、命名空间、批量翻译、调试模式、统计信息 |

**公共 API**:
```typescript
class I18nEngine {
  init(config: I18nEngineConfig): Promise<void>
  setLocale(locale: string): Promise<void>
  getLocale(): string
  t(key: string, params?: TranslateParams): string
  createNamespace(prefix: string): TranslationFunction
  batchTranslate(keys: string[]): Record<string, string>
  subscribe(callback: LocaleChangeCallback): () => void
  getStats(): EngineStats
  destroy(): void
}
```

**单例导出**: `i18n`, `t`

---

#### `cache.ts` — LRU 缓存系统
| 属性 | 说明 |
|------|------|
| **行数** | ~120 行 |
| **覆盖率** | 95.04% statements |
| **核心类** | `LRUCache<T>` |
| **主要功能** | 最近最少使用淘汰、TTL 过期、容量限制、命中率统计 |

**配置接口**:
```typescript
interface CacheConfig<T> {
  maxSize?: number;      // 最大条目数 (默认: 500)
  ttl?: number;          // 生存时间 ms (默认: 30min)
  onEviction?: (key: string, value: T) => void; // 淘汰回调
}
```

---

#### `plugins.ts` — 插件管理器
| 属性 | 说明 |
|------|------|
| **行数** | ~160 行 |
| **覆盖率** | 83.85% statements |
| **核心类** | `PluginManager` |
| **主要功能** | 插件注册/注销、生命周期管理、事件分发 |

**插件接口**:
```typescript
interface I18nPlugin {
  name: string;
  version?: string;
  init?(context: I18nContext): void | Promise<void>;
  beforeTranslate?(key: string): void;
  afterTranslate?(result: string, key: string): string | undefined;
  onMissingKey?(key: string, locale: string): void;
  onLocaleChange?(from: string, to: string): void;
  onError?(error: Error): void;
  destroy?(): void;
}
```

---

#### `formatter.ts` — 格式化工具集
| 属性 | 说明 |
|------|------|
| **行数** | ~50 行 |
| **覆盖率** | **100%** ✅ |
| **导出函数** | `interpolate`, `pluralize`, `formatRelativeTime` |

**功能详情**:
- `interpolate(template, params)` — `{{var}}` 占位符替换
- `pluralize(template, count)` — `(s)` 复数处理
- `formatRelativeTime(timestamp, locale)` — 相对时间格式化

---

#### `detector.ts` — 语言检测器
| 属性 | 说明 |
|------|------|
| **行数** | ~100 行 |
| **覆盖率** | 85.71% statements |
| **导出函数** | `detectSystemLocale`, `normalizeLocale`, `isChineseLocale` |

**检测优先级**: 环境变量 → localStorage → 浏览器语言 → 默认值

---

#### `rtl-utils.ts` — RTL 布局工具
| 属性 | 说明 |
|------|------|
| **行数** | ~170 行 |
| **覆盖率** | 95.78% statements |
| **主要功能** | RTL 文本方向判断、CSS 类转换、布局镜像创建 |

**支持的语言**: 阿拉伯语(`ar`)、希伯来语(`he`)、波斯语(`fa`)等

---

#### `local-storage.ts` — 存储抽象层
| 属性 | 说明 |
|------|------|
| **行数** | ~20 行 |
| **覆盖率** | **100%** ✅ |
| **主要功能** | 浏览器 localStorage 封装、SSR 安全访问 |

---

#### `translate.ts` — 翻译解析逻辑
| 属性 | 说明 |
|------|------|
| **行数** | ~140 行 |
| **覆盖率** | 80.13% statements |
| **主要功能** | 嵌套键解析、回退链处理、缺失键处理 |

---

#### `registry.ts` — 翻译注册表
| 属性 | 说明 |
|------|------|
| **行数** | ~100 行 |
| **覆盖率** | 92.92% statements |
| **主要功能** | 语言包注册、合并、查询 |

---

#### `i18n-audit.ts` — 审计日志系统
| 属性 | 说明 |
|------|------|
| **行数** | ~100 行 |
| **覆盖率** | 97.97% statements |
| **导出** | `i18nAudit` (singleton), `createAuditedT()` |

**功能**: 记录所有翻译调用、生成审计报告、包装翻译函数

---

#### `lit-controller.ts` — Lit 控制器集成
| 属性 | 说明 |
|------|------|
| **行数** | ~25 行 |
| **覆盖率** | 95.45% statements |
| **核心类** | `I18nController` implements ReactiveController |

**用途**: Lit Web Components 的响应式 i18n 更新

---

### 3️⃣ 基础设施模块 (`src/lib/infra/`)

#### `backoff.ts` — 指数退避算法
| 属性 | 说明 |
|------|------|
| **行数** | ~70 行 |
| **覆盖率** | 94.28% statements |
| **依赖** | 无 (纯 Node.js) |

**导出 API**:
```typescript
function computeBackoff(attempt: number, policy?: BackoffPolicy): number
function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void>
function createRetryRunner<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>

const DEFAULT_BACKOFF_POLICY: BackoffPolicy = {
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 2,
  jitter: true,
};
```

**特性**: 全抖动(Full Jitter)、可配置重试次数、AbortController 支持

---

#### `rate-limit.ts` — 固定窗口限流器
| 属性 | 说明 |
|------|------|
| **行数** | ~60 行 |
| **覆盖率** | **100%** ✅ |
| **依赖** | 无 |

**导出 API**:
```typescript
function createFixedWindowRateLimiter(config?: RateLimitConfig): FixedWindowRateLimiter

interface FixedWindowRateLimiter {
  tryAcquire(): boolean;
  getStats(): { remaining: number; resetTime: Date };
}
```

**用例**: API 调用频率控制、批量操作节流

---

#### `secure-random.ts` — 安全随机数生成
| 属性 | 说明 |
|------|------|
| **行数** | ~80 行 |
| **覆盖率** | **100%** ✅ |
| **依赖** | Node.js `crypto` 模块 |

**导出 API**:
```typescript
function generateSecureUuid(): string       // UUID v4 格式
function generateSecureToken(bytes?: number): string  // URL-safe Base64
function generateSecureHex(length?: number): string    // 十六进制字符串
function generateSecureFraction(): number             // [0, 1) 浮点数
function generateSecureInt(min: number, max: number): number  // 整数范围
```

**安全特性**: 使用 `crypto.randomBytes`，密码学安全

---

### 4️⃣ 安全模块 (`src/lib/security/`)

#### `dangerous-operations.ts` — 危险操作检测
| 属性 | 说明 |
|------|------|
| **行数** | ~80 行 |
| **覆盖率** | **100%** ✅ |
| **依赖** | 无 |

**导出 API**:
```typescript
function isDangerousOperation(input: string): boolean
function getDangerousOperations(): DangerousOperation[]
const DANGEROUS_OPERATION_NAMES: readonly string[]
const DANGEROUS_OPERATIONS_SET: ReadonlySet<string>
```

**检测类型**: SQL DDL (DROP/DELETE/TRUNCATE)、文件系统 (RM/RMDIR)、进程 (KILL/EXEC)

---

#### `safe-regex.ts` — ReDoS 安全正则编译
| 属性 | 说明 |
|------|------|
| **行数** | ~110 行 |
| **覆盖率** | **100%** ✅ |
| **依赖** | 无 |

**导出 API**:
```typescript
function compileSafeRegex(regex: RegExp): SafeRegexCompileResult
function testSafeRegex(pattern: string): SafeRegexCompileResult
function clearSafeRegexCache(): void

interface SafeRegexCompileResult {
  safe: boolean;
  regex?: RegExp;
  reason?: SafeRegexRejectReason; // 'nested_repetition' | 'alternation_with_quantifier' | ...
}
```

**防护能力**: 嵌套量词 `(a+)+`、深度嵌套 >3、交替量词 `(a|b+)+`

---

#### `secret-equal.ts` — 时序攻击安全比较
| 属性 | 说明 |
|------|------|
| **行数** | ~40 行 |
| **覆盖率** | **100%** ✅ |
| **依赖** | Node.js `crypto.timingSafeEqual` |

**导出 API**:
```typescript
function safeEqualSecret(a: string, b: string): boolean
```

**安全机制**: 常量时间比较、长度优先检查

---

### 5️⃣ 工具模块 (`src/lib/utils/`)

#### `format-time.ts` — 时间格式化
| 属性 | 说明 |
|------|------|
| **行数** | ~90 行 |
| **覆盖率** | 97.59% statements |
| **依赖** | 无 |

**导出 API**:
```typescript
function formatTimeAgo(timestamp: number, options?: FormatTimeAgoOptions): string
function formatRelativeTimestamp(timestamp: number, locale?: string, options?: FormatRelativeTimestampOptions): string
```

**支持单位**: 秒/分钟/小时/天/周/月/年，多语言输出

---

#### `path-guards.ts` — 路径遍历防护
| 属性 | 说明 |
|------|------|
| **行数** | ~55 行 |
| **覆盖率** | 89.36% statements |
| **依赖** | 无 |

**导出 API**:
```typescript
function isPathInside(parent: string, child: string): boolean
function normalizeWindowsPathForComparison(path: string): string
function isNodeError(error: unknown): error is NodeJS.ErrnoException
function hasNodeErrorCode(error: unknown, code: string): boolean
function isNotFoundPathError(error: unknown): boolean
function isSymlinkOpenError(error: unknown): boolean
```

**防护场景**: 目录逃逸检测、符号链接攻击、路径规范化

---

#### `json-file.ts` — JSON 文件原子操作
| 属性 | 说明 |
|------|------|
| **行数** | ~110 行 |
| **覆盖率** | 90.69% statements |
| **依赖** | Node.js `fs`, `path` 模块 |

**导出 API**:
```typescript
async function loadJsonFile<T>(path: string, schema?: ZodSchema<T>): Promise<T>
async function saveJsonFile<T>(path: string, data: T, options?: SaveJsonOptions): Promise<void>
async function jsonFileExists(path: string): Promise<boolean>
async function deleteJsonFile(path: string): Promise<void>
```

**安全特性**: 原子写入(临时文件+重命名)、权限控制(默认 0o600)、自动备份

---

### 6️⃣ 插件实现 (`src/lib/plugins/`)

#### `console-logger.ts` — 控制台日志插件
| 属性 | 说明 |
|------|------|
| **行数** | ~100 行 |
| **覆盖率** | 94.94% statements |
| **工厂函数** | `createConsoleLogger(options?)` |

**功能**: 彩色输出翻译日志、语言切换通知、缺失键警告、错误追踪

---

#### `missing-key-reporter.ts` — 缺失键报告插件
| 属性 | 说明 |
|------|------|
| **行数** | ~170 行 |
| **覆盖率** | 92.16% statements |
| **核心类** | `MissingKeyReporter` |

**功能**: 追踪唯一缺失键、按频次排序、生成报告、JSON 导出、按语言筛选

---

#### `performance-tracker.ts` — 性能监控插件
| 属性 | 说明 |
|------|------|
| **行数** | ~200 行 |
| **覆盖率** | 97.97% statements |
| **核心类** | `PerformanceTracker` |

**功能**: P50/P95/P99 分位数计算、缓存命中率、慢查询列表、采样率控制

---

#### `index.ts` — 插件统一导出
| 属性 | 说明 |
|------|------|
| **行数** | ~13 行 |
| **覆盖率** | 0% (纯导出文件) |

**导出**: 所有内置插件的工厂函数和类

---

### 7️⃣ 语言包 (`src/locales/`)

| 文件 | 语言 | 方向 | 覆盖率 |
|------|------|------|--------|
| `en.ts` | English | LTR | 100% ✅ |
| `zh-CN.ts` | 简体中文 | LTR | 100% ✅ |
| `zh-TW.ts` | 繁體中文 | LTR | 100% ✅ |
| `ja.ts` | 日本語 | LTR | 100% ✅ |
| `ko.ts` | 한국어 | LTR | 100% ✅ |
| `fr.ts` | Français | LTR | 100% ✅ |
| `de.ts` | Deutsch | LTR | 100% ✅ |
| `es.ts` | Español | LTR | 100% ✅ |
| `pt-BR.ts` | Português | LTR | 100% ✅ |
| `ar.ts` | العربية | **RTL** | 100% ✅ |

**总计**: 10 个语言包，全部 100% 覆盖

---

## 🧪 测试目录详解 (`src/test/`)

### 测试文件清单

```
src/test/
├── infra/
│   ├── backoff.test.ts              # 17 tests - 退避算法
│   ├── rate-limit.test.ts           # 8 tests - 限流器
│   └── secure-random.test.ts        # 11 tests - 安全随机
│
├── security/
│   ├── dangerous-operations.test.ts # 7 tests - 危险操作检测
│   ├── safe-regex.test.ts           # ReDoS 防护
│   └── secret-equal.test.ts         # 7 tests - 时序攻击
│
├── utils/
│   ├── format-time.test.ts          # 时间格式化
│   ├── json-file.test.ts            # JSON 文件操作
│   └── path-guards.test.ts          # 路径防护
│
├── detector.test.ts                 # 语言检测
├── engine-v2.test.ts                # 34 tests - 核心引擎
├── formatter.test.ts                # 格式化工具
├── i18n-audit.test.ts               # 审计系统
├── lit-controller.test.ts           # Lit 控制器
├── local-storage.test.ts            # 存储层
├── performance-tracker.test.ts      # 23 tests - 性能监控
├── plugins.test.ts                  # 24 tests - 插件系统
├── rtl-utils.test.ts                # RTL 工具
├── translate.test.ts                # 8 tests - 翻译逻辑
└── translate-full.test.ts           # 完整翻译流程
```

**总计**: 20 个测试文件，321 个测试用例，100% 通过率

---

## 🔧 脚本目录 (`scripts/`)

| 脚本 | 功能 | 用法 |
|------|------|------|
| `i18n-coverage-report.ts` | 生成国际化覆盖率报告 | `npx tsx scripts/i18n-coverage-report.ts` |
| `i18n-key-extractor.ts` | 提取并检查所有 i18n 键 | `npx tsx scripts/i18n-key-extractor.ts` |
| `rtl-validation.ts` | 验证 RTL 语言支持完整性 | `npx tsx scripts/rtl-validation.ts` |

---

## 📊 模块覆盖率矩阵

| 模块 | Statements | Branches | Functions | Lines | Status |
|------|-----------|----------|-----------|-------|--------|
| **security/** | **100%** | 95% | **100%** | **100%** | ✅ Perfect |
| **locales/** | **100%** | **100%** | **100%** | **100%** | ✅ Perfect |
| formatter.ts | **100%** | **100%** | **100%** | **100%** | ✅ Perfect |
| local-storage.ts | **100%** | **100%** | **100%** | **100%** | ✅ Perfect |
| rate-limit.ts | **100%** | **100%** | **100%** | **100%** | ✅ Perfect |
| secure-random.ts | **100%** | **100%** | **100%** | **100%** | ✅ Perfect |
| dangerous-operations.ts | **100%** | **100%** | **100%** | **100%** | ✅ Perfect |
| secret-equal.ts | **100%** | **100%** | **100%** | **100%** | ✅ Perfect |
| i18n-audit.ts | 97.97% | 94.73% | **100%** | 97.97% | ✅ Excellent |
| performance-tracker.ts | 97.97% | 91.66% | **100%** | 97.97% | ✅ Excellent |
| format-time.ts | 97.59% | 95.74% | **100%** | 97.59% | ✅ Excellent |
| infra/** (avg) | 97.16% | 90.9% | **100%** | 97.16% | ✅ Excellent |
| registry.ts | 92.92% | 55.55% | 33.33% | 92.92% | ⚠️ Good |
| rtl-utils.ts | 95.78% | 96.77% | **100%** | 95.78% | ✅ Excellent |
| utils/** (avg) | 93.64% | 93.15% | **100%** | 93.64% | ✅ Excellent |
| plugins/** (avg) | 92.64% | 89.18% | 91.17% | 92.64% | ✅ Excellent |
| console-logger.ts | 94.94% | 90% | **100%** | 94.94% | ✅ Excellent |
| missing-key-reporter.ts | 92.16% | 88.88% | 86.66% | 92.16% | ✅ Excellent |
| lib/** (core avg) | 88.88% | 79.58% | 83.8% | 88.88% | ✅ Good |
| cache.ts | 95.04% | **100%** | 70% | 95.04% | ✅ Good |
| engine.ts | 85.14% | 67.1% | 85.71% | 85.14% | ⚠️ Good |
| detector.ts | 85.71% | 65.51% | **100%** | 85.71 | ⚠️ Good |
| translate.ts | 80.13% | 71.79% | **100%** | 80.13 | ⚠️ Good |
| plugins.ts | 83.85% | 73.07% | 83.33% | 83.85 | ⚠️ Good |
| json-file.ts | 90.69% | 83.33% | **100%** | 90.69 | ✅ Good |
| path-guards.ts | 89.36% | 92.85% | **100%** | 89.36 | ✅ Good |
| lit-controller.ts | 95.45% | **100%** | **100%** | 95.45 | ✅ Excellent |
| backoff.ts | 94.28% | 84.21% | **100%** | 94.28 | ✅ Good |
| **Overall** | **73.78%** | **84.13%** | **84.32%** | **73.78%** | ✅ Healthy |

---

## 🎯 关键设计决策

### 1. 零外部依赖策略
```
运行时依赖: 0 个 ✓
开发依赖: 仅 TypeScript + Vitest + ESLint + Prettier
```
**理由**: 减少攻击面、简化部署、提高可靠性

### 2. ESM-only 导出
```json
{
  "type": "module",
  "exports": { ".": { "import": "./dist/index.js" } }
}
```
**理由**: Tree-shaking 优化、原生浏览器支持、未来兼容性

### 3. TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```
**理由**: 类型安全、减少运行时错误、更好的 IDE 支持

### 4. 插件架构模式
```
Lifecycle Hooks: init → beforeTranslate → afterTranslate → destroy
Event Types: onLocaleChange, onMissingKey, onError
```
**理由**: 开闭原则、功能解耦、可扩展性

---

## 📈 适用环境总结

| 环境 | 支持情况 | 备注 |
|------|---------|------|
| **Node.js** | ≥16.0.0 ✅ | 主要目标环境 |
| **Browser** | ES2020+ ✅ | 通过 bundler 使用 |
| **TypeScript** | ≥5.3 推荐 | strict mode |
| **React** | ✅ | 通过 hooks 集成 |
| **Vue** | ✅ | 通过 composables 集成 |
| **Angular** | ✅ | 通过 services 集成 |
| **Lit** | ✅ | 原生 I18nController |
| **Next.js** | ✅ | SSR 支持 (计划中) |
| **Nuxt** | ✅ | SSR 支持 (计划中) |

---

*文档由 YYC³ Team 维持更新 | 最后更新: 2026-04-15*
