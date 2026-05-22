/**
 * file manager.ts
 * description 管理器核心
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
 * brief 管理器核心
 */
import type { 
  SkillDefinition, 
  SkillRegistryItem, 
  ExecutionContext, 
  SkillExecutionResult,
  SkillHandler,
  SkillCategory 
} from './types.js'

/**
 * 技能管理器配置
 */
export interface SkillManagerConfig {
  maxConcurrent?: number
  timeout?: number
}

/**
 * 技能管理器
 * 负责技能的注册、执行和编排
 */
export class SkillManager {
  private registry: Map<string, SkillRegistryItem> = new Map()
  private config: Required<SkillManagerConfig>

  constructor(config: SkillManagerConfig = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 5,
      timeout: config.timeout ?? 60000,
    }
  }

  /**
   * 注册技能
   */
  register(definition: SkillDefinition, handler: SkillHandler): void {
    const item: SkillRegistryItem = {
      ...definition,
      handler,
      registeredAt: new Date(),
      executionCount: 0,
      successCount: 0,
      totalDuration: 0,
    }
    
    this.registry.set(definition.id, item)
  }

  /**
   * 注销技能
   */
  unregister(skillId: string): boolean {
    return this.registry.delete(skillId)
  }

  /**
   * 获取技能
   */
  get(skillId: string): SkillRegistryItem | undefined {
    return this.registry.get(skillId)
  }

  /**
   * 获取所有技能
   */
  getAll(): SkillRegistryItem[] {
    return Array.from(this.registry.values())
  }

  /**
   * 按类别获取技能
   */
  getByCategory(category: SkillCategory): SkillRegistryItem[] {
    return this.getAll().filter(skill => skill.category === category)
  }

  /**
   * 执行技能
   */
  async execute(
    skillId: string,
    input: unknown,
    context: ExecutionContext
  ): Promise<SkillExecutionResult> {
    const skill = this.registry.get(skillId)
    if (!skill) {
      return {
        success: false,
        error: `技能未找到: ${skillId}`,
        duration: 0,
      }
    }

    const startTime = Date.now()
    
    try {
      // 设置超时
      const result = await Promise.race([
        skill.handler(input, context),
        new Promise<SkillExecutionResult>((_, reject) => {
          setTimeout(() => reject(new Error('技能执行超时')), this.config.timeout)
        }),
      ])

      // 更新统计
      skill.lastExecuted = new Date()
      skill.executionCount++

      return result
    } catch (error) {
      return {
        success: false,
        error: String(error),
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * 执行技能链
   */
  async executeChain(
    skills: Array<{ id: string; input?: unknown }>,
    initialInput: unknown,
    context: ExecutionContext
  ): Promise<SkillExecutionResult> {
    let currentInput = initialInput
    let totalDuration = 0
    let totalTokens = { input: 0, output: 0 }

    for (const step of skills) {
      const result = await this.execute(step.id, step.input || currentInput, context)
      
      if (!result.success) {
        return {
          success: false,
          error: `技能链执行失败: ${result.error}`,
          duration: totalDuration + (result.duration ?? 0),
        }
      }

      currentInput = result.output
      totalDuration += result.duration ?? 0
      
      if (result.tokens) {
        totalTokens.input += result.tokens.input
        totalTokens.output += result.tokens.output
      }
    }

    return {
      success: true,
      output: currentInput,
      duration: totalDuration,
      tokens: totalTokens,
    }
  }

  /**
   * 推荐技能
   */
  recommend(task: string): SkillRegistryItem[] {
    const keywords = task.toLowerCase().split(/\s+/)
    
    return this.getAll()
      .map(skill => {
        let score = 0
        const desc = skill.description.toLowerCase()
        const name = skill.name.toLowerCase()
        
        for (const keyword of keywords) {
          if (desc.includes(keyword)) score += 2
          if (name.includes(keyword)) score += 3
        }
        
        return { skill, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.skill)
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.registry.clear()
  }
}
