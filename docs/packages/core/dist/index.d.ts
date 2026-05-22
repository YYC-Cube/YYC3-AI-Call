import EventEmitter$1, { EventEmitter } from 'eventemitter3';

/**
 * 提供商类型
 */
type ProviderType = 'openai' | 'ollama' | 'anthropic' | 'azure' | 'custom';
/**
 * 提供商状态
 */
interface ProviderStatus {
    type: ProviderType;
    available: boolean;
    configured: boolean;
    healthy: boolean;
    models?: string[];
    endpoint?: string;
    error?: string;
    priority: number;
}
/**
 * 环境检测结果
 */
interface EnvironmentDetectionResult {
    providers: ProviderStatus[];
    recommended: ProviderType;
    environment: {
        node: string;
        platform: string;
        arch: string;
        memory: number;
        cpus: number;
    };
    config: {
        needsSetup: boolean;
        missingKeys: string[];
        recommendations: string[];
    };
}
/**
 * 自动环境检测器
 * 自动检测可用的AI提供商和环境配置
 */
declare class AutoDetector {
    private cachedProviders;
    private lastDetection;
    private cacheTimeout;
    /**
     * 执行完整的环境检测
     */
    detect(): Promise<EnvironmentDetectionResult>;
    /**
     * 检测运行环境
     */
    private detectEnvironment;
    /**
     * 检测所有提供商
     */
    private detectProviders;
    /**
     * 检测 OpenAI
     */
    private detectOpenAI;
    /**
     * 检测 Ollama
     */
    private detectOllama;
    /**
     * 检测 Anthropic
     */
    private detectAnthropic;
    /**
     * 检测 Azure OpenAI
     */
    private detectAzure;
    /**
     * 检查 OpenAI 健康状态
     */
    private checkOpenAIHealth;
    /**
     * 检查 Ollama 健康状态
     */
    private checkOllamaHealth;
    /**
     * 获取 Ollama 模型列表
     */
    private getOllamaModels;
    /**
     * 推荐最佳提供商
     */
    private recommendProvider;
    /**
     * 分析配置状态
     */
    private analyzeConfig;
    /**
     * 快速检测（使用缓存）
     */
    quickDetect(): Promise<ProviderType>;
    /**
     * 获取缓存的提供商状态
     */
    getCachedProvider(type: ProviderType): ProviderStatus | undefined;
    /**
     * 清除缓存
     */
    clearCache(): void;
    /**
     * 打印检测报告
     */
    printReport(result: EnvironmentDetectionResult): void;
}

/**
 * file smart-selector.ts
 * description 智能选择器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[setup]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 智能选择器
 */

/**
 * 选择因素
 */
interface SelectionFactors {
    taskType: string;
    complexity: number;
    speedPriority: number;
    costPriority: number;
    qualityPriority: number;
    privacyRequired: boolean;
    maxTokens?: number;
}
/**
 * 提供商评分
 */
interface ProviderScore {
    type: ProviderType;
    score: number;
    breakdown: {
        performance: number;
        cost: number;
        quality: number;
        availability: number;
        privacy: number;
    };
    recommendation: string;
}
/**
 * 选择结果
 */
interface SelectionResult {
    selected: ProviderType;
    scores: ProviderScore[];
    reasoning: string;
    fallback?: ProviderType;
}
/**
 * 提供商性能数据
 */
interface ProviderPerformance {
    type: ProviderType;
    avgLatency: number;
    successRate: number;
    avgTokensPerSecond: number;
    costPerToken: number;
    maxContextLength: number;
    qualityScore: number;
}
/**
 * 智能提供商选择器
 * 基于任务需求和性能智能选择AI提供商
 */
declare class SmartSelector {
    private performanceData;
    private selectionHistory;
    constructor();
    /**
     * 初始化性能数据
     */
    private initializePerformanceData;
    /**
     * 选择最佳提供商
     */
    select(providers: ProviderStatus[], factors: SelectionFactors): SelectionResult;
    /**
     * 评分所有提供商
     */
    private scoreProviders;
    /**
     * 评分单个提供商
     */
    private scoreProvider;
    /**
     * 评分性能
     */
    private scorePerformance;
    /**
     * 评分成本
     */
    private scoreCost;
    /**
     * 评分质量
     */
    private scoreQuality;
    /**
     * 评分可用性
     */
    private scoreAvailability;
    /**
     * 评分隐私
     */
    private scorePrivacy;
    /**
     * 获取权重
     */
    private getWeights;
    /**
     * 生成推荐理由
     */
    private generateRecommendation;
    /**
     * 生成选择理由
     */
    private generateReasoning;
    /**
     * 更新性能数据
     */
    updatePerformance(providerType: ProviderType, data: Partial<ProviderPerformance>): void;
    /**
     * 获取选择历史
     */
    getHistory(limit?: number): SelectionResult[];
    /**
     * 获取统计信息
     */
    getStats(): {
        totalSelections: number;
        providerDistribution: Map<ProviderType, number>;
        avgScore: number;
    };
}

/**
 * 启动配置
 */
interface QuickStartConfig {
    provider?: ProviderType;
    autoDetect?: boolean;
    fallback?: boolean;
    silent?: boolean;
}
/**
 * 启动结果
 */
interface QuickStartResult {
    success: boolean;
    provider: ProviderType;
    status: ProviderStatus;
    message: string;
    setup?: {
        needsConfig: boolean;
        steps: string[];
    };
}
/**
 * 系统状态
 */
interface SystemStatus {
    initialized: boolean;
    provider: ProviderType;
    agents: {
        total: number;
        active: number;
    };
    skills: {
        total: number;
        loaded: number;
    };
    uptime: number;
}
/**
 * 快速启动器
 * 提供零配置的快速启动功能
 */
declare class QuickStarter {
    private detector;
    private _selector;
    private initialized;
    private startTime;
    private currentProvider;
    constructor();
    get selector(): SmartSelector;
    /**
     * 快速启动
     */
    start(config?: QuickStartConfig): Promise<QuickStartResult>;
    /**
     * 尝试回退到其他提供商
     */
    private tryFallback;
    /**
     * 创建空状态
     */
    private createEmptyStatus;
    /**
     * 获取设置步骤
     */
    private getSetupSteps;
    /**
     * 打印成功消息
     */
    private printSuccessMessage;
    /**
     * 获取系统状态
     */
    getStatus(): SystemStatus;
    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean;
    /**
     * 获取当前提供商
     */
    getCurrentProvider(): ProviderType | null;
    /**
     * 关闭系统
     */
    shutdown(): Promise<void>;
    /**
     * 重启系统
     */
    restart(config?: QuickStartConfig): Promise<QuickStartResult>;
}

/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */

/**
 * AI 提供商类型
 */
type AIProviderType = 'openai' | 'ollama' | 'anthropic' | 'azure' | 'custom';
/**
 * 消息角色
 */
