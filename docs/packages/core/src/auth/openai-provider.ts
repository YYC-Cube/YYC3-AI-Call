/**
 * file openai-provider.ts
 * description OpenAI 认证提供者
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[auth]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief OpenAI 认证提供者
 */
import type { ChatMessage, ChatCompletionResponse } from '../types.js'
import type { AuthProvider, ChatOptions, AuthProviderInfo } from './types.js'

/**
 * OpenAI 提供商配置
 */
export interface OpenAIConfig {
  apiKey?: string
  baseUrl?: string
  defaultModel?: string
}

/**
 * OpenAI 认证提供商实现
 */
export class OpenAIProvider implements AuthProvider {
  readonly name = 'openai' as const
  private config: OpenAIConfig
  private _isReady = false

  constructor(config: OpenAIConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      defaultModel: config.defaultModel || 'gpt-4o-mini',
    }
  }

  get isReady(): boolean {
    return this._isReady && !!this.config.apiKey
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API Key 未配置。请设置 OPENAI_API_KEY 环境变量或传入 apiKey 参数。')
    }
    this._isReady = true
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatCompletionResponse> {
    if (!this.isReady) {
      await this.initialize()
    }

    const model = options.model || this.config.defaultModel!
    const url = `${this.config.baseUrl}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          name: m.name,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        stop: options.stop,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return this.transformResponse(data)
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<ChatCompletionResponse> {
    if (!this.isReady) {
      await this.initialize()
    }

    const model = options.model || this.config.defaultModel!
    const url = `${this.config.baseUrl}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          name: m.name,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        stop: options.stop,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.choices?.[0]?.delta?.content) {
              yield this.transformResponse(parsed)
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }

  async getModels(): Promise<string[]> {
    if (!this.isReady) {
      await this.initialize()
    }

    const url = `${this.config.baseUrl}/models`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })

    if (!response.ok) {
      return [this.config.defaultModel!]
    }

    const data = await response.json() as { data: Array<{ id: string }> }
    return data.data
      .filter((m) => m.id.includes('gpt'))
      .map((m) => m.id)
  }

  async validate(): Promise<boolean> {
    try {
      await this.initialize()
      return true
    } catch {
      return false
    }
  }

  async dispose(): Promise<void> {
    this._isReady = false
  }

  getInfo(): AuthProviderInfo {
    return {
      name: 'openai',
      displayName: 'OpenAI',
      description: 'OpenAI GPT 系列模型',
      isAvailable: !!this.config.apiKey,
      isLocal: false,
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: this.config.defaultModel,
    }
  }

  private transformResponse(data: any): ChatCompletionResponse {
    return {
      id: data.id || `chat-${Date.now()}`,
      object: data.object || 'chat.completion',
      created: data.created || Date.now(),
      model: data.model || this.config.defaultModel!,
      choices: data.choices?.map((choice: any, index: number) => ({
        index,
        message: {
          role: choice.message?.role || choice.delta?.role || 'assistant',
          content: choice.message?.content || choice.delta?.content || '',
        },
        finishReason: choice.finish_reason || 'stop',
      })) || [],
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    }
  }
}
