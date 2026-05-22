// @ts-expect-error ws is an optional runtime dependency
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { WebSocketEventType, type WebSocketMessage } from './types';
import { logger } from '../logger';

interface WSClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  userRole?: string;
  rooms: Set<string>;
  isConnected: boolean;
  lastPing: number;
  metadata: {
    ip: string;
    userAgent?: string;
    connectedAt: number;
  };
}

interface RoomSubscription {
  roomId: string;
  clients: Set<string>;
  createdAt: number;
}

class WebSocketManager {
  private static instance: WebSocketManager;

  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private rooms: Map<string, RoomSubscription> = new Map();

  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  private readonly HEARTBEAT_INTERVAL = 30000; // 30秒
  private readonly CLIENT_TIMEOUT = 60000;     // 60秒无响应则断开
  private readonly MAX_CLIENTS_PER_ROOM = 100; // 每个房间最大客户端数

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  initialize(server: import('http').Server): void {
    if (this.wss) {
      logger.warn('WebSocket server already initialized');
      return;
    }

    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      maxPayload: 1024 * 1024, // 1MB最大消息大小
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 3,
        },
      },
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    this.startCleanup();

    logger.info('WebSocket server initialized', {
      path: '/ws',
      heartbeatInterval: this.HEARTBEAT_INTERVAL,
    });
  }

  private setupEventHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error', error);
    });

    this.wss.on('close', () => {
      logger.info('WebSocket server closed');
      this.stopHeartbeat();
      this.stopCleanup();
    });
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = this.generateClientId();
    
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = typeof forwardedFor === 'string' 
      ? forwardedFor.split(',')[0]?.trim() || 'unknown'
      : Array.isArray(forwardedFor)
        ? forwardedFor[0] || 'unknown'
        : req.socket.remoteAddress || 'unknown';

    const client: WSClient = {
      id: clientId,
      ws,
      rooms: new Set(),
      isConnected: true,
      lastPing: Date.now(),
      metadata: {
        ip: clientIp,
        userAgent: req.headers['user-agent'],
        connectedAt: Date.now(),
      },
    };

    this.clients.set(clientId, client);

    logger.info('WebSocket client connected', {
      clientId,
      ip: clientIp,
      totalClients: this.clients.size,
    });

    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('pong', () => {
      const c = this.clients.get(clientId);
      if (c) {
        c.lastPing = Date.now();
      }
    });

    ws.on('error', (error: Error) => {
      logger.error(`WebSocket error for client ${clientId}`, error);
      this.disconnectClient(clientId);
    });

    this.sendToClient(clientId, {
      id: this.generateMessageId(),
      type: WebSocketEventType.CONNECTION,
      timestamp: new Date().toISOString(),
      payload: { clientId, message: 'Connected successfully' },
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const client = this.clients.get(clientId);
      
      switch (message.type) {
        case WebSocketEventType.PING:
          this.handlePing(clientId);
          break;
          
        case WebSocketEventType.USER_PRESENCE:
          this.handlePresenceUpdate(clientId, message.payload);
          break;
          
        case WebSocketEventType.TYPING_INDICATOR:
          if (message.metadata?.roomId && client?.rooms.has(message.metadata.roomId)) {
            this.broadcastTypingIndicator(clientId, message.payload as Record<string, unknown>, message.metadata.roomId);
          }
          break;
          
        default:
          logger.warn(`Unknown message type from ${clientId}: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Failed to parse message from ${clientId}`, error instanceof Error ? error : new Error(String(error)));
      this.sendError(clientId, 'Invalid message format');
    }
  }

  async authenticateClient(
    clientId: string,
    userId: string,
    userRole: string,
    token: string
  ): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client) return false;

    try {
      const isValid = await this.validateToken(token, userId);
      
      if (isValid) {
        client.userId = userId;
        client.userRole = userRole;

        this.broadcastUserPresence(userId, 'online');

        logger.info(`Client ${clientId} authenticated as user ${userId}`, {
          role: userRole,
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Authentication failed', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  subscribeToRoom(clientId: string, roomId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client || !client.isConnected) return false;

    let room = this.rooms.get(roomId);
    
    if (!room) {
      room = {
        roomId,
        clients: new Set(),
        createdAt: Date.now(),
      };
      this.rooms.set(roomId, room);
    }

    if (room.clients.size >= this.MAX_CLIENTS_PER_ROOM) {
      logger.warn(`Room ${roomId} is full (${this.MAX_CLIENTS_PER_ROOM} clients)`);
      return false;
    }

    client.rooms.add(roomId);
    room.clients.add(clientId);

    logger.debug(`Client ${clientId} subscribed to room ${roomId}`, {
      roomSize: room.clients.size,
    });

    return true;
  }

  unsubscribeFromRoom(clientId: string, roomId: string): void {
    const client = this.clients.get(clientId);
    const room = this.rooms.get(roomId);

    if (client && client.rooms.has(roomId)) {
      client.rooms.delete(roomId);
    }

    if (room && room.clients.has(clientId)) {
      room.clients.delete(clientId);

      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
        logger.debug(`Room ${roomId} removed (empty)`);
      }
    }
  }

  broadcast<T>(
    type: WebSocketEventType,
    payload: T,
    options?: {
      roomId?: string;
      excludeSender?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    }
  ): void {
    const message: WebSocketMessage<T> = {
      id: this.generateMessageId(),
      type,
      timestamp: new Date().toISOString(),
      payload,
      metadata: {
        roomId: options?.roomId,
        priority: options?.priority || 'normal',
      },
    };

    if (options?.roomId) {
      this.broadcastToRoom(options.roomId, message, options.excludeSender);
    } else {
      this.broadcastToAll(message, options?.excludeSender);
    }
  }

  sendToClient<T>(clientId: string, message: WebSocketMessage<T>): boolean {
    const client = this.clients.get(clientId);
    
    if (!client || !client.isConnected || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}`, error instanceof Error ? error : new Error(String(error)));
      this.disconnectClient(clientId);
      return false;
    }
  }

  sendError(clientId: string, errorMessage: string, code?: number): void {
    this.sendToClient(clientId, {
      id: this.generateMessageId(),
      type: WebSocketEventType.ERROR,
      timestamp: new Date().toISOString(),
      payload: {
        error: errorMessage,
        code: code || 400,
      },
    });
  }

  getConnectedClientsCount(): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.isConnected && client.ws.readyState === WebSocket.OPEN) {
        count++;
      }
    }
    return count;
  }

  getRoomInfo(roomId: string): { clients: number; createdAt: number } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      clients: room.clients.size,
      createdAt: room.createdAt,
    };
  }

  getUserOnlineStatus(userId: string): boolean {
    for (const client of this.clients.values()) {
      if (client.userId === userId && client.isConnected) {
        return true;
      }
    }
    return false;
  }

  disconnectClient(clientId: string): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      client.ws.terminate();
      this.handleDisconnection(clientId);
    }
  }

  shutdown(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          this.clients.clear();
          this.rooms.clear();
          this.stopHeartbeat();
          this.stopCleanup();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      client.isConnected = false;

      for (const roomId of client.rooms) {
        this.unsubscribeFromRoom(clientId, roomId);
      }

      if (client.userId) {
        this.broadcastUserPresence(client.userId, 'offline');
      }

      this.clients.delete(clientId);

      logger.info('WebSocket client disconnected', {
        clientId,
        userId: client.userId,
        duration: Date.now() - client.metadata.connectedAt,
        remainingClients: this.clients.size,
      });
    }
  }

  private handlePing(clientId: string): void {
    this.sendToClient(clientId, {
      id: this.generateMessageId(),
      type: WebSocketEventType.PONG,
      timestamp: new Date().toISOString(),
      payload: { timestamp: Date.now() },
    });
  }

  private handlePresenceUpdate(
    clientId: string,
    payload: unknown
  ): void {
    const client = this.clients.get(clientId);
    if (client?.userId) {
      this.broadcastUserPresence(client.userId, payload as 'online' | 'offline' | 'away' | 'busy');
    }
  }

  private broadcastTypingIndicator(
    senderClientId: string,
    payload: Record<string, unknown>,
    roomId: string
  ): void {
    this.broadcastToRoom(
      roomId,
      {
        id: this.generateMessageId(),
        type: WebSocketEventType.TYPING_INDICATOR,
        timestamp: new Date().toISOString(),
        payload: {
          ...payload,
          userId: this.clients.get(senderClientId)?.userId,
        },
      },
      senderClientId
    );
  }

  private broadcastUserPresence(
    userId: string,
    status: 'online' | 'offline' | 'away' | 'busy'
  ): void {
    this.broadcast(WebSocketEventType.USER_PRESENCE, {
      userId,
      status,
      lastSeen: new Date().toISOString(),
    });
  }

  private broadcastToRoom<T>(
    roomId: string,
    message: WebSocketMessage<T>,
    excludeClientId?: string
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const clientId of room.clients) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }
  }

  private broadcastToAll<T>(
    message: WebSocketMessage<T>,
    excludeClientId?: string
  ): void {
    for (const [clientId] of this.clients) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [, client] of this.clients) {
        if (client.isConnected && client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > this.CLIENT_TIMEOUT) {
          logger.warn(`Client ${clientId} timed out (no pong in ${this.CLIENT_TIMEOUT}ms)`);
          this.disconnectClient(clientId);
        }
      }

      this.cleanupEmptyRooms();
    }, 60000); // 每分钟清理一次
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms) {
      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  private generateClientId(): string {
    return `ws_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 12)}`;
  }

  private async validateToken(token: string, userId: string): Promise<boolean> {
    try {
      const { verifyToken } = await import('../auth/jwt');
      const decoded = await verifyToken(token);
      return decoded.userId === userId;
    } catch {
      return false;
    }
  }
}

export const wsManager = WebSocketManager.getInstance();
export { WebSocketManager };
