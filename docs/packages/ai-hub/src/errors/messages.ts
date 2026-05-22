/**
 * file messages.ts
 * description 错误消息定义
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
 * brief 错误消息定义
 */
import { YYC3ErrorCode } from './codes.js';

export interface YYC3ErrorContext {
  [key: string]: unknown;
}

export const ERROR_MESSAGES: Record<YYC3ErrorCode, { zh: string; en: string }> = {
  [YYC3ErrorCode.AUTH_NO_PROVIDER]: {
    zh: '未检测到可用的AI提供商。请设置 OPENAI_API_KEY、ANTHROPIC_API_KEY 或启动 Ollama 服务。',
    en: 'No AI provider detected. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY or start Ollama service.',
  },
  [YYC3ErrorCode.AUTH_OPENAI_KEY_MISSING]: {
    zh: '未找到 OpenAI API Key。请设置 OPENAI_API_KEY 环境变量。',
    en: 'OpenAI API Key not found. Please set OPENAI_API_KEY environment variable.',
  },
  [YYC3ErrorCode.AUTH_ANTHROPIC_KEY_MISSING]: {
    zh: '未找到 Anthropic API Key。请设置 ANTHROPIC_API_KEY 环境变量。',
    en: 'Anthropic API Key not found. Please set ANTHROPIC_API_KEY environment variable.',
  },
  [YYC3ErrorCode.AUTH_NOT_INITIALIZED]: {
    zh: '认证未初始化。请先调用 initialize()。',
    en: 'Authentication not initialized. Please call initialize() first.',
  },
  [YYC3ErrorCode.AUTH_INIT_FAILED]: {
    zh: '认证初始化失败。',
    en: 'Authentication initialization failed.',
  },

  [YYC3ErrorCode.AGENT_NOT_FOUND]: {
    zh: 'Agent 未找到: {id}',
    en: 'Agent not found: {id}',
  },
  [YYC3ErrorCode.AGENT_INVALID_DEFINITION]: {
    zh: 'Agent 定义无效: {reason}',
    en: 'Invalid agent definition: {reason}',
  },
  [YYC3ErrorCode.AGENT_EXECUTION_FAILED]: {
    zh: 'Agent 执行失败: {id} - {reason}',
    en: 'Agent execution failed: {id} - {reason}',
  },
  [YYC3ErrorCode.AGENT_LOAD_FAILED]: {
    zh: 'Agent 加载失败: {path}',
    en: 'Agent load failed: {path}',
  },
  [YYC3ErrorCode.AGENT_TIMEOUT]: {
    zh: 'Agent 执行超时: {id}',
    en: 'Agent execution timeout: {id}',
  },

  [YYC3ErrorCode.SKILL_NOT_FOUND]: {
    zh: 'Skill 未找到: {id}',
    en: 'Skill not found: {id}',
  },
  [YYC3ErrorCode.SKILL_INVALID_DEFINITION]: {
    zh: 'Skill 定义无效: {reason}',
    en: 'Invalid skill definition: {reason}',
  },
  [YYC3ErrorCode.SKILL_APPLY_FAILED]: {
    zh: 'Skill 应用失败: {id}',
    en: 'Skill apply failed: {id}',
  },
  [YYC3ErrorCode.SKILL_LOAD_FAILED]: {
    zh: 'Skill 加载失败: {path}',
    en: 'Skill load failed: {path}',
  },
  [YYC3ErrorCode.SKILL_NO_MATCH]: {
    zh: '没有匹配的 Skill 可用于当前输入。',
    en: 'No matching skill for current input.',
  },

  [YYC3ErrorCode.MCP_SERVER_NOT_FOUND]: {
    zh: 'MCP Server 未找到: {id}',
    en: 'MCP Server not found: {id}',
  },
  [YYC3ErrorCode.MCP_INVALID_CONFIG]: {
    zh: 'MCP 配置无效: {reason}',
    en: 'Invalid MCP configuration: {reason}',
  },
  [YYC3ErrorCode.MCP_START_FAILED]: {
    zh: 'MCP Server 启动失败: {id} - {reason}',
    en: 'MCP Server start failed: {id} - {reason}',
  },
  [YYC3ErrorCode.MCP_STOP_FAILED]: {
    zh: 'MCP Server 停止失败: {id}',
    en: 'MCP Server stop failed: {id}',
  },
  [YYC3ErrorCode.MCP_LOAD_FAILED]: {
    zh: 'MCP 加载失败: {path}',
    en: 'MCP load failed: {path}',
  },

  [YYC3ErrorCode.HUB_NOT_INITIALIZED]: {
    zh: 'Hub 未初始化。请先调用 initialize()。',
    en: 'Hub not initialized. Please call initialize() first.',
  },
  [YYC3ErrorCode.HUB_EXECUTE_FAILED]: {
    zh: '任务执行失败: {reason}',
    en: 'Task execution failed: {reason}',
  },
  [YYC3ErrorCode.HUB_INVALID_CONFIG]: {
    zh: 'Hub 配置无效: {reason}',
    en: 'Invalid Hub configuration: {reason}',
  },
  [YYC3ErrorCode.HUB_TASK_CONTEXT_INVALID]: {
    zh: '任务上下文无效: {reason}',
    en: 'Invalid task context: {reason}',
  },

  [YYC3ErrorCode.SCHEMA_VALIDATION_FAILED]: {
    zh: 'Schema 验证失败: {fieldCount} 个字段异常',
    en: 'Schema validation failed: {fieldCount} field(s) invalid',
  },
  [YYC3ErrorCode.SCHEMA_PARSE_ERROR]: {
    zh: 'Schema 解析错误: {reason}',
    en: 'Schema parse error: {reason}',
  },

  [YYC3ErrorCode.FAMILY_MEMBER_NOT_FOUND]: {
    zh: '家庭成员不存在: {memberId}',
    en: 'Family member not found: {memberId}',
  },
  [YYC3ErrorCode.FAMILY_PROFILE_NOT_FOUND]: {
    zh: '用户档案不存在: {userId}',
    en: 'User profile not found: {userId}',
  },
};
