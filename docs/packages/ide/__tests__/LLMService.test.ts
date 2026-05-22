import { describe, it, expect } from 'vitest'
import {
  PROVIDER_CONFIGS,
  getApiKey,
  setApiKey,
  hasApiKey,
  extractCodeBlock,
  type ProviderConfig,
  type ProviderId,
  type ChatMessage,
} from '../LLMService'

describe('LLMService', () => {
  describe('PROVIDER_CONFIGS', () => {
    it('应该包含6个Provider', () => {
      expect(PROVIDER_CONFIGS).toHaveLength(6)
    })

    it('每个Provider应有必需字段', () => {
      for (const p of PROVIDER_CONFIGS) {
        expect(p.id).toBeDefined()
        expect(p.name).toBeDefined()
        expect(p.baseUrl).toBeDefined()
        expect(['none', 'bearer']).toContain(p.authType)
        expect(typeof p.isLocal).toBe('boolean')
      }
    })

    it('应该包含Ollama Provider', () => {
      const ollama = PROVIDER_CONFIGS.find(p => p.id === 'ollama')
      expect(ollama).toBeDefined()
      expect(ollama!.isLocal).toBe(true)
      expect(ollama!.authType).toBe('none')
    })

    it('云端Provider应该是bearer认证', () => {
      const cloud = PROVIDER_CONFIGS.filter(p => !p.isLocal)
      for (const p of cloud) {
        expect(p.authType).toBe('bearer')
      }
    })
  })

  describe('API Key 管理', () => {
    it('setApiKey + getApiKey 应该工作', () => {
      setApiKey('openai', 'sk-test-123')
      expect(getApiKey('openai')).toBe('sk-test-123')
    })

    it('hasApiKey 未设置时应该返回false', () => {
      expect(hasApiKey('custom')).toBe(false)
    })

    it('hasApiKey 设置后应该返回true', () => {
      setApiKey('deepseek', 'test-key')
      expect(hasApiKey('deepseek')).toBe(true)
    })
  })

  describe('extractCodeBlock', () => {
    it('应该提取单个代码块', () => {
      const text = '```tsx\nexport default function App() {}\n```'
      const result = extractCodeBlock(text)
      expect(result).not.toBeNull()
    })

    it('无代码块时应该返回null', () => {
      const result = extractCodeBlock('普通文本没有代码块')
      expect(result).toBeNull()
    })

    it('应该提取多行代码块', () => {
      const text = '```tsx\nimport React from "react"\n\nexport default function App() {\n  return <div>Hello</div>\n}\n```'
      const result = extractCodeBlock(text)
      expect(result).not.toBeNull()
      expect(result!.code).toContain('import React')
      expect(result!.code).toContain('export default')
    })
  })

  describe('类型验证', () => {
    it('ProviderId 应该接受所有合法值', () => {
      const ids: ProviderId[] = ['ollama', 'openai', 'zhipu', 'dashscope', 'deepseek', 'custom']
      expect(ids).toHaveLength(6)
    })

    it('ChatMessage 应该有正确的结构', () => {
      const msg: ChatMessage = {
        role: 'system',
        content: 'You are a helpful assistant',
      }
      expect(msg.role).toBe('system')
      expect(msg.content).toBeDefined()
    })

    it('ProviderConfig 应该有正确的结构', () => {
      const config: ProviderConfig = {
        id: 'custom',
        name: '自定义',
        nameEn: 'Custom',
        baseUrl: 'https://api.example.com/v1',
        authType: 'bearer',
        apiKey: 'test',
        models: [],
        isLocal: false,
        detected: false,
        description: 'Custom provider',
        docsUrl: '',
      }
      expect(config.id).toBe('custom')
      expect(config.models).toHaveLength(0)
    })
  })
})
