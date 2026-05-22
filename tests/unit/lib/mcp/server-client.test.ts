import { MCPServer } from '@/lib/mcp/server';
import { MCPClient } from '@/lib/mcp/client';
import {
  MCPMessageType,
  MCPRole,
  MCPServerConfig,
  MCPToolDefinition,
  MCPResource,
} from '@/lib/mcp/types';

describe('MCP Types', () => {
  describe('MCPMessageType Enum', () => {
    it('should have all message types defined', () => {
      expect(Object.keys(MCPMessageType).length).toBe(4);
      expect(MCPMessageType.REQUEST).toBe('request');
      expect(MCPMessageType.RESPONSE).toBe('response');
      expect(MCPMessageType.NOTIFICATION).toBe('notification');
      expect(MCPMessageType.ERROR).toBe('error');
    });
  });

  describe('MCPRole Enum', () => {
    it('should have client and server roles', () => {
      expect(Object.keys(MCPRole).length).toBe(2);
      expect(MCPRole.CLIENT).toBe('client');
      expect(MCPRole.SERVER).toBe('server');
    });
  });
});

describe('MCPServer', () => {
  let server: MCPServer;

  const testConfig: MCPServerConfig = {
    name: 'Test-MCP-Server',
    version: '1.0.0',
    description: 'Test MCP Server for unit testing',
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
      logging: false,
    },
    tools: [
      {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            param1: { type: 'string' },
          },
        },
        handler: async (params) => ({
          success: true,
          result: `Processed: ${JSON.stringify(params)}`,
        }),
      },
    ],
    resources: [
      {
        uri: 'resource://test/config',
        name: 'Test Config',
        description: 'Test configuration resource',
        capabilities: ['read'],
      },
    ],
  };

  beforeEach(() => {
    server = new MCPServer(testConfig);
  });

  describe('Initialization', () => {
    it('should create server with config', () => {
      expect(server).toBeDefined();
      expect(server.getConfig().name).toBe(testConfig.name);
      expect(server.getConfig().version).toBe(testConfig.version);
    });

    it('should register tools from config', () => {
      const toolNames = server.getToolNames();
      expect(toolNames).toContain('test-tool');
    });

    it('should register resources from config', () => {
      const resourceURIs = server.getResourceURIs();
      expect(resourceURIs).toContain('resource://test/config');
    });
  });

  describe('Message Handling', () => {
    it('should handle list-tools request', async () => {
      const message = {
        id: 'msg-1',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: { action: 'list-tools' },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.role).toBe(MCPRole.SERVER);
      expect(response.payload.tools).toBeDefined();
      expect(Array.isArray(response.payload.tools)).toBe(true);
    });

    it('should handle call-tool request', async () => {
      const message = {
        id: 'msg-2',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: {
          action: 'call-tool',
          params: { name: 'test-tool', arguments: { param1: 'value1' } },
        },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.payload.result).toBeDefined();
      expect(response.payload.result.success).toBe(true);
    });

    it('should handle call-tool with unknown tool', async () => {
      const message = {
        id: 'msg-3',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: {
          action: 'call-tool',
          params: { name: 'unknown-tool', arguments: {} },
        },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.ERROR);
      expect(response.payload.error).toBeDefined();
    });

    it('should handle list-resources request', async () => {
      const message = {
        id: 'msg-4',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: { action: 'list-resources' },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.payload.resources).toBeDefined();
      expect(Array.isArray(response.payload.resources)).toBe(true);
    });

    it('should handle read-resource request', async () => {
      const message = {
        id: 'msg-5',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: {
          action: 'read-resource',
          params: { uri: 'resource://test/config' },
        },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.payload.resource).toBeDefined();
      expect(response.payload.resource.uri).toBe('resource://test/config');
    });

    it('should handle get-server-info request', async () => {
      const message = {
        id: 'msg-6',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: { action: 'get-server-info' },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.payload.name).toBe(testConfig.name);
      expect(response.payload.version).toBe(testConfig.version);
    });

    it('should handle notification messages', async () => {
      const message = {
        id: 'msg-7',
        type: MCPMessageType.NOTIFICATION,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: { type: 'status-update', data: {} },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.payload.acknowledged).toBe(true);
    });

    it('should return error for unknown actions', async () => {
      const message = {
        id: 'msg-8',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: { action: 'unknown-action' },
      };

      const response = await server.handleMessage(message);

      expect(response.type).toBe(MCPMessageType.ERROR);
      expect(response.payload.error).toContain('Unknown action');
    });
  });

  describe('Tool Management', () => {
    it('should register new tool dynamically', () => {
      const newTool: MCPToolDefinition = {
        name: 'dynamic-tool',
        description: 'Dynamically registered tool',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        handler: async () => ({ result: 'ok' }),
      };

      server.registerTool(newTool);

      const toolNames = server.getToolNames();
      expect(toolNames).toContain('dynamic-tool');
    });

    it('should track all registered tools', () => {
      const initialCount = server.getToolNames().length;

      server.registerTool({
        name: 'extra-tool-1',
        description: 'Extra tool 1',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => ({}),
      });

      server.registerTool({
        name: 'extra-tool-2',
        description: 'Extra tool 2',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => ({}),
      });

      expect(server.getToolNames().length).toBe(initialCount + 2);
    });
  });

  describe('Resource Management', () => {
    it('should register new resource dynamically', () => {
      const newResource: MCPResource = {
        uri: 'resource://test/dynamic',
        name: 'Dynamic Resource',
        description: 'Dynamically registered resource',
        capabilities: ['read'],
      };

      server.registerResource(newResource);

      const resourceURIs = server.getResourceURIs();
      expect(resourceURIs).toContain('resource://test/dynamic');
    });
  });

  describe('Message History', () => {
    it('should track incoming messages', async () => {
      const message = {
        id: 'history-msg-1',
        type: MCPMessageType.REQUEST,
        role: MCPRole.CLIENT,
        timestamp: new Date(),
        payload: { action: 'list-tools' },
      };

      await server.handleMessage(message);

      const history = server.getMessageHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].id).toBe('history-msg-1');
    });
  });
});

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient({
      serverUrl: 'mcp://localhost:3000',
      timeout: 5000,
      retryCount: 3,
    });
  });

  describe('Connection Management', () => {
    it('should connect to server', async () => {
      await client.connect();

      expect(client.getConnectionStatus()).toBe(true);
    });

    it('should disconnect from server', async () => {
      await client.connect();
      await client.disconnect();

      expect(client.getConnectionStatus()).toBe(false);
    });

    it('should throw error when not connected', async () => {
      await expect(
        client.sendMessage({ payload: {} })
      ).rejects.toThrow('Not connected to MCP Server');
    });
  });

  describe('Message Operations', () => {
    beforeEach(async () => {
      await client.connect();
    });

    afterEach(async () => {
      if (client.getConnectionStatus()) {
        await client.disconnect();
      }
    });

    it('should send and receive messages', async () => {
      const response = await client.sendMessage({
        type: MCPMessageType.REQUEST,
        payload: { action: 'list-tools' },
      });

      expect(response.id).toBeDefined();
      expect(response.type).toBe(MCPMessageType.RESPONSE);
      expect(response.role).toBe(MCPRole.SERVER);
    });

    it('should list tools via convenience method', async () => {
      const tools = await client.listTools();

      expect(Array.isArray(tools)).toBe(true);
    });

    it('should call tool via convenience method', async () => {
      const result = await client.callTool('test-tool', { param1: 'test' });

      expect(result).toBeDefined();
    });

    it('should list resources via convenience method', async () => {
      const resources = await client.listResources();

      expect(Array.isArray(resources)).toBe(true);
    });

    it('should get server info via convenience method', async () => {
      const info = await client.getServerInfo();

      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.version).toBeDefined();
    });
  });

  describe('Message History Tracking', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should track sent and received messages', async () => {
      await client.sendMessage({
        type: MCPMessageType.REQUEST,
        payload: { action: 'list-tools' },
      });

      const history = client.getMessageHistory();

      expect(history.length).toBeGreaterThanOrEqual(2); // Request + Response
    });
  });
});
