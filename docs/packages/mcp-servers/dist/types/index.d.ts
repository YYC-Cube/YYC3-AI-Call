interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
            items?: {
                type: string;
            };
        }>;
        required?: string[];
    };
}
interface MCPToolResult {
    content: Array<{
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}
interface MCPServerConfig {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    enabled: boolean;
    priority?: number;
}
interface MCPServerStatus {
    name: string;
    connected: boolean;
    lastPing?: Date;
    toolsCount?: number;
    error?: string;
}
type MCPConnectionState = "disconnected" | "connecting" | "connected" | "error";
interface MCPServerDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    tools: MCPTool[];
    configTemplate: MCPServerConfig;
    category: "search" | "code" | "database" | "filesystem" | "ai" | "container";
}
interface MCPServerInstance {
    definition: MCPServerDefinition;
    status: MCPConnectionState;
    config: MCPServerConfig;
}
interface MCPServerHandler {
    getTools(): MCPTool[];
    callTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult>;
}

export type { MCPConnectionState, MCPServerConfig, MCPServerDefinition, MCPServerHandler, MCPServerInstance, MCPServerStatus, MCPTool, MCPToolResult };
