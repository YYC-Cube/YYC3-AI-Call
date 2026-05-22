/**
 * @file SnapshotService.ts
 * @description 快照服务 - 支持项目快照、快照对比、快照恢复
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags snapshot,backup,restore,project
 */

import { getDB } from "./adapters/IndexedDBAdapter";
import { createLogger } from "../utils/logger";
const log = createLogger("Snapshot");

export interface Snapshot {
  id: string;
  projectId: string;
  label: string;
  description?: string;
  createdAt: number;
  files: Record<string, string>; // path -> content
  fileCount: number;
  totalSize: number;
  tags?: string[];
}

export interface SnapshotDiff {
  snapshotId1: string;
  snapshotId2: string;
  added: string[]; // 新增文件
  removed: string[]; // 删除文件
  modified: string[]; // 修改文件
  unchanged: string[]; // 未变文件
}

export interface SnapshotOptions {
  autoSnapshot?: boolean;
  autoSnapshotInterval?: number;
  maxSnapshotsPerProject?: number;
}

/**
 * 快照服务
 */
export class SnapshotService {
  private static instance: SnapshotService | null = null;
  private readonly DB_STORE = "snapshots";
  private readonly MAX_SNAPSHOTS = 20; // 默认最大快照数
  private autoSnapshotTimers: Map<string, NodeJS.Timeout> = new Map();
  
  private constructor() {}
  
  static getInstance(): SnapshotService {
    if (!SnapshotService.instance) {
      SnapshotService.instance = new SnapshotService();
    }
    return SnapshotService.instance;
  }
  
  /**
   * 初始化快照服务
   */
  init(options: SnapshotOptions = {}): void {
    log.info("Initialized with options:", options);
  }
  
  /**
   * 创建项目快照
   */
  async createSnapshot(
    projectId: string,
    label: string,
    description?: string,
    tags?: string[]
  ): Promise<Snapshot> {
    const db = await getDB();
    
    // 获取项目所有文件
    const files = await db.getAllFromIndex("files", "projectId", projectId);
    
    // 构建文件内容映射
    const fileContents: Record<string, string> = {};
    let totalSize = 0;
    
    for (const file of files) {
      fileContents[file.path] = file.content;
      totalSize += file.content.length;
    }
    
    // 创建快照
    const snapshot: Snapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      label,
      description,
      createdAt: Date.now(),
      files: fileContents,
      fileCount: files.length,
      totalSize,
      tags,
    };
    
    // 保存快照
    await db.put(this.DB_STORE, snapshot);
    
    // 清理旧快照
    await this.cleanupOldSnapshots(projectId);
    
