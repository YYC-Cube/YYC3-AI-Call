/**
 * file skill-composer.ts
 * description 技能编排器
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
 * brief 技能编排器
 */
import type { ExecutionContext, SkillExecutionResult } from './types.js'

/**
 * 编排模式
 */
export type CompositionMode = 'sequential' | 'parallel' | 'conditional' | 'pipeline'

/**
 * 编排步骤
 */
export interface CompositionStep {
  skillId: string
  input?: unknown
  condition?: string
  onFailure?: 'skip' | 'abort' | 'retry'
  retryCount?: number
  timeout?: number
}

/**
 * 编排定义
 */
export interface CompositionDefinition {
  id: string
  name: string
  description: string
  mode: CompositionMode
  steps: CompositionStep[]
  inputMapping?: Record<string, string>
  outputMapping?: Record<string, string>
  errorHandling?: {
    strategy: 'fail-fast' | 'continue' | 'rollback'
    maxErrors?: number
  }
}

/**
 * 编排执行结果
 */
export interface CompositionResult {
  success: boolean
  results: Map<string, SkillExecutionResult>
  finalOutput: unknown
  duration: number
  errors: string[]
  executedSteps: string[]
}

/**
 * 编排执行上下文
 */
export interface CompositionContext extends ExecutionContext {
  previousResults: Map<string, SkillExecutionResult>
  compositionVariables: Map<string, unknown>
}

/**
 * 技能组合编排器
 * 支持多技能的组合执行和编排
 */
export class SkillComposer {
  private compositions: Map<string, CompositionDefinition> = new Map()

  /**
   * 注册编排
   */
  register(definition: CompositionDefinition): void {
    this.compositions.set(definition.id, definition)
  }

  /**
   * 注销编排
   */
  unregister(compositionId: string): boolean {
    return this.compositions.delete(compositionId)
  }

  /**
   * 获取编排
   */
  get(compositionId: string): CompositionDefinition | undefined {
    return this.compositions.get(compositionId)
  }

  /**
   * 获取所有编排
   */
  getAll(): CompositionDefinition[] {
    return Array.from(this.compositions.values())
  }

