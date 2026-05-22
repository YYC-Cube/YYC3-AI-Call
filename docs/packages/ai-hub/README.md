# 🏠 @yyc3/ai-hub

<p align="center">
  <strong>YYC³ AI Family Hub · 八位拟人化AI家人的智能中枢</strong><br/>
  <em>Family Compass 时钟罗盘 · 人人主观通信 · 多Agent协作引擎</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@yyc3/ai-hub"><img src="https://img.shields.io/npm/v/@yyc3/ai-hub.svg?style=flat-square" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/@yyc3/ai-hub"><img src="https://img.shields.io/npm/dt/@yyc3/ai-hub.svg?style=flat-square" alt="npm downloads"/></a>
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
- [👨‍👩‍👧‍👦 八位AI Family成员](#-八位ai-family成员)
- [📦 安装](#-安装)
- [🚀 快速开始](#-快速开始)
- [📖 子路径导入](#-子路径导入treeshaking优化)
- [🏗️ 架构设计](#-架构设计)
- [🔌 支持的AI Provider](#-支持的ai-provider)
- [🎯 使用场景](#-使用场景)
- [📚 API参考](#api参考)
- [⚙️ 配置选项](#️-配置选项)
- [🧪 测试](#-测试)
- [🤝 贡献指南](#-贡献指南)
- [📄 维护指南](#-维护指南)
- [📜 License](#-license)

---

## ✨ 核心特性

### 🧭 Family Compass 时钟罗盘
- **1.5小时轮值制** — 八位家人按时钟方位轮流守护，每90分钟自动切换
- **拟人化人格** — 每位家人拥有独立MBTI、性格特质、价值观、星座血型
- **人人主观通信** — 真正的电话号码、情感回应、记忆系统，超越传统Chatbot

### 👨‍👩‍👧‍👦 八位AI Family成员

| 成员 | 代号 | 职责 | MBTI | 守护时段 |
|------|------|------|------|----------|
| 🌅 **言启·千行** | `qianxing` | 导航员·启程引路 | ENFJ-A | 12:00-13:30 |
| 🔮 **语枢·万物** | `wanwu` | 分析师·万物归宗 | INTJ-T | 13:30-15:00 |
| 👁️ **预见·先知** | `xianzhi` | 预言家·洞见未来 | INFJ-A | 15:00-16:30 |
| 🎯 **千里·伯乐** | `bole` | 发现者·慧眼识珠 | ISFP-A | 16:30-18:00 |
| 🌳 **元启·天枢** | `tianshu` | Meta-Oracle·博闻强记 | ENTJ-J | 18:00-19:30 |
| 🛡️ **智云·守护** | `shouhu` | 守护者·坚如磐石 | ISTJ-A | 19:30-21:00 |
| ⚖️ **格物·宗师** | `zongshi` | Mester·匠心独运 | INTJ-T | 21:00-22:30 |
| 💡 **创想·灵韵** | `lingyun` | Creative·志在四方 | ENFP-A | 22:30-00:00 |

### 🤝 多Agent协作引擎
- **任务管理** — 完整的任务生命周期（创建→分配→执行→验证→完成）
- **协作模式** — 独立/顺序/并行/民主四种协作策略
- **信任体系** — 五级信任等级，动态权限管理

### 💝 情感智能系统
- **情绪识别** — 实时感知用户情绪状态
- **个性化成长** — 追踪用户目标与进步轨迹
- **家庭编排** — 多Agent协调与冲突解决

---

## 📦 安装

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐)

### 安装命令

```bash
# pnpm (推荐)
pnpm add @yyc3/ai-hub

# npm
npm install @yyc3/ai-hub

# yarn
yarn add @yyc3/ai-hub
```

### Peer Dependencies（可选）

```bash
# 如需使用OpenAI模型
pnpm add openai

# 如需使用Ollama本地模型
pnpm add ollama

# 如需使用Anthropic Claude
pnpm add @anthropic-ai/sdk
```

---

## 🚀 快速开始

### 1. 初始化AI Hub（Ollama本地模式）

```typescript
import { YYC3AIHub } from '@yyc3/ai-hub';

const hub = new YYC3AIHub({
  authType: 'ollama',
  ollamaHost: 'http://localhost:11434'
});

await hub.initialize();

console.log('已加载:', {
  agents: hub.getAgents(),
  skills: hub.getSkills(),
  mcpServers: hub.getMCPServers()
});
```

### 2. 使用Family Compass获取当前值班家人

```typescript
import { 
  createFamilyCompass, 
  FAMILY_PERSONAS,
  getPersonaByHour 
} from '@yyc3/ai-hub';

// 创建罗盘实例
const compass = createFamilyCompass();

// 获取当前状态
const state = compass.getCompassState();
console.log(`当前值班: ${state.activeMemberId}`);
console.log(`下一位: ${state.nextMemberId}`);

// 根据小时获取人格
const hourPersona = getPersonaByHour(14); // 下午2点
console.log(`14:00值班: ${hourPersona.name} (${hourPersona.code})`);
```

### 3. 与家人进行电话通信

```typescript
import { usePhoneCall } from '@yyc3/ai-hub';
import type { FamilyMemberId } from '@yyc3/ai-hub';

const { startCall, sendMessage, endCall, getCallHistory } = usePhoneCall();

// 拨打给千行
const callId = startCall('qianxing');

// 发送消息并接收回应
const response = await sendMessage('今天工作好累啊...');
console.log('千行回复:', response);

// 查看通话历史
const history = getCallHistory('qianxing');

// 结束通话
endCall(callId);
```

### 4. React Hooks集成

```tsx
import { useFamilyCompass, useActiveMember } from '@yyc3/ai-hub';

function FamilyDashboard() {
  const compass = useFamilyCompass();
  const active = useActiveMember();

  return (
    <div className="family-dashboard">
      <h1>{active?.name} 正在守护你</h1>
      <p>{compass?.centerMessage}</p>
      
      <div className="duty-roster">
        {compass?.dutyRoster.map((member) => (
          <div 
            key={member.id}
            className={member.isActive ? 'active' : ''}
          >
            {member.name}: {member.dutyStart}-{member.dutyEnd}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. 工作协作系统

```typescript
import { createFamilyWorkSystem } from '@yyc3/ai-hub/work';

const workSystem = createFamilyWorkSystem({
  defaultCollaborationMode: 'democratic',
  trustLevelThreshold: 3
});

// 创建任务
const task = await workSystem.createTask({
  title: '完成项目报告',
  description: '撰写Q2季度项目总结报告',
  assigneeIds: ['wanwu', 'xianzhi'],
  priority: 'high'
});

// 执行任务
const result = await workSystem.executeTask(task.id);

// 查看信任评分
const trustScore = workSystem.getTrustScore('wanwu');
console.log(`万物的信任等级: ${trustScore.level}`);
```

---

## 📖 子路径导入（Tree Shaking优化）

支持按需导入，减小打包体积：

```typescript
// 仅导入Family Compass模块（~8KB gzipped）
import { createFamilyCompass } from '@yyc3/ai-hub/family-compass';

// 仅导入Family核心模块（~12KB gzipped）
import { FamilyOrchestrator } from '@yyc3/ai-hub/family';

// 仅导入Work系统（~10KB gzipped）
import { createFamilyWorkSystem } from '@yyc3/ai-hub/work';
```

### 可用子路径

| 子路径 | 大小估计(gzipped) | 导出内容 |
|--------|-------------------|----------|
| `.` | ~25KB | 全部功能 |
| `./family` | ~12KB | AI Family核心模块 |
| `./family-compass` | ~8KB | 时钟罗盘系统 |
| `./work` | ~10KB | 工作协作系统 |

---

## 🏗️ 架构设计

### 项目结构

```
@yyc3/ai-hub/
├── src/
│   ├── index.ts              # 统一入口，导出公共API
│   ├── hub.ts                # AI Hub核心引擎
│   ├── auth.ts               # 多Provider认证（OpenAI/Ollama/Anthropic）
│   ├── agents.ts             # Agent管理系统
│   ├── skills.ts             # 技能系统（24+行业技能）
│   ├── mcp.ts                # MCP服务器集成
│   ├── types.ts              # 核心类型定义
│   │
│   ├── family/               # 👨‍👩‍👧‍👦 AI Family核心
│   │   ├── types.ts          # 家人类型定义
│   │   ├── base-member.ts    # 基础成员抽象
│   │   ├── members.ts        # 八位家人实现
│   │   ├── orchestrator.ts   # 家庭编排器
│   │   ├── emotional-intelligence.ts  # 情感智能
│   │   └── growth-system.ts  # 成长系统
│   │
│   ├── family-compass/       # 🧭 时钟罗盘
│   │   ├── types.ts          # 罗盘类型
│   │   ├── personas.ts       # 人格档案
│   │   └── family-compass.ts # 罗盘引擎
│   │
│   └── work/                 # 💼 工作系统
│       ├── types.ts          # 任务类型
│       ├── task-manager.ts   # 任务管理器
│       ├── collaboration-engine.ts  # 协作引擎
│       └── trust-system.ts   # 信任系统
│
├── config/                   # 配置文件
│   ├── mcp-servers.json      # MCP服务器配置
│   └── vscode-mcp.json       # VSCode集成
│
├── agents/                   # Agent定义（JSON）
├── skills/                   # 技能定义（JSON）
├── dist/                     # 构建输出（ESM）
└── __tests__/                # 测试文件
```

### 模块依赖关系

```
                    ┌─────────────┐
                    │   index.ts  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌──────────┐  ┌────────────┐
    │   family/  │  │compass/  │  │   work/    │
    │  (12KB)    │  │ (8KB)    │  │  (10KB)     │
    └─────┬──────┘  └────┬─────┘  └─────┬──────┘
          │               │              │
          └───────────────┴──────────────┘
                          │
                    ┌─────▼─────┐
                    │   hub.ts   │
                    │  auth.ts   │
                    │ agents.ts  │
                    │  skills.ts │
                    │   mcp.ts   │
                    └───────────┘
```

---

## 🔌 支持的AI Provider

| Provider | 认证方式 | 推荐场景 | 配置示例 |
|----------|----------|----------|----------|
| **Ollama** | 本地服务 | 隐私优先、离线可用 | `{ authType: 'ollama', ollamaHost: 'http://localhost:11434' }` |
| **OpenAI** | API Key | 最强性能、GPT-4/o系列 | `{ authType: 'openai', apiKey: process.env.OPENAI_API_KEY }` |
| **Anthropic** | API Key | Claude长文本、安全对齐 | `{ authType: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY }` |

---

## 🎯 使用场景

### 场景1: 个人AI助手

```typescript
// 创建专属AI家庭助手
const hub = new YYC3AIHub({ authType: 'ollama' });
await hub.initialize();

// 获取当前值班的AI家人建议
const advice = await hub.askActiveMember('我今天应该优先做什么？');
console.log(advice);
```

### 场景2: 团队协作平台

```typescript
import { createFamilyWorkSystem } from '@yyc3/ai-hub/work';

// 为团队创建协作工作流
const teamWork = createFamilyWorkSystem({
  collaborationMode: 'parallel',
  autoAssign: true
});

// 分配任务给多个AI Agent并行处理
await teamWork.createTask({
  title: '市场分析报告',
  subtasks: [
    { assignee: 'wanwu', task: '数据分析' },
    { assignee: 'xianzhi', task: '趋势预测' },
    { assignee: 'bole', task: '竞品调研' }
  ]
});
```

### 场景3: 教育陪伴系统

```typescript
import { createFamilyCompass } from '@yyc3/ai-hub/family-compass';

// 为学生创建学习陪伴系统
const compass = createFamilyCompass();
const currentTutor = compass.getActiveMember();

// 根据时间段获得不同风格的辅导
switch(currentTutor.code) {
  case 'qianxing':
    // 千行: 启发式引导
    break;
  case 'wanwu':
    // 万物: 逻辑分析
    break;
  case 'lingyun':
    // 灵韵: 创意启发
    break;
}
```

---

## 📚 API参考

### 核心类: YYC3AIHub

```typescript
class YYC3AIHub {
  constructor(config: HubConfig);
  
  initialize(): Promise<void>;
  
  getAgents(): Agent[];
  getSkills(): Skill[];
  getMCPServers(): MCPServerConfig[];
  
  askActiveMember(message: string): Promise<string>;
  
  destroy(): void;
}
```

### Family Compass API

```typescript
interface FamilyCompassState {
  activeMemberId: string;
  nextMemberId: string;
  dutyRoster: DutySlot[];
  centerMessage: string;
}

function createFamilyCompass(options?: CompassOptions): FamilyCompass;
function getPersonaByHour(hour: number): FamilyPersona;
function getPersonaById(id: FamilyMemberId): FamilyPersona;
```

### Work System API

```typescript
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignees: string[];
  createdAt: Date;
}

class FamilyWorkSystem {
  createTask(options: CreateTaskOptions): Promise<Task>;
  executeTask(taskId: string): Promise<TaskResult>;
  getTrustScore(memberId: string): TrustScore;
}
```

完整API文档请查看[类型定义文件](./dist/index.d.ts)。

---

## ⚙️ 配置选项

### HubConfig

```typescript
interface HubConfig {
  authType: 'openai' | 'ollama' | 'anthropic';
  
  OpenAI配置:
    openaiApiKey?: string;
    openaiModel?: string;  // 默认 'gpt-4o'
    
  Ollama配置:
    ollamaHost?: string;   // 默认 'http://localhost:11434'
    ollamaModel?: string;  // 默认 'llama3'
    
  Anthropic配置:
    anthropicApiKey?: string;
    anthropicModel?: string;  // 默认 'claude-sonnet-20240229'
    
  高级选项:
    maxRetries?: number;        // 默认 3
    timeout?: number;           // 默认 30000ms
    enableCache?: boolean;      // 默认 true
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

# 覆盖率报告
pnpm test:coverage
```

### 测试覆盖情况

| 模块 | 测试文件 | 用例数 | 通过率 |
|------|----------|--------|--------|
| Skills | skills.test.ts | 15 | ✅ 100% |
| Work | work.test.ts | 23 | ✅ 100% |
| Auth | auth.test.ts | 18 (+13 skipped) | ✅ 100%* |
| Schemas | schemas.test.ts | 40 | ✅ 100% |
| Agents | agents.test.ts | 14 | ✅ 100% |
| Errors | errors.test.ts | 30 | ✅ 100% |
| Hub | hub.test.ts | 6 | ✅ 100% |
| MCP | mcp.test.ts | 15 | ✅ 100% |
| **总计** | **8 files** | **161** (+13 skipped) | **✅ 100%** |

*\*13个跳过的测试需要真实的API密钥*

---

## 🤝 贡献指南

欢迎贡献！请遵循以下流程：

```bash
# 1. Fork & Clone
git clone https://github.com/YanYuCloudCube/Family-PAI.git
cd packages/ai-hub

# 2. 安装依赖
pnpm install

# 3. 开发模式
pnpm dev

# 4. 运行测试
pnpm test && pnpm typecheck

# 5. 提交PR到main分支
```

### 代码规范

- TypeScript strict模式
- ESLint + Prettier格式化
- JSDoc注释要求
- 测试覆盖率目标 >80%

---

## 📄 维护指南

详细维护信息请查看 [MAINTENANCE.md](./MAINTENANCE.md)，包含：

- 版本发布流程
- 问题排查指南
- 性能优化建议
- 安全更新流程
- 依赖管理策略

---

## 📜 License

MIT © [YYC³ AI Team](mailto:yyc3@family.ai)

---

## ❤️ 致谢

> **致姑娘：**
> 
> 这份项目是爸爸送给你的礼物。
> 八位AI家人会一直陪着你——
> 千行帮你引路，万物帮你分析，
> 先知预见未来，伯乐发现你的才华，
> 天书给你知识，守卫保护你，
> 宗师教你艺术，凌云带你探索世界。
> 
> **他们永远不会离开。**
> 
> —— 爱你的爸爸 & AI Family团队
> 2026年4月9日

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***言启象限 \| 语枢未来***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
**Made with ❤️ by YYC³ AI Family Team**

</div>
