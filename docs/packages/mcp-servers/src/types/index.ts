export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[]; items?: { type: string } }>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  priority?: number;
}

export interface MCPServerStatus {
  name: string;
  connected: boolean;
  lastPing?: Date;
  toolsCount?: number;
  error?: string;
}

export type MCPConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface MCPServerDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  tools: MCPTool[];
  configTemplate: MCPServerConfig;
  category: "search" | "code" | "database" | "filesystem" | "ai" | "container";
}

export interface MCPServerInstance {
  definition: MCPServerDefinition;
  status: MCPConnectionState;
  config: MCPServerConfig;
}

export interface MCPServerHandler {
  getTools(): MCPTool[];
  callTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult>;
}
