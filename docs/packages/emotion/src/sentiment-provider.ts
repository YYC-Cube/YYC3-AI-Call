/**
 * file sentiment-provider.ts
 * description 情感分析 Provider — 支持关键词规则和 LLM 两种分析模式
 * module @yyc3/emotion
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-27
 * updated 2026-04-27
 * status active
 * tags [module],[sentiment]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 情感分析 Provider
 */
import type { EmotionType } from './types.js';

export interface SentimentProvider {
  readonly name: string
  analyze(text: string): Promise<{ emotion: EmotionType; confidence: number; intensity: number }>
  isAvailable(): boolean
}

export interface LLMSentimentConfig {
  provider: 'openai' | 'ollama' | 'anthropic'
  apiKey?: string
  baseUrl?: string
  model?: string
}

const SYSTEM_PROMPT = `You are an emotion analysis engine. Analyze the user's text and return ONLY a JSON object with exactly these fields:
- "emotion": one of "happy", "sad", "anxious", "confused", "angry", "neutral", "excited", "calm", "relaxed"
- "confidence": a number between 0 and 1
- "intensity": a number between 0 and 1

Respond with ONLY the JSON object, no other text.`

export class LLMSentimentProvider implements SentimentProvider {
  readonly name = 'llm'
  private config: LLMSentimentConfig

  constructor(config: LLMSentimentConfig) {
    this.config = config
  }

  isAvailable(): boolean {
    if (this.config.provider === 'ollama') return true
    return !!this.config.apiKey
  }

  async analyze(text: string): Promise<{ emotion: EmotionType; confidence: number; intensity: number }> {
    const result = await this.callLLM(text)

    try {
      const parsed = JSON.parse(result)
      return {
        emotion: this.validateEmotion(parsed.emotion),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
        intensity: Math.max(0, Math.min(1, Number(parsed.intensity) || 0.5)),
      }
    } catch {
      return { emotion: 'neutral', confidence: 0.3, intensity: 0.2 }
    }
  }

  private async callLLM(text: string): Promise<string> {
    if (this.config.provider === 'ollama') {
      return this.callOllama(text)
    }
    return this.callOpenAICompatible(text)
  }

  private async callOllama(text: string): Promise<string> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434'
    const model = this.config.model || 'llama3.2'

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        stream: false,
        options: { temperature: 0.1 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`)
    }

    const data = await response.json() as { message?: { content?: string } }
    return data.message?.content || ''
  }

  private async callOpenAICompatible(text: string): Promise<string> {
    const baseUrl = this.config.baseUrl || (
      this.config.provider === 'anthropic'
        ? 'https://api.anthropic.com'
        : 'https://api.openai.com/v1'
    )
    const model = this.config.model || (
      this.config.provider === 'anthropic'
        ? 'claude-3-5-haiku-20241022'
        : 'gpt-4o-mini'
    )

    if (this.config.provider === 'anthropic') {
      return this.callAnthropic(baseUrl, model, text)
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content || ''
  }

  private async callAnthropic(baseUrl: string, model: string, text: string): Promise<string> {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.status}`)
    }

    const data = await response.json() as { content?: Array<{ text?: string }> }
    return data.content?.[0]?.text || ''
  }

  private validateEmotion(value: unknown): EmotionType {
    const valid: EmotionType[] = ['happy', 'sad', 'anxious', 'confused', 'angry', 'neutral', 'excited', 'calm', 'relaxed']
    if (typeof value === 'string' && valid.includes(value as EmotionType)) {
      return value as EmotionType
    }
    return 'neutral'
  }
}

export class RuleBasedSentimentProvider implements SentimentProvider {
  readonly name = 'rule-based'

  private positiveKeywords = [
    '开心', '高兴', '快乐', '棒', '好', '喜欢', '爱', '兴奋', '满足',
    'happy', 'good', 'great', 'love', 'excited', 'wonderful',
  ]

  private negativeKeywords = [
    '难过', '伤心', '痛苦', '坏', '讨厌', '恨', '失望', '沮丧',
    'sad', 'bad', 'hate', 'angry', 'disappointed',
  ]

  private anxietyKeywords = [
    '焦虑', '紧张', '担心', '害怕', '压力', '不安',
    'anxious', 'worried', 'scared', 'stressed', 'nervous',
  ]

  isAvailable(): boolean {
    return true
  }

  async analyze(text: string): Promise<{ emotion: EmotionType; confidence: number; intensity: number }> {
    const lower = text.toLowerCase()

    let positiveScore = 0
    let negativeScore = 0
    let anxietyScore = 0

    for (const kw of this.positiveKeywords) {
      if (lower.includes(kw)) positiveScore += 0.2
    }
    for (const kw of this.negativeKeywords) {
      if (lower.includes(kw)) negativeScore += 0.2
    }
    for (const kw of this.anxietyKeywords) {
      if (lower.includes(kw)) anxietyScore += 0.2
    }

    positiveScore = Math.min(1, positiveScore)
    negativeScore = Math.min(1, negativeScore)
    anxietyScore = Math.min(1, anxietyScore)

    if (positiveScore > 0.3) {
      return { emotion: positiveScore > 0.6 ? 'excited' : 'happy', confidence: 0.6 + positiveScore * 0.3, intensity: positiveScore }
    }
    if (negativeScore > 0.3) {
      return { emotion: negativeScore > 0.6 ? 'angry' : 'sad', confidence: 0.6 + negativeScore * 0.3, intensity: negativeScore }
    }
    if (anxietyScore > 0.2) {
      return { emotion: 'anxious', confidence: 0.5 + anxietyScore * 0.3, intensity: anxietyScore }
    }

    return { emotion: 'neutral', confidence: 0.4, intensity: 0.1 }
  }
}
