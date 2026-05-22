/**
 * file codes.ts
 * description 错误码定义
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
 * brief 错误码定义
 */
export enum YYC3ErrorCode {
  // === AUTH 认证模块 (AUTH_1xxx) ===
  AUTH_NO_PROVIDER = 'AUTH_1001',
  AUTH_OPENAI_KEY_MISSING = 'AUTH_1002',
  AUTH_ANTHROPIC_KEY_MISSING = 'AUTH_1003',
  AUTH_NOT_INITIALIZED = 'AUTH_1004',
  AUTH_INIT_FAILED = 'AUTH_1005',

  // === AGENT 智能体模块 (AGENT_2xxx) ===
  AGENT_NOT_FOUND = 'AGENT_2001',
  AGENT_INVALID_DEFINITION = 'AGENT_2002',
  AGENT_EXECUTION_FAILED = 'AGENT_2003',
  AGENT_LOAD_FAILED = 'AGENT_2004',
  AGENT_TIMEOUT = 'AGENT_2005',

  // === SKILL 技能模块 (SKILL_3xxx) ===
  SKILL_NOT_FOUND = 'SKILL_3001',
  SKILL_INVALID_DEFINITION = 'SKILL_3002',
  SKILL_APPLY_FAILED = 'SKILL_3003',
  SKILL_LOAD_FAILED = 'SKILL_3004',
  SKILL_NO_MATCH = 'SKILL_3005',

  // === MCP 服务模块 (MCP_4xxx) ===
  MCP_SERVER_NOT_FOUND = 'MCP_4001',
  MCP_INVALID_CONFIG = 'MCP_4002',
  MCP_START_FAILED = 'MCP_4003',
  MCP_STOP_FAILED = 'MCP_4004',
  MCP_LOAD_FAILED = 'MCP_4005',

  // === HUB 中枢模块 (HUB_5xxx) ===
  HUB_NOT_INITIALIZED = 'HUB_5001',
  HUB_EXECUTE_FAILED = 'HUB_5002',
  HUB_INVALID_CONFIG = 'HUB_5003',
  HUB_TASK_CONTEXT_INVALID = 'HUB_5004',

  // === SCHEMA 验证模块 (SCHEMA_6xxx) ===
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_6001',
  SCHEMA_PARSE_ERROR = 'SCHEMA_6002',

  // === FAMILY 家庭模块 (FAMILY_7xxx) ===
  FAMILY_MEMBER_NOT_FOUND = 'FAMILY_7001',
  FAMILY_PROFILE_NOT_FOUND = 'FAMILY_7002',
}

export const YYC3_ERROR_DOMAINS: Record<string, string> = {
  AUTH: '认证模块',
  AGENT: '智能体模块',
  SKILL: '技能模块',
  MCP: 'MCP服务模块',
  HUB: '中枢模块',
  SCHEMA: 'Schema验证',
  FAMILY: '家庭模块',
};

export const YYC3_ERROR_DOMAINS_EN: Record<string, string> = {
  AUTH: 'Authentication',
  AGENT: 'Agent',
  SKILL: 'Skill',
  MCP: 'MCP Server',
  HUB: 'Hub Core',
  SCHEMA: 'Schema Validation',
  FAMILY: 'Family',
};
