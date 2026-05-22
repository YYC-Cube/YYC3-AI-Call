/**
 * file work.test.ts
 * description @yyc3/ai-hub work.ts 单元测试
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/ai-hub work.ts 单元测试
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createFamilyWorkSystem } from '../../src/work/index.js';
import type { TaskCategory, TaskPriority } from '../../src/work/types.js';

describe('FamilyWorkSystem', () => {
  let workSystem: ReturnType<typeof createFamilyWorkSystem>;

  beforeEach(() => {
    workSystem = createFamilyWorkSystem();
  });

  describe('constructor', () => {
    it('should create instance without error', () => {
      expect(workSystem).toBeDefined();
    });

    it('should expose TaskManager', () => {
      expect(workSystem.getTaskManager()).toBeDefined();
    });

    it('should expose CollaborationEngine', () => {
      expect(workSystem.getCollaborationEngine()).toBeDefined();
    });

    it('should expose TrustSystem', () => {
      expect(workSystem.getTrustSystem()).toBeDefined();
    });
  });

  describe('createAndStartTask (async)', () => {
    it('should create a task and start collaboration session', async () => {
      const { task, sessionId } = await workSystem.createAndStartTask({
        userId: 'user-1',
        title: 'Test Task',
        description: 'A test task',
        category: 'development_engineering' as TaskCategory,
        priority: 'high' as TaskPriority,
      });

      expect(task).toBeDefined();
      expect(task.id).toBeTruthy();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('pending');
      expect(sessionId).toBeTruthy();
    });

    it('should suggest members based on category', async () => {
      const { task } = await workSystem.createAndStartTask({
        userId: 'user-1',
        title: 'Content Task',
        description: '',
        category: 'content_creation' as TaskCategory,
        priority: 'medium' as TaskPriority,
      });

      expect(task.assignee).toContain('lingyun');
      expect(task.assignee).toContain('qianxing');
    });

    it('should accept preferred members override', async () => {
      const { task } = await workSystem.createAndStartTask({
        userId: 'user-1',
        title: 'Custom Task',
        description: '',
        category: 'management_decision' as TaskCategory,
        priority: 'low' as TaskPriority,
        preferredMembers: ['qianxing', 'wanwu'],
      });

      expect(task.assignee).toEqual(['qianxing', 'wanwu']);
    });

    it('should set deadline when provided', async () => {
      const deadline = new Date('2026-12-31');
      const { task } = await workSystem.createAndStartTask({
        userId: 'user-1',
        title: 'Deadline Task',
        description: '',
        category: 'personal_growth' as TaskCategory,
        priority: 'medium' as TaskPriority,
        deadline,
      });

      expect(task.deadline).toEqual(deadline);
    });
  });

  describe('suggestMembersForTask', () => {
    it('should suggest for content_creation', () => {
      const members = workSystem.suggestMembersForTask('content_creation' as TaskCategory);
      expect(members).toContain('lingyun');
      expect(members).toContain('qianxing');
    });

    it('should suggest for analysis_research', () => {
      const members = workSystem.suggestMembersForTask('analysis_research' as TaskCategory);
      expect(members).toContain('wanwu');
      expect(members).toContain('xianzhi');
      expect(members).toContain('zongshi');
    });

    it('should suggest for development_engineering', () => {
      const members = workSystem.suggestMembersForTask('development_engineering' as TaskCategory);
      expect(members).toContain('zongshi');
      expect(members).toContain('shouhu');
      expect(members).toContain('qianxing');
    });

    it('should suggest for management_decision', () => {
      const members = workSystem.suggestMembersForTask('management_decision' as TaskCategory);
      expect(members).toContain('tianshu');
      expect(members).toContain('bole');
      expect(members).toContain('xianzhi');
    });

    it('should fallback to qianxing for unknown categories', () => {
      const members = workSystem.suggestMembersForTask('unknown' as TaskCategory);
      expect(members).toEqual(['qianxing']);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data structure', () => {
      const data = workSystem.getDashboardData('user-1');
      expect(data).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(data.activeMembers).toBeDefined();
      expect(data.recentTasks).toBeDefined();
      expect(data.liveActivity).toBeDefined();
    });

    it('should include today stats in summary', async () => {
      await workSystem.createAndStartTask({
        userId: 'user-1',
        title: 'Dashboard Test',
        description: '',
        category: 'content_creation' as TaskCategory,
        priority: 'low' as TaskPriority,
      });

      const data = workSystem.getDashboardData('user-1');
      expect(data.summary.todayTasks.pending).toBeGreaterThanOrEqual(1);
    });
  });

  describe('submitTaskFeedback', () => {
    it('should record positive feedback', async () => {
      const { task } = await workSystem.createAndStartTask({
        userId: 'user-1',
        title: 'Feedback Task',
        description: '',
        category: 'content_creation' as TaskCategory,
        priority: 'medium' as TaskPriority,
        preferredMembers: ['qianxing'],
      });

      workSystem.submitTaskFeedback('user-1', task.id, 'qianxing', 5, 'Excellent work!');

      const comments = workSystem.getTaskManager().getTask(task.id)?.comments || [];
      expect(comments.length).toBeGreaterThanOrEqual(1);
      expect(comments[comments.length - 1].content).toContain('5/5');
    });

    it('should handle non-existent task gracefully', () => {
      expect(() => {
        workSystem.submitTaskFeedback('user-1', 'non-existent', 'qianxing', 5, 'test');
      }).not.toThrow();
    });
  });

  describe('getFamilyMemberWorkStatus', () => {
    it('should return status for all 8 members', () => {
      const statuses = workSystem.getFamilyMemberWorkStatus();
      expect(statuses).toHaveLength(8);

      const memberIds = statuses.map(s => s.id);
      expect(memberIds).toContain('qianxing');
      expect(memberIds).toContain('wanwu');
      expect(memberIds).toContain('xianzhi');
      expect(memberIds).toContain('bole');
      expect(memberIds).toContain('tianshu');
      expect(memberIds).toContain('shouhu');
      expect(memberIds).toContain('zongshi');
      expect(memberIds).toContain('lingyun');
    });

    it('should include required fields for each member', () => {
      const statuses = workSystem.getFamilyMemberWorkStatus();
      for (const status of statuses) {
        expect(status.id).toBeTruthy();
        expect(status.name).toBeTruthy();
        expect(status.role).toBeTruthy();
        expect(status.roleIcon).toBeTruthy();
        expect(status.status).toBeTruthy();
        expect(typeof status.todayCompleted).toBe('number');
      }
    });
  });
});

describe('TaskManager integration', () => {
  let workSystem: ReturnType<typeof createFamilyWorkSystem>;

  beforeEach(() => {
    workSystem = createFamilyWorkSystem();
  });

  it('should update task status', async () => {
    const { task } = await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Status Test',
      description: '',
      category: 'development_engineering' as TaskCategory,
      priority: 'high' as TaskPriority,
    });

    const tm = workSystem.getTaskManager();

    expect(tm.updateTaskStatus(task.id, 'in_progress')).toBe(true);
    expect(tm.getTask(task.id)?.status).toBe('in_progress');

    expect(tm.updateTaskStatus(task.id, 'completed')).toBe(true);
    expect(tm.getTask(task.id)?.status).toBe('completed');
    expect(tm.getTask(task.id)?.progress).toBe(100);
  });

  it('should add work log entries', async () => {
    const { task } = await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Log Test',
      description: '',
      category: 'analysis_research' as TaskCategory,
      priority: 'medium' as TaskPriority,
    });

    const tm = workSystem.getTaskManager();

    expect(tm.addWorkLog(task.id, {
      memberId: 'wanwu',
      memberName: '万物',
      action: '分析完成',
      details: '数据已处理',
      status: 'working',
    })).toBe(true);
  });

  it('should retrieve tasks by status', async () => {
    await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Pending 1',
      description: '',
      category: 'content_creation' as TaskCategory,
      priority: 'low' as TaskPriority,
    });
    await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Pending 2',
      description: '',
      category: 'content_creation' as TaskCategory,
      priority: 'low' as TaskPriority,
    });

    const tm = workSystem.getTaskManager();
    const pendingTasks = tm.getTasksByStatus('pending');
    expect(pendingTasks.length).toBeGreaterThanOrEqual(2);
  });

  it('should provide dashboard summary', async () => {
    await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Summary Test',
      description: '',
      category: 'management_decision' as TaskCategory,
      priority: 'high' as TaskPriority,
    });

    const tm = workSystem.getTaskManager();
    const summary = tm.getDashboardSummary();

    expect(summary.todayTasks).toBeDefined();
    expect(typeof summary.todayTasks.pending).toBe('number');
    expect(typeof summary.todayTasks.inProgress).toBe('number');
    expect(typeof summary.todayTasks.completed).toBe('number');
    expect(summary.weekStats).toBeDefined();
  });

  it('should end collaboration session', async () => {
    const { sessionId } = await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'End Collab Test',
      description: '',
      category: 'development_engineering' as TaskCategory,
      priority: 'medium' as TaskPriority,
    });

    const engine = workSystem.getCollaborationEngine();
    const result = engine.endCollaboration(sessionId);
    expect(result).toBe(true);
  });

  it('should return false when ending non-existent session', () => {
    const engine = workSystem.getCollaborationEngine();
    const result = engine.endCollaboration('non-existent');
    expect(result).toBe(false);
  });

  it('should get active session by task id', async () => {
    const { task } = await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Get Session Test',
      description: '',
      category: 'content_creation' as TaskCategory,
      priority: 'low' as TaskPriority,
    });

    const engine = workSystem.getCollaborationEngine();
    const session = engine.getActiveSession(task.id);
    expect(session).toBeDefined();
    expect(session!.taskId).toBe(task.id);
  });

  it('should get any active session without task id', async () => {
    await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Any Session Test',
      description: '',
      category: 'analysis_research' as TaskCategory,
      priority: 'high' as TaskPriority,
    });

    const engine = workSystem.getCollaborationEngine();
    const session = engine.getActiveSession();
    expect(session).toBeDefined();
  });

  it('should return undefined for non-existent task id', () => {
    const engine = workSystem.getCollaborationEngine();
    const session = engine.getActiveSession('non-existent');
    expect(session).toBeUndefined();
  });

  it('should update member progress and trigger handoff', async () => {
    const { sessionId } = await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Progress Test',
      description: '',
      category: 'development_engineering' as TaskCategory,
      priority: 'high' as TaskPriority,
    });

    const engine = workSystem.getCollaborationEngine();
    const session = engine.getActiveSession();
    const firstMember = session!.members[0];
    const result = engine.updateMemberProgress(sessionId, firstMember.memberId, 100);
    expect(result).toBe(true);
    expect(firstMember.status).toBe('completed');
  });

  it('should return false when updating progress for non-existent session', () => {
    const engine = workSystem.getCollaborationEngine();
    const result = engine.updateMemberProgress('non-existent', 'member-1', 50);
    expect(result).toBe(false);
  });

  it('should return false when updating progress for non-existent member', async () => {
    const { sessionId } = await workSystem.createAndStartTask({
      userId: 'user-1',
      title: 'Progress Member Test',
      description: '',
      category: 'security_auditing' as TaskCategory,
      priority: 'medium' as TaskPriority,
    });

    const engine = workSystem.getCollaborationEngine();
    const result = engine.updateMemberProgress(sessionId, 'non-existent-member', 50);
    expect(result).toBe(false);
  });
});
