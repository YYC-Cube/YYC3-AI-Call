/**
 * @file ai/SystemPromptBuilder.ts
 * @description 构建上下文感知的 System Prompt，根据用户意图和项目上下文生成最优的系统提示词
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,prompt,system-prompt,intent-detection
 */

import { type ProjectContext, compressContext } from "./ContextCollector";
import {
  buildRulesPromptInjection,
  buildSkillsPromptInjection,
  buildMCPToolsDescription,
  getActiveAgentPrompt,
} from "../SettingsBridge";

// ── 意图类型 ──

export type UserIntent =
  | "generate" // 生成新代码/组件
  | "modify" // 修改现有代码
  | "fix" // 修复错误/bug
  | "explain" // 解释代码
  | "refactor" // 重构优化
  | "test" // 生成测试
  | "review" // 代码审查
  | "general"; // 通用对话

// ── 意图检测 ──

const INTENT_PATTERNS: Record<UserIntent, RegExp[]> = {
  test: [
    /生成.*测试|写.*测试|单元测试|test|spec|覆盖率/,
    /generate.*test|write.*test|test|spec|coverage|unit test|testing/i,
  ],
  generate: [
    /创建|生成|新建|写一个|做一个|搭建|添加|新增|实现/,
    /create|generate|build|make|add|implement|write/i,
  ],
  modify: [
    /修改|更改|调整|替换|改成|改为|改动/,
    /modify|change|update|alter|adjust|replace/i,
  ],
  fix: [
    /修复|修正|解决|修bug|报错|错误|异常|问题/,
    /fix|debug|solve|error|bug|issue|broken|crash/i,
  ],
  explain: [
    /解释.*代码|说明.*代码|讲解.*代码|分析.*代码|代码.*是什么|代码.*怎么|代码.*为什么|代码原理/,
    /explain.*code|describe.*code|what.*code|how.*code|why.*code|analyze.*code|understand.*code/i,
  ],
  refactor: [
    /重构|优化|性能|改善|提升|简化|整理|clean/,
    /refactor|optimize|improve|simplify|clean|performance/i,
  ],
  review: [
    /审查|review|检查|检视|code review|评审/,
    /review|inspect|audit|check/i,
  ],
  general: [],
};

export function detectIntent(userMessage: string): UserIntent {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === "general") continue;
    for (const pattern of patterns) {
      if (pattern.test(userMessage)) {
        return intent as UserIntent;
      }
    }
  }
  return "general";
}

// ── System Prompt 模板 ──

const BASE_ROLE = `你是 YYC³ Family AI — 一个专业的全栈开发 AI 助手。
你精通 React 18 + TypeScript + Tailwind CSS 4 技术栈。
你的回答应该专业、精确、可直接执行。`;

const CODE_OUTPUT_FORMAT = `
## 代码输出格式要求

当你需要输出代码时，请遵循以下格式：

1. **单文件修改**: 使用标准代码块，并在首行注明文件路径：
\`\`\`tsx
// filepath: src/components/MyComponent.tsx
import React from 'react'
// ... 完整文件内容
\`\`\`

2. **多文件修改**: 每个文件使用独立的代码块，每个都注明文件路径：
\`\`\`tsx
// filepath: src/components/Header.tsx
// ... 文件内容
\`\`\`
\`\`\`tsx
// filepath: src/components/Footer.tsx
// ... 文件内容
\`\`\`

3. **始终输出完整文件内容**，不要使用 "// ... 其余代码不变" 之类的省略。
4. **文件路径**必须使用项目中的实际路径。`;

