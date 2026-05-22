import { describe, it, expect } from 'vitest'
import { collectContext, compressContext } from '../ai/ContextCollector'
import type { ContextCollectorInput } from '../ai/ContextCollector'

const makeInput = (overrides?: Partial<ContextCollectorInput>): ContextCollectorInput => ({
  fileContents: {
    'src/App.tsx': 'export default function App() { return <div>Hello</div> }',
    'src/utils.ts': 'export function add(a: number, b: number) { return a + b }',
    'src/index.ts': "import App from './App'",
    'package.json': '{"name": "test-project"}',
  },
  activeFile: 'src/App.tsx',
  openTabs: [
    { path: 'src/App.tsx', modified: false },
    { path: 'src/utils.ts', modified: true },
  ],
  gitBranch: 'main',
  gitChanges: [
    { path: 'src/App.tsx', status: 'M', staged: false },
    { path: 'src/new.ts', status: 'A', staged: true },
  ],
  ...overrides,
})

describe('ContextCollector', () => {
  describe('collectContext', () => {
    it('应该返回完整的 ProjectContext', () => {
      const ctx = collectContext(makeInput())
      expect(ctx).toBeDefined()
      expect(ctx.totalFiles).toBe(4)
      expect(ctx.allFilePaths).toHaveLength(4)
      expect(ctx.gitSummary.branch).toBe('main')
    })

    it('应该提取活跃文件内容', () => {
      const ctx = collectContext(makeInput())
      expect(ctx.activeFile).not.toBeNull()
      expect(ctx.activeFile!.path).toBe('src/App.tsx')
      expect(ctx.activeFile!.content).toContain('Hello')
    })

    it('活跃文件不存在时返回 null', () => {
      const ctx = collectContext(makeInput({ activeFile: 'nonexistent.ts' }))
      expect(ctx.activeFile).toBeNull()
    })

    it('应该识别已修改文件', () => {
      const ctx = collectContext(makeInput())
      expect(ctx.modifiedFiles).toContain('src/utils.ts')
      expect(ctx.modifiedFiles).not.toContain('src/App.tsx')
    })

    it('应该收集打开标签页的文件内容', () => {
      const ctx = collectContext(makeInput())
      expect(Object.keys(ctx.selectedFilesContent).length).toBeGreaterThan(0)
    })

    it('应该统计 Git 变更', () => {
      const ctx = collectContext(makeInput())
      expect(ctx.gitSummary.changedFiles).toBe(2)
      expect(ctx.gitSummary.stagedFiles).toBe(1)
    })

    it('应该构建文件树文本', () => {
      const ctx = collectContext(makeInput())
      expect(ctx.fileTree).toContain('src/')
      expect(ctx.fileTree).toContain('App.tsx')
    })

    it('空文件系统应返回空结果', () => {
      const ctx = collectContext(makeInput({
        fileContents: {},
        openTabs: [],
        gitChanges: [],
      }))
      expect(ctx.totalFiles).toBe(0)
      expect(ctx.allFilePaths).toEqual([])
      expect(ctx.activeFile).toBeNull()
    })

    it('大文件应该被截断', () => {
      const bigContent = 'x'.repeat(5000)
      const ctx = collectContext(makeInput({
        fileContents: { 'src/big.ts': bigContent, 'src/App.tsx': 'code' },
        activeFile: 'src/App.tsx',
        openTabs: [{ path: 'src/big.ts', modified: false }],
      }))
      const bigFile = ctx.selectedFilesContent['src/big.ts']
      if (bigFile) {
        expect(bigFile.length).toBeLessThan(bigContent.length)
        expect(bigFile).toContain('truncated')
      }
    })
  })

  describe('compressContext', () => {
    it('应该压缩上下文到指定 token 限制', () => {
      const ctx = collectContext(makeInput())
      const compressed = compressContext(ctx, 100)
      expect(typeof compressed).toBe('string')
      expect(compressed.length).toBeGreaterThan(0)
    })
  })
})
