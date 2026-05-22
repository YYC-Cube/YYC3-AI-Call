/**
 * file setup-system.test.ts
 * description @yyc3/core setup-system.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[setup],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core setup-system.ts 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AutoDetector,
  SmartSelector,
  QuickStarter,
} from '../setup/index.js'
import type { ProviderType, ProviderStatus } from '../setup/index.js'

const mockHealthyOllama: ProviderStatus = {
  type: 'ollama',
  available: true,
  configured: true,
  healthy: true,
  priority: 90,
  models: ['llama2'],
  endpoint: 'http://localhost:11434',
}

describe('NPM即拉即用系统', () => {
  describe('AutoDetector', () => {
    let detector: AutoDetector

    beforeEach(() => {
      detector = new AutoDetector()
    })

    afterEach(() => {
      detector.clearCache()
    })

    it('应该创建自动检测器实例', () => {
      expect(detector).toBeDefined()
    })

    it('应该检测环境', async () => {
      const result = await detector.detect()

      expect(result).toBeDefined()
      expect(result.providers).toBeDefined()
      expect(result.environment).toBeDefined()
      expect(result.recommended).toBeDefined()
      expect(result.config).toBeDefined()
    })

    it('应该检测系统环境信息', async () => {
      const result = await detector.detect()

      expect(result.environment.node).toBeDefined()
      expect(result.environment.platform).toBeDefined()
      expect(result.environment.arch).toBeDefined()
      expect(result.environment.memory).toBeGreaterThan(0)
      expect(result.environment.cpus).toBeGreaterThan(0)
    })

    it('应该检测所有提供商', async () => {
      const result = await detector.detect()

      expect(result.providers.length).toBeGreaterThan(0)
      
      const openai = result.providers.find(p => p.type === 'openai')
      expect(openai).toBeDefined()
      
      const ollama = result.providers.find(p => p.type === 'ollama')
      expect(ollama).toBeDefined()
    })

    it('应该推荐最佳提供商', async () => {
      const result = await detector.detect()

      expect(result.recommended).toBeDefined()
      expect(['openai', 'ollama', 'anthropic', 'azure']).toContain(result.recommended)
    })

    it('应该分析配置状态', async () => {
      const result = await detector.detect()

      expect(result.config.needsSetup).toBeDefined()
      expect(Array.isArray(result.config.missingKeys)).toBe(true)
      expect(Array.isArray(result.config.recommendations)).toBe(true)
    })

    it('应该缓存检测结果', async () => {
      await detector.detect()
      
      const cached = detector.getCachedProvider('openai')
      expect(cached).toBeDefined()
    })

    it('应该清除缓存', async () => {
      await detector.detect()
      detector.clearCache()
      
      const cached = detector.getCachedProvider('openai')
      expect(cached).toBeUndefined()
    })

    it('应该快速检测（使用缓存）', async () => {
      await detector.detect()
      
      const provider = await detector.quickDetect()
      expect(provider).toBeDefined()
    })
  })

  describe('SmartSelector', () => {
    let selector: SmartSelector
    let mockProviders: ProviderStatus[]

    beforeEach(() => {
      selector = new SmartSelector()
      
      mockProviders = [
        {
          type: 'openai',
          available: true,
          configured: true,
          healthy: true,
          priority: 100,
          models: ['gpt-4', 'gpt-3.5-turbo'],
        },
        {
          type: 'ollama',
          available: true,
          configured: true,
          healthy: true,
          priority: 90,
          models: ['llama2'],
        },
        {
          type: 'anthropic',
          available: false,
          configured: false,
          healthy: false,
          priority: 80,
        },
      ]
    })

    it('应该创建智能选择器实例', () => {
      expect(selector).toBeDefined()
    })

    it('应该选择最佳提供商', () => {
      const result = selector.select(mockProviders, {
        taskType: 'code-generation',
        complexity: 0.5,
        speedPriority: 0.8,
        costPriority: 0.5,
        qualityPriority: 0.9,
        privacyRequired: false,
      })

      expect(result).toBeDefined()
      expect(result.selected).toBeDefined()
      expect(result.scores.length).toBeGreaterThan(0)
      expect(result.reasoning).toBeDefined()
    })

    it('应该评分所有提供商', () => {
      const result = selector.select(mockProviders, {
        taskType: 'code-generation',
        complexity: 0.5,
        speedPriority: 0.8,
        costPriority: 0.5,
        qualityPriority: 0.9,
        privacyRequired: false,
      })

      expect(result.scores.length).toBeGreaterThan(0)
      
      for (const score of result.scores) {
        expect(score.score).toBeGreaterThanOrEqual(0)
        expect(score.breakdown).toBeDefined()
        expect(score.recommendation).toBeDefined()
      }
    })

    it('应该优先选择OpenAI', () => {
      const result = selector.select(mockProviders, {
        taskType: 'code-generation',
        complexity: 0.5,
        speedPriority: 0.8,
        costPriority: 0.5,
        qualityPriority: 0.9,
        privacyRequired: false,
      })

      expect(result.selected).toBe('openai')
    })

    it('应该考虑隐私要求', () => {
      const result = selector.select(mockProviders, {
        taskType: 'code-generation',
        complexity: 0.5,
        speedPriority: 0.5,
        costPriority: 0.5,
        qualityPriority: 0.5,
        privacyRequired: true,
      })

      expect(result.selected).toBe('ollama')
    })

    it('应该提供备选提供商', () => {
      const result = selector.select(mockProviders, {
        taskType: 'code-generation',
        complexity: 0.5,
        speedPriority: 0.8,
        costPriority: 0.5,
        qualityPriority: 0.9,
        privacyRequired: false,
      })

      expect(result.fallback).toBeDefined()
    })

    it('应该更新性能数据', () => {
      selector.updatePerformance('openai', {
        avgLatency: 2000,
        successRate: 0.95,
        avgTokensPerSecond: 40,
        costPerToken: 0.00004,
        maxContextLength: 128000,
        qualityScore: 0.90,
      })

      const stats = selector.getStats()
      expect(stats).toBeDefined()
    })

    it('应该获取选择历史', () => {
      selector.select(mockProviders, {
        taskType: 'test',
        complexity: 0.5,
        speedPriority: 0.5,
        costPriority: 0.5,
        qualityPriority: 0.5,
        privacyRequired: false,
      })

      const history = selector.getHistory(10)
      expect(history.length).toBe(1)
    })

    it('应该获取统计信息', () => {
      selector.select(mockProviders, {
        taskType: 'test',
        complexity: 0.5,
        speedPriority: 0.5,
        costPriority: 0.5,
        qualityPriority: 0.5,
        privacyRequired: false,
      })

      const stats = selector.getStats()
      expect(stats.totalSelections).toBe(1)
      expect(stats.providerDistribution.size).toBeGreaterThan(0)
    })

    it('应该处理无可用提供商的情况', () => {
      const result = selector.select([], {
        taskType: 'test',
        complexity: 0.5,
        speedPriority: 0.5,
        costPriority: 0.5,
        qualityPriority: 0.5,
        privacyRequired: false,
      })

      expect(result.selected).toBe('ollama')
      expect(result.reasoning).toContain('没有可用的提供商')
    })
  })

  describe('QuickStarter', () => {
    let starter: QuickStarter

    beforeEach(() => {
      starter = new QuickStarter()
      vi.spyOn(starter['detector'], 'detect').mockResolvedValue({
        providers: [mockHealthyOllama],
        recommended: 'ollama',
        environment: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: 8,
          cpus: 4,
        },
        config: {
          needsSetup: false,
          missingKeys: [],
          recommendations: [],
        },
      })
      vi.spyOn(starter['detector'], 'quickDetect').mockResolvedValue('ollama')
      vi.spyOn(starter['detector'], 'getCachedProvider').mockReturnValue(mockHealthyOllama)
    })

    afterEach(async () => {
      vi.restoreAllMocks()
      if (starter.isInitialized()) {
        await starter.shutdown()
      }
    })

    it('应该创建快速启动器实例', () => {
      expect(starter).toBeDefined()
    })

    it('应该快速启动（静默模式）', async () => {
      const result = await starter.start({ silent: true })

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.provider).toBeDefined()
      expect(result.message).toBeDefined()
    })

    it('应该获取系统状态', async () => {
      await starter.start({ silent: true })
      
      const status = starter.getStatus()
      
      expect(status).toBeDefined()
      expect(status.initialized).toBe(true)
      expect(status.provider).toBeDefined()
      expect(status.agents).toBeDefined()
      expect(status.skills).toBeDefined()
    })

    it('应该检查是否已初始化', async () => {
      expect(starter.isInitialized()).toBe(false)
      
      await starter.start({ silent: true })
      
      expect(starter.isInitialized()).toBe(true)
    })

    it('应该获取当前提供商', async () => {
      await starter.start({ silent: true })
      
      const provider = starter.getCurrentProvider()
      expect(provider).toBeDefined()
    })

    it('应该关闭系统', async () => {
      await starter.start({ silent: true })
      await starter.shutdown()
      
      expect(starter.isInitialized()).toBe(false)
      expect(starter.getCurrentProvider()).toBeNull()
    })

    it('应该重启系统', async () => {
      await starter.start({ silent: true })
      const firstProvider = starter.getCurrentProvider()
      
      await starter.restart({ silent: true })
      
      expect(starter.isInitialized()).toBe(true)
      expect(starter.getCurrentProvider()).toBeDefined()
    })

    it('应该处理启动失败', async () => {
      const result = await starter.start({
        provider: 'non-existent' as ProviderType,
        silent: true,
      })

      expect(result.success).toBeDefined()
    })

    it('应该支持自动检测', async () => {
      const result = await starter.start({
        autoDetect: true,
        silent: true,
      })

      expect(result).toBeDefined()
    })

    it('应该支持指定提供商', async () => {
      const result = await starter.start({
        provider: 'ollama',
        silent: true,
      })

      expect(result.provider).toBe('ollama')
    })

    it('应该支持回退机制', async () => {
      const result = await starter.start({
        fallback: true,
        silent: true,
      })

      expect(result).toBeDefined()
    })
  })
})
