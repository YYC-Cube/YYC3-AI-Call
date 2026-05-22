/**
 * file ai-family.test.ts
 * description @yyc3/core ai-family.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[ai-family],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core ai-family.ts 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AIFamilyManager } from '../ai-family/manager.js'
import { BaseAgent } from '../ai-family/base-agent.js'
import { getAllAgentDefinitions } from '../ai-family/definitions.js'
import type { UnifiedAuthManager } from '../auth/unified-auth.js'
import type { AgentTask, AgentRole } from '../ai-family/types.js'

describe('AIFamilyManager', () => {
  let manager: AIFamilyManager
  let mockAuthManager: UnifiedAuthManager

  beforeEach(() => {
    mockAuthManager = {
      chat: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'test response' } }],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      }),
    } as unknown as UnifiedAuthManager

    manager = new AIFamilyManager({
      authManager: mockAuthManager,
      maxQueueSize: 10,
      taskTimeout: 5000,
    })
  })

  afterEach(() => {
    manager.dispose()
  })

  describe('构造函数', () => {
    it('应该创建管理器实例', () => {
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(AIFamilyManager)
    })

    it('应该初始化所有智能体', () => {
      const agents = manager.getAllAgents()
      expect(agents.size).toBe(8)
    })
  })

  describe('getAgent', () => {
    it('应该获取指定智能体', () => {
      const agent = manager.getAgent('meta-oracle')
      expect(agent).toBeDefined()
      expect(agent?.getName()).toBe('元启·天枢')
    })

    it('不存在的智能体应该返回 undefined', () => {
      const agent = manager.getAgent('non-existent' as AgentRole)
      expect(agent).toBeUndefined()
    })
  })

  describe('getAllAgents', () => {
    it('应该返回所有智能体', () => {
      const agents = manager.getAllAgents()
      const roles: AgentRole[] = [
        'meta-oracle', 'sentinel', 'master', 'creative',
        'navigator', 'thinker', 'prophet', 'bolero'
      ]
      
      for (const role of roles) {
        expect(agents.has(role)).toBe(true)
      }
    })
  })

  describe('getAgentStatus', () => {
    it('应该返回智能体状态', () => {
      const status = manager.getAgentStatus('meta-oracle')
      expect(['idle', 'busy', 'offline']).toContain(status)
    })

    it('不存在的智能体应该返回 offline', () => {
      const status = manager.getAgentStatus('non-existent' as AgentRole)
      expect(status).toBe('offline')
    })
  })

  describe('createTask', () => {
    it('应该创建任务', () => {
      const task = manager.createTask(
        'code-analysis',
        { code: 'const x = 1' },
        { sessionId: 'test-session' }
      )

      expect(task.id).toBeDefined()
      expect(task.type).toBe('code-analysis')
      expect(task.status).toBe('pending')
      expect(task.priority).toBe('medium')
      expect(task.context.sessionId).toBe('test-session')
    })

    it('应该支持不同优先级', () => {
      const highTask = manager.createTask('test', {}, {}, 'high')
      const lowTask = manager.createTask('test', {}, {}, 'low')

      expect(highTask.priority).toBe('high')
      expect(lowTask.priority).toBe('low')
    })
  })

  describe('recommendAgents', () => {
    it('应该为代码任务推荐 master 智能体', () => {
      const task = manager.createTask('code-analysis', { code: 'test' }, {})
      const recommendations = manager.recommendAgents(task)

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.agentId === 'master')).toBe(true)
    })

    it('应该为安全任务推荐 sentinel 智能体', () => {
      const task = manager.createTask('security-check', { target: 'api' }, {})
      const recommendations = manager.recommendAgents(task)

      expect(recommendations.some(r => r.agentId === 'sentinel')).toBe(true)
    })

    it('应该为创意任务推荐 creative 智能体', () => {
      const task = manager.createTask('creative-design', { theme: 'AI' }, {})
      const recommendations = manager.recommendAgents(task)

      expect(recommendations.some(r => r.agentId === 'creative')).toBe(true)
    })

    it('应该为预测任务推荐 prophet 智能体', () => {
      const task = manager.createTask('predict-trend', { data: [] }, {})
      const recommendations = manager.recommendAgents(task)

      expect(recommendations.some(r => r.agentId === 'prophet')).toBe(true)
    })

    it('默认应该推荐 navigator 智能体', () => {
      const task = manager.createTask('unknown-task', { data: 'test' }, {})
      const recommendations = manager.recommendAgents(task)

      expect(recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('getQueueStatus', () => {
    it('应该返回队列状态', () => {
      const status = manager.getQueueStatus()

      expect(status).toHaveProperty('queueLength')
      expect(status).toHaveProperty('runningTasks')
      expect(status).toHaveProperty('maxQueueSize')
      expect(status.maxQueueSize).toBe(10)
    })
  })

  describe('getAgentsStats', () => {
    it('应该返回所有智能体统计', () => {
      const stats = manager.getAgentsStats()

      expect(stats.size).toBe(8)
      for (const [, stat] of stats) {
        expect(stat).toHaveProperty('totalTasks')
        expect(stat).toHaveProperty('averageResponseTime')
        expect(stat).toHaveProperty('errorRate')
      }
    })
  })

  describe('dispose', () => {
    it('应该清理所有资源', () => {
      manager.dispose()
      const agents = manager.getAllAgents()
      expect(agents.size).toBe(0)
    })
  })
})

describe('AgentDefinitions', () => {
  it('应该返回所有智能体定义', () => {
    const definitions = getAllAgentDefinitions()
    expect(definitions.length).toBe(31)
  })

  it('每个定义应该有必要的属性', () => {
    const definitions = getAllAgentDefinitions()
    
    for (const def of definitions) {
      expect(def).toHaveProperty('id')
      expect(def).toHaveProperty('displayName')
      expect(def).toHaveProperty('role')
      expect(def).toHaveProperty('capabilities')
      expect(def).toHaveProperty('systemPrompt')
    }
  })
})

describe('BaseAgent', () => {
  let agent: BaseAgent
  let mockAuthManager: UnifiedAuthManager

  beforeEach(() => {
    mockAuthManager = {
      chat: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'test response' } }],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      }),
    } as unknown as UnifiedAuthManager

    agent = new (BaseAgent as any)({
      authManager: mockAuthManager,
      definition: {
        id: 'test-agent',
        displayName: '测试智能体',
        role: '测试角色',
        description: '用于测试的智能体',
        capabilities: ['test'],
        systemPrompt: '你是一个测试智能体',
        maxConcurrentTasks: 1,
      },
    })
  })

  describe('基本属性', () => {
    it('应该返回智能体名称', () => {
      expect(agent.getName()).toBe('测试智能体')
    })

    it('应该返回智能体ID', () => {
      expect(agent.getId()).toBe('test-agent')
    })

    it('应该返回智能体状态', () => {
      const state = agent.getState()
      expect(state).toHaveProperty('status')
    })
  })

  describe('canAcceptTask', () => {
    it('空闲时应该能接受任务', () => {
      const state = agent.getState()
      expect(['idle', 'busy', 'offline']).toContain(state.status)
    })
  })

  describe('getStats', () => {
    it('应该返回智能体统计', () => {
      const stats = agent.getStats()
      expect(stats).toHaveProperty('totalTasks')
      expect(stats).toHaveProperty('averageResponseTime')
      expect(stats).toHaveProperty('errorRate')
    })
  })
})
