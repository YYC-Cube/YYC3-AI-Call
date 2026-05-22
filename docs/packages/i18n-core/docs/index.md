---
layout: home
hero:
  name: "@yyc3/i18n-core"
  text: 生产级国际化框架
  tagline: 零依赖 · AI-Powered · MCP Integration · 中文原生优化
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/YanYuCloudCube/yyc3-i18n-core

features:
  - title: 🌐 10 语言支持
    details: 中/英/日/韩/法/德/西/葡/阿拉伯，原生 RTL 布局支持
  - title: ⚡ 零依赖高性能
    details: Gzip ~15KB，LRU 缓存 <1ms 翻译调用，Tree-shaking 友好
  - title: 🤖 AI 翻译集成
    details: OpenAI/Ollama 支持，翻译质量评估，术语表和上下文感知
  - title: 🔌 MCP 协议原生
    details: Claude/Cursor/AI 工具集成，Model Context Protocol 完整实现
  - title: 🛡️ 企业级安全
    details: ReDoS 防护、时序攻击防护、路径遍历检测、OWASP L4 标准
  - title: 🔧 插件架构
    details: 生命周期钩子、内置日志/监控/性能追踪插件系统
  - title: 💯 TypeScript 100%
    details: 全量类型覆盖、严格模式、智能提示和编译时检查
  - title: 📊 ICU MessageFormat
    details: 复数规则、选择格式、序数词完整 Unicode ICU 规范支持
---

## ✨ 为什么选择 @yyc3/i18n-core？

在 2026 年的 i18n 市场中，@yyc3/i18n-core 提供了**独一无二的价值组合**：

### 🎯 核心优势对比

| 特性 | @yyc3/i18n-core | react-i18next | vue-i18n | typesafe-i18n |
|------|-----------------|---------------|----------|---------------|
| **依赖数量** | ✅ **0** | 3+ | 2+ | 0 |
| **包体积** | ✅ **~15KB** | ~33KB | ~1.5MB | ~1KB |
| **AI 翻译** | ✅ **内置** | ❌ 需插件 | ❌ 需插件 | ❌ 无 |
| **MCP 支持** | ✅ **内置** | ❌ 无 | ❌ 无 | ❌ 无 |
| **ICU MessageFormat** | ✅ **内置** | ⚠️ 需插件 | ⚠️ 基础 | ⚠️ 基础 |
| **RTL 支持** | ✅ **原生** | ⚠️ 需配置 | ⚠️ 需配置 | ❌ 无 |
| **安全防护** | ✅ **OWASP L4** | 基础 | 基础 | 无 |

### 🌟 独特卖点

#### 1. 唯一的全栈 AI + MCP i18n 方案

```typescript
import { AIProviderManager, MCPServer, registerI18nTools } from '@yyc3/i18n-core';

// AI 翻译（支持 OpenAI/Ollama）
const ai = new AIProviderManager();
await ai.translate({
  sourceText: 'Hello World',
  sourceLocale: 'en',
  targetLocale: 'zh-CN'
});

// MCP Server（Claude/Cursor/AI 工具原生集成）
const server = new MCPServer({ name: 'i18n-tools', version: '2.1.0' });
registerI18nTools(server);
```

#### 2. 企业级安全体系

- 🔒 ReDoS 防护（正则表达式拒绝服务攻击）
- ⏱️ 时序攻击防护（常量时间字符串比较）
- 🛡️ 路径遍历检测
- ⚠️ 危险操作识别（SQL 注入等）

#### 3. 中文生态深度优化

- 🇨🇳 简体中文 / 繁體中文 原生支持
- 🇯🇵 日本語 / 🇰🇷 한국어 完整翻译
- 🔄 自动语言检测
- 📝 ICU 复数规则（中文特殊处理）

## 🚀 快速上手

::: code-group

```bash [安装]
# npm
npm install @yyc3/i18n-core

# pnpm (推荐)
pnpm add @yyc3/i18n-core
```

```typescript [基础用法]
import { i18n, t } from '@yyc3/i18n-core';

// 初始化
await i18n.init({
  defaultLocale: 'zh-CN',
  fallbackLocale: 'en',
});

// 使用
t('common.welcome');           // "欢迎"
t('greeting', { name: '世界' }); // "你好，世界！"

// 切换语言
await i18n.setLocale('en');
t('common.welcome');           // "Welcome"
```

:::

## 📦 NPM 信息

[![npm version](https://img.shields.io/npm/v/@yyc3/i18n-core.svg)](https://www.npmjs.com/package/@yyc3/i18n-core)
[![npm downloads](https://img.shields.io/npm/dt/@yyc3/i18n-core.svg)](https://www.npmjs.com/package/@yyc3/i18n-core)
[![license](https://img.shields.io/npm/l/@yyc3/i18n-core.svg)](https://github.com/YanYuCloudCube/yyc3-i18n-core/blob/main/LICENSE)

**包名**: `@yyc3/i18n-core`
**版本**: v2.1.0
**许可证**: MIT

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](https://github.com/YanYuCloudCube/yyc3-i18n-core/blob/main/CONTRIBUTING.md) 了解详情。

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

Made with ❤️ by [YYC³ Team](https://github.com/YYC-Cube)

</div>
