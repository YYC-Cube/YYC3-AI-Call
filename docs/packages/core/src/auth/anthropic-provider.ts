/**
 * file anthropic-provider.ts
 * description Anthropic Claude 认证提供者
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.4.0
 * created 2026-04-27
 * updated 2026-04-27
 * status active
 * tags [module],[auth]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief Anthropic Claude 认证提供者
 */
import type { ChatMessage, ChatCompletionResponse } from '../types.js'
import type { AuthProvider, ChatOptions, AuthProviderInfo } from './types.js'

export interface AnthropicConfig {
  apiKey?: string
  baseUrl?: string
  defaultModel?: string
  apiVersion?: string
}

export class AnthropicProvider implements AuthProvider {
  readonly name = 'anthropic' as const
  private config: AnthropicConfig
  private _isReady = false

  constructor(config: AnthropicConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseUrl: config.baseUrl || 'https://api.anthropic.com',
      defaultModel: config.defaultModel || 'claude-sonnet-4-20250514',
      apiVersion: config.apiVersion || '2023-06-01',
    }
  }

  get isReady(): boolean {
    return this._isReady && !!this.config.apiKey
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API Key 未配置。请设置 ANTHROPIC_API_KEY 环境变量或传入 apiKey 参数。')
    }
    this._isReady = true
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatCompletionResponse> {
    if (!this.isReady) {
      await this.initialize()
    }

    const model = options.model || this.config.defaultModel!
    const url = `${this.config.baseUrl}/v1/messages`

    const { system, convertedMessages } = this.convertMessages(messages)

    const body: Record<string, unknown> = {
      model,
      messages: convertedMessages,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP,
      stop_sequences: options.stop,
      stream: false,
    }

    if (system) {
      body.system = system
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': this.config.apiVersion!,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return this.transformResponse(data, model)
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<ChatCompletionResponse> {
    if (!this.isReady) {
      await this.initialize()
    }

    const model = options.model || this.config.defaultModel!
    const url = `${this.config.baseUrl}/v1/messages`

    const { system, convertedMessages } = this.convertMessages(messages)

    const body: Record<string, unknown> = {
      model,
      messages: convertedMessages,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP,
      stop_sequences: options.stop,
      stream: true,
    }

    if (system) {
      body.system = system
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey!,
        'anthropic-version': this.config.apiVersion!,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`)
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
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model,
                choices: [{
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: parsed.delta.text,
                  },
                  finishReason: 'stop',
                }],
              }
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }
  }

  async getModels(): Promise<string[]> {
    return [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ]
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
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      description: 'Anthropic Claude 系列模型',
      isAvailable: !!this.config.apiKey,
      isLocal: false,
      models: [
        'claude-sonnet-4-20250514',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
      ],
      defaultModel: this.config.defaultModel,
    }
  }

  private convertMessages(messages: ChatMessage[]): {
    system: string | null
    convertedMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  } {
    const systemMessages = messages.filter(m => m.role === 'system')
    const system = systemMessages.length > 0
      ? systemMessages.map(m => m.content).join('\n')
      : null

    const convertedMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }))

    return { system, convertedMessages }
  }

  private transformResponse(data: any, model: string): ChatCompletionResponse {
    const content = data.content?.map((block: any) => block.text).join('') || ''

    return {
      id: data.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: data.model || model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finishReason: data.stop_reason || 'stop',
      }],
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    }
  }
}
