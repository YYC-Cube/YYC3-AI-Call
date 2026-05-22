/**
 * @file CollabService.ts
 * @description Yjs 实时协作服务 — 基于 CRDT 的文档同步引擎，
 *              支持离线优先、自动重连、感知光标、冲突解决、
 *              可接入 y-websocket / y-indexeddb / y-webrtc 传输层
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags collaboration,yjs,crdt,realtime,sync,awareness
 */

import { createLogger } from "./utils/logger";
const log = createLogger("CollabService");
import * as Y from "yjs";

// ================================================================
// CollabService — Yjs 实时协作服务
// ================================================================
//
// 架构:
//   ┌─────────────────────────────────────────┐
//   │           CollabService                  │
//   │  ┌──────────┐  ┌──────────┐  ┌───────┐ │
//   │  │ Y.Doc    │  │ Awareness│  │ Sync  │ │
//   │  │ (CRDT)   │  │ (Cursors)│  │ State │ │
//   │  └──────────┘  └──────────┘  └───────┘ │
//   └──────────────┬──────────────────────────┘
//                  ↓
//   ┌─────────────────────────────────────────┐
//   │         Transport Layer (pluggable)      │
//   │  ┌──────────┐ ┌──────────┐ ┌──────────┐│
//   │  │WebSocket │ │IndexedDB │ │  WebRTC  ││
//   │  └──────────┘ └──────────┘ └──────────┘│
//   └─────────────────────────────────────────┘
//
// 使用示例:
//   const collab = CollabService.create("doc-123", { userName: "Dev" })
//   collab.onUpdate((update) => { ... })
//   collab.getText("main").insert(0, "Hello")
//   collab.destroy()
// ================================================================

// ── Types ──

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  lastActive: number;
}

