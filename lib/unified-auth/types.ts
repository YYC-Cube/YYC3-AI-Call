export enum AuthProvider {
  ZHIPU = 'zhipu',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE = 'azure',
  LOCAL = 'local',
}

export enum AuthTokenType {
  BEARER = 'bearer',
  API_KEY = 'api_key',
  OAUTH = 'oauth',
  JWT = 'jwt',
}

export interface UnifiedAuthConfig {
  provider: AuthProvider;
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  features?: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    audio: boolean;
    tools: boolean;
  };
}

export interface AuthToken {
  type: AuthTokenType;
  value: string;
  expiresAt?: Date;
  refreshToken?: string;
  scopes?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  provider: AuthProvider;
  createdAt: Date;
  lastLoginAt: Date;
  usageStats: {
    totalRequests: number;
    totalTokens: number;
    lastRequestAt: Date;
  };
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AuthProvider;
  capabilities: string[];
  contextWindow: number;
  maxOutputTokens: number;
  pricing: {
    inputPer1K: number;
    outputPer1K: number;
  };
}
