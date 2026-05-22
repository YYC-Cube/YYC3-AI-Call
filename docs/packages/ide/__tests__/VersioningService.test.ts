import { describe, it, expect } from 'vitest'
import { VersioningService, type FileVersion, type VersionDiff, type VersioningOptions } from '../services/VersioningService'

describe('VersioningService', () => {
  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const a = VersioningService.getInstance()
      const b = VersioningService.getInstance()
      expect(a).toBe(b)
    })
  })

  describe('类型验证', () => {
    it('FileVersion 应该有正确的结构', () => {
      const version: FileVersion = {
        id: 'ver-1',
        path: 'src/App.tsx',
        content: 'export default App',
        version: 1,
        createdAt: Date.now(),
        message: '初始版本',
        author: 'user',
        parentId: undefined,
      }
      expect(version.version).toBe(1)
      expect(version.path).toBe('src/App.tsx')
    })

    it('VersionDiff 应该有正确的结构', () => {
      const diff: VersionDiff = {
        path: 'src/App.tsx',
        oldVersion: 1,
        newVersion: 2,
        changes: [
          { line: 5, type: 'modified', content: 'new line' },
          { line: 10, type: 'added', content: 'added line' },
          { line: 15, type: 'removed', content: 'removed line' },
        ],
      }
      expect(diff.changes).toHaveLength(3)
      expect(diff.changes[0].type).toBe('modified')
    })

    it('VersioningOptions 应该有正确的结构', () => {
      const options: VersioningOptions = {
        maxVersionsPerFile: 50,
        autoVersion: true,
        autoVersionInterval: 60000,
      }
      expect(options.maxVersionsPerFile).toBe(50)
    })
  })
})
