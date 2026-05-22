/**
 * file schemas.test.ts
 * description @yyc3/ai-hub schemas.ts 单元测试
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
 * brief @yyc3/ai-hub schemas.ts 单元测试
 */
import { describe, it, expect } from 'vitest';
import {
  HubConfigSchema,
  TaskContextSchema,
  AgentDefinitionSchema,
  SkillDefinitionSchema,
  MCPServerConfigSchema,
  validate,
  safeValidate,
} from '../../src/schemas/index.js';
import { ValidationError } from '../../src/schemas/index.js';

describe('Schemas - HubConfig', () => {
  describe('valid inputs', () => {
    it('should accept empty config (all defaults)', () => {
      const result = safeValidate(HubConfigSchema, {});
      expect(result.success).toBe(true);
    });

    it('should accept full config with all fields', () => {
      const result = safeValidate(HubConfigSchema, {
        authType: 'openai',
        apiKey: 'sk-test',
        ollamaHost: 'http://localhost:11434',
        anthropicApiKey: 'sk-ant-test',
        modelMapping: { opus: 'gpt-4o', sonnet: 'gpt-4', haiku: 'gpt-3.5-turbo' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authType).toBe('openai');
        expect(result.data.modelMapping?.opus).toBe('gpt-4o');
      }
    });

    it('should default authType to auto', () => {
      const result = safeValidate(HubConfigSchema, {});
      expect(result.success && result.data.authType).toBe('auto');
    });

    it('should accept all valid authType values', () => {
      for (const t of ['openai', 'ollama', 'anthropic', 'auto']) {
        const r = safeValidate(HubConfigSchema, { authType: t });
        expect(r.success && r.data.authType).toBe(t);
      }
    });

    it('should accept modelMapping with partial fields', () => {
      const r = safeValidate(HubConfigSchema, { modelMapping: { opus: 'model-x' } });
      expect(r.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid authType', () => {
      const r = safeValidate(HubConfigSchema, { authType: 'invalid' as any });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty apiKey string', () => {
      const r = safeValidate(HubConfigSchema, { apiKey: '' });
      expect(r.success).toBe(false);
    });

    it('should reject invalid URL for ollamaHost', () => {
      const r = safeValidate(HubConfigSchema, { ollamaHost: 'not-a-url' });
      expect(r.success).toBe(false);
    });

    it('should reject unknown fields (strict mode)', () => {
      const r = safeValidate(HubConfigSchema, { unknownField: true } as any);
      expect(r.success).toBe(false);
    });
  });
});

describe('Schemas - TaskContext', () => {
  describe('valid inputs', () => {
    it('should accept minimal task context', () => {
      const r = safeValidate(TaskContextSchema, { task: 'Hello' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.task).toBe('Hello');
    });

    it('should accept full context with all fields', () => {
      const r = safeValidate(TaskContextSchema, {
        task: 'Build API',
        agent: 'backend-dev',
        skills: ['code-review', 'testing'],
        context: { projectId: '123' },
        priority: 'high' as const,
      });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.priority).toBe('high');
        expect(r.data.skills).toHaveLength(2);
      }
    });

    it('should default priority to medium', () => {
      const r = safeValidate(TaskContextSchema, { task: 'test' });
      expect(r.success && r.data.priority).toBe('medium');
    });

    it('should accept empty skills array', () => {
      const r = safeValidate(TaskContextSchema, { task: 'test', skills: [] });
      expect(r.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty task', () => {
      const r = safeValidate(TaskContextSchema, { task: '' });
      expect(r.success).toBe(false);
    });

    it('should reject missing task field', () => {
      const r = safeValidate(TaskContextSchema, {} as any);
      expect(r.success).toBe(false);
    });

    it('should reject too many skills (>20)', () => {
      const r = safeValidate(TaskContextSchema, {
        task: 'test',
        skills: Array(21).fill('skill'),
      });
      expect(r.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const r = safeValidate(TaskContextSchema, { task: 't', priority: 'urgent' as any });
      expect(r.success).toBe(false);
    });
  });
});

describe('Schemas - AgentDefinition', () => {
  describe('valid inputs', () => {
    it('should accept minimal valid definition', () => {
      const r = safeValidate(AgentDefinitionSchema, {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: '',
        model: 'haiku',
        systemPrompt: 'You review code.',
      });
      expect(r.success).toBe(true);
    });

    it('should accept full definition with optional fields', () => {
      const r = safeValidate(AgentDefinitionSchema, {
        id: 'full-agent',
        name: 'Full Agent',
        description: 'A complete agent',
        model: 'opus',
        systemPrompt: 'System prompt here',
        tools: ['search', 'execute'],
        skills: ['review'],
        category: 'development',
        priority: 8,
      });
      expect(r.success && r.data.priority).toBe(8);
    });

    it('should accept all three model tiers', () => {
      for (const m of ['opus', 'sonnet', 'haiku'] as const) {
        const r = safeValidate(AgentDefinitionSchema, {
          id: `agent-${m}`,
          name: m,
          description: '',
          model: m,
          systemPrompt: '',
        });
        expect(r.success).toBe(true);
      }
    });

    it('should allow ID with hyphens and underscores', () => {
      const r = safeValidate(AgentDefinitionSchema, {
        id: 'my_agent-01',
        name: 'Test',
        description: '',
        model: 'sonnet',
        systemPrompt: '',
      });
      expect(r.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty ID', () => {
      const r = safeValidate(AgentDefinitionSchema, { id: '', name: 'x', description: '', model: 'haiku', systemPrompt: '' });
      expect(r.success).toBe(false);
    });

    it('should reject ID with special characters', () => {
      const r = safeValidate(AgentDefinitionSchema, { id: 'bad!id', name: 'x', description: '', model: 'haiku', systemPrompt: '' });
      expect(r.success).toBe(false);
    });

    it('should reject invalid model tier', () => {
      const r = safeValidate(AgentDefinitionSchema, { id: 'a', name: 'x', description: '', model: 'gpt-4' as any, systemPrompt: '' });
      expect(r.success).toBe(false);
    });

    it('should reject oversized systemPrompt (>50000)', () => {
      const r = safeValidate(AgentDefinitionSchema, {
        id: 'a', name: 'x', description: '', model: 'haiku',
        systemPrompt: 'x'.repeat(50001),
      });
      expect(r.success).toBe(false);
    });

    it('should reject priority out of range (>10)', () => {
      const r = safeValidate(AgentDefinitionSchema, {
        id: 'a', name: 'x', description: '', model: 'haiku', systemPrompt: '',
        priority: 11,
      });
      expect(r.success).toBe(false);
    });
  });
});

describe('Schemas - SkillDefinition', () => {
  describe('valid inputs', () => {
    it('should accept string trigger', () => {
      const r = safeValidate(SkillDefinitionSchema, {
        id: 'review-code',
        name: 'Code Review',
        description: '',
        trigger: 'review code',
        prompt: 'Review the code.',
      });
      expect(r.success).toBe(true);
    });

    it('should accept RegExp trigger', () => {
      const r = safeValidate(SkillDefinitionSchema, {
        id: 'regex-skill',
        name: 'Regex Skill',
        description: '',
        trigger: /review\s+code/i,
        prompt: 'Match regex.',
      });
      expect(r.success).toBe(true);
    });

    it('should accept examples array', () => {
      const r = safeValidate(SkillDefinitionSchema, {
        id: 'skill-ex',
        name: 'Skill',
        description: '',
        trigger: 'trigger',
        prompt: 'prompt',
        examples: ['example 1', 'example 2'],
      });
      expect(r.success && r.data.examples).toHaveLength(2);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty trigger string', () => {
      const r = safeValidate(SkillDefinitionSchema, {
        id: 's', name: 's', description: '', trigger: '', prompt: 'p',
      });
      expect(r.success).toBe(false);
    });

    it('should reject too many examples (>10)', () => {
      const r = safeValidate(SkillDefinitionSchema, {
        id: 's', name: 's', description: '', trigger: 't', prompt: 'p',
        examples: Array(11).fill('ex'),
      });
      expect(r.success).toBe(false);
    });
  });
});

describe('Schemas - MCPServerConfig', () => {
  describe('valid inputs', () => {
    it('should accept minimal config with command only', () => {
      const r = safeValidate(MCPServerConfigSchema, { command: 'npx' });
      expect(r.success).toBe(true);
    });

    it('should accept full config with args and env', () => {
      const r = safeValidate(MCPServerConfigSchema, {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
        env: { PORT: '3000' },
        metadata: {
          displayName: 'Fetch Server',
          category: 'tools',
          vendor: 'MCP',
        },
      });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.args).toHaveLength(2);
        expect(r.data.metadata?.displayName).toBe('Fetch Server');
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty command', () => {
      const r = safeValidate(MCPServerConfigSchema, { command: '' });
      expect(r.success).toBe(false);
    });

    it('should reject missing command', () => {
      const r = safeValidate(MCPServerConfigSchema, {} as any);
      expect(r.success).toBe(false);
    });

    it('should reject invalid repository URL', () => {
      const r = safeValidate(MCPServerConfigSchema, {
        command: 'npx',
        metadata: { repository: 'not-a-url' },
      });
      expect(r.success).toBe(false);
    });
  });
});

describe('validate / safeValidate helpers', () => {
  it('validate() should throw ValidationError on bad input', () => {
    expect(() => validate(AgentDefinitionSchema, { id: '!bad' } as any)).toThrow(ValidationError);
  });

  it('validate() should return parsed data on good input', () => {
    const data = validate(AgentDefinitionSchema, {
      id: 'good-id', name: 'G', description: '', model: 'haiku', systemPrompt: '',
    });
    expect(data.id).toBe('good-id');
  });

  it('safeValidate() returns success:false on bad input', () => {
    const r = safeValidate(HubConfigSchema, { authType: 'xyz' as any });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.length).toBeGreaterThan(0);
  });

  it('ValidationError has issues array with path+message', () => {
    try {
      validate(AgentDefinitionSchema, { id: '' } as any);
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).issues.length).toBeGreaterThan(0);
    }
  });
});
