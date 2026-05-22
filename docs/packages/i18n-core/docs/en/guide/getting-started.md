# 🚀 Quick Start

> **Get started with @yyc3/i18n-core in 5 minutes** - From zero to production-ready i18n solution

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | >= 16.0.0 | LTS version recommended |
| **TypeScript** | >= 5.3 (optional) | Recommended for best experience |
| **Package Manager** | npm / yarn / pnpm | pnpm recommended |

## Installation

### Using npm

```bash
npm install @yyc3/i18n-core
```

### Using yarn

```bash
yarn add @yyc3/i18n-core
```

### Using pnpm (Recommended)

```bash
pnpm add @yyc3/i18n-core
```

## Minimal Setup

### 1️⃣ Create i18n configuration file

```typescript
// src/i18n.ts
import { i18n, t } from '@yyc3/i18n-core';

// Initialize the i18n engine
await i18n.init({
  defaultLocale: 'en',           // Default language: English
  fallbackLocale: 'en',          // Fallback language: English
});

// Export translation functions for global use
export { t, i18n };
```

### 2️⃣ Use in your application

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

### 3️⃣ Add translation resources

```typescript
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
```

## Advanced Configuration

### Complete Configuration Options

```typescript
await i18n.init({
  // === Basic Settings ===
  defaultLocale: 'en',            // Default locale
  fallbackLocale: 'en',           // Fallback locale

  // === Cache Configuration ===
  cache: {
    enabled: true,                // Enable cache (default true)
    maxSize: 1000,                // Max cache entries (default 1000)
    ttl: 5 * 60 * 1000,          // Cache TTL in ms (default 5 minutes)
  },

  // === Error Handling ===
  onError: (error, context) => {
    console.error('[i18n Error]', error.message);
    console.error('Key:', context.key, 'Locale:', context.locale);
  },

  missingKeyHandler: (key, locale) => {
    console.warn(`[i18n] Missing key: "${key}" in locale "${locale}"`);
    return `[MISSING:${key}]`;   // Return placeholder text
  },

  // === Debug Mode ===
  debug: process.env.NODE_ENV === 'development',
});
```

### Namespace Management

For large applications, we recommend using namespaces to organize translations:

```typescript
// Register namespace translations during initialization
i18n.registerTranslation('en', {
  home: {
    title: 'Home',
    welcome: 'Welcome back, {{name}}!',
  },
  dashboard: {
    title: 'Dashboard',
    stats: 'Statistics',
  },
  settings: {
    title: 'Settings',
    profile: 'Profile',
  },
});

// Use namespace translations
const homeT = i18n.createNamespace('home');
homeT('title');                    // "Home"
homeT('welcome', { name: 'John' }); // "Welcome back, John!"

const dashT = i18n.createNamespace('dashboard');
dashT('title');                   // "Dashboard"

// Batch translate multiple keys
const results = homeT.batchTranslate(['title', 'welcome']);
// { title: "Home", welcome: "Welcome back, {{name}}!" }
```

## Locale Switching

### Dynamic Locale Switching

```typescript
import { setLocale, getLocale } from '@yyc3/i18n-core';

// Get current locale
const currentLocale = getLocale();  // 'en'

// Switch to Chinese
await setLocale('zh-CN');

// Switch to Japanese
await setLocale('ja');

// Listen for locale changes
const unsubscribe = i18n.subscribe((newLocale) => {
  console.log(`Language changed to: ${newLocale}`);
  // Update UI or perform other actions
});

// Unsubscribe
unsubscribe();
```

### Language Switcher Component (React)

```tsx
import { useState } from 'react';
import { useTranslation } from '@yyc3/i18n-core/react';

function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '中文' },
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

## Common Patterns

### 1. Interpolation

```typescript
// Simple variable replacement
t('greeting', { name: 'World' });  // "Hello, World!"

// Multiple variables
t('user.info', {
  name: 'John Doe',
  age: '25',
  city: 'New York',
});
// "User: John Doe, Age: 25, City: New York"
```

### 2. Pluralization

Using ICU MessageFormat syntax:

```typescript
// Translation resource
const messages = {
  itemCount: '{count, plural, =0 {No items} one {1 item} other {# items}}',
};

// Usage
t('itemCount', { count: 0 });   // "No items"
t('itemCount', { count: 1 });   // "1 item"
t('itemCount', { count: 5 });   // "5 items"
```

### 3. Relative Time

```typescript
import { formatRelativeTime } from '@yyc3/i18n-core';

const now = Date.now();

formatRelativeTime(now - 3600000, 'en');     // "1 hour ago"
formatRelativeTime(now - 86400000, 'en');    // "1 day ago"
formatRelativeTime(now - 3600000, 'zh-CN');  // "1 小时前"
```

### 4. Locale Detection

```typescript
import { detectSystemLocale, isChineseLocale, normalizeLocale } from '@yyc3/i18n-core';

// Auto-detect system locale
const result = detectSystemLocale();
console.log(result.locale);   // 'en'
console.log(result.source);   // 'system' | 'storage' | 'env' | 'default'

// Check if Chinese environment
isChineseLocale('zh-CN');     // true
isChineseLocale('en');        // false

