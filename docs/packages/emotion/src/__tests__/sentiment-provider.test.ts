import { describe, it, expect, vi } from 'vitest'
import { LLMSentimentProvider, RuleBasedSentimentProvider } from '../sentiment-provider.js'

describe('RuleBasedSentimentProvider', () => {
  const provider = new RuleBasedSentimentProvider()

  it('应该始终可用', () => {
    expect(provider.isAvailable()).toBe(true)
  })

  it('名称应为 rule-based', () => {
    expect(provider.name).toBe('rule-based')
  })

  it('应该检测正面情感（中文）', async () => {
    const result = await provider.analyze('今天真开心，太棒了')
    expect(['happy', 'excited']).toContain(result.emotion)
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('应该检测正面情感（英文）', async () => {
    const result = await provider.analyze('I am so happy and excited!')
    expect(['happy', 'excited']).toContain(result.emotion)
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('应该检测负面情感（中文）', async () => {
    const result = await provider.analyze('我很伤心难过')
    expect(['sad', 'angry']).toContain(result.emotion)
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('应该检测焦虑情感', async () => {
    const result = await provider.analyze('我很焦虑紧张，压力好大')
    expect(result.emotion).toBe('anxious')
    expect(result.confidence).toBeGreaterThan(0.4)
  })

  it('应该对中性文本返回 neutral', async () => {
    const result = await provider.analyze('今天天气不错')
    expect(result.emotion).toBe('neutral')
    expect(result.confidence).toBeLessThan(0.7)
  })

  it('应该对空文本返回 neutral', async () => {
    const result = await provider.analyze('')
    expect(result.emotion).toBe('neutral')
  })
})

describe('LLMSentimentProvider', () => {
  it('应该创建 OpenAI 实例', () => {
    const provider = new LLMSentimentProvider({
      provider: 'openai',
      apiKey: 'test-key',
    })
    expect(provider.name).toBe('llm')
    expect(provider.isAvailable()).toBe(true)
  })

  it('应该创建 Anthropic 实例', () => {
    const provider = new LLMSentimentProvider({
      provider: 'anthropic',
      apiKey: 'test-key',
    })
    expect(provider.isAvailable()).toBe(true)
  })

  it('应该创建 Ollama 实例（无需 apiKey）', () => {
    const provider = new LLMSentimentProvider({
      provider: 'ollama',
    })
    expect(provider.isAvailable()).toBe(true)
  })

  it('没有 apiKey 时 OpenAI 应不可用', () => {
    const provider = new LLMSentimentProvider({
      provider: 'openai',
    })
    expect(provider.isAvailable()).toBe(false)
  })

  it('没有 apiKey 时 Anthropic 应不可用', () => {
    const provider = new LLMSentimentProvider({
      provider: 'anthropic',
    })
    expect(provider.isAvailable()).toBe(false)
  })
})
