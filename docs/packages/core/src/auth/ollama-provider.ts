/**
 * file ollama-provider.ts
 * description Ollama 认证提供者
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
 * brief Ollama 认证提供者
 */
import type { ChatMessage, ChatCompletionResponse } from '../types.js'
import type { AuthProvider, ChatOptions, AuthProviderInfo } from './types.js'

/**
 * Ollama 提供商配置
 */
export interface OllamaConfig {
  baseUrl?: string
  defaultModel?: string
}

/**
 * Ollama 认证提供商实现
 */
export class OllamaProvider implements AuthProvider {
  readonly name = 'ollama' as const
  private config: Required<OllamaConfig>
  private _isReady = false
  private _availableModels: string[] = []

  constructor(config: OllamaConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: config.defaultModel || 'llama3.2',
    }
  }

  get isReady(): boolean {
    return this._isReady
  }

  async initialize(): Promise<void> {
    const isRunning = await this.checkOllamaRunning()
    if (!isRunning) {
      throw new Error(
        'Ollama 服务未运行。请先启动 Ollama:\n' +
        '  • macOS/Linux: ollama serve\n' +
        '  • 或访问 https://ollama.ai 下载安装'
      )
    }
    
    this._availableModels = await this.getModels()
    this._isReady = true
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatCompletionResponse> {
    if (!this.isReady) {
      await this.initialize()
    }

    const model = options.model || this.config.defaultModel
    const url = `${this.config.baseUrl}/api/chat`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens,
          top_p: options.topP,
          stop: options.stop,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return this.transformResponse(data, model)
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<ChatCompletionResponse> {
    if (!this.isReady) {
      await this.initialize()
    }

    const model = options.model || this.config.defaultModel
    const url = `${this.config.baseUrl}/api/chat`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens,
          top_p: options.topP,
          stop: options.stop,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.message?.content) {
            yield this.transformResponse(data, model)
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const url = `${this.config.baseUrl}/api/tags`
      const response = await fetch(url)

      if (!response.ok) {
        return [this.config.defaultModel]
      }

      const data = await response.json() as { models?: Array<{ name: string }> }
      return data.models?.map((m) => m.name) || [this.config.defaultModel]
    } catch {
      return [this.config.defaultModel]
    }
  }

  async validate(): Promise<boolean> {
    return this.checkOllamaRunning()
  }

  async dispose(): Promise<void> {
    this._isReady = false
    this._availableModels = []
  }

  getInfo(): AuthProviderInfo {
    return {
      name: 'ollama',
      displayName: 'Ollama',
      description: '本地 Ollama 服务',
      isAvailable: this._isReady,
      isLocal: true,
      models: this._availableModels.length > 0 ? this._availableModels : [this.config.defaultModel],
      defaultModel: this.config.defaultModel,
    }
  }

  private async checkOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  private transformResponse(data: any, model: string): ChatCompletionResponse {
    return {
      id: `ollama-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model,
      choices: [{
        index: 0,
        message: {
          role: data.message?.role || 'assistant',
          content: data.message?.content || '',
        },
        finishReason: data.done ? 'stop' : 'continue',
      }],
      usage: data.eval_count ? {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count,
        totalTokens: (data.prompt_eval_count || 0) + data.eval_count,
      } : undefined,
    }
  }
}
