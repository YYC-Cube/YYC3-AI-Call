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
import EventEmitter from 'eventemitter3'
import type { 
  MCPClientConfig, 
  MCPMessage, 
  MCPTool, 
  MCPResource,
  MCPToolResult,
  MCPServerCapabilities 
} from './types.js'
import type { MCPTransport } from './types.js'

/**
 * MCP 客户端事件
 */
interface MCPClientEvents {
  connected: () => void
  disconnected: () => void
  error: (error: Error) => void
  toolListChanged: (tools: MCPTool[]) => void
  resourceListChanged: (resources: MCPResource[]) => void
}

/**
 * MCP 客户端
 * 实现 Model Context Protocol 客户端
 */
export class MCPClient extends EventEmitter<MCPClientEvents> {
  private config: MCPClientConfig
  private transport: MCPTransport
  private messageId = 0
  private pendingRequests = new Map<string | number, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()
  
  private _tools: MCPTool[] = []
  private _resources: MCPResource[] = []
  private _capabilities?: MCPServerCapabilities

  constructor(config: MCPClientConfig) {
    super()
    this.config = config
    this.transport = config.transport
    this.setupTransport()
  }

  get connected(): boolean {
    return this.transport.connected
  }

  get tools(): MCPTool[] {
    return this._tools
  }

  get resources(): MCPResource[] {
    return this._resources
  }

  get capabilities(): MCPServerCapabilities | undefined {
    return this._capabilities
  }

  /**
   * 连接到 MCP 服务器
   */
  async connect(): Promise<void> {
    await this.transport.connect()
    
    // 发送初始化请求
    const result = await this.request('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: this.config.capabilities || {
        tools: true,
        resources: true,
        prompts: false,
      },
      clientInfo: {
        name: this.config.name,
        version: this.config.version,
      },
    })

    this._capabilities = result.capabilities as MCPServerCapabilities
    
    // 发送 initialized 通知
    this.notify('notifications/initialized', {})
    
    // 获取工具列表
    if (this._capabilities?.tools) {
      await this.refreshTools()
    }

    // 获取资源列表
    if (this._capabilities?.resources) {
      await this.refreshResources()
    }

    this.emit('connected')
  }

  /**
   * 刷新工具列表
   */
  async refreshTools(): Promise<MCPTool[]> {
    const result = await this.request('tools/list', {})
    this._tools = result.tools as MCPTool[]
    this.emit('toolListChanged', this._tools)
    return this._tools
  }

  /**
   * 刷新资源列表
   */
  async refreshResources(): Promise<MCPResource[]> {
    const result = await this.request('resources/list', {})
    this._resources = result.resources as MCPResource[]
    this.emit('resourceListChanged', this._resources)
    return this._resources
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const result = await this.request('tools/call', {
      name,
      arguments: args,
    })
    return result as MCPToolResult
  }

  /**
   * 读取资源
   */
  async readResource(uri: string): Promise<unknown> {
    const result = await this.request('resources/read', { uri })
    return result
  }

  /**
   * 发送请求
   */
  private async request(method: string, params: Record<string, unknown>): Promise<any> {
    const id = ++this.messageId
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })
      this.transport.send(message).catch(reject)
      
      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`请求超时: ${method}`))
        }
      }, 30000)
    })
  }

  /**
   * 发送通知
   */
  private notify(method: string, params: Record<string, unknown>): void {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params,
    }
    this.transport.send(message).catch(error => {
      this.emit('error', error)
    })
  }

  /**
   * 设置传输层消息处理
   */
  private setupTransport(): void {
    this.transport.onMessage((message: MCPMessage) => {
      // 处理响应
      if (message.id !== undefined) {
        const pending = this.pendingRequests.get(message.id)
        if (pending) {
          this.pendingRequests.delete(message.id)
          
          if (message.error) {
            pending.reject(new Error(message.error.message))
          } else {
            pending.resolve(message.result)
          }
        }
      }
      
      // 处理通知
      if (message.method) {
        this.handleNotification(message.method, message.params)
      }
    })
  }

  /**
   * 处理通知
   */
  private handleNotification(method: string, _params?: Record<string, unknown>): void {
    switch (method) {
      case 'notifications/tools/list_changed':
        this.refreshTools().catch(console.error)
        break
      case 'notifications/resources/list_changed':
        this.refreshResources().catch(console.error)
        break
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    await this.transport.close()
    this.pendingRequests.clear()
    this.emit('disconnected')
  }
}
