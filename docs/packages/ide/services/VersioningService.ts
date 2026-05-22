/**
 * @file VersioningService.ts
 * @description 版本管理服务 - 支持文件版本历史、版本对比、版本恢复
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags versioning,history,restore,git
 */

import { createLogger } from "../utils/logger";
import { getDB } from "./adapters/IndexedDBAdapter";
const log = createLogger("Versioning");

export interface FileVersion {
  id: string;
  path: string;
  content: string;
  version: number;
  createdAt: number;
  message?: string;
  author?: string;
  parentId?: string;
}

export interface VersionDiff {
  path: string;
  oldVersion: number;
  newVersion: number;
  changes: Array<{
    line: number;
    type: "added" | "removed" | "modified";
    content: string;
  }>;
}

export interface VersioningOptions {
  maxVersionsPerFile?: number; // 每个文件最大版本数
  autoVersion?: boolean; // 自动创建版本
  autoVersionInterval?: number; // 自动版本间隔 (ms)
}

/**
 * 版本管理服务
 */
export class VersioningService {
  private static instance: VersioningService | null = null;
  private readonly DB_STORE = "file_versions";
  private readonly MAX_VERSIONS = 50; // 默认最大版本数
  private autoVersionTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() { }

  static getInstance(): VersioningService {
    if (!VersioningService.instance) {
      VersioningService.instance = new VersioningService();
    }
    return VersioningService.instance;
  }

  /**
   * 初始化版本管理
   */
  init(options: VersioningOptions = {}): void {
    log.info("Initialized with options:", options);
  }

  /**
   * 创建新版本
   */
  async createVersion(
    path: string,
    content: string,
    message?: string,
    author?: string
  ): Promise<FileVersion> {
    const db = await getDB();

    // 确保版本存储存在
    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      log.warn("Version store not found, skipping");
      throw new Error("Version store not initialized");
    }

    // 获取当前最新版本
    const versions = await db.getAllFromIndex(this.DB_STORE, "path", path);
    const latestVersion = versions.length > 0
      ? Math.max(...versions.map((v: FileVersion) => v.version))
      : 0;

