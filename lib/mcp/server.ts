import {
  MCPMessage,
  MCPMessageType,
  MCPRole,
  MCPServerConfig,
  MCPResource,
  MCPToolDefinition,
} from './types';

export class MCPServer {
  private config: MCPServerConfig;
  private tools: Map<string, MCPToolDefinition> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private messageHandlers: Map<string, (message: MCPMessage) => Promise<MCPMessage>> =
    new Map();
  private messageHistory: MCPMessage[] = [];

  constructor(config: MCPServerConfig) {
    this.config = config;

    if (config.tools) {
      for (const tool of config.tools) {
        this.tools.set(tool.name, tool);
      }
    }

    if (config.resources) {
      for (const resource of config.resources) {
        this.resources.set(resource.uri, resource);
      }
    }
  }

  getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  async handleMessage(message: MCPMessage): Promise<MCPMessage> {
    console.log(`📨 MCP Server [${this.config.name}] received message:`, message.type);

    this.messageHistory.push(message);

    try {
      switch (message.type) {
        case MCPMessageType.REQUEST:
          return await this.handleRequest(message);

        case MCPMessageType.NOTIFICATION:
          return await this.handleNotification(message);

        default:
          throw new Error(`Unsupported message type: ${message.type}`);
      }
    } catch (error) {
      return {
        id: `error-${Date.now()}`,
        type: MCPMessageType.ERROR,
        role: MCPRole.SERVER,
        timestamp: new Date(),
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          originalMessageId: message.id,
        },
      };
    }
  }

  private async handleRequest(message: MCPMessage): Promise<MCPMessage> {
    const { action, params } = message.payload;

    switch (action) {
      case 'list-tools':
        return {
          id: `resp-${Date.now()}`,
          type: MCPMessageType.RESPONSE,
          role: MCPRole.SERVER,
          timestamp: new Date(),
          payload: {
            tools: Array.from(this.tools.values()).map((tool) => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            })),
          },
          metadata: { source: this.config.name, correlationId: message.id },
        };

      case 'call-tool':
        if (!params?.name) {
          throw new Error('Tool name is required');
        }

        const tool = this.tools.get(params.name);

        if (!tool) {
          throw new Error(`Tool not found: ${params.name}`);
        }

        const result = await tool.handler(params.arguments || {});

        return {
          id: `resp-${Date.now()}`,
          type: MCPMessageType.RESPONSE,
          role: MCPRole.SERVER,
          timestamp: new Date(),
          payload: { result },
          metadata: { source: this.config.name, correlationId: message.id },
        };

      case 'list-resources':
        return {
          id: `resp-${Date.now()}`,
          type: MCPMessageType.RESPONSE,
          role: MCPRole.SERVER,
          timestamp: new Date(),
          payload: {
            resources: Array.from(this.resources.values()),
          },
          metadata: { source: this.config.name, correlationId: message.id },
        };

      case 'read-resource':
        if (!params?.uri) {
          throw new Error('Resource URI is required');
        }

        const resource = this.resources.get(params.uri);

        if (!resource) {
          throw new Error(`Resource not found: ${params.uri}`);
        }

        return {
          id: `resp-${Date.now()}`,
          type: MCPMessageType.RESPONSE,
          role: MCPRole.SERVER,
          timestamp: new Date(),
          payload: { resource },
          metadata: { source: this.config.name, correlationId: message.id },
        };

      case 'get-server-info':
        return {
          id: `resp-${Date.now()}`,
          type: MCPMessageType.RESPONSE,
          role: MCPRole.SERVER,
          timestamp: new Date(),
          payload: {
            name: this.config.name,
            version: this.config.version,
            description: this.config.description,
            capabilities: this.config.capabilities,
          },
          metadata: { source: this.config.name, correlationId: message.id },
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async handleNotification(message: MCPMessage): Promise<MCPMessage> {
    console.log('📢 Processing notification:', message.payload);

    return {
      id: `notif-ack-${Date.now()}`,
      type: MCPMessageType.RESPONSE,
      role: MCPRole.SERVER,
      timestamp: new Date(),
      payload: { acknowledged: true, notificationType: message.payload.type },
      metadata: { source: this.config.name, correlationId: message.id },
    };
  }

  registerTool(tool: MCPToolDefinition): void {
    this.tools.set(tool.name, tool);
    console.log(`✅ Tool registered: ${tool.name}`);
  }

  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    console.log(`✅ Resource registered: ${resource.uri}`);
  }

  getMessageHistory(): MCPMessage[] {
    return [...this.messageHistory];
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getResourceURIs(): string[] {
    return Array.from(this.resources.keys());
  }
}
