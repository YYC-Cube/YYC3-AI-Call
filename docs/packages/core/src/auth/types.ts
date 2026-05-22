/**
 * file types.ts
 * description @yyc3/core 类型定义
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
 * brief @yyc3/core 类型定义
 */
import type { AIProviderType, ChatMessage, ChatCompletionResponse } from '../types.js'

/**
 * 认证提供商接口
 */
export interface AuthProvider {
  readonly name: AIProviderType
  readonly isReady: boolean
  
  initialize(): Promise<void>
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletionResponse>
  stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatCompletionResponse>
  getModels(): Promise<string[]>
  validate(): Promise<boolean>
  dispose(): Promise<void>
  getInfo(): AuthProviderInfo
}

/**
 * 聊天选项
 */
export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  stream?: boolean
}

/**
 * 认证提供商信息
 */
export interface AuthProviderInfo {
  name: AIProviderType
  displayName: string
  description: string
  isAvailable: boolean
  isLocal: boolean
  models: string[]
  defaultModel?: string
}

/**
 * 认证状态
 */
export interface AuthStatus {
  activeProvider: AIProviderType | null
  providers: AuthProviderInfo[]
  lastChecked: Date
  errors: Array<{ provider: AIProviderType; error: string }>
}
