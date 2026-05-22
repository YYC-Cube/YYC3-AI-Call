/**
 * @file DataExporter.ts
 * @description 数据导出服务 - 导出 localStorage 和 IndexedDB 数据为 JSON 文件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags storage,export,backup,utility
 */

import { createLogger } from "../utils/logger";
import { getDB } from "./adapters/IndexedDBAdapter";
const log = createLogger("DataExporter");

export interface ExportData {
  version: string;
  exportedAt: string;
  metadata: {
    userAgent: string;
    screenResolution: string;
    language: string;
  };
  localStorage: Record<string, string>;
  indexedDB: {
    files: any[];
    projects: any[];
    snapshots: any[];
  };
}

/**
 * 数据导出服务
 */
export class DataExporter {
  /**
   * 导出所有数据
   */
  static async exportAllData(): Promise<ExportData> {
    const exportData: ExportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
      },
      localStorage: {},
      indexedDB: {
        files: [],
        projects: [],
        snapshots: [],
      },
    };

    // 导出 localStorage
    exportData.localStorage = this.exportLocalStorage();

    // 导出 IndexedDB
    await this.exportIndexedDB(exportData.indexedDB);

    return exportData;
  }

  /**
   * 导出 localStorage
   */
  private static exportLocalStorage(): Record<string, string> {
    const data: Record<string, string> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("yyc3_")) {
        data[key] = localStorage.getItem(key) || "";
      }
    }

    log.info(`Exported ${Object.keys(data).length} localStorage items`);
    return data;
  }

  /**
   * 导出 IndexedDB
   */
  private static async exportIndexedDB(indexedDB: ExportData["indexedDB"]): Promise<void> {
    try {
      const db = await getDB();

      indexedDB.files = await db.getAll("files");
      indexedDB.projects = await db.getAll("projects");
      indexedDB.snapshots = await db.getAll("snapshots");

      log.info(`Exported ${indexedDB.files.length} files, ${indexedDB.projects.length} projects, ${indexedDB.snapshots.length} snapshots`);

    } catch (e) {
      log.error("Error exporting IndexedDB:", e);
      throw e;
    }
  }

  /**
   * 下载导出文件
   */
  static downloadExport(data: ExportData, filename?: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `yyc3-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    log.info("Download started");
  }

  /**
   * 导出并下载
   */
  static async exportAndDownload(): Promise<void> {
    const data = await this.exportAllData();
    this.downloadExport(data);
  }

  /**
   * 导出特定项目
   */
  static async exportProject(projectId: string): Promise<ExportData> {
    const exportData: ExportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
      },
      localStorage: {},
      indexedDB: {
        files: [],
        projects: [],
        snapshots: [],
      },
    };

    try {
      const db = await getDB();

      // 导出项目相关文件
      const files = await db.getAllFromIndex("files", "projectId", projectId);
      exportData.indexedDB.files = files;

      // 导出项目元数据
      const project = await db.get("projects", projectId);
      if (project) {
        exportData.indexedDB.projects = [project];
      }

      // 导出项目相关快照
      const snapshots = await db.getAllFromIndex("snapshots", "projectId", projectId);
      exportData.indexedDB.snapshots = snapshots;

    } catch (e) {
      log.error("Error exporting project:", e);
      throw e;
    }

    return exportData;
  }

  /**
   * 导出为文本
   */
  static async exportAsText(): Promise<string> {
    const data = await this.exportAllData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * 获取导出统计
   */
  static async getExportStats(): Promise<{
    localStorageCount: number;
    localStorageSize: number;
    filesCount: number;
    filesSize: number;
    projectsCount: number;
    snapshotsCount: number;
    totalSize: number;
  }> {
    const stats = {
      localStorageCount: 0,
      localStorageSize: 0,
      filesCount: 0,
      filesSize: 0,
      projectsCount: 0,
      snapshotsCount: 0,
      totalSize: 0,
    };

    // localStorage 统计
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("yyc3_")) {
        stats.localStorageCount++;
        const value = localStorage.getItem(key) || "";
        stats.localStorageSize += (key.length + value.length) * 2;
      }
    }

    // IndexedDB 统计
    try {
      const db = await getDB();

      const files = await db.getAll("files");
      stats.filesCount = files.length;
      stats.filesSize = files.reduce((sum, file: any) => {
        return sum + (file.content?.length || 0) * 2;
      }, 0);

      const projects = await db.getAll("projects");
      stats.projectsCount = projects.length;

      const snapshots = await db.getAll("snapshots");
      stats.snapshotsCount = snapshots.length;

    } catch (e) {
      log.error("Error getting export stats:", e);
    }

    stats.totalSize = stats.localStorageSize + stats.filesSize;

    return stats;
  }
}

export default DataExporter;
