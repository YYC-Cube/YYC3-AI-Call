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
import type { MCPMessage, MCPTransport } from './types.js'

/**
 * Stdio 传输配置
 */
export interface StdioTransportConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

/**
 * HTTP 传输配置
 */
export interface HTTPTransportConfig {
  url: string
  headers?: Record<string, string>
}

/**
 * Stdio 传输实现
 * 通过标准输入输出与 MCP 服务器通信
 */
export class StdioTransport implements MCPTransport {
  private config: StdioTransportConfig
  private _connected = false
  private messageHandler?: (message: MCPMessage) => void
  private process?: any

  constructor(config: StdioTransportConfig) {
    this.config = config
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    // 在浏览器环境中不可用
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      throw new Error('Stdio 传输仅在 Node.js 环境中可用')
    }

    // 动态导入 child_process
    const { spawn } = await import('child_process')

    this.process = spawn(this.config.command, this.config.args || [], {
      env: { ...process.env, ...this.config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.process.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const message = JSON.parse(line) as MCPMessage
          this.messageHandler?.(message)
        } catch {
          // 忽略解析错误
        }
      }
    })

    this._connected = true
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this._connected || !this.process) {
      throw new Error('传输未连接')
    }

    const data = JSON.stringify(message) + '\n'
    this.process.stdin?.write(data)
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandler = handler
  }

  async close(): Promise<void> {
    if (this.process) {
      this.process.kill()
      this.process = undefined
    }
    this._connected = false
  }
}

/**
 * WebSocket 传输配置
 */
export interface WebSocketTransportConfig {
  url: string
  headers?: Record<string, string>
  reconnect?: boolean
  maxReconnectAttempts?: number
}

/**
 * WebSocket 传输实现
 * 纯 WebSocket 连接，支持自动重连
 */
export class WebSocketTransport implements MCPTransport {
  private config: WebSocketTransportConfig
  private _connected = false
  private messageHandler?: (message: MCPMessage) => void
  private ws?: WebSocket
  private reconnectAttempts = 0

  constructor(config: WebSocketTransportConfig) {
    this.config = {
      reconnect: true,
      maxReconnectAttempts: 5,
      ...config,
    }
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    const wsUrl = this.config.url.replace(/^http/, 'ws')

    await new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          this._connected = true
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string) as MCPMessage
            this.messageHandler?.(message)
          } catch {
            // ignore parse errors
          }
        }

        this.ws.onclose = () => {
          this._connected = false
          if (this.config.reconnect && this.reconnectAttempts < (this.config.maxReconnectAttempts ?? 5)) {
            this.reconnectAttempts++
            setTimeout(() => this.connect(), Math.min(1000 * this.reconnectAttempts, 10000))
          }
        }

        this.ws.onerror = () => {
          if (!this._connected) {
            reject(new Error(`WebSocket 连接失败: ${wsUrl}`))
          }
        }
      } catch (error) {
        reject(new Error(`WebSocket 初始化失败: ${error}`))
      }
    })
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this._connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 传输未连接')
    }
    this.ws.send(JSON.stringify(message))
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandler = handler
  }

  async close(): Promise<void> {
    this.config.reconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = undefined
    }
    this._connected = false
  }
}

/**
 * SSE 传输配置
 */
export interface SSETransportConfig {
  url: string
  headers?: Record<string, string>
}

/**
 * SSE (Server-Sent Events) 传输实现
 * MCP 2025 规范推荐的 HTTP 传输方式
 */
export class SSETransport implements MCPTransport {
  private config: SSETransportConfig
  private _connected = false
  private messageHandler?: (message: MCPMessage) => void
  private eventSource?: EventSource
  private messageEndpoint?: string

  constructor(config: SSETransportConfig) {
    this.config = config
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    this.eventSource = new EventSource(this.config.url, {
      withCredentials: false,
    })

    this.eventSource.onopen = () => {
      this._connected = true
    }

    this.eventSource.addEventListener('endpoint', ((event: Event) => {
      this.messageEndpoint = (event as MessageEvent).data
    }) as EventListener)

    this.eventSource.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as MCPMessage
        this.messageHandler?.(message)
      } catch {
        // ignore parse errors
      }
    }

    this.eventSource.onerror = () => {
      this._connected = false
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SSE 连接超时'))
      }, 10000)

      this.eventSource!.onopen = () => {
        clearTimeout(timeout)
        this._connected = true
        resolve()
      }

      this.eventSource!.onerror = () => {
        if (!this._connected) {
          clearTimeout(timeout)
          reject(new Error('SSE 连接失败'))
        }
      }
    })
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this._connected) {
      throw new Error('SSE 传输未连接')
    }

    const endpoint = this.messageEndpoint || this.config.url

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`SSE POST 请求失败: ${response.status}`)
    }
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandler = handler
  }

  async close(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }
    this._connected = false
  }
}

/**
 * HTTP 传输实现
 * 通过 HTTP/WebSocket 与 MCP 服务器通信
 */
export class HTTPTransport implements MCPTransport {
  private config: HTTPTransportConfig
  private _connected = false
  private messageHandler?: (message: MCPMessage) => void
  private ws?: WebSocket

  constructor(config: HTTPTransportConfig) {
    this.config = config
  }

  get connected(): boolean {
    return this._connected
  }

  async connect(): Promise<void> {
    // 尝试 WebSocket 连接
    const wsUrl = this.config.url.replace(/^http/, 'ws')

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this._connected = true
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as MCPMessage
          this.messageHandler?.(message)
        } catch {
          // 忽略解析错误
        }
      }

      this.ws.onclose = () => {
        this._connected = false
      }

      // 等待连接
      await new Promise<void>((resolve, reject) => {
        if (!this.ws) return reject(new Error('WebSocket 未初始化'))

        this.ws.onopen = () => {
          this._connected = true
          resolve()
        }
        this.ws.onerror = (error) => {
          reject(new Error(`WebSocket 连接失败: ${error}`))
        }
      })
    } catch {
      // WebSocket 失败，使用 HTTP 轮询
      this._connected = true
    }
  }

  async send(message: MCPMessage): Promise<void> {
    if (!this._connected) {
      throw new Error('传输未连接')
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // HTTP 回退
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(`HTTP 请求失败: ${response.status}`)
      }

      const result = await response.json() as MCPMessage
      this.messageHandler?.(result)
    }
  }

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandler = handler
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = undefined
    }
    this._connected = false
  }
}