  /**
   * 执行编排
   */
  async execute(
    compositionId: string,
    input: unknown,
    context: ExecutionContext,
    skillExecutor: (skillId: string, input: unknown, ctx: ExecutionContext) => Promise<SkillExecutionResult>
  ): Promise<CompositionResult> {
    const composition = this.compositions.get(compositionId)
    if (!composition) {
      return {
        success: false,
        results: new Map(),
        finalOutput: null,
        duration: 0,
        errors: [`编排未找到: ${compositionId}`],
        executedSteps: [],
      }
    }

    const startTime = Date.now()
    const results = new Map<string, SkillExecutionResult>()
    const errors: string[] = []
    const executedSteps: string[] = []
    const compositionContext: CompositionContext = {
      ...context,
      previousResults: results,
      compositionVariables: new Map(),
    }

    try {
      let finalOutput: unknown = input

      switch (composition.mode) {
        case 'sequential':
          finalOutput = await this.executeSequential(composition, input, compositionContext, skillExecutor, results, errors, executedSteps)
          break

        case 'parallel':
          finalOutput = await this.executeParallel(composition, input, compositionContext, skillExecutor, results, errors, executedSteps)
          break

        case 'conditional':
          finalOutput = await this.executeConditional(composition, input, compositionContext, skillExecutor, results, errors, executedSteps)
          break

        case 'pipeline':
          finalOutput = await this.executePipeline(composition, input, compositionContext, skillExecutor, results, errors, executedSteps)
          break
      }

      return {
        success: errors.length === 0,
        results,
        finalOutput,
        duration: Date.now() - startTime,
        errors,
        executedSteps,
      }
    } catch (error) {
      return {
        success: false,
        results,
        finalOutput: null,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)],
        executedSteps,
      }
    }
  }

  /**
   * 顺序执行
   */
  private async executeSequential(
    composition: CompositionDefinition,
    input: unknown,
    context: CompositionContext,
    skillExecutor: (skillId: string, input: unknown, ctx: ExecutionContext) => Promise<SkillExecutionResult>,
    results: Map<string, SkillExecutionResult>,
    errors: string[],
    executedSteps: string[]
  ): Promise<unknown> {
    let currentInput = input

    for (const step of composition.steps) {
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        continue
      }

      const stepInput = step.input !== undefined ? step.input : currentInput
      
      try {
        const result = await this.executeStep(step, stepInput, context, skillExecutor)
        results.set(step.skillId, result)
        executedSteps.push(step.skillId)

        if (!result.success) {
          if (step.onFailure === 'abort' || composition.errorHandling?.strategy === 'fail-fast') {
            errors.push(`步骤 ${step.skillId} 失败: ${result.error}`)
            break
          }
        } else {
          currentInput = result.output
          context.compositionVariables.set(step.skillId, result.output)
        }
      } catch (error) {
        errors.push(`步骤 ${step.skillId} 执行错误: ${error}`)
        if (step.onFailure === 'abort') {
          break
        }
      }
    }

    return currentInput
  }

  /**
   * 并行执行
   */
  private async executeParallel(
    composition: CompositionDefinition,
    input: unknown,
    context: CompositionContext,
    skillExecutor: (skillId: string, input: unknown, ctx: ExecutionContext) => Promise<SkillExecutionResult>,
    results: Map<string, SkillExecutionResult>,
    errors: string[],
    executedSteps: string[]
  ): Promise<unknown> {
    const promises: Promise<void>[] = []

    for (const step of composition.steps) {
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        continue
      }

      const stepInput = step.input !== undefined ? step.input : input

      promises.push(
        (async () => {
          try {
            const result = await this.executeStep(step, stepInput, context, skillExecutor)
            results.set(step.skillId, result)
            executedSteps.push(step.skillId)

            if (!result.success) {
              errors.push(`步骤 ${step.skillId} 失败: ${result.error}`)
            }
          } catch (error) {
            errors.push(`步骤 ${step.skillId} 执行错误: ${error}`)
          }
        })()
      )
    }

    await Promise.all(promises)

    const outputs: unknown[] = []
    for (const step of composition.steps) {
      const result = results.get(step.skillId)
      if (result?.success) {
        outputs.push(result.output)
      }
    }

    return outputs
  }

  /**
   * 条件执行
   */
  private async executeConditional(
    composition: CompositionDefinition,
    input: unknown,
    context: CompositionContext,
    skillExecutor: (skillId: string, input: unknown, ctx: ExecutionContext) => Promise<SkillExecutionResult>,
    results: Map<string, SkillExecutionResult>,
    errors: string[],
    executedSteps: string[]
  ): Promise<unknown> {
    for (const step of composition.steps) {
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        continue
      }

      const stepInput = step.input !== undefined ? step.input : input
      
      try {
        const result = await this.executeStep(step, stepInput, context, skillExecutor)
        results.set(step.skillId, result)
        executedSteps.push(step.skillId)

        if (result.success) {
          return result.output
        }
      } catch (error) {
        errors.push(`步骤 ${step.skillId} 执行错误: ${error}`)
      }
    }

    return null
  }

  /**
   * 管道执行
   */
  private async executePipeline(
    composition: CompositionDefinition,
    input: unknown,
    context: CompositionContext,
    skillExecutor: (skillId: string, input: unknown, ctx: ExecutionContext) => Promise<SkillExecutionResult>,
    results: Map<string, SkillExecutionResult>,
    errors: string[],
    executedSteps: string[]
  ): Promise<unknown> {
    let currentInput = input

    for (const step of composition.steps) {
      try {
        const result = await this.executeStep(step, currentInput, context, skillExecutor)
        results.set(step.skillId, result)
        executedSteps.push(step.skillId)

        if (!result.success) {
          errors.push(`管道步骤 ${step.skillId} 失败: ${result.error}`)
          if (step.onFailure === 'abort') {
            break
          }
          continue
        }

        currentInput = result.output
        context.compositionVariables.set(step.skillId, result.output)
      } catch (error) {
        errors.push(`管道步骤 ${step.skillId} 执行错误: ${error}`)
        if (step.onFailure === 'abort') {
          break
        }
      }
    }

    return currentInput
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: CompositionStep,
    input: unknown,
    context: ExecutionContext,
    skillExecutor: (skillId: string, input: unknown, ctx: ExecutionContext) => Promise<SkillExecutionResult>
  ): Promise<SkillExecutionResult> {
    const maxRetries = step.retryCount || 0
    let lastError: string | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await skillExecutor(step.skillId, input, context)
        
        if (result.success || attempt === maxRetries) {
          return result
        }

        lastError = result.error
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        if (attempt === maxRetries) {
          return {
            success: false,
            error: lastError,
            duration: 0,
          }
        }
      }
    }

    return {
      success: false,
      error: lastError || '未知错误',
      duration: 0,
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: string, context: CompositionContext): boolean {
    try {
      const variables = Object.fromEntries(context.compositionVariables)
      const func = new Function('variables', 'results', `return ${condition}`)
      return func(variables, Object.fromEntries(context.previousResults))
    } catch {
      return false
    }
  }

  /**
   * 创建预定义编排
   */
  createPredefinedCompositions(): void {
    this.register({
      id: 'code-analysis-pipeline',
      name: '代码分析管道',
      description: '完整的代码分析流程',
      mode: 'pipeline',
      steps: [
        { skillId: 'code-parse', onFailure: 'abort' },
        { skillId: 'code-lint', onFailure: 'skip' },
        { skillId: 'code-complexity', onFailure: 'skip' },
        { skillId: 'code-security', onFailure: 'skip' },
      ],
    })

    this.register({
      id: 'parallel-analysis',
      name: '并行分析',
      description: '并行执行多个分析任务',
      mode: 'parallel',
      steps: [
        { skillId: 'performance-analysis' },
        { skillId: 'security-analysis' },
        { skillId: 'quality-analysis' },
      ],
    })

    this.register({
      id: 'smart-review',
      name: '智能代码审查',
      description: '基于条件的智能审查流程',
      mode: 'conditional',
      steps: [
        { skillId: 'quick-review', condition: 'variables.complexity < 0.3' },
        { skillId: 'deep-review', condition: 'variables.complexity >= 0.3' },
      ],
    })
  }
}
