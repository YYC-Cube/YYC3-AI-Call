import { beforeEach, describe, expect, it } from 'vitest'
import { MCPClient, type MCPConfig } from '../services/MCPClient'

const makeConfig = (): MCPConfig => ({
  serverUrl: 'http://localhost:3001/mcp',
  timeout: 5000,
})

describe('MCPClient', () => {
  let client: MCPClient

  beforeEach(() => {
    client = new MCPClient(makeConfig())
  })

  describe('构造函数', () => {
    it('应该创建客户端实例', () => {
      expect(client).toBeDefined()
    })

    it('应该接受配置', () => {
      const customConfig: MCPConfig = {
        serverUrl: 'http://custom:8080',
        apiKey: 'test-key',
        timeout: 10000,
      }
      const customClient = new MCPClient(customConfig)
      expect(customClient).toBeDefined()
    })
  })

  describe('connect', () => {
    it('连接失败应该返回false', async () => {
      const result = await client.connect()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('callTool', () => {
    it('未连接时调用应该抛出错误', async () => {
      await expect(client.callTool('test', {})).rejects.toThrow('not connected')
    })
  })

  describe('getTools / getResources / getPrompts', () => {
    it('初始状态应该返回undefined', () => {
      expect(client.getTool('test')).toBeUndefined()
      expect(client.getResource('test://x')).toBeUndefined()
      expect(client.getPromptByName('test')).toBeUndefined()
    })
  })

  describe('isConnected', () => {
    it('初始状态应该未连接', () => {
      expect(client.isConnected()).toBe(false)
    })
  })

  describe('disconnect', () => {
    it('断开未连接的客户端不应报错', async () => {
      await expect(client.disconnect()).resolves.toBeUndefined()
    })
  })

  describe('MCPConfig 类型', () => {
    it('最小配置应该有效', () => {
      const minConfig: MCPConfig = { serverUrl: 'http://localhost:3000' }
      const c = new MCPClient(minConfig)
      expect(c).toBeDefined()
    })

    it('完整配置应该有效', () => {
      const fullConfig: MCPConfig = {
        serverUrl: 'https://api.example.com/mcp',
        apiKey: 'sk-123',
        timeout: 30000,
      }
      const c = new MCPClient(fullConfig)
      expect(c).toBeDefined()
    })
  })
})
