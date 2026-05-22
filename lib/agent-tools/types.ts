export enum ToolCategory {
  FILE_SYSTEM = 'file_system',
  WEB_ACCESS = 'web_access',
  DATABASE = 'database',
  AI_MODEL = 'ai_model',
  COMMUNICATION = 'communication',
  DATA_PROCESSING = 'data_processing',
  INTEGRATION = 'integration',
}

export enum ToolPermission {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  ADMIN = 'admin',
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;

  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      required?: boolean;
      default?: any;
      enum?: string[];
    }>;
    required?: string[];
  };

  outputSchema?: {
    type: string;
    description?: string;
    properties?: Record<string, any>;
  };

  permissions: ToolPermission[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };

  metadata: {
    author: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    documentation?: string;
  };
}

export interface ToolExecutionContext {
  sessionId: string;
  userId?: string;
  agentId?: string;
  timestamp: Date;
  requestId: string;
  metadata?: Record<string, any>;
}

export interface ToolExecutionResult<T = any> {
  success: boolean;
  toolId: string;
  output?: T;
  error?: string;
  executionTime: number;
  tokensUsed?: number;
  context?: ToolExecutionContext;
}

export interface ToolChainStep {
  toolId: string;
  input: any;
  config?: {
    timeout?: number;
    retryCount?: number;
    fallbackToolId?: string;
  };
  result?: ToolExecutionResult;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
}

export interface ToolChainDefinition {
  id: string;
  name: string;
  description: string;
  steps: ToolChainStep[];
  config: {
    parallel?: boolean;
    stopOnError?: boolean;
    timeout?: number;
    retryPolicy?: {
      maxRetries: number;
      backoffMs: number;
    };
  };
}
