import {
  ToolDefinition,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolChainStep,
  ToolChainDefinition,
  ToolCategory,
  ToolPermission,
} from './types';

export abstract class BaseTool<TInput = any, TOutput = any> {
  protected definition: ToolDefinition;

  constructor(definition: ToolDefinition) {
    this.definition = definition;
  }

  getDefinition(): ToolDefinition {
    return this.definition;
  }

  getId(): string {
    return this.definition.id;
  }

  getName(): string {
    return this.definition.name;
  }

  getCategory(): ToolCategory {
    return this.definition.category;
  }

  abstract execute(
    input: TInput,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult<TOutput>>;

  async validateInput(input: TInput): Promise<{ valid: boolean; errors?: string[] }> {
    const schema = this.definition.inputSchema;
    const errors: string[] = [];
    const inputObj = input as Record<string, any>;

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in inputObj)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    for (const key of Object.keys(inputObj)) {
      if (!(key in schema.properties)) {
        errors.push(`Unknown field: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

export class FileSystemTool extends BaseTool {
  constructor() {
    super({
      id: 'file-system',
      name: 'File System',
      description: 'Read and write files from the local file system',
      category: ToolCategory.FILE_SYSTEM,
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Action to perform (read, write, list, delete)',
            enum: ['read', 'write', 'list', 'delete'],
          },
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['action', 'path'],
      },
      permissions: [ToolPermission.READ, ToolPermission.WRITE],
      metadata: {
        author: 'YYC3 Team',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['file', 'io', 'storage'],
      },
    });
  }

  async execute(
    input: { action: string; path: string; content?: string },
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    console.log(`📁 File System Tool: ${input.action} ${input.path}`);

    await new Promise((resolve) => setTimeout(resolve, 300));

    switch (input.action) {
      case 'read':
        return {
          success: true,
          toolId: this.getId(),
          output: {
            content: `File content of ${input.path}`,
            size: 1024,
            modifiedAt: new Date(),
          },
          executionTime: 300,
          context,
        };

      case 'write':
        return {
          success: true,
          toolId: this.getId(),
          output: {
            message: `File written successfully to ${input.path}`,
            bytesWritten: input.content?.length || 0,
          },
          executionTime: 250,
          context,
        };

      case 'list':
        return {
          success: true,
          toolId: this.getId(),
          output: {
            files: ['file1.txt', 'file2.md', 'file3.json'],
            directory: input.path,
          },
          executionTime: 200,
          context,
        };

      case 'delete':
        return {
          success: true,
          toolId: this.getId(),
          output: { message: `File deleted: ${input.path}` },
          executionTime: 150,
          context,
        };

      default:
        throw new Error(`Unsupported action: ${input.action}`);
    }
  }
}

export class WebAccessTool extends BaseTool {
  constructor() {
    super({
      id: 'web-access',
      name: 'Web Access',
      description: 'Access web resources and fetch data from URLs',
      category: ToolCategory.WEB_ACCESS,
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to access' },
          method: {
            type: 'string',
            description: 'HTTP method',
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
          },
          headers: { type: 'object', description: 'Request headers' },
          body: { type: 'object', description: 'Request body for POST/PUT' },
        },
        required: ['url'],
      },
      permissions: [ToolPermission.READ, ToolPermission.EXECUTE],
      metadata: {
        author: 'YYC3 Team',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['web', 'http', 'api', 'fetch'],
      },
    });
  }

  async execute(
    input: { url: string; method?: string; headers?: any; body?: any },
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    console.log(`🌐 Web Access Tool: ${input.method || 'GET'} ${input.url}`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      toolId: this.getId(),
      output: {
        status: 200,
        data: { message: `Fetched data from ${input.url}`, timestamp: new Date() },
        headers: { 'content-type': 'application/json' },
      },
      executionTime: 500,
      tokensUsed: 50,
      context,
    };
  }
}

export class DatabaseTool extends BaseTool {
  constructor() {
    super({
      id: 'database',
      name: 'Database',
      description: 'Execute database queries and operations',
      category: ToolCategory.DATABASE,
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'SQL query or operation' },
          params: { type: 'array', description: 'Query parameters' },
          table: { type: 'string', description: 'Table name' },
          operation: {
            type: 'string',
            enum: ['select', 'insert', 'update', 'delete'],
          },
        },
        required: ['operation'],
      },
      permissions: [ToolPermission.READ, ToolPermission.WRITE, ToolPermission.EXECUTE],
      metadata: {
        author: 'YYC3 Team',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['database', 'sql', 'query', 'data'],
      },
    });
  }

  async execute(
    input: { operation: string; query?: string; params?: any[]; table?: string },
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    console.log(`💾 Database Tool: ${input.operation} on ${input.table || 'unknown'}`);

    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      success: true,
      toolId: this.getId(),
      output: {
        rows: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
          id: i + 1,
          name: `Record ${i + 1}`,
          value: Math.random() * 100,
        })),
        affectedRows: input.operation !== 'select' ? Math.floor(Math.random() * 5) + 1 : undefined,
      },
      executionTime: 400,
      tokensUsed: 30,
      context,
    };
  }
}
