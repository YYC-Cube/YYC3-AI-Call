import { describe, it, expect } from 'vitest'
import { CloudSyncService, type SyncStatus, type SyncConflict, type SyncOptions } from '../services/CloudSyncService'

describe('CloudSyncService', () => {
  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const a = CloudSyncService.getInstance()
      const b = CloudSyncService.getInstance()
      expect(a).toBe(b)
    })
  })

  describe('类型验证', () => {
    it('SyncStatus 应该有正确的结构', () => {
      const status: SyncStatus = {
        lastSyncTime: null,
        pendingChanges: 0,
        syncing: false,
        error: null,
      }
      expect(status.syncing).toBe(false)
      expect(status.pendingChanges).toBe(0)
    })

    it('SyncConflict 应该有正确的结构', () => {
      const conflict: SyncConflict = {
        path: 'src/App.tsx',
        localContent: 'local',
        remoteContent: 'remote',
        localModified: Date.now(),
        remoteModified: Date.now(),
        resolution: null,
      }
      expect(conflict.resolution).toBeNull()
      expect(conflict.path).toBe('src/App.tsx')
    })

    it('SyncOptions 应该有正确的结构', () => {
      const options: SyncOptions = {
        apiKey: 'test-key',
        serverUrl: 'https://sync.example.com',
        autoSync: true,
        syncInterval: 30000,
      }
      expect(options.autoSync).toBe(true)
    })
  })
})
