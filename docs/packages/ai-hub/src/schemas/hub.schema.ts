/**
 * file hub.schema.ts
 * description Hub Schema 定义
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
 * brief Hub Schema 定义
 */
import { z } from 'zod';

export const AuthTypeSchema = z.enum(['openai', 'ollama', 'anthropic', 'auto']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

export const ModelTierSchema = z.enum(['opus', 'sonnet', 'haiku']);
export type ModelTier = z.infer<typeof ModelTierSchema>;

export const ModelMappingSchema = z.object({
  opus: z.string().optional(),
  sonnet: z.string().optional(),
  haiku: z.string().optional(),
}).optional();

export const HubConfigSchema = z.object({
  authType: AuthTypeSchema.optional().default('auto'),
  apiKey: z.string().min(1, 'API Key 不能为空').optional(),
  ollamaHost: z.string().url('Ollama Host 必须是有效URL').optional().default('http://localhost:11434'),
  anthropicApiKey: z.string().min(1, 'Anthropic API Key 不能为空').optional(),
  modelMapping: ModelMappingSchema,
}).strict();

export type HubConfigInput = z.input<typeof HubConfigSchema>;
export type HubConfigOutput = z.output<typeof HubConfigSchema>;