export interface CursorPosition {
  filePath: string;
  line: number;
  column: number;
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface CollabEvent {
  type:
    | "user-joined"
    | "user-left"
    | "user-cursor-moved"
    | "document-updated"
    | "conflict-detected"
    | "connection-status"
    | "sync-complete";
  payload: unknown;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface CollabServiceOptions {
  userName: string;
  userColor?: string;
  serverUrl?: string;
  offlineFirst?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// ── Default config ──

const DEFAULT_OPTIONS: Required<CollabServiceOptions> = {
  userName: "Anonymous",
  userColor: generateUserColor(),
  serverUrl: "ws://localhost:3201",
  offlineFirst: true,
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
};

const USER_COLORS = [
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#e879f9",
  "#22d3ee",
  "#fb923c",
  "#4ade80",
  "#f472b6",
];

function generateUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

// ── CollabService Class ──

export class CollabService {
  private doc: Y.Doc;
  private documentId: string;
  private options: Required<CollabServiceOptions>;
  private connectionStatus: ConnectionStatus = "disconnected";
  private localUser: CollabUser;
  private remoteUsers = new Map<string, CollabUser>();
  private eventHandlers = new Map<string, Set<(event: CollabEvent) => void>>();
  private undoManager: Y.UndoManager | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private updateCallbacks = new Set<(update: Uint8Array) => void>();

  // ── Static factory ──

  static create(
    documentId: string,
    options: CollabServiceOptions,
  ): CollabService {
    return new CollabService(documentId, options);
  }

  private constructor(documentId: string, options: CollabServiceOptions) {
    this.documentId = documentId;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.doc = new Y.Doc();

    this.localUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: this.options.userName,
      color: this.options.userColor,
      lastActive: Date.now(),
    };

    // Listen to document updates
    this.doc.on("update", (update: Uint8Array) => {
      this.updateCallbacks.forEach((cb) => cb(update));
      this.emitEvent({
        type: "document-updated",
        payload: { size: update.length },
      });
    });

    // Connect if server URL is provided
    if (this.options.serverUrl) {
      this.connect();
    }
  }

  // ── Connection Management ──

  connect(): void {
    if (this.connectionStatus === "connected") return;

    this.setConnectionStatus("connecting");

    // NOTE: In a real implementation, this would create a WebSocketProvider:
    //   import { WebsocketProvider } from "y-websocket"
    //   this.wsProvider = new WebsocketProvider(
    //     this.options.serverUrl,
    //     this.documentId,
    //     this.doc
    //   )
    //
    // For now, we simulate the connection:
    setTimeout(() => {
      this.setConnectionStatus("connected");
      this.emitEvent({
        type: "connection-status",
        payload: { status: "connected" },
      });
      this.emitEvent({
        type: "sync-complete",
        payload: { documentId: this.documentId },
      });
      this.reconnectAttempts = 0;
    }, 500);
  }

  disconnect(): void {
    this.setConnectionStatus("disconnected");
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.emitEvent({
      type: "connection-status",
      payload: { status: "disconnected" },
    });
  }

  private attemptReconnect(): void {
    if (
      !this.options.autoReconnect ||
      this.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      this.setConnectionStatus("error");
      return;
    }

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // ── Document Operations ──

  getText(name: string = "main"): Y.Text {
    return this.doc.getText(name);
  }

  getMap(name: string = "meta"): Y.Map<unknown> {
    return this.doc.getMap(name);
  }

  getArray(name: string = "items"): Y.Array<unknown> {
    return this.doc.getArray(name);
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  // ── File Content Sync ──

  setFileContent(filePath: string, content: string): void {
    const filesMap = this.doc.getMap("files");
    const fileText = filesMap.get(filePath) as Y.Text | undefined;

    if (fileText) {
      this.doc.transact(() => {
        fileText.delete(0, fileText.length);
        fileText.insert(0, content);
      });
    } else {
      const newText = new Y.Text(content);
      filesMap.set(filePath, newText);
    }
  }

  getFileContent(filePath: string): string | null {
    const filesMap = this.doc.getMap("files");
    const fileText = filesMap.get(filePath) as Y.Text | undefined;
    return fileText ? fileText.toString() : null;
  }

  observeFile(
    filePath: string,
    callback: (content: string) => void,
  ): () => void {
    const filesMap = this.doc.getMap("files");
    const handler = () => {
      const fileText = filesMap.get(filePath) as Y.Text | undefined;
      if (fileText) {
        callback(fileText.toString());
      }
    };
    filesMap.observe(handler);
    return () => filesMap.unobserve(handler);
  }

  // ── Undo/Redo ──

  enableUndoManager(scope: Y.Text | Y.Array<unknown> | Y.Map<unknown>): void {
    this.undoManager = new Y.UndoManager(scope);
  }

  undo(): void {
    this.undoManager?.undo();
  }

  redo(): void {
    this.undoManager?.redo();
  }

  canUndo(): boolean {
    return this.undoManager?.canUndo() ?? false;
  }

  canRedo(): boolean {
    return this.undoManager?.canRedo() ?? false;
  }

  // ── Awareness (Cursors) ──

  updateCursor(cursor: CursorPosition): void {
    this.localUser.cursor = cursor;
    this.localUser.lastActive = Date.now();

    this.emitEvent({
      type: "user-cursor-moved",
      payload: { user: this.localUser, cursor },
    });
  }

  getLocalUser(): CollabUser {
    return { ...this.localUser };
  }

  getRemoteUsers(): CollabUser[] {
    return Array.from(this.remoteUsers.values());
  }

  getAllUsers(): CollabUser[] {
    return [this.localUser, ...this.getRemoteUsers()];
  }

  // ── Simulated Remote Users (for demo) ──

  simulateRemoteUser(user: Omit<CollabUser, "lastActive">): () => void {
    const remoteUser: CollabUser = {
      ...user,
      lastActive: Date.now(),
    };
    this.remoteUsers.set(user.id, remoteUser);

    this.emitEvent({
      type: "user-joined",
      payload: { user: remoteUser },
    });

    return () => {
      this.remoteUsers.delete(user.id);
      this.emitEvent({
        type: "user-left",
        payload: { user: remoteUser },
      });
    };
  }

  // ── Update Callbacks ──

  onUpdate(callback: (update: Uint8Array) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  // Apply remote update
  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
  }

  // Get full document state
  getState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  // ── Event System ──

  on(eventType: string, handler: (event: CollabEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
    return () => this.eventHandlers.get(eventType)?.delete(handler);
  }

  private emitEvent(event: CollabEvent): void {
    this.eventHandlers.get(event.type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        log.error("Event handler error:", e);
      }
    });
    // Also emit to wildcard listeners
    this.eventHandlers.get("*")?.forEach((handler) => {
      try {
        handler(event);
      } catch {}
    });
  }

  // ── Snapshot & Merge ──

  createSnapshot(): { id: string; state: Uint8Array; timestamp: number } {
    return {
      id: `snap-${Date.now()}`,
      state: this.getState(),
      timestamp: Date.now(),
    };
  }

  restoreFromSnapshot(state: Uint8Array): void {
    const newDoc = new Y.Doc();
    Y.applyUpdate(newDoc, state);

    // Merge snapshot into current doc
    const update = Y.encodeStateAsUpdate(newDoc);
    Y.applyUpdate(this.doc, update);
    newDoc.destroy();
  }

  // ── Statistics ──

  getStats(): {
    documentId: string;
    connectionStatus: ConnectionStatus;
    localUser: CollabUser;
    remoteUserCount: number;
    documentSize: number;
  } {
    return {
      documentId: this.documentId,
      connectionStatus: this.connectionStatus,
      localUser: this.localUser,
      remoteUserCount: this.remoteUsers.size,
      documentSize: this.getState().length,
    };
  }

  // ── Cleanup ──

  destroy(): void {
    this.disconnect();
    this.undoManager?.destroy();
    this.doc.destroy();
    this.eventHandlers.clear();
    this.updateCallbacks.clear();
    this.remoteUsers.clear();
  }
}

// ── Singleton instance management ──

const instances = new Map<string, CollabService>();

export function getOrCreateCollab(
  documentId: string,
  options: CollabServiceOptions,
): CollabService {
  let instance = instances.get(documentId);
  if (!instance) {
    instance = CollabService.create(documentId, options);
    instances.set(documentId, instance);
  }
  return instance;
}

export function destroyCollab(documentId: string): void {
  const instance = instances.get(documentId);
  if (instance) {
    instance.destroy();
    instances.delete(documentId);
  }
}

export function destroyAllCollab(): void {
  instances.forEach((instance) => instance.destroy());
  instances.clear();
}
