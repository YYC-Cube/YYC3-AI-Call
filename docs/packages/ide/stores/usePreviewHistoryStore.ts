/**
 * @file stores/usePreviewHistoryStore.ts
 * @description 预览历史 Store — 对齐 P2-预览-预览历史.md，管理预览快照、版本对比、回滚
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,preview,history,snapshots,rollback
 */

// ================================================================
// Preview History Store
// ================================================================
//
// 对齐：YYC3-Design-Prompt/P2-高级功能/YYC3-P2-预览-预览历史.md
//
// 功能：
//   - 自动/手动创建预览快照（HTML 截图 + 文件状态）
//   - 快照时间线浏览
//   - 两个快照之间的 Diff 对比
//   - 快照回滚（恢复文件状态）
//   - 快照标记/收藏/删除
//
// 存储策略：
//   - 内存中保持最近 N 条快照元数据
//   - 完整内容按需从 IndexedDB 加载
//   - 超过上限时自动清理未标记的旧快照
// ================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/** 预览快照 */
export interface PreviewSnapshot {
  id: string;
  title: string;
  description?: string;
  timestamp: number;
  /** 触发方式 */
  trigger: "auto" | "manual" | "deploy";
  /** 文件快照（路径 → 内容）*/
  files: Record<string, string>;
  /** 当时的预览 URL/截图 base64（可选） */
  screenshotUrl?: string;
  /** 是否已标记/收藏 */
  starred: boolean;
  /** 标签 */
  tags: string[];
  /** 文件变更统计 */
  stats: {
    totalFiles: number;
    changedFiles: number;
    addedFiles: number;
    deletedFiles: number;
  };
}

/** Diff 结果 */
export interface SnapshotDiff {
  snapshotA: string; // id
  snapshotB: string; // id
  changes: SnapshotFileChange[];
}

export interface SnapshotFileChange {
  path: string;
  type: "added" | "modified" | "deleted" | "unchanged";
  contentA?: string;
  contentB?: string;
}

/** Store State */
interface PreviewHistoryState {
  snapshots: PreviewSnapshot[];
  maxSnapshots: number;
  autoSnapshotInterval: number; // ms, 0 = disabled
  lastAutoSnapshot: number;

  // ── Actions ──
  createSnapshot: (params: {
    title?: string;
    description?: string;
    trigger?: "auto" | "manual" | "deploy";
    files: Record<string, string>;
    screenshotUrl?: string;
    tags?: string[];
  }) => string; // returns snapshot id

  deleteSnapshot: (id: string) => void;
  toggleStar: (id: string) => void;
  updateSnapshot: (
    id: string,
    updates: Partial<Pick<PreviewSnapshot, "title" | "description" | "tags">>,
  ) => void;
  rollbackToSnapshot: (id: string) => Record<string, string> | null;
  diffSnapshots: (idA: string, idB: string) => SnapshotDiff | null;
  getSnapshot: (id: string) => PreviewSnapshot | undefined;
  clearUnstarred: () => number;
  setMaxSnapshots: (max: number) => void;
  setAutoSnapshotInterval: (ms: number) => void;
}

/** 生成唯一 ID */
function generateSnapshotId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 计算文件变更统计 */
function computeStats(
  files: Record<string, string>,
  prevFiles?: Record<string, string>,
): PreviewSnapshot["stats"] {
  const totalFiles = Object.keys(files).length;
  if (!prevFiles) {
    return {
      totalFiles,
      changedFiles: 0,
      addedFiles: totalFiles,
      deletedFiles: 0,
    };
  }

  let changedFiles = 0;
  let addedFiles = 0;
  let deletedFiles = 0;

  const allPaths = new Set([...Object.keys(files), ...Object.keys(prevFiles)]);
  for (const path of allPaths) {
    const inCurrent = path in files;
    const inPrev = path in prevFiles;
    if (inCurrent && !inPrev) addedFiles++;
    else if (!inCurrent && inPrev) deletedFiles++;
    else if (inCurrent && inPrev && files[path] !== prevFiles[path])
      changedFiles++;
  }

  return { totalFiles, changedFiles, addedFiles, deletedFiles };
}

