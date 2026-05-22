import { A as AIProviderType, C as ChatMessage, a as ChatCompletionResponse } from './types-BrIugxRS.js';

/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[auth]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */

/**
 * 认证提供商接口
 */
interface AuthProvider {
    readonly name: AIProviderType;
    readonly isReady: boolean;
    initialize(): Promise<void>;
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletionResponse>;
    stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatCompletionResponse>;
    getModels(): Promise<string[]>;
    validate(): Promise<boolean>;
    dispose(): Promise<void>;
    getInfo(): AuthProviderInfo;
}
/**
 * 聊天选项
 */
interface ChatOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stop?: string[];
    stream?: boolean;
}
/**
 * 认证提供商信息
 */
interface AuthProviderInfo {
    name: AIProviderType;
    displayName: string;
    description: string;
    isAvailable: boolean;
    isLocal: boolean;
    models: string[];
    defaultModel?: string;
}
/**
 * 认证状态
 */
interface AuthStatus {
    activeProvider: AIProviderType | null;
    providers: AuthProviderInfo[];
    lastChecked: Date;
    errors: Array<{
        provider: AIProviderType;
        error: string;
    }>;
}

/**
 * file unified-auth.ts
 * description 统一认证管理器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[auth]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 统一认证管理器
 */

interface UnifiedAuthManagerConfig {
    preferLocal?: boolean;
    autoDetect?: boolean;
    openai?: {
        apiKey?: string;
        baseUrl?: string;
        defaultModel?: string;
    };
    ollama?: {
        baseUrl?: string;
        defaultModel?: string;
    };
    anthropic?: {
        apiKey?: string;
        baseUrl?: string;
        defaultModel?: string;
        apiVersion?: string;
    };
}
/**
 * 统一认证管理器
 * 自动检测 OpenAI API Key 和 Ollama 本地服务
 */
declare class UnifiedAuthManager {
    private providers;
    private activeProvider;
    private config;
    constructor(config?: UnifiedAuthManagerConfig);
    /**
     * 自动检测可用的 AI 提供商
     */
    autoDetect(): Promise<AuthProviderInfo[]>;
    /**
     * 选择最佳提供商
     */
    private selectBestProvider;
    /**
     * 获取当前活跃的提供商
     */
    getActiveProvider(): AuthProvider | null;
    /**
     * 切换提供商
     */
    switchProvider(name: AIProviderType): Promise<void>;
    /**
     * 发送聊天消息
     */
    chat(messages: ChatMessage[], options?: any): Promise<ChatCompletionResponse>;
    /**
     * 流式聊天
     */
    stream(messages: ChatMessage[], options?: any): AsyncIterable<ChatCompletionResponse>;
    /**
     * 获取认证状态
     */
    getStatus(): AuthStatus;
    /**
     * 获取所有可用提供商
     */
    getProviders(): AuthProviderInfo[];
    /**
     * 注册自定义提供商
     */
    registerProvider(provider: AuthProvider): void;
    /**
     * 销毁所有提供商
     */
    dispose(): Promise<void>;
}

export { type AuthProvider as A, type ChatOptions as C, UnifiedAuthManager as U, type AuthProviderInfo as a, type AuthStatus as b, type UnifiedAuthManagerConfig as c };
