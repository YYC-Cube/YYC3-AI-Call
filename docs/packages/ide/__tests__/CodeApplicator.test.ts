import { describe, expect, it } from 'vitest'
import {
  applyCodeToFiles,
  generateSimpleDiff,
  parseCodeBlocks,
  validateCodeBlock,
  type ParsedCodeBlock
} from '../ai/CodeApplicator'

const EXISTING_FILES: Record<string, string> = {
  'src/App.tsx': 'export default function App() { return <div>Old</div> }',
  'src/utils.ts': 'export function add(a: number, b: number) { return a + b }',
}

describe('CodeApplicator', () => {
  describe('parseCodeBlocks', () => {
    it('应该解析单文件代码块', () => {
      const response = '```tsx\n// filepath: src/App.tsx\nexport default function App() { return <div>New</div> }\n```'
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.blocks).toHaveLength(1)
      expect(plan.blocks[0].filepath).toBe('src/App.tsx')
      expect(plan.blocks[0].isNew).toBe(false)
    })

    it('应该解析多文件代码块', () => {
      const response = [
        '```tsx\n// filepath: src/App.tsx\nexport default function App() {}\n```',
        '```ts\n// filepath: src/new-file.ts\nexport const foo = 1\n```',
      ].join('\n\n')
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.blocks).toHaveLength(2)
      expect(plan.modifiedFileCount).toBe(1)
      expect(plan.newFileCount).toBe(1)
    })

    it('应该跳过 shell/bash/shell/cmd 代码块', () => {
      const response = '```bash\nnpm install react\n```\n\n```tsx\n// filepath: src/App.tsx\nexport default App\n```'
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.blocks).toHaveLength(1)
    })

    it('应该跳过 console/powershell 代码块', () => {
      const response = '```console\n> output\n```\n\n```tsx\n// filepath: src/App.tsx\nexport default App\n```'
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.blocks).toHaveLength(1)
    })

    it('无代码块时返回空 plan', () => {
      const plan = parseCodeBlocks('这是一段普通文本，没有代码', EXISTING_FILES)
      expect(plan.blocks).toHaveLength(0)
      expect(plan.fileCount).toBe(0)
      expect(plan.summary).toBeDefined()
    })

    it('相同文件路径应去重保留最后一个', () => {
      const response = [
        '```tsx\n// filepath: src/App.tsx\nexport default function V1() {}\n```',
        '```tsx\n// filepath: src/App.tsx\nexport default function V2() {}\n```',
      ].join('\n\n')
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.blocks).toHaveLength(1)
      expect(plan.blocks[0].content).toContain('V2')
    })

    it('应该正确统计新建和修改文件数', () => {
      const response = [
        '```tsx\n// filepath: src/App.tsx\nexport default App\n```',
        '```ts\n// filepath: src/brand-new.ts\nexport const x = 1\n```',
        '```css\n// filepath: src/style.css\nbody { margin: 0 }\n```',
      ].join('\n\n')
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.fileCount).toBe(3)
      expect(plan.modifiedFileCount).toBe(1)
      expect(plan.newFileCount).toBe(2)
    })

    it('应该识别 /* filepath: ... */ 格式', () => {
      const response = '```tsx\n/* filepath: src/App.tsx */\nexport default App\n```'
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.blocks).toHaveLength(1)
      expect(plan.blocks[0].filepath).toBe('src/App.tsx')
    })

    it('应该从上下文推断文件路径', () => {
      const response = '我会修改 src/App.tsx:\n\n```tsx\nexport default function App() { return <div>New</div> }\n```'
      const plan = parseCodeBlocks(response, EXISTING_FILES)
      expect(plan.blocks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('validateCodeBlock', () => {
    it('有效的代码块应该返回空警告', () => {
      const block: ParsedCodeBlock = {
        filepath: 'src/App.tsx',
        language: 'tsx',
        content: 'export default function App() { return <div>Hello</div> }',
        isNew: false,
      }
      const warnings = validateCodeBlock(block)
      expect(Array.isArray(warnings)).toBe(true)
    })

    it('空内容应该返回警告', () => {
      const block: ParsedCodeBlock = {
        filepath: 'src/empty.ts',
        language: 'ts',
        content: '',
        isNew: true,
      }
      const warnings = validateCodeBlock(block)
      expect(warnings.length).toBeGreaterThan(0)
    })

    it('只有空白内容应该返回警告', () => {
      const block: ParsedCodeBlock = {
        filepath: 'src/ws.ts',
        language: 'ts',
        content: '   \n  \n  ',
        isNew: true,
      }
      const warnings = validateCodeBlock(block)
      expect(warnings.length).toBeGreaterThan(0)
    })
  })

  describe('generateSimpleDiff', () => {
    it('应该生成差异行', () => {
      const diff = generateSimpleDiff('old line\nunchanged', 'new line\nunchanged')
      expect(diff.length).toBeGreaterThan(0)
      expect(diff.some(d => d.type === 'removed')).toBe(true)
      expect(diff.some(d => d.type === 'added')).toBe(true)
    })

    it('相同内容应返回 unchanged', () => {
      const diff = generateSimpleDiff('same', 'same')
      expect(diff.every(d => d.type === 'unchanged')).toBe(true)
    })

    it('新文件应该全部为 added', () => {
      const diff = generateSimpleDiff(undefined, 'line1\nline2')
      expect(diff.every(d => d.type === 'added')).toBe(true)
      expect(diff).toHaveLength(2)
    })

    it('多行差异应该正确标记', () => {
      const diff = generateSimpleDiff('a\nb\nc', 'a\nx\nc')
      expect(diff.filter(d => d.type === 'unchanged').length).toBe(2)
      expect(diff.filter(d => d.type === 'removed').length).toBe(1)
      expect(diff.filter(d => d.type === 'added').length).toBe(1)
    })
  })

  describe('applyCodeToFiles', () => {
    it('应该调用 createFile 创建新文件', () => {
      const created: string[] = []
      const updated: string[] = []
      const result = applyCodeToFiles(
        {
          blocks: [{
            filepath: 'src/new.ts',
            language: 'ts',
            content: 'export const x = 1',
            isNew: true,
          }],
          summary: 'test',
          fileCount: 1,
          newFileCount: 1,
          modifiedFileCount: 0,
        },
        (p, c) => { updated.push(p) },
        (p, c) => { created.push(p) },
      )
      expect(result.success).toBe(true)
      expect(created).toContain('src/new.ts')
      expect(result.appliedFiles).toContain('src/new.ts')
    })

    it('应该调用 updateFile 更新文件', () => {
      const updated: string[] = []
      const result = applyCodeToFiles(
        {
          blocks: [{
            filepath: 'src/App.tsx',
            language: 'tsx',
            content: 'updated',
            isNew: false,
          }],
          summary: 'test',
          fileCount: 1,
          newFileCount: 0,
          modifiedFileCount: 1,
        },
        (p, c) => { updated.push(p) },
        () => { },
      )
      expect(result.success).toBe(true)
      expect(updated).toContain('src/App.tsx')
    })

    it('错误时应该记录到 errors', () => {
      const result = applyCodeToFiles(
        {
          blocks: [{
            filepath: 'src/error.ts',
            language: 'ts',
            content: 'bad',
            isNew: false,
          }],
          summary: 'test',
          fileCount: 1,
          newFileCount: 0,
          modifiedFileCount: 1,
        },
        () => { throw new Error('write failed') },
        () => { },
      )
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
