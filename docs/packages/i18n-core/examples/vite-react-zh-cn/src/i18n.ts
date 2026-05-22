/**
 * @yyc3/i18n-core 初始化配置
 * 演示中文国际化最佳实践
 */

import { initI18n, addTranslations } from '@yyc3/i18n-core';
import type { TranslationMap } from '@yyc3/i18n-core';

const zhCN: TranslationMap = {
  common: {
    appName: 'YYC³ 国际化框架',
    version: '版本 v2.0',
    loading: '加载中...',
    error: '出错了',
    success: '操作成功',
  },
  nav: {
    home: '首页',
    about: '关于',
    features: '功能特性',
    examples: '使用示例',
  },
  hero: {
    title: '生产级国际化解决方案',
    subtitle: '零依赖 · 插件化架构 · 企业级安全 · 原生中文支持',
    cta: '立即开始',
    ctaSecondary: '查看文档',
  },
  features: {
    zeroDeps: {
      title: '零外部依赖',
      desc: '无任何运行时依赖，打包体积仅 ~15KB gzipped',
    },
    pluginSystem: {
      title: '插件化架构',
      desc: '可扩展的插件系统，支持自定义翻译策略',
    },
    security: {
      title: '企业级安全',
      desc: 'ReDoS 防护、时序攻击防护、OWASP Level 4 标准',
    },
    chineseFirst: {
      title: '中文优先设计',
      desc: '原生支持简体中文/繁体中文，智能语言检测',
    },
    performance: {
      title: '极致性能',
      desc: 'LRU 缓存引擎，翻译查询 <1ms',
    },
    typescript: {
      title: '100% TypeScript',
      desc: '完整类型定义，开发体验极佳',
    },
  },
  demo: {
    greeting: '你好，{name}！欢迎使用 YYC³ i18n-core',
    itemCount: '您有 {count} 条消息',
    timeAgo: '{time}前',
    switchLang: '切换语言',
    currentLocale: '当前语言：{locale}',
  },
};

const en: TranslationMap = {
  common: {
    appName: 'YYC³ i18n Framework',
    version: 'Version v2.0',
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Success',
  },
  nav: {
    home: 'Home',
    about: 'About',
    features: 'Features',
    examples: 'Examples',
  },
  hero: {
    title: 'Production-Ready i18n Solution',
    subtitle: 'Zero Dependencies · Plugin Architecture · Enterprise Security · Chinese-Native',
    cta: 'Get Started',
    ctaSecondary: 'View Docs',
  },
  features: {
    zeroDeps: {
      title: 'Zero Dependencies',
      desc: 'No runtime dependencies, only ~15KB gzipped',
    },
    pluginSystem: {
      title: 'Plugin Architecture',
      desc: 'Extensible plugin system with custom translation strategies',
    },
    security: {
      title: 'Enterprise Security',
      desc: 'ReDoS protection, timing attack prevention, OWASP Level 4',
    },
    chineseFirst: {
      title: 'Chinese-First Design',
      desc: 'Native Simplified/Traditional Chinese support, smart detection',
    },
    performance: {
      title: 'Blazing Fast',
      desc: 'LRU cache engine, translation queries in <1ms',
    },
    typescript: {
      title: '100% TypeScript',
      desc: 'Complete type definitions, excellent DX',
    },
  },
  demo: {
    greeting: 'Hello, {name}! Welcome to YYC³ i18n-core',
    itemCount: 'You have {count} messages',
    timeAgo: '{time} ago',
    switchLang: 'Switch Language',
    currentLocale: 'Current locale: {locale}',
  },
};

export async function setupI18n() {
  await initI18n({
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en',
  });

  addTranslations('zh-CN', zhCN);
  addTranslations('en', en);

  console.log('🌐 i18n initialized - 中文示例就绪');
}
