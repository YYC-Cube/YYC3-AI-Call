import { describe, it, expect } from 'vitest'
import { registerCommand, getCommand, getAllCommands, executeCommand, type CommandContext, type CommandOutput } from '../ai/CommandRegistry'

const makeCtx = (overrides?: Partial<CommandContext>): CommandContext => ({
  cwd: '/project',
  fileContents: {
    'src/App.tsx': 'export default function App() {}',
    'src/utils.ts': 'export function add(a, b) { return a + b }',
    'package.json': '{"name": "test"}',
  },
  createFile: () => {},
  deleteFile: () => {},
  renameFile: () => {},
  updateFile: () => {},
  openFile: () => {},
  env: { HOME: '/home/user' },
  gitBranch: 'main',
  gitChanges: [],
  ...overrides,
})

describe('CommandRegistry', () => {
  describe('registerCommand / getCommand', () => {
    it('应该注册自定义命令', () => {
      registerCommand({
        name: 'test-cmd',
        description: 'Test command',
        usage: 'test-cmd [args]',
        handler: () => [{ type: 'output', text: 'hello' }],
      })
      const cmd = getCommand('test-cmd')
      expect(cmd).toBeDefined()
      expect(cmd!.name).toBe('test-cmd')
    })
  })

  describe('getAllCommands', () => {
    it('应该返回所有已注册命令', () => {
      const cmds = getAllCommands()
      expect(cmds.length).toBeGreaterThan(0)
    })
  })

  describe('executeCommand', () => {
    it('未知命令应该返回错误', () => {
      const outputs = executeCommand('nonexistent-cmd-xyz', makeCtx())
      expect(outputs.length).toBeGreaterThan(0)
      expect(outputs.some(o => o.type === 'error')).toBe(true)
    })
  })

  describe('内置文件系统命令', () => {
    it('help 命令应该返回命令列表', () => {
      const outputs = executeCommand('help', makeCtx())
      expect(outputs.length).toBeGreaterThan(0)
      expect(outputs[0].type).toBe('info')
    })

    it('pwd 命令应该返回当前目录', () => {
      const outputs = executeCommand('pwd', makeCtx())
      expect(outputs[0].text).toContain('/project')
    })

    it('date 命令应该返回日期', () => {
      const outputs = executeCommand('date', makeCtx())
      expect(outputs.length).toBeGreaterThan(0)
    })

    it('whoami 命令应该返回用户', () => {
      const outputs = executeCommand('whoami', makeCtx())
      expect(outputs.length).toBeGreaterThan(0)
    })
  })
})
