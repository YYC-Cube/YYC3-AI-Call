/**
 * file index.ts
 * description @yyc3/ai-hub 模块入口
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub 模块入口
 */
import { TaskManager } from './task-manager';
import { CollaborationEngine } from './collaboration-engine';
import { TrustSystem } from './trust-system';
import {
  WorkDashboardData,
  Task,
  TaskCategory,
  TaskPriority,
  CollaborationMode,
  FamilyMemberWorkProfile,
  TrustLevel,
} from './types';

interface MemberWithTrust extends FamilyMemberWorkProfile {
  userTrustLevel: TrustLevel;
}

export class FamilyWorkSystem {
  private taskManager: TaskManager;
  private collaborationEngine: CollaborationEngine;
  private trustSystem: TrustSystem;

  constructor() {
    this.taskManager = new TaskManager();
    this.collaborationEngine = new CollaborationEngine();
    this.trustSystem = new TrustSystem();
  }

  getTaskManager(): TaskManager {
    return this.taskManager;
  }

  getCollaborationEngine(): CollaborationEngine {
    return this.collaborationEngine;
  }

  getTrustSystem(): TrustSystem {
    return this.trustSystem;
  }

  async createAndStartTask(params: {
    userId: string;
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    preferredMembers?: string[];
    deadline?: Date;
  }): Promise<{ task: Task; sessionId: string }> {
    const task = this.taskManager.createTask({
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority,
      assignee: params.preferredMembers || this.suggestMembersForTask(params.category),
      deadline: params.deadline,
    });

    const session = this.collaborationEngine.startCollaboration(task);

    this.taskManager.addWorkLog(task.id, {
      memberId: 'system',
      memberName: '系统',
      action: '任务启动',
      details: `协作模式: ${session.mode}, 参与成员: ${session.members.map(m => m.memberName).join(', ')}`,
      status: 'working',
    });

    return { task, sessionId: session.id };
  }

  suggestMembersForTask(category: TaskCategory): string[] {
    const suggestions: Partial<Record<TaskCategory, string[]>> = {
      content_creation: ['lingyun', 'qianxing'],
      analysis_research: ['wanwu', 'xianzhi', 'zongshi'],
      development_engineering: ['zongshi', 'shouhu', 'qianxing'],
      management_decision: ['tianshu', 'bole', 'xianzhi'],
      personal_growth: ['bole', 'qianxing', 'wanwu'],
      security_auditing: ['shouhu', 'xianzhi'],
      ux_design: ['lingyun', 'wanwu'],
      product_management: ['tianshu', 'bole'],
    };

    return suggestions[category] || ['qianxing'];
  }

  getDashboardData(userId: string): WorkDashboardData {
    const summary = this.taskManager.getDashboardSummary();
    const activeMembers = this.collaborationEngine.getOnlineMembers();
    const recentTasks = this.taskManager.getRecentTasks(8);
    const liveActivity = this.taskManager.getActivityFeed(15);

    const membersWithTrust: MemberWithTrust[] = activeMembers.map(member => {
      const trustLevel = this.trustSystem.getTrustLevel(userId, member.id);
      return { ...member, userTrustLevel: trustLevel };
    });

    return {
      summary,
      activeMembers: membersWithTrust as unknown as FamilyMemberWorkProfile[],
      recentTasks,
      liveActivity,
    };
  }

  submitTaskFeedback(
    userId: string,
    taskId: string,
    memberId: string,
    rating: number,
    feedback: string
  ): void {
    const task = this.taskManager.getTask(taskId);
    if (!task) return;

    this.trustSystem.recordTrustEvent(userId, memberId, {
      taskId,
      action: rating >= 4 ? 'positive' : 'negative' as const,
      rating,
      feedback,
    });

    this.taskManager.addComment(taskId, {
      authorId: userId,
      authorName: '用户',
      content: `评价: ${rating}/5星 - ${feedback}`,
      type: 'user',
    });
  }

  getFamilyMemberWorkStatus(): Array<{
    id: string;
    name: string;
    role: string;
    roleIcon: string;
    status: string;
    currentTask?: string;
    todayCompleted: number;
  }> {
    return this.collaborationEngine.getAllMemberProfiles().map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      roleIcon: member.roleIcon,
      status: member.currentStatus,
      currentTask: member.currentTaskId
        ? this.taskManager.getTask(member.currentTaskId)?.title
        : undefined,
      todayCompleted: member.todayStats.tasksCompleted,
    }));
  }
}

export function createFamilyWorkSystem(): FamilyWorkSystem {
  return new FamilyWorkSystem();
}
