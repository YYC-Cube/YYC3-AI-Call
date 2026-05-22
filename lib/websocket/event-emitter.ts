import { WebSocketEventType, type TaskEventPayload, type CallEventPayload, type SystemNotificationPayload } from './types';
import { wsManager } from './manager';
import { logger } from '../logger';

class EventEmitter {
  emitTaskCreated(taskId: string, taskData?: Partial<TaskEventPayload>): void {
    const payload: TaskEventPayload = {
      taskId,
      status: taskData?.status ?? 'created',
      ...taskData,
    };

    wsManager.broadcast(WebSocketEventType.TASK_CREATED, payload, {
      roomId: `task:${taskId}`,
      priority: 'normal',
    });

    logger.debug('Task created event emitted', { taskId });
  }

  emitTaskUpdated(taskId: string, updates: Partial<TaskEventPayload>): void {
    const payload: TaskEventPayload = {
      taskId,
      status: updates.status ?? 'updated',
      ...updates,
    };

    wsManager.broadcast(WebSocketEventType.TASK_UPDATED, payload, {
      roomId: `task:${taskId}`,
      priority: 'normal',
    });

    logger.debug('Task updated event emitted', { taskId, ...updates });
  }

  emitTaskStatusChanged(
    taskId: string,
    newStatus: string,
    progress?: TaskEventPayload['progress']
  ): void {
    const payload: TaskEventPayload = {
      taskId,
      status: newStatus,
      progress,
    };

    wsManager.broadcast(WebSocketEventType.TASK_STATUS_CHANGED, payload, {
      roomId: `task:${taskId}`,
      priority: progress?.percentage === 100 ? 'high' : 'normal',
    });

    logger.info('Task status changed', { taskId, newStatus, progress });
  }

  emitCallStarted(callRecordId: string, taskId: string, phoneNumber: string): void {
    const payload: CallEventPayload = {
      callRecordId,
      taskId,
      phoneNumber,
      status: 'ringing',
    };

    wsManager.broadcast(WebSocketEventType.CALL_STARTED, payload, {
      roomId: `call:${taskId}`,
      priority: 'high',
    });

    logger.info('Call started event emitted', { callRecordId, phoneNumber });
  }

  emitCallEnded(
    callRecordId: string,
    taskId: string,
    phoneNumber: string,
    duration: number,
    finalStatus: 'completed' | 'failed' | 'no_answer'
  ): void {
    const payload: CallEventPayload = {
      callRecordId,
      taskId,
      phoneNumber,
      status: finalStatus,
      duration,
    };

    wsManager.broadcast(WebSocketEventType.CALL_ENDED, payload, {
      roomId: `call:${taskId}`,
      priority: finalStatus === 'failed' ? 'critical' : 'high',
    });

    logger.info('Call ended event emitted', { callRecordId, duration, finalStatus });
  }

  emitCallStatusUpdated(
    callRecordId: string,
    taskId: string,
    phoneNumber: string,
    newStatus: CallEventPayload['status']
  ): void {
    const payload: CallEventPayload = {
      callRecordId,
      taskId,
      phoneNumber,
      status: newStatus,
    };

    wsManager.broadcast(WebSocketEventType.CALL_STATUS_UPDATED, payload, {
      roomId: `call:${taskId}`,
      priority: 'normal',
    });
  }

  emitTranscriptUpdate(
    callRecordId: string,
    taskId: string,
    transcript: NonNullable<CallEventPayload['transcript']>
  ): void {
    wsManager.broadcast(WebSocketEventType.CALL_TRANSCRIPT, {
      callRecordId,
      transcript,
    }, {
      roomId: `call:${taskId}`,
      priority: 'low',
    });
  }

  emitEmotionUpdate(
    callRecordId: string,
    taskId: string,
    emotion: NonNullable<CallEventPayload['emotion']>
  ): void {
    wsManager.broadcast(WebSocketEventType.CALL_EMOTION, {
      callRecordId,
      emotion,
    }, {
      roomId: `call:${taskId}`,
      priority: 'low',
    });
  }

  emitSystemNotification(notification: SystemNotificationPayload): void {
    wsManager.broadcast(WebSocketEventType.SYSTEM_NOTIFICATION, notification, {
      priority: notification.level === 'error' ? 'critical' : 
              notification.level === 'warning' ? 'high' : 'normal',
    });

    logger.info('System notification emitted', {
      level: notification.level,
      title: notification.title,
    });
  }

  emitAgentConfigChanged(agentId: string, configChanges: Record<string, unknown>): void {
    wsManager.broadcast(WebSocketEventType.AGENT_CONFIG_CHANGED, {
      agentId,
      configChanges,
    }, {
      priority: 'normal',
    });

    logger.info('Agent config changed event emitted', { agentId });
  }
}

export const eventEmitter = new EventEmitter();
