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

declare const SERVER_DEFINITIONS: MCPServerDefinition[];
declare function getServerDefinition(id: string): MCPServerDefinition | undefined;
declare function getServersByCategory(category: MCPServerDefinition["category"]): MCPServerDefinition[];
declare function getAllTools(): MCPTool[];
declare function getToolByName(toolName: string): MCPTool | undefined;

/**
 * file server-base.ts
 * description MCP Server 基础类 — JSON-RPC 2.0 stdio transport
 * module @yyc3/mcp-servers
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-04-27
 * updated 2026-04-27
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP Server 基础类
 */

interface MCPServerBaseConfig {
    name: string;
    version: string;
    description?: string;
}
interface MCPServerCapabilities {
    tools?: {
        listChanged?: boolean;
    };
    resources?: {
        subscribe?: boolean;
        listChanged?: boolean;
    };
    prompts?: {
        listChanged?: boolean;
    };
}
declare abstract class MCPServerBase implements MCPServerHandler {
    protected config: MCPServerBaseConfig;
    protected running: boolean;
    constructor(config: MCPServerBaseConfig);
    abstract getTools(): MCPTool[];
    abstract callTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult>;
    getCapabilities(): MCPServerCapabilities;
    start(): Promise<void>;
    stop(): void;
    private handleRequest;
    protected success(text: string): MCPToolResult;
    protected error(message: string): MCPToolResult;
}

export { type MCPConnectionState, MCPServerBase, type MCPServerBaseConfig, type MCPServerCapabilities, type MCPServerConfig, type MCPServerDefinition, type MCPServerHandler, type MCPServerInstance, type MCPServerStatus, type MCPTool, type MCPToolResult, SERVER_DEFINITIONS, getAllTools, getServerDefinition, getServersByCategory, getToolByName };
