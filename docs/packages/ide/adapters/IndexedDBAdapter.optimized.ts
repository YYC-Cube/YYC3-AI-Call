/**
 * @file adapters/IndexedDBAdapter.optimized.ts
 * @description IndexedDB 性能优化版本 - 添加缓存层、批量优化、性能监控
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags adapters,indexeddb,persistence,offline,performance,cache
 */

import { openDB, type IDBPDatabase } from "idb";
import { createLogger } from "../utils/logger";
const log = createLogger("IndexedDB");

const DB_NAME = "yyc3-filestore";
const DB_VERSION = 2; // 升级版本以支持新索引

// ── Store names ──
const STORE_FILES = "files"; // 文件内容
const STORE_PROJECTS = "projects"; // 项目元数据
const STORE_SNAPSHOTS = "snapshots"; // 快照/版本

// ── Types ──

export interface StoredFile {
  path: string; // 文件路径 (primary key)
  content: string; // 文件内容
  updatedAt: number; // 最后更新时间戳
  size: number; // 内容大小 (bytes)
  projectId: string; // 所属项目 ID
}

export interface StoredProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  fileCount: number;
  totalSize: number;
}

export interface StoredSnapshot {
  id: string;
  projectId: string;
  label: string;
  createdAt: number;
  files: Record<string, string>; // path -> content
}

// ── 性能指标接口 ──

export interface PerformanceMetrics {
  queryCount: number;
  cacheHitCount: number;
  cacheMissCount: number;
  averageQueryTime: number;
  totalQueryTime: number;
}

// ── 缓存管理器 ──

class QueryCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private maxSize = 1000; // 最大缓存条目数
  private ttl = 60000; // 缓存生存时间（60秒）

  /**
   * 设置缓存
   */
  set(key: string, data: any): void {
    // LRU 淘汰策略
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除项目相关缓存
   */
  clearProject(projectId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`project:${projectId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// ── 性能监控器 ──

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    queryCount: 0,
    cacheHitCount: 0,
    cacheMissCount: 0,
    averageQueryTime: 0,
    totalQueryTime: 0,
  };

  /**
   * 记录查询
   */
  recordQuery(duration: number, cacheHit: boolean): void {
    this.metrics.queryCount++;
    this.metrics.totalQueryTime += duration;

    if (cacheHit) {
      this.metrics.cacheHitCount++;
    } else {
      this.metrics.cacheMissCount++;
    }

    // 计算平均查询时间
    this.metrics.averageQueryTime =
      this.metrics.totalQueryTime / this.metrics.queryCount;
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 重置性能指标
   */
  reset(): void {
    this.metrics = {
      queryCount: 0,
      cacheHitCount: 0,
      cacheMissCount: 0,
      averageQueryTime: 0,
      totalQueryTime: 0,
    };
  }

  /**
   * 获取缓存命中率
   */
  getCacheHitRate(): number {
    if (this.metrics.queryCount === 0) {
      return 0;
    }
    return (this.metrics.cacheHitCount / this.metrics.queryCount) * 100;
  }
}

// ── 全局实例 ──

const queryCache = new QueryCache();
const performanceMonitor = new PerformanceMonitor();

// ── 初始化数据库 ──

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Files store
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          const fileStore = db.createObjectStore(STORE_FILES, {
            keyPath: "path",
          });
          fileStore.createIndex("projectId", "projectId");
          fileStore.createIndex("updatedAt", "updatedAt");
        } else if (oldVersion < 2) {
          // 升级索引：添加复合索引以优化查询
          const fileStore = transaction.objectStore(STORE_FILES);
          if (!fileStore.indexNames.contains("projectId-updatedAt")) {
            fileStore.createIndex("projectId-updatedAt", [
              "projectId",
              "updatedAt",
            ]);
          }
        }

        // Projects store
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
        }

        // Snapshots store
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          const snapStore = db.createObjectStore(STORE_SNAPSHOTS, {
            keyPath: "id",
          });
          snapStore.createIndex("projectId", "projectId");
        }
      },
    });
  }
  return dbPromise;
}

// ===================================================================
//  文件操作 - 性能优化版本
// ===================================================================

/**
 * 保存文件（带缓存更新）
 */
export async function saveFile(
  projectId: string,
  path: string,
  content: string,
): Promise<void> {
  const startTime = performance.now();

  try {
    const db = await getDB();
    // 确保路径格式正确（移除前导斜杠避免双斜杠）
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const fullPath = `${projectId}/${normalizedPath}`;
    const file: StoredFile = {
      path: fullPath,
      content,
      updatedAt: Date.now(),
      size: new Blob([content]).size,
      projectId,
    };

    await db.put(STORE_FILES, file);

    // 更新缓存
    queryCache.set(`file:${fullPath}`, file);

    const duration = performance.now() - startTime;
    performanceMonitor.recordQuery(duration, false);
  } catch (error) {
    log.error("Failed to save file:", error);
    throw error;
  }
}

/**
 * 批量保存文件（优化版本）
 */
export async function saveFiles(
  projectId: string,
  files: Record<string, string>,
): Promise<void> {
  const startTime = performance.now();

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_FILES, "readwrite");
    const store = tx.objectStore(STORE_FILES);

    const now = Date.now();
    const cacheUpdates: Array<{ key: string; data: StoredFile }> = [];

    for (const [path, content] of Object.entries(files)) {
      // 确保路径格式正确
      const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
      const fullPath = `${projectId}/${normalizedPath}`;
      const file: StoredFile = {
        path: fullPath,
        content,
        updatedAt: now,
        size: new Blob([content]).size,
        projectId,
      };

      store.put(file);
      cacheUpdates.push({ key: `file:${fullPath}`, data: file });
    }

    await tx.done;

    // 批量更新缓存
    cacheUpdates.forEach(({ key, data }) => {
      queryCache.set(key, data);
    });

    const duration = performance.now() - startTime;
    performanceMonitor.recordQuery(duration, false);
  } catch (error) {
    log.error("Failed to save files:", error);
    throw error;
  }
}

/**
 * 加载文件（带缓存）
 */
export async function loadFile(
  projectId: string,
  path: string,
): Promise<string | null> {
  const startTime = performance.now();
  // 确保路径格式正确
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const fullPath = `${projectId}/${normalizedPath}`;

  try {
    // 1. 检查缓存
    const cachedFile = queryCache.get(`file:${fullPath}`);
    if (cachedFile) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordQuery(duration, true);
      return cachedFile.content;
    }

    // 2. 从 IndexedDB 加载
    const db = await getDB();
    const file = await db.get(STORE_FILES, fullPath);

    const duration = performance.now() - startTime;
    performanceMonitor.recordQuery(duration, false);

    if (file) {
      // 更新缓存
      queryCache.set(`file:${fullPath}`, file);
      return file.content;
    }

    return null;
  } catch (error) {
    log.error("Failed to load file:", error);
    throw error;
  }
}

/**
 * 批量加载文件（优化版本 - 并行查询）
 */
export async function loadFiles(
  projectId: string,
  paths: string[],
): Promise<Record<string, string>> {
  const startTime = performance.now();

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_FILES, "readonly");
    const store = tx.objectStore(STORE_FILES);

    // 并行查询所有文件
    const promises = paths.map(async (path) => {
      // 确保路径格式正确
      const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
      const fullPath = `${projectId}/${normalizedPath}`;

      // 检查缓存
      const cachedFile = queryCache.get(`file:${fullPath}`);
      if (cachedFile) {
        return { path, content: cachedFile.content, cacheHit: true };
      }

      // 从 IndexedDB 加载
      const file = await store.get(fullPath);
      if (file) {
        queryCache.set(`file:${fullPath}`, file);
        return { path, content: file.content, cacheHit: false };
      }

      return { path, content: null, cacheHit: false };
    });

    const results = await Promise.all(promises);

    // 构建结果对象
    const result: Record<string, string> = {};
    let cacheHits = 0;

    for (const { path, content, cacheHit } of results) {
      if (content !== null) {
        result[path] = content;
      }
      if (cacheHit) {
        cacheHits++;
      }
    }

    const duration = performance.now() - startTime;
    performanceMonitor.recordQuery(duration, cacheHits > 0);

    return result;
  } catch (error) {
    log.error("Failed to load files:", error);
    throw error;
  }
}

/**
 * 加载所有文件（优化版本）
 */
export async function loadAllFiles(
  projectId: string,
): Promise<Record<string, string>> {
  const startTime = performance.now();
  const cacheKey = `project:${projectId}:all`;

  try {
    // 1. 检查缓存
    const cachedFiles = queryCache.get(cacheKey);
    if (cachedFiles) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordQuery(duration, true);
      return cachedFiles;
    }

    // 2. 从 IndexedDB 加载
    const db = await getDB();
    const files = await db.getAllFromIndex(STORE_FILES, "projectId", projectId);

    // 3. 构建结果对象
    const result: Record<string, string> = {};
    const prefix = `${projectId}/`;

    for (const file of files) {
      const relativePath = file.path.startsWith(prefix)
        ? file.path.slice(prefix.length)
        : file.path;
      result[relativePath] = file.content;

      // 同时缓存单个文件
      queryCache.set(`file:${file.path}`, file);
    }

    // 4. 缓存整个项目文件列表
    queryCache.set(cacheKey, result);

    const duration = performance.now() - startTime;
    performanceMonitor.recordQuery(duration, false);

    return result;
  } catch (error) {
    log.error("Failed to load all files:", error);
    throw error;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(
  projectId: string,
  path: string,
): Promise<void> {
  const startTime = performance.now();

  try {
    const db = await getDB();
    // 确保路径格式正确
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const fullPath = `${projectId}/${normalizedPath}`;

    await db.delete(STORE_FILES, fullPath);

    // 清除缓存
    queryCache.delete(`file:${fullPath}`);
    queryCache.clearProject(projectId);

    const duration = performance.now() - startTime;
    performanceMonitor.recordQuery(duration, false);
  } catch (error) {
    log.error("Failed to delete file:", error);
    throw error;
  }
}

/**
 * 删除所有文件
 */
export async function deleteAllFiles(projectId: string): Promise<void> {
  const startTime = performance.now();

  try {
    const db = await getDB();
    const files = await db.getAllKeysFromIndex(
      STORE_FILES,
      "projectId",
      projectId,
    );
    const tx = db.transaction(STORE_FILES, "readwrite");

    // 批量删除
    for (const key of files) {
      tx.objectStore(STORE_FILES).delete(key);
    }

    await tx.done;

    // 清除缓存
    queryCache.clearProject(projectId);

    const duration = performance.now() - startTime;
    performanceMonitor.recordQuery(duration, false);
  } catch (error) {
    log.error("Failed to delete all files:", error);
    throw error;
  }
}

// ===================================================================
//  项目操作
// ===================================================================

export async function saveProject(project: StoredProject): Promise<void> {
  const db = await getDB();
  await db.put(STORE_PROJECTS, project);
  queryCache.set(`project:${project.id}`, project);
}

export async function loadProject(id: string): Promise<StoredProject | null> {
  const cached = queryCache.get(`project:${id}`);
  if (cached) {
    return cached;
  }

  const db = await getDB();
  const project = await db.get(STORE_PROJECTS, id);

  if (project) {
    queryCache.set(`project:${id}`, project);
    return project;
  }

  return null;
}

export async function listProjects(): Promise<StoredProject[]> {
  const cacheKey = "projects:all";
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const db = await getDB();
  const projects = await db.getAll(STORE_PROJECTS);
  const sorted = projects.sort((a, b) => b.updatedAt - a.updatedAt);

  queryCache.set(cacheKey, sorted);
  return sorted;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_PROJECTS, id);
  await deleteAllFiles(id);

  // 清除缓存
  queryCache.delete(`project:${id}`);
  queryCache.clearProject(id);
}

// ===================================================================
//  快照操作
// ===================================================================

export async function createSnapshot(
  projectId: string,
  label: string,
  files: Record<string, string>,
): Promise<string> {
  const db = await getDB();
  const id = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const snapshot: StoredSnapshot = {
    id,
    projectId,
    label,
    createdAt: Date.now(),
    files,
  };
  await db.put(STORE_SNAPSHOTS, snapshot);
  return id;
}

export async function loadSnapshot(id: string): Promise<StoredSnapshot | null> {
  const cached = queryCache.get(`snapshot:${id}`);
  if (cached) {
    return cached;
  }

  const db = await getDB();
  const snapshot = await db.get(STORE_SNAPSHOTS, id);

  if (snapshot) {
    queryCache.set(`snapshot:${id}`, snapshot);
    return snapshot;
  }

  return null;
}

export async function listSnapshots(
  projectId: string,
): Promise<StoredSnapshot[]> {
  const cacheKey = `snapshots:${projectId}`;
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const db = await getDB();
  const snapshots = await db.getAllFromIndex(
    STORE_SNAPSHOTS,
    "projectId",
    projectId,
  );
  const sorted = snapshots.sort((a, b) => b.createdAt - a.createdAt);

  queryCache.set(cacheKey, sorted);
  return sorted;
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_SNAPSHOTS, id);
  queryCache.delete(`snapshot:${id}`);
}

// ===================================================================
//  存储容量检测
// ===================================================================

export async function getStorageEstimate(): Promise<{
  used: number;
  available: number;
  usagePercent: number;
}> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage ?? 0;
      const quota = estimate.quota ?? 0;
      return {
        used,
        available: quota - used,
        usagePercent: quota > 0 ? Math.round((used / quota) * 100) : 0,
      };
    }
  } catch {
    // Fallback
  }
  return { used: 0, available: 0, usagePercent: 0 };
}

// ===================================================================
//  性能监控 API
// ===================================================================

/**
 * 获取性能指标
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceMonitor.getMetrics();
}

/**
 * 获取缓存命中率
 */
export function getCacheHitRate(): number {
  return performanceMonitor.getCacheHitRate();
}

/**
 * 重置性能指标
 */
export function resetPerformanceMetrics(): void {
  performanceMonitor.reset();
}

/**
 * 清除所有缓存
 */
export function clearCache(): void {
  queryCache.clear();
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return queryCache.getStats();
}

// ===================================================================
//  自动持久化 Hook 辅助
// ===================================================================

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

/**
 * 防抖保存 — 文件编辑时调用，2 秒内无新编辑才真正写入 IndexedDB
 */
export function debouncedSaveFiles(
  projectId: string,
  files: Record<string, string>,
): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveFiles(projectId, files).catch(console.error);
  }, DEBOUNCE_MS);
}

/**
 * 立即保存 — 关键操作（创建/删除文件）时立即写入
 */
export function immediateSaveFiles(
  projectId: string,
  files: Record<string, string>,
): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveFiles(projectId, files).catch(console.error);
}

/**
 * 列出项目下的所有文件
 */
export async function listFiles(
  projectId: string,
): Promise<StoredFile[]> {
  const cacheKey = `files:${projectId}`;
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const db = await getDB();
  const files = await db.getAllFromIndex(STORE_FILES, "projectId", projectId);
  
  queryCache.set(cacheKey, files);
  return files;
}

/**
 * 清空所有数据
 */
export async function clearAllData(): Promise<void> {
  try {
    const db = await getDB();
    
    // 清空所有 stores
    const tx = db.transaction([STORE_FILES, STORE_PROJECTS, STORE_SNAPSHOTS], "readwrite");
    
    await Promise.all([
      tx.objectStore(STORE_FILES).clear(),
      tx.objectStore(STORE_PROJECTS).clear(),
      tx.objectStore(STORE_SNAPSHOTS).clear(),
    ]);
    
    await tx.done;
    
    // 清空缓存
    queryCache.clear();
    
    log.info("All IndexedDB data cleared successfully");
  } catch (error) {
    log.error("Failed to clear all data:", error);
    throw error;
  }
}
