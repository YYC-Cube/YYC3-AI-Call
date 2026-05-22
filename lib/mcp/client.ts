import {
  MCPMessage,
  MCPMessageType,
  MCPRole,
  MCPClientConfig,
} from './types';

export class MCPClient {
  private config: MCPClientConfig;
  private messageHistory: MCPMessage[] = [];
  private isConnected: boolean = false;

  constructor(config: MCPClientConfig) {
    this.config = {
      timeout: config.timeout || 30000,
      retryCount: config.retryCount || 3,
      ...config,
    };
  }

  async connect(): Promise<void> {
    console.log(`🔌 Connecting to MCP Server: ${this.config.serverUrl}`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    this.isConnected = true;
    console.log('✅ Connected to MCP Server');
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting from MCP Server...');

    await new Promise((resolve) => setTimeout(resolve, 200));

    this.isConnected = false;
    console.log('✅ Disconnected from MCP Server');
  }

  async sendMessage(message: Partial<MCPMessage>): Promise<MCPMessage> {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP Server');
    }

    const fullMessage: MCPMessage = {
      id: message.id || `client-${Date.now()}`,
      type: message.type || MCPMessageType.REQUEST,
      role: MCPRole.CLIENT,
      timestamp: new Date(),
      payload: message.payload || {},
      metadata: {
        source: 'mcp-client',
        destination: this.config.serverUrl,
        ...message.metadata,
      },
    };

    console.log(`📤 Sending message to server:`, fullMessage.type);

    this.messageHistory.push(fullMessage);

    const response = await this.simulateServerResponse(fullMessage);

    this.messageHistory.push(response);

    return response;
  }

  async listTools(): Promise<any[]> {
    const response = await this.sendMessage({
      type: MCPMessageType.REQUEST,
      payload: { action: 'list-tools' },
    });

    return response.payload.tools || [];
  }

  async callTool(name: string, args: any = {}): Promise<any> {
    const response = await this.sendMessage({
      type: MCPMessageType.REQUEST,
      payload: {
        action: 'call-tool',
        params: { name, arguments: args },
      },
    });

    return response.payload.result;
  }

  async listResources(): Promise<any[]> {
    const response = await this.sendMessage({
      type: MCPMessageType.REQUEST,
      payload: { action: 'list-resources' },
    });

    return response.payload.resources || [];
  }

  async readResource(uri: string): Promise<any> {
    const response = await this.sendMessage({
      type: MCPMessageType.REQUEST,
      payload: {
        action: 'read-resource',
        params: { uri },
      },
    });

    return response.payload.resource;
  }

  async getServerInfo(): Promise<any> {
    const response = await this.sendMessage({
      type: MCPMessageType.REQUEST,
      payload: { action: 'get-server-info' },
    });

    return response.payload;
  }

  private async simulateServerResponse(request: MCPMessage): Promise<MCPMessage> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 200 + 100)
    );

    return {
      id: `server-${Date.now()}`,
      type: MCPMessageType.RESPONSE,
      role: MCPRole.SERVER,
      timestamp: new Date(),
      payload: this.generateMockResponse(request),
      metadata: {
        source: this.config.serverUrl,
        correlationId: request.id,
      },
    };
  }

  private generateMockResponse(request: MCPMessage): any {
    const { action } = request.payload;

    switch (action) {
      case 'list-tools':
        return {
          tools: [
            {
              name: 'file-system',
              description: 'File system operations',
              inputSchema: { type: 'object', properties: {} },
            },
            {
              name: 'web-access',
              description: 'Web access and fetching',
              inputSchema: { type: 'object', properties: {} },
            },
          ],
        };

      case 'call-tool':
        return {
          result: {
            success: true,
            data: `Tool execution result for ${request.payload.params?.name}`,
            executedAt: new Date(),
          },
        };

      case 'list-resources':
        return {
          resources: [
            { uri: 'resource://example/doc1', name: 'Document 1' },
            { uri: 'resource://example/data1', name: 'Data Set 1' },
          ],
        };

      case 'get-server-info':
        return {
          name: this.config.serverUrl || 'MCP Server',
          version: '1.0.0',
        };

      default:
        return { status: 'ok' };
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getMessageHistory(): MCPMessage[] {
    return [...this.messageHistory];
  }
}
