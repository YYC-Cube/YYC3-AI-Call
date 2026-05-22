# @yyc3/ui

> **YYC³ AI Family UI 组件库** — 即拉即用的 React AI 智能系统 UI 组件

[![npm version](https://img.shields.io/npm/v/@yyc3/ui.svg)](https://www.npmjs.com/package/@yyc3/ui)
[![license](https://img.shields.io/npm/l/@yyc3/ui.svg)](https://github.com/YanYuCloudCube/Family-PAI/blob/main/packages/family-ui/LICENSE)
[![peer](https://img.shields.io/badge/react-%3E%3D18.0.0-61dafb.svg)](https://reactjs.org/)
[![tests](https://img.shields.io/badge/tests-25%20passed-green.svg)](https://github.com/YanYuCloudCube/Family-PAI)
[![bundle](https://img.shields.io/badge/gzipped-45KB-brightgreen.svg)](https://bundlephobia.com/package/@yyc3/ui)

---

## 📋 目录

- [特性概览](#-特性概览)
- [安装指南](#-安装指南)
- [快速开始](#-快速开始)
- [架构设计](#-架构设计)
- [五大模块详解](#-五大模块详解)
- [子路径导入（Tree Shaking优化）](#-子路径导入tree-shaking优化)
- [API 参考](#-api-参考)
- [主题系统](#-主题系统)
- [最佳实践](#-最佳实践)
- [测试覆盖](#-测试覆盖)
- [依赖关系](#-依赖关系)
- [常见问题](#-常见问题)
- [贡献指南](#-贡献指南)
- [License](#-license)

---

## ✨ 特性概览

### 🎯 核心特性

| 特性 | 描述 | 状态 |
|------|------|------|
| **五大模块** | Core / Components / Family / Themes 完整体系 | ✅ |
| **零依赖运行时** | 仅依赖 React + ReactDOM (peerDeps) | ✅ |
| **Tree-shaking 友好** | 5 个子路径独立导出，按需引入 | ✅ |
| **亮/暗双主题** | 内置 Light/Dark 主题 Token + 自动检测 | ✅ |
| **八位家人面板** | AgentCard/AgentStatus/FamilyLayout 开箱即用 | ✅ |
| **TypeScript 原生** | 完整类型定义，智能提示友好 | ✅ |

### 🏗️ 五高架构支撑

| 维度 | 实现方式 |
|------|----------|
| **高可用** | 模块化设计，单点故障隔离 |
| **高性能** | Tree-shaking 优化，最小化打包体积 |
| **高安全** | 无外部运行时依赖，减少攻击面 |
| **高扩展** | 主题系统可定制，组件可组合 |
| **高智能** | 与 @yyc3/core 深度集成，AI 能力原生支持 |

---

## 📦 安装指南

### 前置要求

- **Node.js** >= 18.0.0
- **React** >= 18.0.0
- **ReactDOM** >= 18.0.0
- **PNPM** >= 8.0.0 (推荐)

### 安装命令

```bash
# 安装 peerDependencies (必须)
pnpm add react react-dom

# 安装 UI 包及核心依赖
pnpm add @yyc3/ui @yyc3/core
```

### 验证安装

```typescript
import { ThemeProvider } from '@yyc3/ui/themes'
import { Button } from '@yyc3/ui/components'

console.log('✅ @yyc3/ui 安装成功')
```

---

## 🚀 快速开始

### 1. 最简示例 — 一行启动 AI Family 面板

```tsx
import { ThemeProvider } from '@yyc3/ui/themes'
import { AIFamilyPanel } from '@yyc3/ui/family'

function App() {
  return (
    <ThemeProvider defaultMode="light">
      <AIFamilyPanel />
    </ThemeProvider>
  )
}
```

### 2. 完整应用示例

```tsx
import { ThemeProvider, useTheme } from '@yyc3/ui/themes'
import { AIFamilyPanel, AgentCard, AgentStatus } from '@yyc3/ui/family'
import { Button, Card, Input, Modal } from '@yyc3/ui/components'
import { AIFamilyProvider, useAIChat } from '@yyc3/ui/core'

function ChatInterface() {
  const { messages, sendMessage } = useAIChat()
  const { theme, setMode } = useTheme()

  return (
    <Card title="YYC³ AI Family">
      <AIFamilyPanel showHeader={true} defaultView="home" />
      
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i}>{msg.content}</div>
        ))}
      </div>

      <Input 
        placeholder="输入消息..." 
        onSubmit={(msg) => sendMessage(msg)} 
      />

      <Button onClick={() => setMode(theme.name === 'light' ? 'dark' : 'light')}>
        切换主题
      </Button>
    </Card>
  )
}

function App() {
  return (
    <ThemeProvider defaultMode="auto">
      <AIFamilyProvider>
        <ChatInterface />
      </AIFamilyProvider>
    </ThemeProvider>
  )
}
```

### 3. 八位家人面板定制

```tsx
import {
  AIFamilyPanel,
  FamilyLayout,
  FamilyMembers,
  AgentCard,
  AgentStatus,
} from '@yyc3/ui/family'
import type { AgentDefinition } from '@yyc3/core/ai-family'

// 使用完整面板
<AIFamilyPanel 
  className="custom-panel"
  showHeader={true}
  defaultView="members"
/>

// 自定义布局
<FamilyLayout showHeader={true} defaultView="settings">
  <FamilyMembers 
    members={agents}
    onSelect={(agent) => console.log('Selected:', agent.id)}
  />
</FamilyLayout>

// 单个家人卡片
<AgentCard
  agent={{
    id: 'meta-oracle',
    name: '元启·天枢',
    role: '总指挥 · 决策中枢',
    description: '统筹全局决策的元启者',
  }}
  onClick={() => handleAgentClick('meta-oracle')}
  showCapabilities={true}
/>

// 家人状态指示器
<AgentStatus 
  agentId="meta-oracle" 
  status={{ online: true, lastActive: new Date() }} 
/>
```

### 4. 主题系统使用

```tsx
import {
  ThemeProvider,
  useTheme,
  lightTheme,
  darkTheme,
  themeTokens,
  type ThemeMode,
} from '@yyc3/ui/themes'

function ThemeSwitcher() {
  const { mode, setMode, theme } = useTheme()

  return (
    <div>
      <p>当前模式: {mode}</p>
      
      <button onClick={() => setMode('light')}>☀️ 亮色</button>
      <button onClick={() => setMode('dark')}>🌙 暗色</button>
      <button onClick={() => setMode('auto')}>🔄 跟随系统</button>

      <div style={{ 
        backgroundColor: theme.colors.background, 
        color: theme.colors.text,
        padding: '16px',
        borderRadius: '8px',
        marginTop: '16px'
      }}>
        主题预览区域
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultMode="auto">
      <ThemeSwitcher />
    </ThemeProvider>
  )
}
```

---

## 🏗️ 架构设计

### 项目结构

```
@yyc3/ui/
├── src/
│   ├── index.ts              # 主入口 - 导出所有模块
│   ├── core/                 # 核心模块
│   │   ├── context.tsx       # React Context 提供者
│   │   ├── hooks.ts          # 自定义 Hooks
│   │   └── utils.ts          # 工具函数
│   ├── components/           # 通用组件
│   │   ├── button.tsx        # 按钮组件
│   │   ├── card.tsx          # 卡片组件
│   │   ├── input.tsx         # 输入框组件
│   │   ├── layout.tsx        # 布局组件
│   │   └── modal.tsx         # 模态框组件
│   ├── family/               # AI Family 专用组件 ⭐
│   │   ├── AIFamilyPanel.tsx # 主面板入口
│   │   ├── FamilyLayout.tsx  # 家人布局容器
│   │   ├── FamilyHome.tsx    # 家人首页
│   │   ├── FamilyMembers.tsx # 家人列表
│   │   ├── AgentCard.tsx     # 智能体卡片
│   │   └── AgentStatus.tsx   # 状态指示器
│   └── themes/               # 主题系统
│       ├── theme-provider.tsx # Theme Provider
│       ├── theme-tokens.ts   # Token 定义
│       ├── light-theme.ts    # 亮色主题
│       └── dark-theme.ts     # 暗色主题
├── dist/                     # 构建输出
│   ├── index.js             # 主入口 (~45KB gzipped)
│   ├── core.js              # 核心模块 (~12KB gzipped)
│   ├── components.js        # 组件库 (~18KB gzipped)
│   ├── family.js            # 家庭组件 (~15KB gzipped)
│   └── themes.js            # 主题系统 (~8KB gzipped)
├── __tests__/               # 测试文件
├── package.json
├── tsconfig.json
└── tsup.config.ts           # 构建配置
```

### 模块依赖关系

```
@yyc3/ui (主入口)
├── core/          ← 基础上下文与 Hooks
│   └── @yyc3/core (AgentDefinition 类型)
├── components/    ← 通用 UI 组件 (无外部依赖)
├── family/        ← AI Family 专用组件
│   ├── components/
│   └── core/
└── themes/        ← 主题系统 (纯配置)
```

### 数据流架构

```
用户交互 → React Components → Context/Hooks → @yyc3/Core API → 渲染更新
                ↓
         Theme Provider (CSS Variables)
                ↓
         DOM 更新 (响应式)
```

---

## 📦 五大模块详解

### 1. Core (`@yyc3/ui/core`) — 基础设施层

提供 React Context 和自定义 Hooks，是所有组件的基础。

```tsx
import { 
  AIFamilyProvider, 
  useAIFamily, 
  useAIChat, 
  useAgentStatus,
  createAIContext 
} from '@yyc3/ui/core'

function ChatPanel() {
  const { sendMessage, messages, isLoading } = useAIChat()
  const status = useAgentStatus('meta-oracle')
  
  return (
    <>
      <AgentStatus agentId="meta-oracle" status={status} />
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
      <Input onSubmit={sendMessage} disabled={isLoading} />
    </>
  )
}

function App() {
  return (
    <AIFamilyProvider config={{ /* 配置项 */ }}>
      <ChatPanel />
    </AIFamilyProvider>
  )
}
```

#### 导出列表

| 导出 | 类型 | 说明 |
|------|------|------|
| `AIFamilyProvider` | Component | AI Family Context Provider |
| `useAIFamily` | Hook | 获取 AI Family 实例 |
| `useAIChat` | Hook | 聊天功能 Hook |
| `useAgentStatus` | Hook | 获取智能体状态 |
| `createAIContext` | Function | 创建自定义 Context |

---

### 2. Components (`@yyc3/ui/components`) — 通用组件库

提供开箱即用的通用 UI 组件。

```tsx
import { Button, Card, Input, Layout, Modal } from '@yyc3/ui/components'

// Button - 三种变体
<Button variant="primary" size="md" onClick={handleClick}>
  确认操作
</Button>
<Button variant="secondary" size="sm">
  取消
</Button>
<Button variant="ghost" size="lg">
  链接按钮
</Button>

// Card - 信息展示
<Card title="标题" description="描述内容">
  <p>卡片主体内容</p>
  <Button>操作按钮</Button>
</Card>

// Input - 表单输入
<Input 
  placeholder="请输入消息..."
  value={value}
  onChange={setValue}
  onSubmit={handleSubmit}
  disabled={false}
/>

// Layout - 页面布局
<Layout>
  <Layout.Header>头部导航</Layout.Header>
  <Layout.Sider>侧边栏</Layout.Sider>
  <Layout.Content>主内容区</Layout.Content>
  <Layout.Footer>底部信息</Layout.Footer>
</Layout>

// Modal - 弹窗
<Modal 
  open={showModal} 
  onClose={() => setShowModal(false)}
  title="确认操作"
>
  <p>确定要执行此操作吗？</p>
  <Button onClick={() => setShowModal(false)}>确定</Button>
</Modal>
```

#### 组件 API 文档

##### Button

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'  // 默认: 'primary'
  size?: 'sm' | 'md' | 'lg'                     // 默认: 'md'
  onClick?: () => void
  disabled?: boolean                             // 默认: false
  children: React.ReactNode
}
```

##### Card

```typescript
interface CardProps {
  title?: string
  description?: string
  className?: string
  children?: React.ReactNode
}
```

##### Input

```typescript
interface InputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  disabled?: boolean
}
```

##### Modal

```typescript
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}
```

---

### 3. Family (`@yyc3/ui/family`) ⭐ — AI Family 核心面板

八位 AI 家人的专用可视化组件，是本包的核心价值所在。

```tsx
import {
  AIFamilyPanel,
  FamilyLayout,
  FamilyHome,
  FamilyMembers,
  AgentCard,
  AgentStatus,
} from '@yyc3/ui/family'
import type { AgentDefinition } from '@yyc3/core/ai-family'

// 方式1: 一行代码启动完整面板
<AIFamilyPanel 
  className="my-family-panel"
  showHeader={true}
  defaultView="home"
/>

// 方式2: 自定义布局组合
<FamilyLayout showHeader={true} defaultView="members">
  <FamilyHome />
  <FamilyMembers 
    members={agentList}
    onSelect={(agent) => navigateToAgent(agent.id)}
  />
</FamilyLayout>

// 方式3: 单独使用组件
<div className="agent-grid">
  {agents.map(agent => (
    <AgentCard
      key={agent.id}
      agent={agent}
      onClick={() => selectAgent(agent.id)}
      showCapabilities={true}
    />
  ))}
</div>

// 方式4: 状态监控
<AgentStatus 
  agentId="meta-oracle"
  status={{
    online: true,
    lastActive: new Date(),
    currentTask: '处理用户请求'
  }}
/>
```

#### 组件详细说明

| 组件 | 用途 | Props | 复杂度 |
|------|------|-------|--------|
| **AIFamilyPanel** | 主入口面板 | `className`, `showHeader`, `defaultView` | ⭐ |
| **FamilyLayout** | 布局容器 | `showHeader`, `defaultView`, `children` | ⭐⭐ |
| **FamilyHome** | 首页仪表盘 | 继承 FamilyLayout props | ⭐⭐ |
| **FamilyMembers** | 家人列表 | `members[]`, `onSelect` | ⭐⭐ |
| **AgentCard** | 单个家人卡片 | `agent`, `onClick`, `showCapabilities` | ⭐⭐⭐ |
| **AgentStatus** | 状态指示器 | `agentId`, `status` | ⭐ |

##### AgentCard 详细 API

```typescript
interface AgentCardProps {
  agent: AgentDefinition  // 来自 @yyc3/core/ai-family
  onClick?: () => void
  showCapabilities?: boolean  // 默认: true，显示前3个能力
}

// AgentDefinition 结构 (来自 @yyc3/core)
interface AgentDefinition {
  id: string
  name: string
  emoji?: string
  role?: string
  description?: string
  capabilities?: Array<{
    name: string
    description: string
  }>
  priority?: number
  maxConcurrentTasks?: number
}
```

---

### 4. Themes (`@yyc3/ui/themes`) — 主题系统

完整的主题解决方案，支持亮/暗/自动三种模式。

```tsx
import {
  ThemeProvider,
  useTheme,
  lightTheme,
  darkTheme,
  themeTokens,
  type Theme,
  type ThemeMode,
} from '@yyc3/ui/themes'

// 基础使用
<ThemeProvider defaultMode="light">
  <App />
</ThemeProvider>

// 自动跟随系统
<ThemeProvider defaultMode="auto">
  <App />  // 自动检测 prefers-color-scheme
</ThemeProvider>

// 在组件中使用
function ThemedComponent() {
  const { theme, mode, setMode } = useTheme()
  
  return (
    <div style={{ color: theme.colors.text }}>
      当前: {mode}
      <button onClick={() => setMode('dark')}>切换暗色</button>
    </div>
  )
}

// 自定义主题 Token
const customTheme: Theme = {
  name: 'Custom',
  colors: {
    ...lightTheme.colors,
    primary: '#6366f1',      // 自定义主色
    secondary: '#8b5cf6',    // 自定义辅色
  }
}

<ThemeProvider defaultMode="light" theme={customTheme}>
  <App />
</ThemeProvider>
```

#### Theme 接口定义

```typescript
interface Theme {
  name: string
  colors: {
    primary: string        // 主色调
    secondary: string      // 辅助色
    background: string     // 背景色
    surface: string        // 表面色
    text: string           // 主文本色
    textSecondary: string  // 次文本色
    border: string         // 边框色
    error: string          // 错误色
    success: string        // 成功色
    warning: string        // 警告色
  }
}

type ThemeMode = 'light' | 'dark' | 'auto'
```

#### CSS 变量映射

ThemeProvider 会自动将主题颜色映射为 CSS 变量：

```css
:root {
  --family-color-primary: {theme.colors.primary};
  --family-color-secondary: {theme.colors.secondary};
  --family-color-background: {theme.colors.background};
  --family-color-surface: {theme.colors.surface};
  --family-color-text: {theme.colors.text};
  --family-color-text-secondary: {theme.colors.textSecondary};
  --family-color-border: {theme.colors.border};
  --family-color-error: {theme.colors.error};
  --family-color-success: {theme.colors.success};
  --family-color-warning: {theme.colors.warning};
}
```

---

## 🌳 子路径导入（Tree Shaking优化）

### 按需引入，最小化打包体积

```typescript
// 全部功能 (~45KB gzipped)
import { ThemeProvider, AIFamilyPanel, Button } from '@yyc3/ui'

// 仅核心模块 (~12KB gzipped)
import { AIFamilyProvider, useAIChat } from '@yyc3/ui/core'

// 仅通用组件 (~18KB gzipped)
import { Button, Card, Input } from '@yyc3/ui/components'

// 仅家庭组件 (~15KB gzipped)
import { AIFamilyPanel, AgentCard } from '@yyc3/ui/family'

// 仅主题系统 (~8KB gzipped)
import { ThemeProvider, useTheme } from '@yyc3/ui/themes'
```

### 可用子路径

| 子路径 | 大小估计(gzipped) | 导出内容 | 适用场景 |
|--------|-------------------|----------|----------|
| `.` | ~45KB | 全部功能 | 小型项目 / 原型开发 |
| `./core` | ~12KB | Context + Hooks | 集成到现有 UI 库 |
| `./components` | ~18KB | 通用 UI 组件 | 需要 Button/Card 等 |
| `./family` | ~15KB | AI Family 面板 | 核心 AI 功能界面 |
| `./themes` | ~8KB | 主题系统 | 仅需主题能力 |

### 打包体积对比

```
场景                      | 未优化 | Tree Shaking后 | 节省
-------------------------|--------|----------------|------
完整导入                  | 45KB   | 45KB           | -
仅用 Family 组件          | 45KB   | 15KB           | 67%
仅用 Button + Card        | 45KB   | 18KB           | 60%
仅用 ThemeProvider        | 45KB   | 8KB            | 82%
```

---

## 📖 API 参考

### 完整导出索引

```typescript
// ====== 主入口 ======
import {
  // Core
  AIFamilyProvider, useAIFamily, useAIChat, useAgentStatus, createAIContext,
  // Components
  Button, Card, Input, Layout, Modal,
  // Family
  AIFamilyPanel, FamilyLayout, FamilyHome, FamilyMembers, AgentCard, AgentStatus,
  // Themes
  ThemeProvider, useTheme, lightTheme, darkTheme, themeTokens,
  // Types
  type Theme, type ThemeMode, type AgentCardProps, type AIFamilyPanelProps,
} from '@yyc3/ui'

// ====== 子路径导入 ======
// Core
import { AIFamilyProvider, useAIChat } from '@yyc3/ui/core'

// Components
import { Button, Card, Input, Layout, Modal } from '@yyc3/ui/components'

// Family
import { AIFamilyPanel, AgentCard, AgentStatus } from '@yyc3/ui/family'

// Themes
import { ThemeProvider, useTheme, lightTheme, darkTheme } from '@yyc3/ui/themes'
```

### 核心 Hooks API

#### useAIChat

```typescript
interface UseAIChatReturn {
  messages: Message[]
  isLoading: boolean
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

const { messages, isLoading, sendMessage } = useAIChat()
```

#### useAgentStatus

```typescript
interface AgentStatusInfo {
  online: boolean
  lastActive?: Date
  currentTask?: string
}

const status: AgentStatusInfo | undefined = useAgentStatus(agentId)
```

#### useTheme

```typescript
interface UseThemeReturn {
  theme: Theme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const { theme, mode, setMode } = useTheme()
```

---

## 🎨 最佳实践

### ✅ 推荐做法

1. **始终包裹 ThemeProvider**
   ```tsx
   <ThemeProvider defaultMode="auto">
     <App />
   </ThemeProvider>
   ```

2. **使用子路径导入优化体积**
   ```tsx
   // 好: 按需导入
   import { AgentCard } from '@yyc3/ui/family'
   
   // 避免: 全量导入
   import { AgentCard } from '@yyc3/ui'
   ```

3. **组合使用 AIFamilyProvider 和 ThemeProvider**
   ```tsx
   <ThemeProvider>
     <AIFamilyProvider>
       <AIFamilyPanel />
     </AIFamilyProvider>
   </ThemeProvider>
   ```

4. **利用 AgentCard 展示智能体信息**
   ```tsx
   <AgentCard 
     agent={agentData} 
     showCapabilities={true}
     onClick={handleInteraction}
   />
   ```

### ❌ 避免做法

1. **不要在 ThemeProvider 外部使用 useTheme**
   ```tsx
   // 错误: 会抛出异常
   function BadComponent() {
     const { theme } = useTheme()  // Error!
   }
   ```

2. **不要忽略 peerDependencies**
   ```bash
   # 必须自行安装 React
   pnpm add react react-dom
   ```

3. **不要直接修改 theme 对象**
   ```tsx
   // 错误: 直接修改
   theme.colors.primary = '#fff'
   
   // 正确: 创建新主题
   const newTheme = { ...theme, colors: { ...theme.colors, primary: '#fff' } }
   ```

---

## 🧪 测试覆盖

### 测试文件

| 文件 | 描述 | 测试数 | 状态 |
|------|------|--------|------|
| `components.test.tsx` | 组件渲染测试 | 15 | ✅ Passed |
| `hooks.test.tsx` | Hooks 逻辑测试 | 10 | ✅ Passed |
| **总计** | | **25** | **✅ All Passed** |

### 运行测试

```bash
# 运行全部测试
pnpm test

# 监听模式
pnpm test --watch

# 覆盖率报告
pnpm test --coverage
```

---

## 🔗 依赖关系

### 运行时依赖

```
@yyc3/ui
├── @yyc3/core ^1.1.0    (必需 - 提供 AgentDefinition 类型)
├── react >=18.0.0        (Peer Dependency - 必须自行安装)
└── react-dom >=18.0.0    (Peer Dependency - 必须自行安装)
```

### 开发依赖

```
@yyc3/ui (devDependencies)
├── typescript ^5.0.0
├── tsup ^8.0.0           (构建工具)
├── vitest ^1.0.0         (测试框架)
├── @testing-library/react ^14.3.1
├── @testing-library/jest-dom ^6.9.1
└── @vitejs/plugin-react ^4.2.1
```

> **注意**: 本包采用**零运行时依赖策略**，除 @yyc3/core 外无其他生产依赖。

---

## ❓ 常见问题

### Q1: 如何解决 "useTheme must be used within ThemeProvider" 错误？

确保组件树被 `<ThemeProvider>` 包裹：

```tsx
// ✅ 正确
<ThemeProvider>
  <MyComponent />  {/* 使用 useTheme */}
</ThemeProvider>

// ❌ 错误
<MyComponent />  {/* 缺少 ThemeProvider */}
```

### Q2: 如何自定义主题颜色？

创建自定义 Theme 对象并传递给 ThemeProvider：

```tsx
const myTheme: Theme = {
  name: 'Brand Theme',
  colors: {
    primary: '#your-brand-color',
    secondary: '#your-secondary-color',
    // ... 其他颜色
  }
}

<ThemeProvider theme={myTheme}>
  <App />
</ThemeProvider>
```

### Q3: AgentCard 不显示 emoji 怎么办？

确保 AgentDefinition 对象包含 emoji 字段：

```tsx
const agent: AgentDefinition = {
  id: 'meta-oracle',
  name: '元启·天枢',
  emoji: '🧠',  // ← 添加此字段
  // ...
}

<AgentCard agent={agent} />
```

### Q4: 如何实现暗色模式持久化？

结合 localStorage 使用：

```tsx
function PersistentThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme-mode') as ThemeMode) || 'auto'
    }
    return 'auto'
  })

  useEffect(() => {
    localStorage.setItem('theme-mode', mode)
  }, [mode])

  return <ThemeProvider defaultMode={mode}>{children}</ThemeProvider>
}
```

### Q5: Tree Shaking 不生效怎么办？

1. 确保使用 ES Module (`import` 语法)
2. 确保构建工具支持 Tree Shaking (Webpack 4+, Vite, Rollup)
3. 使用子路径导入而非主入口

---

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 开发流程

```bash
# 克隆仓库
git clone https://github.com/YanYuCloudCube/Family-PAI.git

# 安装依赖
pnpm install

# 进入 UI 包目录
cd packages/family-ui

# 开发模式 (监听文件变化)
pnpm dev

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 构建
pnpm build
```

### 代码规范

- 使用 TypeScript 编写
- 遵循现有组件命名约定
- 为公共 API 添加 JSDoc 注释
- 新增组件需包含对应测试

---

## 📄 License

MIT © [YYC³ AI Team](https://github.com/YanYuCloudCube/Family-PAI)

---

*YYC³ AI Family — 八位拟人化AI家人的智能中枢*

**五高 · 五标 · 五化 · 五维**

---

*文档版本: 1.1.1 | 最后更新: 2026-04-24*
