/**
 * file auth.test.ts
 * description @yyc3/ai-hub auth.ts 单元测试
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[auth],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub auth.ts 单元测试
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { YYC3Auth } from '../../src/auth.js';

describe('YYC3Auth', () => {
  let auth: YYC3Auth;

  beforeEach(() => {
    auth = new YYC3Auth();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }));
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should instantiate with default config', () => {
      expect(auth).toBeDefined();
    });

    it('should accept custom config', () => {
      const customAuth = new YYC3Auth({
        authType: 'openai',
        apiKey: 'test-key',
        ollamaHost: 'http://custom:11434',
      });
      expect(customAuth).toBeDefined();
    });
  });

  describe('initialize - auto detection', () => {
    it('should detect OpenAI when OPENAI_API_KEY is set', async () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-openai';

      const provider = await auth.initialize();
      expect(provider.type).toBe('openai');
      expect(provider.client).toBeDefined();

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('should detect Anthropic when ANTHROPIC_API_KEY is set and no OpenAI key', async () => {
      const originalOpenAI = process.env.OPENAI_API_KEY;
      const originalAnthropic = process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

      const provider = await new YYC3Auth().initialize();
      expect(provider.type).toBe('anthropic');

      process.env.OPENAI_API_KEY = originalOpenAI;
      process.env.ANTHROPIC_API_KEY = originalAnthropic;
    });

    it('should throw error when no provider available', async () => {
      const originalOpenAI = process.env.OPENAI_API_KEY;
      const originalAnthropic = process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await expect(new YYC3Auth().initialize()).rejects.toThrow('未检测到可用的AI提供商');

      process.env.OPENAI_API_KEY = originalOpenAI;
      process.env.ANTHROPIC_API_KEY = originalAnthropic;
    });
  });

  describe('initialize - explicit provider', () => {
    it('should initialize OpenAI with API key', async () => {
      const provider = await new YYC3Auth({ authType: 'openai', apiKey: 'sk-test' }).initialize();
      expect(provider.type).toBe('openai');
      expect(provider.client).toBeDefined();
      expect(provider.modelMapping.opus).toBeTruthy();
      expect(provider.modelMapping.sonnet).toBeTruthy();
      expect(provider.modelMapping.haiku).toBeTruthy();
    });

    it('should initialize Ollama with default host', async () => {
      const provider = await new YYC3Auth({ authType: 'ollama' }).initialize();
      expect(provider.type).toBe('ollama');
      expect(provider.host).toBe('http://localhost:11434');
      expect(provider.modelMapping.opus).toContain('llama');
    });

    it('should initialize Ollama with custom host', async () => {
      const provider = await new YYC3Auth({ authType: 'ollama', ollamaHost: 'http://remote:11434' }).initialize();
      expect(provider.type).toBe('ollama');
      expect(provider.host).toBe('http://remote:11434');
    });

    it('should initialize Anthropic with API key', async () => {
      const provider = await new YYC3Auth({ authType: 'anthropic', anthropicApiKey: 'sk-ant-test' }).initialize();
      expect(provider.type).toBe('anthropic');
      expect(provider.modelMapping.opus).toContain('claude');
    });

    it('should throw error when OpenAI missing API key', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(new YYC3Auth({ authType: 'openai' }).initialize()).rejects.toThrow('未找到 OpenAI API Key');

      process.env.OPENAI_API_KEY = originalKey;
    });

    it('should throw error when Anthropic missing API key', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      await expect(new YYC3Auth({ authType: 'anthropic' }).initialize()).rejects.toThrow('未找到 Anthropic API Key');

      process.env.ANTHROPIC_API_KEY = originalKey;
    });
  });

  describe('getModel', () => {
    it('should return opus model', async () => {
      await auth.initialize();
      expect(auth.getModel('opus')).toBeTruthy();
    });

    it('should return sonnet model', async () => {
      await auth.initialize();
      expect(auth.getModel('sonnet')).toBeTruthy();
    });

    it('should return haiku model', async () => {
      await auth.initialize();
      expect(auth.getModel('haiku')).toBeTruthy();
    });

    it('should throw error if not initialized', () => {
      expect(() => auth.getModel('opus')).toThrow('认证未初始化');
    });
  });

  describe('getProvider', () => {
    it('should throw error if not initialized', () => {
      expect(() => auth.getProvider()).toThrow('认证未初始化');
    });

    it('should return provider after initialization', async () => {
      await auth.initialize();
      const provider = auth.getProvider();
      expect(provider).toBeDefined();
      expect(provider.type).toBeTruthy();
    });
  });

  describe('custom model mapping', () => {
    it('should use custom model mapping for OpenAI', async () => {
      const provider = await new YYC3Auth({
        authType: 'openai',
        apiKey: 'sk-test',
        modelMapping: { opus: 'gpt-4-turbo', sonnet: 'gpt-4', haiku: 'gpt-3.5-turbo' },
      }).initialize();

      expect(provider.modelMapping.opus).toBe('gpt-4-turbo');
      expect(provider.modelMapping.sonnet).toBe('gpt-4');
      expect(provider.modelMapping.haiku).toBe('gpt-3.5-turbo');
    });
  });
});