type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
/**
 * 聊天消息
 */
interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
}
/**
 * 聊天完成响应
 */
interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finishReason: string;
    }>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

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

/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */

/**
 * 智能体角色类型
 */
type AgentRole = 'meta-oracle' | 'sentinel' | 'master' | 'creative' | 'navigator' | 'thinker' | 'prophet' | 'bolero' | 'commander' | 'coder' | 'multimodal' | 'predictor' | 'matcher' | 'security' | 'quality' | 'translator' | 'slides-gen' | 'cartoon-gen' | 'ai-drawing' | 'receipt-recog' | 'clothes-recog' | 'contract-parser' | 'service-check' | 'subtitle-trans' | 'edu-correction' | 'job-matcher' | 'social-trans' | 'literature-trans' | 'edu-solver' | 'vidu-template' | 'bidwin-parser';
/**
 * 智能体状态
 */
type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';
/**
 * 推理类型
 */
type ReasoningType = 'planning' | 'logical' | 'probabilistic' | 'creative' | 'analytical' | 'predictive' | 'evaluative';
/**
 * 智能体能力定义
 */
interface AgentCapability {
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
}
/**
 * 智能体定义
 */
interface AgentDefinition {
    id: AgentRole;
    name: string;
    displayName: string;
    emoji: string;
    role: string;
    description: string;
    reasoningTypes: ReasoningType[];
    capabilities: AgentCapability[];
    systemPrompt: string;
    priority: number;
    maxConcurrentTasks: number;
}
/**
 * 智能体状态信息
 */
interface AgentState {
    status: AgentStatus;
    currentTask?: string;
    lastActiveTime?: Date;
    totalTasksCompleted: number;
    averageResponseTime: number;
    errorCount: number;
}
/**
 * 任务优先级
 */
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * 任务状态
 */
type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
/**
 * 智能体任务
 */
interface AgentTask {
    id: string;
    type: string;
    priority: TaskPriority;
    input: unknown;
    context: TaskContext;
    assignedAgent?: AgentRole;
    status: TaskStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: unknown;
    error?: string;
}
/**
 * 任务上下文
 */
interface TaskContext {
    sessionId: string;
    userId?: string;
    conversationHistory: ChatMessage[];
    metadata: Record<string, unknown>;
    parentTaskId?: string;
}
/**
 * 任务结果
 */
interface TaskResult {
    success: boolean;
    output?: unknown;
    data?: unknown;
    error?: string;
    duration: number;
    tokens?: {
        input: number;
        output: number;
    };
    recommendations?: AgentRecommendation[];
    metadata?: Record<string, unknown>;
    agentId?: AgentRole;
}
/**
 * 智能体推荐
 */
interface AgentRecommendation {
    agentId: AgentRole;
    confidence: number;
    reason: string;
}
/**
 * 协同模式
 */
type CollaborationMode = 'sequential' | 'parallel' | 'hierarchical' | 'consensus';
/**
 * 协同任务
 */
interface CollaborationTask {
    id: string;
    mode: CollaborationMode;
    agents: AgentRole[];
    participants?: AgentRole[];
    leader?: AgentRole;
    tasks: AgentTask[];
    subtasks?: AgentTask[];
    aggregationStrategy?: 'first' | 'best' | 'merge' | 'vote';
    timeout?: number;
}

/**
 * file base-agent.ts
 * description Agent 基类
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Agent 基类
 */

/**
 * 智能体事件类型
 */
interface AgentEvents {
    status_changed: {
        status: AgentStatus;
    };
    task_started: {
        taskId: string;
    };
    task_completed: {
        taskId: string;
        result: TaskResult;
    };
    task_failed: {
        taskId: string;
        error: string;
    };
    error: {
        error: Error;
    };
}
/**
 * 智能体配置
 */
interface BaseAgentConfig {
    definition: AgentDefinition;
    authManager: UnifiedAuthManager;
}
/**
 * 基础智能体类
 */
declare abstract class BaseAgent extends EventEmitter<AgentEvents> {
    protected definition: AgentDefinition;
    protected authManager: UnifiedAuthManager;
    protected state: AgentState;
    protected currentTasks: Map<string, AgentTask>;
    constructor(config: BaseAgentConfig);
    /**
     * 获取智能体定义
     */
    getDefinition(): AgentDefinition;
    /**
     * 获取智能体状态
     */
    getState(): AgentState;
    /**
     * 获取智能体ID
     */
    getId(): string;
    /**
     * 获取智能体名称
     */
    getName(): string;
    /**
     * 是否可以接受新任务
     */
    canAcceptTask(): boolean;
    /**
     * 执行任务
     */
    execute(task: AgentTask): Promise<TaskResult>;
    /**
     * 执行具体任务（子类实现）
     */
    protected abstract executeTask(task: AgentTask): Promise<TaskResult>;
    /**
     * 估算能力匹配度
     */
    estimateCapability(task: AgentTask, _context: TaskContext): Promise<{
        score: number;
    }>;
    /**
     * 构建系统提示
     */
    protected buildSystemPrompt(): string;
    /**
     * 构建消息
     */
    protected buildMessages(task: AgentTask): Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    /**
     * 格式化任务输入
     */
    protected formatTaskInput(task: AgentTask): string;
    /**
     * 更新平均响应时间
     */
    private updateAverageResponseTime;
    /**
     * 设置状态
     */
    setStatus(status: AgentStatus): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalTasks: number;
        averageResponseTime: number;
        errorRate: number;
    };
}

/**
 * file manager.ts
 * description 管理器核心
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 管理器核心
 */

/**
 * AI Family 管理器事件
 */
interface AIFamilyEvents {
    agent_registered: {
        agentId: AgentRole;
    };
    agent_status_changed: {
        agentId: AgentRole;
        status: string;
    };
    task_queued: {
        taskId: string;
    };
    task_started: {
        taskId: string;
        agentId: AgentRole;
    };
    task_completed: {
        taskId: string;
        agentId: AgentRole;
        result: TaskResult;
    };
    task_failed: {
        taskId: string;
        agentId: AgentRole;
        error: string;
    };
    collaboration_started: {
        collaborationId: string;
    };
    collaboration_completed: {
        collaborationId: string;
        results: TaskResult[];
    };
}
/**
 * AI Family 管理器配置
 */
interface AIFamilyConfig {
    authManager: UnifiedAuthManager;
    maxQueueSize?: number;
    taskTimeout?: number;
    enableCollaboration?: boolean;
}
/**
 * AI Family 管理器
 */