export const usePreviewHistoryStore = create<PreviewHistoryState>()(
  immer((set, get) => ({
    snapshots: [],
    maxSnapshots: 50,
    autoSnapshotInterval: 0, // disabled by default
    lastAutoSnapshot: 0,

    createSnapshot: (params) => {
      const id = generateSnapshotId();
      const state = get();
      const prevSnapshot = state.snapshots[0]; // most recent
      const stats = computeStats(params.files, prevSnapshot?.files);

      const snapshot: PreviewSnapshot = {
        id,
        title: params.title || `快照 ${new Date().toLocaleString("zh-CN")}`,
        description: params.description,
        timestamp: Date.now(),
        trigger: params.trigger || "manual",
        files: { ...params.files },
        screenshotUrl: params.screenshotUrl,
        starred: false,
        tags: params.tags || [],
        stats,
      };

      set((draft) => {
        draft.snapshots.unshift(snapshot);
        draft.lastAutoSnapshot = Date.now();

        // Trim: keep starred + most recent up to maxSnapshots
        if (draft.snapshots.length > draft.maxSnapshots) {
          const starred = draft.snapshots.filter((s) => s.starred);
          const unstarred = draft.snapshots.filter((s) => !s.starred);
          const maxUnstarred = draft.maxSnapshots - starred.length;
          draft.snapshots = [
            ...starred,
            ...unstarred.slice(0, Math.max(maxUnstarred, 0)),
          ].sort((a, b) => b.timestamp - a.timestamp);
        }
      });

      return id;
    },

    deleteSnapshot: (id) => {
      set((draft) => {
        draft.snapshots = draft.snapshots.filter((s) => s.id !== id);
      });
    },

    toggleStar: (id) => {
      set((draft) => {
        const snap = draft.snapshots.find((s) => s.id === id);
        if (snap) snap.starred = !snap.starred;
      });
    },

    updateSnapshot: (id, updates) => {
      set((draft) => {
        const snap = draft.snapshots.find((s) => s.id === id);
        if (snap) {
          if (updates.title !== undefined) snap.title = updates.title;
          if (updates.description !== undefined)
            snap.description = updates.description;
          if (updates.tags !== undefined) snap.tags = updates.tags;
        }
      });
    },

    rollbackToSnapshot: (id) => {
      const snap = get().snapshots.find((s) => s.id === id);
      if (!snap) return null;
      return { ...snap.files };
    },

    diffSnapshots: (idA, idB) => {
      const state = get();
      const snapA = state.snapshots.find((s) => s.id === idA);
      const snapB = state.snapshots.find((s) => s.id === idB);
      if (!snapA || !snapB) return null;

      const allPaths = new Set([
        ...Object.keys(snapA.files),
        ...Object.keys(snapB.files),
      ]);
      const changes: SnapshotFileChange[] = [];

      for (const path of allPaths) {
        const inA = path in snapA.files;
        const inB = path in snapB.files;

        if (inA && !inB) {
          changes.push({ path, type: "deleted", contentA: snapA.files[path] });
        } else if (!inA && inB) {
          changes.push({ path, type: "added", contentB: snapB.files[path] });
        } else if (inA && inB) {
          if (snapA.files[path] === snapB.files[path]) {
            changes.push({ path, type: "unchanged" });
          } else {
            changes.push({
              path,
              type: "modified",
              contentA: snapA.files[path],
              contentB: snapB.files[path],
            });
          }
        }
      }

      return { snapshotA: idA, snapshotB: idB, changes };
    },

    getSnapshot: (id) => get().snapshots.find((s) => s.id === id),

    clearUnstarred: () => {
      const before = get().snapshots.length;
      set((draft) => {
        draft.snapshots = draft.snapshots.filter((s) => s.starred);
      });
      return before - get().snapshots.length;
    },

    setMaxSnapshots: (max) => {
      set((draft) => {
        draft.maxSnapshots = Math.max(5, max);
      });
    },

    setAutoSnapshotInterval: (ms) => {
      set((draft) => {
        draft.autoSnapshotInterval = Math.max(0, ms);
      });
    },
  })),
);
