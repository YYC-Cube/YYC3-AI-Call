# 🌐 YYC³ i18n-core 中文示例项目

> **5分钟体验 @yyc3/i18n-core 的中文国际化能力**

## ✨ 特性展示

- 🇨🇳 原生简体中文/English 双语切换
- 🔧 完整的 React + TypeScript + Vite 配置
- 📦 零依赖 i18n 解决方案
- 💎 完整类型支持
- ⚡ LRU 缓存性能优化

## 🚀 快速开始

```bash
# 进入示例目录
cd packages/i18n-core/examples/vite-react-zh-cn

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看效果

## 📁 项目结构

```
vite-react-zh-cn/
├── src/
│   ├── main.tsx          # 应用入口
│   ├── App.tsx           # 主组件（演示翻译用法）
│   ├── i18n.ts           # i18n 初始化配置
│   └── index.css         # 样式文件
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── vite.config.ts        # Vite 配置
└── tsconfig.json         # TypeScript 配置
```

## 🎯 核心代码示例

### 1. 初始化 i18n (src/i18n.ts)

```typescript
import { initI18n, addTranslations } from '@yyc3/i18n-core';

await initI18n({
  defaultLocale: 'zh-CN',
  fallbackLocale: 'en',
});

addTranslations('zh-CN', zhCN);
addTranslations('en', en);
```

### 2. 使用翻译 (src/App.tsx)

```typescript
import { t, setLocale, isChineseLocale } from '@yyc3/i18n-core';

// 基础翻译
t('hero.title')  // → "生产级国际化解决方案"

// 带参数翻译
t('demo.greeting', { name: '开发者' })  // → "你好，开发者！欢迎使用..."

// 语言切换
setLocale('en');

// 中文检测
isChineseLocale('zh-CN')  // → true
```

## 🔧 自定义翻译资源

在 `src/i18n.ts` 中修改 `zhCN` 和 `en` 对象即可添加自定义翻译：

```typescript
const zhCN: TranslationMap = {
  your: {
    custom: {
      key: '你的翻译文本',
    },
  },
};
```

## 📊 对比其他方案

| 特性 | @yyc3/i18n-core | react-i18next | vue-i18n |
|------|-----------------|---------------|----------|
| 包体积 | ~15KB | ~40KB | ~30KB |
| 依赖数 | 0 | 3+ | 2+ |
| 中文原生 | ✅ | ⚠️ 需配置 | ⚠️ 需配置 |
| TypeScript | 100% | 95% | 90% |
| 安全防护 | OWASP L4 | 基础 | 基础 |

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 License

MIT © YYC³ Team
