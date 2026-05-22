/**
 * @file stores/useFileStoreZustand.ts
 * @description Zustand + Immer 文件系统 Store，替代 FileStore.tsx Context，
 *              支持 selector 优化、immer mutation、localStorage 持久化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags stores,zustand,immer,files,persistence
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { FILE_CONTENTS, type FileNode } from "../fileData";

// ===== Types =====
export interface OpenTab {
  path: string;
  modified: boolean;
}

export interface GitChange {
  path: string;
  status: "modified" | "added" | "deleted" | "untracked";
  staged: boolean;
}

export interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

interface FileStoreState {
  // File contents
  fileContents: Record<string, string>;
  // Tabs
  openTabs: OpenTab[];
  activeFile: string;
  // Git state
  gitBranch: string;
  gitChanges: GitChange[];
  gitLog: GitLogEntry[];
}

interface FileStoreActions {
  // File operations
  updateFile: (path: string, content: string) => void;
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;

  // Tab operations
  setActiveFile: (path: string) => void;
  openFile: (path: string) => void;
  closeTab: (path: string) => void;
  closeOtherTabs: (path: string) => void;
  closeAllTabs: () => void;

  // Git operations
  setGitBranch: (branch: string) => void;
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  stageAll: () => void;
  unstageAll: () => void;
  commitChanges: (message: string) => void;

  // Format
  formatCurrentFile: () => void;

  // Project initialization (for template projects)
  initializeProject: (
    files: Record<string, string>,
    entryFile?: string,
  ) => void;

  // Computed (selector helpers)
  getFileTree: () => FileNode[];
}

// ===== Helpers =====
function getLang(name: string): string {
  if (name.endsWith(".tsx")) return "tsx";
  if (name.endsWith(".ts")) return "ts";
  if (name.endsWith(".jsx")) return "jsx";
  if (name.endsWith(".js")) return "js";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".html")) return "html";
  if (name.endsWith(".md")) return "md";
  return "text";
}

function buildTreeFromPaths(contents: Record<string, string>): FileNode[] {
  const root: FileNode[] = [];
  const paths = Object.keys(contents).sort();

  for (const fullPath of paths) {
    const parts = fullPath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const partPath = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;

      const existing = current.find((n) => n.name === part);
      if (existing) {
        if (existing.type === "folder" && existing.children) {
          current = existing.children;
        }
      } else {
        const node: FileNode = {
          name: part,
          path: partPath,
          type: isFile ? "file" : "folder",
          ...(isFile ? { lang: getLang(part) } : { children: [] }),
        };
        current.push(node);
        if (!isFile && node.children) {
          current = node.children;
        }
      }
    }
  }

  return root;
}

function simpleFormat(code: string, lang: string): string {
  if (lang === "json") {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      return code;
    }
  }
  const lines = code.split("\n");
  let indent = 0;
  const formatted: string[] = [];
  const openers = /[{(\[]\\s*$/;
  const closers = /^\s*[})\]]/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      formatted.push("");
      continue;
    }
    if (closers.test(line)) indent = Math.max(0, indent - 1);
    formatted.push("  ".repeat(indent) + line);
    if (openers.test(line) && !line.startsWith("//") && !line.startsWith("*"))
      indent++;
  }

  return formatted.join("\n");
}

const INITIAL_GIT_LOG: GitLogEntry[] = [
  {
    hash: "a1b2c3d",
    message: "feat: 添加数据表格组件",
    author: "开发者",
    date: "2 小时前",
    branch: "main",
  },
  {
    hash: "e4f5g6h",
    message: "fix: 修复侧边栏导航高亮",
    author: "开发者",
    date: "5 小时前",
    branch: "main",
  },
  {
    hash: "i7j8k9l",
    message: "refactor: 重构 Header 组件",
    author: "协作者",
    date: "昨天",
    branch: "main",
  },
  {
    hash: "m0n1o2p",
    message: "chore: 初始化项目结构",
    author: "开发者",
    date: "3 天前",
    branch: "main",
  },
];

// ===== Zustand Store =====
export const useFileStoreZustand = create<FileStoreState & FileStoreActions>()(
  immer((set, get) => ({
    // ── Initial state ──
    fileContents: FILE_CONTENTS,
    openTabs: [{ path: "src/app/App.tsx", modified: false }],
    activeFile: "src/app/App.tsx",
    gitBranch: "main",
    gitChanges: [
      { path: "src/app/App.tsx", status: "modified", staged: false },
      {
        path: "src/app/components/DataTable.tsx",
        status: "added",
        staged: false,
      },
    ],
    gitLog: INITIAL_GIT_LOG,

    // ── File operations (Immer makes these clean!) ──
    updateFile: (path, content) =>
      set((state) => {
        state.fileContents[path] = content;
        const tab = state.openTabs.find((t) => t.path === path);
        if (tab) tab.modified = true;
        if (!state.gitChanges.find((c) => c.path === path)) {
          state.gitChanges.push({ path, status: "modified", staged: false });
        }
      }),

    createFile: (path, content = "") =>
      set((state) => {
        state.fileContents[path] = content;
        state.gitChanges = [
          ...state.gitChanges.filter((c) => c.path !== path),
          { path, status: "untracked", staged: false },
        ];
      }),

    deleteFile: (path) =>
      set((state) => {
        delete state.fileContents[path];
        state.openTabs = state.openTabs.filter((t) => t.path !== path);
        state.gitChanges = [
          ...state.gitChanges.filter((c) => c.path !== path),
          { path, status: "deleted", staged: false },
        ];
        if (state.activeFile === path) {
          state.activeFile = "src/app/App.tsx";
        }
      }),

    renameFile: (oldPath, newPath) =>
      set((state) => {
        state.fileContents[newPath] = state.fileContents[oldPath] || "";
        delete state.fileContents[oldPath];
        state.openTabs = state.openTabs.map((t) =>
          t.path === oldPath ? { ...t, path: newPath } : t,
        );
        if (state.activeFile === oldPath) state.activeFile = newPath;
        state.gitChanges = [
          ...state.gitChanges.filter((c) => c.path !== oldPath),
          { path: oldPath, status: "deleted", staged: false },
          { path: newPath, status: "added", staged: false },
        ];
      }),

    // ── Tab operations ──
    setActiveFile: (path) =>
      set((state) => {
        state.activeFile = path;
        if (!state.openTabs.find((t) => t.path === path)) {
          state.openTabs.push({ path, modified: false });
        }
      }),

    openFile: (path) =>
      set((state) => {
        state.activeFile = path;
        if (!state.openTabs.find((t) => t.path === path)) {
          state.openTabs.push({ path, modified: false });
        }
      }),

    closeTab: (path) =>
      set((state) => {
        const filtered = state.openTabs.filter((t) => t.path !== path);
        if (filtered.length === 0) return; // Keep at least one tab
        state.openTabs = filtered;
        if (state.activeFile === path) {
          state.activeFile = filtered[filtered.length - 1].path;
        }
      }),

    closeOtherTabs: (path) =>
      set((state) => {
        state.openTabs = state.openTabs.filter((t) => t.path === path);
        state.activeFile = path;
      }),

    closeAllTabs: () =>
      set((state) => {
        state.openTabs = [{ path: "src/app/App.tsx", modified: false }];
        state.activeFile = "src/app/App.tsx";
      }),

    // ── Git operations ──
    setGitBranch: (branch) =>
      set((state) => {
        state.gitBranch = branch;
      }),

    stageFile: (path) =>
      set((state) => {
        const change = state.gitChanges.find((c) => c.path === path);
        if (change) change.staged = true;
      }),

    unstageFile: (path) =>
      set((state) => {
        const change = state.gitChanges.find((c) => c.path === path);
        if (change) change.staged = false;
      }),

    stageAll: () =>
      set((state) => {
        state.gitChanges.forEach((c) => {
          c.staged = true;
        });
      }),

    unstageAll: () =>
      set((state) => {
        state.gitChanges.forEach((c) => {
          c.staged = false;
        });
      }),

    commitChanges: (message) =>
      set((state) => {
        const staged = state.gitChanges.filter((c) => c.staged);
        if (staged.length === 0) return;

        state.gitLog.unshift({
          hash: Math.random().toString(36).slice(2, 9),
          message,
          author: "开发者",
          date: "刚刚",
          branch: state.gitBranch,
        });
        state.gitChanges = state.gitChanges.filter((c) => !c.staged);
        for (const tab of state.openTabs) {
          if (staged.some((s) => s.path === tab.path)) {
            tab.modified = false;
          }
        }
      }),

    // ── Format ──
    formatCurrentFile: () =>
      set((state) => {
        const { activeFile, fileContents } = state;
        const content = fileContents[activeFile];
        if (!content) return;
        const lang = getLang(activeFile.split("/").pop() || "");
        state.fileContents[activeFile] = simpleFormat(content, lang);
      }),

    // ── Project initialization ──
    initializeProject: (files, entryFile) =>
      set((state) => {
        state.fileContents = files;
        state.openTabs = [
          { path: entryFile || "src/app/App.tsx", modified: false },
        ];
        state.activeFile = entryFile || "src/app/App.tsx";
        state.gitBranch = "main";
        state.gitChanges = [];
        state.gitLog = INITIAL_GIT_LOG;
      }),

    // ── Computed ──
    getFileTree: () => buildTreeFromPaths(get().fileContents),
  })),
);

// ===== Selectors for performance (avoid re-renders) =====
export const selectFileContents = (state: FileStoreState) => state.fileContents;
export const selectOpenTabs = (state: FileStoreState) => state.openTabs;
export const selectActiveFile = (state: FileStoreState) => state.activeFile;
export const selectGitBranch = (state: FileStoreState) => state.gitBranch;
export const selectGitChanges = (state: FileStoreState) => state.gitChanges;
export const selectGitLog = (state: FileStoreState) => state.gitLog;
