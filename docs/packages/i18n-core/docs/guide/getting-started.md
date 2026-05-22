# 🚀 快速开始 | Getting Started

> **5 分钟上手 @yyc3/i18n-core** - 从零到生产就绪的国际化方案

## 📋 前置要求 (Prerequisites)

| 要求 | 版本 | 说明 |
|------|------|------|
| **Node.js** | >= 16.0.0 | 推荐 LTS 版本 |
| **TypeScript** | >= 5.3 (可选) | 推荐使用以获得最佳体验 |
| **包管理器** | npm / yarn / pnpm | 推荐 pnpm |

## 📦 安装 (Installation)

### 使用 npm

```bash
npm install @yyc3/i18n-core
```

### 使用 yarn

```bash
yarn add @yyc3/i18n-core
```

### 使用 pnpm (推荐)

```bash
pnpm add @yyc3/i18n-core
```

## ⚡ 最小化配置 (Minimal Setup)

### 1️⃣ 创建 i18n 配置文件

```typescript
// src/i18n.ts
import { i18n, t } from '@yyc3/i18n-core';

// 初始化 i18n 引擎
await i18n.init({
  defaultLocale: 'zh-CN',    // 默认语言：简体中文
  fallbackLocale: 'en',      // 回退语言：英语
});

// 导出翻译函数供全局使用
export { t, i18n };
```

### 2️⃣ 在应用中使用

```typescript
// src/App.tsx
import { t } from './i18n';

function App() {
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.description')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### 3️⃣ 添加翻译资源

```typescript
// src/locales/zh-CN.ts
export const zhCN = {
  app: {
    title: '生产级国际化解决方案',
    description: '零依赖、高性能、AI 驱动的 i18n 框架',
  },
  common: {
    submit: '提交',
    cancel: '取消',
    save: '保存',
  },
};

// src/locales/en.ts
export const en = {
  app: {
    title: 'Production-Ready i18n Solution',
    description: 'Zero-dependency, high-performance, AI-powered i18n framework',
  },
  common: {
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
  },
};
```

## 🔧 高级配置 (Advanced Configuration)

### 完整配置选项

```typescript
await i18n.init({
  // === 基础设置 ===
  defaultLocale: 'zh-CN',        // 默认语言
  fallbackLocale: 'en',          // 回退语言

  // === 缓存配置 ===
  cache: {
    enabled: true,               // 启用缓存（默认 true）
    maxSize: 1000,              // 最大缓存条目数（默认 1000）
    ttl: 5 * 60 * 1000,         // 缓存过期时间（默认 5 分钟）
  },

  // === 错误处理 ===
  onError: (error, context) => {
    console.error('[i18n Error]', error.message);
    console.error('Key:', context.key, 'Locale:', context.locale);
  },

  missingKeyHandler: (key, locale) => {
    console.warn(`[i18n] Missing key: "${key}" in locale "${locale}"`);
    return `[MISSING:${key}]`;  // 返回占位符文本
  },

  // === 调试模式 ===
  debug: process.env.NODE_ENV === 'development',
});
```

### 命名空间管理 (Namespaces)

对于大型应用，推荐使用命名空间组织翻译：

```typescript
// 初始化时注册命名空间
i18n.registerTranslation('zh-CN', {
  home: {
    title: '首页',
    welcome: '欢迎回来，{{name}}！',
  },
  dashboard: {
    title: '控制面板',
    stats: '统计数据',
  },
  settings: {
    title: '设置',
    profile: '个人资料',
  },
});

// 使用命名空间翻译
const homeT = i18n.createNamespace('home');
homeT('title');           // "首页"
homeT('welcome', { name: '张三' });  // "欢迎回来，张三！"

const dashT = i18n.createNamespace('dashboard');
dashT('title');          // "控制面板"

// 批量翻译
const results = homeT.batchTranslate(['title', 'welcome']);
// { title: "首页", welcome: "欢迎回来，{{name}}！" }
```

## 🌐 语言切换 (Locale Switching)

### 动态切换语言

```typescript
import { setLocale, getLocale } from '@yyc3/i18n-core';

