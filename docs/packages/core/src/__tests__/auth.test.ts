/**
 * file auth.test.ts
 * description @yyc3/core auth.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[auth],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core auth.ts 单元测试
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnthropicProvider } from '../auth/anthropic-provider.js'
import { OllamaProvider } from '../auth/ollama-provider.js'
import { OpenAIProvider } from '../auth/openai-provider.js'
import type { AuthProvider, AuthProviderInfo } from '../auth/types.js'
import { UnifiedAuthManager } from '../auth/unified-auth.js'

describe('UnifiedAuthManager', () => {
  let auth: UnifiedAuthManager

  beforeEach(() => {
    auth = new UnifiedAuthManager()
  })

  describe('构造函数', () => {
    it('应该创建认证管理器实例', () => {
      expect(auth).toBeDefined()
      expect(auth).toBeInstanceOf(UnifiedAuthManager)
    })

    it('应该使用默认配置', () => {
      const status = auth.getStatus()
      expect(status.activeProvider).toBeNull()
      expect(status.providers).toEqual([])
    })

    it('应该接受自定义配置', () => {
      const customAuth = new UnifiedAuthManager({
        preferLocal: true,
        autoDetect: false,
        openai: {
          apiKey: 'test-key',
          baseUrl: 'https://api.test.com',
        },
        ollama: {
          baseUrl: 'http://localhost:11434',
        },
      })
      expect(customAuth).toBeDefined()
    })
  })

  describe('autoDetect', () => {
    it('应该返回提供商列表', async () => {
      const providers = await auth.autoDetect()
      expect(Array.isArray(providers)).toBe(true)
    })

    it('应该检测 OpenAI 提供商', async () => {
      const openaiAuth = new UnifiedAuthManager({
        openai: { apiKey: 'test-key' },
      })

      const providers = await openaiAuth.autoDetect()
      const openai = providers.find(p => p.name === 'openai')

      if (openai) {
        expect(openai.name).toBe('openai')
        expect(openai.isLocal).toBe(false)
      }
    })

    it('应该检测 Ollama 提供商', async () => {
      const ollamaAuth = new UnifiedAuthManager({
        ollama: { baseUrl: 'http://localhost:11434' },
      })

      const providers = await ollamaAuth.autoDetect()
      const ollama = providers.find(p => p.name === 'ollama')

      if (ollama) {
        expect(ollama.name).toBe('ollama')
        expect(ollama.isLocal).toBe(true)
      }
    })
  })

  describe('getActiveProvider', () => {
    it('初始时应该返回 null', () => {
      expect(auth.getActiveProvider()).toBeNull()
    })

    it('自动检测后应该返回提供商', async () => {
      await auth.autoDetect()
      const provider = auth.getActiveProvider()

      if (provider) {
        expect(provider).toBeDefined()
      }
    })
  })

  describe('getStatus', () => {
    it('应该返回认证状态', () => {
      const status = auth.getStatus()

      expect(status).toHaveProperty('activeProvider')
      expect(status).toHaveProperty('providers')
      expect(status).toHaveProperty('lastChecked')
      expect(status).toHaveProperty('errors')
    })

    it('lastChecked 应该是 Date 实例', () => {
      const status = auth.getStatus()
      expect(status.lastChecked).toBeInstanceOf(Date)
    })
  })

  describe('getProviders', () => {
    it('应该返回提供商列表', () => {
      const providers = auth.getProviders()
      expect(Array.isArray(providers)).toBe(true)
    })
  })

  describe('switchProvider', () => {
    it('切换到不可用的提供商应该抛出错误', async () => {
      await expect(auth.switchProvider('openai')).rejects.toThrow('不可用')
    })
  })

  describe('chat', () => {
    it('没有可用提供商时应该抛出错误', async () => {
      await expect(auth.chat([
        { role: 'user', content: 'test' }
      ])).rejects.toThrow('没有可用的 AI 提供商')
    })
  })

  describe('registerProvider', () => {
    it('应该注册自定义提供商', () => {
      const mockProvider: AuthProvider = {
        name: 'openai',
        isReady: true,
        validate: vi.fn().mockResolvedValue(true),
        initialize: vi.fn().mockResolvedValue(undefined),
        getInfo: vi.fn().mockReturnValue({
          name: 'openai',
          displayName: 'Custom Provider',
          description: 'Test provider',
          isAvailable: true,
          isLocal: false,
          models: [],
        } as AuthProviderInfo),
        chat: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'test' } }],
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        }),
        stream: vi.fn(),
        dispose: vi.fn().mockResolvedValue(undefined),
        getModels: vi.fn().mockResolvedValue(['gpt-4']),
      }

      auth.registerProvider(mockProvider)
      const providers = auth.getProviders()

      expect(providers.some(p => p.name === 'openai')).toBe(true)
    })
  })

  describe('dispose', () => {
    it('应该清理所有资源', async () => {
      await auth.dispose()
      expect(auth.getActiveProvider()).toBeNull()
      expect(auth.getProviders()).toEqual([])
    })
  })
})

describe('OpenAIProvider', () => {
  it('应该创建 OpenAI 提供商实例', () => {
    const provider = new OpenAIProvider({
      apiKey: 'test-key',
    })
    expect(provider).toBeDefined()
    expect(provider.name).toBe('openai')
  })

  it('应该返回提供商信息', () => {
    const provider = new OpenAIProvider({
      apiKey: 'test-key',
    })
    const info = provider.getInfo()

    expect(info.name).toBe('openai')
    expect(info.isLocal).toBe(false)
  })
})

describe('OllamaProvider', () => {
  it('应该创建 Ollama 提供商实例', () => {
    const provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
    })
    expect(provider).toBeDefined()
    expect(provider.name).toBe('ollama')
  })

  it('应该返回提供商信息', () => {
    const provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
    })
    const info = provider.getInfo()

    expect(info.name).toBe('ollama')
    expect(info.isLocal).toBe(true)
  })
})

describe('AnthropicProvider', () => {
  it('应该创建 Anthropic 提供商实例', () => {
    const provider = new AnthropicProvider({
      apiKey: 'test-key',
    })
    expect(provider).toBeDefined()
    expect(provider.name).toBe('anthropic')
  })

  it('应该返回提供商信息', () => {
    const provider = new AnthropicProvider({
      apiKey: 'test-key',
    })
    const info = provider.getInfo()

    expect(info.name).toBe('anthropic')
    expect(info.isLocal).toBe(false)
    expect(info.displayName).toBe('Anthropic Claude')
    expect(info.models.length).toBeGreaterThan(0)
  })

  it('没有 API Key 时 validate 应该返回 false', async () => {
    const original = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    const provider = new AnthropicProvider()
    const isValid = await provider.validate()
    expect(isValid).toBe(false)
    process.env.ANTHROPIC_API_KEY = original
  })

  it('应该返回模型列表', async () => {
    const provider = new AnthropicProvider({ apiKey: 'test-key' })
    const models = await provider.getModels()
    expect(models.length).toBeGreaterThan(0)
    expect(models).toContain('claude-sonnet-4-20250514')
  })
})
