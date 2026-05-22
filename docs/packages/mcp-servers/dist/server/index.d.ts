import { MCPServerHandler, MCPTool, MCPToolResult } from '../types/index.js';

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

export { MCPServerBase, type MCPServerBaseConfig, type MCPServerCapabilities };
