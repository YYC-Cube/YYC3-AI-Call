/**
 * file agent-architecture.test.ts
 * description @yyc3/core agent-architecture.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core agent-architecture.ts 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AgentLayers,
  AgentCollaboration,
  AgentRouter,
  AgentQualityGates,
} from '../ai-family/index.js'
import type {
  AgentRole,
  AgentTask,
  TaskContext,
  TaskResult,
} from '../ai-family/types.js'
import type { BaseAgent } from '../ai-family/base-agent.js'

describe('Agent多层架构', () => {
  describe('AgentLayers', () => {
    let layers: AgentLayers
    let mockAuthManager: any

    beforeEach(() => {
      mockAuthManager = {
        getActiveProvider: vi.fn(() => ({ name: 'openai' })),
        chat: vi.fn(),
      }

      layers = new AgentLayers({
        authManager: mockAuthManager,
        enableAutoRouting: true,
        enableQualityGates: true,
      })
    })

    it('应该初始化三层架构', () => {
      const commanderConfig = layers.getLayerConfig('commander')
      expect(commanderConfig).toBeDefined()
      expect(commanderConfig!.name).toBe('指挥层')

      const executorConfig = layers.getLayerConfig('executor')
      expect(executorConfig).toBeDefined()
      expect(executorConfig!.name).toBe('执行层')

      const supporterConfig = layers.getLayerConfig('supporter')
      expect(supporterConfig).toBeDefined()
      expect(supporterConfig!.name).toBe('支持层')
    })

    it('应该获取层级中的所有Agent', () => {
      const commanderAgents = layers.getLayerAgents('commander')
      expect(commanderAgents.length).toBe(0)

      const executorAgents = layers.getLayerAgents('executor')
      expect(executorAgents.length).toBe(0)
    })

    it('应该激活层级', () => {
      layers.activateLayer('executor')
      expect(layers.getActiveLayer()).toBe('executor')

      layers.activateLayer('supporter')
      expect(layers.getActiveLayer()).toBe('supporter')
    })

    it('应该获取架构统计', () => {
      const stats = layers.getStats()
      expect(stats.layers).toBe(3)
      expect(stats.totalAgents).toBe(0)
      expect(stats.activeAgents).toBe(0)
    })

    it('应该注册Agent', () => {
      const mockAgent = {
        getRole: () => 'commander' as AgentRole,
        executeTask: vi.fn(),
      } as unknown as BaseAgent

      layers.registerAgent('commander', mockAgent)
      
      const agents = layers.getLayerAgents('commander')
      expect(agents.length).toBe(1)
    })
  })

  describe('AgentCollaboration', () => {
    let collaboration: AgentCollaboration
    let mockAgents: Map<AgentRole, BaseAgent>

    beforeEach(() => {
      collaboration = new AgentCollaboration({
        maxConcurrentSessions: 5,
        messageTimeout: 5000,
        retryAttempts: 2,
      })

      mockAgents = new Map()
    })

    it('应该创建协同会话', () => {
      const session = collaboration.createSession(
        ['coder', 'quality'],
        'coder',
        { id: 'task-1', type: 'code-generation', description: '测试任务' }
      )

      expect(session).toBeDefined()
      expect(session.participants).toContain('coder')
      expect(session.participants).toContain('quality')
      expect(session.leader).toBe('coder')
      expect(session.status).toBe('active')
    })

    it('应该发送消息', async () => {
      const mockAgent = {
        getRole: () => 'coder' as AgentRole,
        executeTask: vi.fn(),
      } as unknown as BaseAgent

      collaboration.registerAgent('coder', mockAgent)

      const message = {
        id: 'msg-1',
        type: 'request' as const,
        from: 'commander' as AgentRole,
        to: 'coder' as AgentRole,
        content: { task: 'test' },
        priority: 'high' as const,
        timestamp: new Date(),
        requiresResponse: false,
      }

      await collaboration.sendMessage(message)

      const received = collaboration.receiveMessage('coder')
      expect(received).toBeDefined()
      expect(received!.id).toBe('msg-1')
    })

    it('应该获取活跃会话', () => {
      collaboration.createSession(
        ['coder'],
        'coder',
        { id: 'task-1', type: 'test', description: 'test' }
      )

      const activeSessions = collaboration.getActiveSessions()
      expect(activeSessions.length).toBe(1)
    })

    it('应该获取统计信息', () => {
      collaboration.createSession(
        ['coder'],
        'coder',
        { id: 'task-1', type: 'test', description: 'test' }
      )

      const stats = collaboration.getStats()
      expect(stats.totalSessions).toBe(1)
      expect(stats.activeSessions).toBe(1)
    })
  })

  describe('AgentRouter', () => {
    let router: AgentRouter

    beforeEach(() => {
      router = new AgentRouter({
        strategy: 'hybrid',
        enableCaching: true,
        enableLearning: true,
      })
    })

    it('应该初始化默认路由规则', () => {
      const rules = router['rules']
      expect(rules.length).toBeGreaterThan(0)
      
      const codeGenRule = rules.find(r => r.id === 'code-generation')
      expect(codeGenRule).toBeDefined()
      expect(codeGenRule!.targetAgent).toBe('coder')
    })

    it('应该添加路由规则', () => {
      router.addRule({
        id: 'custom-rule',
        name: '自定义规则',
        condition: (task) => task.type === 'custom',
        targetAgent: 'creative',
        priority: 100,
      })

      const rules = router['rules']
      expect(rules.find(r => r.id === 'custom-rule')).toBeDefined()
    })

    it('应该更新Agent负载', () => {
      router['loads'].set('coder', {
        role: 'coder',
        currentTasks: 0,
        avgExecutionTime: 0,
        successRate: 1,
        lastActive: new Date(),
      })
      
      router.updateLoad('coder', 1)
      router.updateLoad('coder', 2)

      const load = router['loads'].get('coder')
      expect(load!.currentTasks).toBe(3)
    })

    it('应该更新Agent性能', () => {
      router['loads'].set('coder', {
        role: 'coder',
        currentTasks: 0,
        avgExecutionTime: 0,
        successRate: 1,
        lastActive: new Date(),
      })
      
      router.updatePerformance('coder', true, 1000)
      router.updatePerformance('coder', false, 2000)

      const load = router['loads'].get('coder')
      expect(load!.successRate).toBeLessThan(1)
      expect(load!.avgExecutionTime).toBeGreaterThan(0)
    })

    it('应该获取路由统计', () => {
      const stats = router.getStats()
      expect(stats.totalRouted).toBe(0)
      expect(stats.avgScore).toBe(0)
      expect(stats.agentDistribution.size).toBe(0)
    })

    it('应该获取路由历史', () => {
      const history = router.getHistory(10)
      expect(history.length).toBe(0)
    })
  })

  describe('AgentQualityGates', () => {
    let qualityGates: AgentQualityGates
    let mockTask: AgentTask
    let mockContext: TaskContext

    beforeEach(() => {
      qualityGates = new AgentQualityGates({
        enabled: true,
        strictMode: false,
        autoFix: false,
        maxRetries: 3,
      })

      mockTask = {
        id: 'task-1',
        type: 'code-generation',
        priority: 'high',
        input: { prompt: '生成测试代码' },
        context: mockContext,
        status: 'pending',
        createdAt: new Date(),
      }

      mockContext = {
        sessionId: 'session-1',
        userId: 'user-1',
        provider: 'openai',
        messages: [],
        variables: {},
        metadata: {},
      }
    })

    it('应该初始化默认规则', () => {
      const rules = qualityGates['rules']
      expect(rules.size).toBeGreaterThan(0)
      
      expect(rules.has('agent-input-validation')).toBe(true)
      expect(rules.has('agent-output-validation')).toBe(true)
    })

    it('应该检查输入', async () => {
      const report = await qualityGates.checkInput(
        'coder',
        mockTask,
        mockContext
      )

      expect(report).toBeDefined()
      expect(report.agentId).toBe('coder')
      expect(report.taskId).toBe('task-1')
    })

    it('应该检查输出', async () => {
      const result: TaskResult = {
        success: true,
        data: { code: 'console.log("test")' },
        agentId: 'coder',
        duration: 100,
      }

      const report = await qualityGates.checkOutput(
        'coder',
        mockTask,
        result,
        mockContext
      )

      expect(report).toBeDefined()
      expect(report.passed).toBe(true)
    })

    it('应该检测执行失败', async () => {
      const result: TaskResult = {
        success: false,
        error: '执行失败',
        agentId: 'coder',
        duration: 0,
      }

      const report = await qualityGates.checkOutput(
        'coder',
        mockTask,
        result,
        mockContext
      )

      expect(report.passed).toBe(false)
      expect(report.summary.errors).toBeGreaterThan(0)
    })

    it('应该检测安全问题', async () => {
      const report = await qualityGates.check({
        agent: 'coder',
        task: mockTask,
        input: '<script>alert("xss")</script>',
        context: mockContext,
        metadata: {},
      })

      const secResult = report.results.find(r => r.ruleId === 'agent-security-check')
      expect(secResult?.passed).toBe(false)
    })

    it('应该添加自定义规则', async () => {
      qualityGates.addRule({
        id: 'custom-agent-rule',
        name: '自定义Agent规则',
        description: '测试自定义规则',
        type: 'agent-specific',
        severity: 'warning',
        agents: ['coder'],
        check: async () => ({
          passed: true,
          ruleId: 'custom-agent-rule',
          message: '自定义检查通过',
        }),
      })

      const rules = qualityGates['rules']
      expect(rules.has('custom-agent-rule')).toBe(true)
    })

    it('应该移除规则', () => {
      const removed = qualityGates.removeRule('agent-input-validation')
      expect(removed).toBe(true)
      
      const rules = qualityGates['rules']
      expect(rules.has('agent-input-validation')).toBe(false)
    })

    it('应该获取统计信息', async () => {
      await qualityGates.checkInput('coder', mockTask, mockContext)
      await qualityGates.checkOutput(
        'coder',
        mockTask,
        { success: true, agentId: 'coder', duration: 100 },
        mockContext
      )

      const stats = qualityGates.getStats()
      expect(stats.totalChecks).toBe(2)
    })

    it('应该支持严格模式', () => {
      qualityGates.setStrictMode(true)
      expect(qualityGates['config'].strictMode).toBe(true)
    })

    it('应该支持启用/禁用', () => {
      qualityGates.setEnabled(false)
      expect(qualityGates['config'].enabled).toBe(false)
    })

    it('应该获取最近的报告', async () => {
      await qualityGates.checkInput('coder', mockTask, mockContext)
      
      const reports = qualityGates.getRecentReports(5)
      expect(reports.length).toBe(1)
    })
  })
})