declare class AIFamilyManager extends EventEmitter<AIFamilyEvents> {
    private agents;
    private taskQueue;
    private runningTasks;
    private config;
    constructor(config: AIFamilyConfig);
    /**
     * 初始化所有智能体
     */
    private initializeAgents;
    /**
     * 获取智能体
     */
    getAgent(role: AgentRole): BaseAgent | undefined;
    /**
     * 获取所有智能体
     */
    getAllAgents(): Map<AgentRole, BaseAgent>;
    /**
     * 获取智能体状态
     */
    getAgentStatus(role: AgentRole): string;
    /**
     * 创建任务
     */
    createTask(type: string, input: unknown, context: Partial<TaskContext>, priority?: TaskPriority): AgentTask;
    /**
     * 提交任务
     */
    submitTask(task: AgentTask): Promise<TaskResult>;
    /**
     * 处理任务
     */
    private processTask;
    /**
     * 推荐智能体
     */
    recommendAgents(task: AgentTask): AgentRecommendation[];
    /**
     * 协同执行任务
     */
    collaborate(collaboration: CollaborationTask): Promise<TaskResult[]>;
    /**
     * 获取队列状态
     */
    getQueueStatus(): {
        queueLength: number;
        runningTasks: number;
        maxQueueSize: number;
    };
    /**
     * 获取所有智能体统计
     */
    getAgentsStats(): Map<AgentRole, ReturnType<BaseAgent['getStats']>>;
    /**
     * 清理资源
     */
    dispose(): void;
}

/**
 * file agent-layers.ts
 * description Agent 层级定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Agent 层级定义
 */

/**
 * Agent层级
 */
type AgentLayer = 'commander' | 'executor' | 'supporter';
/**
 * 层级配置
 */
interface LayerConfig {
    name: string;
    description: string;
    agents: AgentRole[];
    responsibilities: string[];
    maxConcurrency: number;
}
/**
 * 三层架构配置
 */
interface ThreeLayerArchitectureConfig {
    authManager: UnifiedAuthManager;
    enableAutoRouting?: boolean;
    enableQualityGates?: boolean;
    maxTaskQueueSize?: number;
}
/**
 * 层级架构事件
 */
interface ArchitectureEvents {
    layer_activated: {
        layer: AgentLayer;
        agents: AgentRole[];
    };
    layer_deactivated: {
        layer: AgentLayer;
    };
    task_routed: {
        taskId: string;
        from: AgentRole;
        to: AgentRole;
    };
    quality_gate_passed: {
        taskId: string;
        layer: AgentLayer;
    };
    quality_gate_failed: {
        taskId: string;
        layer: AgentLayer;
        reason: string;
    };
}
/**
 * Agent三层架构
 * 实现指挥层、执行层、支持层的多层协同架构
 */
declare class AgentLayers extends EventEmitter<ArchitectureEvents> {
    private layers;
    private agents;
    private activeLayer;
    private config;
    constructor(config: ThreeLayerArchitectureConfig);
    /**
     * 初始化三层架构
     */
    private initializeLayers;
    /**
     * 注册Agent
     */
    registerAgent(role: AgentRole, agent: BaseAgent): void;
    /**
     * 获取Agent所在层级
     */
    private getLayerByRole;
    /**
     * 获取层级配置
     */
    getLayerConfig(layer: AgentLayer): LayerConfig | undefined;
    /**
     * 获取层级中的所有Agent
     */
    getLayerAgents(layer: AgentLayer): BaseAgent[];
    /**
     * 激活层级
     */
    activateLayer(layer: AgentLayer): void;
    /**
     * 获取当前活跃层级
     */
    getActiveLayer(): AgentLayer;
    /**
     * 按层级执行任务
     */
    executeByLayer(layer: AgentLayer, task: AgentTask, _context: TaskContext): Promise<TaskResult[]>;
    /**
     * 三层协同执行
     */
    collaborativeExecute(task: AgentTask, context: TaskContext): Promise<TaskResult>;
    /**
     * 聚合结果
     */
    private aggregateResults;
    /**
     * 质量门检查
     */
    private checkQualityGate;
    /**
     * 获取架构统计
     */
    getStats(): {
        layers: number;
        totalAgents: number;
        activeAgents: number;
        layerStats: Map<AgentLayer, {
            agents: number;
            active: boolean;
        }>;
    };
}

/**
 * file agent-collaboration.ts
 * description Agent 协作系统
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Agent 协作系统
 */

/**
 * 协同消息类型
 */
type CollaborationMessageType = 'request' | 'response' | 'notification' | 'broadcast' | 'delegation';
/**
 * 协同消息
 */
interface CollaborationMessage {
    id: string;
    type: CollaborationMessageType;
    from: AgentRole;
    to: AgentRole | AgentRole[];
    content: unknown;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    timestamp: Date;
    requiresResponse: boolean;
    timeout?: number;
}
/**
 * 协同会话
 */
interface CollaborationSession {
    id: string;
    participants: AgentRole[];
    leader: AgentRole;
    task: CollaborationTask;
    messages: CollaborationMessage[];
    status: 'active' | 'paused' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
}
/**
 * 协同策略
 */
type CollaborationStrategy = 'sequential' | 'parallel' | 'hierarchical' | 'consensus' | 'auction';
/**
 * 协同配置
 */
interface CollaborationConfig {
    maxConcurrentSessions: number;
    messageTimeout: number;
    retryAttempts: number;
    enableLogging: boolean;
}
/**
 * 协同事件
 */
interface CollaborationEvents {
    session_started: {
        sessionId: string;
        participants: AgentRole[];
    };
    session_completed: {
        sessionId: string;
        result: TaskResult;
    };
    message_sent: {
        message: CollaborationMessage;
    };
    message_received: {
        message: CollaborationMessage;
    };
    agent_joined: {
        sessionId: string;
        agent: AgentRole;
    };
    agent_left: {
        sessionId: string;
        agent: AgentRole;
    };
}
/**
 * Agent协同系统
 * 实现智能体间的协同通信和协作
 */
declare class AgentCollaboration extends EventEmitter<CollaborationEvents> {
    private agents;
    private sessions;
    private messageQueue;
    private config;
    constructor(config?: Partial<CollaborationConfig>);
    /**
     * 注册Agent
     */
    registerAgent(role: AgentRole, agent: BaseAgent): void;
    /**
     * 创建协同会话
     */
    createSession(participants: AgentRole[], leader: AgentRole, task: CollaborationTask): CollaborationSession;
    /**
     * 发送消息
     */
    sendMessage(message: CollaborationMessage): Promise<void>;
    /**
     * 接收消息
     */
    receiveMessage(agentRole: AgentRole): CollaborationMessage | undefined;
    /**
     * 等待响应
     */
    private waitForResponse;
    /**
     * 协同执行任务
     */
    collaborate(task: CollaborationTask, strategy: CollaborationStrategy, context: TaskContext): Promise<TaskResult[]>;
    /**
     * 顺序执行
     */
    private executeSequential;
    /**
     * 并行执行
     */
    private executeParallel;
    /**
     * 层级执行
     */
    private executeHierarchical;
    /**
     * 共识执行
     */
    private executeConsensus;
    /**
     * 拍卖执行
     */
    private executeAuction;
    /**
     * 聚合结果
     */
    private aggregateResults;
    /**
     * 查找Agent所在会话
     */
    private findSessionByAgent;
    /**
     * 获取活跃会话
     */
    getActiveSessions(): CollaborationSession[];
    /**
     * 获取会话
     */
    getSession(sessionId: string): CollaborationSession | undefined;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalSessions: number;
        activeSessions: number;
        totalMessages: number;
        agentParticipation: Map<AgentRole, number>;
    };
}

