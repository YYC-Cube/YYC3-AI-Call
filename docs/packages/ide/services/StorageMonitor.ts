/**
 * @file StorageMonitor.ts
 * @description 存储监控服务 - 监控 localStorage 和 IndexedDB 使用情况，提供容量告警和清理建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags storage,monitoring,performance,cleanup
 */

import { getDB, type StoredFile } from "./adapters/IndexedDBAdapter";
import { createLogger } from "../utils/logger";
const log = createLogger("StorageMonitor");

export interface StorageUsage {
  // localStorage
  localStorageUsage: number; // bytes
  localStorageQuota: number; // bytes
  localStoragePercent: number; // 0-100
  
  // IndexedDB
  indexedDBUsage: number; // bytes
  indexedDBFileCount: number;
  indexedDBProjectCount: number;
  
  // Total
  totalUsage: number; // bytes
  totalPercent: number; // 0-100
  
  // Status
  status: "good" | "warning" | "critical";
  recommendations: string[];
}

export interface StorageBreakdown {
  // localStorage breakdown
  chatSessions: { count: number; size: number };
  settings: { size: number };
  theme: { size: number };
  modelConfig: { size: number };
  panelLayout: { size: number };
  apiKeys: { size: number };
  other: { count: number; size: number };
  
  // IndexedDB breakdown
  files: { count: number; size: number };
  projects: { count: number; size: number };
  snapshots: { count: number; size: number };
}

/**
 * 存储监控服务
 */
class StorageMonitorService {
  private static instance: StorageMonitorService | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly WARNING_THRESHOLD = 70; // 70%
  private readonly CRITICAL_THRESHOLD = 90; // 90%
  
  private constructor() {}
  
