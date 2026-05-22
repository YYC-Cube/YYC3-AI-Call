/**
 * file agents.ts
 * description Agent 管理实现
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
 * brief Agent 管理实现
 */
import { BaseAgent, type BaseAgentConfig } from './base-agent.js'
import type { AgentTask, TaskResult } from './types.js'
import {
  MetaOracleDefinition,
  SentinelDefinition,
  MasterDefinition,
  CreativeDefinition,
  NavigatorDefinition,
  ThinkerDefinition,
  ProphetDefinition,
  BoleroDefinition,
} from './definitions.js'

export { BaseAgent, type BaseAgentConfig } from './base-agent.js'

/**
 * 元启·天枢 - 总指挥智能体
 */
export class MetaOracleAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: MetaOracleDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        decision: content,
        orchestration: this.parseOrchestration(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private parseOrchestration(content: string): unknown {
    return {
      summary: content.substring(0, 200),
      actions: [],
    }
  }
}

/**
 * 智云·守护 - 安全官智能体
 */
export class SentinelAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: SentinelDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.3,
      maxTokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        analysis: content,
        threats: this.extractThreats(content),
        recommendations: this.extractRecommendations(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private extractThreats(content: string): string[] {
    const threats: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('威胁') || line.includes('风险') || line.includes('漏洞')) {
        threats.push(line.trim())
      }
    }
    return threats.slice(0, 5)
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('建议') || line.includes('推荐') || line.includes('应该')) {
        recommendations.push(line.trim())
      }
    }
    return recommendations.slice(0, 5)
  }
}

/**
 * 格物·宗师 - 质量官智能体
 */
export class MasterAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: MasterDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.5,
      maxTokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        analysis: content,
        qualityScore: this.extractQualityScore(content),
        issues: this.extractIssues(content),
        suggestions: this.extractSuggestions(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private extractQualityScore(content: string): number {
    const match = content.match(/(\d+)\/100|(\d+)%/)
    if (match) {
      return parseInt(match[1] || match[2])
    }
    return 85
  }

  private extractIssues(content: string): string[] {
    const issues: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('问题') || line.includes('缺陷') || line.includes('bug')) {
        issues.push(line.trim())
      }
    }
    return issues.slice(0, 5)
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('建议') || line.includes('优化') || line.includes('改进')) {
        suggestions.push(line.trim())
      }
    }
    return suggestions.slice(0, 5)
  }
}

/**
 * 创想·灵韵 - 创意官智能体
 */
export class CreativeAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: CreativeDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.9,
      maxTokens: 3000,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        creative: content,
        ideas: this.extractIdeas(content),
        alternatives: this.extractAlternatives(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private extractIdeas(content: string): string[] {
    const ideas: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.match(/^\d+\./) || line.includes('创意') || line.includes('想法')) {
        ideas.push(line.trim())
      }
    }
    return ideas.slice(0, 5)
  }

  private extractAlternatives(content: string): string[] {
    const alternatives: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('或者') || line.includes('备选') || line.includes('替代')) {
        alternatives.push(line.trim())
      }
    }
    return alternatives.slice(0, 3)
  }
}

/**
 * 言启·千行 - 导航员智能体
 */
export class NavigatorAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: NavigatorDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.5,
      maxTokens: 1500,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        interpretation: content,
        intent: this.detectIntent(content),
        routing: this.suggestRouting(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private detectIntent(content: string): string {
    if (content.includes('代码') || content.includes('编程')) return 'coding'
    if (content.includes('分析') || content.includes('数据')) return 'analysis'
    if (content.includes('创意') || content.includes('设计')) return 'creative'
    if (content.includes('安全') || content.includes('风险')) return 'security'
    return 'general'
  }

  private suggestRouting(content: string): string[] {
    const routes: string[] = []
    if (content.includes('代码')) routes.push('master')
    if (content.includes('安全')) routes.push('sentinel')
    if (content.includes('创意')) routes.push('creative')
    if (content.includes('预测')) routes.push('prophet')
    if (routes.length === 0) routes.push('thinker')
    return routes
  }
}

/**
 * 语枢·万物 - 思考者智能体
 */
