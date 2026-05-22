/**
 * @file stores/useSessionStore.ts
 * @description 会话管理 Zustand Store — 管理多会话的创建、激活、暂停、恢复、
 *              会话数据更新，支持 AI 对话、代码编辑、终端等多种会话类型
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,session-manager,zustand
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Session,
  SessionType,
  SessionData,
  SessionStatus,
} from "../types/multi-instance";

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  filter: {
    type?: SessionType;
    workspaceId?: string;
    status?: SessionStatus;
  };
}

interface SessionActions {
  createSession: (
    name: string,
    type: SessionType,
    workspaceId: string,
    data?: SessionData,
  ) => Session;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  deleteSession: (sessionId: string) => void;
  activateSession: (sessionId: string) => void;
  suspendSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  updateSessionData: (sessionId: string, data: Partial<SessionData>) => void;
  updateFilter: (filter: Partial<SessionState["filter"]>) => void;
  getWorkspaceSessions: (workspaceId: string) => Session[];
  getActiveSessions: () => Session[];
}

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      filter: {},

      createSession: (name, type, workspaceId, data = {}) => {
        const session: Session = {
          id: crypto.randomUUID(),
          name,
          type,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "active",
          data,
          workspaceId,
          windowId: "",
        };
        set((state) => ({ sessions: [...state.sessions, session] }));
        return session;
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, ...updates, updatedAt: Date.now() }
              : s,
          ),
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId:
            state.activeSessionId === sessionId ? null : state.activeSessionId,
        }));
      },

      activateSession: (sessionId) => {
        set((state) => ({
          activeSessionId: sessionId,
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: "active" as const } : s,
          ),
        }));
      },

      suspendSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: "suspended" as const } : s,
          ),
        }));
      },

      resumeSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: "active" as const } : s,
          ),
        }));
      },

      updateSessionData: (sessionId, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, data: { ...s.data, ...data }, updatedAt: Date.now() }
              : s,
          ),
        }));
      },

      updateFilter: (filter) => {
        set((state) => ({ filter: { ...state.filter, ...filter } }));
      },

      getWorkspaceSessions: (workspaceId) => {
        return get().sessions.filter((s) => s.workspaceId === workspaceId);
      },

      getActiveSessions: () => {
        return get().sessions.filter((s) => s.status === "active");
      },
    }),
    {
      name: "yyc3-session-storage",
      partialize: (state) => ({ sessions: state.sessions }),
    },
  ),
);
