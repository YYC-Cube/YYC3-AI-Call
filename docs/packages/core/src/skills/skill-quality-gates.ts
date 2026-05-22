/**
 * file skill-quality-gates.ts
 * description 技能质量门控
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
 * brief 技能质量门控
 */
import type { SkillExecutionResult, SkillRegistryItem } from './types.js'

/**
 * 质量门检查类型
 */
export type QualityGateType = 'input' | 'output' | 'performance' | 'security' | 'compliance'

/**
 * 质量门规则
 */
export interface QualityGateRule {
  id: string
  name: string
  description: string
  type: QualityGateType
  severity: 'error' | 'warning' | 'info'
  check: (context: QualityCheckContext) => Promise<QualityCheckResult>
}

/**
 * 质量检查上下文
 */
export interface QualityCheckContext {
  skill: SkillRegistryItem
  input: unknown
  output?: unknown
  result?: SkillExecutionResult
  metadata: Record<string, unknown>
}

/**
 * 质量检查结果
 */
export interface QualityCheckResult {
  passed: boolean
  ruleId: string
  message: string
  details?: Record<string, unknown>
  suggestions?: string[]
}

/**
 * 质量门报告
 */
export interface QualityGateReport {
  skillId: string
  passed: boolean
  results: QualityCheckResult[]
  score: number
  summary: {
    errors: number
    warnings: number
    info: number
  }
  recommendations: string[]
}

/**
 * 质量门配置
 */
export interface QualityGateConfig {
  enabled: boolean
  strictMode: boolean
  skipWarnings: boolean
  customRules: QualityGateRule[]
}

/**
 * 技能质量门
 * 技能执行的质量检查和验证
 */
export class SkillQualityGates {
  private rules: Map<string, QualityGateRule> = new Map()
  private config: QualityGateConfig

  constructor(config: Partial<QualityGateConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      strictMode: config.strictMode ?? false,
      skipWarnings: config.skipWarnings ?? false,
      customRules: config.customRules ?? [],
    }

