/**
 * file index.ts
 * description @yyc3/core 模块入口
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 模块入口
 */
export { MCPClient } from './client.js'
export { HTTPTransport, SSETransport, StdioTransport, WebSocketTransport } from './transport.js'
export type { HTTPTransportConfig, SSETransportConfig, StdioTransportConfig, WebSocketTransportConfig } from './transport.js'
export type { MCPClientCapabilities, MCPMessage, MCPResource, MCPServerCapabilities, MCPTool, MCPToolResult, MCPTransport } from './types.js'
