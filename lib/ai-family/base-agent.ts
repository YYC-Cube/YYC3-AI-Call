import {
  AgentDefinition,
  AgentConfig,
  AgentStatus,
  TaskInput,
  TaskOutput,
  AIFamilyTask,
  AgentCapability,
  AgentSnapshot,
} from './types';
import { getAgentById } from './definitions';

export interface BaseAgentOptions {
  definition: AgentDefinition;
  config?: Partial<AgentConfig>;
}

export class BaseAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly displayName: string;
  public readonly role: string;
  public readonly emoji: string;
  
  protected definition: AgentDefinition;
  protected config: AgentConfig;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected currentTaskId: string | null = null;
  
  protected metrics = {
    tasksCompleted: 0,
    tasksFailed: 0,
    totalExecutionTime: 0,
    startTime: Date.now(),
  };

  constructor(options: BaseAgentOptions) {
    this.definition = options.definition;
    this.id = options.definition.id;
    this.name = options.definition.name;
    this.displayName = options.definition.displayName;
    this.role = options.definition.role;
    this.emoji = options.definition.emoji;
    
    this.config = {
      agentId: options.definition.id,
      enabled: true,
      priority: 5,
      retryCount: 3,
      ...options.config,
    };
  }

  async initialize(): Promise<void> {
    console.log(`[${this.displayName}] 初始化中...`);
    this.status = AgentStatus.IDLE;
  }

  async processTask(taskInput: TaskInput): Promise<TaskOutput> {
    if (!this.config.enabled) {
      throw new Error(`Agent ${this.displayName} is disabled`);
    }

    if (this.status === AgentStatus.PROCESSING) {
      throw new Error(`Agent ${this.displayName} is already processing a task`);
    }

    const startTime = Date.now();
    this.status = AgentStatus.PROCESSING;

    try {
      const result = await this.executeTask(taskInput);
      
      const executionTime = Date.now() - startTime;
      this.metrics.tasksCompleted++;
      this.metrics.totalExecutionTime += executionTime;
      
      return {
        success: true,
        data: result.data,
        metadata: {
          executionTime,
          confidence: result.confidence || 0.9,
          agentId: this.id,
          timestamp: new Date(),
          tokensUsed: result.tokensUsed,
        },
      };
    } catch (error) {
      this.metrics.tasksFailed++;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
          agentId: this.id,
          timestamp: new Date(),
        },
      };
    } finally {
      this.status = AgentStatus.IDLE;
      this.currentTaskId = null;
    }
  }

  protected async executeTask(taskInput: TaskInput): Promise<{
    data: Record<string, unknown>;
    confidence?: number;
    tokensUsed?: number;
  }> {
    const capability = this.findBestCapability(taskInput.type);
    
    if (!capability) {
      throw new Error(`No suitable capability found for task type: ${taskInput.type}`);
    }

    console.log(`[${this.displayName}] Processing task with capability: ${capability.name}`);
    
    const result = await this.simulateProcessing(taskInput, capability);
    
    return result;
  }

  protected findBestCapability(taskType: string): AgentCapability | undefined {
    return this.definition.capabilities.find(
      (cap) => cap.inputTypes.includes(taskType)
    );
  }

  protected async simulateProcessing(
    taskInput: TaskInput,
    capability: AgentCapability
  ): Promise<{ data: Record<string, unknown>; confidence: number; tokensUsed: number }> {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return {
      data: {
        result: `Processed by ${this.displayName}`,
        capability: capability.name,
        inputType: taskInput.type,
        timestamp: new Date().toISOString(),
        analysis: this.generateMockAnalysis(taskInput, capability),
      },
      confidence: capability.confidence * (0.9 + Math.random() * 0.1),
      tokensUsed: Math.floor(Math.random() * 500) + 100,
    };
  }

  protected generateMockAnalysis(
    taskInput: TaskInput,
    capability: AgentCapability
  ): Record<string, unknown> {
    return {
      summary: `${capability.name} completed successfully`,
      details: `Analyzed ${taskInput.type} data using ${capability.category} approach`,
      recommendations: [
        'Consider additional context for improved accuracy',
        'Review results for domain-specific relevance',
        'Implement feedback loop for continuous improvement',
      ],
      score: Math.random(),
    };
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getSnapshot(): AgentSnapshot {
    const uptime = Date.now() - this.metrics.startTime;
    
    return {
      id: this.id,
      definition: this.definition,
      config: this.getConfig(),
      status: this.status,
      currentTask: this.currentTaskId || undefined,
      capabilities: this.definition.capabilities,
      metrics: {
        tasksCompleted: this.metrics.tasksCompleted,
        tasksFailed: this.metrics.tasksFailed,
        averageExecutionTime: this.metrics.tasksCompleted > 0
          ? this.metrics.totalExecutionTime / this.metrics.tasksCompleted
          : 0,
        uptime,
      },
    };
  }

  getCapabilities(): AgentCapability[] {
    return this.definition.capabilities;
  }

  canHandleTask(taskType: string): boolean {
    return this.definition.capabilities.some(
      (cap) => cap.inputTypes.includes(taskType)
    );
  }

  getConfidenceForTask(taskType: string): number {
    const capability = this.findBestCapability(taskType);
    return capability?.confidence || 0;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
    this.status = AgentStatus.DISABLED;
  }

  async dispose(): Promise<void> {
    console.log(`[${this.displayName}] Disposing...`);
    this.status = AgentStatus.DISABLED;
  }
}
