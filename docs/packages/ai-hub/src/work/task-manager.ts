/**
 * file task-manager.ts
 * description 任务管理器
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 任务管理器
 */
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  WorkLogEntry,
  Comment,
  CollaborationMode,
  FamilyMemberWorkProfile,
  ActivityFeedItem,
} from './types';

export class TaskManager {
  private tasks: Map<string, Task>;
  private activityFeed: ActivityFeedItem[];

  constructor() {
    this.tasks = new Map();
    this.activityFeed = [];
  }

  createTask(params: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    assignee: string[];
    deadline?: Date;
    collaborationMode?: CollaborationMode;
  }): Task {
    const task: Task = {
      id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority,
      status: 'pending',
      assignee: params.assignee,
      collaborators: new Map(),
      collaborationMode: params.collaborationMode || 'independent',
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: params.deadline,
      progress: 0,
      workLog: [],
      comments: [],
      attachments: [],
      metadata: {},
    };

    this.tasks.set(task.id, task);
    
    this.addActivity({
      type: 'task_created',
      taskId: task.id,
      taskTitle: task.title,
      message: `新任务创建: ${task.title}`,
      timestamp: new Date(),
    });

    return task;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  updateTaskStatus(taskId: string, status: TaskStatus): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    if (status === 'completed') {
      task.completedAt = new Date();
      task.progress = 100;
    }

    this.addActivity({
      type: oldStatus === 'pending' && status === 'in_progress' ? 'task_started' : 
            status === 'completed' ? 'task_completed' : 'member_status_change',
      taskId: task.id,
      taskTitle: task.title,
      message: `任务 "${task.title}" 状态更新: ${oldStatus} → ${status}`,
      timestamp: new Date(),
    });

    return true;
  }

  addWorkLog(taskId: string, entry: Omit<WorkLogEntry, 'id' | 'timestamp'>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const logEntry: WorkLogEntry = {
      id: `LOG-${Date.now()}`,
      ...entry,
      timestamp: new Date(),
    };

    task.workLog.push(logEntry);
    task.updatedAt = new Date();
    return true;
  }

  addComment(taskId: string, comment: Omit<Comment, 'id' | 'timestamp'>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const newComment: Comment = {
      id: `CMT-${Date.now()}`,
      ...comment,
      timestamp: new Date(),
    };

    task.comments.push(newComment);
    task.updatedAt = new Date();
    return true;
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  getTasksByAssignee(memberId: string): Task[] {
    return Array.from(this.tasks.values()).filter(t => 
      t.assignee.includes(memberId)
    );
  }

  getRecentTasks(limit: number = 10): Task[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  getActivityFeed(limit: number = 20): ActivityFeedItem[] {
    return this.activityFeed
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private addActivity(item: Omit<ActivityFeedItem, 'id'>): void {
    this.activityFeed.push({
      id: `ACT-${Date.now()}`,
      ...item,
    });
  }

  getDashboardSummary(): {
    todayTasks: { pending: number; inProgress: number; completed: number };
    weekStats: { totalCompleted: number; successRate: number; avgCompletionTime: number };
  } {
    const allTasks = Array.from(this.tasks.values());
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayTasks = allTasks.filter(t => t.createdAt >= todayStart);
    
    return {
      todayTasks: {
        pending: todayTasks.filter(t => t.status === 'pending').length,
        inProgress: todayTasks.filter(t => t.status === 'in_progress').length,
        completed: todayTasks.filter(t => t.status === 'completed').length,
      },
      weekStats: {
        totalCompleted: allTasks.filter(t => t.status === 'completed').length,
        successRate: allTasks.length > 0 
          ? (allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100
          : 0,
        avgCompletionTime: 0,
      },
    };
  }
}