    log.info(`Created snapshot "${label}" for project ${projectId}`);
    return snapshot;
  }
  
  /**
   * 获取项目快照列表
   */
  async getSnapshots(projectId: string): Promise<Snapshot[]> {
    const db = await getDB();
    
    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return [];
    }
    
    const snapshots = await db.getAllFromIndex(this.DB_STORE, "projectId", projectId);
    return snapshots.sort((a: Snapshot, b: Snapshot) => b.createdAt - a.createdAt);
  }
  
  /**
   * 获取特定快照
   */
  async getSnapshot(snapshotId: string): Promise<Snapshot | null> {
    const db = await getDB();
    
    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return null;
    }
    
    return await db.get(this.DB_STORE, snapshotId);
  }
  
  /**
   * 恢复快照
   */
  async restoreSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(snapshotId);
    
    if (!snapshot) {
      return false;
    }
    
    const db = await getDB();
    
    // 恢复所有文件
    for (const [path, content] of Object.entries(snapshot.files)) {
      await db.put("files", {
        path: `${snapshot.projectId}/${path}`,
        content,
        updatedAt: Date.now(),
        size: content.length,
        projectId: snapshot.projectId,
      });
    }
    
    // 创建恢复快照
    await this.createSnapshot(
      snapshot.projectId,
      `Restored from ${snapshot.label}`,
      `Restored from snapshot created at ${new Date(snapshot.createdAt).toISOString()}`
    );
    
    log.info(`Restored snapshot "${snapshot.label}"`);
    return true;
  }
  
  /**
   * 删除快照
   */
  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    const db = await getDB();
    
    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return false;
    }
    
    await db.delete(this.DB_STORE, snapshotId);
    log.info(`Deleted snapshot ${snapshotId}`);
    return true;
  }
  
  /**
   * 比较两个快照
   */
  async compareSnapshots(snapshotId1: string, snapshotId2: string): Promise<SnapshotDiff | null> {
    const snapshot1 = await this.getSnapshot(snapshotId1);
    const snapshot2 = await this.getSnapshot(snapshotId2);
    
    if (!snapshot1 || !snapshot2) {
      return null;
    }
    
    if (snapshot1.projectId !== snapshot2.projectId) {
      throw new Error("Cannot compare snapshots of different projects");
    }
    
    const files1 = Object.keys(snapshot1.files);
    const files2 = Object.keys(snapshot2.files);
    
    const added = files2.filter((f) => !files1.includes(f));
    const removed = files1.filter((f) => !files2.includes(f));
    const common = files1.filter((f) => files2.includes(f));
    
    const modified: string[] = [];
    const unchanged: string[] = [];
    
    for (const file of common) {
      if (snapshot1.files[file] !== snapshot2.files[file]) {
        modified.push(file);
      } else {
        unchanged.push(file);
      }
    }
    
    return {
      snapshotId1,
      snapshotId2,
      added,
      removed,
      modified,
      unchanged,
    };
  }
  
  /**
   * 导出快照
   */
  async exportSnapshot(snapshotId: string): Promise<string> {
    const snapshot = await this.getSnapshot(snapshotId);
    
    if (!snapshot) {
      throw new Error("Snapshot not found");
    }
    
    return JSON.stringify(
      {
        ...snapshot,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
  
  /**
   * 导入快照
   */
  async importSnapshot(jsonData: string): Promise<Snapshot> {
    try {
      const snapshot = JSON.parse(jsonData) as Snapshot;
      
      // 验证快照格式
      if (!snapshot.id || !snapshot.projectId || !snapshot.files) {
        throw new Error("Invalid snapshot format");
      }
      
      const db = await getDB();
      await db.put(this.DB_STORE, snapshot);
      
      log.info(`Imported snapshot "${snapshot.label}"`);
      return snapshot;
    } catch (error) {
      log.error("Import failed:", error);
      throw error;
    }
  }
  
  /**
   * 启用自动快照
   */
  enableAutoSnapshot(projectId: string, intervalMs: number = 3600000): void {
    // 每小时创建一次快照
    this.disableAutoSnapshot(projectId);
    
    // 创建初始快照
    this.createSnapshot(projectId, "Initial snapshot", "Auto snapshot");
    
    const timer = setInterval(async () => {
      await this.createSnapshot(
        projectId,
        "Auto snapshot",
        `Auto snapshot created at ${new Date().toISOString()}`
      );
    }, intervalMs);
    
    this.autoSnapshotTimers.set(projectId, timer);
    log.info(`Auto snapshot enabled for project ${projectId}`);
  }
  
  /**
   * 禁用自动快照
   */
  disableAutoSnapshot(projectId: string): void {
    const timer = this.autoSnapshotTimers.get(projectId);
    if (timer) {
      clearInterval(timer);
      this.autoSnapshotTimers.delete(projectId);
      log.info(`Auto snapshot disabled for project ${projectId}`);
    }
  }
  
  /**
   * 清理旧快照
   */
  private async cleanupOldSnapshots(projectId: string): Promise<void> {
    const snapshots = await this.getSnapshots(projectId);
    
    if (snapshots.length > this.MAX_SNAPSHOTS) {
      const toDelete = snapshots.slice(this.MAX_SNAPSHOTS);
      
      for (const snapshot of toDelete) {
        await this.deleteSnapshot(snapshot.id);
      }
      
      log.info(`Cleaned up ${toDelete.length} old snapshots for project ${projectId}`);
    }
  }
  
  /**
   * 获取快照统计
   */
  async getSnapshotStats(): Promise<{
    totalSnapshots: number;
    totalProjects: number;
    totalFiles: number;
    totalSize: number;
  }> {
    const db = await getDB();
    
    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return {
        totalSnapshots: 0,
        totalProjects: 0,
        totalFiles: 0,
        totalSize: 0,
      };
    }
    
    const allSnapshots = await db.getAll(this.DB_STORE);
    const uniqueProjects = new Set(allSnapshots.map((s: Snapshot) => s.projectId));
    
    const totalFiles = allSnapshots.reduce((sum: number, s: Snapshot) => sum + s.fileCount, 0);
    const totalSize = allSnapshots.reduce((sum: number, s: Snapshot) => sum + s.totalSize, 0);
    
    return {
      totalSnapshots: allSnapshots.length,
      totalProjects: uniqueProjects.size,
      totalFiles,
      totalSize,
    };
  }
  
  /**
   * 搜索快照
   */
  async searchSnapshots(query: string): Promise<Snapshot[]> {
    const db = await getDB();
    
    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return [];
    }
    
    const allSnapshots = await db.getAll(this.DB_STORE);
    
    return allSnapshots.filter((snapshot: Snapshot) => {
      const searchText = `${snapshot.label} ${snapshot.description || ""} ${snapshot.tags?.join(" ") || ""}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }
  
  /**
   * 更新快照标签
   */
  async updateSnapshotTags(snapshotId: string, tags: string[]): Promise<boolean> {
    const snapshot = await this.getSnapshot(snapshotId);
    
    if (!snapshot) {
      return false;
    }
    
    snapshot.tags = tags;
    
    const db = await getDB();
    await db.put(this.DB_STORE, snapshot);
    
    log.info(`Updated tags for snapshot ${snapshotId}`);
    return true;
  }
}

// 导出单例
export const snapshot = SnapshotService.getInstance();

// 导出工具函数
export const createSnapshot = snapshot.createSnapshot.bind(snapshot);
export const getSnapshots = snapshot.getSnapshots.bind(snapshot);
export const getSnapshot = snapshot.getSnapshot.bind(snapshot);
export const restoreSnapshot = snapshot.restoreSnapshot.bind(snapshot);
export const deleteSnapshot = snapshot.deleteSnapshot.bind(snapshot);
export const compareSnapshots = snapshot.compareSnapshots.bind(snapshot);
export const exportSnapshot = snapshot.exportSnapshot.bind(snapshot);
export const importSnapshot = snapshot.importSnapshot.bind(snapshot);
export const enableAutoSnapshot = snapshot.enableAutoSnapshot.bind(snapshot);
export const disableAutoSnapshot = snapshot.disableAutoSnapshot.bind(snapshot);
export const getSnapshotStats = snapshot.getSnapshotStats.bind(snapshot);
export const searchSnapshots = snapshot.searchSnapshots.bind(snapshot);

export default snapshot;
