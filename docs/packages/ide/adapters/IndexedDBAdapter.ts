/**
 * @file adapters/IndexedDBAdapter.ts
 * @description IndexedDB 文件系统持久化层，使用 idb 封装提供 offline-first 文件存储
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags adapters,indexeddb,persistence,offline
 */

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "yyc3-filestore";
const DB_VERSION = 1;

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

// ── 初始化数据库 ──

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Files store
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          const fileStore = db.createObjectStore(STORE_FILES, {
            keyPath: "path",
          });
          fileStore.createIndex("projectId", "projectId");
          fileStore.createIndex("updatedAt", "updatedAt");
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
//  文件操作
// ===================================================================

export async function saveFile(
  projectId: string,
  path: string,
  content: string,
): Promise<void> {
  const db = await getDB();
  const file: StoredFile = {
    path: `${projectId}/${path}`,
    content,
    updatedAt: Date.now(),
    size: new Blob([content]).size,
    projectId,
  };
  await db.put(STORE_FILES, file);
}

export async function saveFiles(
  projectId: string,
  files: Record<string, string>,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_FILES, "readwrite");
  const store = tx.objectStore(STORE_FILES);

  const now = Date.now();
  for (const [path, content] of Object.entries(files)) {
    const file: StoredFile = {
      path: `${projectId}/${path}`,
      content,
      updatedAt: now,
      size: new Blob([content]).size,
      projectId,
    };
    store.put(file);
  }

  await tx.done;
}

export async function loadFile(
  projectId: string,
  path: string,
): Promise<string | null> {
  const db = await getDB();
  const file = await db.get(STORE_FILES, `${projectId}/${path}`);
  return file?.content ?? null;
}

export async function loadAllFiles(
  projectId: string,
): Promise<Record<string, string>> {
  const db = await getDB();
  const files = await db.getAllFromIndex(STORE_FILES, "projectId", projectId);

  const result: Record<string, string> = {};
  const prefix = `${projectId}/`;
  for (const file of files) {
    const relativePath = file.path.startsWith(prefix)
      ? file.path.slice(prefix.length)
      : file.path;
    result[relativePath] = file.content;
  }
  return result;
}

export async function deleteFile(
  projectId: string,
  path: string,
): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_FILES, `${projectId}/${path}`);
}

export async function deleteAllFiles(projectId: string): Promise<void> {
  const db = await getDB();
  const files = await db.getAllKeysFromIndex(
    STORE_FILES,
    "projectId",
    projectId,
  );
  const tx = db.transaction(STORE_FILES, "readwrite");
  for (const key of files) {
    tx.objectStore(STORE_FILES).delete(key);
  }
  await tx.done;
}

// ===================================================================
//  项目操作
// ===================================================================

export async function saveProject(project: StoredProject): Promise<void> {
  const db = await getDB();
  await db.put(STORE_PROJECTS, project);
}

export async function loadProject(id: string): Promise<StoredProject | null> {
  const db = await getDB();
  const project = await db.get(STORE_PROJECTS, id);
  return project ?? null;
}

export async function listProjects(): Promise<StoredProject[]> {
  const db = await getDB();
  const projects = await db.getAll(STORE_PROJECTS);
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_PROJECTS, id);
  await deleteAllFiles(id);
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
  const db = await getDB();
  const snapshot = await db.get(STORE_SNAPSHOTS, id);
  return snapshot ?? null;
}

export async function listSnapshots(
  projectId: string,
): Promise<StoredSnapshot[]> {
  const db = await getDB();
  const snapshots = await db.getAllFromIndex(
    STORE_SNAPSHOTS,
    "projectId",
    projectId,
  );
  return snapshots.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_SNAPSHOTS, id);
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
