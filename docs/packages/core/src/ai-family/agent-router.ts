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
import type { BaseAgent } from './base-agent.js'
import type {
  AgentRole,
  AgentTask,
  TaskContext,
} from './types.js'

/**
 * 路由策略
 */
export type RoutingStrategy = 
  | 'capability-based'
  | 'load-balanced'
  | 'performance-based'
  | 'cost-optimized'
  | 'hybrid'

/**
 * 路由决策
 */
export interface RoutingDecision {
  taskId: string
  selectedAgent: AgentRole
  score: number
  reasons: string[]
  alternatives: {
    agent: AgentRole
    score: number
  }[]
  timestamp: Date
}

/**
 * Agent负载信息
 */
export interface AgentLoad {
  role: AgentRole
  currentTasks: number
  avgExecutionTime: number
  successRate: number
  lastActive: Date
}

/**
 * 路由规则
 */
export interface RoutingRule {
  id: string
  name: string
  condition: (task: AgentTask, context: TaskContext) => boolean
  targetAgent: AgentRole
  priority: number
}

/**
 * 路由配置
 */
export interface RouterConfig {
  strategy: RoutingStrategy
  enableCaching: boolean
  enableLearning: boolean
  maxAlternatives: number
}

/**
 * Agent智能路由器
 * 实现任务到Agent的智能路由和分配
 */
export class AgentRouter {
  private agents: Map<AgentRole, BaseAgent> = new Map()
  private loads: Map<AgentRole, AgentLoad> = new Map()
  private rules: RoutingRule[] = []
  private config: RouterConfig
  private routingHistory: RoutingDecision[] = []

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = {
      strategy: config.strategy ?? 'hybrid',
      enableCaching: config.enableCaching ?? true,
      enableLearning: config.enableLearning ?? true,
      maxAlternatives: config.maxAlternatives ?? 3,
    }

