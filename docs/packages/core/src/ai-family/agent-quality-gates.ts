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
import type {
  AgentRole,
  AgentTask,
  TaskResult,
  TaskContext,
} from './types.js'

/**
 * 质量门类型
 */
export type AgentQualityGateType = 
  | 'input'
  | 'output'
  | 'performance'
  | 'security'
  | 'compliance'
  | 'agent-specific'

/**
 * 质量门规则
 */
export interface AgentQualityRule {
  id: string
  name: string
  description: string
  type: AgentQualityGateType
  severity: 'error' | 'warning' | 'info'
  agents?: AgentRole[]
  check: (context: AgentQualityContext) => Promise<AgentQualityResult>
}

/**
 * 质量检查上下文
 */
export interface AgentQualityContext {
  agent: AgentRole
  task: AgentTask
  input?: unknown
  output?: unknown
  result?: TaskResult
  context: TaskContext
  metadata: Record<string, unknown>
}

/**
 * 质量检查结果
 */
export interface AgentQualityResult {
  passed: boolean
  ruleId: string
  message: string
  details?: Record<string, unknown>
  suggestions?: string[]
}

/**
 * 质量门报告
 */
export interface AgentQualityReport {
  agentId: AgentRole
  taskId: string
  passed: boolean
  results: AgentQualityResult[]
  score: number
  summary: {
    errors: number
    warnings: number
    info: number
  }
  recommendations: string[]
  canProceed: boolean
}

/**
 * 质量门配置
 */
export interface AgentQualityGatesConfig {
  enabled: boolean
  strictMode: boolean
  autoFix: boolean
  maxRetries: number
}

/**
 * Agent质量门系统
 * 实现Agent执行的质量检查和验证
 */
export class AgentQualityGates {
  private rules: Map<string, AgentQualityRule> = new Map()
  private config: Required<AgentQualityGatesConfig>
  private reports: AgentQualityReport[] = []

  constructor(config: Partial<AgentQualityGatesConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      strictMode: config.strictMode ?? false,
      autoFix: config.autoFix ?? false,
      maxRetries: config.maxRetries ?? 3,
    }

