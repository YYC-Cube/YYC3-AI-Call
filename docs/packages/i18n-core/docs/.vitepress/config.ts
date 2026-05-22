import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@yyc3/i18n-core',
  description: '生产级国际化框架 · 中文原生优化 · AI-Powered · MCP Integration',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'og:site_name', content: '@yyc3/i18n-core' }],
  ],

  themeConfig: {
    nav: [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '最佳实践', link: '/guide/best-practices' },
          { text: 'AI 翻译', link: '/guide/ai-translation' },
          { text: 'MCP 集成', link: '/guide/mcp-integration' },
        ],
      },
      {
        text: 'API 参考',
        link: '/api/',
      },
      {
        text: '资源',
        items: [
          {
            text: 'GitHub',
            link: 'https://github.com/YanYuCloudCube/yyc3-i18n-core',
          },
          {
            text: 'NPM 包',
            link: 'https://www.npmjs.com/package/@yyc3/i18n-core',
          },
          {
            text: '更新日志',
            link: 'https://github.com/YanYuCloudCube/yyc3-i18n-core/blob/main/CHANGELOG.md',
          },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装配置', link: '/guide/installation' },
            { text: '基础用法', link: '/guide/basic-usage' },
          ],
        },
        {
          text: '进阶功能',
          items: [
            { text: '命名空间管理', link: '/guide/namespaces' },
            { text: '插件系统', link: '/guide/plugins' },
            { text: 'ICU MessageFormat', link: '/guide/icu-messageformat' },
            { text: 'RTL 支持', link: '/guide/rtl-support' },
          ],
        },
        {
          text: '高级特性',
          items: [
            { text: 'AI 翻译集成', link: '/guide/ai-translation' },
            { text: 'MCP 协议集成', link: '/guide/mcp-integration' },
            { text: '安全防护', link: '/guide/security' },
            { text: '性能优化', link: '/guide/performance' },
          ],
        },
        {
          text: '框架集成',
          items: [
            { text: 'React 集成', link: '/guide/react-integration' },
            { text: 'Vue 集成', link: '/guide/vue-integration' },
            { text: 'Angular 集成', link: '/guide/angular-integration' },
            { text: 'Node.js 后端', link: '/guide/nodejs-backend' },
          ],
        },
        {
          text: '最佳实践',
          items: [
            { text: '项目结构建议', link: '/guide/best-practices#project-structure' },
            { text: '翻译管理流程', link: '/guide/best-practices#translation-workflow' },
            { text: '性能优化策略', link: '/guide/best-practices#performance-optimization' },
            { text: '错误处理模式', link: '/guide/best-practices#error-handling' },
          ],
        },
      ],
      '/api/': [
        { text: '核心引擎', link: '/api/' },
        { text: '类型定义', link: '/api/types' },
        { text: '缓存系统', link: '/api/cache' },
        { text: '插件 API', link: '/api/plugins' },
        { text: 'AI 翻译 API', link: '/api/ai' },
        { text: 'MCP 服务器 API', link: '/api/mcp' },
        { text: '安全模块', link: '/api/security' },
        { text: '基础设施', link: '/api/infrastructure' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/YanYuCloudCube/yyc3-i18n-core' },
    ],

    footer: {
      message: '基于 MIT 许可发布 · YYC³ 团队维护',
      copyright: 'Copyright © 2024-2026 YYC³ Team. All rights reserved.',
    },

    editLink: {
      pattern: 'https://github.com/YanYuCloudCube/yyc3-i18n-core/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: [
          {
            text: 'Guide',
            items: [
              { text: 'Quick Start', link: '/en/guide/getting-started' },
              { text: 'Best Practices', link: '/en/guide/best-practices' },
              { text: 'AI Translation', link: '/en/guide/ai-translation' },
              { text: 'MCP Integration', link: '/en/guide/mcp-integration' },
            ],
          },
          {
            text: 'API Reference',
            link: '/en/api/',
          },
        ],
      },
    },
  },
})