/**
 * file agent-router.ts
 * description Agent 路由器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Agent 路由器
 */

/**
 * 路由策略
 */
type RoutingStrategy = 'capability-based' | 'load-balanced' | 'performance-based' | 'cost-optimized' | 'hybrid';
/**
 * 路由决策
 */
interface RoutingDecision {
    taskId: string;
    selectedAgent: AgentRole;
    score: number;
    reasons: string[];
    alternatives: {
        agent: AgentRole;
        score: number;
    }[];
    timestamp: Date;
}
/**
 * 路由规则
 */
interface RoutingRule {
    id: string;
    name: string;
    condition: (task: AgentTask, context: TaskContext) => boolean;
    targetAgent: AgentRole;
    priority: number;
}
/**
 * 路由配置
 */
interface RouterConfig {
    strategy: RoutingStrategy;
    enableCaching: boolean;
    enableLearning: boolean;
    maxAlternatives: number;
}
/**
 * Agent智能路由器
 * 实现任务到Agent的智能路由和分配
 */
declare class AgentRouter {
    private agents;
    private loads;
    private rules;
    private config;
    private routingHistory;
    constructor(config?: Partial<RouterConfig>);
    /**
     * 初始化默认路由规则
     */
    private initializeDefaultRules;
    /**
     * 注册Agent
     */
    registerAgent(role: AgentRole, agent: BaseAgent): void;
    /**
     * 添加路由规则
     */
    addRule(rule: RoutingRule): void;
    /**
     * 路由任务
     */
    route(task: AgentTask, context: TaskContext): Promise<RoutingDecision>;
    /**
     * 评估所有Agent
     */
    private evaluateAgents;
    /**
     * 评估单个Agent
     */
    private evaluateAgent;
    /**
     * 基于能力评分
     */
    private scoreByCapability;
    /**
     * 基于负载评分
     */
    private scoreByLoad;
    /**
     * 基于性能评分
     */
    private scoreByPerformance;
    /**
     * 基于规则评分
     */
    private scoreByRules;
    /**
     * 计算加权总分
     */
    private calculateWeightedScore;
    /**
     * 选择最佳Agent
     */
    private selectBestAgent;
    /**
     * 基于负载选择
     */
    private selectByLoad;
    /**
     * 基于性能选择
     */
    private selectByPerformance;
    /**
     * 基于成本选择
     */
    private selectByCost;
    /**
     * 更新学习
     */
    private updateLearning;
    /**
     * 更新Agent负载
     */
    updateLoad(role: AgentRole, delta: number): void;
    /**
     * 更新Agent性能
     */
    updatePerformance(role: AgentRole, success: boolean, duration: number): void;
    /**
     * 获取路由统计
     */
    getStats(): {
        totalRouted: number;
        avgScore: number;
        agentDistribution: Map<AgentRole, number>;
        topRoutes: {
            agent: AgentRole;
            count: number;
        }[];
    };
    /**
     * 获取路由历史
     */
    getHistory(limit?: number): RoutingDecision[];
}

/**
 * file agent-quality-gates.ts
 * description Agent 质量门控
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Agent 质量门控
 */

/**
 * 质量门类型
 */
type AgentQualityGateType = 'input' | 'output' | 'performance' | 'security' | 'compliance' | 'agent-specific';
/**
 * 质量门规则
 */
interface AgentQualityRule {
    id: string;
    name: string;
    description: string;
    type: AgentQualityGateType;
    severity: 'error' | 'warning' | 'info';
    agents?: AgentRole[];
    check: (context: AgentQualityContext) => Promise<AgentQualityResult>;
}
/**
 * 质量检查上下文
 */
interface AgentQualityContext {
    agent: AgentRole;
    task: AgentTask;
    input?: unknown;
    output?: unknown;
    result?: TaskResult;
    context: TaskContext;
    metadata: Record<string, unknown>;
}
/**
 * 质量检查结果
 */
interface AgentQualityResult {
    passed: boolean;
    ruleId: string;
    message: string;
    details?: Record<string, unknown>;
    suggestions?: string[];
}
/**
 * 质量门报告
 */
interface AgentQualityReport {
    agentId: AgentRole;
    taskId: string;
    passed: boolean;
    results: AgentQualityResult[];
    score: number;
    summary: {
        errors: number;
        warnings: number;
        info: number;
    };
    recommendations: string[];
    canProceed: boolean;
}
/**
 * 质量门配置
 */
interface AgentQualityGatesConfig {
    enabled: boolean;
    strictMode: boolean;
    autoFix: boolean;
    maxRetries: number;
}
/**
 * Agent质量门系统
 * 实现Agent执行的质量检查和验证
 */
declare class AgentQualityGates {
    private rules;
    private config;
    private reports;
    constructor(config?: Partial<AgentQualityGatesConfig>);
    /**
     * 初始化默认规则
     */
    private initializeDefaultRules;
    /**
     * 获取性能阈值
     */
    private getPerformanceThreshold;
    /**
     * 添加规则
     */
    addRule(rule: AgentQualityRule): void;
    /**
     * 移除规则
     */
    removeRule(ruleId: string): boolean;
    /**
     * 执行质量检查
     */
    check(context: AgentQualityContext): Promise<AgentQualityReport>;
    /**
     * 计算质量分数
     */
    private calculateScore;
    /**
     * 快速检查输入
     */
    checkInput(agent: AgentRole, task: AgentTask, context: TaskContext): Promise<AgentQualityReport>;
    /**
     * 快速检查输出
     */
    checkOutput(agent: AgentRole, task: AgentTask, result: TaskResult, context: TaskContext): Promise<AgentQualityReport>;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalChecks: number;
        passRate: number;
        avgScore: number;
        errorDistribution: Map<AgentRole, number>;
        topIssues: string[];
    };
    /**
     * 获取最近的报告
     */
    getRecentReports(limit?: number): AgentQualityReport[];
    /**
     * 启用/禁用质量门
     */
    setEnabled(enabled: boolean): void;
    /**
     * 设置严格模式
     */
    setStrictMode(strict: boolean): void;
}

/**
 * file definitions.ts
 * description 定义常量
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai-family]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 定义常量
 */

