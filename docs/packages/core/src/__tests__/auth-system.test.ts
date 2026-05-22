/**
 * file auth-system.test.ts
 * description @yyc3/core auth-system.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[auth],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core auth-system.ts 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthMonitor, AuthSwitcher } from '../auth/index.js'
import type { AIProviderType } from '../types.js'
import type { HealthCheckResult, AuthState } from '../auth/auth-monitor.js'

describe('API认证驱动系统', () => {
  describe('AuthMonitor', () => {
    let monitor: AuthMonitor
    let mockHealthCheck: (provider: AIProviderType) => Promise<HealthCheckResult>

    beforeEach(() => {
      monitor = new AuthMonitor({
        checkInterval: 1000,
        maxErrors: 3,
        autoRecover: true,
        alertThreshold: 0.1,
      })

      mockHealthCheck = async (provider: AIProviderType): Promise<HealthCheckResult> => {
        return {
          provider,
          healthy: provider === 'openai',
          latency: provider === 'openai' ? 100 : 5000,
          timestamp: new Date(),
        }
      }

      monitor.setHealthCheckFunction(mockHealthCheck)
    })

    afterEach(() => {
      monitor.stopMonitoring()
    })

    it('应该创建认证监控器实例', () => {
      expect(monitor).toBeDefined()
    })

    it('应该开始监控', () => {
      monitor.startMonitoring(['openai', 'ollama'])
      
      const states = monitor.getAllStates()
      expect(states.size).toBe(2)
    })

    it('应该停止监控', () => {
      monitor.startMonitoring(['openai'])
      monitor.stopMonitoring()
      
      expect(monitor['checkTimer']).toBeNull()
    })

    it('应该手动触发检查', async () => {
      monitor.startMonitoring(['openai', 'ollama'])
      
      const results = await monitor.checkNow()
      
      expect(results.length).toBe(2)
      expect(results[0].provider).toBeDefined()
      expect(results[0].healthy).toBeDefined()
    })

    it('应该获取提供商状态', async () => {
      monitor.startMonitoring(['openai'])
      await monitor.checkNow()
      
      const state = monitor.getState('openai')
      
      expect(state).toBeDefined()
      expect(state!.provider).toBe('openai')
      expect(state!.authenticated).toBeDefined()
      expect(state!.healthy).toBeDefined()
    })

    it('应该获取所有状态', async () => {
      monitor.startMonitoring(['openai', 'ollama'])
      await monitor.checkNow()
      
      const states = monitor.getAllStates()
      
      expect(states.size).toBe(2)
    })

    it('应该获取健康的提供商', async () => {
      monitor.startMonitoring(['openai', 'ollama'])
      await monitor.checkNow()
      
      const healthy = monitor.getHealthyProviders()
      
      expect(healthy).toContain('openai')
    })

    it('应该获取统计信息', async () => {
      monitor.startMonitoring(['openai', 'ollama'])
      await monitor.checkNow()
      
      const stats = monitor.getStats()
      
      expect(stats.totalProviders).toBe(2)
      expect(stats.healthyProviders).toBeGreaterThanOrEqual(0)
      expect(stats.avgLatency).toBeGreaterThanOrEqual(0)
    })

    it('应该重置错误计数', async () => {
      monitor.startMonitoring(['openai'])
      await monitor.checkNow()
      
      monitor.resetErrorCount('openai')
      
      const state = monitor.getState('openai')
      expect(state!.errorCount).toBe(0)
    })

    it('应该更新配额信息', async () => {
      monitor.startMonitoring(['openai'])
      await monitor.checkNow()
      
      monitor.updateQuota('openai', 0.5)
      
      const state = monitor.getState('openai')
      expect(state!.quotaRemaining).toBe(0.5)
    })

    it('应该触发状态变化事件', async () => {
      const stateChangedHandler = vi.fn()
      monitor.on('state_changed', stateChangedHandler)
      
      monitor.startMonitoring(['openai'])
      await monitor.checkNow()
      
      expect(stateChangedHandler).toHaveBeenCalled()
    })

    it('应该触发健康检查事件', async () => {
      const healthCheckHandler = vi.fn()
      monitor.on('health_check', healthCheckHandler)
      
      monitor.startMonitoring(['openai'])
      await monitor.checkNow()
      
      expect(healthCheckHandler).toHaveBeenCalled()
    })

    it('应该触发配额警告事件', async () => {
      const quotaWarningHandler = vi.fn()
      monitor.on('quota_warning', quotaWarningHandler)
      
      monitor.startMonitoring(['openai'])
      await monitor.checkNow()
      
      monitor.updateQuota('openai', 0.05)
      
      expect(quotaWarningHandler).toHaveBeenCalled()
    })
  })

  describe('AuthSwitcher', () => {
    let switcher: AuthSwitcher

    beforeEach(() => {
      switcher = new AuthSwitcher({
        strategy: 'failover',
        enableAutoSwitch: true,
        maxRetries: 3,
        retryDelay: 100,
        cooldownPeriod: 100,
        priorityOrder: ['openai', 'ollama', 'anthropic', 'azure'],
      })
    })

    it('应该创建智能切换器实例', () => {
      expect(switcher).toBeDefined()
    })

    it('应该设置当前提供商', () => {
      switcher.setCurrentProvider('openai')
      
      expect(switcher.getCurrentProvider()).toBe('openai')
    })

    it('应该决定是否需要切换', () => {
      const currentHealth: HealthCheckResult = {
        provider: 'openai',
        healthy: false,
        latency: 5000,
        timestamp: new Date(),
      }

      const states = new Map<AIProviderType, AuthState>()
      states.set('openai', {
        provider: 'openai',
        authenticated: false,
        healthy: false,
        lastCheck: new Date(),
        errorCount: 5,
        latency: 5000,
      })

      const shouldSwitch = switcher.shouldSwitch(currentHealth, states)
      
      expect(shouldSwitch).toBe(true)
    })

    it('应该选择最佳提供商', () => {
      const states = new Map<AIProviderType, AuthState>()
      states.set('openai', {
        provider: 'openai',
        authenticated: true,
        healthy: true,
        lastCheck: new Date(),
        errorCount: 0,
        latency: 100,
      })
      states.set('ollama', {
        provider: 'ollama',
        authenticated: true,
        healthy: true,
        lastCheck: new Date(),
        errorCount: 0,
        latency: 500,
      })

      const best = switcher.selectBestProvider(['openai', 'ollama'], states)
      
      expect(best).toBe('openai')
    })

    it('应该执行切换', async () => {
      const switchFn = vi.fn()
      
      const decision = await switcher.switch(
        'openai',
        'ollama',
        'failure',
        switchFn
      )

      expect(decision).toBeDefined()
      expect(decision.from).toBe('openai')
      expect(decision.to).toBe('ollama')
      expect(decision.reason).toBe('failure')
      expect(decision.success).toBe(true)
    })

    it('应该处理切换失败', async () => {
      const switchFn = vi.fn(() => {
        throw new Error('切换失败')
      })
      
      const decision = await switcher.switch(
        'openai',
        'ollama',
        'failure',
        switchFn
      )

      expect(decision.success).toBe(false)
      expect(decision.error).toContain('切换失败')
    })

    it('应该标记提供商降级', () => {
      switcher.markDegraded('openai', '性能下降')
      
      const degraded = switcher.getDegradedProviders()
      expect(degraded).toContain('openai')
    })

    it('应该标记提供商恢复', () => {
      switcher.markDegraded('openai', '性能下降')
      switcher.markRecovered('openai')
      
      const degraded = switcher.getDegradedProviders()
      expect(degraded).not.toContain('openai')
    })

    it('应该获取切换历史', async () => {
      await switcher.switch('openai', 'ollama', 'failure', vi.fn())
      
      const history = switcher.getHistory(10)
      
      expect(history.length).toBe(1)
      expect(history[0].from).toBe('openai')
      expect(history[0].to).toBe('ollama')
    })

    it('应该获取统计信息', async () => {
      await switcher.switch('openai', 'ollama', 'failure', vi.fn())
      await switcher.switch('ollama', 'openai', 'performance', vi.fn())
      
      const stats = switcher.getStats()
      
      expect(stats.totalSwitches).toBe(2)
      expect(stats.successfulSwitches).toBe(2)
      expect(stats.switchReasons.size).toBeGreaterThan(0)
    })

    it('应该设置策略', () => {
      switcher.setStrategy('load-balance')
      
      expect(switcher['config'].strategy).toBe('load-balance')
    })

    it('应该设置优先级顺序', () => {
      switcher.setPriorityOrder(['anthropic', 'openai', 'ollama'])
      
      expect(switcher['config'].priorityOrder).toEqual(['anthropic', 'openai', 'ollama'])
    })

    it('应该触发切换事件', async () => {
      const switchTriggeredHandler = vi.fn()
      const switchCompletedHandler = vi.fn()
      
      switcher.on('switch_triggered', switchTriggeredHandler)
      switcher.on('switch_completed', switchCompletedHandler)
      
      await switcher.switch('openai', 'ollama', 'failure', vi.fn())
      
      expect(switchTriggeredHandler).toHaveBeenCalled()
      expect(switchCompletedHandler).toHaveBeenCalled()
    })

    it('应该触发降级事件', () => {
      const degradedHandler = vi.fn()
      switcher.on('provider_degraded', degradedHandler)
      
      switcher.markDegraded('openai', '测试降级')
      
      expect(degradedHandler).toHaveBeenCalled()
    })

    it('应该触发恢复事件', () => {
      const recoveredHandler = vi.fn()
      switcher.on('provider_recovered', recoveredHandler)
      
      switcher.markDegraded('openai', '测试降级')
      switcher.markRecovered('openai')
      
      expect(recoveredHandler).toHaveBeenCalled()
    })

    it('应该支持不同的切换策略', () => {
      const states = new Map<AIProviderType, AuthState>()
      states.set('openai', {
        provider: 'openai',
        authenticated: true,
        healthy: true,
        lastCheck: new Date(),
        errorCount: 0,
        latency: 100,
      })
      states.set('ollama', {
        provider: 'ollama',
        authenticated: true,
        healthy: true,
        lastCheck: new Date(),
        errorCount: 0,
        latency: 50,
      })

      switcher.setStrategy('load-balance')
      const selected = switcher.selectBestProvider(['openai', 'ollama'], states)
      
      expect(selected).toBeDefined()
    })
  })
})
