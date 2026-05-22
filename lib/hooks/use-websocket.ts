'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { WebSocketEventType, type WebSocketMessage } from '@/lib/websocket/types';

interface UseWebSocketOptions {
  url?: string;
  token?: string;
  userId?: string;
  userRole?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

interface WebSocketHookResult {
  isConnected: boolean;
  clientId: string | null;
  sendMessage: (type: WebSocketEventType, payload?: unknown, metadata?: Record<string, unknown>) => boolean;
  subscribeToRoom: (roomId: string) => Promise<boolean>;
  unsubscribeFromRoom: (roomId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}): WebSocketHookResult {
  const {
    url = typeof window !== 'undefined' ? `${window.location.origin.replace('http', 'ws')}/ws` : '',
    token,
    userId,
    userRole,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onError,
    onConnectionChange,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string | null>(null);
  const reconnectCountRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback(() => {
    if (!url || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;

        if (token && userId && userRole) {
          ws.send(JSON.stringify({
            type: 'auth',
            payload: { userId, userRole, token },
          }));
        }

        onConnectionChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          if (message.type === WebSocketEventType.CONNECTION) {
            clientIdRef.current = (message.payload as { clientId: string }).clientId;
          }

          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        clientIdRef.current = null;
        onConnectionChange?.(false);

        if (reconnectCountRef.current < reconnectAttempts) {
          setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, reconnectInterval * reconnectCountRef.current);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, token, userId, userRole, reconnectAttempts, reconnectInterval, onMessage, onError, onConnectionChange]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    clientIdRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectCountRef.current = 0;
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  const sendMessage = useCallback((
    type: WebSocketEventType,
    payload?: unknown,
    metadata?: Record<string, unknown>
  ): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`,
        type,
        timestamp: new Date().toISOString(),
        payload: payload || {},
        metadata,
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }, []);

  const subscribeToRoom = useCallback(async (roomId: string): Promise<boolean> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const response = await fetch('/api/ws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          clientId: clientIdRef.current,
          roomId,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to subscribe to room:', error);
      return false;
    }
  }, []);

  const unsubscribeFromRoom = useCallback((roomId: string) => {
    fetch('/api/ws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'unsubscribe',
        clientId: clientIdRef.current,
        roomId,
      }),
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  return {
    isConnected,
    clientId: clientIdRef.current,
    sendMessage,
    subscribeToRoom,
    unsubscribeFromRoom,
    disconnect,
    reconnect,
    lastMessage,
  };
}
