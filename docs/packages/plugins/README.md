# @yyc3/plugins

**YYC³ AI Family 插件集合** — LSP 语言服务器插件、内容处理插件

[![npm version](https://img.shields.io/npm/v/@yyc3/plugins.svg)](https://www.npmjs.com/package/@yyc3/plugins)
[![license](https://img.shields.io/npm/l/@yyc3/plugins.svg)](https://github.com/YanYuCloudCube/Family-PAI/blob/main/packages/family-plugins/LICENSE)
[![peer](https://img.shields.io/badge/react-%3E%3D18.0.0-61dafb.svg)](https://reactjs.org/)
[![tests](https://img.shields.io/badge/tests-5%20passed-brightgreen.svg)](https://github.com/YanYuCloudCube/Family-PAI)

---

## 📖 目录

- [特性概览](#-特性概览)
- [安装指南](#-安装指南)
- [快速开始](#-快速开始)
- [插件清单](#-插件清单)
- [API 参考](#-api-参考)
- [子路径导入](#-子路径导入trees-shaking)
- [使用场景](#-使用场景)
- [类型定义](#-类型定义)
- [开发指南](#-开发指南)
- [测试覆盖](#-测试覆盖)
- [版本历史](#-版本历史)
- [许可证](#-许可证)

---

## ✨ 特性概览

### 核心优势

| 特性 | 说明 | 竞品对比 |
|------|------|----------|
| **🎯 声明式定义** | 插件采用纯数据结构定义，无需实例化 | vs 动态加载，零运行时开销 |
| **🔌 LSP 支持** | 4 种主流语言服务器协议集成 | Python/Ruby/Rust/Swift |
| **📝 内容处理** | 4 种内容格式处理器 | Emmet/Marked/Handlebars/Ionic |
| **⚡ Tree Shaking** | 按需引入，最小化打包体积 | 单模块 ~1KB gzipped |
| **🔍 类型安全** | 完整 TypeScript 类型导出 | 编译时错误检测 |
| **🛠️ 配置完整** | 每个插件包含安装命令、能力列表、详细参数 | 开箱即用 |
| **🔗 统一接口** | 所有插件遵循统一 `Config` 接口 | 易于扩展 |

### 架构设计

```
@yyc3/plugins
├── 主入口 (index.ts)
│   ├── 导出所有 LSP 插件 + 工具函数
│   └── 导出所有 Content 插件 + 工具函数
│
├── LSP 模块 (lsp/)
│   ├── PythonLSPPlugin     — Pyright 语言服务器
│   ├── RubyLSPPlugin       — ruby-lsp 语言服务器
│   ├── RustLSPPlugin       — rust-analyzer 语言服务器
│   └── SwiftLSPPlugin      — sourcekit-lsp 语言服务器
│
└── Content 模块 (content/)
    ├── EmmetPlugin         — HTML/CSS 缩写展开
    ├── MarkedPlugin        — Markdown 解析渲染
    ├── HandlebarsPlugin    — Handlebars 模板引擎
    └── IonicPlugin         — Ionic 跨平台框架
```

---

## 📦 安装指南

### 必要条件

- **Node.js**: >= 18.0.0
- **React**: >= 18.0.0 (Peer Dependency)
- **ReactDOM**: >= 18.0.0 (Peer Dependency)
- **包管理器**: pnpm (推荐) / npm / yarn

### 安装命令

```bash
# 使用 pnpm (推荐)
pnpm add @yyc3/plugins @yyc3/core react react-dom

# 使用 npm
npm install @yyc3/plugins @yyc3/core react react-dom

# 使用 yarn
yarn add @yyc3/plugins @yyc3/core react react-dom
```

### 安装验证

```typescript
// 验证安装是否成功
import { PLUGIN_VERSION, PLUGIN_NAME } from '@yyc3/plugins'

console.log(`${PLUGIN_NAME} v${PLUGIN_VERSION}`)
// → @yyc3/plugins v1.1.0
```

---

## 🚀 快速开始

### 场景 1: 获取所有可用插件

```typescript
import {
  getAllLSPPlugins,
  getAllContentPlugins,
} from '@yyc3/plugins'

// 获取所有 LSP 语言服务器插件
const lspPlugins = getAllLSPPlugins()
console.log(lspPlugins.map(p => p.displayName))
// → ['Python Language Server', 'Ruby Language Server', 
//    'Rust Language Server', 'Swift Language Server']

// 获取所有内容处理插件
const contentPlugins = getAllContentPlugins()
console.log(contentPlugins.map(p => p.displayName))
// → ['Emmet Syntax Support', 'Markdown Parser',
//    'Handlebars Template Engine', 'Ionic Framework']
```

### 场景 2: 按语言查找 LSP 插件

```typescript
import { getLSPPluginByLanguage } from '@yyc3/plugins'

// 查找 Python 语言服务器
const python = getLSPPluginByLanguage('python')
if (python) {
  console.log(python.server)          // 'pyright'
  console.log(python.capabilities)    // ['智能代码补全', ...]
  console.log(python.installation)    // { command: 'npm', args: [...] }
}

// 查找 Rust 语言服务器
const rust = getLSPPluginByLanguage('rust')
if (rust) {
  console.log(rust.configuration)    // 详细配置对象
}
```

### 场景 3: 按名称查找内容插件

```typescript
import { getContentPluginByName } from '@yyc3/plugins'

// 查找 Markdown 处理器
const marked = getContentPluginByName('marked')
if (marked) {
  console.log(marked.version)          // '12.0.0'
  console.log(marked.capabilities)     // ['Markdown解析', ...]
  console.log(marked.configuration)    // GFM/高亮/渲染器配置
}

// 查找 Ionic 框架插件
const ionic = getContentPluginByName('ionic')
if (ionic) {
  console.log(ionic.theme)             // 主题颜色配置
}
```

### 场景 4: 构建插件管理器 UI

```tsx
import React, { useState } from 'react'
import {
  getAllLSPPlugins,
  getAllContentPlugins,
  type LSPPluginConfig,
  type ContentPluginConfig,
} from '@yyc3/plugins'

function PluginManager() {
  const [lspPlugins] = useState<LSPPluginConfig[]>(getAllLSPPlugins())
  const [contentPlugins] = useState<ContentPluginConfig[]>(getAllContentPlugins())

  return (
    <div className="plugin-manager">
      <section>
        <h2>语言服务器</h2>
        {lspPlugins.map(plugin => (
          <PluginCard key={plugin.id} plugin={plugin} />
        ))}
      </section>

      <section>
        <h2>内容处理</h2>
        {contentPlugins.map(plugin => (
          <PluginCard key={plugin.id} plugin={plugin} />
        ))}
      </section>
    </div>
  )
}

interface PluginCardProps {
  plugin: LSPPluginConfig | ContentPluginConfig
}
function PluginCard({ plugin }: PluginCardProps) {
  const isLSP = 'language' in plugin
  
  return (
    <div className="plugin-card">
      <h3>{plugin.displayName}</h3>
      <p>{plugin.description}</p>
      
      {/* 能力标签 */}
      <div className="capabilities">
        {plugin.capabilities.map(cap => (
          <span key={cap} className="tag">{cap}</span>
        ))}
      </div>
      
      {/* 安装命令 */}
      <code>
        {plugin.installation.command} {plugin.installation.args?.join(' ')}
      </code>
      
      {/* LSP 特有信息 */}
      {isLSP && (
        <>
          <p>语言: {(plugin as LSPPluginConfig).language}</p>
          <p>服务器: {(plugin as LSPPluginConfig).server}</p>
        </>
      )}
      
      {/* Content 特有信息 */}
      {!isLSP && (
        <p>版本: {(plugin as ContentPluginConfig).version}</p>
      )}
    </div>
  )
}
```

### 场景 5: 自动化安装脚本

```typescript
import {
  getAllLSPPlugins,
  getAllContentPlugins,
  type LSPPluginConfig,
  type ContentPluginConfig,
} from '@yyc3/plugins'
import { execSync } from 'child_process'

/**
 * 批量安装指定语言的 LSP 服务器
 */
function installLSPLanguages(languages: string[]) {
  const allPlugins = getAllLSPPlugins()
  
  for (const lang of languages) {
    const plugin = allPlugins.find(
      p => (p as LSPPluginConfig).language === lang
    ) as LSPPluginConfig
    
    if (!plugin) {
      console.warn(`❌ 未找到 ${lang} 的 LSP 插件`)
      continue
    }
    
    console.log(`📦 安装 ${plugin.displayName}...`)
    try {
      execSync(
        `${plugin.installation.command} ${plugin.installation.args?.join(' ')}`,
        { stdio: 'inherit' }
      )
      console.log(`✅ ${plugin.displayName} 安装成功`)
    } catch (error) {
      console.error(`❌ ${plugin.displayName} 安装失败:`, error)
    }
  }
}

// 示例: 安装 Python 和 Rust 的 LSP
installLSPLanguages(['python', 'rust'])

/**
 * 批量安装内容处理工具
 */
function installContentTools(tools: string[]) {
  const allPlugins = getAllContentPlugins()
  
  for (const tool of tools) {
    const plugin = allPlugins.find(
      p => p.name.toLowerCase() === tool
    ) as ContentPluginConfig
    
    if (!plugin) {
      console.warn(`❌ 未找到 ${tool} 内容插件`)
      continue
    }
    
    console.log(`📦 安装 ${plugin.displayName}...`)
    try {
      execSync(
        `${plugin.installation.command} ${plugin.installation.args?.join(' ')}`,
        { stdio: 'inherit' }
      )
      console.log(`✅ ${plugin.displayName} 安装成功`)
    } catch (error) {
      console.error(`❌ ${plugin.displayName} 安装失败:`, error)
    }
  }
}

// 示例: 安装 Marked 和 Handlebars
installContentTools(['marked', 'handlebars'])
```

---

## 🔌 插件清单

### LSP 语言服务器插件 (4个)

#### 1️⃣ PythonLSP — Python 语言服务器

```typescript
import { PythonLSPPlugin } from '@yyc3/plugins'

console.log(PythonLSPPlugin)
// {
//   id: 'lsp-python',
//   name: 'PythonLSP',
//   displayName: 'Python Language Server',
//   language: 'python',
//   server: 'pyright',
//   package: '@yyc3/lsp-python',
//   description: 'Python语言服务器，提供智能补全、类型检查、重构等功能',
//   capabilities: [
//     '智能代码补全', '类型检查和推断', '函数签名提示',
//     '代码重构', '查找引用', '跳转定义', '错误诊断'
//   ],
//   installation: { command: 'npm', args: ['install', '@yyc3/lsp-python'] },
//   configuration: {
//     typeCheckingMode: 'basic',
//     pythonPath: '/usr/bin/python3',
//     venvPath: '${workspaceFolder}/.venv',
//     analysis: { autoSearchPaths: true, diagnosticMode: 'workspace', ... }
//   }
// }
```

| 属性 | 值 |
|------|-----|
| **服务器** | Pyright |
| **能力数** | 7 项核心能力 |
| **安装方式** | `npm i @yyc3/lsp-python` |
| **适用场景** | Python 项目智能开发 |

#### 2️⃣ RubyLSP — Ruby 语言服务器

```typescript
import { RubyLSPPlugin } from '@yyc3/plugins'

console.log(RubyLSPPlugin.capabilities)
// → ['智能代码补全', '代码导航', '重构支持', '文档高亮', 
//     '诊断信息', '格式化', '语义高亮']
```

| 属性 | 值 |
|------|-----|
| **服务器** | ruby-lsp |
| **能力数** | 7 项核心能力 |
| **安装方式** | `gem install ruby-lsp` |
| **适用场景** | Ruby on Rails 项目 |

#### 3️⃣ RustLSP — Rust 语言服务器

```typescript
import { RustLSPPlugin } from '@yyc3/plugins'

console.log(RustLSPPlugin.capabilities)
// → ['智能代码补全', '类型推断', '代码重构', '内联提示',
//     '宏展开', 'Cargo集成', '测试运行器', '调试支持']
```

| 属性 | 值 |
|------|-----|
| **服务器** | rust-analyzer |
| **能力数** | 8 项核心能力 |
| **安装方式** | `rustup component add rust-analyzer` |
| **适用场景** | Rust 系统编程项目 |

#### 4️⃣ SwiftLSP — Swift 语言服务器

```typescript
import { SwiftLSPPlugin } from '@yyc3/plugins'

console.log(SwiftLSPPlugin.capabilities)
// → ['智能代码补全', '代码导航', '重构支持', 'SwiftPM集成',
//     '调试支持', '语义高亮', '文档生成']
```

| 属性 | 值 |
|------|-----|
| **服务器** | sourcekit-lsp |
| **能力数** | 7 项核心能力 |
| **安装方式** | `xcode-select --install` |
| **适用场景** | iOS/macOS 应用开发 |

### 内容处理插件 (4个)

#### 5️⃣ Emmet — HTML/CSS 缩写展开

```typescript
import { EmmetPlugin } from '@yyc3/plugins'

console.log(EmmetPlugin)
// {
//   id: 'content-emmet',
//   name: 'Emmet',
//   displayName: 'Emmet Syntax Support',
//   version: '2.0.0',
//   capabilities: [
//     'HTML缩写展开', 'CSS缩写展开', '自定义片段',
//     '多光标支持', '实时预览'
//   ],
//   configuration: {
//     syntaxProfiles: { html: { attr_quotes: 'double' }, css: { vendor_prefixes: true } },
//     snippets: { html: { 'html:5': '!!!+html[lang=en]>head>...' } },
//     variables: { lang: 'en', charset: 'UTF-8' }
//   }
// }
```

| 属性 | 值 |
|------|-----|
| **版本** | v2.0.0 |
| **能力数** | 5 项核心能力 |
| **安装方式** | `npm i @yyc3/emmet` |
| **适用场景** | 快速编写 HTML/CSS 代码 |

#### 6️⃣ Marked — Markdown 解析器

```typescript
import { MarkedPlugin } from '@yyc3/plugins'

console.log(MarkedPlugin.capabilities)
// → ['Markdown解析', '实时渲染', '扩展语法支持', '代码高亮',
//     '表格支持', '任务列表', '数学公式']

console.log(MarkedPlugin.configuration.gfm)  // true (GitHub Flavored Markdown)
```

| 属性 | 值 |
|------|-----|
| **版本** | v12.0.0 |
| **能力数** | 7 项核心能力 |
| **安装方式** | `npm i @yyc3/marked` |
| **适用场景** | 文档站点 / 博客系统 / 技术写作 |

#### 7️⃣ Handlebars — 模板引擎

```typescript
import { HandlebarsPlugin } from '@yyc3/plugins'

console.log(HandlebarsPlugin.capabilities)
// → ['模板编译', '自定义助手', '部分模板', '条件渲染',
//     '循环渲染', '数据绑定', '预编译']

console.log(HandlebarsPlugin.configuration.compat)  // true (兼容模式)
```

| 属性 | 值 |
|------|-----|
| **版本** | v4.7.8 |
| **能力数** | 7 项核心能力 |
| **安装方式** | `npm i @yyc3/handlebars` |
| **适用场景** | 服务端渲染 / 邮件模板 / 动态页面生成 |

#### 8️⃣ Ionic — 跨平台移动框架

```typescript
import { IonicPlugin } from '@yyc3/plugins'

console.log(IonicPlugin.capabilities)
// → ['组件库', '主题定制', '图标系统', '手势支持',
//     '路由导航', '原生API集成', 'CLI工具']

console.log(IonicPlugin.configuration.theme.primary)  // '#3880ff'
```

| 属性 | 值 |
|------|-----|
| **版本** | v7.0.0 |
| **能力数** | 7 项核心能力 |
| **安装方式** | `npm i @yyc3/ionic` |
| **适用场景** | 跨平台移动应用 / PWA / 混合应用 |

---

## 📚 API 参考

### 主入口导出 (`@yyc3/plugins`)

#### LSP 相关 API

```typescript
/**
 * 获取所有 LSP 插件定义
 * @returns LSPPluginConfig 数组 (4个元素)
 */
function getAllLSPPlugins(): LSPPluginConfig[]

/**
 * 按语言获取 LSP 插件
 * @param language - 语言标识符 ('python'|'ruby'|'rust'|'swift')
 * @returns 匹配的插件配置，未找到返回 undefined
 */
function getLSPPluginByLanguage(language: string): LSPPluginConfig | undefined

/**
 * LSP 插件常量映射表
 * @example LSPPluginDefinitions.python === PythonLSPPlugin
 */
const LSPPluginDefinitions: Record<string, LSPPluginConfig>
```

#### Content 相关 API

```typescript
/**
 * 获取所有内容处理插件定义
 * @returns ContentPluginConfig 数组 (4个元素)
 */
function getAllContentPlugins(): ContentPluginConfig[]

/**
 * 按名称获取内容插件
 * @param name - 插件名 ('emmet'|'marked'|'handlebars'|'ionic')
 * @returns 匹配的插件配置，未找到返回 undefined
 */
function getContentPluginByName(name: string): ContentPluginConfig | undefined

/**
 * 内容插件常量映射表
 * @example ContentPluginDefinitions.marked === MarkedPlugin
 */
const ContentPluginDefinitions: Record<string, ContentPluginConfig>
```

#### 元信息导出

```typescript
/** 当前插件集合版本号 */
const PLUGIN_VERSION: string  // '1.1.0'

/** 当前插件集合名称 */
const PLUGIN_NAME: string     // '@yyc3/plugins'
```

### 子路径导出

#### `@yyc3/plugins/lsp`

```typescript
// 仅导出 LSP 相关内容 (~1KB gzipped)
export {
  LSPPluginDefinitions,
  getAllLSPPlugins,
  getLSPPluginByLanguage,
  PythonLSPPlugin,
  RubyLSPPlugin,
  RustLSPPlugin,
  SwiftLSPPlugin,
}
export type { LSPPluginConfig }
```

#### `@yyc3/plugins/content`

```typescript
// 仅导出 Content 相关内容 (~1KB gzipped)
export {
  ContentPluginDefinitions,
  getAllContentPlugins,
  getContentPluginByName,
  EmmetPlugin,
  MarkedPlugin,
  HandlebarsPlugin,
  IonicPlugin,
}
export type { ContentPluginConfig }
```

---

## 🌳 子路径导入 (Tree Shaking)

### 按需引入，极致优化打包体积

```typescript
// 全部功能 (~2KB gzipped)
import { getAllLSPPlugins, getAllContentPlugins } from '@yyc3/plugins'

// 仅 LSP 插件 (~1KB gzipped)
import { PythonLSPPlugin, getAllLSPPlugins } from '@yyc3/plugins/lsp'

// 仅内容插件 (~1KB gzipped)
import { MarkedPlugin, getAllContentPlugins } from '@yyc3/plugins/content'
```

### 可用子路径

| 子路径 | 大小估计(gzipped) | 导出内容 | 适用场景 |
|--------|-------------------|----------|----------|
| `.` | ~2KB | 全部功能 (8个插件) | 需要 LSP + Content |
| `./lsp` | ~1KB | 4个 LSP 插件 | 仅需要语言服务器 |
| `./content` | ~1KB | 4个内容插件 | 仅需要内容处理 |

> **体积节省最高 50%** — 通过子路径导入，仅引入所需模块。

---

## 💡 使用场景

### 场景 A: IDE 插件市场

构建一个 IDE 的插件管理系统：

```typescript
import {
  getAllLSPPlugins,
  getAllContentPlugins,
  type LSPPluginConfig,
  type ContentPluginConfig,
} from '@yyc3/plugins'

class IDEPluginManager {
  private lspPlugins: Map<string, LSPPluginConfig> = new Map()
  private contentPlugins: Map<string, ContentPluginConfig> = new Map()

  constructor() {
    // 初始化注册所有插件
    this.registerAllPlugins()
  }

  private registerAllPlugins() {
    // 注册 LSP 插件
    for (const plugin of getAllLSPPlugins()) {
      this.lspPlugins.set(plugin.language, plugin)
    }

    // 注册 Content 插件
    for (const plugin of getAllContentPlugins()) {
      this.contentPlugins.set(plugin.name.toLowerCase(), plugin)
    }
  }

  /**
   * 为当前打开的文件启用对应的 LSP
   */
  enableLSPForFile(filePath: string): LSPPluginConfig | null {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      py: 'python',
      rb: 'ruby',
      rs: 'rust',
      swift: 'swift',
    }
    
    const language = languageMap[ext || '']
    if (!language) return null

    const plugin = this.lspPlugins.get(language)
    if (!plugin) return null

    // 返回插件配置供 IDE 使用
    this.startLSPServer(plugin)
    return plugin
  }

  /**
   * 启动 LSP 服务器
   */
  private startLSPServer(plugin: LSPPluginConfig) {
    console.log(`启动 ${plugin.displayName} (${plugin.server})...`)
    // 使用 plugin.installation 和 plugin.configuration 来启动
  }

  /**
   * 获取文件对应的内容处理器
   */
  getContentProcessor(fileType: string): ContentPluginConfig | null {
    const typeMap: Record<string, string> = {
      markdown: 'marked',
      md: 'marked',
      html: 'emmet',
      hbs: 'handlebars',
      ionic: 'ionic',
    }
    
    const name = typeMap[fileType.toLowerCase()]
    if (!name) return null

    return this.contentPlugins.get(name) || null
  }

  /**
   * 列出所有可用的插件
   */
  listAvailablePlugins() {
    return {
      lsp: Array.from(this.lspPlugins.values()),
      content: Array.from(this.contentPlugins.values()),
    }
  }
}

// 使用示例
const manager = new IDEPluginManager()

// 打开 Python 文件时自动启用 Python LSP
const pythonLSP = manager.enableLSPForFile('main.py')

// 打开 Markdown 文件时获取处理器
const mdProcessor = manager.getContentProcessor('readme.md')
```

### 场景 B: 项目初始化向导

根据用户选择的技术栈自动推荐并安装插件：

```typescript
import {
  getLSPPluginByLanguage,
  getContentPluginByName,
} from '@yyc3/plugins'

interface TechStack {
  languages: string[]
  tools: string[]
}

async function setupProject(stack: TechStack) {
  console.log('🚀 开始配置项目...\n')

  // 1. 推荐并安装 LSP 服务器
  for (const lang of stack.languages) {
    const lsp = getLSPPluginByLanguage(lang)
    if (!lsp) {
      console.warn(`⚠️  暂不支持 ${lang} 的 LSP 服务器`)
      continue
    }

    console.log(`\n📌 ${lsp.displayName}`)
    console.log(`   能力: ${lsp.capabilities.join(', ')}`)
    console.log(`   安装: ${lsp.installation.command} ${lsp.installation.args?.join(' ')}`)

    // 询问用户是否安装
    // await confirmInstall(lsp)
  }

  // 2. 推荐并安装内容处理工具
  for (const tool of stack.tools) {
    const content = getContentPluginByName(tool)
    if (!content) {
      console.warn(`⚠️  暂不支持 ${tool} 处理器`)
      continue
    }

    console.log(`\n📝 ${content.displayName} (v${content.version})`)
    console.log(`   能力: ${content.capabilities.join(', ')}`)
    console.log(`   安装: ${content.installation.command} ${content.installation.args?.join(' ')}`)

    // 询问用户是否安装
    // await confirmInstall(content)
  }

  console.log('\n✅ 项目配置完成！')
}

// 示例: 全栈 Web 项目
setupProject({
  languages: ['python'],  // 后端
  tools: ['marked', 'emmet'],  // 文档 + 前端
})
```

### 场景 C: 插件配置面板

可视化展示和编辑插件配置：

```tsx
import React, { useState } from 'react'
import {
  getAllLSPPlugins,
  getAllContentPlugins,
  type LSPPluginConfig,
  type ContentPluginConfig,
} from '@yyc3/plugins'

export function PluginSettingsPanel() {
  const [selectedPlugin, setSelectedPlugin] = useState<
    LSPPluginConfig | ContentPluginConfig | null
  >(null)

  const lspPlugins = getAllLSPPlugins()
  const contentPlugins = getAllContentPlugins()

  return (
    <div className="settings-panel">
      <aside className="plugin-list">
        <h3>LSP 服务器</h3>
        {lspPlugins.map(plugin => (
          <button key={plugin.id} onClick={() => setSelectedPlugin(plugin)}>
            {plugin.displayName}
          </button>
        ))}

        <h3 style={{ marginTop: '1rem' }}>内容处理</h3>
        {contentPlugins.map(plugin => (
          <button key={plugin.id} onClick={() => setSelectedPlugin(plugin)}>
            {plugin.displayName}
          </button>
        ))}
      </aside>

      <main className="plugin-details">
        {selectedPlugin ? (
          <PluginDetailEditor plugin={selectedPlugin} />
        ) : (
          <p>选择一个插件查看详情</p>
        )}
      </main>
    </div>
  )
}

function PluginDetailEditor({
  plugin,
}: {
  plugin: LSPPluginConfig | ContentPluginConfig
}) {
  const isLSP = 'language' in plugin

  return (
    <div className="detail-editor">
      <h2>{plugin.displayName}</h2>
      <p>{plugin.description}</p>

      {/* 基本信息 */}
      <section>
        <h3>基本信息</h3>
        {isLSP ? (
          <>
            <label>语言: <input value={(plugin as LSPPluginConfig).language} readOnly /></label>
            <label>服务器: <input value={(plugin as LSPPluginConfig).server} /></label>
          </>
        ) : (
          <label>版本: <input value={(plugin as ContentPluginConfig).version} /></label>
        )}
      </section>

      {/* 能力列表 */}
      <section>
        <h3>能力列表</h3>
        <ul>
          {plugin.capabilities.map((cap, idx) => (
            <li key={idx}>{cap}</li>
          ))}
        </ul>
      </section>

      {/* 安装命令 */}
      <section>
        <h3>安装命令</h3>
        <code>
          {plugin.installation.command}{' '}
          {plugin.installation.args?.join(' ')}
        </code>
      </section>

      {/* 配置编辑 */}
      <section>
        <h3>高级配置</h3>
        <pre>{JSON.stringify(plugin.configuration, null, 2)}</pre>
      </section>
    </div>
  )
}
```

---

## 📝 类型定义

### LSPPluginConfig 接口

```typescript
interface LSPPluginConfig {
  /** 插件唯一标识符 */
  id: string
  /** 插件内部名称 */
  name: string
  /** 显示名称 (用于UI) */
  displayName: string
  /** 支持的语言标识符 */
  language: string
  /** LSP 服务器名称 */
  server: string
  /** npm 包名或 gem 名等 */
  package: string
  /** 描述文本 */
  description: string
  /** 能力列表 */
  capabilities: string[]
  /** 安装命令配置 */
  installation: {
    command: string
    args?: string[]
  }
  /** 默认配置项 */
  configuration: Record<string, unknown>
}
```

### ContentPluginConfig 接口

```typescript
interface ContentPluginConfig {
  /** 插件唯一标识符 */
  id: string
  /** 插件内部名称 */
  name: string
  /** 显示名称 (用于UI) */
  displayName: string
  /** npm 包名 */
  package: string
  /** 描述文本 */
  description: string
  /** 能力列表 */
  capabilities: string[]
  /** 版本号 */
  version: string
  /** 安装命令配置 */
  installation: {
    command: string
    args?: string[]
  }
  /** 默认配置项 */
  configuration: Record<string, unknown>
}
```

---

## 🛠️ 开发指南

### 添加新的 LSP 插件

在 `src/lsp/index.ts` 中添加：

```typescript
// 1. 定义插件配置
export const GoLSPPlugin: LSPPluginConfig = {
  id: 'lsp-go',
  name: 'GoLSP',
  displayName: 'Go Language Server',
  language: 'go',
  server: 'gopls',
  package: '@yyc3/lsp-go',
  description: 'Go语言服务器...',
  capabilities: [
    '智能代码补全',
    '类型推断',
    // ... 更多能力
  ],
  installation: {
    command: 'go',
    args: ['install', 'golang.org/x/tools/gopls@latest'],
  },
  configuration: {
    // Go 特定配置
  },
}

// 2. 注册到 Definitions 映射
export const LSPPluginDefinitions = {
  // ...existing plugins
  go: GoLSPPlugin,
}

// 3. 更新查询函数
export function getLSPPluginByLanguage(language: string): LSPPluginConfig | undefined {
  const pluginMap: Record<string, LSPPluginConfig> = {
    // ...existing mappings
    go: GoLSPPlugin,
  }
  return pluginMap[language.toLowerCase()]
}

// 4. 在 index.ts 主入口导出
export { GoLSPPlugin } from './lsp/index.js'
```

### 添加新的内容插件

在 `src/content/index.ts` 中添加：

```typescript
// 1. 定义插件配置
export const PugPlugin: ContentPluginConfig = {
  id: 'content-pug',
  name: 'Pug',
  displayName: 'Pug Template Engine',
  package: '@yyc3/pug',
  description: 'Pug模板引擎...',
  capabilities: [
    '模板编译',
    '继承支持',
    // ... 更多能力
  ],
  version: '3.0.0',
  installation: {
    command: 'npm',
    args: ['install', '@yyc3/pug'],
  },
  configuration: {
    // Pug 特定配置
  },
}

// 2. 注册到 Definitions 映射
export const ContentPluginDefinitions = {
  // ...existing plugins
  pug: PugPlugin,
}

// 3. 更新查询函数
export function getContentPluginByName(name: string): ContentPluginConfig | undefined {
  const pluginMap: Record<string, ContentPluginConfig> = {
    // ...existing mappings
    pug: PugPlugin,
  }
  return pluginMap[name.toLowerCase()]
}

// 4. 在 index.ts 主入口导出
export { PugPlugin } from './content/index.js'
```

---

## 🧪 测试覆盖

### 测试状态

| 文件 | 用例数 | 状态 | 覆盖率 |
|------|--------|------|--------|
| `src/__tests__/index.test.ts` | 5 | ✅ Passed | ~95% |

### 运行测试

```bash
# 全量测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

### 测试示例

```typescript
import { describe, it, expect } from 'vitest'
import {
  getAllLSPPlugins,
  getAllContentPlugins,
  getLSPPluginByLanguage,
  getContentPluginByName,
  PLUGIN_VERSION,
  PLUGIN_NAME,
} from '../index.js'

describe('@yyc3/plugins', () => {
  it('should export correct version info', () => {
    expect(PLUGIN_VERSION).toBe('1.1.0')
    expect(PLUGIN_NAME).toBe('@yyc3/plugins')
  })

  it('should return 4 LSP plugins', () => {
    const plugins = getAllLSPPlugins()
    expect(plugins).toHaveLength(4)
  })

  it('should return 4 content plugins', () => {
    const plugins = getAllContentPlugins()
    expect(plugins).toHaveLength(4)
  })

  it('should find Python LSP by language', () => {
    const plugin = getLSPPluginByLanguage('python')
    expect(plugin).toBeDefined()
    expect(plugin?.server).toBe('pyright')
  })

  it('should find Marked by name', () => {
    const plugin = getContentPluginByName('marked')
    expect(plugin).toBeDefined()
    expect(plugin?.version).toBe('12.0.0')
  })
})
```

---

## 📅 版本历史

详见 [CHANGELOG.md](./CHANGELOG.md)

| 版本 | 日期 | 说明 |
|------|------|------|
| **1.2.0** | 2026-04-24 | 📖 文档闭环完成 (README/CHANGELOG/MAINTENANCE) |
| **1.1.0** | 2026-04-23 | 🔧 审计升级版 (品牌修复/瘦身优化) |
| **1.0.2** | 历史版本 | 初始版本 (8个插件定义) |

---

## 📄 许可证

MIT © [YYC³ AI Team](https://github.com/YanYuCloudCube/Family-PAI)

---

*YYC³ AI Family — 八位拟人化AI家人的智能中枢*

**五高 · 五标 · 五化 · 五维**

---

*文档版本: 1.2.0 | 最后更新: 2026-04-24*