// 获取当前语言
const currentLocale = getLocale();  // 'zh-CN'

// 切换到英语
await setLocale('en');

// 切换到日语
await setLocale('ja');

// 监听语言变化
const unsubscribe = i18n.subscribe((newLocale) => {
  console.log(`Language changed to: ${newLocale}`);
  // 更新 UI 或执行其他操作
});

// 取消监听
unsubscribe();
```

### React 组件中的语言切换

```tsx
import { useState } from 'react';
import { useTranslation } from '@yyc3/i18n-core/react';

function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const languages = [
    { code: 'zh-CN', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
  ];

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
```

## 🎯 常用模式 (Common Patterns)

### 1. 插值 (Interpolation)

```typescript
// 简单变量替换
t('greeting', { name: '世界' });  // "你好，世界！"

// 多个变量
t('user.info', {
  name: '张三',
  age: 25,
  city: '北京',
});
// "用户：张三，年龄：25，城市：北京"
```

### 2. 复数规则 (Pluralization)

使用 ICU MessageFormat 语法：

```typescript
// 翻译资源
const messages = {
  itemCount: '{count, plural, =0 {没有项目} one {1 个项目} other {# 个项目}}',
};

// 使用
t('itemCount', { count: 0 });   // "没有项目"
t('itemCount', { count: 1 });   // "1 个项目"
t('itemCount', { count: 5 });   // "5 个项目"
```

### 3. 相对时间 (Relative Time)

```typescript
import { formatRelativeTime } from '@yyc3/i18n-core';

const now = Date.now();

formatRelativeTime(now - 3600000, 'zh-CN');  // "1 小时前"
formatRelativeTime(now - 86400000, 'zh-CN'); // "1 天前"
formatRelativeTime(now - 3600000, 'en');     // "1 hour ago"
```

### 4. 中文环境检测

```typescript
import { detectSystemLocale, isChineseLocale, normalizeLocale } from '@yyc3/i18n-core';

// 自动检测系统语言
const result = detectSystemLocale();
console.log(result.locale);   // 'zh-CN'
console.log(result.source);   // 'system' | 'storage' | 'env' | 'default'

// 检测是否为中文环境
isChineseLocale('zh-CN');     // true
isChineseLocale('zh-TW');     // true
isChineseLocale('en');        // false

// 规范化语言代码
normalizeLocale('zh_cn');     // 'zh-CN'
normalizeLocale('EN-US');     // 'en'
normalizeLocale('ZH_TW');     // 'zh-TW'
```

## 🔌 插件系统 (Plugin System)

### 启用内置插件

```typescript
import {
  createConsoleLogger,
  MissingKeyReporter,
  PerformanceTracker,
} from '@yyc3/i18n-core';

// 1. 控制台日志插件（开发调试）
i18n.plugins.register(createConsoleLogger({
  logTranslations: true,       // 记录每次翻译调用
  logLocaleChanges: true,      // 记录语言切换事件
  logMissingKeys: true,        // 记录缺失的翻译键
  logErrors: true,             // 记录错误信息
}));

// 2. 缺失键报告器（质量监控）
const reporter = new MissingKeyReporter({ maxEntries: 1000 });
i18n.plugins.register(reporter.createPlugin());

// 导出报告
console.log(reporter.generateReport());
console.log(reporter.exportJSON());

// 3. 性能追踪器（性能监控）
const tracker = new PerformanceTracker({
  slowThreshold: 10,           // 慢查询阈值（毫秒）
  maxSlowEntries: 50,          // 最大慢查询记录数
  samplingRate: 1,             // 采样率（1 = 全部记录）
});
i18n.plugins.register(tracker.createPlugin());

// 获取性能指标
console.log(tracker.getMetrics());
console.log(`Cache hit rate: ${tracker.getCacheHitRate()}%`);
```

## 🛡️ 安全特性 (Security Features)

### ReDoS 防护 (正则表达式安全编译)

```typescript
import { compileSafeRegex, testSafeRegex } from '@yyc3/i18n-core';

// 安全的正则表达式 - 正常编译
const safeResult = compileSafeRegex(/^[a-z]+$/);
console.log(safeResult.safe);   // true
console.log(safeResult.regex);  // /^[a-z]+$/

// 危险的正则表达式 - 拒绝编译并返回原因
const unsafeResult = compileSafeRegex(/^(a+)+$/);
console.log(unsafeResult.safe);     // false
console.log(unsafeResult.reason);   // 'nested_repetition'

// 快速测试（不编译）
testSafeRegex('(a+)+b');
// { safe: false, reason: 'nested_repetition' }
```

### 时序攻击防护 (Timing Attack Safe Comparison)

```typescript
import { safeEqualSecret } from '@yyc3/i18n-core';

// 常量时间字符串比较（防止时序攻击）
safeEqualSecret('my-secret-token', 'my-secret-token');  // true
safeEqualSecret('my-secret-token', 'wrong-token');        // false
```

## 🧪 测试 (Testing)

### 单元测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { i18n, t } from '@yyc3/i18n-core';

describe('I18n Translation', () => {
  beforeEach(async () => {
    await i18n.init({
      defaultLocale: 'zh-CN',
      fallbackLocale: 'en',
    });
  });

  it('should translate to Chinese', () => {
    expect(t('common.welcome')).toBe('欢迎');
  });

  it('should interpolate variables', () => {
    expect(t('greeting', { name: 'World' })).toBe('你好，World！');
  });

  it('should switch locale', async () => {
    await i18n.setLocale('en');
    expect(t('common.welcome')).toBe('Welcome');
  });
});
```

运行测试：

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监听模式（开发时使用）
pnpm test:watch
```

## 📚 下一步 (Next Steps)

现在你已经掌握了基础用法，接下来可以探索：

- [API 参考](../api/) - 完整的 API 文档
- [最佳实践](./best-practices.md) - 生产环境建议
- [AI 翻译集成](./ai-translation.md) - LLM 驱动的智能翻译
- [MCP 协议集成](./mcp-integration.md) - AI Agent 工具集成
- [React 集成指南](./react-integration.md) - React/Vue/Angular 集成

## ❓ 常见问题 (FAQ)

<details>
<summary><strong>Q: 如何处理缺失的翻译键？</strong></summary>

A: 有三种方式：
1. 配置 `missingKeyHandler` 返回占位符文本
2. 使用 `MissingKeyReporter` 插件收集缺失键
3. 启用 `debug` 模式在控制台看到警告

</details>

<details>
<summary><strong>Q: 支持哪些语言？</strong></summary>

A: 目前支持 10 种语言：
- 英语 (en)
- 简体中文 (zh-CN)
- 繁體中文 (zh-TW)
- 日本語 (ja)
- 한국어 (ko)
- Français (fr)
- Deutsch (de)
- Español (es)
- Português (pt-BR)
- العربية (ar) - 支持 RTL 布局

</details>

<details>
<summary><strong>Q: 包体积有多大？</strong></summary>

A: 
- Gzip 后约 ~15KB
- 零运行时依赖
- 支持 Tree-shaking，按需导入可进一步减小体积

</details>

<details>
<summary><strong>Q: 如何在生产环境中优化性能？</strong></summary>

A:
1. 启用 LRU 缓存（默认开启）
2. 使用命名空间减少加载的翻译数据
3. 批量翻译 API 减少函数调用开销
4. 使用 `PerformanceTracker` 监控和优化慢查询

</details>

---

## 📞 获取帮助 (Getting Help)

- 📖 **完整文档**: [i18.yyccube.com](https://i18.yyccube.com)
- 💬 **GitHub Issues**: [提交问题](https://github.com/YanYuCloudCube/yyc3-i18n-core/issues)
- 💬 **Discussions**: [社区讨论](https://github.com/YanYuCloudCube/yyc3-i18n-core/discussions)
- 📧 **Email**: team@yyc3.dev

---

<div align="center">

**🎉 恭喜！你已经完成了 @yyc3/i18n-core 的快速入门！**

**Congratulations! You've completed the quick start guide!**

[⬆️ 返回主页](../README.md) | [➡️ API 参考](../api/) | [📘 最佳实践](./best-practices.md)

</div>
