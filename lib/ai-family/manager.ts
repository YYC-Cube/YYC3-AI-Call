import {
  AgentDefinition,
  AgentConfig,
  AgentStatus,
  TaskInput,
  TaskOutput,
  AIFamilyTask,
  CollaborationSession,
  CollaborationMode,
  AgentRecommendation,
  AIFamilyMetrics,
  AgentSnapshot,
  TaskPriority,
} from './types';
import { AI_FAMILY_AGENTS, getAgentById, getAllAgents } from './definitions';
import { BaseAgent, MetaOracleAgent, CloudGuardianAgent } from './agents';

export class AIFamilyManager {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: AIFamilyTask[] = [];
  private activeTasks: Map<string, AIFamilyTask> = new Map();
  private collaborationSessions: Map<string, CollaborationSession> = new Map();
  private cleanupTimer?: NodeJS.Timeout;
  private readonly MAX_QUEUE_SIZE = 10000;
  private readonly CLEANUP_INTERVAL_MS = 60000; // 1分钟
  private readonly TASK_RETENTION_MS = 3600000; // 1小时
  private metrics: AIFamilyMetrics = {
    totalTasksProcessed: 0,
    successRate: 0,
    averageProcessingTime: 0,
    activeAgents: 0,
    queueLength: 0,
    collaborationSessions: 0,
    lastActivity: new Date(),
  };

  async initialize(): Promise<void> {
    console.log('🧠 Initializing AI Family Manager...');

    for (const [agentId, definition] of Object.entries(AI_FAMILY_AGENTS)) {
      let agent: BaseAgent;

      switch (agentId) {
        case 'meta-oracle':
          agent = new MetaOracleAgent({ agentId });
          break;
        case 'cloud-guardian':
          agent = new CloudGuardianAgent({ agentId });
          break;
        default:
          agent = new BaseAgent({ definition, config: { agentId } });
          break;
      }

      await agent.initialize();
      this.agents.set(agentId, agent);
    }

    this.metrics.activeAgents = this.agents.size;
    console.log(`✅ AI Family initialized with ${this.agents.size} agents`);

    this.startCleanupScheduler();
  }

