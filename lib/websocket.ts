/**
 * @fileoverview WebSocket 实时通信服务
 * @description 支持实时语音传输、呼叫状态同步、消息推送等功能
 * @module lib/websocket
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-22
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AuthService } from './auth';

export interface CallSession {
  id: string;
  customerId: string;
  agentId: string;
  status: 'ringing' | 'connected' | 'ended' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface WSMessage {
  type: string;
  payload: any;
  timestamp: Date;
  senderId: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private activeSessions: Map<string, CallSession> = new Map();
  private onlineAgents: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket 服务初始化完成');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', async (socket) => {
      console.log(`🔗 客户端连接: ${socket.id}`);

      try {
        // 验证认证令牌
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          socket.emit('error', { message: '未提供认证令牌' });
          socket.disconnect(true);
          return;
        }

        const payload = AuthService.verifyAccessToken(token as string);
        if (!payload) {
          socket.emit('error', { message: '无效或过期的令牌' });
          socket.disconnect(true);
          return;
        }

        // 将用户 ID 存储到 socket 数据中
        socket.data.userId = payload.userId;
        socket.data.role = payload.role;

        // 添加到在线代理列表
        if (payload.role === 'AGENT' || payload.role === 'MANAGER') {
          if (!this.onlineAgents.has(payload.userId)) {
            this.onlineAgents.set(payload.userId, new Set());
          }
          this.onlineAgents.get(payload.userId)!.add(socket.id);

          // 广播在线状态
          this.io.emit('agent:online', { agentId: payload.userId });
        }

        // 发送欢迎消息
        socket.emit('connected', {
          message: '连接成功',
          userId: payload.userId,
          serverTime: new Date().toISOString(),
        });

        // 设置事件监听器
        this.setupSocketEventHandlers(socket);

      } catch (error) {
        console.error('❌ WebSocket 连接处理失败:', error);
        socket.emit('error', { message: '连接失败' });
        socket.disconnect(true);
      }
    });
  }

  private setupSocketEventHandlers(socket: Socket): void {
    // 呼叫相关事件
    socket.on('call:initiate', async (data) => await this.handleCallInitiate(socket, data));
    socket.on('call:answer', async (data) => await this.handleCallAnswer(socket, data));
    socket.on('call:end', async (data) => await this.handleCallEnd(socket, data));
    socket.on('call:hold', async (data) => await this.handleCallHold(socket, data));
    socket.on('call:resume', async (data) => await this.handleCallResume(socket, data));

    // 音频流事件
    socket.on('audio:stream', async (data) => await this.handleAudioStream(socket, data));
    socket.on('audio:response', async (data) => await this.handleAudioResponse(socket, data));

    // 状态同步事件
    socket.on('status:update', async (data) => await this.handleStatusUpdate(socket, data));

    // 断开连接事件
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // 心跳检测
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
  }

  private async handleCallInitiate(socket: Socket, data: any): Promise<void> {
    const { customerId } = data;
    const callId = `call_${Date.now()}_${socket.id}`;

    // 创建会话
    const session: CallSession = {
      id: callId,
      customerId,
      agentId: socket.data.userId,
      status: 'ringing',
      startTime: new Date(),
    };

    this.activeSessions.set(callId, session);

    // 通知所有相关客户端
    socket.emit('call:started', {
      callId,
      status: 'ringing',
      session,
    });

    // 如果有其他客服在线，通知他们
    this.broadcastToAgentTeam(socket.data.userId, 'call:initiated', {
      callId,
      agentId: socket.data.userId,
      customerId,
      status: 'ringing',
    });
  }

  private async handleCallAnswer(socket: Socket, data: any): Promise<void> {
    const { callId } = data;
    const session = this.activeSessions.get(callId);

    if (session && session.agentId === socket.data.userId) {
      session.status = 'connected';
      this.activeSessions.set(callId, session);

      socket.emit('call:connected', { callId, status: 'connected' });
      this.broadcastToAgentTeam(socket.data.userId, 'call:connected', {
        callId,
        status: 'connected',
      });
    }
  }

  private async handleCallEnd(socket: Socket, data: any): Promise<void> {
    const { callId, duration } = data;
    const session = this.activeSessions.get(callId);

    if (session && session.agentId === socket.data.userId) {
      session.status = 'ended';
      session.endTime = new Date();
      session.duration = duration || (Date.now() - session.startTime!.getTime()) / 1000;

      this.activeSessions.set(callId, session);

      socket.emit('call:ended', {
        callId,
        status: 'ended',
        duration: session.duration,
      });

      this.broadcastToAgentTeam(socket.data.userId, 'call:ended', {
        callId,
        status: 'ended',
        duration: session.duration,
      });

      // 清理会话（延迟5秒后删除）
      setTimeout(() => {
        this.activeSessions.delete(callId);
      }, 5000);
    }
  }

  private async handleCallHold(socket: Socket, data: any): Promise<void> {
    const { callId } = data;
    socket.to(callId).emit('call:onhold', { callId });
  }

  private async handleCallResume(socket: Socket, data: any): Promise<void> {
    const { callId } = data;
    socket.to(callId).emit('call:resumed', { callId });
  }

  private async handleAudioStream(socket: Socket, data: any): Promise<void> {
    const { callId, audioData } = data;

    // 转发音频数据给其他参与者
    socket.to(callId).emit('audio:stream', {
      callId,
      audioData,
      fromAgentId: socket.data.userId,
      timestamp: new Date(),
    });
  }

  private async handleAudioResponse(socket: Socket, data: any): Promise<void> {
    const { callId, audioData } = data;

    // 发送 AI 生成的响应音频给客户端
    socket.to(callId).emit('audio:response', {
      callId,
      audioData,
      timestamp: new Date(),
    });
  }

  private async handleStatusUpdate(socket: Socket, data: any): Promise<void> {
    const { type, status } = data;

    // 广播状态更新给团队
    this.io.emit(`agent:${type}`, {
      agentId: socket.data.userId,
      status,
      timestamp: new Date(),
    });
  }

  private handleDisconnect(socket: Socket): void {
    const userId = socket.data.userId;

    console.log(`🔌 客户端断开: ${socket.id} (用户: ${userId})`);

    // 从在线列表中移除
    if (userId && this.onlineAgents.has(userId)) {
      this.onlineAgents.get(userId)!.delete(socket.id);

      if (this.onlineAgents.get(userId)!.size === 0) {
        this.onlineAgents.delete(userId);
        this.io.emit('agent:offline', { agentId: userId });
      }
    }

    // 结束进行中的会话
    for (const [callId, session] of this.activeSessions.entries()) {
      if (session.agentId === userId && session.status !== 'ended') {
        session.status = 'failed';
        session.endTime = new Date();
        this.activeSessions.set(callId, session);

        this.io.emit('call:failed', {
          callId,
          reason: 'Agent disconnected',
        });
      }
    }
  }

  /**
   * 向代理团队广播消息
   */
  private broadcastToAgentTeam(excludeUserId: string, event: string, data: any): void {
    for (const [userId, socketIds] of this.onlineAgents.entries()) {
      if (userId !== excludeUserId) {
        for (const socketId of socketIds) {
          this.io.to(socketId).emit(event, data);
        }
      }
    }
  }

  /**
   * 获取在线代理数量
   */
  getOnlineAgentCount(): number {
    return this.onlineAgents.size;
  }

  /**
   * 获取活跃会话数量
   */
  getActiveSessionCount(): number {
    let count = 0;
    for (const session of this.activeSessions.values()) {
      if (session.status === 'connected' || session.status === 'ringing') {
        count++;
      }
    }
    return count;
  }

  /**
   * 获取服务健康状态
   */
  getHealthStatus(): {
    connectedClients: number;
    onlineAgents: number;
    activeCalls: number;
  } {
    return {
      connectedClients: this.io.engine.clientsCount,
      onlineAgents: this.onlineAgents.size,
      activeCalls: this.getActiveSessionCount(),
    };
  }
}
