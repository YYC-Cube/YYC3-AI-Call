# 🔄 迁移指南：从 react-i18next / vue-i18n 到 @yyc3/i18n-core

> **平滑迁移，零学习成本** - 本指南帮助你在 30 分钟内完成迁移

## 📋 目录

- [为什么迁移？](#为什么迁移)
- [快速对比](#快速对比)
- [React 项目迁移](#react-项目迁移)
- [Vue 项目迁移](#vue-项目迁移)
- [通用项目迁移](#通用项目迁移)
- [常见问题](#常见问题)

---

## 为什么迁移？

| 维度 | react-i18next / vue-i18n | @yyc3/i18n-core |
|------|--------------------------|------------------|
| **包体积** | 40KB+ | **~15KB** |
| **运行时依赖** | 3-5 个 | **0** |
| **中文支持** | 需手动配置 | **原生支持** |
| **安全防护** | 基础 | **OWASP Level 4** |
| **TypeScript** | 良好 | **100% 类型安全** |
| **插件系统** | 有限 | **完整架构** |
| **缓存策略** | 可选 | **内置 LRU** |

---

## 快速对比

### API 对照表

| 功能 | react-i18next | @yyc3/i18n-core |
|------|---------------|-----------------|
| **初始化** | `i18n.init({})` | `initI18n({})` |
| **翻译函数** | `t('key')` | `t('key')` ✅ 相同 |
| **带参数** | `t('key', { name: '值' })` | `t('key', { name: '值' })` ✅ 相同 |
| **切换语言** | `i18n.changeLanguage()` | `setLocale()` |
| **获取语言** | `i18n.language` | `getLocale()` |
| **添加翻译** | `addResourceBundle()` | `addTranslations()` |
| **插值** | `{{name}}` | `{name}` |
| **复数** | `one/other` | 内置 `pluralize()` |

---

## React 项目迁移

### 步骤 1：卸载旧依赖

```bash
# 移除 react-i18next
npm uninstall i18next react-i18next i18next-browser-languagedetector

# 安装 @yyc3/i18n-core
npm install @yyc3/i18n-core
```

### 步骤 2：替换初始化代码

#### Before (react-i18next)

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { welcome: 'Welcome' } },
      zh: { translation: { welcome: '欢迎' } },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

#### After (@yyc3/i18n-core)

```typescript
// i18n.ts
import { initI18n, addTranslations } from '@yyc3/i18n-core';
import type { TranslationMap } from '@yyc3/i18n-core';

const en: TranslationMap = {
  welcome: 'Welcome',
};

const zhCN: TranslationMap = {
  welcome: '欢迎',
};

export async function setupI18n() {
  await initI18n({
    defaultLocale: 'en',
    fallbackLocale: 'en',
  });

  addTranslations('en', en);
  addTranslations('zh-CN', zhCN);
}
```

### 步骤 3：更新组件

#### Before

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('zh')}>
        切换中文
      </button>
    </div>
  );
}
```

#### After

```tsx
import { t, setLocale, getLocale } from '@yyc3/i18n-core';

function MyComponent() {
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => setLocale('zh-CN')}>
        切换中文
      </button>
      <p>当前语言：{getLocale()}</p>
    </div>
  );
}
```

### 步骤 4：移除 I18nextProvider

```diff
- import { I18nextProvider } from 'react-i18next';
- import i18n from './i18n';
-
- function App() {
-   return (
-     <I18nextProvider i18n={i18n}>
-       <MyComponent />
-     </I18nextProvider>
-   );
- }

+ import './i18n'; // 直接导入执行初始化
+
+ function App() {
+   return <MyComponent />;
+ }
```

---

## Vue 项目迁移

### 步骤 1：卸载旧依赖

```bash
# 移除 vue-i18n
npm uninstall vue-i18n@9

# 安装 @yyc3/i18n-core
npm install @yyc3/i18n-core
```

### 步骤 2：替换初始化

#### Before (vue-i18n)

```typescript
// i18n.ts
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: { welcome: 'Welcome' },
    zh: { welcome: '欢迎' },
  },
});

export default i18n;
```

#### After (@yyc3/i18n-core)

```typescript
// i18n.ts
import { initI18n, addTranslations } from '@yyc3/i18n-core';
import type { TranslationMap } from '@yyc3/i18n-core';

const translations: Record<string, TranslationMap> = {
  en: { welcome: 'Welcome' },
  'zh-CN': { welcome: '欢迎' },
};

export async function setupI18n() {
  await initI18n({
    defaultLocale: 'en',
    fallbackLocale: 'en',
  });

  Object.entries(translations).forEach(([locale, messages]) => {
    addTranslations(locale as any, messages);
  });
}
```

### 步骤 3：创建 Vue Composable

```typescript
// composables/useI18n.ts
import { t, setLocale, getLocale, isChineseLocale } from '@yyc3/i18n-core';
import { ref, computed } from 'vue';