    this.initializeDefaultRules()
  }

  /**
   * 初始化默认路由规则
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'code-generation',
        name: '代码生成任务',
        condition: (task) => task.type === 'code-generation',
        targetAgent: 'coder',
        priority: 100,
      },
      {
        id: 'multimodal-processing',
        name: '多模态处理任务',
        condition: (task) => ['image-analysis', 'audio-processing', 'document-processing'].includes(task.type),
        targetAgent: 'multimodal',
        priority: 100,
      },
      {
        id: 'prediction-analysis',
        name: '预测分析任务',
        condition: (task) => task.type === 'prediction' || task.type === 'analysis',
        targetAgent: 'predictor',
        priority: 90,
      },
      {
        id: 'matching-recommendation',
        name: '匹配推荐任务',
        condition: (task) => task.type === 'matching' || task.type === 'recommendation',
        targetAgent: 'matcher',
        priority: 90,
      },
      {
        id: 'security-check',
        name: '安全检查任务',
        condition: (task) => task.type === 'security' || task.type === 'audit',
        targetAgent: 'security',
        priority: 95,
      },
      {
        id: 'quality-assurance',
        name: '质量保证任务',
        condition: (task) => task.type === 'quality' || task.type === 'testing',
        targetAgent: 'quality',
        priority: 95,
      },
      {
        id: 'creative-generation',
        name: '创意生成任务',
        condition: (task) => task.type === 'creative' || task.type === 'design',
        targetAgent: 'creative',
        priority: 85,
      },
    ]
  }

  /**
   * 注册Agent
   */
  registerAgent(role: AgentRole, agent: BaseAgent): void {
    this.agents.set(role, agent)
    this.loads.set(role, {
      role,
      currentTasks: 0,
      avgExecutionTime: 0,
      successRate: 1.0,
      lastActive: new Date(),
    })
  }

  /**
   * 添加路由规则
   */
  addRule(rule: RoutingRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 路由任务
   */
  async route(task: AgentTask, context: TaskContext): Promise<RoutingDecision> {
    const candidates = await this.evaluateAgents(task, context)
    
    const selected = this.selectBestAgent(candidates, task)
    
    const decision: RoutingDecision = {
      taskId: task.id,
      selectedAgent: selected.agent,
      score: selected.score,
      reasons: selected.reasons,
      alternatives: candidates
        .filter(c => c.agent !== selected.agent)
        .slice(0, this.config.maxAlternatives)
        .map(c => ({ agent: c.agent, score: c.score })),
      timestamp: new Date(),
    }

    this.routingHistory.push(decision)
    
    if (this.config.enableLearning) {
      this.updateLearning(decision)
    }

    return decision
  }

  /**
   * 评估所有Agent
   */
  private async evaluateAgents(
    task: AgentTask,
    context: TaskContext
  ): Promise<{ agent: AgentRole; score: number; reasons: string[] }[]> {
    const evaluations: { agent: AgentRole; score: number; reasons: string[] }[] = []

    for (const [role, agent] of this.agents) {
      const evaluation = await this.evaluateAgent(role, agent, task, context)
      evaluations.push(evaluation)
    }

    return evaluations.sort((a, b) => b.score - a.score)
  }

  /**
   * 评估单个Agent
   */
  private async evaluateAgent(
    role: AgentRole,
    agent: BaseAgent,
    task: AgentTask,
    context: TaskContext
  ): Promise<{ agent: AgentRole; score: number; reasons: string[] }> {
    const scores: { name: string; score: number }[] = []
    const reasons: string[] = []

    const capabilityScore = await this.scoreByCapability(agent, task, context)
    scores.push({ name: 'capability', score: capabilityScore })
    if (capabilityScore > 0.8) {
      reasons.push('能力匹配度高')
    }

    const loadScore = this.scoreByLoad(role)
    scores.push({ name: 'load', score: loadScore })
    if (loadScore > 0.8) {
      reasons.push('负载较低')
    }

    const performanceScore = this.scoreByPerformance(role)
    scores.push({ name: 'performance', score: performanceScore })
    if (performanceScore > 0.8) {
      reasons.push('性能优异')
    }

    const ruleScore = this.scoreByRules(task, role)
    scores.push({ name: 'rule', score: ruleScore })
    if (ruleScore === 1.0) {
      reasons.push('符合路由规则')
    }

    const totalScore = this.calculateWeightedScore(scores)

    return {
      agent: role,
      score: totalScore,
      reasons,
    }
  }

  /**
   * 基于能力评分
   */
  private async scoreByCapability(
    agent: BaseAgent,
    task: AgentTask,
    context: TaskContext
  ): Promise<number> {
    try {
      const estimate = await agent.estimateCapability(task, context)
      return estimate.score
    } catch {
      return 0.5
    }
  }

  /**
   * 基于负载评分
   */
  private scoreByLoad(role: AgentRole): number {
    const load = this.loads.get(role)
    if (!load) return 0.5

    const loadFactor = load.currentTasks / 10
    return Math.max(0, 1 - loadFactor)
  }

  /**
   * 基于性能评分
   */
  private scoreByPerformance(role: AgentRole): number {
    const load = this.loads.get(role)
    if (!load) return 0.5

    return load.successRate * 0.7 + (1 - load.avgExecutionTime / 10000) * 0.3
  }

  /**
   * 基于规则评分
   */
  private scoreByRules(task: AgentTask, role: AgentRole): number {
    for (const rule of this.rules) {
      if (rule.targetAgent === role && rule.condition(task, {} as TaskContext)) {
        return 1.0
      }
    }
    return 0.5
  }

  /**
   * 计算加权总分
   */
  private calculateWeightedScore(scores: { name: string; score: number }[]): number {
    const weights: Record<string, number> = {
      capability: 0.35,
      load: 0.25,
      performance: 0.25,
      rule: 0.15,
    }

    let totalScore = 0
    let totalWeight = 0

    for (const { name, score } of scores) {
      const weight = weights[name] || 0.1
      totalScore += score * weight
      totalWeight += weight
    }

    return totalScore / totalWeight
  }

  /**
   * 选择最佳Agent
   */
  private selectBestAgent(
    candidates: { agent: AgentRole; score: number; reasons: string[] }[],
    _task: AgentTask
  ): { agent: AgentRole; score: number; reasons: string[] } {
    if (candidates.length === 0) {
      return {
        agent: 'commander',
        score: 0,
        reasons: ['没有可用的Agent'],
      }
    }

    switch (this.config.strategy) {
      case 'capability-based':
        return candidates[0]

      case 'load-balanced':
        return this.selectByLoad(candidates)

      case 'performance-based':
        return this.selectByPerformance(candidates)

      case 'cost-optimized':
        return this.selectByCost(candidates)

      case 'hybrid':
      default:
        return candidates[0]
    }
  }

  /**
   * 基于负载选择
   */
  private selectByLoad(
    candidates: { agent: AgentRole; score: number; reasons: string[] }[]
  ): { agent: AgentRole; score: number; reasons: string[] } {
    let minLoad = Infinity
    let selected = candidates[0]

    for (const candidate of candidates) {
      const load = this.loads.get(candidate.agent)
      if (load && load.currentTasks < minLoad) {
        minLoad = load.currentTasks
        selected = candidate
      }
    }

    return selected
  }

  /**
   * 基于性能选择
   */
  private selectByPerformance(
    candidates: { agent: AgentRole; score: number; reasons: string[] }[]
  ): { agent: AgentRole; score: number; reasons: string[] } {
    let maxPerformance = 0
    let selected = candidates[0]

    for (const candidate of candidates) {
      const load = this.loads.get(candidate.agent)
      if (load && load.successRate > maxPerformance) {
        maxPerformance = load.successRate
        selected = candidate
      }
    }

    return selected
  }

  /**
   * 基于成本选择
   */
  private selectByCost(
    candidates: { agent: AgentRole; score: number; reasons: string[] }[]
  ): { agent: AgentRole; score: number; reasons: string[] } {
    return candidates.reduce((best, current) => 
      current.score > best.score ? current : best
    )
  }

  /**
   * 更新学习
   */
  private updateLearning(_decision: RoutingDecision): void {
    if (this.routingHistory.length > 100) {
      this.routingHistory = this.routingHistory.slice(-100)
    }
  }

  /**
   * 更新Agent负载
   */
  updateLoad(role: AgentRole, delta: number): void {
    const load = this.loads.get(role)
    if (load) {
      load.currentTasks = Math.max(0, load.currentTasks + delta)
      load.lastActive = new Date()
    }
  }

  /**
   * 更新Agent性能
   */
  updatePerformance(role: AgentRole, success: boolean, duration: number): void {
    const load = this.loads.get(role)
    if (load) {
      const alpha = 0.3
      load.successRate = load.successRate * (1 - alpha) + (success ? 1 : 0) * alpha
      load.avgExecutionTime = load.avgExecutionTime * (1 - alpha) + duration * alpha
    }
  }

  /**
   * 获取路由统计
   */
  getStats(): {
    totalRouted: number
    avgScore: number
    agentDistribution: Map<AgentRole, number>
    topRoutes: { agent: AgentRole; count: number }[]
  } {
    const agentDistribution = new Map<AgentRole, number>()
    
    for (const decision of this.routingHistory) {
      agentDistribution.set(
        decision.selectedAgent,
        (agentDistribution.get(decision.selectedAgent) || 0) + 1
      )
    }

    const topRoutes = Array.from(agentDistribution.entries())
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRouted: this.routingHistory.length,
      avgScore: this.routingHistory.length > 0
        ? this.routingHistory.reduce((sum, d) => sum + d.score, 0) / this.routingHistory.length
        : 0,
      agentDistribution,
      topRoutes,
    }
  }

  /**
   * 获取路由历史
   */
  getHistory(limit: number = 10): RoutingDecision[] {
    return this.routingHistory.slice(-limit)
  }
}
