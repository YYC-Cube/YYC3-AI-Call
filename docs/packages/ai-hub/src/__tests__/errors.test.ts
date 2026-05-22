/**
 * file errors.test.ts
 * description @yyc3/ai-hub errors.ts 单元测试
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub errors.ts 单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  YYC3Error,
  YYC3ErrorCode,
  setLocale,
  getLocale,
} from '../../src/errors/index.js';
import { YYC3_ERROR_DOMAINS, YYC3_ERROR_DOMAINS_EN } from '../../src/errors/codes.js';
import { YYC3Auth } from '../../src/auth.js';
import { AgentManager } from '../../src/agents.js';
import { SkillManager } from '../../src/skills.js';
import { MCPManager } from '../../src/mcp.js';

describe('YYC3ErrorCode - 枚举完整性', () => {
  it('should have AUTH domain errors (1xxx)', () => {
    expect(YYC3ErrorCode.AUTH_NO_PROVIDER).toBe('AUTH_1001');
    expect(YYC3ErrorCode.AUTH_OPENAI_KEY_MISSING).toBe('AUTH_1002');
    expect(YYC3ErrorCode.AUTH_ANTHROPIC_KEY_MISSING).toBe('AUTH_1003');
    expect(YYC3ErrorCode.AUTH_NOT_INITIALIZED).toBe('AUTH_1004');
  });

  it('should have AGENT domain errors (2xxx)', () => {
    expect(YYC3ErrorCode.AGENT_NOT_FOUND).toBe('AGENT_2001');
    expect(YYC3ErrorCode.AGENT_INVALID_DEFINITION).toBe('AGENT_2002');
    expect(YYC3ErrorCode.AGENT_EXECUTION_FAILED).toBe('AGENT_2003');
  });

  it('should have SKILL domain errors (3xxx)', () => {
    expect(YYC3ErrorCode.SKILL_NOT_FOUND).toBe('SKILL_3001');
    expect(YYC3ErrorCode.SKILL_INVALID_DEFINITION).toBe('SKILL_3002');
  });

  it('should have MCP domain errors (4xxx)', () => {
    expect(YYC3ErrorCode.MCP_SERVER_NOT_FOUND).toBe('MCP_4001');
    expect(YYC3ErrorCode.MCP_START_FAILED).toBe('MCP_4003');
  });

  it('should have HUB domain errors (5xxx)', () => {
    expect(YYC3ErrorCode.HUB_NOT_INITIALIZED).toBe('HUB_5001');
    expect(YYC3ErrorCode.HUB_EXECUTE_FAILED).toBe('HUB_5002');
  });

  it('should have SCHEMA domain errors (6xxx)', () => {
    expect(YYC3ErrorCode.SCHEMA_VALIDATION_FAILED).toBe('SCHEMA_6001');
  });

  it('should have FAMILY domain errors (7xxx)', () => {
    expect(YYC3ErrorCode.FAMILY_MEMBER_NOT_FOUND).toBe('FAMILY_7001');
    expect(YYC3ErrorCode.FAMILY_PROFILE_NOT_FOUND).toBe('FAMILY_7002');
  });
});

describe('YYC3Error - 构造与属性', () => {
  beforeEach(() => {
    setLocale('zh');
  });

  it('should create error with code and default message', () => {
    const err = new YYC3Error(YYC3ErrorCode.AUTH_NOT_INITIALIZED);
    expect(err.name).toBe('YYC3Error');
    expect(err.code).toBe('AUTH_1004');
    expect(err.domain).toBe('AUTH');
    expect(err.message).toContain('认证未初始化');
  });

  it('should render context in zh message', () => {
    const err = new YYC3Error(YYC3ErrorCode.AGENT_NOT_FOUND, { id: 'test-agent' });
    expect(err.message).toContain('test-agent');
  });

  it('should provide messageZh and messageEn', () => {
    const err = new YYC3Error(YYC3ErrorCode.AGENT_NOT_FOUND, { id: 'my-agent' });
    expect(err.messageZh).toContain('my-agent');
    expect(err.messageEn).toContain('my-agent');
  });

  it('should store context object', () => {
    const ctx = { id: 'x', reason: 'bad' };
    const err = new YYC3Error(YYC3ErrorCode.AGENT_EXECUTION_FAILED, ctx);
    expect(err.context).toEqual(ctx);
  });

  it('should store cause error', () => {
    const cause = new Error('original');
    const err = new YYC3Error(YYC3ErrorCode.HUB_EXECUTE_FAILED, { reason: 'fail' }, cause);
    expect(err.cause).toBe(cause);
  });
});

describe('YYC3Error - i18n', () => {
  afterEach(() => {
    setLocale('zh');
  });

  it('should use zh by default', () => {
    setLocale('zh');
    const err = new YYC3Error(YYC3ErrorCode.AUTH_NO_PROVIDER);
    expect(err.message).toContain('未检测到');
  });

  it('should switch to en', () => {
    setLocale('en');
    const err = new YYC3Error(YYC3ErrorCode.AUTH_NO_PROVIDER);
    expect(err.message).toContain('No AI provider detected');
  });

  it('getLocale should return current locale', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    setLocale('zh');
    expect(getLocale()).toBe('zh');
  });
});

describe('YYC3Error - toJSON', () => {
  it('should serialize to structured JSON', () => {
    const err = new YYC3Error(YYC3ErrorCode.SKILL_NOT_FOUND, { id: 'review' });
    const json = err.toJSON();
    expect(json).toEqual({
      name: 'YYC3Error',
      code: 'SKILL_3001',
      domain: 'SKILL',
      message: expect.stringContaining('review'),
      messageZh: expect.stringContaining('review'),
      messageEn: expect.stringContaining('Skill not found'),
      context: { id: 'review' },
    });
  });
});

describe('YYC3Error.isYYC3Error', () => {
  it('should identify YYC3Error instances', () => {
    const err = new YYC3Error(YYC3ErrorCode.AUTH_NOT_INITIALIZED);
    expect(YYC3Error.isYYC3Error(err)).toBe(true);
  });

  it('should reject plain Error', () => {
    expect(YYC3Error.isYYC3Error(new Error('test'))).toBe(false);
  });

  it('should reject non-Error values', () => {
    expect(YYC3Error.isYYC3Error('string')).toBe(false);
    expect(YYC3Error.isYYC3Error(null)).toBe(false);
    expect(YYC3Error.isYYC3Error(undefined)).toBe(false);
  });
});

describe('YYC3Error.fromError', () => {
  it('should return same instance if already YYC3Error', () => {
    const original = new YYC3Error(YYC3ErrorCode.AUTH_NOT_INITIALIZED);
    const result = YYC3Error.fromError(original);
    expect(result).toBe(original);
  });

  it('should wrap plain Error with fallback code', () => {
    const plain = new Error('something broke');
    const wrapped = YYC3Error.fromError(plain);
    expect(wrapped).toBeInstanceOf(YYC3Error);
    expect(wrapped.code).toBe(YYC3ErrorCode.HUB_EXECUTE_FAILED);
    expect(wrapped.context.originalMessage).toBe('something broke');
    expect(wrapped.cause).toBe(plain);
  });

  it('should wrap string as Error with fallback code', () => {
    const wrapped = YYC3Error.fromError('string error');
    expect(wrapped).toBeInstanceOf(YYC3Error);
    expect(wrapped.context.originalMessage).toBe('string error');
  });

  it('should use custom fallback code', () => {
    const plain = new Error('auth fail');
    const wrapped = YYC3Error.fromError(plain, YYC3ErrorCode.AUTH_INIT_FAILED);
    expect(wrapped.code).toBe(YYC3ErrorCode.AUTH_INIT_FAILED);
  });
});

describe('YYC3_ERROR_DOMAINS', () => {
  it('should map all domains to Chinese names', () => {
    expect(YYC3_ERROR_DOMAINS['AUTH']).toBe('认证模块');
    expect(YYC3_ERROR_DOMAINS['AGENT']).toBe('智能体模块');
    expect(YYC3_ERROR_DOMAINS['SKILL']).toBe('技能模块');
    expect(YYC3_ERROR_DOMAINS['MCP']).toBe('MCP服务模块');
    expect(YYC3_ERROR_DOMAINS['HUB']).toBe('中枢模块');
    expect(YYC3_ERROR_DOMAINS['SCHEMA']).toBe('Schema验证');
    expect(YYC3_ERROR_DOMAINS['FAMILY']).toBe('家庭模块');
  });

  it('should map all domains to English names', () => {
    expect(YYC3_ERROR_DOMAINS_EN['AUTH']).toBe('Authentication');
    expect(YYC3_ERROR_DOMAINS_EN['HUB']).toBe('Hub Core');
  });
});

describe('Integration - Auth 模块错误码', () => {
  it('should throw YYC3Error when no provider available', async () => {
    const originalOpenAI = process.env.OPENAI_API_KEY;
    const originalAnthropic = process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      global.fetch = undefined as any;
      let caughtErr: unknown;
      try {
        await new YYC3Auth().initialize();
      } catch (e) {
        caughtErr = e;
      }
      expect(caughtErr).toBeDefined();
      expect(YYC3Error.isYYC3Error(caughtErr)).toBe(true);
      if (YYC3Error.isYYC3Error(caughtErr)) {
        expect(caughtErr.code).toBe(YYC3ErrorCode.AUTH_NO_PROVIDER);
        expect(caughtErr.domain).toBe('AUTH');
      }
    } finally {
      process.env.OPENAI_API_KEY = originalOpenAI;
      process.env.ANTHROPIC_API_KEY = originalAnthropic;
    }
  }, 10000);

  it('should throw YYC3Error when getProvider called before init', () => {
    const auth = new YYC3Auth();
    try {
      auth.getProvider();
      throw new Error('Should have thrown');
    } catch (err) {
      expect(YYC3Error.isYYC3Error(err)).toBe(true);
      if (YYC3Error.isYYC3Error(err)) {
        expect(err.code).toBe(YYC3ErrorCode.AUTH_NOT_INITIALIZED);
      }
    }
  });
});

describe('Integration - Agent 模块错误码', () => {
  it('should accept agent definition (validation TBD in v1.1)', () => {
    const originalEnv = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test-error-code';

    try {
      const auth = new YYC3Auth({ authType: 'openai' });
      const manager = new AgentManager(auth);

      expect(() => {
        manager.register({
          id: 'bad id!!!',
          name: '',
          description: '',
          model: 'haiku' as any,
          systemPrompt: '',
        });
      }).not.toThrow();
    } finally {
      process.env.OPENAI_API_KEY = originalEnv;
    }
  });
});

describe('Integration - Skill 模块错误码', () => {
  it('should accept skill definition (validation TBD in v1.1)', () => {
    const mgr = new SkillManager();

    expect(() => {
      mgr.register({
        id: '',
        name: 'Test',
        description: '',
        trigger: '',
        prompt: '',
      });
    }).not.toThrow();
  });
});

describe('Integration - MCP 模块错误码', () => {
  it('should throw ValidationError for invalid MCP config', () => {
    const mgr = new MCPManager();

    expect(() => {
      mgr.register('bad-server', { command: '' });
    }).toThrow();
  });
});
