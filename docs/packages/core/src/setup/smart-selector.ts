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
import type { ProviderType, ProviderStatus } from './auto-detector.js'

/**
 * 选择因素
 */
export interface SelectionFactors {
  taskType: string
  complexity: number
  speedPriority: number
  costPriority: number
  qualityPriority: number
  privacyRequired: boolean
  maxTokens?: number
}

/**
 * 提供商评分
 */
export interface ProviderScore {
  type: ProviderType
  score: number
  breakdown: {
    performance: number
    cost: number
    quality: number
    availability: number
    privacy: number
  }
  recommendation: string
}

/**
 * 选择结果
 */
export interface SelectionResult {
  selected: ProviderType
  scores: ProviderScore[]
  reasoning: string
  fallback?: ProviderType
}

/**
 * 提供商性能数据
 */
export interface ProviderPerformance {
  type: ProviderType
  avgLatency: number
  successRate: number
  avgTokensPerSecond: number
  costPerToken: number
  maxContextLength: number
  qualityScore: number
}

/**
 * 智能提供商选择器
 * 基于任务需求和性能智能选择AI提供商
 */
export class SmartSelector {
  private performanceData: Map<ProviderType, ProviderPerformance> = new Map()
  private selectionHistory: SelectionResult[] = []

  constructor() {
    this.initializePerformanceData()
  }

  /**
   * 初始化性能数据
   */
  private initializePerformanceData(): void {
    this.performanceData.set('openai', {
      type: 'openai',
      avgLatency: 1500,
      successRate: 0.99,
      avgTokensPerSecond: 50,
      costPerToken: 0.00003,
      maxContextLength: 128000,
      qualityScore: 0.95,
    })

    this.performanceData.set('ollama', {
      type: 'ollama',
      avgLatency: 3000,
      successRate: 0.95,
      avgTokensPerSecond: 30,
      costPerToken: 0,
      maxContextLength: 32000,
      qualityScore: 0.85,
    })

    this.performanceData.set('anthropic', {
      type: 'anthropic',
      avgLatency: 2000,
      successRate: 0.99,
      avgTokensPerSecond: 45,
      costPerToken: 0.000025,
      maxContextLength: 200000,
      qualityScore: 0.96,
    })

    this.performanceData.set('azure', {
      type: 'azure',
      avgLatency: 1800,
      successRate: 0.99,
      avgTokensPerSecond: 48,
      costPerToken: 0.00003,
      maxContextLength: 128000,
      qualityScore: 0.95,
    })
  }

  /**
   * 选择最佳提供商
   */
  select(
    providers: ProviderStatus[],
    factors: SelectionFactors
  ): SelectionResult {
    const availableProviders = providers.filter(p => p.available && p.healthy)

    if (availableProviders.length === 0) {
      return {
        selected: 'ollama',
        scores: [],
        reasoning: '没有可用的提供商，使用默认的 Ollama',
        fallback: undefined,
      }
    }

    const scores = this.scoreProviders(availableProviders, factors)
    const sorted = scores.sort((a, b) => b.score - a.score)
    const selected = sorted[0]

    const reasoning = this.generateReasoning(selected, factors)
    const fallback = sorted.length > 1 ? sorted[1].type : undefined

    const result: SelectionResult = {
      selected: selected.type,
      scores: sorted,
      reasoning,
      fallback,
    }

    this.selectionHistory.push(result)
    
    if (this.selectionHistory.length > 100) {
      this.selectionHistory = this.selectionHistory.slice(-100)
    }

    return result
  }

  /**
   * 评分所有提供商
   */
  private scoreProviders(
    providers: ProviderStatus[],
    factors: SelectionFactors
  ): ProviderScore[] {
    return providers.map(provider => this.scoreProvider(provider, factors))
  }

  /**
   * 评分单个提供商
   */
  private scoreProvider(
    provider: ProviderStatus,
    factors: SelectionFactors
  ): ProviderScore {
    const performance = this.performanceData.get(provider.type)
    
    if (!performance) {
      return {
        type: provider.type,
        score: 0,
        breakdown: {
          performance: 0,
          cost: 0,
          quality: 0,
          availability: 0,
          privacy: 0,
        },
        recommendation: '未知提供商',
      }
    }

    const breakdown = {
      performance: this.scorePerformance(performance, factors),
      cost: this.scoreCost(performance, factors),
      quality: this.scoreQuality(performance, factors),
      availability: this.scoreAvailability(provider, performance),
      privacy: this.scorePrivacy(provider.type, factors),
    }

    const weights = this.getWeights(factors)
    const score = 
      breakdown.performance * weights.performance +
      breakdown.cost * weights.cost +
      breakdown.quality * weights.quality +
      breakdown.availability * weights.availability +
      breakdown.privacy * weights.privacy

    const recommendation = this.generateRecommendation(provider.type, breakdown, factors)

    return {
      type: provider.type,
      score,
      breakdown,
      recommendation,
    }
  }

