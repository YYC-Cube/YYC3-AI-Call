/**
 * @file FileStore.tsx
 * @description 文件系统 Context Provider，管理文件内容、文件树、标签页、
 *              Git 状态模拟、格式化、IndexedDB 持久化、项目 ID 路由
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.5.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags files,context,provider,indexeddb,git,tabs
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  debouncedSaveFiles,
  immediateSaveFiles,
  loadAllFiles,
  saveProject,
} from "./adapters/IndexedDBAdapter";
import { FILE_CONTENTS, type FileNode } from "./fileData";
import { errorReporting } from "./services/ErrorReportingService";

// ===== Constants =====
const DEFAULT_PROJECT_ID = "yyc3-default";

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

interface FileStoreContextType {
  // File contents
  fileContents: Record<string, string>;
  updateFile: (path: string, content: string) => void;
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;

  // File tree
  fileTree: FileNode[];

  // Tabs
  openTabs: OpenTab[];
  activeFile: string;
  setActiveFile: (path: string) => void;
  openFile: (path: string) => void;
  closeTab: (path: string) => void;
  closeOtherTabs: (path: string) => void;
  closeAllTabs: () => void;

  // Git state
  gitBranch: string;
  setGitBranch: (branch: string) => void;
  gitChanges: GitChange[];
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  stageAll: () => void;
  unstageAll: () => void;
  commitChanges: (message: string) => void;
  gitLog: GitLogEntry[];

  // Format
  formatCurrentFile: () => void;
}

export interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

const FileStoreContext = createContext<FileStoreContextType | null>(null);

export function useFileStore() {
  const ctx = useContext(FileStoreContext);
  if (!ctx) throw new Error("useFileStore must be inside FileStoreProvider");
  return ctx;
}

// ===== Helper: build tree from paths =====
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

// Simple code formatter (indent normalization)
function simpleFormat(code: string, lang: string): string {
  if (lang === "json") {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      return code;
    }
  }
  // Basic indent normalization for TS/JS/CSS
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

    if (closers.test(line)) {
      indent = Math.max(0, indent - 1);
    }

    formatted.push("  ".repeat(indent) + line);

    if (openers.test(line) && !line.startsWith("//") && !line.startsWith("*")) {
      indent++;
    }
  }

  return formatted.join("\n");
}

// ===== Initial git log =====
const INITIAL_GIT_LOG: GitLogEntry[] = [
  {
    hash: "a1b2c3d",
    message: "feat: \u6DFB\u52A0\u6570\u636E\u8868\u683C\u7EC4\u4EF6",
    author: "\u5F00\u53D1\u8005",
    date: "2 \u5C0F\u65F6\u524D",
    branch: "main",
  },
  {
    hash: "e4f5g6h",
    message: "fix: \u4FEE\u590D\u4FA7\u8FB9\u680F\u5BFC\u822A\u9AD8\u4EAE",
    author: "\u5F00\u53D1\u8005",
    date: "5 \u5C0F\u65F6\u524D",
    branch: "main",
  },
  {
    hash: "i7j8k9l",
    message: "refactor: \u91CD\u6784 Header \u7EC4\u4EF6",
    author: "\u534F\u4F5C\u8005",
    date: "\u6628\u5929",
    branch: "main",
  },
  {
    hash: "m0n1o2p",
    message: "chore: \u521D\u59CB\u5316\u9879\u76EE\u7ED3\u6784",
    author: "\u5F00\u53D1\u8005",
    date: "3 \u5929\u524D",
    branch: "main",
  },
];

// ===== Provider =====
export function FileStoreProvider({ children }: { children: React.ReactNode }) {
  const [fileContents, setFileContents] =
    useState<Record<string, string>>(FILE_CONTENTS);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    { path: "src/app/App.tsx", modified: false },
  ]);
  const [activeFile, setActiveFileState] = useState("src/app/App.tsx");
  const [gitBranch, setGitBranch] = useState("main");
  const [gitChanges, setGitChanges] = useState<GitChange[]>([
    { path: "src/app/App.tsx", status: "modified", staged: false },
    {
      path: "src/app/components/DataTable.tsx",
      status: "added",
      staged: false,
    },
  ]);
  const [gitLog, setGitLog] = useState<GitLogEntry[]>(INITIAL_GIT_LOG);
  const idbLoadedRef = useRef(false);

  const fileTree = useMemo(
    () => buildTreeFromPaths(fileContents),
    [fileContents],
  );

  // -- IndexedDB: Load persisted files on mount --
  useEffect(() => {
    if (idbLoadedRef.current) return;
    idbLoadedRef.current = true;

    loadAllFiles(DEFAULT_PROJECT_ID)
      .then((persisted) => {
        if (persisted && Object.keys(persisted).length > 0) {
          // Merge: persisted files take priority, fall back to defaults
          setFileContents((prev) => ({ ...prev, ...persisted }));
          console.log(
            `[IndexedDB] Loaded ${Object.keys(persisted).length} persisted files`,
          );
        }
      })
      .catch((err) => {
        console.warn("[IndexedDB] Failed to load files:", err);
        errorReporting.captureError(err, { category: "file_system" });
      });
  }, []);

  // -- IndexedDB: Debounced auto-save on file content changes --
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Skip the first render (initial FILE_CONTENTS load)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    debouncedSaveFiles(DEFAULT_PROJECT_ID, fileContents);
  }, [fileContents]);

  const updateFile = useCallback((path: string, content: string) => {
    setFileContents((prev) => ({ ...prev, [path]: content }));
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, modified: true } : t)),
    );
    // Auto-add to git changes
    setGitChanges((prev) => {
      const existing = prev.find((c) => c.path === path);
      if (existing) return prev;
      return [...prev, { path, status: "modified", staged: false }];
    });
  }, []);

  const createFile = useCallback((path: string, content: string = "") => {
    setFileContents((prev) => {
      const next = { ...prev, [path]: content };
      // Immediate save for create operations
      immediateSaveFiles(DEFAULT_PROJECT_ID, next);
      return next;
    });
    setGitChanges((prev) => [
      ...prev.filter((c) => c.path !== path),
      { path, status: "untracked", staged: false },
    ]);
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFileContents((prev) => {
      const next = { ...prev };
      delete next[path];
      // Immediate save for delete operations
      immediateSaveFiles(DEFAULT_PROJECT_ID, next);
      return next;
    });
    setOpenTabs((prev) => prev.filter((t) => t.path !== path));
    setGitChanges((prev) => [
      ...prev.filter((c) => c.path !== path),
      { path, status: "deleted", staged: false },
    ]);
    setActiveFileState((prev) => {
      if (prev === path) {
        // Switch to first remaining tab or default
        return "src/app/App.tsx";
      }
      return prev;
    });
  }, []);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    setFileContents((prev) => {
      const next = { ...prev };
      next[newPath] = next[oldPath] || "";
      delete next[oldPath];
      // Immediate save for rename operations
      immediateSaveFiles(DEFAULT_PROJECT_ID, next);
      return next;
    });
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === oldPath ? { ...t, path: newPath } : t)),
    );
    setActiveFileState((prev) => (prev === oldPath ? newPath : prev));
    setGitChanges((prev) => [
      ...prev.filter((c) => c.path !== oldPath),
      { path: oldPath, status: "deleted", staged: false },
      { path: newPath, status: "added", staged: false },
    ]);
  }, []);

  const openFile = useCallback((path: string) => {
    setActiveFileState(path);
    setOpenTabs((prev) => {
      if (prev.find((t) => t.path === path)) return prev;
      return [...prev, { path, modified: false }];
    });
  }, []);

  const setActiveFile = useCallback(
    (path: string) => {
      errorReporting.addBreadcrumb({
        type: "click",
        category: "file",
        message: `切换文件: ${path.split("/").pop()}`,
        data: { path },
      });
      openFile(path);
    },
    [openFile],
  );

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => t.path !== path);
        if (next.length === 0) return prev; // Keep at least one tab
        return next;
      });
      setActiveFileState((prev) => {
        if (prev !== path) return prev;
        // Find next tab
        const tabs = openTabs.filter((t) => t.path !== path);
        return tabs.length > 0 ? tabs[tabs.length - 1].path : "src/app/App.tsx";
      });
    },
    [openTabs],
  );

  const closeOtherTabs = useCallback((path: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.path === path));
    setActiveFileState(path);
  }, []);

  const closeAllTabs = useCallback(() => {
    setOpenTabs([{ path: "src/app/App.tsx", modified: false }]);
    setActiveFileState("src/app/App.tsx");
  }, []);

  // Git operations
  const stageFile = useCallback((path: string) => {
    setGitChanges((prev) =>
      prev.map((c) => (c.path === path ? { ...c, staged: true } : c)),
    );
  }, []);

  const unstageFile = useCallback((path: string) => {
    setGitChanges((prev) =>
      prev.map((c) => (c.path === path ? { ...c, staged: false } : c)),
    );
  }, []);

  const stageAll = useCallback(() => {
    setGitChanges((prev) => prev.map((c) => ({ ...c, staged: true })));
  }, []);

  const unstageAll = useCallback(() => {
    setGitChanges((prev) => prev.map((c) => ({ ...c, staged: false })));
  }, []);

  const commitChanges = useCallback(
    (message: string) => {
      const staged = gitChanges.filter((c) => c.staged);
      if (staged.length === 0) return;

      const newEntry: GitLogEntry = {
        hash: Math.random().toString(36).slice(2, 9),
        message,
        author: "\u5F00\u53D1\u8005",
        date: "\u521A\u521A",
        branch: gitBranch,
      };
      setGitLog((prev) => [newEntry, ...prev]);
      setGitChanges((prev) => prev.filter((c) => !c.staged));
      // Mark tabs as unmodified for committed files
      setOpenTabs((prev) =>
        prev.map((t) =>
          staged.some((s) => s.path === t.path) ? { ...t, modified: false } : t,
        ),
      );
    },
    [gitChanges, gitBranch],
  );

  const formatCurrentFile = useCallback(() => {
    setFileContents((prev) => {
      const content = prev[activeFile];
      if (!content) return prev;
      const lang = getLang(activeFile.split("/").pop() || "");
      const formatted = simpleFormat(content, lang);
      return { ...prev, [activeFile]: formatted };
    });
  }, [activeFile]);

  // -- Update project metadata periodically --
  useEffect(() => {
    const totalSize = Object.values(fileContents).reduce(
      (sum, c) => sum + new Blob([c]).size,
      0,
    );
    saveProject({
      id: DEFAULT_PROJECT_ID,
      name: "YYC\u00B3 \u9ED8\u8BA4\u9879\u76EE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileCount: Object.keys(fileContents).length,
      totalSize,
    }).catch(() => {
      // Silently ignore metadata save errors
    });
  }, [fileContents]);

  const ctx = useMemo<FileStoreContextType>(
    () => ({
      fileContents,
      updateFile,
      createFile,
      deleteFile,
      renameFile,
      fileTree,
      openTabs,
      activeFile,
      setActiveFile,
      openFile,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      gitBranch,
      setGitBranch,
      gitChanges,
      stageFile,
      unstageFile,
      stageAll,
      unstageAll,
      commitChanges,
      gitLog,
      formatCurrentFile,
    }),
    [
      fileContents,
      updateFile,
      createFile,
      deleteFile,
      renameFile,
      fileTree,
      openTabs,
      activeFile,
      setActiveFile,
      openFile,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
      gitBranch,
      setGitBranch,
      gitChanges,
      stageFile,
      unstageFile,
      stageAll,
      unstageAll,
      commitChanges,
      gitLog,
      formatCurrentFile,
    ],
  );

  return (
    <FileStoreContext.Provider value={ctx}>
      {children}
    </FileStoreContext.Provider>
  );
}
