/**
 * @file CloudSyncService.ts
 * @description 云端同步服务 - 支持跨设备数据同步、冲突解决、离线队列
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags sync,cloud,offline,cross-device
 */

import { getDB } from "./adapters/IndexedDBAdapter";
import { createLogger } from "../utils/logger";
const log = createLogger("CloudSync");

export interface SyncStatus {
  lastSyncTime: number | null;
  pendingChanges: number;
  syncing: boolean;
  error: string | null;
}

export interface SyncConflict {
  path: string;
  localContent: string;
  remoteContent: string;
  localModified: number;
  remoteModified: number;
  resolution: "local" | "remote" | "merge" | null;
}

export interface SyncOptions {
  apiKey: string;
  serverUrl: string;
  autoSync?: boolean;
  syncInterval?: number;
  resolveConflict?: (conflict: SyncConflict) => Promise<"local" | "remote" | "merge">;
}

/**
 * 云端同步服务
 */
export class CloudSyncService {
  private static instance: CloudSyncService | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private options: SyncOptions | null = null;
  private pendingQueue: Array<{ path: string; content: string; timestamp: number }> = [];
  private conflicts: SyncConflict[] = [];
  
  private constructor() {}
  
  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }
  
  /**
   * 初始化同步服务
   */
  init(options: SyncOptions): void {
    this.options = options;
    
    if (options.autoSync) {
      this.startAutoSync(options.syncInterval || 300000); // 5 分钟
    }
    
    log.info("Initialized with autoSync:", options.autoSync);
  }
  
  /**
   * 开始自动同步
   */
  startAutoSync(intervalMs: number): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }
    
    this.syncInterval = setInterval(() => {
      this.syncToCloud();
    }, intervalMs);
    
    log.info("Auto sync started with interval:", intervalMs, "ms");
  }
  
  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      log.info("Auto sync stopped");
    }
  }
  
  /**
   * 同步到云端
   */
  async syncToCloud(): Promise<{ success: boolean; synced: number; conflicts: number }> {
    if (!this.options) {
      throw new Error("CloudSync not initialized");
    }
    
    const result = {
      success: false,
      synced: 0,
      conflicts: 0,
    };
    
    try {
      const db = await getDB();
      
      // 获取所有本地文件
      const localFiles = await db.getAll("files");
      
      // 获取云端文件列表
      const remoteFiles = await this.fetchRemoteFiles();
      
      // 检测冲突
      this.conflicts = [];
      for (const localFile of localFiles) {
        const remoteFile = remoteFiles.find((f: any) => f.path === localFile.path);
        
        if (remoteFile) {
          // 文件在云端存在，检查是否冲突
          if (remoteFile.modifiedAt > localFile.updatedAt) {
            // 云端版本更新
            if (localFile.content !== remoteFile.content) {
              // 内容不同，存在冲突
              this.conflicts.push({
                path: localFile.path,
                localContent: localFile.content,
                remoteContent: remoteFile.content,
                localModified: localFile.updatedAt,
                remoteModified: remoteFile.modifiedAt,
                resolution: null,
              });
              result.conflicts++;
            }
          }
        }
      }
      
      // 如果有冲突，等待解决
      if (result.conflicts > 0 && this.options.resolveConflict) {
        await this.resolveConflicts();
      }
      
      // 上传本地变更
      for (const localFile of localFiles) {
        const remoteFile = remoteFiles.find((f: any) => f.path === localFile.path);
        
        if (!remoteFile || localFile.updatedAt > remoteFile.modifiedAt) {
          // 本地文件更新或新文件，上传到云端
          await this.uploadFile(localFile.path, localFile.content);
          result.synced++;
        }
      }
      
      // 下载云端新文件
      for (const remoteFile of remoteFiles) {
        const localFile = localFiles.find((f: any) => f.path === remoteFile.path);
        
        if (!localFile) {
          // 云端新文件，下载到本地
          await db.put("files", {
            path: remoteFile.path,
            content: remoteFile.content,
            updatedAt: remoteFile.modifiedAt,
            size: remoteFile.content.length,
            projectId: "cloud",
          });
          result.synced++;
        }
      }
      
      // 更新最后同步时间
      await db.put("settings", {
        key: "lastSyncTime",
        value: Date.now(),
      });
      
      result.success = true;
      log.info("Sync completed:", result);
      
    } catch (error) {
      log.error("Sync failed:", error);
      result.success = false;
    }
    
    return result;
  }
  
  /**
   * 获取云端文件列表
   */
  private async fetchRemoteFiles(): Promise<any[]> {
    if (!this.options) return [];
    
    try {
      const response = await fetch(`${this.options.serverUrl}/api/files`, {
        headers: {
          "Authorization": `Bearer ${this.options.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch remote files");
      }
      
      return await response.json();
    } catch (error) {
      log.error("Fetch remote files failed:", error);
      return [];
    }
  }
  
  /**
   * 上传文件到云端
   */
  private async uploadFile(path: string, content: string): Promise<void> {
    if (!this.options) return;
    
    try {
      await fetch(`${this.options.serverUrl}/api/files`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          content,
          modifiedAt: Date.now(),
        }),
      });
    } catch (error) {
      log.error("Upload file failed:", error);
    }
  }
  
  /**
   * 解决冲突
   */
  private async resolveConflicts(): Promise<void> {
    if (!this.options?.resolveConflict) return;
    
    for (const conflict of this.conflicts) {
      const resolution = await this.options.resolveConflict(conflict);
      conflict.resolution = resolution;
      
      if (resolution === "remote") {
        // 使用云端版本
        const db = await getDB();
        await db.put("files", {
          path: conflict.path,
          content: conflict.remoteContent,
          updatedAt: conflict.remoteModified,
          size: conflict.remoteContent.length,
          projectId: "cloud",
        });
      }
      // "local" 保持本地版本
      // "merge" 需要合并逻辑
    }
    
    this.conflicts = [];
  }
  
  /**
   * 获取同步状态
   */
  async getStatus(): Promise<SyncStatus> {
    const db = await getDB();
    
    const lastSyncSetting = await db.get("settings", "lastSyncTime");
    const lastSyncTime = lastSyncSetting?.value || null;
    
    const files = await db.getAll("files");
    const pendingChanges = files.length;
    
    return {
      lastSyncTime,
      pendingChanges,
      syncing: this.syncInterval !== null,
      error: null,
    };
  }
  
  /**
   * 获取冲突列表
   */
  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }
  
  /**
   * 手动解决冲突
   */
  async resolveConflict(index: number, resolution: "local" | "remote" | "merge"): Promise<void> {
    if (index < 0 || index >= this.conflicts.length) {
      throw new Error("Invalid conflict index");
    }
    
    const conflict = this.conflicts[index];
    conflict.resolution = resolution;
    
    if (resolution === "remote") {
      const db = await getDB();
      await db.put("files", {
        path: conflict.path,
        content: conflict.remoteContent,
        updatedAt: conflict.remoteModified,
        size: conflict.remoteContent.length,
        projectId: "cloud",
      });
    }
    
    this.conflicts.splice(index, 1);
  }
}

// 导出单例
export const cloudSync = CloudSyncService.getInstance();

// 导出工具函数
export const initCloudSync = cloudSync.init.bind(cloudSync);
export const startAutoSync = cloudSync.startAutoSync.bind(cloudSync);
export const stopAutoSync = cloudSync.stopAutoSync.bind(cloudSync);
export const syncToCloud = cloudSync.syncToCloud.bind(cloudSync);
export const getSyncStatus = cloudSync.getStatus.bind(cloudSync);
export const getConflicts = cloudSync.getConflicts.bind(cloudSync);
export const resolveConflict = cloudSync.resolveConflict.bind(cloudSync);

export default cloudSync;
