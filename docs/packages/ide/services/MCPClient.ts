/**
 * @file MCPClient.ts
 * @description MCP (Model Context Protocol) 客户端 - 支持 MCP 服务器连接、工具调用、资源管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags mcp,client,protocol,ai
 */

import { createLogger } from "../utils/logger";
const log = createLogger("MCP");

export interface MCPConfig {
  serverUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

export interface MCPToolCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

/**
 * MCP 客户端
 */
export class MCPClient {
  private config: MCPConfig;
  private connected: boolean = false;
  private tools: MCPTool[] = [];
  private resources: MCPResource[] = [];
  private prompts: MCPPrompt[] = [];

  constructor(config: MCPConfig) {
    this.config = config;
  }

  /**
   * 连接到 MCP 服务器
   */
  async connect(): Promise<boolean> {
    try {
      // 获取服务器能力
      const response = await this.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: { listChanged: true },
          sampling: {},
        },
        clientInfo: {
          name: "YYC3 Family AI",
          version: "1.0.0",
        },
      });

      this.connected = true;
      
      // 获取可用工具
      const toolsResponse = await this.request("tools/list", {});
      this.tools = toolsResponse.tools || [];

      // 获取可用资源
      const resourcesResponse = await this.request("resources/list", {});
      this.resources = resourcesResponse.resources || [];

      // 获取可用提示词
      const promptsResponse = await this.request("prompts/list", {});
      this.prompts = promptsResponse.prompts || [];

      log.info("Connected to server:", response.serverInfo);
      return true;
    } catch (error) {
      log.error("Connection failed:", error);
      this.connected = false;
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      await this.request("shutdown", {});
      this.connected = false;
      this.tools = [];
      this.resources = [];
      this.prompts = [];
      log.info("Disconnected");
    } catch (error) {
      log.error("Disconnect failed:", error);
    }
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    if (!this.connected) {
      throw new Error("MCP client not connected");
    }

    try {
      const result = await this.request("tools/call", {
        name,
        arguments: args,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 读取资源
   */
  async readResource(uri: string): Promise<MCPResourceContent> {
    if (!this.connected) {
      throw new Error("MCP client not connected");
    }

    try {
      const result = await this.request("resources/read", { uri });
      return result.contents[0] || {};
    } catch (error) {
      throw new Error(`Failed to read resource: ${(error as Error).message}`);
    }
  }

  /**
   * 获取提示词
   */
  async getPrompt(name: string, args?: Record<string, string>): Promise<{
    messages: Array<{ role: string; content: { type: string; text: string } }>;
  }> {
    if (!this.connected) {
      throw new Error("MCP client not connected");
    }

    try {
      const result = await this.request("prompts/get", {
        name,
        arguments: args,
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to get prompt: ${(error as Error).message}`);
    }
  }

  /**
   * 列出工具
   */
  listTools(): MCPTool[] {
    return [...this.tools];
  }

  /**
   * 列出资源
   */
  listResources(): MCPResource[] {
    return [...this.resources];
  }

  /**
   * 列出提示词
   */
  listPrompts(): MCPPrompt[] {
    return [...this.prompts];
  }

  /**
   * 发送 MCP 请求
   */
  private async request(method: string, params: any): Promise<any> {
    const response = await fetch(`${this.config.serverUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取工具 by 名称
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.find((t) => t.name === name);
  }

  /**
   * 获取资源 by URI
   */
  getResource(uri: string): MCPResource | undefined {
    return this.resources.find((r) => r.uri === uri);
  }

  /**
   * 获取提示词 by 名称
   */
  getPromptByName(name: string): MCPPrompt | undefined {
    return this.prompts.find((p) => p.name === name);
  }
}

// 导出单例工厂
export function createMCPClient(config: MCPConfig): MCPClient {
  return new MCPClient(config);
}

export default MCPClient;
