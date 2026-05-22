---
@file: YYC³ 9包资源映射与集成指南
@description: 9个@yyc3/* npm包的能力、API、与企业管理系统模块映射
@author: YYC³团队
@version: 1.0.0
@created: 2026-05-01
@tags: npm包,资源映射,集成指南,@yyc3
---
# YYC³ 9包资源映射与集成指南

## 发布验证

| # | 包名                  | 版本  | npm 状态      | 本地源码                                                |
| - | --------------------- | ----- | ------------- | ------------------------------------------------------- |
| 1 | `@yyc3/core`        | 1.4.0 | ✅ 已发布     | `/Volumes/Development/YYC3-π³/packages/core`        |
| 2 | `@yyc3/ai-hub`      | 1.4.0 | ✅ 已发布     | `/Volumes/Development/YYC3-π³/packages/ai-hub`      |
| 3 | `@yyc3/emotion`     | 1.0.0 | ✅ 全新发布   | `/Volumes/Development/YYC3-π³/packages/emotion`     |
| 4 | `@yyc3/i18n-core`   | 2.4.0 | ✅ 已发布     | `/Volumes/Development/YYC3-π³/packages/i18n-core`   |
| 5 | `@yyc3/ui`          | 2.0.0 | ✅ 大版本升级 | `/Volumes/Development/YYC3-π³/packages/ui`          |
| 6 | `@yyc3/plugins`     | 1.4.0 | ✅ 已发布     | `/Volumes/Development/YYC3-π³/packages/plugins`     |
| 7 | `@yyc3/mcp-servers` | 1.0.0 | ✅ 全新发布   | `/Volumes/Development/YYC3-π³/packages/mcp-servers` |
| 8 | `@yyc3/motion`      | 1.0.0 | ✅ 全新发布   | `/Volumes/Development/YYC3-π³/packages/motion`      |
| 9 | `@yyc3/cli`         | 1.0.0 | ✅ 全新发布   | `/Volumes/Development/YYC3-π³/packages/cli`         |

---

## 各包能力详解

### 1. @yyc3/core@1.4.0 — AI Family 核心引擎

**描述**: 统一认证、MCP协议、技能系统、八位AI家人智能体、多模态处理

**子路径导出**:

```typescript
import { ... } from '@yyc3/core'           // 主入口
import { ... } from '@yyc3/core/auth'       // 认证模块
import { ... } from '@yyc3/core/mcp'        // MCP协议
import { ... } from '@yyc3/core/skills'     // 技能系统
```

**企业管理系统集成点**:

- 智能体核心 → 替代当前 `lib/agentic-core/`
- 认证模块 → 替代当前 `lib/security/`
- MCP协议 → 替代当前 `lib/nocodb-api.ts` 通信层
- 技能系统 → 新增 AI 能力注册机制

**映射模块**: 闭环五(AI赋能) · 闭环六(系统底座)

---

### 2. @yyc3/ai-hub@1.4.0 — AI 集成中心

**描述**: 八位家人/Family Compass时钟罗盘/错误码体系/工作流引擎

**子路径导出**:

```typescript
import { ... } from '@yyc3/ai-hub'           // 主入口
import { ... } from '@yyc3/ai-hub/family'     // 八位家人
```

**企业管理系统集成点**:

- Family Compass → 智能决策中心仪表盘
- 八位家人 → 替代当前 `lib/ai-family.ts` 的7智能体
- 工作流引擎 → 替代当前 `lib/form-engine.ts` 审批流
- 错误码体系 → 统一 API 错误处理

**映射模块**: 闭环五(AI赋能) · 闭环四(办公协同-审批)

---

### 3. @yyc3/emotion@1.0.0 — 情感引擎

**描述**: 多模态情感融合 + 情绪音乐桥接 + 事件总线

**子路径导出**:

```typescript
import { ... } from '@yyc3/emotion'          // 主入口
import { ... } from '@yyc3/emotion/engine'    // 情感引擎
```

**企业管理系统集成点**:

- 员工情感分析 → 人资管理域 员工关怀
- 客户情感分析 → 客户满意度评分
- 团队氛围检测 → 团队协作效能
- 事件总线 → 替代当前 SimpleEventEmitter

**映射模块**: 闭环一(人资管理-员工关怀) · 闭环五(AI赋能-自然语言)

---

### 4. @yyc3/i18n-core@2.4.0 — 国际化框架

**描述**: ICU/AI翻译/MCP/10语言/零依赖

**子路径导出**:

```typescript
import { ... } from '@yyc3/i18n-core'  // 主入口 (已在使用)
```

**企业管理系统集成点**:

- 已在主站项目中使用 (locales/*.ts)
- 企业管理系统可直接复用10语言文件
- AI翻译 → 自动翻译新增模块文案

**映射模块**: 全局(所有模块的国际化支持)

---

### 5. @yyc3/ui@2.0.0 — React UI 组件库

**描述**: 60+组件/shadcn/ui标准组件/Family组件/主题系统

**子路径导出**:

```typescript
import { ... } from '@yyc3/ui'              // 主入口
import { ... } from '@yyc3/ui/core'          // 核心组件
import { ... } from '@yyc3/ui/components'    // 组件集合
import { ... } from '@yyc3/ui/family'        // Family组件
```

**企业管理系统集成点**:

- 替代当前 `components/ui/` 中的35个基础组件
- Family组件 → AI智能体UI
- 主题系统 → 统一深色/浅色/品牌主题
- 表格/表单/图表 → 所有 smart-* 页面

**映射模块**: 全局(所有模块的UI基础)

---

### 6. @yyc3/plugins@1.4.0 — 插件集合

**描述**: LSP语言服务器(4) + 内容处理(4)

**子路径导出**:

```typescript
import { ... } from '@yyc3/plugins'         // 主入口
import { ... } from '@yyc3/plugins/lsp'      // LSP插件
import { ... } from '@yyc3/plugins/content'  // 内容处理
```

**企业管理系统集成点**:

- 内容处理 → 文档协同 (Word/PDF/Markdown解析)
- LSP → 智能搜索 (代码/文本语义搜索)
- 内容转换 → 数据导入导出

**映射模块**: 闭环四(办公协同-文档/搜索)

---

### 7. @yyc3/mcp-servers@1.0.0 — MCP 服务器

**描述**: 注册表/服务端/协议实现

**子路径导出**:

```typescript
import { ... } from '@yyc3/mcp-servers'       // 主入口
import { ... } from '@yyc3/mcp-servers/types'  // 类型定义
import { ... } from '@yyc3/mcp-servers/registry' // 注册表
```

**企业管理系统集成点**:

- MCP协议 → 统一 AI 工具调用标准
- 注册表 → 管理 AI 能力注册/发现
- 服务端 → 替代当前各 API 的独立实现

**映射模块**: 闭环五(AI赋能) · 闭环六(系统底座)

---

### 8. @yyc3/motion@1.0.0 — 统一动效系统

**描述**: CSS/WAAPI/Framer Motion 三层渐进式架构

**子路径导出**:

```typescript
import { ... } from '@yyc3/motion'        // 主入口
import { ... } from '@yyc3/motion/css'     // CSS动效
import { ... } from '@yyc3/motion/waapi'   // Web Animations API
import { ... } from '@yyc3/motion/framer'  // Framer Motion
```

**企业管理系统集成点**:

- 页面切换动效 → 所有 smart-* 页面
- 数据加载动画 → 骨架屏/进度条
- 交互反馈 → 按钮点击/表单提交/卡片展开
- 图表动效 → 数据可视化过渡

**映射模块**: 全局(所有模块的动效基础)

---

### 9. @yyc3/cli@1.0.0 — CLI 工具

**描述**: YYC³ UI 智能编程库命令行工具

**子路径导出**:

```typescript
import { ... } from '@yyc3/cli'  // 主入口
```

**企业管理系统集成点**:

- 快速生成 smart-* 页面脚手架
- 批量生成模块代码
- 自动化测试生成

**映射模块**: 开发工具(非运行时)

---

## 分类闭环集成优先级

### 第一波: 闭环一(人资) + 闭环五(AI) 集成

| 包                | 集成目标                      | 替代/增强               | 优先级 |
| ----------------- | ----------------------------- | ----------------------- | ------ |
| `@yyc3/core`    | 智能体核心 → smart-decision  | 替代 `agentic-core`   | P0     |
| `@yyc3/ai-hub`  | 八位家人 → smart-recruit     | 替代 `ai-family.ts`   | P0     |
| `@yyc3/emotion` | 员工情感 → smart-hr 员工关怀 | 新增能力                | P0     |
| `@yyc3/ui`      | 组件库 → smart-* 页面增强    | 替代 `components/ui/` | P1     |

### 第二波: 闭环四(办公) + 闭环二(财务) 集成

| 包                    | 集成目标               | 替代/增强 | 优先级 |
| --------------------- | ---------------------- | --------- | ------ |
| `@yyc3/plugins`     | 内容处理 → smart-docs | 增强      | P1     |
| `@yyc3/mcp-servers` | MCP → smart-approval  | 增强      | P1     |
| `@yyc3/i18n-core`   | 国际化 → 全模块       | 增强      | P2     |

### 第三波: 全局增强

| 包               | 集成目标           | 替代/增强 | 优先级 |
| ---------------- | ------------------ | --------- | ------ |
| `@yyc3/motion` | 动效 → 全页面     | 新增      | P2     |
| `@yyc3/cli`    | 脚手架 → 开发效率 | 开发工具  | P3     |

---

## 安装方式

由于 `@yyc3/ai-hub` 内部使用 `workspace:^` 协议，标准 npm/pnpm/bun 无法直接安装。
使用本地源码拷贝方式：

```bash
# 从 monorepo 源码拷贝到 node_modules
cd yyc3-mana
mkdir -p node_modules/@yyc3
for pkg in core ai-hub emotion i18n-core ui plugins mcp-servers motion cli; do
  cp -r "/Volumes/Development/YYC3-π³/packages/$pkg" "node_modules/@yyc3/$pkg"
  rm -rf "node_modules/@yyc3/$pkg/node_modules"
done
```

---

*文档生成时间: 2026-05-01*
*YYC³ — 言启万象 · 语枢未来*