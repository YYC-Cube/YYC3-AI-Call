/**
 * file skills.test.ts
 * description @yyc3/core skills.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[ai],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core skills.ts 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SkillManager } from '../skills/manager.js'
import { ReasoningSkill, GenerationSkill, AnalysisSkill } from '../skills/builtin.js'
import type { SkillDefinition, ExecutionContext, SkillExecutionResult } from '../skills/types.js'

describe('SkillManager', () => {
  let manager: SkillManager

  const mockHandler = vi.fn().mockResolvedValue({
    success: true,
    output: { result: 'test' },
    duration: 10,
  })

  beforeEach(() => {
    manager = new SkillManager()
    mockHandler.mockClear()
  })

  describe('构造函数', () => {
    it('应该创建管理器实例', () => {
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(SkillManager)
    })

    it('应该接受自定义配置', () => {
      const customManager = new SkillManager({
        maxConcurrent: 10,
        timeout: 30000,
      })
      expect(customManager).toBeDefined()
    })
  })

  describe('register', () => {
    it('应该注册技能', () => {
      const definition: SkillDefinition = {
        id: 'test-skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'reasoning',
      }

      manager.register(definition, mockHandler)
      const skills = manager.getAll()

      expect(skills.some(s => s.id === 'test-skill')).toBe(true)
    })

    it('重复注册应该覆盖旧技能', () => {
      const definition1: SkillDefinition = {
        id: 'test-skill',
        name: '测试技能1',
        description: '第一个版本',
        version: '1.0.0',
        category: 'reasoning',
      }

      const definition2: SkillDefinition = {
        id: 'test-skill',
        name: '测试技能2',
        description: '第二个版本',
        version: '2.0.0',
        category: 'reasoning',
      }

      manager.register(definition1, mockHandler)
      manager.register(definition2, mockHandler)
      const skills = manager.getAll()

      const skill = skills.find(s => s.id === 'test-skill')
      expect(skill?.version).toBe('2.0.0')
    })
  })

  describe('unregister', () => {
    it('应该注销技能', () => {
      const definition: SkillDefinition = {
        id: 'test-skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'reasoning',
      }

      manager.register(definition, mockHandler)
      const result = manager.unregister('test-skill')
      const skills = manager.getAll()

      expect(result).toBe(true)
      expect(skills.some(s => s.id === 'test-skill')).toBe(false)
    })

    it('注销不存在的技能应该返回 false', () => {
      const result = manager.unregister('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('get', () => {
    it('应该获取技能', () => {
      const definition: SkillDefinition = {
        id: 'test-skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'reasoning',
      }

      manager.register(definition, mockHandler)
      const retrieved = manager.get('test-skill')

      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('测试技能')
    })

    it('不存在的技能应该返回 undefined', () => {
      const retrieved = manager.get('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('应该返回所有技能', () => {
      const definition1: SkillDefinition = {
        id: 'skill-1',
        name: '技能1',
        description: '第一个技能',
        version: '1.0.0',
        category: 'reasoning',
      }

      const definition2: SkillDefinition = {
        id: 'skill-2',
        name: '技能2',
        description: '第二个技能',
        version: '1.0.0',
        category: 'generation',
      }

      manager.register(definition1, mockHandler)
      manager.register(definition2, mockHandler)
      const skills = manager.getAll()

      expect(skills.length).toBe(2)
    })
  })

  describe('execute', () => {
    it('应该执行技能', async () => {
      const definition: SkillDefinition = {
        id: 'test-skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'reasoning',
      }

      const handler = vi.fn().mockResolvedValue({
        success: true,
        output: { result: 'test' },
        duration: 10,
      })

      manager.register(definition, handler)
      
      const context: ExecutionContext = {
        sessionId: 'test-session',
      }

      const result = await manager.execute('test-skill', { query: 'test' }, context)

      expect(result.success).toBe(true)
      expect(result.output).toEqual({ result: 'test' })
    })

    it('执行不存在的技能应该返回错误', async () => {
      const context: ExecutionContext = {
        sessionId: 'test-session',
      }

      const result = await manager.execute('non-existent', {}, context)

      expect(result.success).toBe(false)
      expect(result.error).toContain('未找到')
    })
  })

  describe('recommend', () => {
    it('应该推荐相关技能', () => {
      const skill1: SkillDefinition = {
        id: 'code-review',
        name: '代码审查',
        description: '审查代码质量',
        version: '1.0.0',
        category: 'analysis',
      }

      const skill2: SkillDefinition = {
        id: 'doc-generator',
        name: '文档生成',
        description: '自动生成文档',
        version: '1.0.0',
        category: 'generation',
      }

      manager.register(skill1, mockHandler)
      manager.register(skill2, mockHandler)

      const recommendations = manager.recommend('代码 审查')

      expect(recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('getByCategory', () => {
    it('应该按类别获取技能', () => {
      const skill1: SkillDefinition = {
        id: 'code-1',
        name: '代码技能1',
        description: '代码相关',
        version: '1.0.0',
        category: 'analysis',
      }

      const skill2: SkillDefinition = {
        id: 'doc-1',
        name: '文档技能',
        description: '文档相关',
        version: '1.0.0',
        category: 'generation',
      }

      manager.register(skill1, mockHandler)
      manager.register(skill2, mockHandler)

      const analysisSkills = manager.getByCategory('analysis')

      expect(analysisSkills.length).toBe(1)
      expect(analysisSkills[0].id).toBe('code-1')
    })
  })

  describe('clear', () => {
    it('应该清空所有技能', () => {
      const definition: SkillDefinition = {
        id: 'test-skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'reasoning',
      }

      manager.register(definition, mockHandler)
      manager.clear()
      const skills = manager.getAll()

      expect(skills.length).toBe(0)
    })
  })
})

describe('BuiltinSkills', () => {
  it('ReasoningSkill 应该有正确的结构', () => {
    expect(ReasoningSkill.id).toBe('core.reasoning.cageerf')
    expect(ReasoningSkill.name).toBe('CAGEERF 推理框架')
    expect(ReasoningSkill.category).toBe('reasoning')
  })

  it('GenerationSkill 应该有正确的结构', () => {
    expect(GenerationSkill.id).toBe('core.generation.content')
    expect(GenerationSkill.name).toBe('内容生成器')
    expect(GenerationSkill.category).toBe('generation')
  })

  it('AnalysisSkill 应该有正确的结构', () => {
    expect(AnalysisSkill.id).toBe('core.analysis.code')
    expect(AnalysisSkill.name).toBe('代码分析器')
    expect(AnalysisSkill.category).toBe('analysis')
  })
})

describe('Skill Types', () => {
  it('SkillDefinition 应该有正确的结构', () => {
    const definition: SkillDefinition = {
      id: 'test',
      name: 'Test Skill',
      description: 'A test skill',
      version: '1.0.0',
      category: 'reasoning',
    }

    expect(definition.id).toBe('test')
    expect(definition.name).toBe('Test Skill')
    expect(definition.version).toBe('1.0.0')
  })

  it('ExecutionContext 应该有正确的结构', () => {
    const context: ExecutionContext = {
      sessionId: 'session-123',
      userId: 'user-456',
      metadata: { source: 'test' },
    }

    expect(context.sessionId).toBe('session-123')
    expect(context.userId).toBe('user-456')
  })

  it('SkillExecutionResult 应该有正确的结构', () => {
    const result: SkillExecutionResult = {
      success: true,
      output: { data: 'result' },
      duration: 100,
    }

    expect(result.success).toBe(true)
    expect(result.output).toEqual({ data: 'result' })
    expect(result.duration).toBe(100)
  })
})
