/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */
import type { ChatMessage, AIProviderType } from '../types.js'

/**
 * 技能类别
 */
export type SkillCategory =
  | 'reasoning'
  | 'generation'
  | 'analysis'
  | 'automation'
  | 'integration'
  | 'industry'

/**
 * 技能定义
 */
export interface SkillDefinition {
  id: string
  name: string
  description: string
  version: string
  category: SkillCategory
  tags?: string[]
  handler?: SkillHandler
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * 技能执行上下文
 */
export interface ExecutionContext {
  sessionId: string
  userId?: string
  provider: AIProviderType
  model?: string
  messages: ChatMessage[]
  variables: Record<string, unknown>
  metadata: Record<string, unknown>
}

/**
 * 技能执行结果
 */
export interface SkillExecutionResult {
  success: boolean
  output?: unknown
  error?: string
  duration?: number
  tokens?: {
    input: number
    output: number
  }
}

/**
 * 技能处理器
 */
export type SkillHandler = (
  input: unknown,
  context: ExecutionContext
) => Promise<SkillExecutionResult>

/**
 * 技能注册项
 */
export interface SkillRegistryItem extends SkillDefinition {
  handler: SkillHandler
  registeredAt: Date
  lastExecuted?: Date
  executionCount: number
  successCount: number
  totalDuration: number
}
