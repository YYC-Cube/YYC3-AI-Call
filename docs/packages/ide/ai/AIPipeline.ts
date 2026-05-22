/**
 * @file ai/AIPipeline.ts
 * @description 端到端 AI 代码生成流水线，串联 ContextCollector → SystemPromptBuilder → LLM → CodeApplicator，
 *              供 LeftPanel / AIChatPage 调用
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,pipeline,code-generation,llm,streaming
 */

import {
  collectContext,
  compressContext,
  type ContextCollectorInput,
  type ProjectContext,
} from "./ContextCollector";
import {
  detectIntent,
  buildSystemPrompt,
  buildChatMessages,
  type UserIntent,
  type LLMReadyMessage,
} from "./SystemPromptBuilder";
import {
  parseCodeBlocks,
  applyCodeToFiles,
  validateCodeBlock,
  generateSimpleDiff,
  type CodeApplicationPlan,
  type ApplyResult,
  type DiffLine,
} from "./CodeApplicator";
import {
  chatCompletionStream,
  type ProviderConfig,
  type ChatMessage as LLMMessage,
} from "../LLMService";

// ── Pipeline Types ──

export interface PipelineInput {
  /** 用户当前输入的消息 */
  userMessage: string;
  /** 对话历史 (不含当前消息) */
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  /** 文件系统内容 (FileStore 中的 files) */
  fileContents: Record<string, string>;
  /** 当前活跃文件路径 */
  activeFile: string;
  /** 打开的标签页 */
  openTabs: { path: string; modified: boolean }[];
  /** Git 状态 */
  gitBranch: string;
  gitChanges: { path: string; status: string; staged: boolean }[];
  /** LLM Provider 配置 */
  provider: ProviderConfig;
  /** 模型 ID */
  modelId: string;
  /** 自定义指令 (可选) */
  customInstructions?: string;
}

export interface PipelineStreamCallbacks {
  /** 接收流式 token */
  onToken: (token: string) => void;
  /** 流式完成，返回完整文本 + 解析的代码计划 */
  onDone: (fullText: string, codePlan: CodeApplicationPlan | null) => void;
  /** 出错 */
  onError: (error: string) => void;
  /** 上下文收集完成 (可用于 UI 提示) */
  onContextReady?: (ctx: ProjectContext, intent: UserIntent) => void;
}

export interface PipelineOptions {
  /** 是否收集项目上下文 (默认 true) */
  collectProjectContext?: boolean;
  /** 上下文最大 token 数 (默认 6000) */
  maxContextTokens?: number;
  /** 历史消息最大条数 (默认 10) */
  maxHistoryMessages?: number;
  /** AbortSignal */
  signal?: AbortSignal;
}

// ── Pipeline execution ──

/**
 * 执行完整的 AI Pipeline：
 * 1. 收集项目上下文 (ContextCollector)
 * 2. 检测用户意图 & 构建 System Prompt (SystemPromptBuilder)
 * 3. 调用 LLM 流式生成 (LLMService)
 * 4. 解析响应中的代码块 (CodeApplicator)
 */
export function runPipeline(
  input: PipelineInput,
  callbacks: PipelineStreamCallbacks,
  options?: PipelineOptions,
): void {
  const {
    collectProjectContext = true,
    maxContextTokens = 6000,
    maxHistoryMessages = 10,
    signal,
  } = options ?? {};

  // ── Step 1: Collect context ──
  let context: ProjectContext | null = null;
  if (collectProjectContext) {
    const ctxInput: ContextCollectorInput = {
      fileContents: input.fileContents,
      activeFile: input.activeFile,
      openTabs: input.openTabs,
      gitBranch: input.gitBranch,
      gitChanges: input.gitChanges,
    };
    context = collectContext(ctxInput);
  }

  // ── Step 2: Detect intent & build messages ──
  const intent = detectIntent(input.userMessage);
  callbacks.onContextReady?.(context!, intent);

  const messages = buildChatMessages(
    input.userMessage,
    input.conversationHistory,
    context,
    {
      maxHistoryMessages,
      maxContextTokens,
      customInstructions: input.customInstructions,
    },
  );

  // Convert to LLMService message format
  const llmMessages: LLMMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // ── Step 3: Stream LLM response ──
  chatCompletionStream(
    input.provider,
    input.modelId,
    llmMessages,
    {
      onToken: callbacks.onToken,
      onDone: (fullText) => {
        // ── Step 4: Parse code blocks ──
        let codePlan: CodeApplicationPlan | null = null;
        try {
          const plan = parseCodeBlocks(fullText, input.fileContents);
          if (plan.blocks.length > 0) {
            // Validate each block
            const allWarnings: string[] = [];
            for (const block of plan.blocks) {
              allWarnings.push(...validateCodeBlock(block));
            }
            codePlan = plan;
          }
        } catch {
          // Code parsing failed — still return the text
        }
        callbacks.onDone(fullText, codePlan);
      },
      onError: callbacks.onError,
    },
    { signal },
  );
}

// ── Code Application Helper ──

/**
 * 应用代码计划到 FileStore — 供 UI 调用
 */
export function applyPlan(
  plan: CodeApplicationPlan,
  updateFile: (path: string, content: string) => void,
  createFile: (path: string, content: string) => void,
): ApplyResult {
  return applyCodeToFiles(plan, updateFile, createFile);
}

/**
 * 为 plan 中的每个文件生成 diff 预览
 */
export function previewPlanDiffs(
  plan: CodeApplicationPlan,
  existingFiles: Record<string, string>,
): { filepath: string; diff: DiffLine[]; isNew: boolean }[] {
  return plan.blocks.map((block) => ({
    filepath: block.filepath,
    diff: generateSimpleDiff(existingFiles[block.filepath], block.content),
    isNew: block.isNew,
  }));
}

// ── Re-exports for convenience ──

export { detectIntent, type UserIntent } from "./SystemPromptBuilder";
export {
  type CodeApplicationPlan,
  type ParsedCodeBlock,
} from "./CodeApplicator";
export { type ProjectContext } from "./ContextCollector";
