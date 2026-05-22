import { describe, it, expect } from 'vitest'
import { Qianxing, Wanwu, Xianzhi, Bole } from '../family/members'
import type { ConversationContext } from '../family/types'

const createTestContext = (text?: string): ConversationContext => ({
  userId: 'user-1',
  sessionId: 'session-1',
  history: text ? [{
    id: 'turn-1',
    timestamp: new Date(),
    speaker: 'user' as const,
    content: { text },
  }] : [],
  currentEmotion: undefined,
  activeGoals: [],
  relevantKnowledge: [],
})

describe('Qianxing (Navigator)', () => {
  it('should create with correct id', () => {
    const member = new Qianxing()
    expect(member.id).toBe('qianxing')
  })

  it('should have navigator role', () => {
    const member = new Qianxing()
    expect(member.role).toBe('navigator')
  })

  it('should respond to search queries', async () => {
    const member = new Qianxing()
    const ctx = createTestContext()
    const response = await member.processInput({ text: '查询信息' }, ctx)
    expect(response.text).toContain('查找')
  })

  it('should respond to how-to queries', async () => {
    const member = new Qianxing()
    const ctx = createTestContext()
    const response = await member.processInput({ text: '如何使用' }, ctx)
    expect(response.text).toContain('操作指导')
  })

  it('should give default greeting', async () => {
    const member = new Qianxing()
    const ctx = createTestContext()
    const response = await member.processInput({ text: '你好' }, ctx)
    expect(response.text).toContain('言启·千行')
  })

  it('should return recommended actions', () => {
    const member = new Qianxing()
    const ctx = createTestContext()
    const actions = member.getRecommendedActions(ctx)
    expect(actions.length).toBe(3)
    expect(actions[0].type).toBe('search')
  })
})

describe('Wanwu (Thinker)', () => {
  it('should create with correct id', () => {
    const member = new Wanwu()
    expect(member.id).toBe('wanwu')
  })

  it('should have analyst role', () => {
    const member = new Wanwu()
    expect(member.role).toBe('analyst')
  })

  it('should respond to analysis queries', async () => {
    const member = new Wanwu()
    const ctx = createTestContext()
    const response = await member.processInput({ text: '分析数据' }, ctx)
    expect(response.text).toBeDefined()
    expect(response.text.length).toBeGreaterThan(0)
  })
})

describe('Xianzhi (Prophet)', () => {
  it('should create with correct id', () => {
    const member = new Xianzhi()
    expect(member.id).toBe('xianzhi')
  })

  it('should have prophet role', () => {
    const member = new Xianzhi()
    expect(member.role).toBe('prophet')
  })

  it('should respond to prediction queries', async () => {
    const member = new Xianzhi()
    const ctx = createTestContext()
    const response = await member.processInput({ text: '预测趋势' }, ctx)
    expect(response.text).toBeDefined()
  })
})

describe('Bole (Recommender)', () => {
  it('should create with correct id', () => {
    const member = new Bole()
    expect(member.id).toBe('bole')
  })

  it('should have recommender role', () => {
    const member = new Bole()
    expect(member.role).toBe('recommender')
  })

  it('should respond to recommendation queries', async () => {
    const member = new Bole()
    const ctx = createTestContext()
    const response = await member.processInput({ text: '推荐资源' }, ctx)
    expect(response.text).toBeDefined()
  })
})
