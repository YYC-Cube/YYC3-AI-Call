/**
 * file mcp.schema.ts
 * description MCP Schema 定义
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP Schema 定义
 */
import { z } from 'zod';

export const MCPServerMetadataSchema = z.object({
  displayName: z.string().max(128).optional(),
  category: z.string().max(64).optional(),
  description: z.string().max(512).optional(),
  vendor: z.string().max(64).optional(),
  repository: z.string().url().optional(),
}).optional();

export const MCPServerConfigSchema = z.object({
  command: z.string().min(1, 'command 不能为空'),
  args: z.array(z.string()).max(32).optional(),
  env: z.record(z.string(), z.string()).optional(),
  metadata: MCPServerMetadataSchema,
}).strict();

export type MCPServerConfigInput = z.input<typeof MCPServerConfigSchema>;
export type MCPServerConfigOutput = z.output<typeof MCPServerConfigSchema>;
