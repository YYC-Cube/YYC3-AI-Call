/**
 * @file DataImporter.ts
 * @description 数据导入服务 - 从 JSON 文件导入数据到 localStorage 和 IndexedDB
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags storage,import,restore,utility
 */

import { createLogger } from "../utils/logger";
const log = createLogger("DataImporter");
import { getDB } from "./adapters/IndexedDBAdapter";
import type { ExportData } from "./DataExporter";

export interface ImportResult {
  success: boolean;
  localStorageCount: number;
  filesCount: number;
  projectsCount: number;
  snapshotsCount: number;
  errors: string[];
}

/**
 * 数据导入服务
 */
export class DataImporter {
  /**
   * 从文件导入数据
   */
  static async importFromFile(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const data = JSON.parse(text) as ExportData;
          
          const result = await this.importData(data);
          resolve(result);
        } catch (e) {
          reject(new Error(`Invalid import file: ${(e as Error).message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * 从文本导入数据
   */
  static async importFromText(jsonText: string): Promise<ImportResult> {
    try {
      const data = JSON.parse(jsonText) as ExportData;
      return await this.importData(data);
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`);
    }
  }
  
  /**
   * 导入数据
   */
  static async importData(data: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      localStorageCount: 0,
      filesCount: 0,
      projectsCount: 0,
      snapshotsCount: 0,
      errors: [],
    };
    
    // 验证数据格式
    if (!this.validateExportData(data)) {
      result.errors.push("Invalid export data format");
      result.success = false;
      return result;
    }
    
    // 导入 localStorage
    try {
      result.localStorageCount = this.importLocalStorage(data.localStorage);
    } catch (e) {
      result.errors.push(`localStorage import error: ${(e as Error).message}`);
    }
    
    // 导入 IndexedDB
    try {
      await this.importIndexedDB(data.indexedDB, result);
    } catch (e) {
      result.errors.push(`IndexedDB import error: ${(e as Error).message}`);
      result.success = false;
    }
    
    return result;
  }
  
  /**
   * 验证导出数据格式
   */
  private static validateExportData(data: any): data is ExportData {
    return (
      typeof data === "object" &&
      data !== null &&
      "version" in data &&
      "exportedAt" in data &&
      "localStorage" in data &&
      "indexedDB" in data
    );
  }
  
  /**
   * 导入 localStorage
   */
  private static importLocalStorage(data: Record<string, string>): number {
    let count = 0;
    
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("yyc3_")) {
        localStorage.setItem(key, value);
        count++;
      }
    }
    
    log.info(`Imported ${count} localStorage items`);
    return count;
  }
  
  /**
   * 导入 IndexedDB
   */
  private static async importIndexedDB(
    data: ExportData["indexedDB"],
    result: ImportResult
  ): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["files", "projects", "snapshots"], "readwrite");
    
    // 导入文件
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        try {
          await tx.objectStore("files").put(file);
          result.filesCount++;
        } catch (e) {
          result.errors.push(`Failed to import file ${file.path}: ${(e as Error).message}`);
        }
      }
    }
    
    // 导入项目
    if (data.projects && data.projects.length > 0) {
      for (const project of data.projects) {
        try {
          await tx.objectStore("projects").put(project);
          result.projectsCount++;
        } catch (e) {
          result.errors.push(`Failed to import project ${project.id}: ${(e as Error).message}`);
        }
      }
    }
    
    // 导入快照
    if (data.snapshots && data.snapshots.length > 0) {
      for (const snapshot of data.snapshots) {
        try {
          await tx.objectStore("snapshots").put(snapshot);
          result.snapshotsCount++;
        } catch (e) {
          result.errors.push(`Failed to import snapshot ${snapshot.id}: ${(e as Error).message}`);
        }
      }
    }
    
    await tx.done;
    
    log.info(`Imported ${result.filesCount} files, ${result.projectsCount} projects, ${result.snapshotsCount} snapshots`);
  }
  
  /**
   * 合并导入数据 (不清除现有数据)
   */
  static async mergeImport(data: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      localStorageCount: 0,
      filesCount: 0,
      projectsCount: 0,
      snapshotsCount: 0,
      errors: [],
    };
    
    // 合并 localStorage (保留现有数据)
    for (const [key, value] of Object.entries(data.localStorage)) {
      if (key.startsWith("yyc3_") && !localStorage.getItem(key)) {
        localStorage.setItem(key, value);
        result.localStorageCount++;
      }
    }
    
    // 合并 IndexedDB (跳过已存在的)
    try {
      const db = await getDB();
      
      // 合并文件
      for (const file of data.indexedDB.files || []) {
        const existing = await db.get("files", file.path);
        if (!existing) {
          await db.put("files", file);
          result.filesCount++;
        }
      }
      
      // 合并项目
      for (const project of data.indexedDB.projects || []) {
        const existing = await db.get("projects", project.id);
        if (!existing) {
          await db.put("projects", project);
          result.projectsCount++;
        }
      }
      
      // 合并快照
      for (const snapshot of data.indexedDB.snapshots || []) {
        const existing = await db.get("snapshots", snapshot.id);
        if (!existing) {
          await db.put("snapshots", snapshot);
          result.snapshotsCount++;
        }
      }
      
    } catch (e) {
      result.errors.push(`Merge error: ${(e as Error).message}`);
      result.success = false;
    }
    
    return result;
  }
  
  /**
   * 显示导入对话框
   */
  static showImportDialog(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.style.display = "none";
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0] || null;
        resolve(file);
      };
      
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  }
  
  /**
   * 导入并显示结果
   */
  static async importWithUI(): Promise<ImportResult> {
    const file = await this.showImportDialog();
    
    if (!file) {
      return {
        success: false,
        localStorageCount: 0,
        filesCount: 0,
        projectsCount: 0,
        snapshotsCount: 0,
        errors: ["No file selected"],
      };
    }
    
    // 显示加载提示
    this.showProgress("正在导入数据...");
    
    try {
      const result = await this.importFromFile(file);
      
      if (result.success) {
        this.showProgress(
          `导入成功！<br>
           文件：${result.filesCount}<br>
           项目：${result.projectsCount}<br>
           快照：${result.snapshotsCount}`,
          "success"
        );
        
        // 5 秒后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        this.showProgress(
          `导入失败：<br>${result.errors.join("<br>")}`,
          "error"
        );
      }
      
      return result;
      
    } catch (e) {
      this.showProgress(`导入错误：${(e as Error).message}`, "error");
      
      return {
        success: false,
        localStorageCount: 0,
        filesCount: 0,
        projectsCount: 0,
        snapshotsCount: 0,
        errors: [(e as Error).message],
      };
    }
  }
  
  /**
   * 显示进度提示
   */
  private static showProgress(message: string, type: "info" | "success" | "error" = "info"): void {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px;
      background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      max-width: 400px;
      font-size: 14px;
      line-height: 1.5;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">
        ${type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
        ${type === "success" ? "成功" : type === "error" ? "错误" : "提示"}
      </div>
      <div>${message}</div>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 12px;
        padding: 4px 12px;
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
      ">关闭</button>
    `;
    
    document.body.appendChild(notification);
    
    if (type === "success") {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 10000);
    }
  }
}

export default DataImporter;