  static getInstance(): StorageMonitorService {
    if (!StorageMonitorService.instance) {
      StorageMonitorService.instance = new StorageMonitorService();
    }
    return StorageMonitorService.instance;
  }
  
  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<StorageUsage> {
    const recommendations: string[] = [];
    
    // 获取浏览器存储配额
    let localStorageUsage = 0;
    let localStorageQuota = 5 * 1024 * 1024; // 默认 5MB
    let indexedDBUsage = 0;
    let indexedDBFileCount = 0;
    let indexedDBProjectCount = 0;
    
    // 计算 localStorage 使用
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || "";
          localStorageUsage += (key.length + value.length) * 2; // UTF-16
        }
      }
    } catch (e) {
      log.error("Error calculating localStorage usage:", e);
    }
    
    // 获取 IndexedDB 使用
    try {
      const db = await getDB();
      
      // 获取所有文件
      const files = await db.getAll("files");
      indexedDBFileCount = files.length;
      indexedDBUsage = files.reduce((sum, file: StoredFile) => {
        return sum + (file.content?.length || 0) * 2;
      }, 0);
      
      // 获取项目数
      const projects = await db.getAll("projects");
      indexedDBProjectCount = projects.length;
      
    } catch (e) {
      log.error("Error calculating IndexedDB usage:", e);
    }
    
    // 获取浏览器配额 (如果支持)
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota) {
          localStorageQuota = estimate.quota;
        }
      } catch (e) {
        log.error("Error getting storage estimate:", e);
      }
    }
    
    const totalUsage = localStorageUsage + indexedDBUsage;
    const totalPercent = (totalUsage / localStorageQuota) * 100;
    
    // 确定状态
    let status: "good" | "warning" | "critical" = "good";
    if (totalPercent >= this.CRITICAL_THRESHOLD) {
      status = "critical";
    } else if (totalPercent >= this.WARNING_THRESHOLD) {
      status = "warning";
    }
    
    // 生成建议
    if (status === "critical") {
      recommendations.push("存储使用率超过 90%，建议立即清理");
      recommendations.push("导出重要数据并删除旧项目");
    } else if (status === "warning") {
      recommendations.push("存储使用率超过 70%，建议清理不需要的数据");
    }
    
    if (indexedDBFileCount > 100) {
      recommendations.push(`当前有 ${indexedDBFileCount} 个文件，建议清理不常用的文件`);
    }
    
    if (localStorageUsage > 3 * 1024 * 1024) {
      recommendations.push("localStorage 使用过多，建议清理对话历史");
    }
    
    return {
      localStorageUsage,
      localStorageQuota,
      localStoragePercent: (localStorageUsage / localStorageQuota) * 100,
      indexedDBUsage,
      indexedDBFileCount,
      indexedDBProjectCount,
      totalUsage,
      totalPercent,
      status,
      recommendations,
    };
  }
  
  /**
   * 获取存储详细分类
   */
  async getStorageBreakdown(): Promise<StorageBreakdown> {
    const breakdown: StorageBreakdown = {
      chatSessions: { count: 0, size: 0 },
      settings: { size: 0 },
      theme: { size: 0 },
      modelConfig: { size: 0 },
      panelLayout: { size: 0 },
      apiKeys: { size: 0 },
      other: { count: 0, size: 0 },
      files: { count: 0, size: 0 },
      projects: { count: 0, size: 0 },
      snapshots: { count: 0, size: 0 },
    };
    
    // localStorage 分类
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const value = localStorage.getItem(key) || "";
        const size = (key.length + value.length) * 2;
        
        if (key.startsWith("yyc3_chat_")) {
          if (key.includes("_sessions") || key.includes("_msg_")) {
            breakdown.chatSessions.count++;
            breakdown.chatSessions.size += size;
          }
        } else if (key.startsWith("yyc3_settings")) {
          breakdown.settings.size += size;
        } else if (key.startsWith("yyc3_theme")) {
          breakdown.theme.size += size;
        } else if (key.startsWith("yyc3_model")) {
          breakdown.modelConfig.size += size;
        } else if (key.startsWith("yyc3_panel")) {
          breakdown.panelLayout.size += size;
        } else if (key.startsWith("yyc3_api_key")) {
          breakdown.apiKeys.size += size;
        } else {
          breakdown.other.count++;
          breakdown.other.size += size;
        }
      }
    } catch (e) {
      log.error("Error breaking down localStorage:", e);
    }
    
    // IndexedDB 分类
    try {
      const db = await getDB();
      
      const files = await db.getAll("files");
      breakdown.files.count = files.length;
      breakdown.files.size = files.reduce((sum, file: StoredFile) => {
        return sum + (file.content?.length || 0) * 2;
      }, 0);
      
      const projects = await db.getAll("projects");
      breakdown.projects.count = projects.length;
      breakdown.projects.size = JSON.stringify(projects).length * 2;
      
      const snapshots = await db.getAll("snapshots");
      breakdown.snapshots.count = snapshots.length;
      breakdown.snapshots.size = JSON.stringify(snapshots).length * 2;
      
    } catch (e) {
      log.error("Error breaking down IndexedDB:", e);
    }
    
    return breakdown;
  }
  
  /**
   * 开始定期监控
   */
  startMonitoring(intervalMs: number = 60000) {
    if (this.checkInterval) {
      this.stopMonitoring();
    }
    
    this.checkInterval = setInterval(async () => {
      const usage = await this.getStorageUsage();
      
      if (usage.status === "critical") {
        log.warn("Critical storage usage:", usage.totalPercent.toFixed(2) + "%");
        this.showStorageWarning(usage);
      } else if (usage.status === "warning") {
        log.warn("Warning storage usage:", usage.totalPercent.toFixed(2) + "%");
      }
    }, intervalMs);
    
    log.info("Started monitoring with interval:", intervalMs, "ms");
  }
  
  /**
   * 停止监控
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      log.info("Stopped monitoring");
    }
  }
  
  /**
   * 显示存储警告
   */
  private showStorageWarning(usage: StorageUsage) {
    // 创建通知元素
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px;
      background: ${usage.status === "critical" ? "#ef4444" : "#f59e0b"};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      max-width: 400px;
      font-size: 14px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">
        ⚠️ 存储空间不足
      </div>
      <div style="margin-bottom: 8px;">
        已使用：${(usage.totalUsage / 1024 / 1024).toFixed(2)} MB
      </div>
      <div style="margin-bottom: 12px;">
        使用率：${usage.totalPercent.toFixed(1)}%
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        ${usage.recommendations.join("<br>")}
      </div>
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
    
    // 5 秒后自动移除
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }
  
  /**
   * 清理旧数据
   */
  async cleanupOldData(daysOld: number = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    try {
      const db = await getDB();
      
      // 获取所有文件
      const files = await db.getAll("files");
      
      // 删除旧文件
      for (const file of files) {
        if (file.updatedAt < cutoff) {
          await db.delete("files", file.path);
          cleanedCount++;
        }
      }
      
      log.info(`Cleaned up ${cleanedCount} files older than ${daysOld} days`);
      
    } catch (e) {
      log.error("Error cleaning up old data:", e);
    }
    
    return cleanedCount;
  }
  
  /**
   * 清理对话历史
   */
  async cleanupChatHistory(keepSessions: number = 10) {
    const STORAGE_PREFIX = "yyc3_chat_";
    let cleanedCount = 0;
    
    try {
      // 获取所有会话
      const sessionsKey = `${STORAGE_PREFIX}ide_sessions`;
      const sessionsRaw = localStorage.getItem(sessionsKey);
      
      if (sessionsRaw) {
        const sessions = JSON.parse(sessionsRaw);
        
        // 按更新时间排序
        sessions.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
        
        // 保留最新的 keepSessions 个
        const sessionsToKeep = sessions.slice(0, keepSessions);
        const sessionsToRemove = sessions.slice(keepSessions);
        
        // 删除旧会话的消息
        for (const session of sessionsToRemove) {
          const msgKey = `${STORAGE_PREFIX}ide_msg_${session.id}`;
          localStorage.removeItem(msgKey);
          cleanedCount++;
        }
        
        // 保存更新后的会话列表
        localStorage.setItem(sessionsKey, JSON.stringify(sessionsToKeep));
        
        log.info(`Cleaned up ${cleanedCount} old chat sessions`);
      }
      
    } catch (e) {
      log.error("Error cleaning up chat history:", e);
    }
    
    return cleanedCount;
  }
}

// 导出单例
export const storageMonitor = StorageMonitorService.getInstance();

// 导出工具函数
export const getStorageUsage = storageMonitor.getStorageUsage.bind(storageMonitor);
export const getStorageBreakdown = storageMonitor.getStorageBreakdown.bind(storageMonitor);
export const startMonitoring = storageMonitor.startMonitoring.bind(storageMonitor);
export const stopMonitoring = storageMonitor.stopMonitoring.bind(storageMonitor);
export const cleanupOldData = storageMonitor.cleanupOldData.bind(storageMonitor);
export const cleanupChatHistory = storageMonitor.cleanupChatHistory.bind(storageMonitor);

export default storageMonitor;