  private startCleanupScheduler(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      try {
        this.cleanupTaskQueue();
        this.cleanupCollaborationSessions();
      } catch (error) {
        console.error('[AI Family] Cleanup error:', error);
      }
    }, this.CLEANUP_INTERVAL_MS);

    console.log(`🧹 Task cleanup scheduler started (interval: ${this.CLEANUP_INTERVAL_MS}ms)`);
  }

  private cleanupTaskQueue(): void {
    const beforeCount = this.taskQueue.length;

    const cutoffTime = Date.now() - this.TASK_RETENTION_MS;

    this.taskQueue = this.taskQueue.filter((task) => {
      if (task.status === 'pending') return true;

      if (task.updatedAt.getTime() < cutoffTime) return false;

      return true;
    });

    if (this.taskQueue.length > this.MAX_QUEUE_SIZE) {
      const pendingTasks = this.taskQueue.filter((t) => t.status === 'pending');
      const completedTasks = this.taskQueue.filter((t) => t.status !== 'pending');

      this.taskQueue = [
        ...pendingTasks.slice(0, Math.floor(this.MAX_QUEUE_SIZE * 0.7)),
        ...completedTasks.slice(-Math.floor(this.MAX_QUEUE_SIZE * 0.3)),
      ];
    }

    const afterCount = this.taskQueue.length;
    if (beforeCount !== afterCount) {
      console.log(
        `[AI Family] Queue cleaned: ${beforeCount} → ${afterCount} tasks`
      );
    }
  }

  private cleanupCollaborationSessions(): void {
    const cutoffTime = Date.now() - this.TASK_RETENTION_MS * 2;

    for (const [sessionId, session] of this.collaborationSessions.entries()) {
      if (
        session.status === 'completed' ||
        session.status === 'failed'
      ) {
        if (session.updatedAt?.getTime() < cutoffTime) {
          this.collaborationSessions.delete(sessionId);
        }
      }
    }
  }

  stopCleanupScheduler(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      console.log('🛑 Task cleanup scheduler stopped');
    }
  }

  createTask(
    type: string,
    input: TaskInput,
    options?: {
      priority?: TaskPriority;
      sessionId?: string;
    }
  ): AIFamilyTask {
    const task: AIFamilyTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      input,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: options?.priority || TaskPriority.NORMAL,
      retries: 0,
      maxRetries: 3,
      collaborationId: options?.sessionId,
    };

    if (options?.sessionId) {
      input.metadata = {
        ...input.metadata,
        sessionId: options.sessionId,
      };
    }

    this.taskQueue.push(task);
    this.updateMetrics();

    return task;
  }

  async submitTask(task: AIFamilyTask): Promise<TaskOutput> {
    const recommendations = this.recommendAgents(task.type);
    
    if (recommendations.length === 0) {
      throw new Error(`No suitable agents found for task type: ${task.type}`);
    }

    const bestAgent = recommendations[0];
    const agent = this.agents.get(bestAgent.agentId);

    if (!agent || !agent.isEnabled()) {
      throw new Error(`Agent ${bestAgent.agentId} is not available`);
    }

    task.status = 'assigned';
    task.assignedAgent = bestAgent.agentId;
    this.activeTasks.set(task.id, task);

    try {
      const output = await agent.processTask(task.input);
      
      task.status = 'completed';
      task.output = output;
      task.completedAt = new Date();
      task.updatedAt = new Date();

      this.metrics.totalTasksProcessed++;
      this.updateSuccessRate();
      this.updateAverageProcessingTime(output.metadata.executionTime);
      
      return output;
    } catch (error) {
      task.status = 'failed';
      task.updatedAt = new Date();
      
      if (task.retries < task.maxRetries) {
        task.retries++;
        task.status = 'pending';
        this.taskQueue.push(task);
      }

      throw error;
    } finally {
      this.activeTasks.delete(task.id);
      this.taskQueue = this.taskQueue.filter((t) => t.id !== task.id);
      this.updateMetrics();
    }
  }

  recommendAgents(taskType: string): AgentRecommendation[] {
    const recommendations: AgentRecommendation[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      if (!agent.isEnabled()) continue;

      const confidence = agent.getConfidenceForTask(taskType);
      
      if (confidence > 0.5) {
        const definition = getAgentById(agentId);
        
        recommendations.push({
          agentId,
          confidence,
          reason: `Agent ${definition?.displayName} has capability to handle ${taskType} tasks with ${Math.round(confidence * 100)}% confidence`,
          estimatedTime: Math.floor(Math.random() * 5000) + 1000,
          capabilities: agent.getCapabilities().map((cap: { name: string }) => cap.name),
        });
      }
    }

    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  async collaborate(options: {
    id?: string;
    mode: CollaborationMode;
    tasks: Array<{ type: string; input: TaskInput }>;
    agents?: string[];
  }): Promise<{
    sessionId: string;
    results: Map<string, TaskOutput>;
    summary: string;
  }> {
    const sessionId = options.id || `collab-${Date.now()}`;
    
    const session: CollaborationSession = {
      id: sessionId,
      mode: options.mode,
      status: 'initialized',
      tasks: [],
      agents: options.agents || [],
      results: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.collaborationSessions.set(sessionId, session);
    this.metrics.collaborationSessions++;

    try {
      session.status = 'running';

      switch (options.mode) {
        case CollaborationMode.PARALLEL:
          await this.executeParallelCollaboration(session, options.tasks);
          break;
        case CollaborationMode.SEQUENTIAL:
          await this.executeSequentialCollaboration(session, options.tasks);
          break;
        case CollaborationMode.HIERARCHICAL:
          await this.executeHierarchicalCollaboration(session, options.tasks);
          break;
        case CollaborationMode.CONSENSUS:
          await this.executeConsensusCollaboration(session, options.tasks);
          break;
      }

      session.status = 'completed';
      session.completedAt = new Date();

      return {
        sessionId,
        results: session.results,
        summary: this.generateCollaborationSummary(session),
      };
    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  private async executeParallelCollaboration(
    session: CollaborationSession,
    tasks: Array<{ type: string; input: TaskInput }>
  ): Promise<void> {
    const promises = tasks.map(async (taskDef) => {
      const task = this.createTask(taskDef.type, taskDef.input, { sessionId: session.id });
      session.tasks.push(task);

      try {
        const result = await this.submitTask(task);
        session.results.set(task.id, result);
      } catch (error) {
        session.results.set(task.id, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            executionTime: 0,
            agentId: '',
            timestamp: new Date(),
          },
        });
      }
    });

    await Promise.all(promises);
  }

  private async executeSequentialCollaboration(
    session: CollaborationSession,
    tasks: Array<{ type: string; input: TaskInput }>
  ): Promise<void> {
    let context: Record<string, unknown> = {};

    for (const taskDef of tasks) {
      const enrichedInput: TaskInput = {
        ...taskDef.input,
        data: {
          ...taskDef.input.data,
          previousContext: context,
        },
      };

      const task = this.createTask(taskDef.type, enrichedInput, { sessionId: session.id });
      session.tasks.push(task);

      try {
        const result = await this.submitTask(task);
        context = result.data || {};
        session.results.set(task.id, result);
      } catch (error) {
        session.results.set(task.id, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            executionTime: 0,
            agentId: '',
            timestamp: new Date(),
          },
        });
        break;
      }
    }
  }

  private async executeHierarchicalCollaboration(
    session: CollaborationSession,
    tasks: Array<{ type: string; input: TaskInput }>
  ): Promise<void> {
    const masterAgent = this.agents.get('meta-oracle');
    if (!masterAgent) throw new Error('Master agent not available');

    const orchestrationInput: TaskInput = {
      type: 'task-orchestration',
      data: {
        tasks: tasks.map((t) => ({ type: t.type })),
        mode: 'hierarchical',
      },
    };

    const orchestrationResult = await masterAgent.processTask(orchestrationInput);
    session.results.set('orchestration', orchestrationResult);

    await this.executeParallelCollaboration(session, tasks);
  }

  private async executeConsensusCollaboration(
    session: CollaborationSession,
    tasks: Array<{ type: string; input: TaskInput }>
  ): Promise<void> {
    const allResults: TaskOutput[] = [];

    for (const taskDef of tasks) {
      const task = this.createTask(taskDef.type, taskDef.input, { sessionId: session.id });
      session.tasks.push(task);

      const agentResults: TaskOutput[] = [];
      const capableAgents = this.recommendAgents(taskDef.type).slice(0, 3);

      for (const rec of capableAgents) {
        try {
          const result = await this.submitTask(task);
          agentResults.push(result);
        } catch (error) {
          agentResults.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
              executionTime: 0,
              agentId: rec.agentId,
              timestamp: new Date(),
            },
          });
        }
      }

      const consensusOutput = this.generateConsensus(agentResults);
      allResults.push(consensusOutput);
      session.results.set(task.id, consensusOutput);
    }
  }

  private generateConsensus(results: TaskOutput[]): TaskOutput {
    const successfulResults = results.filter((r) => r.success);
    
    if (successfulResults.length === 0) {
      return {
        success: false,
        error: 'All agents failed to reach consensus',
        metadata: {
          executionTime: 0,
          agentId: 'consensus',
          timestamp: new Date(),
        },
      };
    }

    const avgConfidence =
      successfulResults.reduce((sum, r) => sum + (r.metadata.confidence || 0), 0) /
      successfulResults.length;

    return {
      success: true,
      data: {
        consensus: true,
        participatingAgents: successfulResults.length,
        averageConfidence: avgConfidence,
        individualResults: successfulResults.map((r) => ({
          agentId: r.metadata.agentId,
          confidence: r.metadata.confidence,
        })),
      },
      metadata: {
        executionTime: Math.max(...successfulResults.map((r) => r.metadata.executionTime)),
        confidence: avgConfidence,
        agentId: 'consensus',
        timestamp: new Date(),
      },
    };
  }

  private generateCollaborationSummary(session: CollaborationSession): string {
    const totalTasks = session.tasks.length;
    const successfulTasks = Array.from(session.results.values()).filter(
      (r) => r.success
    ).length;

    return `Collaboration session ${session.id} completed: ${successfulTasks}/${totalTasks} tasks successful (${Math.round((successfulTasks / totalTasks) * 100)}%) using ${session.mode} mode`;
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getAgentSnapshot(id: string): AgentSnapshot | undefined {
    const agent = this.agents.get(id);
    return agent?.getSnapshot();
  }

  getAllSnapshots(): AgentSnapshot[] {
    return Array.from(this.agents.values()).map((agent) => agent.getSnapshot());
  }

  updateAgentConfig(agentId: string, updates: Partial<AgentConfig>): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.updateConfig(updates);
    }
  }

  getMetrics(): AIFamilyMetrics {
    return { ...this.metrics };
  }

  getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const pending = this.taskQueue.filter((t) => t.status === 'pending').length;
    const processing = this.activeTasks.size;

    return {
      pending,
      processing,
      completed: this.metrics.totalTasksProcessed,
      failed: this.taskQueue.filter((t) => t.status === 'failed').length,
    };
  }

  private updateMetrics(): void {
    this.metrics.queueLength = this.taskQueue.length;
    this.metrics.lastActivity = new Date();
  }

  private updateSuccessRate(): void {
    const totalCompleted = this.metrics.totalTasksProcessed;
    if (totalCompleted > 0) {
      const failedCount = Array.from(this.agents.values()).reduce(
        (sum, agent) => sum + agent.getSnapshot().metrics.tasksFailed,
        0
      );
      this.metrics.successRate = ((totalCompleted - failedCount) / totalCompleted) * 100;
    }
  }

  private updateAverageProcessingTime(executionTime: number): void {
    const currentAvg = this.metrics.averageProcessingTime;
    const totalCount = this.metrics.totalTasksProcessed;
    
    this.metrics.averageProcessingTime =
      (currentAvg * (totalCount - 1) + executionTime) / totalCount;
  }

  async dispose(): Promise<void> {
    console.log('🧠 Disposing AI Family Manager...');
    
    for (const agent of this.agents.values()) {
      await agent.dispose();
    }
    
    this.agents.clear();
    this.taskQueue = [];
    this.activeTasks.clear();
    this.collaborationSessions.clear();
    
    console.log('✅ AI Family Manager disposed');
  }
}

export const aiFamilyManager = new AIFamilyManager();
