/**
 * file types.ts
 * description @yyc3/ai-hub 类型定义
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
 * brief @yyc3/ai-hub 类型定义
 */
export interface HubConfig {
  authType?: 'openai' | 'ollama' | 'anthropic' | 'auto';
  apiKey?: string;
  ollamaHost?: string;
  anthropicApiKey?: string;
  modelMapping?: {
    opus?: string;
    sonnet?: string;
    haiku?: string;
  };
}

export interface TaskContext {
  task: string;
  agent?: string;
  skills?: string[];
  context?: Record<string, any>;
  priority?: 'high' | 'medium' | 'low';
}

export interface TaskResult {
  success: boolean;
  output: string;
  artifacts?: string[];
  metrics?: {
    tokensUsed: number;
    duration: number;
    agentCalls: number;
  };
  errors?: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  model: 'opus' | 'sonnet' | 'haiku';
  systemPrompt: string;
  tools?: string[];
  skills?: string[];
  category?: string;
  priority?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  trigger: string | RegExp;
  prompt: string;
  examples?: string[];
  category?: string;
}

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  metadata?: {
    displayName?: string;
    category?: string;
    description?: string;
    vendor?: string;
    repository?: string;
  };
}

export interface ExecutionContext {
  taskId: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentExecutionResult {
  success: boolean;
  output: string;
  tokensUsed?: number;
  duration?: number;
  errors?: string[];
}
