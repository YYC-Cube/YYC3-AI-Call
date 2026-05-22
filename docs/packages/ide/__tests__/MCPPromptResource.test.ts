import { describe, expect, it } from 'vitest'
import { MCPResourceManager } from '../services/MCPResources'

const mockClient: any = {
  callTool: async () => ({ success: false, error: 'not connected' }),
  readResource: async (uri: string) => ({ uri, text: 'cached content', mimeType: 'text/plain' }),
  listResources: () => [],
  getResource: () => undefined,
  isConnected: () => false,
  connect: async () => false,
  disconnect: async () => { },
}

describe('MCPResourceManager', () => {
  it('listResources 应该返回数组', () => {
    const mgr = new MCPResourceManager(mockClient)
    expect(mgr.listResources()).toEqual([])
  })

  it('getResource 不存在的资源应该返回 undefined', () => {
    const mgr = new MCPResourceManager(mockClient)
    expect(mgr.getResource('nonexistent://x')).toBeUndefined()
  })

  it('readResource 应该调用客户端并缓存', async () => {
    const mgr = new MCPResourceManager(mockClient)
    const content = await mgr.readResource('file:///test.ts')
    expect(content).toBeDefined()
    expect(content.uri).toBe('file:///test.ts')
  })

  it('readResource 第二次应该使用缓存', async () => {
    const mgr = new MCPResourceManager(mockClient)
    await mgr.readResource('file:///test.ts')
    const content2 = await mgr.readResource('file:///test.ts')
    expect(content2).toBeDefined()
  })

  it('subscribe 应该返回取消函数', () => {
    const mgr = new MCPResourceManager(mockClient)
    const unsub = mgr.subscribe('file:///test.ts', () => { })
    expect(typeof unsub).toBe('function')
    unsub()
  })

  it('clearCache 应该清除缓存', async () => {
    const mgr = new MCPResourceManager(mockClient)
    await mgr.readResource('file:///test.ts')
    mgr.clearCache()
    mgr.clearCache('file:///test.ts')
  })
})
