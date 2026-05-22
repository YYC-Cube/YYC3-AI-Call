import {
  UnifiedAuthManager,
} from '@/lib/unified-auth/manager';
import { ZhipuAIClient } from '@/lib/unified-auth/zhipu-client';
import {
  AuthProvider,
  AuthTokenType,
  UnifiedAuthConfig,
} from '@/lib/unified-auth/types';
import {
  ZhipuChatMessage,
  ZhipuChatCompletionRequest,
} from '@/lib/unified-auth/zhipu-client';

describe('Unified Auth Types', () => {
  describe('AuthProvider Enum', () => {
    it('should have all providers defined', () => {
      expect(Object.keys(AuthProvider).length).toBe(5);
      expect(AuthProvider.ZHIPU).toBe('zhipu');
      expect(AuthProvider.OPENAI).toBe('openai');
      expect(AuthProvider.ANTHROPIC).toBe('anthropic');
      expect(AuthProvider.AZURE).toBe('azure');
      expect(AuthProvider.LOCAL).toBe('local');
    });
  });

  describe('AuthTokenType Enum', () => {
    it('should have all token types', () => {
      expect(Object.keys(AuthTokenType).length).toBe(4);
      expect(AuthTokenType.BEARER).toBe('bearer');
      expect(AuthTokenType.API_KEY).toBe('api_key');
      expect(AuthTokenType.OAUTH).toBe('oauth');
      expect(AuthTokenType.JWT).toBe('jwt');
    });
  });
});

describe('UnifiedAuthManager', () => {
  let manager: UnifiedAuthManager;

  beforeEach(() => {
    manager = new UnifiedAuthManager();
  });

  describe('Initialization', () => {
    it('should create manager with default configs', () => {
      expect(manager).toBeDefined();
    });

    it('should have default providers configured', () => {
      const providers = manager.getAvailableProviders();

      expect(providers.length).toBeGreaterThan(0);
      expect(providers).toContain(AuthProvider.ZHIPU);
      expect(providers).toContain(AuthProvider.OPENAI);
      expect(providers).toContain(AuthProvider.ANTHROPIC);
    });
  });

  describe('Configuration Management', () => {
    it('should register custom config', () => {
      const customConfig: UnifiedAuthConfig = {
        provider: AuthProvider.LOCAL,
        endpoint: 'http://localhost:8080',
        model: 'local-model',
      };

      manager.registerConfig(customConfig);

      const providers = manager.getAvailableProviders();
      expect(providers).toContain(AuthProvider.LOCAL);
    });

    it('should set API key for provider', () => {
      const testKey = 'test-api-key-12345';

      manager.setApiKey(AuthProvider.ZHIPU, testKey);

      const config = manager.getConfig(AuthProvider.ZHIPU);
      expect(config?.apiKey).toBe(testKey);
    });
  });

  describe('Authentication', () => {
    it('should authenticate with credentials', async () => {
      const token = await manager.authenticate(AuthProvider.ZHIPU, {
        apiKey: 'zhipu-test-key',
      });

      expect(token.type).toBe(AuthTokenType.API_KEY);
      expect(token.value).toBeDefined();
      expect(token.expiresAt).toBeDefined();
      expect(token.scopes).toBeDefined();
    });

    it('should switch current provider after authentication', async () => {
      await manager.authenticate(AuthProvider.ZHIPU, {
        apiKey: 'test-key',
      });

      expect(manager.getCurrentProvider()).toBe(AuthProvider.ZHIPU);
    });

    it('should retrieve token for authenticated provider', async () => {
      await manager.authenticate(AuthProvider.OPENAI, {
        apiKey: 'openai-test-key',
      });

      const token = manager.getToken(AuthProvider.OPENAI);

      expect(token).toBeDefined();
      expect(token?.type).toBe(AuthTokenType.API_KEY);
    });

    it('should return null token for non-authenticated provider', () => {
      const token = manager.getToken(AuthProvider.AZURE);

      expect(token).toBeNull();
    });
  });

  describe('Provider Switching', () => {
    beforeEach(async () => {
      await manager.authenticate(AuthProvider.ZHIPU, { apiKey: 'key1' });
      await manager.authenticate(AuthProvider.OPENAI, { apiKey: 'key2' });
    });

    it('should switch to existing authenticated provider', async () => {
      await manager.switchProvider(AuthProvider.OPENAI);

      expect(manager.getCurrentProvider()).toBe(AuthProvider.OPENAI);
    });

    it('should auto-authenticate when switching to new provider', async () => {
      manager.registerConfig({
        provider: AuthProvider.ANTHROPIC,
        endpoint: 'https://api.anthropic.com',
        model: 'claude-3',
        apiKey: 'anthropic-key',
      });

      await manager.switchProvider(AuthProvider.ANTHROPIC);

      expect(manager.getCurrentProvider()).toBe(AuthProvider.ANTHROPIC);
      expect(manager.getToken(AuthProvider.ANTHROPIC)).not.toBeNull();
    });
  });

  describe('Model Information', () => {
    it('should return supported models', () => {
      const models = manager.getSupportedModels();

      expect(models.length).toBeGreaterThan(0);
      models.forEach((model) => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.capabilities).toBeDefined();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.pricing).toBeDefined();
      });
    });

    it('should get model by ID', () => {
      const model = manager.getModel('glm-4-plus');

      expect(model).toBeDefined();
      expect(model?.id).toBe('glm-4-plus');
      expect(model?.provider).toBe(AuthProvider.ZHIPU);
    });

    it('should return undefined for unknown model ID', () => {
      const model = manager.getModel('unknown-model');

      expect(model).toBeUndefined();
    });
  });

  describe('User Profile Management', () => {
    it('should register user profile', () => {
      manager.registerProfile({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        provider: AuthProvider.ZHIPU,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        usageStats: {
          totalRequests: 0,
          totalTokens: 0,
          lastRequestAt: new Date(),
        },
      });

      const profile = manager.getProfile('user-1');

      expect(profile).toBeDefined();
      expect(profile?.email).toBe('test@example.com');
    });

    it('should update usage stats', () => {
      manager.registerProfile({
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User 2',
        provider: AuthProvider.OPENAI,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        usageStats: {
          totalRequests: 10,
          totalTokens: 1000,
          lastRequestAt: new Date(),
        },
      });

      manager.updateUsageStats('user-2', 500);

      const profile = manager.getProfile('user-2');

      expect(profile?.usageStats.totalRequests).toBe(11);
      expect(profile?.usageStats.totalTokens).toBe(1500);
    });
  });
});

