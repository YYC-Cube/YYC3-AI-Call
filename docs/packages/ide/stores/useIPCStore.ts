/**
 * @file stores/useIPCStore.ts
 * @description IPC 通信管理 Zustand Store — 基于 BroadcastChannel API 实现
 *              跨标签页/跨窗口的消息广播、点对点通信、消息订阅，
 *              替代 Tauri IPC 在 Web 环境下的等效方案
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,ipc,broadcast-channel,zustand
 */

import { create } from "zustand";
import type { IPCMessage, IPCMessageType } from "../types/multi-instance";
import { createLogger } from "../utils/logger";
const log = createLogger("IPC");

const IPC_CHANNEL_NAME = "yyc3-multi-instance";

type MessageHandler = (message: IPCMessage) => void;

interface IPCState {
  instanceId: string;
  messageLog: IPCMessage[];
  isConnected: boolean;
  maxLogSize: number;
}

interface IPCActions {
  initialize: () => () => void;
  broadcast: (type: IPCMessageType, data: unknown) => void;
  sendToInstance: (
    receiverId: string,
    type: IPCMessageType,
    data: unknown,
  ) => void;
  onMessage: (type: IPCMessageType, handler: MessageHandler) => () => void;
  clearLog: () => void;
}

// External handler registry (not in Zustand to avoid serialization issues)
const handlerRegistry = new Map<IPCMessageType, Set<MessageHandler>>();

export const useIPCStore = create<IPCState & IPCActions>()((set, get) => ({
  instanceId: crypto.randomUUID(),
  messageLog: [],
  isConnected: false,
  maxLogSize: 100,

  initialize: () => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(IPC_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<IPCMessage>) => {
        const message = event.data;
        // Skip self-sent messages
        if (message.senderId === get().instanceId) return;
        // If targeted, skip if not for us
        if (message.receiverId && message.receiverId !== get().instanceId)
          return;

        // Add to log
        set((state) => ({
          messageLog: [message, ...state.messageLog].slice(0, state.maxLogSize),
        }));

        // Dispatch to handlers
        const handlers = handlerRegistry.get(message.type);
        if (handlers) {
          handlers.forEach((h) => h(message));
        }
      };
      set({ isConnected: true });
    } catch {
      log.warn("BroadcastChannel not supported");
    }

    return () => {
      channel?.close();
      set({ isConnected: false });
    };
  },

  broadcast: (type, data) => {
    try {
      const channel = new BroadcastChannel(IPC_CHANNEL_NAME);
      const message: IPCMessage = {
        id: crypto.randomUUID(),
        type,
        senderId: get().instanceId,
        data,
        timestamp: Date.now(),
      };
      channel.postMessage(message);
      channel.close();

      set((state) => ({
        messageLog: [message, ...state.messageLog].slice(0, state.maxLogSize),
      }));
    } catch {
      // BroadcastChannel not available
    }
  },

  sendToInstance: (receiverId, type, data) => {
    try {
      const channel = new BroadcastChannel(IPC_CHANNEL_NAME);
      const message: IPCMessage = {
        id: crypto.randomUUID(),
        type,
        senderId: get().instanceId,
        receiverId,
        data,
        timestamp: Date.now(),
      };
      channel.postMessage(message);
      channel.close();
    } catch {
      // BroadcastChannel not available
    }
  },

  onMessage: (type, handler) => {
    if (!handlerRegistry.has(type)) {
      handlerRegistry.set(type, new Set());
    }
    handlerRegistry.get(type)!.add(handler);
    return () => {
      handlerRegistry.get(type)?.delete(handler);
    };
  },

  clearLog: () => set({ messageLog: [] }),
}));
