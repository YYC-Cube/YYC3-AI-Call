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
import type { MCPTool, MCPToolResult, MCPServerHandler } from '../types/index.js'

export interface MCPServerBaseConfig {
  name: string
  version: string
  description?: string
}

export interface MCPServerCapabilities {
  tools?: { listChanged?: boolean }
  resources?: { subscribe?: boolean; listChanged?: boolean }
  prompts?: { listChanged?: boolean }
}

interface JSONRPCRequest {
  jsonrpc: '2.0'
  id?: string | number
  method: string
  params?: Record<string, unknown>
}

interface JSONRPCResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export abstract class MCPServerBase implements MCPServerHandler {
  protected config: MCPServerBaseConfig
  protected running = false

  constructor(config: MCPServerBaseConfig) {
    this.config = config
  }

  abstract getTools(): MCPTool[]
  abstract callTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult>

  getCapabilities(): MCPServerCapabilities {
    return {
      tools: { listChanged: false },
    }
  }

  async start(): Promise<void> {
    this.running = true
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    let buffer = ''

    const stdin = process.stdin
    const stdout = process.stdout

    stdin.on('data', (chunk: Buffer) => {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const request = JSON.parse(line) as JSONRPCRequest
          const response = this.handleRequest(request)
          const responseStr = JSON.stringify(response)
          stdout.write(encoder.encode(responseStr + '\n'))
        } catch {
          // ignore parse errors
        }
      }
    })

    stdin.on('end', () => {
      this.running = false
    })
  }

  stop(): void {
    this.running = false
  }

  private handleRequest(request: JSONRPCRequest): JSONRPCResponse {
    const id = request.id ?? null

    switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: this.getCapabilities(),
            serverInfo: {
              name: this.config.name,
              version: this.config.version,
            },
          },
        }

      case 'notifications/initialized':
        return { jsonrpc: '2.0', id, result: {} }

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: { tools: this.getTools() },
        }

      case 'tools/call': {
        const params = request.params || {}
        const toolName = params.name as string
        const args = (params.arguments as Record<string, unknown>) || {}

        this.callTool(toolName, args)
          .then((result) => {
            const response: JSONRPCResponse = {
              jsonrpc: '2.0',
              id,
              result,
            }
            process.stdout.write(
              new TextEncoder().encode(JSON.stringify(response) + '\n')
            )
          })
          .catch((error) => {
            const response: JSONRPCResponse = {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32603,
                message: error instanceof Error ? error.message : String(error),
              },
            }
            process.stdout.write(
              new TextEncoder().encode(JSON.stringify(response) + '\n')
            )
          })

        return { jsonrpc: '2.0', id, result: { _pending: true } }
      }

      case 'ping':
        return { jsonrpc: '2.0', id, result: {} }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        }
    }
  }

  protected success(text: string): MCPToolResult {
    return {
      content: [{ type: 'text', text }],
    }
  }

  protected error(message: string): MCPToolResult {
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    }
  }
}
