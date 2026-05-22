/**
 * @file stores/useScrollSyncStore.ts
 * @description 编辑器与预览面板之间的滚动位置同步 Zustand Store，
 *              通过 pub/sub 模式实现双向滚动联动，内含 300ms 防循环保护
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,scroll-sync,zustand,preview,editor
 */

import { create } from "zustand";

// ── Types ──

type ScrollSource = "editor" | "preview" | null;

interface ScrollSyncState {
  /** 编辑器当前滚动比例 (0–1) */
  editorScrollRatio: number;
  /** 预览当前滚动比例 (0–1) */
  previewScrollRatio: number;
  /** 最近一次滚动事件的来源，防止循环同步 */
  scrollSource: ScrollSource;
  /** 上次更新时间戳，用于防抖 */
  lastUpdateTs: number;

  /** 编辑器调用：发布编辑器滚动位置 */
  publishEditorScroll: (ratio: number) => void;
  /** 预览调用：发布预览滚动位置 */
  publishPreviewScroll: (ratio: number) => void;
  /** 清除 source 锁，允许下次同步 */
  clearSource: () => void;
}

// ── 防循环时间窗口 (ms) ──

const ANTI_LOOP_WINDOW = 300;

// ── Store ──

export const useScrollSyncStore = create<ScrollSyncState>()((set) => ({
  editorScrollRatio: 0,
  previewScrollRatio: 0,
  scrollSource: null,
  lastUpdateTs: 0,

  publishEditorScroll: (ratio: number) => {
    const now = Date.now();
    set((s) => {
      // 忽略来自 preview 反向同步触发的编辑器滚动
      if (
        s.scrollSource === "preview" &&
        now - s.lastUpdateTs < ANTI_LOOP_WINDOW
      )
        return s;
      return {
        editorScrollRatio: ratio,
        scrollSource: "editor",
        lastUpdateTs: now,
      };
    });
  },

  publishPreviewScroll: (ratio: number) => {
    const now = Date.now();
    set((s) => {
      // 忽略来自 editor 反向同步触发的预览滚动
      if (
        s.scrollSource === "editor" &&
        now - s.lastUpdateTs < ANTI_LOOP_WINDOW
      )
        return s;
      return {
        previewScrollRatio: ratio,
        scrollSource: "preview",
        lastUpdateTs: now,
      };
    });
  },

  clearSource: () => set({ scrollSource: null }),
}));
