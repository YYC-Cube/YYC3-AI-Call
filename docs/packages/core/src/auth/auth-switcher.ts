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
import { EventEmitter } from 'eventemitter3'
import type { AIProviderType } from '../types.js'
import type { AuthState, HealthCheckResult } from './auth-monitor.js'

/**
 * 切换策略
 */
export type SwitchStrategy = 
  | 'failover'
  | 'load-balance'
  | 'cost-optimize'
  | 'performance-optimize'
  | 'manual'

/**
 * 切换原因
 */
export type SwitchReason = 
  | 'failure'
  | 'performance'
  | 'cost'
  | 'manual'
  | 'quota'
  | 'maintenance'

/**
 * 切换决策
 */
export interface SwitchDecision {
  from: AIProviderType
  to: AIProviderType
  reason: SwitchReason
  timestamp: Date
  success: boolean
  error?: string
}

/**
 * 切换配置
 */
export interface AuthSwitcherConfig {
  strategy: SwitchStrategy
  enableAutoSwitch: boolean
  maxRetries: number
  retryDelay: number
  cooldownPeriod: number
  priorityOrder: AIProviderType[]
}

/**
 * 切换事件
 */
export interface AuthSwitcherEvents {
  switch_triggered: { decision: SwitchDecision }
  switch_completed: { decision: SwitchDecision }
  switch_failed: { decision: SwitchDecision; error: string }
  provider_degraded: { provider: AIProviderType; reason: string }
  provider_recovered: { provider: AIProviderType }
}

/**
 * 认证智能切换器
 * 实现智能的提供商切换和故障恢复
 */
export class AuthSwitcher extends EventEmitter<AuthSwitcherEvents> {
  private config: Required<AuthSwitcherConfig>
  private currentProvider: AIProviderType | null = null
  private switchHistory: SwitchDecision[] = []
  private degradedProviders: Set<AIProviderType> = new Set()
  private lastSwitchTime: Date | null = null

  constructor(config: Partial<AuthSwitcherConfig> = {}) {
    super()
    this.config = {
      strategy: config.strategy ?? 'failover',
      enableAutoSwitch: config.enableAutoSwitch ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      cooldownPeriod: config.cooldownPeriod ?? 5000,
      priorityOrder: config.priorityOrder ?? ['openai', 'ollama', 'anthropic', 'azure'],
    }
  }