/**
 * 获取所有智能体定义
 */
declare function getAllAgentDefinitions(): AgentDefinition[];

/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */

/**
 * 技能类别
 */
type SkillCategory = 'reasoning' | 'generation' | 'analysis' | 'automation' | 'integration' | 'industry';
/**
 * 技能定义
 */
interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    category: SkillCategory;
    tags?: string[];
    handler?: SkillHandler;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
/**
 * 技能执行上下文
 */
interface ExecutionContext$1 {
    sessionId: string;
    userId?: string;
    provider: AIProviderType;
    model?: string;
    messages: ChatMessage[];
    variables: Record<string, unknown>;
    metadata: Record<string, unknown>;
}
/**
 * 技能执行结果
 */
interface SkillExecutionResult {
    success: boolean;
    output?: unknown;
    error?: string;
    duration?: number;
    tokens?: {
        input: number;
        output: number;
    };
}
/**
 * 技能处理器
 */
type SkillHandler = (input: unknown, context: ExecutionContext$1) => Promise<SkillExecutionResult>;
/**
 * 技能注册项
 */
interface SkillRegistryItem extends SkillDefinition {
    handler: SkillHandler;
    registeredAt: Date;
    lastExecuted?: Date;
    executionCount: number;
    successCount: number;
    totalDuration: number;
}

/**
 * file manager.ts
 * description 管理器核心
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 管理器核心
 */

/**
 * 技能管理器配置
 */
interface SkillManagerConfig {
    maxConcurrent?: number;
    timeout?: number;
}
/**
 * 技能管理器
 * 负责技能的注册、执行和编排
 */
declare class SkillManager {
    private registry;
    private config;
    constructor(config?: SkillManagerConfig);
    /**
     * 注册技能
     */
    register(definition: SkillDefinition, handler: SkillHandler): void;
    /**
     * 注销技能
     */
    unregister(skillId: string): boolean;
    /**
     * 获取技能
     */
    get(skillId: string): SkillRegistryItem | undefined;
    /**
     * 获取所有技能
     */
    getAll(): SkillRegistryItem[];
    /**
     * 按类别获取技能
     */
    getByCategory(category: SkillCategory): SkillRegistryItem[];
    /**
     * 执行技能
     */
    execute(skillId: string, input: unknown, context: ExecutionContext$1): Promise<SkillExecutionResult>;
    /**
     * 执行技能链
     */
    executeChain(skills: Array<{
        id: string;
        input?: unknown;
    }>, initialInput: unknown, context: ExecutionContext$1): Promise<SkillExecutionResult>;
    /**
     * 推荐技能
     */
    recommend(task: string): SkillRegistryItem[];
    /**
     * 清空注册表
     */
    clear(): void;
}

/**
 * file skill-recommender.ts
 * description 技能推荐器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 技能推荐器
 */

/**
 * 技能推荐结果
 */
interface SkillRecommendation {
    skillId: string;
    skillName: string;
    score: number;
    confidence: number;
    reasons: string[];
    context: {
        taskType: string;
        historyMatch: number;
        performanceScore: number;
        capabilityMatch: number;
    };
}
/**
 * 推荐上下文
 */
interface RecommendationContext {
    taskType: string;
    input: unknown;
    keywords: string[];
    history?: SkillExecutionHistory[];
    preferences?: UserPreferences;
}
/**
 * 技能执行历史
 */
interface SkillExecutionHistory {
    skillId: string;
    taskType: string;
    success: boolean;
    duration: number;
    timestamp: Date;
    userRating?: number;
}
/**
 * 用户偏好
 */
interface UserPreferences {
    preferredSkills: string[];
    avoidedSkills: string[];
    performanceThreshold: number;
}
/**
 * 技能推荐引擎
 * 基于多维度推荐最优技能
 */
declare class SkillRecommender {
    private history;
    private preferences;
    /**
     * 推荐技能
     */
    recommend(skills: SkillRegistryItem[], context: RecommendationContext): SkillRecommendation[];
    /**
     * 评估单个技能
     */
    private evaluateSkill;
    /**
     * 基于任务类型评分
     */
    private scoreByTaskType;
    /**
     * 基于关键词评分
     */
    private scoreByKeywords;
    /**
     * 基于历史评分
     */
    private scoreByHistory;
    /**
     * 基于性能评分
     */
    private scoreByPerformance;
    /**
     * 基于用户偏好评分
     */
    private scoreByPreference;
    /**
     * 计算加权总分
     */
    private calculateWeightedScore;
    /**
     * 计算置信度
     */
    private calculateConfidence;
    /**
     * 生成推荐理由
     */
    private generateReasons;
    /**
     * 更新执行历史
     */
    updateHistory(history: SkillExecutionHistory): void;
    /**
     * 更新用户偏好
     */
    updatePreferences(preferences: Partial<UserPreferences>): void;
    /**
     * 获取推荐统计
     */
    getStats(): {
        totalRecommendations: number;
        avgScore: number;
        topSkills: string[];
    };
}

/**
 * file skill-learner.ts
 * description 技能学习器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 技能学习器
 */

/**
 * 学习数据
 */
interface LearningData {
    skillId: string;
    executionResult: SkillExecutionResult;
    userFeedback?: UserFeedback;
    context: ExecutionContext;
    timestamp: Date;
}
/**
 * 用户反馈
 */
interface UserFeedback {
    rating: number;
    comment?: string;
    tags?: string[];
    issues?: string[];
}
/**
 * 执行上下文
 */
interface ExecutionContext {
    taskType: string;
    inputSize: number;
    complexity: number;
    resourceUsage: {
        memory: number;
        cpu: number;
        time: number;
    };
}
/**
 * 技能优化建议
 */
interface SkillOptimization {
    skillId: string;
    improvements: string[];
    warnings: string[];
    performance: {
        currentScore: number;
        predictedScore: number;
        confidence: number;
    };
    recommendations: {
        parameter: string;
        currentValue: unknown;
        suggestedValue: unknown;
        reason: string;
    }[];
}
/**
 * 学习模型
 */
interface LearningModel {
    skillId: string;
    patterns: ExecutionPattern[];
    optimizations: Map<string, unknown>;
    performance: PerformanceMetrics;
    lastUpdated: Date;
}
/**
 * 执行模式
 */
interface ExecutionPattern {
    condition: string;
    action: string;
    success: boolean;
    frequency: number;
}
/**
 * 性能指标
 */
interface PerformanceMetrics {
    successRate: number;
    avgDuration: number;
    avgRating: number;
    errorRate: number;
    improvementTrend: number;
}
/**
 * 技能学习系统
 * 基于执行反馈学习和优化技能
 */
