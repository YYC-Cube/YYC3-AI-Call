import { describe, expect, it } from 'vitest'
import { DatabaseTools, FileSystemTools, GitTools, MCPToolManager, MemoryTools } from '../services/MCPTools'

function mockClient(tools: Record<string, any> = {}): any {
  return {
    callTool: async (name: string, args: any) => {
      if (tools[name]) {
        return { success: true, data: tools[name](args) }
      }
      return { success: false, error: `Tool ${name} not found` }
    },
  }
}

describe('MCPTools', () => {
  describe('FileSystemTools', () => {
    it('readFile 成功', async () => {
      const fs = new FileSystemTools(mockClient({ read_file: () => ({ content: 'hello' }) }))
      expect(await fs.readFile('/test.ts')).toBe('hello')
    })

    it('readFile 失败', async () => {
      const fs = new FileSystemTools(mockClient())
      await expect(fs.readFile('/test.ts')).rejects.toThrow()
    })

    it('writeFile 成功', async () => {
      const fs = new FileSystemTools(mockClient({ write_file: () => ({}) }))
      await expect(fs.writeFile('/test.ts', 'content')).resolves.toBeUndefined()
    })

    it('writeFile 失败', async () => {
      const fs = new FileSystemTools(mockClient())
      await expect(fs.writeFile('/test.ts', 'content')).rejects.toThrow()
    })

    it('listDirectory 成功', async () => {
      const fs = new FileSystemTools(mockClient({ list_directory: () => ({ files: ['a.ts'] }) }))
      expect(await fs.listDirectory('/src')).toEqual(['a.ts'])
    })

    it('listDirectory 失败', async () => {
      const fs = new FileSystemTools(mockClient())
      await expect(fs.listDirectory('/src')).rejects.toThrow()
    })

    it('createDirectory 成功', async () => {
      const fs = new FileSystemTools(mockClient({ create_directory: () => ({}) }))
      await expect(fs.createDirectory('/new')).resolves.toBeUndefined()
    })

    it('createDirectory 失败', async () => {
      const fs = new FileSystemTools(mockClient())
      await expect(fs.createDirectory('/new')).rejects.toThrow()
    })

    it('deleteFile 成功', async () => {
      const fs = new FileSystemTools(mockClient({ delete_file: () => ({}) }))
      await expect(fs.deleteFile('/old')).resolves.toBeUndefined()
    })

    it('deleteFile 失败', async () => {
      const fs = new FileSystemTools(mockClient())
      await expect(fs.deleteFile('/old')).rejects.toThrow()
    })

    it('renameFile 成功', async () => {
      const fs = new FileSystemTools(mockClient({ rename_file: () => ({}) }))
      await expect(fs.renameFile('/old', '/new')).resolves.toBeUndefined()
    })

    it('renameFile 失败', async () => {
      const fs = new FileSystemTools(mockClient())
      await expect(fs.renameFile('/old', '/new')).rejects.toThrow()
    })

    it('searchFiles 成功', async () => {
      const fs = new FileSystemTools(mockClient({ search_files: () => ({ files: ['a.ts'] }) }))
      expect(await fs.searchFiles('/src', 'pattern')).toEqual(['a.ts'])
    })

    it('searchFiles 失败', async () => {
      const fs = new FileSystemTools(mockClient())
      await expect(fs.searchFiles('/src', 'pattern')).rejects.toThrow()
    })
  })

  describe('GitTools', () => {
    it('status 成功', async () => {
      const git = new GitTools(mockClient({ git_status: () => ({ staged: ['a.ts'], unstaged: [], untracked: [] }) }))
      const s = await git.status()
      expect(s.staged).toContain('a.ts')
    })

    it('status 失败', async () => {
      await expect(new GitTools(mockClient()).status()).rejects.toThrow()
    })

    it('diff 成功', async () => {
      const git = new GitTools(mockClient({ git_diff: () => ({ diff: 'changed' }) }))
      expect(await git.diff('a.ts')).toBe('changed')
    })

    it('diff 无文件参数', async () => {
      const git = new GitTools(mockClient({ git_diff: () => ({ diff: 'all' }) }))
      expect(await git.diff()).toBe('all')
    })

    it('diff 失败', async () => {
      await expect(new GitTools(mockClient()).diff()).rejects.toThrow()
    })

    it('commit 成功', async () => {
      const git = new GitTools(mockClient({ git_commit: () => ({ hash: 'abc' }) }))
      expect(await git.commit('msg')).toBe('abc')
    })

    it('commit 失败', async () => {
      await expect(new GitTools(mockClient()).commit('msg')).rejects.toThrow()
    })

    it('push 成功', async () => {
      const git = new GitTools(mockClient({ git_push: () => ({}) }))
      await expect(git.push()).resolves.toBeUndefined()
    })

    it('push 失败', async () => {
      await expect(new GitTools(mockClient()).push()).rejects.toThrow()
    })

    it('pull 成功', async () => {
      const git = new GitTools(mockClient({ git_pull: () => ({}) }))
      await expect(git.pull()).resolves.toBeUndefined()
    })

    it('pull 失败', async () => {
      await expect(new GitTools(mockClient()).pull()).rejects.toThrow()
    })

    it('log 成功', async () => {
      const git = new GitTools(mockClient({ git_log: () => ({ commits: [{ hash: 'a', message: 'm', author: 'u', date: 'd' }] }) }))
      const log = await git.log()
      expect(log).toHaveLength(1)
    })

    it('log 失败', async () => {
      await expect(new GitTools(mockClient()).log()).rejects.toThrow()
    })

    it('branch 成功', async () => {
      const git = new GitTools(mockClient({ git_branch: () => ({ current: 'main', branches: ['main', 'dev'] }) }))
      const b = await git.branch()
      expect(b.current).toBe('main')
      expect(b.branches).toHaveLength(2)
    })

    it('branch 失败', async () => {
      await expect(new GitTools(mockClient()).branch()).rejects.toThrow()
    })
  })

  describe('DatabaseTools', () => {
    it('query 成功', async () => {
      const db = new DatabaseTools(mockClient({ query: () => ({ rows: [{ id: 1 }] }) }))
      expect(await db.query('SELECT 1')).toEqual([{ id: 1 }])
    })

    it('query 失败', async () => {
      await expect(new DatabaseTools(mockClient()).query('SELECT 1')).rejects.toThrow()
    })

    it('listTables 成功', async () => {
      const db = new DatabaseTools(mockClient({ list_tables: () => ({ tables: ['users', 'posts'] }) }))
      expect(await db.listTables()).toEqual(['users', 'posts'])
    })

    it('listTables 失败', async () => {
      await expect(new DatabaseTools(mockClient()).listTables()).rejects.toThrow()
    })

    it('insert 成功', async () => {
      const db = new DatabaseTools(mockClient({ insert: () => ({}) }))
      await expect(db.insert('users', { name: 'test' })).resolves.toBeUndefined()
    })

    it('insert 失败', async () => {
      await expect(new DatabaseTools(mockClient()).insert('users', {})).rejects.toThrow()
    })

    it('update 成功', async () => {
      const db = new DatabaseTools(mockClient({ update: () => ({}) }))
      await expect(db.update('users', { name: 'new' }, 'id=1')).resolves.toBeUndefined()
    })

    it('update 失败', async () => {
      await expect(new DatabaseTools(mockClient()).update('users', {}, '')).rejects.toThrow()
    })

    it('delete 成功', async () => {
      const db = new DatabaseTools(mockClient({ delete: () => ({}) }))
      await expect(db.delete('users', 'id=1')).resolves.toBeUndefined()
    })

    it('delete 失败', async () => {
      await expect(new DatabaseTools(mockClient()).delete('users', '')).rejects.toThrow()
    })
  })

  describe('MemoryTools', () => {
    it('createMemory 成功', async () => {
      const mem = new MemoryTools(mockClient({ create_memory: () => ({ id: 'm1' }) }))
      expect(await mem.createMemory('test', ['tag'])).toBe('m1')
    })

    it('createMemory 失败', async () => {
      await expect(new MemoryTools(mockClient()).createMemory('test')).rejects.toThrow()
    })

    it('searchMemories 成功', async () => {
      const mem = new MemoryTools(mockClient({ search_memories: () => ({ memories: [{ id: 'm1', content: 'test', tags: [], createdAt: 1 }] }) }))
      const r = await mem.searchMemories('test')
      expect(r).toHaveLength(1)
    })

    it('searchMemories 失败', async () => {
      await expect(new MemoryTools(mockClient()).searchMemories('test')).rejects.toThrow()
    })

    it('deleteMemory 成功', async () => {
      const mem = new MemoryTools(mockClient({ delete_memory: () => ({}) }))
      await expect(mem.deleteMemory('m1')).resolves.toBeUndefined()
    })

    it('deleteMemory 失败', async () => {
      await expect(new MemoryTools(mockClient()).deleteMemory('m1')).rejects.toThrow()
    })

    it('updateMemory 成功', async () => {
      const mem = new MemoryTools(mockClient({ update_memory: () => ({}) }))
      await expect(mem.updateMemory('m1', 'new content')).resolves.toBeUndefined()
    })

    it('updateMemory 失败', async () => {
      await expect(new MemoryTools(mockClient()).updateMemory('m1', 'x')).rejects.toThrow()
    })
  })

  describe('MCPToolManager', () => {
    it('创建所有工具实例', () => {
      const mgr = new MCPToolManager(mockClient())
      expect(mgr.fs).toBeInstanceOf(FileSystemTools)
      expect(mgr.git).toBeInstanceOf(GitTools)
      expect(mgr.db).toBeInstanceOf(DatabaseTools)
      expect(mgr.memory).toBeInstanceOf(MemoryTools)
    })
  })
})
