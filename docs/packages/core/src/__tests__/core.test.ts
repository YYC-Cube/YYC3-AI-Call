/**
 * file core.test.ts
 * description @yyc3/core core.ts 单元测试
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
 * brief @yyc3/core core.ts 单元测试
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MCPClient, SkillManager, UnifiedAuthManager } from '../index.js'

describe('UnifiedAuthManager', () => {
  let auth: UnifiedAuthManager

  beforeEach(() => {
    auth = new UnifiedAuthManager()
  })

  it('应该创建认证管理器实例', () => {
    expect(auth).toBeDefined()
  })

  it('应该能够获取提供商列表', async () => {
    const providers = await auth.autoDetect()
    expect(Array.isArray(providers)).toBe(true)
  })

  it('应该能够获取当前提供商', () => {
    const provider = auth.getActiveProvider()
    expect(provider).toBeNull()
  })
})

describe('SkillManager', () => {
  let skills: SkillManager

  beforeEach(() => {
    skills = new SkillManager()
  })

  it('应该创建技能管理器实例', () => {
    expect(skills).toBeDefined()
  })

  it('应该能够注册技能', () => {
    skills.register(
      {
        id: 'test.skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'analysis',
      },
      async () => ({ success: true, duration: 0 })
    )

    const skill = skills.get('test.skill')
    expect(skill).toBeDefined()
    expect(skill?.name).toBe('测试技能')
  })

  it('应该能够注销技能', () => {
    skills.register(
      {
        id: 'test.skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'analysis',
      },
      async () => ({ success: true, duration: 0 })
    )

    const result = skills.unregister('test.skill')
    expect(result).toBe(true)
    expect(skills.get('test.skill')).toBeUndefined()
  })

  it('应该能够推荐技能', () => {
    skills.register(
      {
        id: 'test.code-review',
        name: '代码审查',
        description: '审查代码质量',
        version: '1.0.0',
        category: 'analysis',
      },
      async () => ({ success: true, duration: 0 })
    )

    const recommended = skills.recommend('审查代码')
    expect(recommended.length).toBeGreaterThan(0)
    expect(recommended[0].name).toBe('代码审查')
  })

  it('应该能够执行技能', async () => {
    skills.register(
      {
        id: 'test.skill',
        name: '测试技能',
        description: '用于测试的技能',
        version: '1.0.0',
        category: 'analysis',
      },
      async (input, context) => ({
        success: true,
        output: { result: '测试成功', input },
        duration: 10,
      })
    )

    const result = await skills.execute('test.skill', { data: 'test' }, {
      sessionId: 'test-session',
      provider: 'openai',
      messages: [],
      variables: {},
      metadata: {},
    })

    expect(result.success).toBe(true)
    expect(result.output).toEqual({ result: '测试成功', input: { data: 'test' } })
  })
})

describe('MCPClient', () => {
  it('应该创建 MCP 客户端实例', () => {
    const mockTransport = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn(),
      connected: false,
    }

    const client = new MCPClient({
      name: 'test-client',
      version: '1.0.0',
      transport: mockTransport,
    })

    expect(client).toBeDefined()
  })

  it('应该能够获取工具列表', () => {
    const mockTransport = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn(),
      connected: false,
    }

    const client = new MCPClient({
      name: 'test-client',
      version: '1.0.0',
      transport: mockTransport,
    })

    const tools = client.tools
    expect(Array.isArray(tools)).toBe(true)
  })
})