declare class SkillLearner {
    private learningData;
    private models;
    private optimizations;
    /**
     * 学习执行结果
     */
    learn(data: LearningData): SkillOptimization;
    /**
     * 更新学习模型
     */
    private updateModel;
    /**
     * 提取执行模式
     */
    private extractPatterns;
    /**
     * 提取条件
     */
    private extractCondition;
    /**
     * 提取动作
     */
    private extractAction;
    /**
     * 计算性能指标
     */
    private calculatePerformance;
    /**
     * 生成优化建议
     */
    private generateOptimization;
    /**
     * 获取优化建议
     */
    getOptimization(skillId: string): SkillOptimization | undefined;
    /**
     * 获取学习模型
     */
    getModel(skillId: string): LearningModel | undefined;
    /**
     * 获取所有学习统计
     */
    getStats(): {
        totalSkills: number;
        totalExecutions: number;
        avgSuccessRate: number;
        topPerformers: string[];
        needsImprovement: string[];
    };
    /**
     * 清理旧数据
     */
    cleanup(maxAge?: number): void;
}

/**
 * file skill-composer.ts
 * description 技能编排器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 技能编排器
 */

/**
 * 编排模式
 */
type CompositionMode = 'sequential' | 'parallel' | 'conditional' | 'pipeline';
/**
 * 编排步骤
 */
interface CompositionStep {
    skillId: string;
    input?: unknown;
    condition?: string;
    onFailure?: 'skip' | 'abort' | 'retry';
    retryCount?: number;
    timeout?: number;
}
/**
 * 编排定义
 */
interface CompositionDefinition {
    id: string;
    name: string;
    description: string;
    mode: CompositionMode;
    steps: CompositionStep[];
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
    errorHandling?: {
        strategy: 'fail-fast' | 'continue' | 'rollback';
        maxErrors?: number;
    };
}
/**
 * 编排执行结果
 */
interface CompositionResult {
    success: boolean;
    results: Map<string, SkillExecutionResult>;
    finalOutput: unknown;
    duration: number;
    errors: string[];
    executedSteps: string[];
}
/**
 * 技能组合编排器
 * 支持多技能的组合执行和编排
 */
declare class SkillComposer {
    private compositions;
    /**
     * 注册编排
     */
    register(definition: CompositionDefinition): void;
    /**
     * 注销编排
     */
    unregister(compositionId: string): boolean;
    /**
     * 获取编排
     */
    get(compositionId: string): CompositionDefinition | undefined;
    /**
     * 获取所有编排
     */
    getAll(): CompositionDefinition[];
    /**
     * 执行编排
     */
    execute(compositionId: string, input: unknown, context: ExecutionContext$1, skillExecutor: (skillId: string, input: unknown, ctx: ExecutionContext$1) => Promise<SkillExecutionResult>): Promise<CompositionResult>;
    /**
     * 顺序执行
     */
    private executeSequential;
    /**
     * 并行执行
     */
    private executeParallel;
    /**
     * 条件执行
     */
    private executeConditional;
    /**
     * 管道执行
     */
    private executePipeline;
    /**
     * 执行单个步骤
     */
    private executeStep;
    /**
     * 评估条件
     */
    private evaluateCondition;
    /**
     * 创建预定义编排
     */
    createPredefinedCompositions(): void;
}

/**
 * file skill-quality-gates.ts
 * description 技能质量门控
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[ai]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 技能质量门控
 */

/**
 * 质量门检查类型
 */
type QualityGateType = 'input' | 'output' | 'performance' | 'security' | 'compliance';
/**
 * 质量门规则
 */
interface QualityGateRule {
    id: string;
    name: string;
    description: string;
    type: QualityGateType;
    severity: 'error' | 'warning' | 'info';
    check: (context: QualityCheckContext) => Promise<QualityCheckResult>;
}
/**
 * 质量检查上下文
 */
interface QualityCheckContext {
    skill: SkillRegistryItem;
    input: unknown;
    output?: unknown;
    result?: SkillExecutionResult;
    metadata: Record<string, unknown>;
}
/**
 * 质量检查结果
 */
interface QualityCheckResult {
    passed: boolean;
    ruleId: string;
    message: string;
    details?: Record<string, unknown>;
    suggestions?: string[];
}
/**
 * 质量门报告
 */
interface QualityGateReport {
    skillId: string;
    passed: boolean;
    results: QualityCheckResult[];
    score: number;
    summary: {
        errors: number;
        warnings: number;
        info: number;
    };
    recommendations: string[];
}
/**
 * 质量门配置
 */
interface QualityGateConfig {
    enabled: boolean;
    strictMode: boolean;
    skipWarnings: boolean;
    customRules: QualityGateRule[];
}
/**
 * 技能质量门
 * 技能执行的质量检查和验证
 */
declare class SkillQualityGates {
    private rules;
    private config;
    constructor(config?: Partial<QualityGateConfig>);
    /**
     * 初始化默认规则
     */
    private initializeDefaultRules;
    /**
     * 添加规则
     */
    addRule(rule: QualityGateRule): void;
    /**
     * 移除规则
     */
    removeRule(ruleId: string): boolean;
    /**
     * 获取规则
     */
    getRule(ruleId: string): QualityGateRule | undefined;
    /**
     * 获取所有规则
     */
    getAllRules(): QualityGateRule[];
    /**
     * 执行质量检查
     */
    check(context: QualityCheckContext): Promise<QualityGateReport>;
    /**
     * 计算质量分数
     */
    private calculateScore;
    /**
     * 快速检查输入
     */
    checkInput(skill: SkillRegistryItem, input: unknown): Promise<QualityGateReport>;
    /**
     * 快速检查输出
     */
    checkOutput(skill: SkillRegistryItem, input: unknown, output: unknown, result: SkillExecutionResult): Promise<QualityGateReport>;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalRules: number;
        byType: Record<QualityGateType, number>;
        bySeverity: Record<string, number>;
    };
    /**
     * 启用/禁用质量门
     */
    setEnabled(enabled: boolean): void;
    /**
     * 设置严格模式
     */
    setStrictMode(strict: boolean): void;
}

/**
 * MCP 消息
 */
interface MCPMessage {
    jsonrpc: '2.0';
    id?: string | number;
    method?: string;
    params?: Record<string, unknown>;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
/**
 * MCP 工具定义
 */
interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description?: string;
            enum?: string[];
        }>;
        required?: string[];
    };
}
/**
 * MCP 资源
 */
interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
/**
 * MCP 服务器能力
 */
interface MCPServerCapabilities {
    tools?: {
        listChanged?: boolean;
    };
    resources?: {
        subscribe?: boolean;
        listChanged?: boolean;
    };
    prompts?: {
        listChanged?: boolean;
    };
    logging?: object;
    sampling?: object;
    roots?: {
        listChanged?: boolean;
    };
}
/**
 * MCP 传输接口
 */