describe('ZhipuAIClient', () => {
  let client: ZhipuAIClient;

  beforeEach(() => {
    client = new ZhipuAIClient();
  });

  describe('Initialization', () => {
    it('should create client with default config', () => {
      expect(client).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customClient = new ZhipuAIClient({
        endpoint: 'custom-endpoint',
        model: 'glm-4-flash',
        timeout: 60000,
      });

      expect(customClient).toBeDefined();
    });
  });

  describe('Chat Completion', () => {
    const createBasicRequest = (): ZhipuChatCompletionRequest => ({
      model: 'glm-4-plus',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
      ],
    });

    it('should complete chat request successfully', async () => {
      const request = createBasicRequest();

      const response = await client.chatCompletion(request);

      expect(response.id).toBeDefined();
      expect(response.model).toBe(request.model);
      expect(response.choices).toBeDefined();
      expect(response.choices.length).toBeGreaterThan(0);
      expect(response.choices[0].message.content).toBeDefined();
      expect(typeof response.choices[0].message.content).toBe('string');
    });

    it('should include usage statistics', async () => {
      const request = createBasicRequest();

      const response = await client.chatCompletion(request);

      expect(response.usage).toBeDefined();
      expect(response.usage.prompt_tokens).toBeGreaterThanOrEqual(0);
      expect(response.usage.completion_tokens).toBeGreaterThanOrEqual(0);
      expect(response.usage.total_tokens).toBeGreaterThan(0);
    });

    it('should handle multiple messages', async () => {
      const request: ZhipuChatCompletionRequest = {
        model: 'glm-4-plus',
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
        ],
      };

      const response = await client.chatCompletion(request);

      expect(response.choices[0].message.role).toBe('assistant');
    });

    it('should handle empty user message', async () => {
      const request: ZhipuChatCompletionRequest = {
        model: 'glm-4-plus',
        messages: [
          { role: 'user', content: '' },
        ],
      };

      const response = await client.chatCompletion(request);

      expect(response.choices[0].message.content).toBeDefined();
    });
  });

  describe('Streaming Chat Completion', () => {
    it('should stream chunks correctly', async () => {
      const request: ZhipuChatCompletionRequest = {
        model: 'glm-4-plus',
        messages: [{ role: 'user', content: 'Stream this' }],
      };

      const chunks: string[] = [];

      await client.chatCompletionStream(request, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks.length).toBeGreaterThan(0);
      const fullText = chunks.join('');
      expect(fullText.length).toBeGreaterThan(0);
    });
  });

  describe('Embedding Generation', () => {
    it('should generate embedding vector', async () => {
      const embedding = await client.generateEmbedding('Test text for embedding');

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      embedding.forEach((value) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should generate consistent dimension embeddings', async () => {
      const emb1 = await client.generateEmbedding('Text one');
      const emb2 = await client.generateEmbedding('Text two');

      expect(emb1.length).toBe(emb2.length);
    });
  });

  describe('Token Counting', () => {
    it('should count tokens accurately', async () => {
      const text = 'This is a sample text for token counting';
      const tokenCount = await client.countTokens(text);

      expect(tokenCount).toBeGreaterThan(0);
      expect(typeof tokenCount).toBe('number');
    });

    it('should handle longer texts', async () => {
      const longText = 'Word '.repeat(100);
      const tokenCount = await client.countTokens(longText);

      expect(tokenCount).toBeGreaterThan(50);
    });

    it('should handle empty string', async () => {
      const tokenCount = await client.countTokens('');

      expect(tokenCount).toBe(0);
    });
  });
});
