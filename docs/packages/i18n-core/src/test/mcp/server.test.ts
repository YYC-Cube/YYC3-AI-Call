/**
 * file server.test.ts
 * description @yyc3/i18n-core server.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[mcp],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core server.ts 单元测试
 */
import { beforeEach, describe, expect, it } from "vitest";
import { MCPServer } from "../../lib/mcp/server.js";
import type { MCPMessage, MCPTransport } from "../../lib/mcp/types.js";

interface MockTransport extends MCPTransport {
  getSentMessages(): MCPMessage[];
  getMessageHandler(): ((message: MCPMessage) => void) | null;
}

function createMockTransport(): MockTransport {
  let messageHandler: ((message: MCPMessage) => void) | null = null;
  const sentMessages: MCPMessage[] = [];

  return {
    connected: false,
    async connect() {
      this.connected = true;
    },
    async send(message: MCPMessage) {
      sentMessages.push(message);
    },
    onMessage(handler: (message: MCPMessage) => void) {
      messageHandler = handler;
    },
    async close() {
      this.connected = false;
    },
    getSentMessages() {
      return sentMessages;
    },
    getMessageHandler() {
      return messageHandler;
    },
  } as MockTransport;
}

describe("MCPServer", () => {
  let server: MCPServer;
  let transport: MockTransport;

  beforeEach(() => {
    transport = createMockTransport();
    server = new MCPServer({
      name: "test-i18n-server",
      version: "1.0.0",
      transport: transport as MCPTransport,
    });
  });

  async function sendMessage(message: MCPMessage): Promise<MCPMessage> {
    const handler = transport.getMessageHandler();
    if (!handler) throw new Error("No handler registered");
    await handler(message);
    return transport.getSentMessages()[transport.getSentMessages().length - 1]!;
  }

  describe("start", () => {
    it("should connect transport and register handler", async () => {
      await server.start();
      expect(transport.connected).toBe(true);
    });

    it("should register message handler on transport", async () => {
      await server.start();
      expect(transport.getMessageHandler()).toBeDefined();
    });
  });

  describe("initialize response", () => {
    it("should respond to initialize request", async () => {
      await server.start();

      const response = await sendMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
    });

    it("should respond with server capabilities", async () => {
      await server.start();

      const response = await sendMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      const result = response.result as Record<string, unknown>;
      expect(result.capabilities).toBeDefined();
      expect(result.serverInfo).toBeDefined();
    });
  });

  describe("tools/list", () => {
    it("should respond with empty tools list by default", async () => {
      await server.start();

      await sendMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      const response = await sendMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      });

      expect(response.id).toBe(2);
      expect(response.result).toBeDefined();
    });
  });

  describe("registerTool", () => {
    it("should register a tool and include it in tools/list", async () => {
      server.registerTool(
        { name: "test-tool", description: "A test tool", inputSchema: { type: "object", properties: {} } },
        async () => ({ content: [{ type: "text", text: "test" }] }),
      );

      await server.start();

      await sendMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      const response = await sendMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      });

      const tools = (response.result as Record<string, unknown>).tools as Array<Record<string, unknown>>;
      expect(tools.length).toBe(1);
      expect(tools[0]!.name).toBe("test-tool");
    });
  });

  describe("tools/call", () => {
    it("should execute tool handler", async () => {
      server.registerTool(
        { name: "echo", description: "Echo tool", inputSchema: { type: "object", properties: {} } },
        async (args: Record<string, unknown>) => ({
          content: [{ type: "text" as const, text: JSON.stringify(args) }],
        }),
      );

      await server.start();

      await sendMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      const response = await sendMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "echo",
          arguments: { message: "hello" },
        },
      });

      expect(response.id).toBe(2);
      expect(response.result).toBeDefined();
    });

    it("should return error for unknown tool", async () => {
      await server.start();

      await sendMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      const response = await sendMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "nonexistent",
          arguments: {},
        },
      });

      expect(response.error).toBeDefined();
    });
  });

  describe("close", () => {
    it("should close transport", async () => {
      await server.start();
      await server.stop();
      expect(transport.connected).toBe(false);
    });
  });
});