interface MCPTransport {
    connected: boolean;
    connect(): Promise<void>;
    send(message: MCPMessage): Promise<void>;
    onMessage(handler: (message: MCPMessage) => void): void;
    close(): Promise<void>;
}
/**
 * MCP 客户端配置
 */
interface MCPClientConfig {
    name: string;
    version: string;
    transport: MCPTransport;
    capabilities?: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
    };
}
/**
 * MCP 工具调用结果
 */
interface MCPToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}

/**
 * file client.ts
 * description MCP 客户端
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 客户端
 */

/**
 * MCP 客户端事件
 */
interface MCPClientEvents {
    connected: () => void;
    disconnected: () => void;
    error: (error: Error) => void;
    toolListChanged: (tools: MCPTool[]) => void;
    resourceListChanged: (resources: MCPResource[]) => void;
}
/**
 * MCP 客户端
 * 实现 Model Context Protocol 客户端
 */
declare class MCPClient extends EventEmitter$1<MCPClientEvents> {
    private config;
    private transport;
    private messageId;
    private pendingRequests;
    private _tools;
    private _resources;
    private _capabilities?;
    constructor(config: MCPClientConfig);
    get connected(): boolean;
    get tools(): MCPTool[];
    get resources(): MCPResource[];
    get capabilities(): MCPServerCapabilities | undefined;
    /**
     * 连接到 MCP 服务器
     */
    connect(): Promise<void>;
    /**
     * 刷新工具列表
     */
    refreshTools(): Promise<MCPTool[]>;
    /**
     * 刷新资源列表
     */
    refreshResources(): Promise<MCPResource[]>;
    /**
     * 调用工具
     */
    callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult>;
    /**
     * 读取资源
     */
    readResource(uri: string): Promise<unknown>;
    /**
     * 发送请求
     */
    private request;
    /**
     * 发送通知
     */
    private notify;
    /**
     * 设置传输层消息处理
     */
    private setupTransport;
    /**
     * 处理通知
     */
    private handleNotification;
    /**
     * 关闭连接
     */
    close(): Promise<void>;
}

/**
 * file transport.ts
 * description MCP 传输层
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 传输层
 */

/**
 * Stdio 传输配置
 */
interface StdioTransportConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
/**
 * Stdio 传输实现
 * 通过标准输入输出与 MCP 服务器通信
 */
declare class StdioTransport implements MCPTransport {
    private config;
    private _connected;
    private messageHandler?;
    private process?;
    constructor(config: StdioTransportConfig);
    get connected(): boolean;
    connect(): Promise<void>;
    send(message: MCPMessage): Promise<void>;
    onMessage(handler: (message: MCPMessage) => void): void;
    close(): Promise<void>;
}

/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */
/**
 * 多模态类型
 */
type MultimodalType = 'image' | 'audio' | 'document' | 'video';
/**
 * 图像格式
 */
type ImageFormat = 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp';
/**
 * 音频格式
 */
type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a';
/**
 * 文档格式
 */
type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'md' | 'html';
/**
 * 多模态输入
 */
interface MultimodalInput {
    type: MultimodalType;
    data: string | Buffer;
    format?: string;
    metadata?: Record<string, unknown>;
}
/**
 * 图像输入
 */
interface ImageInput extends MultimodalInput {
    type: 'image';
    format: ImageFormat;
    width?: number;
    height?: number;
}
/**
 * 音频输入
 */
interface AudioInput extends MultimodalInput {
    type: 'audio';
    format: AudioFormat;
    duration?: number;
    sampleRate?: number;
    channels?: number;
}
/**
 * 文档输入
 */
interface DocumentInput extends MultimodalInput {
    type: 'document';
    format: DocumentFormat;
    pageCount?: number;
    language?: string;
}
/**
 * 图像分析选项
 */
interface ImageAnalysisOptions {
    tasks?: ImageAnalysisTask[];
    detail?: 'low' | 'high' | 'auto';
    maxTokens?: number;
}
/**
 * 图像分析任务
 */
type ImageAnalysisTask = 'describe' | 'ocr' | 'classify' | 'detect' | 'segment' | 'face' | 'caption';
/**
 * 图像分析结果
 */
interface ImageAnalysisResult {
    description?: string;
    text?: string;
    labels?: Array<{
        label: string;
        confidence: number;
    }>;
    objects?: Array<{
        name: string;
        bbox: [number, number, number, number];
        confidence: number;
    }>;
    faces?: Array<{
        bbox: [number, number, number, number];
        attributes?: Record<string, unknown>;
    }>;
    caption?: string;
    tokens?: {
        input: number;
        output: number;
    };
}
/**
 * 音频转录选项
 */
interface AudioTranscriptionOptions {
    language?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
    timestampGranularities?: ('word' | 'segment')[];
}
/**
 * 音频转录结果
 */
interface AudioTranscriptionResult {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
    }>;
    words?: Array<{
        word: string;
        start: number;
        end: number;
    }>;
}
/**
 * 语音合成选项
 */
interface TextToSpeechOptions {
    voice?: string;
    model?: string;
    speed?: number;
    format?: AudioFormat;
}
/**
 * 语音合成结果
 */
interface TextToSpeechResult {
    audio: Buffer;
    format: AudioFormat;
    duration: number;
}
/**
 * 文档解析选项
 */
interface DocumentParseOptions {
    extractText?: boolean;
    extractImages?: boolean;
    extractTables?: boolean;
    extractMetadata?: boolean;
    ocrLanguage?: string;
}
/**
 * 文档解析结果
 */
interface DocumentParseResult {
    text?: string;
    pages?: Array<{
        number: number;
        text: string;
        images?: Array<{
            data: Buffer;
            format: string;
        }>;
        tables?: Array<{
            data: string[][];
        }>;
    }>;
    images?: Array<{
        data: Buffer;
        format: string;
        page?: number;
    }>;
    tables?: Array<{
        data: string[][];
        page?: number;
    }>;
    metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
        pageCount?: number;
    };
}
/**
 * 多模态处理结果
 */
interface MultimodalResult {
    success: boolean;
    type: MultimodalType;
    result?: ImageAnalysisResult | AudioTranscriptionResult | DocumentParseResult | unknown;
    error?: string;
    duration: number;
}
/**
 * 多模态处理器配置
 */
interface MultimodalProcessorConfig {
    openai?: {
        apiKey?: string;
        baseUrl?: string;
    };
    ollama?: {
        baseUrl?: string;
    };
    visionModel?: string;
    audioModel?: string;
}

/**
 * file image-processor.ts
 * description 图像处理器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 图像处理器
 */

/**
 * 图像处理器
 */
