/**
 * file auth.ts
 * description 认证管理模块
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[auth]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 认证管理模块
 */
import OpenAI from 'openai';
import { HubConfig } from './types.js';
import { logger } from './logger.js';
import { YYC3Error, YYC3ErrorCode } from './errors/index.js';

export type AuthType = 'openai' | 'ollama' | 'anthropic' | 'auto';

export interface AuthProvider {
  type: 'openai' | 'ollama' | 'anthropic';
  client: OpenAI | null;
  host?: string;
  modelMapping: {
    opus: string;
    sonnet: string;
    haiku: string;
  };
}

export class YYC3Auth {
  private config: HubConfig;
  private provider: AuthProvider | null = null;

  constructor(config: HubConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<AuthProvider> {
    const authType = this.config.authType || 'auto';
    
    logger.info(`Initializing authentication with type: ${authType}`);

    if (authType === 'auto') {
      this.provider = await this.autoDetect();
    } else if (authType === 'openai') {
      this.provider = await this.initOpenAI();
    } else if (authType === 'anthropic') {
      this.provider = await this.initAnthropic();
    } else {
      this.provider = await this.initOllama();
    }

    logger.info(`Authentication initialized successfully: ${this.provider?.type}`);
    return this.provider!;
  }

  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '***';
    return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
  }

  private getOpenAIKey(): string | undefined {
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      logger.debug(`Using OpenAI API Key: ${this.maskApiKey(apiKey)}`);
    }
    return apiKey;
  }

  private getAnthropicKey(): string | undefined {
    const apiKey = this.config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      logger.debug(`Using Anthropic API Key: ${this.maskApiKey(apiKey)}`);
    }
    return apiKey;
  }

  private async autoDetect(): Promise<AuthProvider> {
    if (process.env.OPENAI_API_KEY || this.config.apiKey) {
      return this.initOpenAI();
    }

    if (process.env.ANTHROPIC_API_KEY || this.config.anthropicApiKey) {
      return this.initAnthropic();
    }

    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        return this.initOllama();
      }
    } catch {
      // Ollama not available
    }

    throw new YYC3Error(YYC3ErrorCode.AUTH_NO_PROVIDER);
  }

  private async initOpenAI(): Promise<AuthProvider> {
    const apiKey = this.getOpenAIKey();
    
    if (!apiKey) {
      throw new YYC3Error(YYC3ErrorCode.AUTH_OPENAI_KEY_MISSING);
    }

    const client = new OpenAI({ apiKey });

    return {
      type: 'openai',
      client,
      modelMapping: {
        opus: this.config.modelMapping?.opus || 'o1',
        sonnet: this.config.modelMapping?.sonnet || 'gpt-4o',
        haiku: this.config.modelMapping?.haiku || 'gpt-4o-mini'
      }
    };
  }

  private async initAnthropic(): Promise<AuthProvider> {
    const apiKey = this.getAnthropicKey();
    
    if (!apiKey) {
      throw new YYC3Error(YYC3ErrorCode.AUTH_ANTHROPIC_KEY_MISSING);
    }

    return {
      type: 'anthropic',
      client: null,
      modelMapping: {
        opus: this.config.modelMapping?.opus || 'claude-opus-4-20250514',
        sonnet: this.config.modelMapping?.sonnet || 'claude-sonnet-4-20250514',
        haiku: this.config.modelMapping?.haiku || 'claude-3-5-haiku-20241022'
      }
    };
  }

  private async initOllama(): Promise<AuthProvider> {
    const host = this.config.ollamaHost || 'http://localhost:11434';

    return {
      type: 'ollama',
      client: null,
      host,
      modelMapping: {
        opus: this.config.modelMapping?.opus || 'llama3.1:70b',
        sonnet: this.config.modelMapping?.sonnet || 'llama3.1:8b',
        haiku: this.config.modelMapping?.haiku || 'llama3.2:3b'
      }
    };
  }

  getProvider(): AuthProvider {
    if (!this.provider) {
      throw new YYC3Error(YYC3ErrorCode.AUTH_NOT_INITIALIZED);
    }
    return this.provider;
  }

  getModel(tier: 'opus' | 'sonnet' | 'haiku'): string {
    return this.getProvider().modelMapping[tier];
  }
}
