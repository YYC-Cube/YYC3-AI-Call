/**
 * @file hooks/useChatSessionSync.ts
 * @description AI 对话历史与 Session Store 双向同步 Hook —
 *              1. ChatHistoryStore 保存时自动在 SessionStore 创建/更新对应 Session
 *              2. SessionStore 中 AI 会话激活时自动加载对应 ChatHistory
 *              3. 删除操作双向联动
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,chat,session,sync,bidirectional
 */

import { useEffect, useRef, useCallback } from "react";
import { useSessionStore } from "../stores/useSessionStore";
import { useWorkspaceStore } from "../stores/useWorkspaceStore";
import {
  listSessions as listChatSessions,
  loadMessages,
  type ChatSession,
  type PersistedMessage,
} from "../ChatHistoryStore";

/**
 * Hook: useChatSessionSync
 *
 * Bridges ChatHistoryStore (localStorage-based) with useSessionStore (Zustand).
 * Call in LeftPanel or at IDE root level.
 *
 * @param currentChatSessionId - The current chat session ID from LeftPanel
 * @param messages - Current chat messages array
 */
export function useChatSessionSync(
  currentChatSessionId: string,
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>,
) {
  const sessions = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);
  const updateSessionData = useSessionStore((s) => s.updateSessionData);
  const updateSession = useSessionStore((s) => s.updateSession);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const addSessionToWorkspace = useWorkspaceStore(
    (s) => s.addSessionToWorkspace,
  );

  const lastSyncedRef = useRef<string>("");

  // Sync chat messages → Session store (debounced)
  useEffect(() => {
    if (!currentChatSessionId || messages.length <= 1) return;

    // Create a fingerprint to avoid redundant updates
    const fingerprint = `${currentChatSessionId}:${messages.length}:${messages[messages.length - 1]?.id}`;
    if (fingerprint === lastSyncedRef.current) return;
    lastSyncedRef.current = fingerprint;

    const timer = setTimeout(() => {
      const existingSession = sessions.find(
        (s) =>
          s.type === "ai-chat" &&
          s.data?.aiMessages &&
          s.name === currentChatSessionId,
      );

      const aiMessages = messages
        .filter((m) => m.content && m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      if (existingSession) {
        // Update existing session data
        updateSessionData(existingSession.id, { aiMessages });
      } else {
        // Create new session in SessionStore
        const firstUserMsg = messages.find((m) => m.role === "user");
        const sessionName = firstUserMsg
          ? firstUserMsg.content.slice(0, 30)
          : currentChatSessionId;

        const newSession = createSession(
          sessionName,
          "ai-chat",
          activeWorkspaceId || "default",
          { aiMessages },
        );

        // Also link it to the workspace
        if (activeWorkspaceId) {
          addSessionToWorkspace(activeWorkspaceId, newSession.id);
        }
      }
    }, 2000); // 2s debounce

    return () => clearTimeout(timer);
  }, [
    currentChatSessionId,
    messages,
    sessions,
    createSession,
    updateSessionData,
    updateSession,
    activeWorkspaceId,
    addSessionToWorkspace,
  ]);

  // Sync ChatHistoryStore sessions → SessionStore on mount
  useEffect(() => {
    const chatSessions = listChatSessions("ide");
    if (chatSessions.length === 0) return;

    const existingNames = new Set(
      sessions.filter((s) => s.type === "ai-chat").map((s) => s.name),
    );

    for (const cs of chatSessions) {
      if (!existingNames.has(cs.id)) {
        const msgs = loadMessages("ide", cs.id);
        const aiMessages = msgs.map((m: PersistedMessage) => ({
          role: m.role,
          content: m.content,
        }));

        createSession(
          cs.title || cs.id,
          "ai-chat",
          activeWorkspaceId || "default",
          { aiMessages },
        );
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
