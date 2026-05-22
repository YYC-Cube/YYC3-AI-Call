/**
 * file skill.schema.ts
 * description Skill Schema 定义
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Skill Schema 定义
 */
import { z } from 'zod';

const SkillTriggerSchema = z.union([
  z.string().min(1),
  z.instanceof(RegExp),
]);

export const SkillDefinitionSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'ID 只允许字母、数字、下划线、连字符'),
  name: z.string().min(1).max(128),
  description: z.string().max(512),
  trigger: SkillTriggerSchema,
  prompt: z.string().max(20000, '提示词不能超过20000字符'),
  examples: z.array(z.string()).max(10).optional(),
  category: z.string().max(64).optional(),
}).strict();

export type SkillDefinitionInput = z.input<typeof SkillDefinitionSchema>;
export type SkillDefinitionOutput = z.output<typeof SkillDefinitionSchema>;
