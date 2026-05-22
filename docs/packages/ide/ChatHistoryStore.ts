/**
 * @file ChatHistoryStore.ts
 * @description AI 对话历史持久化模块，基于 localStorage 管理会话历史，
 *              支持多会话切换、最大条数限制、会话元数据管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags chat,history,persistence,localStorage,sessions
 */

// ── AI 对话历史持久化 (localStorage) ──

const STORAGE_PREFIX = "yyc3_chat_";
const MAX_HISTORY_MESSAGES = 200; // 每个会话最多保存条数
const MAX_SESSIONS = 20; // 最多保存会话数

export interface PersistedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelName?: string;
  error?: string;
  codeBlock?: { lang: string; code: string };
}

export interface ChatSession {
  id: string;
  title: string; // 第一条用户消息的前20字
  messages: PersistedMessage[];
  modelId?: string;
  createdAt: number;
  updatedAt: number;
}

// ── 会话列表管理 ──

function getSessionListKey(scope: "ide" | "chat"): string {
  return `${STORAGE_PREFIX}${scope}_sessions`;
}

export function listSessions(scope: "ide" | "chat"): ChatSession[] {
  try {
    const raw = localStorage.getItem(getSessionListKey(scope));
    if (!raw) return [];
    const sessions: ChatSession[] = JSON.parse(raw);
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function saveSessionList(scope: "ide" | "chat", sessions: ChatSession[]): void {
  try {
    // Trim to max sessions
    const trimmed = sessions
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS);
    localStorage.setItem(getSessionListKey(scope), JSON.stringify(trimmed));
  } catch {}
}

// ── 单个会话消息读写 ──

function getSessionKey(scope: "ide" | "chat", sessionId: string): string {
  return `${STORAGE_PREFIX}${scope}_msg_${sessionId}`;
}

export function loadMessages(
  scope: "ide" | "chat",
  sessionId: string,
): PersistedMessage[] {
  try {
    const raw = localStorage.getItem(getSessionKey(scope, sessionId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMessages(
  scope: "ide" | "chat",
  sessionId: string,
  messages: PersistedMessage[],
  modelId?: string,
): void {
  try {
    // Trim to max
    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
    localStorage.setItem(
      getSessionKey(scope, sessionId),
      JSON.stringify(trimmed),
    );

    // Update session list
    const sessions = listSessions(scope);
    const existing = sessions.find((s) => s.id === sessionId);
    const firstUserMsg = trimmed.find((m) => m.role === "user");
    const title = firstUserMsg?.content.slice(0, 30) || "新对话";

    if (existing) {
      existing.updatedAt = Date.now();
      existing.title = title;
      existing.modelId = modelId;
      existing.messages = trimmed.slice(-3); // Keep last 3 for preview
      saveSessionList(scope, sessions);
    } else {
      sessions.unshift({
        id: sessionId,
        title,
        messages: trimmed.slice(-3),
        modelId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      saveSessionList(scope, sessions);
    }
  } catch {}
}

export function deleteSession(scope: "ide" | "chat", sessionId: string): void {
  try {
    localStorage.removeItem(getSessionKey(scope, sessionId));
    const sessions = listSessions(scope).filter((s) => s.id !== sessionId);
    saveSessionList(scope, sessions);
  } catch {}
}

export function clearAllSessions(scope: "ide" | "chat"): void {
  try {
    const sessions = listSessions(scope);
    for (const s of sessions) {
      localStorage.removeItem(getSessionKey(scope, s.id));
    }
    localStorage.removeItem(getSessionListKey(scope));
  } catch {}
}

// ── 默认会话 ID 生成 ──

export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── 跨 scope 会话导入 (ide → chat 或 chat → ide) ──

export function importFromScope(
  sourceScope: "ide" | "chat",
  targetScope: "ide" | "chat",
  sessionId: string,
): { newSessionId: string; messageCount: number } | null {
  try {
    const messages = loadMessages(sourceScope, sessionId);
    if (messages.length === 0) return null;

    // Create new session id in the target scope
    const newId = createSessionId();
    saveMessages(targetScope, newId, messages);
    return { newSessionId: newId, messageCount: messages.length };
  } catch {
    return null;
  }
}

// ── 列出另一 scope 的会话（用于跨 scope 导入 UI）──

export function listCrossScopeSessions(currentScope: "ide" | "chat"): {
  scope: "ide" | "chat";
  sessions: ChatSession[];
} {
  const otherScope = currentScope === "ide" ? "chat" : "ide";
  return { scope: otherScope, sessions: listSessions(otherScope) };
}
