import EventEmitter from 'eventemitter3';

/**
 * MCP 消息
 */
interface MCPMessage {
    jsonrpc: '2.0';
    id?: string | number;
    method?: string;
    params?: Record<string, unknown>;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
/**
 * MCP 工具定义
 */
interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description?: string;
            enum?: string[];
        }>;
        required?: string[];
    };
}
/**
 * MCP 资源
 */
interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
/**
 * MCP 服务器能力
 */
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
    logging?: object;
    sampling?: object;
    roots?: {
        listChanged?: boolean;
    };
}
interface MCPClientCapabilities {
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
    sampling?: object;
    roots?: {
        listChanged?: boolean;
    };
}
/**
 * MCP 传输接口
 */
interface MCPTransport {
    connected: boolean;
    connect(): Promise<void>;
    send(message: MCPMessage): Promise<void>;
    onMessage(handler: (message: MCPMessage) => void): void;
    close(): Promise<void>;
}
/**
 * MCP 客户端配置
 */
interface MCPClientConfig {
    name: string;
    version: string;
    transport: MCPTransport;
    capabilities?: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
    };
}
/**
 * MCP 工具调用结果
 */
interface MCPToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}

/**
 * file client.ts
 * description MCP 客户端
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 客户端
 */

/**
 * MCP 客户端事件
 */
interface MCPClientEvents {
    connected: () => void;
    disconnected: () => void;
    error: (error: Error) => void;
    toolListChanged: (tools: MCPTool[]) => void;
    resourceListChanged: (resources: MCPResource[]) => void;
}
/**
 * MCP 客户端
 * 实现 Model Context Protocol 客户端
 */
declare class MCPClient extends EventEmitter<MCPClientEvents> {
    private config;
    private transport;
    private messageId;
    private pendingRequests;
    private _tools;
    private _resources;
    private _capabilities?;
    constructor(config: MCPClientConfig);
    get connected(): boolean;
    get tools(): MCPTool[];
    get resources(): MCPResource[];
    get capabilities(): MCPServerCapabilities | undefined;
    /**
     * 连接到 MCP 服务器
     */
    connect(): Promise<void>;
    /**
     * 刷新工具列表
     */
    refreshTools(): Promise<MCPTool[]>;
    /**
     * 刷新资源列表
     */
    refreshResources(): Promise<MCPResource[]>;
    /**
     * 调用工具
     */
    callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult>;
    /**
     * 读取资源
     */
    readResource(uri: string): Promise<unknown>;
    /**
     * 发送请求
     */
    private request;
    /**
     * 发送通知
     */
    private notify;
    /**
     * 设置传输层消息处理
     */
    private setupTransport;
    /**
     * 处理通知
     */
    private handleNotification;
    /**
     * 关闭连接
     */
    close(): Promise<void>;
}

/**
 * file transport.ts
 * description MCP 传输层
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 传输层
 */

/**
 * Stdio 传输配置
 */
interface StdioTransportConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
/**
 * HTTP 传输配置
 */
interface HTTPTransportConfig {
    url: string;
    headers?: Record<string, string>;
}
/**
 * Stdio 传输实现
 * 通过标准输入输出与 MCP 服务器通信
 */
declare class StdioTransport implements MCPTransport {
    private config;
    private _connected;
    private messageHandler?;
    private process?;
    constructor(config: StdioTransportConfig);
    get connected(): boolean;
    connect(): Promise<void>;
    send(message: MCPMessage): Promise<void>;
    onMessage(handler: (message: MCPMessage) => void): void;
    close(): Promise<void>;
}
/**
 * WebSocket 传输配置
 */
interface WebSocketTransportConfig {
    url: string;
    headers?: Record<string, string>;
    reconnect?: boolean;
    maxReconnectAttempts?: number;
}
/**
 * WebSocket 传输实现
 * 纯 WebSocket 连接，支持自动重连
 */
declare class WebSocketTransport implements MCPTransport {
    private config;
    private _connected;
    private messageHandler?;
    private ws?;
    private reconnectAttempts;
    constructor(config: WebSocketTransportConfig);
    get connected(): boolean;
    connect(): Promise<void>;
    send(message: MCPMessage): Promise<void>;
    onMessage(handler: (message: MCPMessage) => void): void;
    close(): Promise<void>;
}
/**
 * SSE 传输配置
 */
interface SSETransportConfig {
    url: string;
    headers?: Record<string, string>;
}
/**
 * SSE (Server-Sent Events) 传输实现
 * MCP 2025 规范推荐的 HTTP 传输方式
 */
declare class SSETransport implements MCPTransport {
    private config;
    private _connected;
    private messageHandler?;
    private eventSource?;
    private messageEndpoint?;
    constructor(config: SSETransportConfig);
    get connected(): boolean;
    connect(): Promise<void>;
    send(message: MCPMessage): Promise<void>;
    onMessage(handler: (message: MCPMessage) => void): void;
    close(): Promise<void>;
}
/**
 * HTTP 传输实现
 * 通过 HTTP/WebSocket 与 MCP 服务器通信
 */
declare class HTTPTransport implements MCPTransport {
    private config;
    private _connected;
    private messageHandler?;
    private ws?;
    constructor(config: HTTPTransportConfig);
    get connected(): boolean;
    connect(): Promise<void>;
    send(message: MCPMessage): Promise<void>;
    onMessage(handler: (message: MCPMessage) => void): void;
    close(): Promise<void>;
}

export { HTTPTransport, type HTTPTransportConfig, MCPClient, type MCPClientCapabilities, type MCPMessage, type MCPResource, type MCPServerCapabilities, type MCPTool, type MCPToolResult, type MCPTransport, SSETransport, type SSETransportConfig, StdioTransport, type StdioTransportConfig, WebSocketTransport, type WebSocketTransportConfig };