export class ThinkerAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: ThinkerDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.6,
      maxTokens: 2500,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        analysis: content,
        insights: this.extractInsights(content),
        conclusions: this.extractConclusions(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private extractInsights(content: string): string[] {
    const insights: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('洞察') || line.includes('发现') || line.includes('关键')) {
        insights.push(line.trim())
      }
    }
    return insights.slice(0, 5)
  }

  private extractConclusions(content: string): string[] {
    const conclusions: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('结论') || line.includes('因此') || line.includes('所以')) {
        conclusions.push(line.trim())
      }
    }
    return conclusions.slice(0, 3)
  }
}

/**
 * 预见·先知 - 预言家智能体
 */
export class ProphetAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: ProphetDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        prediction: content,
        trends: this.extractTrends(content),
        risks: this.extractRisks(content),
        opportunities: this.extractOpportunities(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private extractTrends(content: string): string[] {
    const trends: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('趋势') || line.includes('走向') || line.includes('发展')) {
        trends.push(line.trim())
      }
    }
    return trends.slice(0, 5)
  }

  private extractRisks(content: string): string[] {
    const risks: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('风险') || line.includes('威胁') || line.includes('挑战')) {
        risks.push(line.trim())
      }
    }
    return risks.slice(0, 3)
  }

  private extractOpportunities(content: string): string[] {
    const opportunities: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('机会') || line.includes('机遇') || line.includes('潜力')) {
        opportunities.push(line.trim())
      }
    }
    return opportunities.slice(0, 3)
  }
}

/**
 * 知遇·伯乐 - 推荐官智能体
 */
export class BoleroAgent extends BaseAgent {
  constructor(config: Omit<BaseAgentConfig, 'definition'>) {
    super({ ...config, definition: BoleroDefinition })
  }

  protected async executeTask(task: AgentTask): Promise<TaskResult> {
    const messages = this.buildMessages(task)
    
    const response = await this.authManager.chat(messages, {
      temperature: 0.6,
      maxTokens: 2000,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      success: true,
      output: {
        recommendation: content,
        matches: this.extractMatches(content),
        reasons: this.extractReasons(content),
      },
      duration: 0,
      tokens: {
        input: response.usage?.promptTokens || 0,
        output: response.usage?.completionTokens || 0,
      },
    }
  }

  private extractMatches(content: string): string[] {
    const matches: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('推荐') || line.includes('匹配') || line.includes('适合')) {
        matches.push(line.trim())
      }
    }
    return matches.slice(0, 5)
  }

  private extractReasons(content: string): string[] {
    const reasons: string[] = []
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('因为') || line.includes('原因') || line.includes('理由')) {
        reasons.push(line.trim())
      }
    }
    return reasons.slice(0, 3)
  }
}

/**
 * 智能体类映射
 */
export const AgentClasses = {
  'meta-oracle': MetaOracleAgent,
  'sentinel': SentinelAgent,
  'master': MasterAgent,
  'creative': CreativeAgent,
  'navigator': NavigatorAgent,
  'thinker': ThinkerAgent,
  'prophet': ProphetAgent,
  'bolero': BoleroAgent,
  'commander': MetaOracleAgent,
  'coder': CreativeAgent,
  'multimodal': ThinkerAgent,
  'predictor': ProphetAgent,
  'matcher': BoleroAgent,
  'security': SentinelAgent,
  'quality': MasterAgent,
  // 扩展智能体 - 复用核心类
  'translator': NavigatorAgent,
  'slides-gen': CreativeAgent,
  'cartoon-gen': CreativeAgent,
  'ai-drawing': CreativeAgent,
  'receipt-recog': ThinkerAgent,
  'clothes-recog': ThinkerAgent,
  'contract-parser': ThinkerAgent,
  'service-check': SentinelAgent,
  'subtitle-trans': NavigatorAgent,
  'edu-correction': MasterAgent,
  'job-matcher': BoleroAgent,
  'social-trans': NavigatorAgent,
  'literature-trans': NavigatorAgent,
  'edu-solver': ThinkerAgent,
  'vidu-template': CreativeAgent,
  'bidwin-parser': ThinkerAgent,
} as const
