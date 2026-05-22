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
import { EventEmitter } from 'eventemitter3'
import type { AIProviderType } from '../types.js'

/**
 * 认证状态
 */
export interface AuthState {
  provider: AIProviderType
  authenticated: boolean
  healthy: boolean
  lastCheck: Date
  errorCount: number
  lastError?: string
  latency: number
  quotaRemaining?: number
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  provider: AIProviderType
  healthy: boolean
  latency: number
  timestamp: Date
  error?: string
  details?: Record<string, unknown>
}

/**
 * 监控配置
 */
export interface AuthMonitorConfig {
  checkInterval: number
  maxErrors: number
  autoRecover: boolean
  alertThreshold: number
}

/**
 * 监控事件
 */
export interface AuthMonitorEvents {
  state_changed: { provider: AIProviderType; state: AuthState }
  health_check: { result: HealthCheckResult }
  error_detected: { provider: AIProviderType; error: string }
  recovery_triggered: { provider: AIProviderType; reason: string }
  quota_warning: { provider: AIProviderType; remaining: number }
}

/**
 * 认证状态监控器
 * 监控认证状态和提供商健康度
 */
export class AuthMonitor extends EventEmitter<AuthMonitorEvents> {
  private states: Map<AIProviderType, AuthState> = new Map()
  private config: Required<AuthMonitorConfig>
  private checkTimer: NodeJS.Timeout | null = null
  private checkFunction: ((provider: AIProviderType) => Promise<HealthCheckResult>) | null = null

  constructor(config: Partial<AuthMonitorConfig> = {}) {
    super()
    this.config = {
      checkInterval: config.checkInterval ?? 60000,
      maxErrors: config.maxErrors ?? 5,
      autoRecover: config.autoRecover ?? true,
      alertThreshold: config.alertThreshold ?? 0.1,
    }
  }

  /**
   * 设置健康检查函数
   */
  setHealthCheckFunction(fn: (provider: AIProviderType) => Promise<HealthCheckResult>): void {
    this.checkFunction = fn
  }

  /**
   * 开始监控
   */
  startMonitoring(providers: AIProviderType[]): void {
    for (const provider of providers) {
      this.states.set(provider, {
        provider,
        authenticated: false,
        healthy: false,
        lastCheck: new Date(),
        errorCount: 0,
        latency: 0,
      })
    }

    this.scheduleNextCheck()
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.checkTimer) {
      clearTimeout(this.checkTimer)
      this.checkTimer = null
    }
  }

  /**
   * 调度下一次检查
   */
  private scheduleNextCheck(): void {
    this.checkTimer = setTimeout(() => {
      this.performChecks()
      this.scheduleNextCheck()
    }, this.config.checkInterval)
  }

  /**
   * 执行健康检查
   */
  private async performChecks(): Promise<void> {
    if (!this.checkFunction) return

    for (const [provider] of this.states) {
      try {
        const result = await this.checkFunction(provider)
        this.updateState(provider, result)
      } catch (error) {
        this.handleError(provider, error instanceof Error ? error.message : String(error))
      }
    }
  }

  /**
   * 更新状态
   */
  private updateState(provider: AIProviderType, result: HealthCheckResult): void {
    const currentState = this.states.get(provider)
    
    const newState: AuthState = {
      provider,
      authenticated: result.healthy,
      healthy: result.healthy,
      lastCheck: result.timestamp,
      errorCount: result.healthy ? 0 : (currentState?.errorCount || 0),
      lastError: result.error,
      latency: result.latency,
      quotaRemaining: result.details?.quotaRemaining as number,
    }

    this.states.set(provider, newState)
    this.emit('health_check', { result })

    if (currentState && this.stateChanged(currentState, newState)) {
      this.emit('state_changed', { provider, state: newState })
    }

    if (newState.quotaRemaining !== undefined && 
        newState.quotaRemaining < this.config.alertThreshold) {
      this.emit('quota_warning', {
        provider,
        remaining: newState.quotaRemaining,
      })
    }
  }

  /**
   * 处理错误
   */
  private handleError(provider: AIProviderType, error: string): void {
    const currentState = this.states.get(provider)
    
    const newState: AuthState = {
      provider,
      authenticated: false,
      healthy: false,
      lastCheck: new Date(),
      errorCount: (currentState?.errorCount || 0) + 1,
      lastError: error,
      latency: 0,
    }

    this.states.set(provider, newState)
    this.emit('error_detected', { provider, error })

    if (newState.errorCount >= this.config.maxErrors && this.config.autoRecover) {
      this.emit('recovery_triggered', {
        provider,
        reason: `错误次数达到阈值: ${newState.errorCount}`,
      })
    }
  }

  /**
   * 检查状态是否改变
   */
  private stateChanged(oldState: AuthState, newState: AuthState): boolean {
    return oldState.authenticated !== newState.authenticated ||
           oldState.healthy !== newState.healthy ||
           oldState.errorCount !== newState.errorCount
  }

  /**
   * 手动触发检查
   */
  async checkNow(provider?: AIProviderType): Promise<HealthCheckResult[]> {
    if (!this.checkFunction) {
      return []
    }

    const providers = provider ? [provider] : Array.from(this.states.keys())
    const results: HealthCheckResult[] = []

    for (const p of providers) {
      try {
        const result = await this.checkFunction(p)
        this.updateState(p, result)
        results.push(result)
      } catch (error) {
        const errorResult: HealthCheckResult = {
          provider: p,
          healthy: false,
          latency: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
        }
        this.handleError(p, errorResult.error || 'Unknown error')
        results.push(errorResult)
      }
    }

    return results
  }

  /**
   * 获取状态
   */
  getState(provider: AIProviderType): AuthState | undefined {
    return this.states.get(provider)
  }

  /**
   * 获取所有状态
   */
  getAllStates(): Map<AIProviderType, AuthState> {
    return new Map(this.states)
  }

  /**
   * 获取健康的提供商
   */
  getHealthyProviders(): AIProviderType[] {
    return Array.from(this.states.entries())
      .filter(([_, state]) => state.healthy)
      .map(([provider]) => provider)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalProviders: number
    healthyProviders: number
    avgLatency: number
    totalErrors: number
  } {
    const states = Array.from(this.states.values())
    const healthyCount = states.filter(s => s.healthy).length
    const totalLatency = states.reduce((sum, s) => sum + s.latency, 0)
    const totalErrors = states.reduce((sum, s) => sum + s.errorCount, 0)

    return {
      totalProviders: states.length,
      healthyProviders: healthyCount,
      avgLatency: states.length > 0 ? totalLatency / states.length : 0,
      totalErrors,
    }
  }

  /**
   * 重置错误计数
   */
  resetErrorCount(provider: AIProviderType): void {
    const state = this.states.get(provider)
    if (state) {
      state.errorCount = 0
      this.states.set(provider, state)
    }
  }

  /**
   * 更新配额信息
   */
  updateQuota(provider: AIProviderType, remaining: number): void {
    const state = this.states.get(provider)
    if (state) {
      state.quotaRemaining = remaining
      this.states.set(provider, state)

      if (remaining < this.config.alertThreshold) {
        this.emit('quota_warning', { provider, remaining })
      }
    }
  }
}
