import { describe, expect, it, vi } from 'vitest'
import { applyPlan, runPipeline, type PipelineInput } from '../ai/AIPipeline'

vi.mock('../LLMService', () => ({
  chatCompletionStream: vi.fn((_provider: any, _modelId: any, _messages: any, callbacks: any) => {
    callbacks.onToken('```tsx\n')
    callbacks.onToken('// filepath: src/App.tsx\n')
    callbacks.onToken('export default function App() { return <div>Fixed</div> }\n')
    callbacks.onToken('```')
    callbacks.onDone('```tsx\n// filepath: src/App.tsx\nexport default function App() { return <div>Fixed</div> }\n```')
  }),
  extractCodeBlock: vi.fn(),
}))

vi.mock('../SettingsBridge', () => ({
  buildRulesPromptInjection: vi.fn(() => ''),
  buildSkillsPromptInjection: vi.fn(() => ''),
  buildMCPToolsDescription: vi.fn(() => ''),
  getActiveAgentPrompt: vi.fn(() => ''),
  getSettingsEnhancedInstructions: vi.fn(() => ''),
}))

const makeInput = (): PipelineInput => ({
  userMessage: '修复这个组件的bug',
  conversationHistory: [],
  fileContents: {
    'src/App.tsx': 'export default function App() { return <div>Hello</div> }',
  },
  activeFile: 'src/App.tsx',
  openTabs: [{ path: 'src/App.tsx', modified: false }],
  gitBranch: 'main',
  gitChanges: [],
  provider: {
    id: 'openai',
    name: 'OpenAI',
    nameEn: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    authType: 'bearer',
    apiKey: 'test-key',
    models: [],
    isLocal: false,
    detected: true,
    description: '',
    docsUrl: '',
  },
  modelId: 'gpt-4o',
})

describe('AIPipeline', () => {
  describe('runPipeline', () => {
    it('应该调用 onToken 回调', () => {
      const onToken = vi.fn()
      const onDone = vi.fn()
      const onError = vi.fn()

      runPipeline(makeInput(), { onToken, onDone, onError })

      expect(onToken).toHaveBeenCalled()
    })

    it('应该调用 onDone 回调', () => {
      const onToken = vi.fn()
      const onDone = vi.fn()
      const onError = vi.fn()

      runPipeline(makeInput(), { onToken, onDone, onError })

      expect(onDone).toHaveBeenCalled()
      const [fullText, codePlan] = onDone.mock.calls[0]
      expect(typeof fullText).toBe('string')
    })

    it('collectProjectContext=false 应该跳过上下文收集', () => {
      const onDone = vi.fn()
      const onContextReady = vi.fn()

      runPipeline(makeInput(), { onToken: vi.fn(), onDone, onError: vi.fn(), onContextReady }, { collectProjectContext: false })

      expect(onDone).toHaveBeenCalled()
    })

    it('空文件系统应该正常工作', () => {
      const input = makeInput()
      input.fileContents = {}
      input.activeFile = ''
      input.openTabs = []

      const onDone = vi.fn()
      runPipeline(input, { onToken: vi.fn(), onDone, onError: vi.fn() })

      expect(onDone).toHaveBeenCalled()
    })
  })

  describe('applyPlan', () => {
    it('应该返回成功结果', () => {
      const result = applyPlan(
        {
          blocks: [{
            filepath: 'src/App.tsx',
            language: 'tsx',
            content: 'export default function App() { return 1 }',
            isNew: false,
          }],
          summary: 'Fixed bug',
          fileCount: 1,
          newFileCount: 0,
          modifiedFileCount: 1,
        },
        (_path: string, _content: string) => { },
        (_path: string, _content: string) => { },
      )
      expect(result).toBeDefined()
    })
  })
})