export function useI18n() {
  const locale = ref(getLocale());

  const switchLocale = async (newLocale: string) => {
    await setLocale(newLocale as any);
    locale.value = newLocale;
  };

  return {
    t,
    locale: computed(() => locale.value),
    switchLocale,
    isChinese: computed(() => isChineseLocale(locale.value)),
  };
}
```

### 步骤 4：更新组件

```vue
<template>
  <div>
    <h1>{{ t('welcome') }}</h1>
    <p>当前语言：{{ locale }}</p>
    <button @click="switchLocale('zh-CN')">切换中文</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

const { t, locale, switchLocale } = useI18n();
</script>
```

---

## 通用项目迁移（Node.js / CLI）

### 简单场景

```typescript
// 之前：使用自定义方案或轻量库
const translations = {
  en: { hello: 'Hello' },
  zh: { hello: '你好' },
};
let currentLang = 'en';
function t(key: string) {
  return translations[currentLang]?.[key] || key;
}

// 之后：使用 @yyc3/i18n-core
import { initI18n, t, setLocale } from '@yyc3/i18n-core';

await initI18n({ defaultLocale: 'zh-CN' });
addTranslations('zh-CN', { hello: '你好' });
addTranslations('en', { hello: 'Hello' });

console.log(t('hello')); // "你好"
```

### 高级特性迁移

| 特性 | 实现方式 |
|------|----------|
| **懒加载翻译** | 内置 `loadLazyLocaleTranslation()` |
| **缓存控制** | 内置 LRU Cache (可配置 TTL) |
| **缺失键处理** | `MissingKeyReporter` 插件 |
| **性能监控** | `PerformanceTracker` 插件 |
| **调试日志** | `ConsoleLogger` 插件 |
| **安全防护** | 内置 ReDoS + 时序攻击防护 |

---

## 常见问题

### Q1: 翻译资源格式需要转换吗？

**A**: 基本不需要。只需将嵌套对象展平或保持结构化：

```typescript
// react-i18next 格式
{
  "nav": {
    "home": "首页",
    "about": "关于"
  }
}

// @yyc3/i18n-core 格式（完全兼容）
const nav = {
  home: '首页',
  about: '关于',
};

// 使用时
t('nav.home')  // → "首页"
```

### Q2: 复数形式怎么处理？

**A**: 使用内置的 `pluralize` 函数：

```typescript
import { pluralize } from '@yyc3/i18n-core';

// 中文
pluralize(1, '条消息', '条消息');  // → "1条消息"
pluralize(5, '条消息', '条消息');  // → "5条消息"

// 英文
pluralize(1, 'message', 'messages');  // → "message"
pluralize(5, 'message', 'messages');  // → "messages"
```

### Q3: 如何处理命名空间？

**A**: 使用对象结构模拟命名空间：

```typescript
const translations = {
  common: { save: '保存', cancel: '取消' },
  errors: { notFound: '未找到', unauthorized: '未授权' },
  dashboard: { title: '仪表盘' },
};

addTranslations('zh-CN', translations);

// 使用
t('common.save');       // → "保存"
t('errors.notFound');   // → "未找到"
t('dashboard.title');   // → "仪表盘"
```

### Q4: SSR / SSG 兼容吗？

**A**: 完全兼容！零依赖设计使其可在任何 JavaScript 环境运行：

- ✅ Vite / Webpack / Rollup
- ✅ Next.js / Nuxt / SvelteKit
- ✅ Node.js 服务端
- ✅ Cloudflare Workers / Edge Runtime
- ✅ Electron / Tauri 桌面应用

### Q5: 如何处理 RTL 语言？

**A**: 内置 RTL 工具函数：

```typescript
import { isRTL, getDirection, getAlignment } from '@yyc3/i18n-core';

isRTL('ar');           // → true
getDirection('ar');     // → 'rtl'
getAlignment('ar');     // → 'right'
```

---

## 🚀 迁移检查清单

- [ ] 卸载旧的 i18n 依赖
- [ ] 安装 `@yyc3/i18n-core`
- [ ] 转换翻译资源格式
- [ ] 更新初始化代码
- [ ] 替换组件中的 API 调用
- [ ] 移除 Provider 包装组件
- [ ] 测试语言切换功能
- [ ] 验证构建体积减小
- [ ] 配置缺失键报告插件（可选）
- [ ] 启用性能监控（生产环境推荐）

---

## 📞 需要帮助？

- **GitHub Issues**: https://github.com/YanYuCloudCube/yyc3-i18n-core/issues
- **中文文档**: [docs-ZN/README.md](../../docs-ZN/README.md)
- **示例项目**: [examples/vite-react-zh-cn/](./examples/vite-react-zh-cn/)

---

**迁移预计时间**: 小型项目 15-30 分钟 | 中型项目 1-2 小时 | 大型项目 1 天

**风险等级**: 低 - API 设计兼容，可渐进式迁移
