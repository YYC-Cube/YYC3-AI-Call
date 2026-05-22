import { describe, expect, it } from 'vitest'
import { EmotionalIntelligence } from '../family/emotional-intelligence'
import type { ConversationContext, EmotionState, MultimodalInput } from '../family/types'

const createTestContext = (userId = 'user-1', emotion?: EmotionState): ConversationContext => ({
  userId,
  sessionId: 'session-1',
  history: [],
  currentEmotion: emotion,
  activeGoals: [],
  relevantKnowledge: [],
})

describe('EmotionalIntelligence', () => {
  it('should create instance', () => {
    const ei = new EmotionalIntelligence()
    expect(ei).toBeDefined()
  })

  it('should recognize joy emotion', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '太开心了！' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('joy')
    expect(analysis.confidence).toBeGreaterThan(0)
  })

  it('should recognize sadness emotion', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '很难过' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('sadness')
  })

  it('should recognize anxiety emotion', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '很担心这个结果' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('anxiety')
  })

  it('should recognize anger emotion', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '气死了' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('anger')
  })

  it('should recognize confusion emotion', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '我不明白这是什么意思，很困惑' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('confusion')
  })

  it('should recognize excitement emotion', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '太兴奋了！期待已久' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('excitement')
  })

  it('should recognize frustration emotion', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '太沮丧了，一直失败' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('frustration')
  })

  it('should default to peace for neutral text', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '好的' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('peace')
  })

  it('should default to peace for empty text', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('peace')
  })

  it('should identify triggers', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '工作压力太大了，很焦虑' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.triggers.length).toBeGreaterThan(0)
  })

  it('should identify learning trigger', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '这个教程太难了' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.triggers).toContain('学习相关')
  })

  it('should identify relationship trigger', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '和同事吵架了，很生气' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.triggers).toContain('人际关系')
  })

  it('should identify time pressure trigger', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: 'deadline快到了，很紧张' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.triggers).toContain('时间压力')
  })

  it('should identify tech problem trigger', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '这个bug太烦了' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.triggers).toContain('技术问题')
  })

  it('should use context emotion when confidence > 0.7', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '好的' }
    const ctx: ConversationContext = {
      ...createTestContext(),
      currentEmotion: {
        type: 'excitement',
        intensity: 0.9,
        confidence: 0.8,
        timestamp: new Date(),
      },
    }
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('excitement')
    expect(analysis.secondary).toBeDefined()
  })

  it('should ignore context emotion when confidence <= 0.7', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '太开心了！' }
    const ctx = createTestContext('user-1', {
      type: 'sadness',
      intensity: 0.5,
      confidence: 0.5,
      timestamp: new Date(),
    })
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.primary.type).toBe('joy')
  })

  it('should have context inference', () => {
    const ei = new EmotionalIntelligence()
    const input: MultimodalInput = { text: '太开心了！' }
    const ctx = createTestContext()
    const analysis = ei.recognizeEmotion(input, ctx)
    expect(analysis.context).toBeDefined()
    expect(typeof analysis.context).toBe('string')
    expect(analysis.context).toContain('积极')
  })

  describe('generateEmotionalResponse', () => {
    it('should generate response for joy', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '太开心了！' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('喜悦')
      expect(response.empathy).toBeDefined()
      expect(response.support).toBeDefined()
      expect(response.action).toBeDefined()
      expect(response.action!.type).toBe('create')
    })

    it('should generate response for anxiety', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '很担心，好焦虑' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('担心')
      expect(response.action!.type).toBe('reflect')
    })

    it('should generate response for sadness', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '很难过，好伤心' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('难过')
      expect(response.action!.type).toBe('collaborate')
    })

    it('should generate response for anger', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '气死了，太生气了' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('生气')
      expect(response.action!.type).toBe('reflect')
    })

    it('should generate response for confusion', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '我不明白，很困惑' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('困惑')
      expect(response.action!.type).toBe('learn')
    })

    it('should generate response for peace', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '好的' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('平静')
      expect(response.action!.type).toBe('learn')
    })

    it('should generate response for excitement', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '太兴奋了！' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('兴奋')
      expect(response.action!.type).toBe('create')
    })

    it('should generate response for frustration', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '太沮丧了，一直失败' }
      const ctx = createTestContext()
      const analysis = ei.recognizeEmotion(input, ctx)
      const response = ei.generateEmotionalResponse(analysis, ctx)
      expect(response.acknowledgment).toContain('挫败')
      expect(response.action!.type).toBe('practice')
    })
  })

  describe('rememberEmotionalHistory', () => {
    it('should return empty history for unknown user', () => {
      const ei = new EmotionalIntelligence()
      const history = ei.rememberEmotionalHistory('unknown')
      expect(history.userId).toBe('unknown')
      expect(history.emotions).toEqual([])
      expect(history.patterns).toEqual([])
      expect(history.growthAreas).toEqual([])
    })

    it('should return recorded history after emotion recognition', () => {
      const ei = new EmotionalIntelligence()
      const input: MultimodalInput = { text: '太开心了！' }
      const ctx = createTestContext('user-hist')
      ei.recognizeEmotion(input, ctx)
      const history = ei.rememberEmotionalHistory('user-hist')
      expect(history.userId).toBe('user-hist')
      expect(history.emotions.length).toBe(1)
      expect(history.emotions[0].type).toBe('joy')
    })

    it('should build patterns from recorded emotions', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-patterns')
      ei.recognizeEmotion({ text: '太开心了！' }, ctx)
      ei.recognizeEmotion({ text: '很难过' }, ctx)
      ei.recognizeEmotion({ text: '好的' }, ctx)
      const history = ei.rememberEmotionalHistory('user-patterns')
      expect(history.patterns.length).toBeGreaterThan(0)
      const joyPattern = history.patterns.find(p => p.type === 'joy')
      expect(joyPattern).toBeDefined()
      expect(joyPattern!.frequency).toBeGreaterThan(0)
      expect(joyPattern!.averageIntensity).toBeGreaterThan(0)
    })
  })

  describe('trackEmotionalGrowth', () => {
    it('should return default report for unknown user', () => {
      const ei = new EmotionalIntelligence()
      const report = ei.trackEmotionalGrowth('unknown')
      expect(report.userId).toBe('unknown')
      expect(report.positiveRatio).toBe(0.5)
      expect(report.growthAreas).toContain('积极情绪培养')
    })

    it('should track positive ratio', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-growth')
      ei.recognizeEmotion({ text: '太开心了！' }, ctx)
      ei.recognizeEmotion({ text: '好的' }, ctx)
      const report = ei.trackEmotionalGrowth('user-growth')
      expect(report.positiveRatio).toBeGreaterThan(0)
    })

    it('should identify growth areas for anxious user', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-anxious')
      for (let i = 0; i < 10; i++) {
        ei.recognizeEmotion({ text: '很担心焦虑' }, ctx)
      }
      for (let i = 0; i < 5; i++) {
        ei.recognizeEmotion({ text: '好的' }, ctx)
      }
      const report = ei.trackEmotionalGrowth('user-anxious')
      expect(report.growthAreas).toContain('压力管理')
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('should identify growth areas for frustrated user', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-frustrated')
      for (let i = 0; i < 10; i++) {
        ei.recognizeEmotion({ text: '太沮丧了，一直失败' }, ctx)
      }
      const report = ei.trackEmotionalGrowth('user-frustrated')
      expect(report.growthAreas).toContain('挫折应对')
    })

    it('should identify need for positive emotion cultivation', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-neg')
      for (let i = 0; i < 15; i++) {
        ei.recognizeEmotion({ text: '很担心焦虑' }, ctx)
      }
      const report = ei.trackEmotionalGrowth('user-neg')
      expect(report.growthAreas).toContain('积极情绪培养')
    })

    it('should calculate emotional stability', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-stable')
      ei.recognizeEmotion({ text: '好的' }, ctx)
      ei.recognizeEmotion({ text: '好的' }, ctx)
      const report = ei.trackEmotionalGrowth('user-stable')
      expect(report.emotionalStability).toBeGreaterThan(0)
    })

    it('should include period in report', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-period')
      ei.recognizeEmotion({ text: '好的' }, ctx)
      const report = ei.trackEmotionalGrowth('user-period')
      expect(report.period).toBeDefined()
      expect(report.period.start).toBeInstanceOf(Date)
      expect(report.period.end).toBeInstanceOf(Date)
    })
  })

  describe('emotion history cap at 100', () => {
    it('should cap emotion history at 100 entries', () => {
      const ei = new EmotionalIntelligence()
      const ctx = createTestContext('user-cap')
      for (let i = 0; i < 120; i++) {
        ei.recognizeEmotion({ text: '好的' }, ctx)
      }
      const history = ei.rememberEmotionalHistory('user-cap')
      expect(history.emotions.length).toBe(100)
    })
  })
})
