export enum AgentRole {
  MASTER = 'master',
  SENTINEL = 'sentinel',
  QUALITY = 'quality',
  CREATIVE = 'creative',
  NAVIGATOR = 'navigator',
  THINKER = 'thinker',
  PROPHET = 'prophet',
  RECOMMENDER = 'recommender',
}

export enum AgentStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  WAITING = 'waiting',
  ERROR = 'error',
  DISABLED = 'disabled',
}

export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CollaborationMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  HIERARCHICAL = 'hierarchical',
  CONSENSUS = 'consensus',
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'generation' | 'execution' | 'monitoring' | 'recommendation';
  inputTypes: string[];
  outputTypes: string[];
  confidence: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  displayName: string;
  role: AgentRole;
  emoji: string;
  description: string;
  capabilities: AgentCapability[];
  maxConcurrentTasks: number;
  defaultTimeout: number;
  version: string;
}

export interface AgentConfig {
  agentId: string;
  enabled: boolean;
  priority: number;
  timeout?: number;
  retryCount: number;
  customSettings?: Record<string, unknown>;
}

export interface TaskInput {
  type: string;
  data: Record<string, unknown>;
  metadata?: {
    source?: string;
    timestamp?: Date;
    priority?: TaskPriority;
    sessionId?: string;
    userId?: string;
  };
}

export interface TaskOutput {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  metadata: {
    executionTime: number;
    tokensUsed?: number;
    confidence?: number;
    agentId: string;
    timestamp: Date;
  };
}

export interface AIFamilyTask {
  id: string;
  type: string;
  input: TaskInput;
  status: 'pending' | 'assigned' | 'processing' | 'completed' | 'failed' | 'cancelled';
  assignedAgent?: string;
  output?: TaskOutput;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  priority: TaskPriority;
  retries: number;
  maxRetries: number;
  collaborationId?: string;
}

export interface CollaborationSession {
  id: string;
  mode: CollaborationMode;
  status: 'initialized' | 'running' | 'completed' | 'failed' | 'cancelled';
  tasks: AIFamilyTask[];
  agents: string[];
  results: Map<string, TaskOutput>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface AgentRecommendation {
  agentId: string;
  confidence: number;
  reason: string;
  estimatedTime: number;
  capabilities: string[];
}

export interface AIFamilyMetrics {
  totalTasksProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  activeAgents: number;
  queueLength: number;
  collaborationSessions: number;
  lastActivity: Date;
}

export interface AgentSnapshot {
  id: string;
  definition: AgentDefinition;
  config: AgentConfig;
  status: AgentStatus;
  currentTask?: string;
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    averageExecutionTime: number;
    uptime: number;
  };
  capabilities: AgentCapability[];
}