    this.initializeDefaultRules()
  }

  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    this.addRule({
      id: 'agent-input-validation',
      name: 'Agent输入验证',
      description: '验证输入到Agent的数据',
      type: 'input',
      severity: 'error',
      check: async (context) => {
        const { task, agent: _agent } = context
        
        if (!task.id || !task.type) {
          return {
            passed: false,
            ruleId: 'agent-input-validation',
            message: '任务缺少必要字段',
            suggestions: ['提供任务ID和类型'],
          }
        }

        if (!task.input) {
          return {
            passed: false,
            ruleId: 'agent-input-validation',
            message: '任务缺少输入',
            suggestions: ['提供任务输入数据'],
          }
        }

        return {
          passed: true,
          ruleId: 'agent-input-validation',
          message: '输入验证通过',
        }
      },
    })

    this.addRule({
      id: 'agent-output-validation',
      name: 'Agent输出验证',
      description: '验证Agent输出的数据',
      type: 'output',
      severity: 'error',
      check: async (context) => {
        const { result, agent: _agent } = context
        
        if (!result) {
          return {
            passed: false,
            ruleId: 'agent-output-validation',
            message: '缺少执行结果',
            suggestions: ['确保Agent正确执行'],
          }
        }

        if (!result.success) {
          return {
            passed: false,
            ruleId: 'agent-output-validation',
            message: `执行失败: ${result.error || '未知错误'}`,
            details: { error: result.error },
            suggestions: ['检查错误日志', '修复Agent实现'],
          }
        }

        if (!result.data && !result.output) {
          return {
            passed: false,
            ruleId: 'agent-output-validation',
            message: '执行成功但无输出数据',
            suggestions: ['检查Agent输出逻辑'],
          }
        }

        return {
          passed: true,
          ruleId: 'agent-output-validation',
          message: '输出验证通过',
        }
      },
    })

    this.addRule({
      id: 'agent-performance-check',
      name: 'Agent性能检查',
      description: '检查Agent执行性能',
      type: 'performance',
      severity: 'warning',
      check: async (context) => {
        const { result, agent } = context
        
        if (!result?.metadata?.duration) {
          return {
            passed: true,
            ruleId: 'agent-performance-check',
            message: '无性能数据',
          }
        }

        const duration = result.metadata.duration as number
        const threshold = this.getPerformanceThreshold(agent)

        if (duration > threshold) {
          return {
            passed: false,
            ruleId: 'agent-performance-check',
            message: `执行时间过长: ${duration}ms (阈值: ${threshold}ms)`,
            details: { duration, threshold },
            suggestions: ['优化Agent实现', '减少计算复杂度', '添加缓存'],
          }
        }

        return {
          passed: true,
          ruleId: 'agent-performance-check',
          message: `性能良好: ${duration}ms`,
        }
      },
    })

    this.addRule({
      id: 'agent-security-check',
      name: 'Agent安全检查',
      description: '检查Agent执行的安全性',
      type: 'security',
      severity: 'error',
      check: async (context) => {
        const { input, output: _output, result } = context
        const issues: string[] = []

        if (typeof input === 'string') {
          const dangerousPatterns = [
            /eval\s*\(/,
            /Function\s*\(/,
            /<script>/,
            /javascript:/,
          ]

          for (const pattern of dangerousPatterns) {
            if (pattern.test(input)) {
              issues.push('输入包含潜在危险代码')
              break
            }
          }
        }

        if (result?.data && typeof result.data === 'string') {
          if (result.data.includes('password') || result.data.includes('secret')) {
            issues.push('输出可能包含敏感信息')
          }
        }

        if (issues.length > 0) {
          return {
            passed: false,
            ruleId: 'agent-security-check',
            message: '发现安全问题',
            details: { issues },
            suggestions: ['清理输入', '过滤敏感信息', '使用安全API'],
          }
        }

        return {
          passed: true,
          ruleId: 'agent-security-check',
          message: '安全检查通过',
        }
      },
    })

    this.addRule({
      id: 'coder-quality-check',
      name: '代码生成质量检查',
      description: '检查代码生成Agent的输出质量',
      type: 'agent-specific',
      severity: 'warning',
      agents: ['coder'],
      check: async (context) => {
        const { result, agent } = context
        
        if (agent !== 'coder' || !result?.success) {
          return {
            passed: true,
            ruleId: 'coder-quality-check',
            message: '不适用',
          }
        }

        const resultData = result.data as { code?: string } | undefined
        const code = resultData?.code || result.output
        if (!code || typeof code !== 'string') {
          return {
            passed: false,
            ruleId: 'coder-quality-check',
            message: '未生成代码',
            suggestions: ['确保生成代码输出'],
          }
        }

        const issues: string[] = []
        
        if (code.length < 10) {
          issues.push('代码过短')
        }

        if (code.includes('TODO') || code.includes('FIXME')) {
          issues.push('代码包含待办事项')
        }

        if (code.includes('console.log') && !code.includes('logger')) {
          issues.push('使用console.log而非logger')
        }

        if (issues.length > 0) {
          return {
            passed: false,
            ruleId: 'coder-quality-check',
            message: '代码质量问题',
            details: { issues },
            suggestions: ['完善代码实现', '移除TODO标记', '使用日志系统'],
          }
        }

        return {
          passed: true,
          ruleId: 'coder-quality-check',
          message: '代码质量良好',
        }
      },
    })

    this.addRule({
      id: 'security-agent-check',
      name: '安全Agent专项检查',
      description: '安全Agent的专项质量检查',
      type: 'agent-specific',
      severity: 'error',
      agents: ['security'],
      check: async (context) => {
        const { result, agent } = context
        
        if (agent !== 'security' || !result?.success) {
          return {
            passed: true,
            ruleId: 'security-agent-check',
            message: '不适用',
          }
        }

        const resultData = result.data as { findings?: unknown[] } | undefined
        const findings = resultData?.findings || []
        
        if (!Array.isArray(findings)) {
          return {
            passed: false,
            ruleId: 'security-agent-check',
            message: '安全检查结果格式错误',
            suggestions: ['返回findings数组'],
          }
        }

        const criticalFindings = findings.filter((f: any) => f.severity === 'critical')
        if (criticalFindings.length > 0) {
          return {
            passed: false,
            ruleId: 'security-agent-check',
            message: `发现${criticalFindings.length}个严重安全问题`,
            details: { criticalFindings },
            suggestions: ['立即修复严重安全问题'],
          }
        }

        return {
          passed: true,
          ruleId: 'security-agent-check',
          message: '安全检查通过',
        }
      },
    })
  }

  /**
   * 获取性能阈值
   */
  private getPerformanceThreshold(agent: AgentRole): number {
    const thresholds: Record<AgentRole, number> = {
      'meta-oracle': 10000,
      'sentinel': 25000,
      'master': 20000,
      'creative': 40000,
      'navigator': 15000,
      'thinker': 20000,
      'prophet': 20000,
      'bolero': 15000,
      'commander': 10000,
      'coder': 30000,
      'multimodal': 60000,
      'predictor': 20000,
      'matcher': 15000,
      'security': 25000,
      'quality': 20000,
      // 扩展智能体
      'translator': 15000,
      'slides-gen': 40000,
      'cartoon-gen': 40000,
      'ai-drawing': 40000,
      'receipt-recog': 20000,
      'clothes-recog': 20000,
      'contract-parser': 20000,
      'service-check': 25000,
      'subtitle-trans': 15000,
      'edu-correction': 20000,
      'job-matcher': 15000,
      'social-trans': 15000,
      'literature-trans': 15000,
      'edu-solver': 20000,
      'vidu-template': 40000,
      'bidwin-parser': 20000,
    }

    return thresholds[agent] || 30000
  }

  /**
   * 添加规则
   */
  addRule(rule: AgentQualityRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * 执行质量检查
   */
  async check(context: AgentQualityContext): Promise<AgentQualityReport> {
    if (!this.config.enabled) {
      return {
        agentId: context.agent,
        taskId: context.task.id,
        passed: true,
        results: [],
        score: 1.0,
        summary: { errors: 0, warnings: 0, info: 0 },
        recommendations: [],
        canProceed: true,
      }
    }

    const results: AgentQualityResult[] = []
    const recommendations: string[] = []
    let errors = 0
    let warnings = 0
    let info = 0

    for (const rule of this.rules.values()) {
      if (rule.agents && !rule.agents.includes(context.agent)) {
        continue
      }

      try {
        const result = await rule.check(context)
        results.push(result)

        if (!result.passed) {
          if (rule.severity === 'error') {
            errors++
          } else if (rule.severity === 'warning') {
            warnings++
          } else {
            info++
          }

          if (result.suggestions) {
            recommendations.push(...result.suggestions)
          }
        }
      } catch (error) {
        results.push({
          passed: false,
          ruleId: rule.id,
          message: `规则检查失败: ${error instanceof Error ? error.message : String(error)}`,
        })
        errors++
      }
    }

    const passed = this.config.strictMode
      ? errors === 0 && warnings === 0
      : errors === 0

    const score = this.calculateScore(results)
    const canProceed = errors === 0

    const report: AgentQualityReport = {
      agentId: context.agent,
      taskId: context.task.id,
      passed,
      results,
      score,
      summary: { errors, warnings, info },
      recommendations: [...new Set(recommendations)],
      canProceed,
    }

    this.reports.push(report)
    
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100)
    }

    return report
  }

  /**
   * 计算质量分数
   */
  private calculateScore(results: AgentQualityResult[]): number {
    if (results.length === 0) return 1.0

    const passedCount = results.filter(r => r.passed).length
    return passedCount / results.length
  }

  /**
   * 快速检查输入
   */
  async checkInput(
    agent: AgentRole,
    task: AgentTask,
    context: TaskContext
  ): Promise<AgentQualityReport> {
    return this.check({
      agent,
      task,
      context,
      metadata: {},
    })
  }

  /**
   * 快速检查输出
   */
  async checkOutput(
    agent: AgentRole,
    task: AgentTask,
    result: TaskResult,
    context: TaskContext
  ): Promise<AgentQualityReport> {
    return this.check({
      agent,
      task,
      result,
      output: result.data,
      context,
      metadata: {},
    })
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalChecks: number
    passRate: number
    avgScore: number
    errorDistribution: Map<AgentRole, number>
    topIssues: string[]
  } {
    const passCount = this.reports.filter(r => r.passed).length
    const avgScore = this.reports.length > 0
      ? this.reports.reduce((sum, r) => sum + r.score, 0) / this.reports.length
      : 0

    const errorDistribution = new Map<AgentRole, number>()
    const issueMap = new Map<string, number>()

    for (const report of this.reports) {
      if (!report.passed) {
        errorDistribution.set(
          report.agentId,
          (errorDistribution.get(report.agentId) || 0) + 1
        )
      }

      for (const result of report.results) {
        if (!result.passed) {
          issueMap.set(
            result.message,
            (issueMap.get(result.message) || 0) + 1
          )
        }
      }
    }

    const topIssues = Array.from(issueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue)

    return {
      totalChecks: this.reports.length,
      passRate: this.reports.length > 0 ? passCount / this.reports.length : 0,
      avgScore,
      errorDistribution,
      topIssues,
    }
  }

  /**
   * 获取最近的报告
   */
  getRecentReports(limit: number = 10): AgentQualityReport[] {
    return this.reports.slice(-limit)
  }

  /**
   * 启用/禁用质量门
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * 设置严格模式
   */
  setStrictMode(strict: boolean): void {
    this.config.strictMode = strict
  }
}
