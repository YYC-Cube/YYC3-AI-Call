# 🎯 @yyc3/core

<p align="center">
  <strong>YYC³ AI Family 核心包</strong><br/>
  <em>统一认证 · MCP协议 · 技能系统 · 八位AI家人智能体 · 多模态处理</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@yyc3/core"><img src="https://img.shields.io/npm/v/@yyc3/core.svg?style=flat-square" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/@yyc3/core"><img src="https://img.shields.io/npm/dt/@yyc3/core.svg?style=flat-square" alt="npm downloads"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"/></a>
  <a href="https://github.com/YanYuCloudCube/Family-PAI"><img src="https://img.shields.io/badge/GitHub-Family--PAI-black?style=flat-square&logo=github" alt="GitHub"/></a>
</p>

---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*

---

## 目录

- [✨ 核心特性](#-核心特性)
- [📦 安装](#-安装)
- [🚀 快速开始](#-快速开始)
- [📖 子路径导入](#-子路径导入treeshaking优化)
- [🏗️ 架构设计](#-架构设计)
- [🔌 模块详解](#-模块详解)
- [📚 API参考](#api参考)
- [⚙️ 配置选项](#️-配置选项)
- [🧪 测试](#-测试)
- [🤝 贡献指南](#-贡献指南)
- [📄 维护指南](#-维护指南)
- [📜 License](#-license)

---

## ✨ 核心特性

### 🔐 统一认证系统
- **多Provider支持** — OpenAI / Ollama / Anthropic 统一接口
- **智能切换** — 自动检测可用Provider，无缝回退
- **安全验证** — Zod Schema运行时校验，防止注入攻击
- **即拉即用** — 零配置启动，自动环境检测

### 🤖 八位AI家人智能体
- **Agent架构** — 分层设计(基础层→能力层→决策层→编排层)
- **协作引擎** — 多Agent任务分配与协调
- **质量门控** — 五级质量标准确保输出可靠性
- **技能组合** — 动态技能学习与推荐

### 🔌 MCP协议支持
- **客户端集成** — 标准MCP Client实现
- **传输层** — Stdio/HTTP多协议支持
- **工具调用** — AI Agent工具链扩展
- **服务器管理** — 生命周期与状态监控

### 💪 技能系统
- **内置技能库** — 24+行业专业技能
- **技能组合器** — 复合技能动态编排
- **技能学习器** — 从交互中持续优化
- **质量评估** — 技能输出自动评分

### 🎭 多模态处理
- **音频处理** — STT/TTS语音转换
- **图像分析** — 视觉理解与描述生成
- **文档处理** — PDF/Word/Markdown解析
- **多媒体融合** — 跨模态信息整合

### ⚡ 即拉即用系统(NPM Ready)
- **AutoDetector** — 自动检测运行环境
- **QuickStarter** — 一行代码启动
- **SmartSelector** — 智能选择最优Provider
- **状态管理** — 完整生命周期控制

---

## 📦 安装

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐)

### 安装命令

```bash
# pnpm (推荐)
pnpm add @yyc3/core

# npm
npm install @yyc3/core

# yarn
yarn add @yyc3/core
```

### Peer Dependencies（可选）

```bash
# 如需OpenAI模型支持
pnpm add openai

# 如需Ollama本地模型
pnpm add ollama

# 如需Anthropic Claude
pnpm add @anthropic-ai/sdk
```

---

## 🚀 快速开始

### 1. 一行代码启动（即拉即用）

```typescript
import { QuickStarter } from '@yyc3/core';

const system = await QuickStarter.start();
console.log('✅ YYC³ Family AI 已启动');
console.log('当前Provider:', system.getProvider());
console.log('可用Agent数:', system.getAgents().length);
```

### 2. 使用统一认证

```typescript
import { UnifiedAuth, AuthType } from '@yyc3/core/auth';

const auth = new UnifiedAuth({
  providers: [
    { type: AuthType.Ollama, host: 'http://localhost:11434' },
    { type: AuthType.OpenAI, apiKey: process.env.OPENAI_API_KEY }
  ],
  autoSwitch: true,
  fallbackOrder: ['ollama', 'openai']
});

// 认证并获取客户端
const client = await auth.authenticate();
const response = await client.chat('你好');
```

### 3. 管理AI Agent

```typescript
import { AgentManager } from '@yyc3/core/ai-family';

const manager = new AgentManager();

// 获取所有可用Agent
const agents = await manager.listAgents();

// 创建复合任务
const result = await manager.executeCompositeTask({
  task: '分析市场趋势',
  agents: ['analyst', 'predictor', 'researcher'],
  mode: 'parallel'
});
```

### 4. MCP协议集成

```typescript
import { MCPClient } from '@yyc3/core/mcp';

const client = new MCPClient({
  transport: 'stdio',
  serverPath: '/path/to/mcp-server'
});

await client.connect();

// 调用MCP工具
const tools = await client.listTools();
const result = await client.callTool('search', { query: 'TypeScript' });
```

### 5. 多模态处理

```typescript
import { MultimodalManager } from '@yyc3/core/multimodal';

const mm = new MultimodalManager();

// 语音转文字
const text = await mm.audio.process('./audio.wav');

// 图像描述
const description = await mm.image.analyze('./photo.jpg');

// 文档解析
const content = await mm.document.parse('./report.pdf');
```

---

## 📖 子路径导入（Tree Shaking优化）

```typescript
// 仅导入认证模块 (~15KB gzipped)
import { UnifiedAuth } from '@yyc3/core/auth';

// 仅导入MCP模块 (~12KB gzipped)
import { MCPClient } from '@yyc3/core/mcp';

// 仅导入技能系统 (~18KB gzipped)
import { SkillManager } from '@yyc3/core/skills';

// 仅导入AI Family (~20KB gzipped)
import { AgentManager } from '@yyc3/core/ai-family';

// 仅导入多模态 (~16KB gzipped)
import { MultimodalManager } from '@yyc3/core/multimodal';
```

### 可用子路径

| 子路径 | 大小估计(gzipped) | 导出内容 |
|--------|-------------------|----------|
| `.` | ~35KB | 全部功能 |
| `./auth` | ~15KB | 统一认证系统 |
| `./mcp` | ~12KB | MCP协议客户端 |
| `./skills` | ~18KB | 技能管理系统 |
| `./ai-family` | ~20KB | AI Family智能体 |
| `./multimodal` | ~16KB | 多模态处理器 |

---

## 🏗️ 架构设计

### 项目结构

```
@yyc3/core/
├── src/
│   ├── index.ts              # 统一入口 + Setup/QuickStarter
│   ├── types.ts              # 全局类型定义
│   │
│   ├── auth/                 # 🔐 认证系统
│   │   ├── unified-auth.ts   # 统一认证核心
│   │   ├── auth-switcher.ts  # Provider切换器
│   │   ├── openai-provider.ts
│   │   ├── ollama-provider.ts
│   │   └── types.ts
│   │
│   ├── mcp/                  # 🔌 MCP协议
│   │   ├── client.ts         # MCP客户端
│   │   ├── transport.ts      # 传输层实现
│   │   └── types.ts
│   │
│   ├── skills/               # 💪 技能系统
│   │   ├── manager.ts        # 技能管理器
│   │   ├── builtin.ts        # 内置技能库
│   │   ├── skill-composer.ts # 技能组合器
│   │   ├── skill-learner.ts  # 技能学习器
│   │   └── types.ts
│   │
│   ├── ai-family/            # 🤖 AI Family
│   │   ├── manager.ts        # Agent管理器
│   │   ├── base-agent.ts     # 基础Agent抽象
│   │   ├── agents.ts         # 八位家人实现
│   │   ├── agent-router.ts   # 任务路由
│   │   ├── agent-collaboration.ts  # 协作引擎
│   │   └── types.ts
│   │
│   ├── multimodal/           # 🎭 多模态
│   │   ├── manager.ts        # 多模态管理器
│   │   ├── audio-processor.ts
│   │   ├── image-processor.ts
│   │   ├── document-processor.ts
│   │   └── types.ts
│   │
│   └── setup/                # ⚡ 即拉即用
│       ├── auto-detector.ts  # 环境检测
│       ├── quick-starter.ts  # 快速启动
│       └── smart-selector.ts # Provider选择
│
├── dist/                     # 构建输出 (ESM)
└── __tests__/                # 测试文件
```

### 依赖关系图

```
                    ┌─────────────┐
                    │   index.ts  │
                    │  (Setup)    │
                    └──────┬──────┘
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                      ▼
┌───────────┐      ┌────────────┐         ┌────────────┐
│   auth/   │      │ ai-family/ │         │ multimodal/│
│  (15KB)   │      │  (20KB)    │         │  (16KB)     │
└─────┬─────┘      └─────┬──────┘         └─────┬──────┘
      │                  │                       │
      │           ┌──────┴──────┐               │
      │           ▼             ▼               │
      │    ┌──────────┐  ┌──────────┐          │
      │    │  mcp/    │  │  skills/ │          │
      │    │ (12KB)   │  │ (18KB)   │          │
      │    └──────────┘  └──────────┘          │
      │                                        │
      └────────────────────────────────────────┘
                        │
                 ┌──────▼──────┐
                 │  types.ts   │
                 │  zod schemas│
                 └─────────────┘
```

---

## 🔌 模块详解

### 认证系统 (auth)

**功能**: 提供统一的AI Provider认证接口

```typescript
interface UnifiedAuthConfig {
  providers: Array<{
    type: AuthType.OpenAI | AuthType.Ollama | AuthType.Anthropic;
    config?: Record<string, any>;
  }>;
  autoSwitch?: boolean;      // 自动故障转移
  fallbackOrder?: string[];  // 回退顺序
}
```

**使用场景**:
- 需要同时支持多个AI Provider的应用
- 要求高可用的生产环境
- 希望透明切换Provider的用户

### MCP协议 (mcp)

**功能**: Model Context Protocol 标准客户端实现

**特性**:
- 支持Stdio和HTTP传输
- 工具发现与调用
- 资源访问与管理
- 生命周期管理

### 技能系统 (skills)

**功能**: 可扩展的技能管理与组合框架

**内置技能分类**:
- 开发技能: 代码生成、调试、重构、测试
- 分析技能: 数据分析、报告生成、可视化
- 创意技能: 写作、翻译、头脑风暴
- 安全技能: 审计、扫描、合规检查

### AI Family (ai-family)

**功能**: 八位拟人化AI家人的管理与协作

**Agent分层架构**:
1. **基础层** (BaseAgent): 通信、记忆、状态管理
2. **能力层** (Capabilities): 专业领域知识
3. **决策层** (Decision): 推理与判断逻辑
4. **编排层** (Orchestration): 多Agent协调

### 多模态 (multimodal)

**功能**: 跨模态数据处理与理解

**支持的格式**:
- 音频: WAV, MP3, OGG → 文本
- 图像: JPEG, PNG, SVG → 描述
- 文档: PDF, DOCX, MD → 结构化数据

---

## 📚 API参考

### QuickStarter (推荐入口)

```typescript
class QuickStarter {
  static async start(options?: StartOptions): Promise<YYC3System>;
  
  getProvider(): ProviderInfo;
  getAgents(): Agent[];
  getStatus(): SystemStatus;
  shutdown(): Promise<void>;
}
```

### UnifiedAuth

```typescript
class UnifiedAuth {
  constructor(config: UnifiedAuthConfig);
  
  authenticate(): Promise<AuthProvider>;
  switchProvider(type: AuthType): Promise<void>;
  getStatus(): AuthStatus;
}
```

### AgentManager

```typescript
class AgentManager {
  listAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent>;
  executeTask(task: TaskRequest): Promise<TaskResult>;
  executeCompositeTask(request: CompositeTaskRequest): Promise<CompositeResult>;
}
```

完整API文档请查看[类型定义文件](./dist/index.d.ts)。

---

## ⚙️ 配置选项

### StartOptions

```typescript
interface StartOptions {
  preferredProvider?: AuthType;
  enableCache?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  maxConcurrentTasks?: number;
}
```

---

## 🧪 测试

### 运行测试

```bash
# 运行全部测试
pnpm test

# 监听模式
pnpm test:watch

# 类型检查
pnpm typecheck
```

### 测试覆盖情况

| 模块 | 测试文件 | 用例数 | 通过率 |
|------|----------|--------|--------|
| Auth | auth.test.ts | 19 | ✅ 100% |
| Auth System | auth-system.test.ts | 29 | ✅ 100% |
| Skills | skills.test.ts | 20 | ✅ 100% |
| Skill System | skill-system.test.ts | 30 | ✅ 100% |
| Multimodal | multimodal.test.ts | 15 | ✅ 100% |
| AI Family | ai-family.test.ts | 24 | ✅ 100% |
| Agent Architecture | agent-architecture.test.ts | 26 | ✅ 100% |
| MCP | mcp.test.ts | 9 | ✅ 100% |
| Core | core.test.ts | 10 | ✅ 100% |
| Setup System | setup-system.test.ts | 30 (+5 skipped) | ✅ 100%* |
| **总计** | **10 files** | **212** (+5 skipped) | **✅ 100%** |

*\*5个跳过的测试需要真实的API密钥*

---

## 🤝 贡献指南

欢迎贡献！请遵循以下流程：

```bash
# Fork & Clone
git clone https://github.com/YanYuCloudCube/Family-PAI.git
cd packages/core

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 运行测试
pnpm test && pnpm typecheck && pnpm lint

# 提交PR
```

### 代码规范

- TypeScript strict模式
- ESLint + Prettier格式化
- Zod Schema进行运行时验证
- JSDoc注释要求
- 测试覆盖率目标 >85%

---

## 📄 维护指南

详细维护信息请查看 [MAINTENANCE.md](./MAINTENANCE.md)，包含：

- 版本发布流程
- 问题排查指南
- 性能优化建议
- 安全更新流程
- 依赖管理策略
- 监控与告警配置

---

## 📜 License

MIT © [YanYuCloudCube Team](mailto:admin@0379.email)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***言启象限 \| 语枢未来***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
**Made with ❤️ by YYC³ AI Family Team**

</div>