    this.initializeDefaultRules()
  }

  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    this.addRule({
      id: 'input-validation',
      name: '输入验证',
      description: '验证输入数据的有效性',
      type: 'input',
      severity: 'error',
      check: async (context) => {
        const { input, skill: _skill } = context
        
        if (input === null || input === undefined) {
          return {
            passed: false,
            ruleId: 'input-validation',
            message: '输入不能为空',
            suggestions: ['提供有效的输入数据'],
          }
        }

        if (typeof input === 'string' && input.trim().length === 0) {
          return {
            passed: false,
            ruleId: 'input-validation',
            message: '输入字符串不能为空',
            suggestions: ['提供非空字符串'],
          }
        }

        return {
          passed: true,
          ruleId: 'input-validation',
          message: '输入验证通过',
        }
      },
    })

    this.addRule({
      id: 'output-validation',
      name: '输出验证',
      description: '验证输出数据的有效性',
      type: 'output',
      severity: 'error',
      check: async (context) => {
        const { output, result } = context
        
        if (!result?.success) {
          return {
            passed: false,
            ruleId: 'output-validation',
            message: '技能执行失败',
            details: { error: result?.error },
          }
        }

        if (output === null || output === undefined) {
          return {
            passed: false,
            ruleId: 'output-validation',
            message: '输出不能为空',
            suggestions: ['检查技能实现'],
          }
        }

        return {
          passed: true,
          ruleId: 'output-validation',
          message: '输出验证通过',
        }
      },
    })

    this.addRule({
      id: 'performance-check',
      name: '性能检查',
      description: '检查技能执行性能',
      type: 'performance',
      severity: 'warning',
      check: async (context) => {
        const { result, skill: _skill } = context
        
        if (!result) {
          return {
            passed: true,
            ruleId: 'performance-check',
            message: '无执行结果',
          }
        }

        const duration = result.duration ?? 0
        const threshold = 5000

        if (duration > threshold) {
          return {
            passed: false,
            ruleId: 'performance-check',
            message: `执行时间过长: ${duration}ms (阈值: ${threshold}ms)`,
            details: { duration, threshold },
            suggestions: ['优化技能实现', '添加缓存机制', '减少不必要的计算'],
          }
        }

        return {
          passed: true,
          ruleId: 'performance-check',
          message: `性能良好: ${duration}ms`,
        }
      },
    })

    this.addRule({
      id: 'success-rate-check',
      name: '成功率检查',
      description: '检查技能历史成功率',
      type: 'performance',
      severity: 'warning',
      check: async (context) => {
        const { skill } = context
        
        if (skill.executionCount === 0) {
          return {
            passed: true,
            ruleId: 'success-rate-check',
            message: '新技能，无历史数据',
          }
        }

        const successRate = skill.successCount / skill.executionCount
        const threshold = 0.8

        if (successRate < threshold) {
          return {
            passed: false,
            ruleId: 'success-rate-check',
            message: `成功率较低: ${(successRate * 100).toFixed(0)}% (阈值: ${(threshold * 100).toFixed(0)}%)`,
            details: { successRate, threshold },
            suggestions: ['检查错误日志', '优化技能实现', '增加错误处理'],
          }
        }

        return {
          passed: true,
          ruleId: 'success-rate-check',
          message: `成功率良好: ${(successRate * 100).toFixed(0)}%`,
        }
      },
    })

    this.addRule({
      id: 'security-check',
      name: '安全检查',
      description: '检查输入输出的安全性',
      type: 'security',
      severity: 'error',
      check: async (context) => {
        const { input, output } = context
        const issues: string[] = []

        if (typeof input === 'string') {
          if (input.includes('<script>')) {
            issues.push('输入包含潜在的危险脚本')
          }
          if (input.includes('eval(')) {
            issues.push('输入包含潜在的代码注入')
          }
        }

        if (typeof output === 'string') {
          if (output.includes('password') || output.includes('secret')) {
            issues.push('输出可能包含敏感信息')
          }
        }

        if (issues.length > 0) {
          return {
            passed: false,
            ruleId: 'security-check',
            message: '发现安全问题',
            details: { issues },
            suggestions: ['清理输入数据', '过滤敏感信息', '使用参数化查询'],
          }
        }

        return {
          passed: true,
          ruleId: 'security-check',
          message: '安全检查通过',
        }
      },
    })
  }

  /**
   * 添加规则
   */
  addRule(rule: QualityGateRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * 获取规则
   */
  getRule(ruleId: string): QualityGateRule | undefined {
    return this.rules.get(ruleId)
  }

  /**
   * 获取所有规则
   */
  getAllRules(): QualityGateRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * 执行质量检查
   */
  async check(context: QualityCheckContext): Promise<QualityGateReport> {
    const results: QualityCheckResult[] = []
    const recommendations: string[] = []
    let errors = 0
    let warnings = 0
    let info = 0

    for (const rule of this.rules.values()) {
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

    return {
      skillId: context.skill.id,
      passed,
      results,
      score,
      summary: { errors, warnings, info },
      recommendations: [...new Set(recommendations)],
    }
  }

  /**
   * 计算质量分数
   */
  private calculateScore(results: QualityCheckResult[]): number {
    if (results.length === 0) return 1.0

    const passedCount = results.filter(r => r.passed).length
    return passedCount / results.length
  }

  /**
   * 快速检查输入
   */
  async checkInput(skill: SkillRegistryItem, input: unknown): Promise<QualityGateReport> {
    return this.check({
      skill,
      input,
      metadata: {},
    })
  }

  /**
   * 快速检查输出
   */
  async checkOutput(
    skill: SkillRegistryItem,
    input: unknown,
    output: unknown,
    result: SkillExecutionResult
  ): Promise<QualityGateReport> {
    return this.check({
      skill,
      input,
      output,
      result,
      metadata: {},
    })
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalRules: number
    byType: Record<QualityGateType, number>
    bySeverity: Record<string, number>
  } {
    const byType: Record<QualityGateType, number> = {
      input: 0,
      output: 0,
      performance: 0,
      security: 0,
      compliance: 0,
    }

    const bySeverity: Record<string, number> = {
      error: 0,
      warning: 0,
      info: 0,
    }

    for (const rule of this.rules.values()) {
      byType[rule.type]++
      bySeverity[rule.severity]++
    }

    return {
      totalRules: this.rules.size,
      byType,
      bySeverity,
    }
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
