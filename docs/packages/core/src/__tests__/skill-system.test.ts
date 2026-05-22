/**
 * file skill-system.test.ts
 * description @yyc3/core skill-system.ts 单元测试
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
 * brief @yyc3/core skill-system.ts 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SkillRecommender,
  SkillLearner,
  SkillComposer,
  SkillQualityGates,
} from '../skills/index.js'
import type {
  SkillRegistryItem,
  ExecutionContext,
  SkillExecutionResult,
} from '../skills/types.js'

describe('智能技能系统', () => {
  describe('SkillRecommender', () => {
    let recommender: SkillRecommender
    let mockSkills: SkillRegistryItem[]

    beforeEach(() => {
      recommender = new SkillRecommender()
      
      mockSkills = [
        {
          id: 'code-gen',
          name: '代码生成',
          description: '生成高质量代码',
          category: 'generation',
          version: '1.0.0',
          handler: async () => ({ success: true, output: 'code', duration: 100 }),
          registeredAt: new Date(),
          executionCount: 100,
          successCount: 95,
          totalDuration: 50000,
        },
        {
          id: 'code-review',
          name: '代码审查',
          description: '审查代码质量',
          category: 'analysis',
          version: '1.0.0',
          handler: async () => ({ success: true, output: 'review', duration: 100 }),
          registeredAt: new Date(),
          executionCount: 50,
          successCount: 48,
          totalDuration: 25000,
        },
        {
          id: 'test-gen',
          name: '测试生成',
          description: '生成单元测试',
          category: 'automation',
          version: '1.0.0',
          handler: async () => ({ success: true, output: 'tests', duration: 100 }),
          registeredAt: new Date(),
          executionCount: 30,
          successCount: 28,
          totalDuration: 15000,
        },
      ]
    })

    it('应该基于任务类型推荐技能', () => {
      const recommendations = recommender.recommend(mockSkills, {
        taskType: 'code-generation',
        input: {},
        keywords: ['代码', '生成'],
      })

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0].skillId).toBe('code-gen')
      expect(recommendations[0].score).toBeGreaterThan(0)
    })

    it('应该基于关键词推荐技能', () => {
      const recommendations = recommender.recommend(mockSkills, {
        taskType: 'unknown',
        input: {},
        keywords: ['审查', '质量'],
      })

      expect(recommendations.length).toBeGreaterThan(0)
      const reviewRec = recommendations.find(r => r.skillId === 'code-review')
      expect(reviewRec).toBeDefined()
      expect(reviewRec!.context.capabilityMatch).toBeGreaterThanOrEqual(0)
    })

    it('应该按分数排序推荐结果', () => {
      const recommendations = recommender.recommend(mockSkills, {
        taskType: 'code-generation',
        input: {},
        keywords: ['代码'],
      })

      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].score).toBeGreaterThanOrEqual(
          recommendations[i + 1].score
        )
      }
    })

    it('应该生成推荐理由', () => {
      const recommendations = recommender.recommend(mockSkills, {
        taskType: 'code-generation',
        input: {},
        keywords: ['代码', '生成'],
      })

      expect(recommendations[0].reasons.length).toBeGreaterThan(0)
      expect(typeof recommendations[0].reasons[0]).toBe('string')
    })

    it('应该计算置信度', () => {
      const recommendations = recommender.recommend(mockSkills, {
        taskType: 'code-generation',
        input: {},
        keywords: ['代码'],
      })

      expect(recommendations[0].confidence).toBeGreaterThanOrEqual(0)
      expect(recommendations[0].confidence).toBeLessThanOrEqual(1)
    })

    it('应该更新执行历史', () => {
      recommender.updateHistory({
        skillId: 'code-gen',
        taskType: 'code-generation',
        success: true,
        duration: 1000,
        timestamp: new Date(),
      })

      const stats = recommender.getStats()
      expect(stats.totalRecommendations).toBe(1)
    })

    it('应该更新用户偏好', () => {
      recommender.updatePreferences({
        preferredSkills: ['code-gen'],
        avoidedSkills: ['test-gen'],
      })

      const recommendations = recommender.recommend(mockSkills, {
        taskType: 'code-generation',
        input: {},
        keywords: ['代码'],
      })

      const codeGen = recommendations.find(r => r.skillId === 'code-gen')
      expect(codeGen).toBeDefined()
    })
  })

  describe('SkillLearner', () => {
    let learner: SkillLearner

    beforeEach(() => {
      learner = new SkillLearner()
    })

    it('应该学习执行结果', () => {
      const optimization = learner.learn({
        skillId: 'test-skill',
        executionResult: {
          success: true,
          output: 'result',
          duration: 1000,
        },
        context: {
          taskType: 'test',
          inputSize: 100,
          complexity: 0.5,
          resourceUsage: { memory: 100, cpu: 50, time: 1000 },
        },
        timestamp: new Date(),
      })

      expect(optimization).toBeDefined()
      expect(optimization.skillId).toBe('test-skill')
      expect(optimization.performance.currentScore).toBeGreaterThanOrEqual(0)
    })

    it('应该生成优化建议', () => {
      const optimization = learner.learn({
        skillId: 'slow-skill',
        executionResult: {
          success: true,
          output: 'result',
          duration: 10000,
        },
        context: {
          taskType: 'test',
          inputSize: 100,
          complexity: 0.5,
          resourceUsage: { memory: 100, cpu: 50, time: 10000 },
        },
        timestamp: new Date(),
      })

      expect(optimization.warnings.length).toBeGreaterThan(0)
      expect(optimization.improvements.length).toBeGreaterThan(0)
    })

    it('应该提取执行模式', () => {
      for (let i = 0; i < 5; i++) {
        learner.learn({
          skillId: 'pattern-skill',
          executionResult: {
            success: true,
            output: 'result',
            duration: 1000,
          },
          context: {
            taskType: 'test',
            inputSize: 100,
            complexity: 0.3,
            resourceUsage: { memory: 100, cpu: 50, time: 1000 },
          },
          timestamp: new Date(),
        })
      }

      const model = learner.getModel('pattern-skill')
      expect(model).toBeDefined()
      expect(model!.patterns.length).toBeGreaterThan(0)
    })

    it('应该计算性能指标', () => {
      for (let i = 0; i < 10; i++) {
        learner.learn({
          skillId: 'perf-skill',
          executionResult: {
            success: i < 8,
            output: 'result',
            duration: 1000 + i * 100,
          },
          context: {
            taskType: 'test',
            inputSize: 100,
            complexity: 0.5,
            resourceUsage: { memory: 100, cpu: 50, time: 1000 },
          },
          timestamp: new Date(),
        })
      }

      const model = learner.getModel('perf-skill')
      expect(model!.performance.successRate).toBeCloseTo(0.8, 1)
    })

    it('应该获取学习统计', () => {
      learner.learn({
        skillId: 'skill-1',
        executionResult: { success: true, duration: 1000 },
        context: {
          taskType: 'test',
          inputSize: 100,
          complexity: 0.5,
          resourceUsage: { memory: 100, cpu: 50, time: 1000 },
        },
        timestamp: new Date(),
      })

      learner.learn({
        skillId: 'skill-2',
        executionResult: { success: false, duration: 2000 },
        context: {
          taskType: 'test',
          inputSize: 100,
          complexity: 0.5,
          resourceUsage: { memory: 100, cpu: 50, time: 2000 },
        },
        timestamp: new Date(),
      })

      const stats = learner.getStats()
      expect(stats.totalSkills).toBe(2)
      expect(stats.totalExecutions).toBe(2)
    })

    it('应该清理旧数据', () => {
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      
      learner.learn({
        skillId: 'old-skill',
        executionResult: { success: true, duration: 1000 },
        context: {
          taskType: 'test',
          inputSize: 100,
          complexity: 0.5,
          resourceUsage: { memory: 100, cpu: 50, time: 1000 },
        },
        timestamp: oldDate,
      })

      learner.cleanup(30 * 24 * 60 * 60 * 1000)
      
      const data = learner['learningData'].get('old-skill')
      expect(data?.length ?? 0).toBe(0)
    })
  })

  describe('SkillComposer', () => {
    let composer: SkillComposer
    let mockExecutor: (skillId: string, input: unknown, ctx: ExecutionContext) => Promise<SkillExecutionResult>
    let mockContext: ExecutionContext

    beforeEach(() => {
      composer = new SkillComposer()
      
      mockContext = {
        sessionId: 'test-session',
        userId: 'test-user',
        provider: 'openai',
        messages: [],
        variables: {},
        metadata: {},
      }
      
      mockExecutor = async (skillId: string, input: unknown) => {
        return {
          success: true,
          output: `${skillId}-output`,
          duration: 100,
        }
      }

      composer.register({
        id: 'test-pipeline',
        name: '测试管道',
        description: '测试管道编排',
        mode: 'pipeline',
        steps: [
          { skillId: 'step1', onFailure: 'skip' },
          { skillId: 'step2', onFailure: 'skip' },
          { skillId: 'step3', onFailure: 'abort' },
        ],
      })

      composer.register({
        id: 'test-parallel',
        name: '测试并行',
        description: '测试并行编排',
        mode: 'parallel',
        steps: [
          { skillId: 'parallel1' },
          { skillId: 'parallel2' },
          { skillId: 'parallel3' },
        ],
      })

      composer.register({
        id: 'test-conditional',
        name: '测试条件',
        description: '测试条件编排',
        mode: 'conditional',
        steps: [
          { skillId: 'cond1', condition: 'variables.complexity < 0.5' },
          { skillId: 'cond2', condition: 'variables.complexity >= 0.5' },
        ],
      })
    })

    it('应该注册编排定义', () => {
      const all = composer.getAll()
      expect(all.length).toBe(3)
      expect(all.find(c => c.id === 'test-pipeline')).toBeDefined()
    })

    it('应该执行管道编排', async () => {
      const result = await composer.execute(
        'test-pipeline',
        { input: 'test' },
        mockContext,
        mockExecutor
      )

      expect(result.success).toBe(true)
      expect(result.executedSteps.length).toBe(3)
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('应该执行并行编排', async () => {
      const result = await composer.execute(
        'test-parallel',
        { input: 'test' },
        mockContext,
        mockExecutor
      )

      expect(result.success).toBe(true)
      expect(result.executedSteps.length).toBe(3)
    })

    it('应该处理编排失败', async () => {
      const failExecutor = async (skillId: string) => {
        if (skillId === 'step2') {
          return { success: false, error: 'Step 2 failed', duration: 100 }
        }
        return { success: true, output: `${skillId}-output`, duration: 100 }
      }

      const result = await composer.execute(
        'test-pipeline',
        { input: 'test' },
        mockContext,
        failExecutor
      )

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('应该处理编排未找到', async () => {
      const result = await composer.execute(
        'non-existent',
        { input: 'test' },
        mockContext,
        mockExecutor
      )

      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('编排未找到')
    })

    it('应该注销编排', () => {
      const unregistered = composer.unregister('test-pipeline')
      expect(unregistered).toBe(true)
      expect(composer.get('test-pipeline')).toBeUndefined()
    })

    it('应该创建预定义编排', () => {
      composer.createPredefinedCompositions()
      const all = composer.getAll()
      
      const pipeline = all.find(c => c.id === 'code-analysis-pipeline')
      expect(pipeline).toBeDefined()
      expect(pipeline!.mode).toBe('pipeline')
    })
  })

  describe('SkillQualityGates', () => {
    let qualityGates: SkillQualityGates
    let mockSkill: SkillRegistryItem

    beforeEach(() => {
      qualityGates = new SkillQualityGates()
      
      mockSkill = {
        id: 'test-skill',
        name: '测试技能',
        description: '测试技能描述',
        category: 'automation',
        version: '1.0.0',
        handler: async () => ({ success: true, output: 'test', duration: 100 }),
        registeredAt: new Date(),
        executionCount: 100,
        successCount: 95,
        totalDuration: 50000,
      }
    })

    it('应该初始化默认规则', () => {
      const rules = qualityGates.getAllRules()
      expect(rules.length).toBeGreaterThan(0)
    })

    it('应该检查输入', async () => {
      const report = await qualityGates.checkInput(mockSkill, {
        test: 'data',
      })

      expect(report).toBeDefined()
      expect(report.skillId).toBe('test-skill')
    })

    it('应该检查输出', async () => {
      const report = await qualityGates.checkOutput(
        mockSkill,
        { test: 'input' },
        { result: 'output' },
        {
          success: true,
          output: { result: 'output' },
          duration: 1000,
        }
      )

      expect(report).toBeDefined()
      expect(report.passed).toBe(true)
    })

    it('应该检测性能问题', async () => {
      const report = await qualityGates.checkOutput(
        mockSkill,
        { test: 'input' },
        { result: 'output' },
        {
          success: true,
          output: { result: 'output' },
          duration: 10000,
        }
      )

      const perfResult = report.results.find(r => r.ruleId === 'performance-check')
      expect(perfResult?.passed).toBe(false)
    })

    it('应该检测安全问题', async () => {
      const report = await qualityGates.check({
        skill: mockSkill,
        input: '<script>alert("xss")</script>',
        metadata: {},
      })

      const secResult = report.results.find(r => r.ruleId === 'security-check')
      expect(secResult?.passed).toBe(false)
    })

    it('应该添加自定义规则', async () => {
      qualityGates.addRule({
        id: 'custom-rule',
        name: '自定义规则',
        description: '测试自定义规则',
        type: 'compliance',
        severity: 'error',
        check: async () => ({
          passed: true,
          ruleId: 'custom-rule',
          message: '自定义检查通过',
        }),
      })

      const rules = qualityGates.getAllRules()
      expect(rules.find(r => r.id === 'custom-rule')).toBeDefined()
    })

    it('应该移除规则', () => {
      const removed = qualityGates.removeRule('input-validation')
      expect(removed).toBe(true)
      
      const rules = qualityGates.getAllRules()
      expect(rules.find(r => r.id === 'input-validation')).toBeUndefined()
    })

    it('应该获取统计信息', async () => {
      await qualityGates.checkInput(mockSkill, { test: 'data' })
      await qualityGates.checkOutput(
        mockSkill,
        { test: 'input' },
        { test: 'output' },
        { success: true, duration: 1000 }
      )

      const stats = qualityGates.getStats()
      expect(stats.totalRules).toBeGreaterThan(0)
    })

    it('应该支持严格模式', () => {
      qualityGates.setStrictMode(true)
      const report = qualityGates.check({
        skill: mockSkill,
        input: {},
        metadata: {},
      })

      expect(report).toBeDefined()
    })

    it('应该支持启用/禁用', () => {
      qualityGates.setEnabled(false)
      expect(qualityGates['config'].enabled).toBe(false)
      
      qualityGates.setEnabled(true)
      expect(qualityGates['config'].enabled).toBe(true)
    })
  })
})