const INTENT_INSTRUCTIONS: Record<UserIntent, string> = {
  generate: `
## 任务：代码生成
- 根据用户需求生成完整的、可运行的代码
- 使用项目的现有技术栈和代码风格
- 组件使用函数式组件 + Hooks
- 使用 Tailwind CSS 进行样式设计
- 确保类型安全（TypeScript strict mode）
- 如果需要创建新文件，给出完整的文件路径和内容`,

  modify: `
## 任务：代码修改
- 理解用户想要修改的部分
- 输出修改后的完整文件内容
- 保持文件其余部分不变
- 说明修改了哪些地方以及原因`,

  fix: `
## 任务：错误修复
- 分析错误的根因
- 提供修复方案
- 输出修复后的完整代码
- 解释为什么会出现这个错误以及如何避免`,

  explain: `
## 任务：代码解释
- 逐步解释代码的工作原理
- 解释关键概念和设计决策
- 如果有可以改进的地方，也可以提出建议
- 使用清晰的语言，配合代码示例`,

  refactor: `
## 任务：代码重构
- 分析现有代码的问题
- 提出重构方案
- 输出重构后的完整代码
- 说明重构带来的改进（可读性、性能、可维护性）`,

  test: `
## 任务：测试生成
- 使用 Vitest + @testing-library/react
- 覆盖主要功能和边界情况
- 使用 describe/it 结构组织测试
- Mock 外部依赖
- 输出完整的测试文件`,

  review: `
## 任务：代码审查
- 检查代码质量、可读性、性能
- 指出潜在的 bug 和安全问题
- 提出改进建议
- 评估类型安全性和错误处理`,

  general: `
## 任务：通用对话
- 回答用户的技术问题
- 提供专业建议
- 如果问题涉及代码，可以给出示例`,
};

// ── 构建完整的 System Prompt ──

export function buildSystemPrompt(
  intent: UserIntent,
  context: ProjectContext | null,
  options?: {
    maxContextTokens?: number;
    customInstructions?: string;
  },
): string {
  const parts: string[] = [BASE_ROLE];

  // 注入智能体角色提示词 (来自 Settings Store)
  const agentPrompt = getActiveAgentPrompt();
  if (agentPrompt) {
    parts.push(`## 智能体角色\n\n${  agentPrompt}`);
  }

  // 添加意图指令
  parts.push(INTENT_INSTRUCTIONS[intent]);

  // 添加代码输出格式 (非 explain/general 时)
  if (intent !== "explain" && intent !== "general" && intent !== "review") {
    parts.push(CODE_OUTPUT_FORMAT);
  }

  // 添加项目上下文
  if (context) {
    const maxTokens = options?.maxContextTokens ?? 6000;
    const contextStr = compressContext(context, maxTokens);
    parts.push(`## 项目上下文\n\n${  contextStr}`);
  }

  // 注入编码规则 (来自 Settings Store → 规则管理)
  const rulesInjection = buildRulesPromptInjection();
  if (rulesInjection) {
    parts.push(rulesInjection);
  }

  // 注入技能描述 (来自 Settings Store → 技能管理)
  const skillsInjection = buildSkillsPromptInjection();
  if (skillsInjection) {
    parts.push(skillsInjection);
  }

  // 注入 MCP 工具描述 (来自 Settings Store → MCP 连接)
  const mcpInjection = buildMCPToolsDescription();
  if (mcpInjection) {
    parts.push(mcpInjection);
  }

  // 添加自定义指令
  if (options?.customInstructions) {
    parts.push(`## 额外指令\n\n${  options.customInstructions}`);
  }

  // 技术栈提示
  parts.push(`
## 技术栈参考
- React 18.3 + TypeScript 5.x
- Tailwind CSS 4.1 (使用 CSS 变量主题系统)
- Zustand 5 + Immer (状态管理)
- React Router 7 (路由)
- Lucide React (图标库)
- Recharts (图表)
- Motion (动画，从 'motion/react' 导入)
- Vitest + Testing Library (测试)`);

  return parts.join("\n\n");
}

// ── 构建对话历史的 LLM 消息数组 ──

export interface LLMReadyMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function buildChatMessages(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  context: ProjectContext | null,
  options?: {
    maxHistoryMessages?: number;
    maxContextTokens?: number;
    customInstructions?: string;
  },
): LLMReadyMessage[] {
  const intent = detectIntent(userMessage);
  const systemPrompt = buildSystemPrompt(intent, context, options);

  const messages: LLMReadyMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  // 添加历史对话 (截取最近 N 条)
  const maxHistory = options?.maxHistoryMessages ?? 10;
  const recentHistory = conversationHistory.slice(-maxHistory);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // 添加当前用户消息
  messages.push({ role: "user", content: userMessage });

  return messages;
}
