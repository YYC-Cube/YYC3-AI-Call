import { describe, it, expect } from 'vitest'
import type { ExportData } from '../services/DataExporter'
import type { FileVersion, VersionDiff } from '../services/VersioningService'
import type { SyncStatus, SyncConflict } from '../services/CloudSyncService'

describe('Services 类型验证', () => {
  describe('DataExporter ExportData', () => {
    it('应该有正确的结构', () => {
      const data: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        metadata: {
          userAgent: 'test',
          screenResolution: '1920x1080',
          language: 'zh-CN',
        },
        localStorage: { key1: 'value1' },
        indexedDB: { files: [], projects: [], snapshots: [] },
      }
      expect(data.version).toBe('1.0')
      expect(data.localStorage.key1).toBe('value1')
    })
  })

  describe('VersioningService types', () => {
    it('FileVersion 应该有正确的结构', () => {
      const v: FileVersion = {
        id: 'v1', path: 'a.ts', content: 'code', version: 1,
        createdAt: Date.now(), message: 'init',
      }
      expect(v.version).toBe(1)
    })

    it('VersionDiff 应该有正确的结构', () => {
      const d: VersionDiff = {
        path: 'a.ts', oldVersion: 1, newVersion: 2,
        changes: [{ line: 1, type: 'modified', content: 'new' }],
      }
      expect(d.changes).toHaveLength(1)
    })
  })

  describe('CloudSyncService types', () => {
    it('SyncStatus 应该有正确的结构', () => {
      const s: SyncStatus = {
        lastSyncTime: null, pendingChanges: 0, syncing: false, error: null,
      }
      expect(s.syncing).toBe(false)
    })

    it('SyncConflict 应该有正确的结构', () => {
      const c: SyncConflict = {
        path: 'a.ts', localContent: 'a', remoteContent: 'b',
        localModified: Date.now(), remoteModified: Date.now(), resolution: null,
      }
      expect(c.resolution).toBeNull()
    })
  })
})
