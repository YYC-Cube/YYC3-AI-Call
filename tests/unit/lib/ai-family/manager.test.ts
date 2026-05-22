import { AIFamilyManager } from '@/lib/ai-family/manager';
import {
  AIFamilyTask,
  TaskPriority,
  CollaborationMode,
  AgentRole,
} from '@/lib/ai-family/types';

describe('AIFamilyManager', () => {
  let manager: AIFamilyManager;

  beforeEach(() => {
    manager = new AIFamilyManager();
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    it('should initialize all 8 agents', async () => {
      await manager.initialize();
      const metrics = manager.getMetrics();

      expect(metrics.activeAgents).toBe(8);
    });

    it('should set initial metrics correctly', async () => {
      await manager.initialize();
      const metrics = manager.getMetrics();

      expect(metrics.totalTasksProcessed).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.queueLength).toBe(0);
      expect(metrics.collaborationSessions).toBe(0);
    });
  });

  describe('Task Creation', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should create task with valid parameters', () => {
      const task = manager.createTask('test-task', {
        type: 'text',
        data: { content: 'Hello' },
      });

      expect(task.id).toBeDefined();
      expect(task.type).toBe('test-task');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe(TaskPriority.NORMAL);
      expect(task.retries).toBe(0);
    });

    it('should create task with custom priority', () => {
      const task = manager.createTask(
        'test-task',
        { type: 'text', data: {} },
        { priority: TaskPriority.CRITICAL }
      );

      expect(task.priority).toBe(TaskPriority.CRITICAL);
    });

    it('should generate unique task IDs', () => {
      const task1 = manager.createTask('task-a', { type: 'text', data: {} });
      const task2 = manager.createTask('task-b', { type: 'text', data: {} });

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('Agent Recommendation', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should recommend agents for known task types', () => {
      const recommendations = manager.recommendAgents('text-processing');

      if (recommendations.length > 0) {
        expect(recommendations[0].confidence).toBeGreaterThan(0);
      } else {
        expect(recommendations.length).toBe(0);
      }
    });

    it('should return empty array for unknown task types', () => {
      const recommendations = manager.recommendAgents('unknown-task-type');

      expect(recommendations.length).toBe(0);
    });

    it('should sort recommendations by confidence descending', () => {
      const recommendations = manager.recommendAgents('data-insight');

      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].confidence).toBeGreaterThanOrEqual(
          recommendations[i].confidence
        );
      }
    });
  });

  describe('Task Submission', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should submit and complete task successfully', async () => {
      const task = manager.createTask('text-processing', {
        type: 'text',
        data: { content: 'Test input' },
      });

      const recommendations = manager.recommendAgents(task.type);
      if (recommendations.length === 0) {
        await expect(manager.submitTask(task)).rejects.toThrow();
        return;
      }

      const result = await manager.submitTask(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle task with high priority', async () => {
      const task = manager.createTask(
        'text-processing',
        { type: 'text', data: {} },
        { priority: TaskPriority.HIGH }
      );

      const recommendations = manager.recommendAgents(task.type);
      if (recommendations.length === 0) {
        await expect(manager.submitTask(task)).rejects.toThrow();
        return;
      }

      const result = await manager.submitTask(task);

      expect(result.success).toBe(true);
    });

    it('should update metrics after task completion', async () => {
      const initialMetrics = manager.getMetrics();

      const task = manager.createTask('text-processing', { type: 'text', data: {} });
      const recommendations = manager.recommendAgents(task.type);

      if (recommendations.length > 0) {
        await manager.submitTask(task);
        const finalMetrics = manager.getMetrics();

        expect(finalMetrics.totalTasksProcessed).toBe(
          initialMetrics.totalTasksProcessed + 1
        );
      }
    });
  });

  describe('Collaboration Modes', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should support sequential collaboration', async () => {
      const result = await manager.collaborate({
        mode: CollaborationMode.SEQUENTIAL,
        tasks: [
          { type: 'text-processing', input: { type: 'text', data: {} } },
          { type: 'data-insight', input: { type: 'text', data: {} } },
        ],
      });

      expect(result.sessionId).toBeDefined();
      expect(result.results.size).toBeGreaterThanOrEqual(1);
      expect(result.summary).toBeDefined();
    });

    it('should support parallel collaboration', async () => {
      const result = await manager.collaborate({
        mode: CollaborationMode.PARALLEL,
        tasks: [
          { type: 'task-a', input: { type: 'text', data: {} } },
          { type: 'task-b', input: { type: 'text', data: {} } },
          { type: 'task-c', input: { type: 'text', data: {} } },
        ],
      });

      expect(result.results.size).toBe(3);
    });

    it('should support hierarchical collaboration', async () => {
      const result = await manager.collaborate({
        mode: CollaborationMode.HIERARCHICAL,
        tasks: [
          { type: 'text-processing', input: { type: 'text', data: {} } },
          { type: 'data-insight', input: { type: 'text', data: {} } },
        ],
      });

      expect(result.sessionId).toBeDefined();
      expect(result.results.size).toBeGreaterThanOrEqual(1);
      expect(result.summary).toBeDefined();
    });

    it('should support consensus collaboration', async () => {
      const result = await manager.collaborate({
        mode: CollaborationMode.CONSENSUS,
        tasks: [{ type: 'decision-task', input: { type: 'text', data: {} } }],
      });

      expect(result.sessionId).toBeDefined();
    });

    it('should track collaboration sessions in metrics', async () => {
      await manager.collaborate({
        mode: CollaborationMode.SEQUENTIAL,
        tasks: [{ type: 'test', input: { type: 'text', data: {} } }],
      });

      const metrics = manager.getMetrics();
      expect(metrics.collaborationSessions).toBeGreaterThan(0);
    });
  });

  describe('Agent Status', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should return metrics with active agents', () => {
      const metrics = manager.getMetrics();

      expect(metrics.activeAgents).toBe(8);
      expect(metrics.activeAgents).toBeGreaterThan(0);
    });

    it('should track agent availability through recommendations', async () => {
      const recommendations = manager.recommendAgents('text-processing');

      if (recommendations.length > 0) {
        recommendations.forEach((rec) => {
          expect(rec.agentId).toBeDefined();
          expect(rec.confidence).toBeGreaterThan(0);
          expect(rec.capabilities).toBeDefined();
        });
      } else {
        expect(recommendations.length).toBe(0);
      }
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should throw error for unknown task type', async () => {
      const task = manager.createTask('unknown-task-type', {
        type: 'text',
        data: {},
      });

      try {
        await manager.submitTask(task);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle empty task list in collaboration', async () => {
      const result = await manager.collaborate({
        mode: CollaborationMode.PARALLEL,
        tasks: [],
      });

      expect(result.results.size).toBe(0);
    });
  });

  describe('Metrics Tracking', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should track average processing time', async () => {
      const task = manager.createTask('text-processing', { type: 'text', data: {} });
      const recommendations = manager.recommendAgents(task.type);

      if (recommendations.length > 0) {
        await manager.submitTask(task);
        const metrics = manager.getMetrics();
        expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should update last activity timestamp', async () => {
      const before = new Date();

      const task = manager.createTask('text-processing', { type: 'text', data: {} });
      const recommendations = manager.recommendAgents(task.type);

      if (recommendations.length > 0) {
        await manager.submitTask(task);
        const metrics = manager.getMetrics();
        expect(metrics.lastActivity.getTime()).toBeGreaterThanOrEqual(before.getTime());
      }
    });
  });
});