    // 创建新版本
    const version: FileVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      path,
      content,
      version: latestVersion + 1,
      createdAt: Date.now(),
      message,
      author,
      parentId: versions.length > 0 ? versions[versions.length - 1].id : undefined,
    };

    // 保存版本
    await db.add(this.DB_STORE, version);

    // 清理旧版本
    await this.cleanupOldVersions(path);

    log.info(`Created version ${version.version} for ${path}`);
    return version;
  }

  /**
   * 获取文件版本历史
   */
  async getVersionHistory(path: string): Promise<FileVersion[]> {
    const db = await getDB();

    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return [];
    }

    const versions = await db.getAllFromIndex(this.DB_STORE, "path", path);
    return versions.sort((a: FileVersion, b: FileVersion) => b.version - a.version);
  }

  /**
   * 获取特定版本
   */
  async getVersion(versionId: string): Promise<FileVersion | null> {
    const db = await getDB();

    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return null;
    }

    return await db.get(this.DB_STORE, versionId);
  }

  /**
   * 恢复到特定版本
   */
  async restoreVersion(versionId: string): Promise<boolean> {
    const version = await this.getVersion(versionId);

    if (!version) {
      return false;
    }

    // 恢复文件内容
    const db = await getDB();
    await db.put("files", {
      path: version.path,
      content: version.content,
      updatedAt: Date.now(),
      size: version.content.length,
      projectId: "restored",
    });

    // 创建恢复版本
    await this.createVersion(
      version.path,
      version.content,
      `Restored from version ${version.version}`,
      "System"
    );

    log.info(`Restored ${version.path} to version ${version.version}`);
    return true;
  }

  /**
   * 比较两个版本
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionDiff | null> {
    const version1 = await this.getVersion(versionId1);
    const version2 = await this.getVersion(versionId2);

    if (!version1 || !version2) {
      return null;
    }

    if (version1.path !== version2.path) {
      throw new Error("Cannot compare versions of different files");
    }

    // 简单的行级 diff
    const lines1 = version1.content.split("\n");
    const lines2 = version2.content.split("\n");

    const changes: VersionDiff["changes"] = [];
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || "";
      const line2 = lines2[i] || "";

      if (line1 !== line2) {
        if (line1 && !line2) {
          changes.push({ line: i + 1, type: "removed", content: line1 });
        } else if (!line1 && line2) {
          changes.push({ line: i + 1, type: "added", content: line2 });
        } else {
          changes.push({ line: i + 1, type: "modified", content: `${line1} → ${line2}` });
        }
      }
    }

    return {
      path: version1.path,
      oldVersion: version1.version,
      newVersion: version2.version,
      changes,
    };
  }

  /**
   * 启用自动版本
   */
  enableAutoVersion(path: string, intervalMs: number = 60000): void {
    // 清除现有定时器
    this.disableAutoVersion(path);

    // 创建初始版本
    this.createVersion(path, "", "Initial version", "System");

    // 设置定时器
    const timer = setInterval(async () => {
      const db = await getDB();
      const file = await db.get("files", path);

      if (file) {
        await this.createVersion(path, file.content, "Auto version", "System");
      }
    }, intervalMs);

    this.autoVersionTimers.set(path, timer);
    log.info(`Auto version enabled for ${path}`);
  }

  /**
   * 禁用自动版本
   */
  disableAutoVersion(path: string): void {
    const timer = this.autoVersionTimers.get(path);
    if (timer) {
      clearInterval(timer);
      this.autoVersionTimers.delete(path);
      log.info(`Auto version disabled for ${path}`);
    }
  }

  /**
   * 清理旧版本
   */
  private async cleanupOldVersions(path: string): Promise<void> {
    const db = await getDB();
    const versions = await db.getAllFromIndex(this.DB_STORE, "path", path);

    if (versions.length > this.MAX_VERSIONS) {
      // 删除最旧的版本
      versions.sort((a: FileVersion, b: FileVersion) => a.version - b.version);
      const toDelete = versions.slice(0, versions.length - this.MAX_VERSIONS);

      for (const version of toDelete) {
        await db.delete(this.DB_STORE, version.id);
      }

      log.info(`Cleaned up ${toDelete.length} old versions for ${path}`);
    }
  }

  /**
   * 获取版本统计
   */
  async getVersionStats(): Promise<{
    totalVersions: number;
    totalFiles: number;
    avgVersionsPerFile: number;
  }> {
    const db = await getDB();

    if (!db.objectStoreNames.contains(this.DB_STORE)) {
      return {
        totalVersions: 0,
        totalFiles: 0,
        avgVersionsPerFile: 0,
      };
    }

    const allVersions = await db.getAll(this.DB_STORE);
    const uniquePaths = new Set(allVersions.map((v: FileVersion) => v.path));

    return {
      totalVersions: allVersions.length,
      totalFiles: uniquePaths.size,
      avgVersionsPerFile: allVersions.length / uniquePaths.size || 0,
    };
  }

  /**
   * 导出版本历史
   */
  async exportVersionHistory(path: string): Promise<string> {
    const versions = await this.getVersionHistory(path);

    return JSON.stringify(
      versions.map((v) => ({
        version: v.version,
        createdAt: new Date(v.createdAt).toISOString(),
        message: v.message,
        author: v.author,
        contentLength: v.content.length,
      })),
      null,
      2
    );
  }
}

// 导出单例
export const versioning = VersioningService.getInstance();

// 导出工具函数
export const createVersion = versioning.createVersion.bind(versioning);
export const getVersionHistory = versioning.getVersionHistory.bind(versioning);
export const getVersion = versioning.getVersion.bind(versioning);
export const restoreVersion = versioning.restoreVersion.bind(versioning);
export const compareVersions = versioning.compareVersions.bind(versioning);
export const enableAutoVersion = versioning.enableAutoVersion.bind(versioning);
export const disableAutoVersion = versioning.disableAutoVersion.bind(versioning);
export const getVersionStats = versioning.getVersionStats.bind(versioning);

export default versioning;
