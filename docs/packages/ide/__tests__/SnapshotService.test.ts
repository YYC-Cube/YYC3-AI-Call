import { describe, it, expect } from 'vitest'
import { SnapshotService, type Snapshot, type SnapshotDiff, type SnapshotOptions } from '../services/SnapshotService'

describe('SnapshotService', () => {
  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = SnapshotService.getInstance()
      const instance2 = SnapshotService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('类型验证', () => {
    it('Snapshot 应该有正确的结构', () => {
      const snapshot: Snapshot = {
        id: 'snapshot-123',
        projectId: 'project-1',
        label: 'v1.0',
        description: '初始版本',
        createdAt: Date.now(),
        files: { 'src/App.tsx': 'export default App' },
        fileCount: 1,
        totalSize: 20,
        tags: ['release'],
      }
      expect(snapshot.id).toMatch(/^snapshot/)
      expect(snapshot.fileCount).toBe(1)
    })

    it('SnapshotDiff 应该有正确的结构', () => {
      const diff: SnapshotDiff = {
        snapshotId1: 'snap-1',
        snapshotId2: 'snap-2',
        added: ['src/new.ts'],
        removed: ['src/old.ts'],
        modified: ['src/App.tsx'],
        unchanged: ['package.json'],
      }
      expect(diff.added).toHaveLength(1)
      expect(diff.removed).toHaveLength(1)
      expect(diff.modified).toHaveLength(1)
    })

    it('SnapshotOptions 应该有正确的结构', () => {
      const options: SnapshotOptions = {
        autoSnapshot: true,
        autoSnapshotInterval: 30000,
        maxSnapshotsPerProject: 50,
      }
      expect(options.autoSnapshot).toBe(true)
      expect(options.maxSnapshotsPerProject).toBe(50)
    })
  })

  describe('init', () => {
    it('应该接受空选项', () => {
      const service = SnapshotService.getInstance()
      expect(() => service.init()).not.toThrow()
    })

    it('应该接受自定义选项', () => {
      const service = SnapshotService.getInstance()
      expect(() => service.init({ autoSnapshot: true, maxSnapshotsPerProject: 10 })).not.toThrow()
    })
  })
})
