/**
 * @file stores/useWorkspaceStore.ts
 * @description 工作区管理 Zustand Store — 管理多工作区的创建、切换、复制、
 *              导入/导出、会话关联，支持项目隔离和上下文分离
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,workspace-manager,zustand
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Workspace,
  WorkspaceType,
  WorkspaceConfig,
} from "../types/multi-instance";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  filter: {
    type?: WorkspaceType;
    search?: string;
  };
}

interface WorkspaceActions {
  createWorkspace: (
    name: string,
    type: WorkspaceType,
    config?: WorkspaceConfig,
  ) => Workspace;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (workspaceId: string) => void;
  activateWorkspace: (workspaceId: string) => void;
  duplicateWorkspace: (workspaceId: string) => Workspace;
  exportWorkspace: (workspaceId: string) => string;
  importWorkspace: (data: string) => Workspace;
  updateFilter: (filter: Partial<WorkspaceState["filter"]>) => void;
  addSessionToWorkspace: (workspaceId: string, sessionId: string) => void;
  removeSessionFromWorkspace: (workspaceId: string, sessionId: string) => void;
  getFilteredWorkspaces: () => Workspace[];
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      filter: {},

      createWorkspace: (name, type, config = {}) => {
        const workspace: Workspace = {
          id: crypto.randomUUID(),
          name,
          type,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          sessionIds: [],
          windowIds: [],
          isActive: false,
        };
        set((state) => ({ workspaces: [...state.workspaces, workspace] }));
        return workspace;
      },

      updateWorkspace: (workspaceId, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, ...updates, updatedAt: Date.now() }
              : w,
          ),
        }));
      },

      deleteWorkspace: (workspaceId) => {
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
          activeWorkspaceId:
            state.activeWorkspaceId === workspaceId
              ? null
              : state.activeWorkspaceId,
        }));
      },

      activateWorkspace: (workspaceId) => {
        set((state) => ({
          activeWorkspaceId: workspaceId,
          workspaces: state.workspaces.map((w) => ({
            ...w,
            isActive: w.id === workspaceId,
          })),
        }));
      },

      duplicateWorkspace: (workspaceId) => {
        const original = get().workspaces.find((w) => w.id === workspaceId);
        if (!original) throw new Error("Workspace not found");

        const duplicated: Workspace = {
          ...original,
          id: crypto.randomUUID(),
          name: `${original.name} (副本)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sessionIds: [],
          windowIds: [],
          isActive: false,
        };
        set((state) => ({ workspaces: [...state.workspaces, duplicated] }));
        return duplicated;
      },

      exportWorkspace: (workspaceId) => {
        const workspace = get().workspaces.find((w) => w.id === workspaceId);
        if (!workspace) throw new Error("Workspace not found");
        return JSON.stringify(workspace, null, 2);
      },

      importWorkspace: (data) => {
        const workspace: Workspace = JSON.parse(data);
        workspace.id = crypto.randomUUID();
        workspace.createdAt = Date.now();
        workspace.updatedAt = Date.now();
        workspace.isActive = false;
        set((state) => ({ workspaces: [...state.workspaces, workspace] }));
        return workspace;
      },

      updateFilter: (filter) => {
        set((state) => ({ filter: { ...state.filter, ...filter } }));
      },

      addSessionToWorkspace: (workspaceId, sessionId) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  sessionIds: [...w.sessionIds, sessionId],
                  updatedAt: Date.now(),
                }
              : w,
          ),
        }));
      },

      removeSessionFromWorkspace: (workspaceId, sessionId) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  sessionIds: w.sessionIds.filter((id) => id !== sessionId),
                  updatedAt: Date.now(),
                }
              : w,
          ),
        }));
      },

      getFilteredWorkspaces: () => {
        const { workspaces, filter } = get();
        return workspaces.filter((w) => {
          if (filter.type && w.type !== filter.type) return false;
          if (
            filter.search &&
            !w.name.toLowerCase().includes(filter.search.toLowerCase())
          )
            return false;
          return true;
        });
      },
    }),
    {
      name: "yyc3-workspace-storage",
      partialize: (state) => ({ workspaces: state.workspaces }),
    },
  ),
);
