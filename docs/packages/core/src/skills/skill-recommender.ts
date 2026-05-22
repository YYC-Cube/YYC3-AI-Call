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
import type { SkillRegistryItem } from './types.js'

/**
 * 技能推荐结果
 */
export interface SkillRecommendation {
  skillId: string
  skillName: string
  score: number
  confidence: number
  reasons: string[]
  context: {
    taskType: string
    historyMatch: number
    performanceScore: number
    capabilityMatch: number
  }
}

/**
 * 推荐上下文
 */
export interface RecommendationContext {
  taskType: string
  input: unknown
  keywords: string[]
  history?: SkillExecutionHistory[]
  preferences?: UserPreferences
}

/**
 * 技能执行历史
 */
export interface SkillExecutionHistory {
  skillId: string
  taskType: string
  success: boolean
  duration: number
  timestamp: Date
  userRating?: number
}

/**
 * 用户偏好
 */
export interface UserPreferences {
  preferredSkills: string[]
  avoidedSkills: string[]
  performanceThreshold: number
}

/**
 * 技能推荐引擎
 * 基于多维度推荐最优技能
 */
export class SkillRecommender {
  private history: SkillExecutionHistory[] = []
  private preferences: UserPreferences = {
    preferredSkills: [],
    avoidedSkills: [],
    performanceThreshold: 0.7,
  }

  /**
   * 推荐技能
   */
  recommend(
    skills: SkillRegistryItem[],
    context: RecommendationContext
  ): SkillRecommendation[] {
    const recommendations: SkillRecommendation[] = []

    for (const skill of skills) {
      const recommendation = this.evaluateSkill(skill, context)
      if (recommendation.score > 0) {
        recommendations.push(recommendation)
      }
    }

    return recommendations.sort((a, b) => b.score - a.score)
  }

  /**
   * 评估单个技能
   */
  private evaluateSkill(
    skill: SkillRegistryItem,
    context: RecommendationContext
  ): SkillRecommendation {
    const scores = {
      taskType: this.scoreByTaskType(skill, context),
      keywords: this.scoreByKeywords(skill, context),
      history: this.scoreByHistory(skill, context),
      performance: this.scoreByPerformance(skill),
      preference: this.scoreByPreference(skill),
    }

    const totalScore = this.calculateWeightedScore(scores)
    const confidence = this.calculateConfidence(scores)

    return {
      skillId: skill.id,
      skillName: skill.name,
      score: totalScore,
      confidence,
      reasons: this.generateReasons(scores, skill),
      context: {
        taskType: context.taskType,
        historyMatch: scores.history,
        performanceScore: scores.performance,
        capabilityMatch: scores.keywords,
      },
    }
  }

  /**
   * 基于任务类型评分
   */
  private scoreByTaskType(
    skill: SkillRegistryItem,
    context: RecommendationContext
  ): number {
    const taskTypeMap: Record<string, string[]> = {
      'code-analysis': ['analysis', 'reasoning'],
      'code-generation': ['creation', 'generation'],
      'code-review': ['analysis', 'quality'],
      'documentation': ['creation', 'documentation'],
      'testing': ['testing', 'quality'],
      'refactoring': ['optimization', 'transformation'],
      'debugging': ['reasoning', 'analysis'],
      'design': ['creation', 'planning'],
    }

    const relevantCategories = taskTypeMap[context.taskType] || []
    const match = relevantCategories.includes(skill.category)

    return match ? 1.0 : 0.3
  }

  /**
   * 基于关键词评分
   */
  private scoreByKeywords(
    skill: SkillRegistryItem,
    context: RecommendationContext
  ): number {
    const skillKeywords = [
      skill.name.toLowerCase(),
      skill.description.toLowerCase(),
      skill.category.toLowerCase(),
    ].join(' ')

    let matchCount = 0
    for (const keyword of context.keywords) {
      if (skillKeywords.includes(keyword.toLowerCase())) {
        matchCount++
      }
    }

    return Math.min(matchCount / Math.max(context.keywords.length, 1), 1.0)
  }

  /**
   * 基于历史评分
   */
  private scoreByHistory(
    skill: SkillRegistryItem,
    _context: RecommendationContext
  ): number {
    const skillHistory = this.history.filter(h => h.skillId === skill.id)
    
    if (skillHistory.length === 0) {
      return 0.5
    }

    const successRate = skillHistory.filter(h => h.success).length / skillHistory.length
    const avgRating = skillHistory
      .filter(h => h.userRating !== undefined)
      .reduce((sum, h) => sum + (h.userRating || 0), 0) / skillHistory.length || 0.5

    return (successRate * 0.6 + avgRating * 0.4)
  }

  /**
   * 基于性能评分
   */
  private scoreByPerformance(skill: SkillRegistryItem): number {
    if (skill.executionCount === 0) {
      return 0.5
    }

    const successRate = skill.successCount / skill.executionCount
    const avgDuration = skill.totalDuration / skill.executionCount
    
    const durationScore = Math.max(0, 1 - avgDuration / 10000)
    
    return successRate * 0.7 + durationScore * 0.3
  }

  /**
   * 基于用户偏好评分
   */
  private scoreByPreference(skill: SkillRegistryItem): number {
    if (this.preferences.preferredSkills.includes(skill.id)) {
      return 1.0
    }
    
    if (this.preferences.avoidedSkills.includes(skill.id)) {
      return 0.0
    }
    
    return 0.5
  }

  /**
   * 计算加权总分
   */
  private calculateWeightedScore(scores: Record<string, number>): number {
    const weights = {
      taskType: 0.25,
      keywords: 0.20,
      history: 0.25,
      performance: 0.20,
      preference: 0.10,
    }

    let totalScore = 0
    for (const [key, weight] of Object.entries(weights)) {
      totalScore += scores[key] * weight
    }

    return totalScore
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(scores: Record<string, number>): number {
    const values = Object.values(scores)
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
    
    return Math.max(0, 1 - Math.sqrt(variance))
  }

  /**
   * 生成推荐理由
   */
  private generateReasons(
    scores: Record<string, number>,
    _skill: SkillRegistryItem
  ): string[] {
    const reasons: string[] = []

    if (scores.taskType > 0.8) {
      reasons.push(`任务类型匹配度高 (${(scores.taskType * 100).toFixed(0)}%)`)
    }

    if (scores.keywords > 0.7) {
      reasons.push(`关键词匹配度好 (${(scores.keywords * 100).toFixed(0)}%)`)
    }

    if (scores.history > 0.7) {
      reasons.push(`历史表现优秀 (${(scores.history * 100).toFixed(0)}%)`)
    }

    if (scores.performance > 0.8) {
      reasons.push(`性能表现优异 (${(scores.performance * 100).toFixed(0)}%)`)
    }

    if (scores.preference === 1.0) {
      reasons.push('用户偏好技能')
    }

    return reasons
  }

  /**
   * 更新执行历史
   */
  updateHistory(history: SkillExecutionHistory): void {
    this.history.push(history)
    
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000)
    }
  }

  /**
   * 更新用户偏好
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences }
  }

  /**
   * 获取推荐统计
   */
  getStats(): {
    totalRecommendations: number
    avgScore: number
    topSkills: string[]
  } {
    return {
      totalRecommendations: this.history.length,
      avgScore: this.history.length > 0
        ? this.history.reduce((sum, h) => sum + (h.success ? 1 : 0), 0) / this.history.length
        : 0,
      topSkills: this.preferences.preferredSkills,
    }
  }
}