  /**
   * 评分性能
   */
  private scorePerformance(
    performance: ProviderPerformance,
    _factors: SelectionFactors
  ): number {
    const latencyScore = Math.max(0, 1 - performance.avgLatency / 5000)
    const speedScore = Math.min(performance.avgTokensPerSecond / 100, 1)
    const successScore = performance.successRate

    return latencyScore * 0.4 + speedScore * 0.3 + successScore * 0.3
  }

  /**
   * 评分成本
   */
  private scoreCost(
    performance: ProviderPerformance,
    _factors: SelectionFactors
  ): number {
    if (performance.costPerToken === 0) {
      return 1.0
    }

    const maxCost = 0.0001
    return Math.max(0, 1 - performance.costPerToken / maxCost)
  }

  /**
   * 评分质量
   */
  private scoreQuality(
    performance: ProviderPerformance,
    _factors: SelectionFactors
  ): number {
    return performance.qualityScore
  }

  /**
   * 评分可用性
   */
  private scoreAvailability(
    provider: ProviderStatus,
    performance: ProviderPerformance
  ): number {
    if (!provider.available || !provider.healthy) {
      return 0
    }

    return performance.successRate
  }

  /**
   * 评分隐私
   */
  private scorePrivacy(
    providerType: ProviderType,
    factors: SelectionFactors
  ): number {
    if (!factors.privacyRequired) {
      return 1.0
    }

    const privacyScores: Record<ProviderType, number> = {
      ollama: 1.0,
      openai: 0.6,
      anthropic: 0.6,
      azure: 0.7,
      custom: 0.8,
    }

    return privacyScores[providerType] || 0.5
  }

  /**
   * 获取权重
   */
  private getWeights(factors: SelectionFactors): Record<string, number> {
    const total = factors.speedPriority + factors.costPriority + factors.qualityPriority

    return {
      performance: factors.speedPriority / total * 0.4,
      cost: factors.costPriority / total * 0.3,
      quality: factors.qualityPriority / total * 0.3,
      availability: 0.15,
      privacy: factors.privacyRequired ? 0.15 : 0,
    }
  }

  /**
   * 生成推荐理由
   */
  private generateRecommendation(
    providerType: ProviderType,
    breakdown: ProviderScore['breakdown'],
    factors: SelectionFactors
  ): string {
    const reasons: string[] = []

    if (breakdown.performance > 0.8) {
      reasons.push('性能优异')
    }

    if (breakdown.cost > 0.9) {
      reasons.push('成本效益高')
    }

    if (breakdown.quality > 0.9) {
      reasons.push('质量出色')
    }

    if (breakdown.privacy === 1.0 && factors.privacyRequired) {
      reasons.push('满足隐私要求')
    }

    if (reasons.length === 0) {
      reasons.push('综合表现良好')
    }

    return `${providerType.toUpperCase()}: ${reasons.join(', ')}`
  }

  /**
   * 生成选择理由
   */
  private generateReasoning(
    selected: ProviderScore,
    factors: SelectionFactors
  ): string {
    const parts: string[] = []

    parts.push(`选择 ${selected.type.toUpperCase()} 作为最佳提供商`)

    if (selected.breakdown.performance > 0.8) {
      parts.push('性能表现优异')
    }

    if (selected.breakdown.cost > 0.9) {
      parts.push('成本效益最高')
    }

    if (selected.breakdown.quality > 0.9) {
      parts.push('输出质量最佳')
    }

    if (factors.privacyRequired && selected.breakdown.privacy === 1.0) {
      parts.push('满足隐私要求')
    }

    return parts.join('，')
  }

  /**
   * 更新性能数据
   */
  updatePerformance(
    providerType: ProviderType,
    data: Partial<ProviderPerformance>
  ): void {
    const current = this.performanceData.get(providerType)
    if (current) {
      this.performanceData.set(providerType, { ...current, ...data })
    }
  }

  /**
   * 获取选择历史
   */
  getHistory(limit: number = 10): SelectionResult[] {
    return this.selectionHistory.slice(-limit)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSelections: number
    providerDistribution: Map<ProviderType, number>
    avgScore: number
  } {
    const distribution = new Map<ProviderType, number>()
    let totalScore = 0

    for (const result of this.selectionHistory) {
      distribution.set(result.selected, (distribution.get(result.selected) || 0) + 1)
      totalScore += result.scores[0]?.score || 0
    }

    return {
      totalSelections: this.selectionHistory.length,
      providerDistribution: distribution,
      avgScore: this.selectionHistory.length > 0
        ? totalScore / this.selectionHistory.length
        : 0,
    }
  }
}
