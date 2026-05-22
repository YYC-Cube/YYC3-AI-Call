export enum WebSocketEventType {
  CONNECTION = 'connection',
  DISCONNECTION = 'disconnection',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',

  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_STATUS_CHANGED = 'task:status_changed',
  TASK_PROGRESS = 'task:progress',

  CALL_STARTED = 'call:started',
  CALL_ENDED = 'call:ended',
  CALL_STATUS_UPDATED = 'call:status_updated',
  CALL_TRANSCRIPT = 'call:transcript',
  CALL_EMOTION = 'call:emotion',

  AGENT_CONFIG_CHANGED = 'agent:config_changed',
  SYSTEM_NOTIFICATION = 'system:notification',
  USER_PRESENCE = 'user:presence',
  TYPING_INDICATOR = 'typing:indicator',
}

export interface WebSocketMessage<T = unknown> {
  id: string;
  type: WebSocketEventType;
  timestamp: string;
  payload: T;
  sender?: {
    id: string;
    role: string;
  };
  metadata?: {
    roomId?: string;
    correlationId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
}

export interface TaskEventPayload {
  taskId: string;
  status: string;
  progress?: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  metadata?: Record<string, unknown>;
}

export interface CallEventPayload {
  callRecordId: string;
  taskId: string;
  phoneNumber: string;
  status: 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer';
  duration?: number;
  transcript?: {
    text: string;
    confidence: number;
    timestamp: number;
  };
  emotion?: {
    type: string;
    confidence: number;
    intensity: number;
  };
}

export interface SystemNotificationPayload {
  level: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  autoDismiss?: boolean;
  dismissAfter?: number;
}

export interface UserPresencePayload {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  currentTask?: string;
}

export interface TypingIndicatorPayload {
  userId: string;
  roomId: string;
  isTyping: boolean;
}

export type WSPayloadMap = {
  [WebSocketEventType.TASK_CREATED]: TaskEventPayload;
  [WebSocketEventType.TASK_UPDATED]: TaskEventPayload;
  [WebSocketEventType.TASK_STATUS_CHANGED]: TaskEventPayload;
  [WebSocketEventType.TASK_PROGRESS]: TaskEventPayload;
  [WebSocketEventType.CALL_STARTED]: CallEventPayload;
  [WebSocketEventType.CALL_ENDED]: CallEventPayload;
  [WebSocketEventType.CALL_STATUS_UPDATED]: CallEventPayload;
  [WebSocketEventType.CALL_TRANSCRIPT]: { callRecordId: string; transcript: CallEventPayload['transcript'] };
  [WebSocketEventType.CALL_EMOTION]: { callRecordId: string; emotion: CallEventPayload['emotion'] };
  [WebSocketEventType.AGENT_CONFIG_CHANGED]: { agentId: string; configChanges: Record<string, unknown> };
  [WebSocketEventType.SYSTEM_NOTIFICATION]: SystemNotificationPayload;
  [WebSocketEventType.USER_PRESENCE]: UserPresencePayload;
  [WebSocketEventType.TYPING_INDICATOR]: TypingIndicatorPayload;
};
