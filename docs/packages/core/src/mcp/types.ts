/**
 * file types.ts
 * description @yyc3/core 类型定义
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
 * brief @yyc3/core 类型定义
 */
/**
 * MCP 消息类型
 */
export type MCPMessageType = 
  | 'request'
  | 'response'
  | 'notification'
  | 'error'

/**
 * MCP 消息
 */
export interface MCPMessage {
  jsonrpc: '2.0'
  id?: string | number
  method?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * MCP 工具定义
 */
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, {
      type: string
      description?: string
      enum?: string[]
    }>
    required?: string[]
  }
}

/**
 * MCP 资源
 */
export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

/**
 * MCP 服务器能力
 */
export interface MCPServerCapabilities {
  tools?: { listChanged?: boolean }
  resources?: { subscribe?: boolean; listChanged?: boolean }
  prompts?: { listChanged?: boolean }
  logging?: object
  sampling?: object
  roots?: { listChanged?: boolean }
}

export interface MCPClientCapabilities {
  tools?: { listChanged?: boolean }
  resources?: { subscribe?: boolean; listChanged?: boolean }
  prompts?: { listChanged?: boolean }
  sampling?: object
  roots?: { listChanged?: boolean }
}

/**
 * MCP 传输接口
 */
export interface MCPTransport {
  connected: boolean
  connect(): Promise<void>
  send(message: MCPMessage): Promise<void>
  onMessage(handler: (message: MCPMessage) => void): void
  close(): Promise<void>
}

/**
 * MCP 客户端配置
 */
export interface MCPClientConfig {
  name: string
  version: string
  transport: MCPTransport
  capabilities?: {
    tools?: boolean
    resources?: boolean
    prompts?: boolean
  }
}

/**
 * MCP 工具调用结果
 */
export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}
