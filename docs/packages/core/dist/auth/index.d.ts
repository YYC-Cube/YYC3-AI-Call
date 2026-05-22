import { A as AuthProvider, C as ChatOptions, a as AuthProviderInfo } from '../unified-auth-Dzz5qQ93.js';
export { b as AuthStatus, U as UnifiedAuthManager, c as UnifiedAuthManagerConfig } from '../unified-auth-Dzz5qQ93.js';
import { C as ChatMessage, a as ChatCompletionResponse, A as AIProviderType } from '../types-BrIugxRS.js';
import { EventEmitter } from 'eventemitter3';

/**
 * file openai-provider.ts
 * description OpenAI 认证提供者
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
 * brief OpenAI 认证提供者
 */

/**
 * OpenAI 提供商配置
 */
interface OpenAIConfig {
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
}
/**
 * OpenAI 认证提供商实现
 */
declare class OpenAIProvider implements AuthProvider {
    readonly name: "openai";
    private config;
    private _isReady;
    constructor(config?: OpenAIConfig);
    get isReady(): boolean;
    initialize(): Promise<void>;
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletionResponse>;
    stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatCompletionResponse>;
    getModels(): Promise<string[]>;
    validate(): Promise<boolean>;
    dispose(): Promise<void>;
    getInfo(): AuthProviderInfo;
    private transformResponse;
}

/**
 * file ollama-provider.ts
 * description Ollama 认证提供者
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
 * brief Ollama 认证提供者
 */

/**
 * Ollama 提供商配置
 */
interface OllamaConfig {
    baseUrl?: string;
    defaultModel?: string;
}
/**
 * Ollama 认证提供商实现
 */
declare class OllamaProvider implements AuthProvider {
    readonly name: "ollama";
    private config;
    private _isReady;
    private _availableModels;
    constructor(config?: OllamaConfig);
    get isReady(): boolean;
    initialize(): Promise<void>;
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletionResponse>;
    stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatCompletionResponse>;
    getModels(): Promise<string[]>;
    validate(): Promise<boolean>;
    dispose(): Promise<void>;
    getInfo(): AuthProviderInfo;
    private checkOllamaRunning;
    private transformResponse;
}

/**
 * file anthropic-provider.ts
 * description Anthropic Claude 认证提供者
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.4.0
 * created 2026-04-27
 * updated 2026-04-27
 * status active
 * tags [module],[auth]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Anthropic Claude 认证提供者
 */

interface AnthropicConfig {
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
    apiVersion?: string;
}
declare class AnthropicProvider implements AuthProvider {
    readonly name: "anthropic";
    private config;
    private _isReady;
    constructor(config?: AnthropicConfig);
    get isReady(): boolean;
    initialize(): Promise<void>;
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletionResponse>;
    stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatCompletionResponse>;
    getModels(): Promise<string[]>;
    validate(): Promise<boolean>;
    dispose(): Promise<void>;
    getInfo(): AuthProviderInfo;
    private convertMessages;
    private transformResponse;
}

/**
 * file auth-monitor.ts
 * description 认证监控器
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
 * brief 认证监控器
 */

/**
 * 认证状态
 */
interface AuthState {
    provider: AIProviderType;
    authenticated: boolean;
    healthy: boolean;
    lastCheck: Date;
    errorCount: number;
    lastError?: string;
    latency: number;
    quotaRemaining?: number;
}
/**
 * 健康检查结果
 */
interface HealthCheckResult {
    provider: AIProviderType;
    healthy: boolean;
    latency: number;
    timestamp: Date;
    error?: string;
    details?: Record<string, unknown>;
}
/**
 * 监控配置
 */
interface AuthMonitorConfig {
    checkInterval: number;
    maxErrors: number;
    autoRecover: boolean;
    alertThreshold: number;
}
/**
 * 监控事件
 */
interface AuthMonitorEvents {
    state_changed: {
        provider: AIProviderType;
        state: AuthState;
    };
    health_check: {
        result: HealthCheckResult;
    };
    error_detected: {
        provider: AIProviderType;
        error: string;
    };
    recovery_triggered: {
        provider: AIProviderType;
        reason: string;
    };
    quota_warning: {
        provider: AIProviderType;
        remaining: number;
    };
}
/**
 * 认证状态监控器
 * 监控认证状态和提供商健康度
 */
