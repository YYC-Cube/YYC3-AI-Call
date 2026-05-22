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
import type { SkillExecutionResult } from './types.js'

/**
 * 学习数据
 */
export interface LearningData {
  skillId: string
  executionResult: SkillExecutionResult
  userFeedback?: UserFeedback
  context: ExecutionContext
  timestamp: Date
}

/**
 * 用户反馈
 */
export interface UserFeedback {
  rating: number
  comment?: string
  tags?: string[]
  issues?: string[]
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  taskType: string
  inputSize: number
  complexity: number
  resourceUsage: {
    memory: number
    cpu: number
    time: number
  }
}

/**
 * 技能优化建议
 */
export interface SkillOptimization {
  skillId: string
  improvements: string[]
  warnings: string[]
  performance: {
    currentScore: number
    predictedScore: number
    confidence: number
  }
  recommendations: {
    parameter: string
    currentValue: unknown
    suggestedValue: unknown
    reason: string
  }[]
}

/**
 * 学习模型
 */
export interface LearningModel {
  skillId: string
  patterns: ExecutionPattern[]
  optimizations: Map<string, unknown>
  performance: PerformanceMetrics
  lastUpdated: Date
}

/**
 * 执行模式
 */
export interface ExecutionPattern {
  condition: string
  action: string
  success: boolean
  frequency: number
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  successRate: number
  avgDuration: number
  avgRating: number
  errorRate: number
  improvementTrend: number
}

/**
 * 技能学习系统
 * 基于执行反馈学习和优化技能
 */
export class SkillLearner {
  private learningData: Map<string, LearningData[]> = new Map()
  private models: Map<string, LearningModel> = new Map()
  private optimizations: Map<string, SkillOptimization> = new Map()

  /**
   * 学习执行结果
   */
  learn(data: LearningData): SkillOptimization {
    const { skillId } = data
    
    if (!this.learningData.has(skillId)) {
      this.learningData.set(skillId, [])
    }
    
    this.learningData.get(skillId)!.push(data)
    
    const model = this.updateModel(skillId)
    const optimization = this.generateOptimization(skillId, model)
    
    this.optimizations.set(skillId, optimization)
    
    return optimization
  }

  /**
   * 更新学习模型
   */
  private updateModel(skillId: string): LearningModel {
    const data = this.learningData.get(skillId) || []
    
    const patterns = this.extractPatterns(data)
    const performance = this.calculatePerformance(data)
    
    const model: LearningModel = {
      skillId,
      patterns,
      optimizations: new Map(),
      performance,
      lastUpdated: new Date(),
    }
    
    this.models.set(skillId, model)
    
    return model
  }

