/**
 * file mcp.test.ts
 * description @yyc3/core mcp.ts 单元测试
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[mcp],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core mcp.ts 单元测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MCPClient } from '../mcp/client.js'
import type { MCPClientConfig, MCPPrompt, MCPResource, MCPTool } from '../mcp/types.js'

describe('MCPClient', () => {
  let client: MCPClient
  let mockTransport: any

  let _messageHandler: ((msg: any) => void) | undefined

  beforeEach(() => {
    _messageHandler = undefined
    mockTransport = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockImplementation((msg: any) => {
        if (!_messageHandler) return Promise.resolve()
        if (msg.method === 'initialize') {
          setImmediate(() => {
            _messageHandler!({
              jsonrpc: '2.0',
              id: msg.id,
              result: { capabilities: { tools: true, resources: true } },
            })
          })
        } else if (msg.method === 'tools/list') {
          setImmediate(() => {
            _messageHandler!({ jsonrpc: '2.0', id: msg.id, result: { tools: [] } })
          })
        } else if (msg.method === 'resources/list') {
          setImmediate(() => {
            _messageHandler!({ jsonrpc: '2.0', id: msg.id, result: { resources: [] } })
          })
        } else if (msg.id) {
          setImmediate(() => {
            _messageHandler!({ jsonrpc: '2.0', id: msg.id, result: {} })
          })
        }
        return Promise.resolve()
      }),
      onMessage: vi.fn().mockImplementation((handler: any) => {
        _messageHandler = handler
      }),
      connected: false,
    }

    const config: MCPClientConfig = {
      transport: mockTransport,
      name: 'test-client',
      version: '1.0.0',
    }

    client = new MCPClient(config)
  })

  afterEach(async () => {
    try {
      await client.close()
    } catch {
      // ignore
    }
  })

  describe('构造函数', () => {
    it('应该创建客户端实例', () => {
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(MCPClient)
    })
  })

  describe('connect', () => {
    it('应该连接到服务器', async () => {
      await client.connect()
      expect(mockTransport.connect).toHaveBeenCalled()
    })
  })

  describe('close', () => {
    it('应该关闭连接', async () => {
      await client.close()
      expect(mockTransport.close).toHaveBeenCalled()
    })
  })

  describe('connected', () => {
    it('应该返回连接状态', () => {
      expect(typeof client.connected).toBe('boolean')
    })
  })

  describe('tools', () => {
    it('应该返回工具列表', () => {
      expect(Array.isArray(client.tools)).toBe(true)
    })
  })

  describe('resources', () => {
    it('应该返回资源列表', () => {
      expect(Array.isArray(client.resources)).toBe(true)
    })
  })
})

describe('MCP Types', () => {
  it('MCPTool 应该有正确的结构', () => {
    const tool: MCPTool = {
      name: 'test',
      description: 'Test tool',
      inputSchema: { type: 'object' },
    }

    expect(tool.name).toBe('test')
    expect(tool.description).toBe('Test tool')
    expect(tool.inputSchema).toBeDefined()
  })

  it('MCPPrompt 应该有正确的结构', () => {
    const prompt: MCPPrompt = {
      name: 'test',
      description: 'Test prompt',
    }

    expect(prompt.name).toBe('test')
    expect(prompt.description).toBe('Test prompt')
  })

  it('MCPResource 应该有正确的结构', () => {
    const resource: MCPResource = {
      uri: 'test://resource',
      name: 'Test Resource',
    }

    expect(resource.uri).toBe('test://resource')
    expect(resource.name).toBe('Test Resource')
  })
})

describe('WebSocketTransport', () => {
  it('应该创建实例并配置默认值', async () => {
    const { WebSocketTransport } = await import('../mcp/transport.js')
    const transport = new WebSocketTransport({ url: 'ws://localhost:8080' })
    expect(transport).toBeDefined()
    expect(transport.connected).toBe(false)
  })

  it('应该接受自定义配置', async () => {
    const { WebSocketTransport } = await import('../mcp/transport.js')
    const transport = new WebSocketTransport({
      url: 'ws://localhost:8080',
      reconnect: false,
      maxReconnectAttempts: 3,
      headers: { Authorization: 'Bearer test' },
    })
    expect(transport).toBeDefined()
  })
})

describe('SSETransport', () => {
  it('应该创建实例', async () => {
    const { SSETransport } = await import('../mcp/transport.js')
    const transport = new SSETransport({ url: 'http://localhost:8080/sse' })
    expect(transport).toBeDefined()
    expect(transport.connected).toBe(false)
  })

  it('应该接受自定义 headers', async () => {
    const { SSETransport } = await import('../mcp/transport.js')
    const transport = new SSETransport({
      url: 'http://localhost:8080/sse',
      headers: { Authorization: 'Bearer test' },
    })
    expect(transport).toBeDefined()
  })
})

describe('StdioTransport', () => {
  it('应该创建实例', async () => {
    const { StdioTransport } = await import('../mcp/transport.js')
    const transport = new StdioTransport({ command: 'node', args: ['server.js'] })
    expect(transport).toBeDefined()
    expect(transport.connected).toBe(false)
  })

  it('应该接受环境变量配置', async () => {
    const { StdioTransport } = await import('../mcp/transport.js')
    const transport = new StdioTransport({
      command: 'node',
      args: ['server.js'],
      env: { NODE_ENV: 'test' },
    })
    expect(transport).toBeDefined()
  })
})

describe('HTTPTransport', () => {
  it('应该创建实例', async () => {
    const { HTTPTransport } = await import('../mcp/transport.js')
    const transport = new HTTPTransport({ url: 'http://localhost:8080/mcp' })
    expect(transport).toBeDefined()
    expect(transport.connected).toBe(false)
  })

  it('应该接受自定义 headers', async () => {
    const { HTTPTransport } = await import('../mcp/transport.js')
    const transport = new HTTPTransport({
      url: 'http://localhost:8080/mcp',
      headers: { Authorization: 'Bearer test' },
    })
    expect(transport).toBeDefined()
  })
})