// Normalize locale codes
normalizeLocale('EN-US');     // 'en'
normalizeLocale('ZH_TW');     // 'zh-TW'
```

## Plugin System

### Enable Built-in Plugins

```typescript
import {
  createConsoleLogger,
  MissingKeyReporter,
  PerformanceTracker,
} from '@yyc3/i18n-core';

// 1. Console Logger plugin (for development debugging)
i18n.plugins.register(createConsoleLogger({
  logTranslations: true,       // Log each translation call
  logLocaleChanges: true,      // Log locale switch events
  logMissingKeys: true,        // Log missing keys
  logErrors: true,             // Log error events
}));

// 2. Missing Key Reporter (for quality monitoring)
const reporter = new MissingKeyReporter({ maxEntries: 1000 });
i18n.plugins.register(reporter.createPlugin());

// Export reports
console.log(reporter.generateReport());
console.log(reporter.exportJSON());

// 3. Performance Tracker (for performance monitoring)
const tracker = new PerformanceTracker({
  slowThreshold: 10,           // Slow query threshold (ms)
  maxSlowEntries: 50,          // Max slow query records
  samplingRate: 1,             // Sampling rate (1 = track all)
});
i18n.plugins.register(tracker.createPlugin());

// Get performance metrics
console.log(tracker.getMetrics());
console.log(`Cache hit rate: ${tracker.getCacheHitRate()}%`);
```

## Security Features

### ReDoS Protection (Safe Regex Compilation)

```typescript
import { compileSafeRegex, testSafeRegex } from '@yyc3/i18n-core';

// Safe regex - compiles normally
const safeResult = compileSafeRegex(/^[a-z]+$/);
console.log(safeResult.safe);   // true
console.log(safeResult.regex);  // /^[a-z]+$/

// Dangerous regex - rejects with reason
const unsafeResult = compileSafeRegex(/^(a+)+$/);
console.log(unsafeResult.safe);     // false
console.log(unsafeResult.reason);   // 'nested_repetition'

// Quick test without compiling
testSafeRegex('(a+)+b');
// { safe: false, reason: 'nested_repetition' }
```

### Timing Attack Safe Comparison

```typescript
import { safeEqualSecret } from '@yyc3/i18n-core';

// Constant-time string comparison (prevents timing attacks)
safeEqualSecret('my-secret-token', 'my-secret-token');  // true
safeEqualSecret('my-secret-token', 'wrong-token');        // false
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { i18n, t } from '@yyc3/i18n-core';

describe('I18n Translation', () => {
  beforeEach(async () => {
    await i18n.init({
      defaultLocale: 'en',
      fallbackLocale: 'en',
    });
  });

  it('should translate to English', () => {
    expect(t('common.welcome')).toBe('Welcome');
  });

  it('should interpolate variables', () => {
    expect(t('greeting', { name: 'World' })).toBe('Hello, World!');
  });

  it('should switch locale', async () => {
    await i18n.setLocale('zh-CN');
    expect(t('common.welcome')).toBe('欢迎');
  });
});
```

Run tests:

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Watch mode (for development)
pnpm test:watch
```

## Next Steps

Now that you've mastered the basics, you can explore:

- [API Reference](../api/) - Complete API documentation
- [Best Practices](./best-practices.md) - Production recommendations
- [AI Translation Integration](./ai-translation.md) - LLM-powered smart translation
- [MCP Protocol Integration](./mcp-integration.md) - AI Agent tool integration
- [React Integration Guide](./react-integration.md) - React/Vue/Angular integration

## FAQ

<details>
<summary><strong>Q: How to handle missing translation keys?</strong></summary>

A: There are three approaches:
1. Configure `missingKeyHandler` to return placeholder text
2. Use `MissingKeyReporter` plugin to collect missing keys
3. Enable `debug` mode to see warnings in console

</details>

<details>
<summary><strong>Q: Which languages are supported?</strong></summary>

A: Currently supports 10 languages:
- English (en)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- Japanese (ja)
- Korean (ko)
- French (fr)
- German (de)
- Spanish (es)
- Portuguese (pt-BR)
- Arabic (ar) - Supports RTL layout

</details>

<details>
<summary><strong>Q: What is the bundle size?</strong></summary>

A:
- ~15KB gzipped
- Zero runtime dependencies
- Supports Tree-shaking, can be further reduced by importing only needed modules

</details>

<details>
<summary><strong>Q: How to optimize performance in production?</strong></summary>

A:
1. Enable LRU cache (enabled by default)
2. Use namespaces to reduce loaded translation data
3. Use batch translation API to reduce function call overhead
4. Use `PerformanceTracker` to monitor and optimize slow queries

</details>

---

## Getting Help

- 📖 **Full Documentation**: [i18.yyccube.com](https://i18.yyccube.com)
- 💬 **GitHub Issues**: [Report issues](https://github.com/YanYuCloudCube/yyc3-i18n-core/issues)
- 💬 **Discussions**: [Community discussions](https://github.com/YanYuCloudCube/yyc3-i18n-core/discussions)
- 📧 **Email**: team@yyc3.dev

---

<div align="center">

**🎉 Congratulations! You've completed the @yyc3/i18n-core quick start guide!**

[⬆️ Back to Home](../README.md) | [➡️ API Reference](../api/) | [📘 Best Practices](./best-practices.md)

</div>
