/**
 * @file StorageCleanup.ts
 * @description 存储清理服务 - 自动清理旧数据、对话历史、临时文件等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags storage,cleanup,maintenance,utility
 */

import { getDB } from "./adapters/IndexedDBAdapter";
import { createLogger } from "../utils/logger";
const log = createLogger("StorageCleanup");

export interface CleanupResult {
  success: boolean;
  cleanedFiles: number;
  cleanedProjects: number;
  cleanedSnapshots: number;
  cleanedLocalStorage: number;
  freedSpace: number; // bytes
  errors: string[];
}

export interface CleanupOptions {
  // 文件清理
  cleanupFilesOlderThan?: number; // days
  keepMostRecentFiles?: number;
  
  // 对话历史清理
  cleanupChatHistory?: boolean;
  keepLastSessions?: number;
  
  // 快照清理
  cleanupSnapshots?: boolean;
  keepLastSnapshots?: number;
  
  // localStorage 清理
  cleanupUnusedKeys?: boolean;
  
  // 项目清理
  cleanupEmptyProjects?: boolean;
  
  //  dry run (不实际删除)
  dryRun?: boolean;
}

/**
 * 存储清理服务
 */
export class StorageCleanup {
  /**
   * 执行清理
   */
  static async cleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      cleanedFiles: 0,
      cleanedProjects: 0,
      cleanedSnapshots: 0,
      cleanedLocalStorage: 0,
      freedSpace: 0,
      errors: [],
    };
    
    const {
      cleanupFilesOlderThan,
      keepMostRecentFiles,
      cleanupChatHistory,
      keepLastSessions = 20,
      cleanupSnapshots,
      keepLastSnapshots = 10,
      cleanupUnusedKeys,
      cleanupEmptyProjects,
      dryRun = false,
    } = options;
    
    log.info("Starting cleanup with options:", options);
    
    // 清理旧文件
    if (cleanupFilesOlderThan || keepMostRecentFiles) {
      await this.cleanupFiles({
        olderThanDays: cleanupFilesOlderThan,
        keepMostRecent: keepMostRecentFiles,
        dryRun,
      }, result);
    }
    
    // 清理对话历史
    if (cleanupChatHistory) {
      await this.cleanupChatHistory(keepLastSessions, dryRun, result);
    }
    
    // 清理快照
    if (cleanupSnapshots) {
      await this.cleanupSnapshots(keepLastSnapshots, dryRun, result);
    }
    
    // 清理 localStorage
    if (cleanupUnusedKeys) {
      await this.cleanupLocalStorage(dryRun, result);
    }
    
    // 清理空项目
    if (cleanupEmptyProjects) {
      await this.cleanupEmptyProjects(dryRun, result);
    }
    
    log.info("Cleanup completed:", result);
    
    return result;
  }
  
  /**
   * 清理文件
   */
  private static async cleanupFiles(
    options: { olderThanDays?: number; keepMostRecent?: number; dryRun?: boolean },
    result: CleanupResult
  ): Promise<void> {
    try {
      const db = await getDB();
      const files = await db.getAll("files");
      
      let filesToDelete: string[] = [];
      
      // 按时间清理
      if (options.olderThanDays) {
        const cutoff = Date.now() - (options.olderThanDays * 24 * 60 * 60 * 1000);
        filesToDelete = files
          .filter((file: any) => file.updatedAt < cutoff)
          .map((file: any) => file.path);
      }
      
      // 保留最新的 N 个文件
      if (options.keepMostRecent && files.length > options.keepMostRecent) {
        const sortedFiles = files.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
        const filesToKeep = sortedFiles.slice(0, options.keepMostRecent);
        const filesToDeleteSet = new Set(filesToKeep.map((f: any) => f.path));
        
        const additionalFiles = files
          .filter((file: any) => !filesToDeleteSet.has(file.path))
          .map((file: any) => file.path);
        
        filesToDelete = [...new Set([...filesToDelete, ...additionalFiles])];
      }
      
      // 计算释放空间
      const spaceFreed = files
        .filter((file: any) => filesToDelete.includes(file.path))
        .reduce((sum, file: any) => sum + (file.content?.length || 0) * 2, 0);
      
      result.freedSpace += spaceFreed;
      
      // 删除文件
      if (!options.dryRun) {
        for (const path of filesToDelete) {
          await db.delete("files", path);
          result.cleanedFiles++;
        }
      } else {
        result.cleanedFiles = filesToDelete.length;
      }
      
      log.info(`Would clean ${filesToDelete.length} files, freeing ${(spaceFreed / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (e) {
      result.errors.push(`File cleanup error: ${(e as Error).message}`);
    }
  }
  
  /**
   * 清理对话历史
   */
  private static async cleanupChatHistory(
    keepSessions: number,
    dryRun: boolean,
    result: CleanupResult
  ): Promise<void> {
    try {
      const STORAGE_PREFIX = "yyc3_chat_";
      const sessionsKey = `${STORAGE_PREFIX}ide_sessions`;
      
      const sessionsRaw = localStorage.getItem(sessionsKey);
      if (!sessionsRaw) return;
      
      const sessions = JSON.parse(sessionsRaw);
      
      // 按更新时间排序
      sessions.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
      
      // 保留最新的 keepSessions 个
      const sessionsToKeep = sessions.slice(0, keepSessions);
      const sessionsToRemove = sessions.slice(keepSessions);
      
      // 计算释放空间
      let spaceFreed = 0;
      for (const session of sessionsToRemove) {
        const msgKey = `${STORAGE_PREFIX}ide_msg_${session.id}`;
        const msgValue = localStorage.getItem(msgKey);
        if (msgValue) {
          spaceFreed += (msgKey.length + msgValue.length) * 2;
        }
      }
      
      result.freedSpace += spaceFreed;
      
      // 删除旧会话
      if (!dryRun) {
        for (const session of sessionsToRemove) {
          const msgKey = `${STORAGE_PREFIX}ide_msg_${session.id}`;
          localStorage.removeItem(msgKey);
          result.cleanedLocalStorage++;
        }
        
        // 保存更新后的会话列表
        localStorage.setItem(sessionsKey, JSON.stringify(sessionsToKeep));
      } else {
        result.cleanedLocalStorage = sessionsToRemove.length;
      }
      
      log.info(`Would clean ${sessionsToRemove.length} chat sessions`);
      
    } catch (e) {
      result.errors.push(`Chat history cleanup error: ${(e as Error).message}`);
    }
  }
  
  /**
   * 清理快照
   */
  private static async cleanupSnapshots(
    keepLast: number,
    dryRun: boolean,
    result: CleanupResult
  ): Promise<void> {
    try {
      const db = await getDB();
      const snapshots = await db.getAll("snapshots");
      
      if (snapshots.length <= keepLast) return;
      
      // 按时间排序
      snapshots.sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      const snapshotsToDelete = snapshots.slice(keepLast);
      
      // 计算释放空间
      const spaceFreed = snapshotsToDelete.reduce((sum: number, snapshot: any) => {
        return sum + JSON.stringify(snapshot).length * 2;
      }, 0);
      
      result.freedSpace += spaceFreed;
      
      // 删除快照
      if (!dryRun) {
        for (const snapshot of snapshotsToDelete) {
          await db.delete("snapshots", snapshot.id);
          result.cleanedSnapshots++;
        }
      } else {
        result.cleanedSnapshots = snapshotsToDelete.length;
      }
      
      log.info(`Would clean ${snapshotsToDelete.length} snapshots`);
      
    } catch (e) {
      result.errors.push(`Snapshot cleanup error: ${(e as Error).message}`);
    }
  }
  
  /**
   * 清理 localStorage
   */
  private static async cleanupLocalStorage(
    dryRun: boolean,
    result: CleanupResult
  ): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      
      // 查找未使用的键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // 检查是否是 YYC3 相关的键
        if (!key.startsWith("yyc3_")) {
          continue;
        }
        
        // 检查是否是孤立的键 (没有对应的数据)
        // 这里可以根据实际情况添加更多逻辑
        if (key.includes("_msg_") || key.includes("_session_")) {
          // 检查对应的会话是否存在
          // 简化处理：暂时不删除
        }
      }
      
      result.cleanedLocalStorage = keysToRemove.length;
      
      if (!dryRun) {
        for (const key of keysToRemove) {
          localStorage.removeItem(key);
        }
      }
      
    } catch (e) {
      result.errors.push(`localStorage cleanup error: ${(e as Error).message}`);
    }
  }
  
  /**
   * 清理空项目
   */
  private static async cleanupEmptyProjects(
    dryRun: boolean,
    result: CleanupResult
  ): Promise<void> {
    try {
      const db = await getDB();
      const projects = await db.getAll("projects");
      const files = await db.getAll("files");
      
      // 找出没有文件的项目
      const projectIdsWithFiles = new Set(files.map((f: any) => f.projectId));
      const emptyProjects = projects.filter((p: any) => !projectIdsWithFiles.has(p.id));
      
      // 计算释放空间
      const spaceFreed = emptyProjects.reduce((sum: number, p: any) => {
        return sum + JSON.stringify(p).length * 2;
      }, 0);
      
      result.freedSpace += spaceFreed;
      
      // 删除空项目
      if (!dryRun) {
        for (const project of emptyProjects) {
          await db.delete("projects", project.id);
          result.cleanedProjects++;
        }
      } else {
        result.cleanedProjects = emptyProjects.length;
      }
      
      log.info(`Would clean ${emptyProjects.length} empty projects`);
      
    } catch (e) {
      result.errors.push(`Empty project cleanup error: ${(e as Error).message}`);
    }
  }
  
  /**
   * 获取清理建议
   */
  static async getCleanupSuggestions(): Promise<{
    oldFilesCount: number;
    oldFilesSize: number;
    oldSessionsCount: number;
    oldSessionsSize: number;
    oldSnapshotsCount: number;
    oldSnapshotsSize: number;
    totalFreedSpace: number;
  }> {
    const suggestions = {
      oldFilesCount: 0,
      oldFilesSize: 0,
      oldSessionsCount: 0,
      oldSessionsSize: 0,
      oldSnapshotsCount: 0,
      oldSnapshotsSize: 0,
      totalFreedSpace: 0,
    };
    
    try {
      const db = await getDB();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      // 检查 30 天前的文件
      const files = await db.getAll("files");
      const oldFiles = files.filter((f: any) => f.updatedAt < thirtyDaysAgo);
      suggestions.oldFilesCount = oldFiles.length;
      suggestions.oldFilesSize = oldFiles.reduce((sum: number, f: any) => {
        return sum + (f.content?.length || 0) * 2;
      }, 0);
      
      // 检查旧的对话会话
      const STORAGE_PREFIX = "yyc3_chat_";
      const sessionsRaw = localStorage.getItem(`${STORAGE_PREFIX}ide_sessions`);
      if (sessionsRaw) {
        const sessions = JSON.parse(sessionsRaw);
        const oldSessions = sessions.filter((s: any) => {
          const thirtyDaysAgoMs = Date.now() - (30 * 24 * 60 * 60 * 1000);
          return s.updatedAt < thirtyDaysAgoMs;
        });
        suggestions.oldSessionsCount = oldSessions.length;
      }
      
      // 检查旧的快照
      const snapshots = await db.getAll("snapshots");
      const oldSnapshots = snapshots.filter((s: any) => {
        return s.createdAt < thirtyDaysAgo;
      });
      suggestions.oldSnapshotsCount = oldSnapshots.length;
      suggestions.oldSnapshotsSize = oldSnapshots.reduce((sum: number, s: any) => {
        return sum + JSON.stringify(s).length * 2;
      }, 0);
      
      suggestions.totalFreedSpace = suggestions.oldFilesSize + suggestions.oldSessionsSize + suggestions.oldSnapshotsSize;
      
    } catch (e) {
      log.error("Error getting suggestions:", e);
    }
    
    return suggestions;
  }
}

export default StorageCleanup;
