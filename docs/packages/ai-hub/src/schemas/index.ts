/**
 * file index.ts
 * description @yyc3/ai-hub 模块入口
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub 模块入口
 */
export { HubConfigSchema, AuthTypeSchema, ModelMappingSchema } from './hub.schema.js';
export type { HubConfigInput, HubConfigOutput, AuthType, ModelTier } from './hub.schema.js';

export { TaskContextSchema, TaskResultSchema, AgentDefinitionSchema, AgentExecutionResultSchema, PrioritySchema } from './task-agent.schema.js';
export type { TaskContextInput, TaskContextOutput, TaskPriority, AgentDefinitionInput, AgentDefinitionOutput } from './task-agent.schema.js';

export { SkillDefinitionSchema } from './skill.schema.js';
export type { SkillDefinitionInput, SkillDefinitionOutput } from './skill.schema.js';

export { MCPServerConfigSchema, MCPServerMetadataSchema } from './mcp.schema.js';
export type { MCPServerConfigInput, MCPServerConfigOutput } from './mcp.schema.js';

import { z } from 'zod';

export class ValidationError extends Error {
  public readonly code = 'SCHEMA_6001';
  public readonly issues: Array<{ path: string; message: string }>;

  constructor(issues: Array<{ path: string; message: string }>) {
    super(`YYC³ Schema 验证失败 (${issues.length} 个错误)`);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map(i => ({
        path: i.path.map(p => String(p)).join('.'),
        message: i.message,
      }))
    );
  }
  return result.data;
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: Array<{ path: string; message: string }>;
} {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(i => ({
        path: i.path.map(p => String(p)).join('.'),
        message: i.message,
      })),
    };
  }
  return { success: true, data: result.data };
}
