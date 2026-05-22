/**
 * @file hooks/useWorkspaceFileSync.ts
 * @description 工作区与 FileStore 联动 Hook — 当切换活跃工作区时，
 *              自动同步 FileStore 的 projectId，保存/恢复工作区对应的
 *              打开标签页和活跃文件状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,workspace,filestore,sync,linkage
 */

import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "../stores/useWorkspaceStore";

const WORKSPACE_FILE_STATE_KEY = "yyc3-workspace-file-states";

interface WorkspaceFileState {
  activeFile: string;
  openTabPaths: string[];
}

/**
 * Save the file state for a given workspace
 */
function saveWorkspaceFileState(
  workspaceId: string,
  state: WorkspaceFileState,
) {
  try {
    const raw = localStorage.getItem(WORKSPACE_FILE_STATE_KEY);
    const all: Record<string, WorkspaceFileState> = raw ? JSON.parse(raw) : {};
    all[workspaceId] = state;
    localStorage.setItem(WORKSPACE_FILE_STATE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

/**
 * Load the file state for a given workspace
 */
function loadWorkspaceFileState(
  workspaceId: string,
): WorkspaceFileState | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_FILE_STATE_KEY);
    if (!raw) return null;
    const all: Record<string, WorkspaceFileState> = JSON.parse(raw);
    return all[workspaceId] || null;
  } catch {
    return null;
  }
}

/**
 * Hook: useWorkspaceFileSync
 *
 * Bridges Workspace activations with FileStore tab/file state.
 * Call inside a component that has access to FileStore context.
 *
 * @param fileStoreApi - Object with activeFile, openTabs, setActiveFile, openFile methods
 */
export function useWorkspaceFileSync(fileStoreApi: {
  activeFile: string;
  openTabs: { path: string }[];
  setActiveFile: (path: string) => void;
  openFile?: (path: string) => void;
}) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const prevWorkspaceRef = useRef<string | null>(null);

  // When workspace changes: save old state, restore new state
  useEffect(() => {
    if (!activeWorkspaceId) return;

    // Save previous workspace's file state
    if (
      prevWorkspaceRef.current &&
      prevWorkspaceRef.current !== activeWorkspaceId
    ) {
      saveWorkspaceFileState(prevWorkspaceRef.current, {
        activeFile: fileStoreApi.activeFile,
        openTabPaths: fileStoreApi.openTabs.map((t) => t.path),
      });
    }

    // Restore new workspace's file state
    const savedState = loadWorkspaceFileState(activeWorkspaceId);
    if (savedState) {
      // Restore open tabs
      if (fileStoreApi.openFile) {
        for (const path of savedState.openTabPaths) {
          fileStoreApi.openFile(path);
        }
      }
      // Restore active file
      if (savedState.activeFile) {
        fileStoreApi.setActiveFile(savedState.activeFile);
      }
    }

    prevWorkspaceRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  // Auto-save current workspace's file state periodically
  useEffect(() => {
    if (!activeWorkspaceId) return;

    const timer = setInterval(() => {
      saveWorkspaceFileState(activeWorkspaceId, {
        activeFile: fileStoreApi.activeFile,
        openTabPaths: fileStoreApi.openTabs.map((t) => t.path),
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [activeWorkspaceId, fileStoreApi.activeFile, fileStoreApi.openTabs]);
}