declare class ImageProcessor {
    private authManager;
    private defaultModel;
    constructor(authManager: UnifiedAuthManager, model?: string);
    /**
     * 分析图像
     */
    analyze(image: ImageInput, options?: ImageAnalysisOptions): Promise<ImageAnalysisResult>;
    /**
     * 执行单个分析任务
     */
    private executeTask;
    /**
     * 构建任务提示词
     */
    private buildPrompt;
    /**
     * 解析分析结果
     */
    private parseResult;
    /**
     * 准备图像数据
     */
    private prepareImageData;
    /**
     * 提取标签
     */
    private extractLabels;
    /**
     * 提取物体
     */
    private extractObjects;
    /**
     * 批量分析图像
     */
    analyzeBatch(images: ImageInput[], options?: ImageAnalysisOptions): Promise<ImageAnalysisResult[]>;
}

/**
 * file audio-processor.ts
 * description 音频处理器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 音频处理器
 */

/**
 * 音频处理器配置
 */
interface AudioProcessorConfig {
    openaiApiKey?: string;
    openaiBaseUrl?: string;
    ollamaBaseUrl?: string;
    defaultModel?: string;
}
/**
 * 音频处理器
 */
declare class AudioProcessor {
    private config;
    constructor(config: AudioProcessorConfig);
    /**
     * 转录音频
     */
    transcribe(audio: AudioInput, options?: AudioTranscriptionOptions): Promise<AudioTranscriptionResult>;
    /**
     * 语音合成
     */
    synthesize(text: string, options?: TextToSpeechOptions): Promise<TextToSpeechResult>;
    /**
     * 估算音频时长
     */
    private estimateDuration;
}

/**
 * file document-processor.ts
 * description 文档处理器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 文档处理器
 */

/**
 * 文档处理器
 */
declare class DocumentProcessor {
    private authManager;
    constructor(authManager: UnifiedAuthManager);
    /**
     * 解析文档
     */
    parse(document: DocumentInput, options?: DocumentParseOptions): Promise<DocumentParseResult>;
    /**
     * 提取文本
     */
    private extractText;
    /**
     * 去除 HTML 标签
     */
    private stripHtml;
    /**
     * 解析复杂文档
     */
    private parseComplexDocument;
    /**
     * 提取元数据
     */
    private extractMetadata;
    /**
     * 摘要文档
     */
    summarize(document: DocumentInput, maxLength?: number): Promise<string>;
    /**
     * 提取关键信息
     */
    extractKeyInfo(document: DocumentInput, keys: string[]): Promise<Record<string, string>>;
    /**
     * 解析关键信息
     */
    private parseKeyInfo;
    /**
     * 对比文档
     */
    compare(document1: DocumentInput, document2: DocumentInput): Promise<{
        similarities: string[];
        differences: string[];
        summary: string;
    }>;
    /**
     * 提取列表
     */
    private extractList;
}

/**
 * file manager.ts
 * description 管理器核心
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 管理器核心
 */

/**
 * 多模态管理器事件
 */
interface MultimodalEvents {
    processing_started: {
        type: string;
        input: MultimodalInput;
    };
    processing_completed: {
        type: string;
        result: MultimodalResult;
    };
    processing_failed: {
        type: string;
        error: string;
    };
}
/**
 * 多模态管理器
 */
declare class MultimodalManager extends EventEmitter<MultimodalEvents> {
    private _authManager;
    private _config;
    private imageProcessor;
    private audioProcessor;
    private documentProcessor;
    constructor(authManager: UnifiedAuthManager, config?: MultimodalProcessorConfig);
    /**
     * 获取认证管理器
     */
    get authManager(): UnifiedAuthManager;
    /**
     * 获取配置
     */
    get config(): MultimodalProcessorConfig;
    /**
     * 处理多模态输入
     */
    process(input: MultimodalInput): Promise<MultimodalResult>;
    /**
     * 处理图像
     */
    processImage(image: ImageInput, options?: ImageAnalysisOptions): Promise<ImageAnalysisResult>;
    /**
     * 处理音频
     */
    processAudio(audio: AudioInput, options?: AudioTranscriptionOptions): Promise<AudioTranscriptionResult>;
    /**
     * 处理文档
     */
    processDocument(document: DocumentInput, options?: DocumentParseOptions): Promise<DocumentParseResult>;
    /**
     * 处理视频
     */
    private processVideo;
    /**
     * 分析图像
     */
    analyzeImage(image: ImageInput, options?: ImageAnalysisOptions): Promise<ImageAnalysisResult>;
    /**
     * 转录音频
     */
    transcribeAudio(audio: AudioInput, options?: AudioTranscriptionOptions): Promise<AudioTranscriptionResult>;
    /**
     * 语音合成
     */
    synthesizeSpeech(text: string, options?: TextToSpeechOptions): Promise<TextToSpeechResult>;
    /**
     * 解析文档
     */
    parseDocument(document: DocumentInput, options?: DocumentParseOptions): Promise<DocumentParseResult>;
    /**
     * 摘要文档
     */
    summarizeDocument(document: DocumentInput, maxLength?: number): Promise<string>;
    /**
     * 批量处理
     */
    processBatch(inputs: MultimodalInput[]): Promise<MultimodalResult[]>;
    /**
     * 获取处理器
     */
    getImageProcessor(): ImageProcessor;
    getAudioProcessor(): AudioProcessor;
    getDocumentProcessor(): DocumentProcessor;
}

/**
 * 快速启动函数
 */
declare function quickStart(config?: {
    provider?: ProviderType;
    silent?: boolean;
}): Promise<QuickStartResult>;
/**
 * 版本信息
 */
declare const VERSION: "1.3.0";
declare const PACKAGE_INFO: {
    name: string;
    version: "1.3.0";
    description: string;
    author: string;
    license: string;
};

export { AIFamilyManager, type AIProviderType, AgentCollaboration, type AgentLayer, AgentLayers, AgentQualityGates, type AgentRole, AgentRouter, type AgentTask, AnthropicProvider, AudioProcessor, AuthMonitor, type AuthProvider, type AuthProviderInfo, type AuthState, type AuthStatus, AuthSwitcher, AutoDetector, BaseAgent, type ChatCompletionResponse, type ChatMessage, type CollaborationStrategy, type CompositionMode, DocumentProcessor, type HealthCheckResult, ImageProcessor, MCPClient, type MCPMessage, type MCPResource, type MCPTool, type MultimodalInput, MultimodalManager, type MultimodalResult, OllamaProvider, OpenAIProvider, PACKAGE_INFO, type ProviderStatus, type ProviderType, type QualityGateReport, type QuickStartConfig, type QuickStartResult, QuickStarter, type RoutingStrategy, SkillComposer, type SkillDefinition, type SkillExecutionResult, SkillLearner, SkillManager, SkillQualityGates, type SkillRecommendation, SkillRecommender, SmartSelector, StdioTransport, type SwitchDecision, type SwitchStrategy, type SystemStatus, type TaskContext, type TaskResult, UnifiedAuthManager, VERSION, getAllAgentDefinitions, quickStart };