  /**
   * 提取执行模式
   */
  private extractPatterns(data: LearningData[]): ExecutionPattern[] {
    const patterns: ExecutionPattern[] = []
    const patternMap = new Map<string, ExecutionPattern>()

    for (const item of data) {
      const condition = this.extractCondition(item)
      const action = this.extractAction(item)
      const key = `${condition}:${action}`

      if (patternMap.has(key)) {
        patternMap.get(key)!.frequency++
      } else {
        patternMap.set(key, {
          condition,
          action,
          success: item.executionResult.success,
          frequency: 1,
        })
      }
    }

    for (const pattern of patternMap.values()) {
      if (pattern.frequency >= 3) {
        patterns.push(pattern)
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * 提取条件
   */
  private extractCondition(data: LearningData): string {
    const parts: string[] = []
    
    parts.push(`task:${data.context.taskType}`)
    parts.push(`complexity:${data.context.complexity > 0.5 ? 'high' : 'low'}`)
    
    if (data.context.resourceUsage.time > 5000) {
      parts.push('slow')
    }
    
    return parts.join(',')
  }

  /**
   * 提取动作
   */
  private extractAction(data: LearningData): string {
    if (data.executionResult.success) {
      return 'success'
    }
    return `error:${data.executionResult.error || 'unknown'}`
  }

  /**
   * 计算性能指标
   */
  private calculatePerformance(data: LearningData[]): PerformanceMetrics {
    if (data.length === 0) {
      return {
        successRate: 0,
        avgDuration: 0,
        avgRating: 0,
        errorRate: 0,
        improvementTrend: 0,
      }
    }

    const successCount = data.filter(d => d.executionResult.success).length
    const successRate = successCount / data.length
    
    const avgDuration = data.reduce((sum, d) => sum + (d.executionResult.duration ?? 0), 0) / data.length
    
    const ratings = data.filter(d => d.userFeedback?.rating).map(d => d.userFeedback!.rating)
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0
    
    const errorRate = 1 - successRate
    
    const recentData = data.slice(-10)
    const olderData = data.slice(-20, -10)
    
    let improvementTrend = 0
    if (olderData.length > 0) {
      const recentSuccess = recentData.filter(d => d.executionResult.success).length / recentData.length
      const olderSuccess = olderData.filter(d => d.executionResult.success).length / olderData.length
      improvementTrend = recentSuccess - olderSuccess
    }

    return {
      successRate,
      avgDuration,
      avgRating,
      errorRate,
      improvementTrend,
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimization(skillId: string, model: LearningModel): SkillOptimization {
    const improvements: string[] = []
    const warnings: string[] = []
    const recommendations: SkillOptimization['recommendations'] = []

    if (model.performance.successRate < 0.7) {
      warnings.push(`成功率较低 (${(model.performance.successRate * 100).toFixed(0)}%)`)
      improvements.push('建议增加输入验证和错误处理')
    }

    if (model.performance.avgDuration > 5000) {
      warnings.push(`执行时间较长 (${model.performance.avgDuration.toFixed(0)}ms)`)
      improvements.push('建议优化性能或添加缓存机制')
    }

    if (model.performance.avgRating < 3 && model.performance.avgRating > 0) {
      warnings.push(`用户评分较低 (${model.performance.avgRating.toFixed(1)}/5)`)
      improvements.push('建议改进输出质量或增加用户反馈机制')
    }

    if (model.performance.improvementTrend > 0.1) {
      improvements.push(`性能呈上升趋势 (+${(model.performance.improvementTrend * 100).toFixed(0)}%)`)
    } else if (model.performance.improvementTrend < -0.1) {
      warnings.push(`性能呈下降趋势 (${(model.performance.improvementTrend * 100).toFixed(0)}%)`)
    }

    const successfulPatterns = model.patterns.filter(p => p.success && p.frequency >= 5)
    for (const pattern of successfulPatterns) {
      recommendations.push({
        parameter: 'executionPattern',
        currentValue: 'default',
        suggestedValue: pattern.action,
        reason: `高频成功模式 (${pattern.frequency}次)`,
      })
    }

    const currentScore = model.performance.successRate * 0.5 +
                        (1 - model.performance.avgDuration / 10000) * 0.3 +
                        model.performance.avgRating / 5 * 0.2

    return {
      skillId,
      improvements,
      warnings,
      performance: {
        currentScore,
        predictedScore: Math.min(currentScore + model.performance.improvementTrend * 0.1, 1.0),
        confidence: Math.min(model.patterns.length / 10, 1.0),
      },
      recommendations,
    }
  }

  /**
   * 获取优化建议
   */
  getOptimization(skillId: string): SkillOptimization | undefined {
    return this.optimizations.get(skillId)
  }

  /**
   * 获取学习模型
   */
  getModel(skillId: string): LearningModel | undefined {
    return this.models.get(skillId)
  }

  /**
   * 获取所有学习统计
   */
  getStats(): {
    totalSkills: number
    totalExecutions: number
    avgSuccessRate: number
    topPerformers: string[]
    needsImprovement: string[]
  } {
    let totalExecutions = 0
    let totalSuccess = 0
    const performers: { skillId: string; score: number }[] = []

    for (const [skillId, model] of this.models) {
      const data = this.learningData.get(skillId) || []
      totalExecutions += data.length
      totalSuccess += data.filter(d => d.executionResult.success).length

      performers.push({
        skillId,
        score: model.performance.successRate,
      })
    }

    performers.sort((a, b) => b.score - a.score)

    return {
      totalSkills: this.models.size,
      totalExecutions,
      avgSuccessRate: totalExecutions > 0 ? totalSuccess / totalExecutions : 0,
      topPerformers: performers.slice(0, 5).map(p => p.skillId),
      needsImprovement: performers.filter(p => p.score < 0.7).map(p => p.skillId),
    }
  }

  /**
   * 清理旧数据
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge)

    for (const [skillId, data] of this.learningData) {
      const filtered = data.filter(d => d.timestamp > cutoff)
      this.learningData.set(skillId, filtered)
    }
  }
}
