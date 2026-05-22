/**
 * file task-agent.schema.ts
 * description Task Agent Schema 定义
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Task Agent Schema 定义
 */
import { z } from 'zod';
import { ModelTierSchema } from './hub.schema.js';

export const PrioritySchema = z.enum(['high', 'medium', 'low']);
export type TaskPriority = z.infer<typeof PrioritySchema>;

export const TaskContextSchema = z.object({
  task: z.string().min(1, '任务内容不能为空').max(10000, '任务内容不能超过10000字符'),
  agent: z.string().optional(),
  skills: z.array(z.string()).max(20, '技能列表不能超过20个').optional(),
  context: z.record(z.any()).optional(),
  priority: PrioritySchema.optional().default('medium'),
}).strict();

export type TaskContextInput = z.input<typeof TaskContextSchema>;
export type TaskContextOutput = z.output<typeof TaskContextSchema>;

export const TaskResultSchema = z.object({
  success: z.boolean(),
  output: z.string(),
  artifacts: z.array(z.string()).optional(),
  metrics: z.object({
    tokensUsed: z.number().int().nonnegative(),
    duration: z.number().int().nonnegative(),
    agentCalls: z.number().int().nonnegative(),
  }).optional(),
  errors: z.array(z.string()).optional(),
});

export const AgentDefinitionSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'ID 只允许字母、数字、下划线、连字符'),
  name: z.string().min(1).max(128),
  description: z.string().max(1024),
  model: ModelTierSchema,
  systemPrompt: z.string().max(50000, '系统提示词不能超过50000字符'),
  tools: z.array(z.string()).max(50).optional(),
  skills: z.array(z.string()).max(50).optional(),
  category: z.string().max(64).optional(),
  priority: z.number().int().min(0).max(10).optional().default(5),
}).strict();

export type AgentDefinitionInput = z.input<typeof AgentDefinitionSchema>;
export type AgentDefinitionOutput = z.output<typeof AgentDefinitionSchema>;

export const AgentExecutionResultSchema = z.object({
  success: z.boolean(),
  output: z.string(),
  tokensUsed: z.number().int().nonnegative().optional(),
  duration: z.number().int().nonnegative().optional(),
  errors: z.array(z.string()).optional(),
});
