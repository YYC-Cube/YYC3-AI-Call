import {
  UnifiedAuthConfig,
  AuthToken,
  UserProfile,
  AuthProvider,
  AuthTokenType,
  AIModelConfig,
} from './types';

export class UnifiedAuthManager {
  private configs: Map<AuthProvider, UnifiedAuthConfig> = new Map();
  private tokens: Map<AuthProvider, AuthToken> = new Map();
  private profiles: Map<string, UserProfile> = new Map();
  private currentProvider: AuthProvider | null = null;

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs(): void {
    this.configs.set(AuthProvider.ZHIPU, {
      provider: AuthProvider.ZHIPU,
      endpoint: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-plus',
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 100000,
      },
      features: {
        streaming: true,
        functionCalling: true,
        vision: true,
        audio: false,
        tools: true,
      },
    });

    this.configs.set(AuthProvider.OPENAI, {
      provider: AuthProvider.OPENAI,
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4-turbo',
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 150000,
      },
      features: {
        streaming: true,
        functionCalling: true,
        vision: true,
        audio: true,
        tools: true,
      },
    });

    this.configs.set(AuthProvider.ANTHROPIC, {
      provider: AuthProvider.ANTHROPIC,
      endpoint: 'https://api.anthropic.com',
      model: 'claude-3-opus-20240229',
      timeout: 60000,
      maxRetries: 3,
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 200000,
      },
      features: {
        streaming: true,
        functionCalling: true,
        vision: true,
        audio: false,
        tools: true,
      },
    });
  }

  registerConfig(config: UnifiedAuthConfig): void {
    this.configs.set(config.provider, config);
    console.log(`✅ Config registered for provider: ${config.provider}`);
  }

  setApiKey(provider: AuthProvider, apiKey: string): void {
    const config = this.configs.get(provider);

    if (!config) {
      throw new Error(`Provider not configured: ${provider}`);
    }

    config.apiKey = apiKey;
    console.log(`🔑 API key set for provider: ${provider}`);
  }

  async authenticate(
    provider: AuthProvider,
    credentials?: { apiKey?: string; apiSecret?: string }
  ): Promise<AuthToken> {
    const config = this.configs.get(provider);

    if (!config) {
      throw new Error(`Provider not configured: ${provider}`);
    }

    if (credentials?.apiKey) {
      config.apiKey = credentials.apiKey;
    }

    if (credentials?.apiSecret) {
      config.apiSecret = credentials.apiSecret;
    }

    const token: AuthToken = {
      type: AuthTokenType.API_KEY,
      value: config.apiKey || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      scopes: ['chat', 'completion', 'embedding', 'tools'],
    };

    this.tokens.set(provider, token);
    this.currentProvider = provider;

    console.log(`🔐 Authentication successful for provider: ${provider}`);

    return token;
  }

  getToken(provider?: AuthProvider): AuthToken | null {
    const targetProvider = provider || this.currentProvider;

    if (!targetProvider) return null;

    return this.tokens.get(targetProvider) || null;
  }

  getCurrentProvider(): AuthProvider | null {
    return this.currentProvider;
  }

  getConfig(provider?: AuthProvider): UnifiedAuthConfig | null {
    const targetProvider = provider || this.currentProvider;

    if (!targetProvider) return null;

    return this.configs.get(targetProvider) || null;
  }

  async switchProvider(provider: AuthProvider): Promise<void> {
    if (!this.configs.has(provider)) {
      throw new Error(`Provider not configured: ${provider}`);
    }

    let token = this.tokens.get(provider);

    if (!token) {
      token = await this.authenticate(provider);
    }

    this.currentProvider = provider;
    console.log(`🔄 Switched to provider: ${provider}`);
  }

  getAvailableProviders(): AuthProvider[] {
    return Array.from(this.configs.keys());
  }

  registerProfile(profile: UserProfile): void {
    this.profiles.set(profile.id, profile);
  }

  getProfile(userId: string): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  updateUsageStats(
    userId: string,
    tokensUsed: number
  ): void {
    const profile = this.profiles.get(userId);

    if (profile) {
      profile.usageStats.totalRequests += 1;
      profile.usageStats.totalTokens += tokensUsed;
      profile.usageStats.lastRequestAt = new Date();
    }
  }

  getSupportedModels(): AIModelConfig[] {
    return [
      {
        id: 'glm-4-plus',
        name: 'GLM-4 Plus',
        provider: AuthProvider.ZHIPU,
        capabilities: ['text', 'vision', 'function-calling', 'tools'],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { inputPer1K: 0.05, outputPer1K: 0.05 },
      },
      {
        id: 'glm-4-flash',
        name: 'GLM-4 Flash',
        provider: AuthProvider.ZHIPU,
        capabilities: ['text', 'function-calling', 'tools'],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { inputPer1K: 0.001, outputPer1K: 0.001 },
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: AuthProvider.OPENAI,
        capabilities: ['text', 'vision', 'audio', 'function-calling', 'tools'],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { inputPer1K: 0.01, outputPer1K: 0.03 },
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: AuthProvider.ANTHROPIC,
        capabilities: ['text', 'vision', 'function-calling', 'tools'],
        contextWindow: 200000,
        maxOutputTokens: 4096,
        pricing: { inputPer1K: 0.015, outputPer1K: 0.075 },
      },
    ];
  }

  getModel(modelId: string): AIModelConfig | undefined {
    return this.getSupportedModels().find((m) => m.id === modelId);
  }
}

export const unifiedAuthManager = new UnifiedAuthManager();