  /**
   * 设置当前提供商
   */
  setCurrentProvider(provider: AIProviderType): void {
    this.currentProvider = provider
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider(): AIProviderType | null {
    return this.currentProvider
  }

  /**
   * 决定是否需要切换
   */
  shouldSwitch(
    currentHealth: HealthCheckResult,
    allStates: Map<AIProviderType, AuthState>
  ): boolean {
    if (!this.config.enableAutoSwitch) {
      return false
    }

    if (this.lastSwitchTime) {
      const elapsed = Date.now() - this.lastSwitchTime.getTime()
      if (elapsed < this.config.cooldownPeriod) {
        return false
      }
    }

    if (!currentHealth.healthy) {
      return true
    }

    if (currentHealth.latency > 5000) {
      return true
    }

    const currentState = allStates.get(currentHealth.provider)
    if (currentState && currentState.errorCount >= 3) {
      return true
    }

    return false
  }

  /**
   * 选择最佳提供商
   */
  selectBestProvider(
    availableProviders: AIProviderType[],
    states: Map<AIProviderType, AuthState>
  ): AIProviderType {
    const healthy = availableProviders.filter(p => {
      const state = states.get(p)
      return state?.healthy && !this.degradedProviders.has(p)
    })

    if (healthy.length === 0) {
      const degraded = availableProviders.filter(p => !this.degradedProviders.has(p))
      if (degraded.length > 0) {
        return degraded[0]
      }
      return availableProviders[0]
    }

    switch (this.config.strategy) {
      case 'failover':
        return this.selectByPriority(healthy)

      case 'load-balance':
        return this.selectByLoadBalance(healthy, states)

      case 'cost-optimize':
        return this.selectByCost(healthy)

      case 'performance-optimize':
        return this.selectByPerformance(healthy, states)

      case 'manual':
        return this.currentProvider || healthy[0]

      default:
        return healthy[0]
    }
  }

  /**
   * 按优先级选择
   */
  private selectByPriority(providers: AIProviderType[]): AIProviderType {
    for (const provider of this.config.priorityOrder) {
      if (providers.includes(provider)) {
        return provider
      }
    }
    return providers[0]
  }

  /**
   * 按负载均衡选择
   */
  private selectByLoadBalance(
    providers: AIProviderType[],
    states: Map<AIProviderType, AuthState>
  ): AIProviderType {
    let minLatency = Infinity
    let selected = providers[0]

    for (const provider of providers) {
      const state = states.get(provider)
      if (state && state.latency < minLatency) {
        minLatency = state.latency
        selected = provider
      }
    }

    return selected
  }

  /**
   * 按成本选择
   */
  private selectByCost(providers: AIProviderType[]): AIProviderType {
    const costOrder: AIProviderType[] = ['ollama', 'openai', 'anthropic', 'azure']
    
    for (const provider of costOrder) {
      if (providers.includes(provider)) {
        return provider
      }
    }
    
    return providers[0]
  }

  /**
   * 按性能选择
   */
  private selectByPerformance(
    providers: AIProviderType[],
    states: Map<AIProviderType, AuthState>
  ): AIProviderType {
    let bestScore = 0
    let selected = providers[0]

    for (const provider of providers) {
      const state = states.get(provider)
      if (state) {
        const score = this.calculatePerformanceScore(state)
        if (score > bestScore) {
          bestScore = score
          selected = provider
        }
      }
    }

    return selected
  }

  /**
   * 计算性能分数
   */
  private calculatePerformanceScore(state: AuthState): number {
    const healthScore = state.healthy ? 1 : 0
    const latencyScore = Math.max(0, 1 - state.latency / 5000)
    const errorScore = Math.max(0, 1 - state.errorCount / 10)

    return healthScore * 0.5 + latencyScore * 0.3 + errorScore * 0.2
  }

  /**
   * 执行切换
   */
  async switch(
    from: AIProviderType,
    to: AIProviderType,
    reason: SwitchReason,
    switchFn: () => Promise<void>
  ): Promise<SwitchDecision> {
    const decision: SwitchDecision = {
      from,
      to,
      reason,
      timestamp: new Date(),
      success: false,
    }

    this.emit('switch_triggered', { decision })

    try {
      await switchFn()
      
      decision.success = true
      this.currentProvider = to
      this.lastSwitchTime = new Date()
      
      if (this.degradedProviders.has(from)) {
        this.degradedProviders.delete(from)
        this.emit('provider_recovered', { provider: from })
      }

      this.emit('switch_completed', { decision })
    } catch (error) {
      decision.error = error instanceof Error ? error.message : String(error)
      decision.success = false
      
      this.degradedProviders.add(to)
      this.emit('provider_degraded', {
        provider: to,
        reason: decision.error,
      })
      this.emit('switch_failed', { decision, error: decision.error })
    }

    this.switchHistory.push(decision)
    
    if (this.switchHistory.length > 100) {
      this.switchHistory = this.switchHistory.slice(-100)
    }

    return decision
  }

  /**
   * 标记提供商降级
   */
  markDegraded(provider: AIProviderType, reason: string): void {
    this.degradedProviders.add(provider)
    this.emit('provider_degraded', { provider, reason })
  }

  /**
   * 标记提供商恢复
   */
  markRecovered(provider: AIProviderType): void {
    this.degradedProviders.delete(provider)
    this.emit('provider_recovered', { provider })
  }

  /**
   * 获取切换历史
   */
  getHistory(limit: number = 10): SwitchDecision[] {
    return this.switchHistory.slice(-limit)
  }

  /**
   * 获取降级的提供商
   */
  getDegradedProviders(): AIProviderType[] {
    return Array.from(this.degradedProviders)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSwitches: number
    successfulSwitches: number
    failedSwitches: number
    avgSwitchTime: number
    switchReasons: Map<SwitchReason, number>
  } {
    const successful = this.switchHistory.filter(d => d.success).length
    const failed = this.switchHistory.length - successful
    
    const reasons = new Map<SwitchReason, number>()
    for (const decision of this.switchHistory) {
      reasons.set(decision.reason, (reasons.get(decision.reason) || 0) + 1)
    }

    return {
      totalSwitches: this.switchHistory.length,
      successfulSwitches: successful,
      failedSwitches: failed,
      avgSwitchTime: 0,
      switchReasons: reasons,
    }
  }

  /**
   * 设置策略
   */
  setStrategy(strategy: SwitchStrategy): void {
    this.config.strategy = strategy
  }

  /**
   * 设置优先级顺序
   */
  setPriorityOrder(order: AIProviderType[]): void {
    this.config.priorityOrder = order
  }
}