declare class AuthMonitor extends EventEmitter<AuthMonitorEvents> {
    private states;
    private config;
    private checkTimer;
    private checkFunction;
    constructor(config?: Partial<AuthMonitorConfig>);
    /**
     * 设置健康检查函数
     */
    setHealthCheckFunction(fn: (provider: AIProviderType) => Promise<HealthCheckResult>): void;
    /**
     * 开始监控
     */
    startMonitoring(providers: AIProviderType[]): void;
    /**
     * 停止监控
     */
    stopMonitoring(): void;
    /**
     * 调度下一次检查
     */
    private scheduleNextCheck;
    /**
     * 执行健康检查
     */
    private performChecks;
    /**
     * 更新状态
     */
    private updateState;
    /**
     * 处理错误
     */
    private handleError;
    /**
     * 检查状态是否改变
     */
    private stateChanged;
    /**
     * 手动触发检查
     */
    checkNow(provider?: AIProviderType): Promise<HealthCheckResult[]>;
    /**
     * 获取状态
     */
    getState(provider: AIProviderType): AuthState | undefined;
    /**
     * 获取所有状态
     */
    getAllStates(): Map<AIProviderType, AuthState>;
    /**
     * 获取健康的提供商
     */
    getHealthyProviders(): AIProviderType[];
    /**
     * 获取统计信息
     */
    getStats(): {
        totalProviders: number;
        healthyProviders: number;
        avgLatency: number;
        totalErrors: number;
    };
    /**
     * 重置错误计数
     */
    resetErrorCount(provider: AIProviderType): void;
    /**
     * 更新配额信息
     */
    updateQuota(provider: AIProviderType, remaining: number): void;
}

/**
 * file auth-switcher.ts
 * description 认证切换器
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
 * brief 认证切换器
 */

/**
 * 切换策略
 */
type SwitchStrategy = 'failover' | 'load-balance' | 'cost-optimize' | 'performance-optimize' | 'manual';
/**
 * 切换原因
 */
type SwitchReason = 'failure' | 'performance' | 'cost' | 'manual' | 'quota' | 'maintenance';
/**
 * 切换决策
 */
interface SwitchDecision {
    from: AIProviderType;
    to: AIProviderType;
    reason: SwitchReason;
    timestamp: Date;
    success: boolean;
    error?: string;
}
/**
 * 切换配置
 */
interface AuthSwitcherConfig {
    strategy: SwitchStrategy;
    enableAutoSwitch: boolean;
    maxRetries: number;
    retryDelay: number;
    cooldownPeriod: number;
    priorityOrder: AIProviderType[];
}
/**
 * 切换事件
 */
interface AuthSwitcherEvents {
    switch_triggered: {
        decision: SwitchDecision;
    };
    switch_completed: {
        decision: SwitchDecision;
    };
    switch_failed: {
        decision: SwitchDecision;
        error: string;
    };
    provider_degraded: {
        provider: AIProviderType;
        reason: string;
    };
    provider_recovered: {
        provider: AIProviderType;
    };
}
/**
 * 认证智能切换器
 * 实现智能的提供商切换和故障恢复
 */
declare class AuthSwitcher extends EventEmitter<AuthSwitcherEvents> {
    private config;
    private currentProvider;
    private switchHistory;
    private degradedProviders;
    private lastSwitchTime;
    constructor(config?: Partial<AuthSwitcherConfig>);
    /**
     * 设置当前提供商
     */
    setCurrentProvider(provider: AIProviderType): void;
    /**
     * 获取当前提供商
     */
    getCurrentProvider(): AIProviderType | null;
    /**
     * 决定是否需要切换
     */
    shouldSwitch(currentHealth: HealthCheckResult, allStates: Map<AIProviderType, AuthState>): boolean;
    /**
     * 选择最佳提供商
     */
    selectBestProvider(availableProviders: AIProviderType[], states: Map<AIProviderType, AuthState>): AIProviderType;
    /**
     * 按优先级选择
     */
    private selectByPriority;
    /**
     * 按负载均衡选择
     */
    private selectByLoadBalance;
    /**
     * 按成本选择
     */
    private selectByCost;
    /**
     * 按性能选择
     */
    private selectByPerformance;
    /**
     * 计算性能分数
     */
    private calculatePerformanceScore;
    /**
     * 执行切换
     */
    switch(from: AIProviderType, to: AIProviderType, reason: SwitchReason, switchFn: () => Promise<void>): Promise<SwitchDecision>;
    /**
     * 标记提供商降级
     */
    markDegraded(provider: AIProviderType, reason: string): void;
    /**
     * 标记提供商恢复
     */
    markRecovered(provider: AIProviderType): void;
    /**
     * 获取切换历史
     */
    getHistory(limit?: number): SwitchDecision[];
    /**
     * 获取降级的提供商
     */
    getDegradedProviders(): AIProviderType[];
    /**
     * 获取统计信息
     */
    getStats(): {
        totalSwitches: number;
        successfulSwitches: number;
        failedSwitches: number;
        avgSwitchTime: number;
        switchReasons: Map<SwitchReason, number>;
    };
    /**
     * 设置策略
     */
    setStrategy(strategy: SwitchStrategy): void;
    /**
     * 设置优先级顺序
     */
    setPriorityOrder(order: AIProviderType[]): void;
}

export { AnthropicProvider, AuthMonitor, type AuthMonitorConfig, type AuthMonitorEvents, AuthProvider, AuthProviderInfo, type AuthState, AuthSwitcher, type AuthSwitcherConfig, type AuthSwitcherEvents, type HealthCheckResult, OllamaProvider, OpenAIProvider, type SwitchDecision, type SwitchReason, type SwitchStrategy };
