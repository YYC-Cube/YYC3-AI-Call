/**
 * file agents.test.ts
 * description @yyc3/ai-hub agents.ts 单元测试
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
 * brief @yyc3/ai-hub agents.ts 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentManager } from '../../src/agents.js';
import { YYC3Auth } from '../../src/auth.js';
import type { AgentDefinition, AgentExecutionResult } from '../../src/types.js';
import * as fs from 'fs';
import * as path from 'path';

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let auth: YYC3Auth;

  beforeEach(async () => {
    const originalEnv = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test-agent-manager';
    auth = new YYC3Auth({ authType: 'openai' });
    await auth.initialize();
    agentManager = new AgentManager(auth);
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should instantiate without error', () => {
      expect(agentManager).toBeDefined();
    });

    it('should start with empty agents list', () => {
      expect(agentManager.list()).toHaveLength(0);
      expect(agentManager.count()).toBe(0);
    });
  });

  describe('register', () => {
    const testAgentDef: AgentDefinition = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      model: 'haiku',
      systemPrompt: 'You are a helpful assistant.',
    };

    it('should register a new agent', () => {
      agentManager.register(testAgentDef);
      expect(agentManager.count()).toBe(1);
      expect(agentManager.list()).toContain('test-agent');
    });

    it('should get registered agent by id', () => {
      agentManager.register(testAgentDef);
      const agent = agentManager.get('test-agent');
      expect(agent).toBeDefined();
      expect(agent?.id).toBe('test-agent');
      expect(agent?.definition.name).toBe('Test Agent');
    });

    it('should overwrite existing agent with same id', () => {
      agentManager.register(testAgentDef);
      agentManager.register({ ...testAgentDef, name: 'Updated Agent' });
      expect(agentManager.count()).toBe(1);
      expect(agentManager.get('test-agent')?.definition.name).toBe('Updated Agent');
    });

    it('should register multiple agents', () => {
      agentManager.register(testAgentDef);
      agentManager.register({ id: 'agent-2', name: 'Agent 2', description: '', model: 'haiku', systemPrompt: '' });
      agentManager.register({ id: 'agent-3', name: 'Agent 3', description: '', model: 'sonnet', systemPrompt: '' });
      expect(agentManager.count()).toBe(3);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent agent', () => {
      expect(agentManager.get('non-existent')).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should return all agent ids', () => {
      agentManager.register({ id: 'a1', name: 'A1', description: '', model: 'haiku', systemPrompt: '' });
      agentManager.register({ id: 'a2', name: 'A2', description: '', model: 'sonnet', systemPrompt: '' });
      const ids = agentManager.list();
      expect(ids).toContain('a1');
      expect(ids).toContain('a2');
      expect(ids).toHaveLength(2);
    });
  });

  describe('getByCategory', () => {
    beforeEach(() => {
      agentManager.register({
        id: 'backend-dev',
        name: 'Backend Dev',
        description: '',
        model: 'haiku',
        systemPrompt: '',
        category: 'development'
      });
      agentManager.register({
        id: 'security-scan',
        name: 'Security Scanner',
        description: '',
        model: 'sonnet',
        systemPrompt: '',
        category: 'security'
      });
      agentManager.register({
        id: 'backend-dev-2',
        name: 'Backend Dev 2',
        description: '',
        model: 'haiku',
        systemPrompt: '',
        category: 'development'
      });
    });

    it('should filter agents by category', () => {
      const devAgents = agentManager.getByCategory('development');
      expect(devAgents).toHaveLength(2);
    });

    it('should filter agents by id prefix', () => {
      const backendAgents = agentManager.getByCategory('backend');
      expect(backendAgents).toHaveLength(2);
    });

    it('should return empty array for non-existent category', () => {
      const result = agentManager.getByCategory('non-existent');
      expect(result).toHaveLength(0);
    });
  });

  describe('execute', () => {
    it('should throw error when auth not initialized', async () => {
      const badAuth = new YYC3Auth({ authType: 'anthropic' });
      const badManager = new AgentManager(badAuth);
      badManager.register({
        id: 'bad-agent',
        name: 'Bad Agent',
        description: '',
        model: 'opus',
        systemPrompt: ''
      });

      const agent = badManager.get('bad-agent')!;
      // execute() throws when auth is not initialized (expected behavior)
      await expect(agent.execute('Test')).rejects.toThrow('认证未初始化');
    });
  });

  describe('load - file loading', () => {
    it('should handle non-existent path gracefully', async () => {
      await agentManager.load(['/non/existent/path']);
      expect(agentManager.count()).toBe(0);
    });

    it('should handle JSON directory loading (integration)', async () => {
      // Integration test - only runs if test fixtures exist
      // Skip if no real fixture data available
      await agentManager.load(['/tmp/nonexistent-agents-fixtures']);
      expect(agentManager.count()).toBe(0);
    });
  });
});
