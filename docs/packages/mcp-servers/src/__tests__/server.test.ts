import { describe, it, expect } from 'vitest'
import { MCPServerBase } from '../server/index.js'
import type { MCPTool, MCPToolResult } from '../types/index.js'

class TestMCPServer extends MCPServerBase {
  private tools: MCPTool[] = [
    {
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Test input' },
        },
        required: ['input'],
      },
    },
  ]

  getTools(): MCPTool[] {
    return this.tools
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    if (toolName === 'test_tool') {
      return this.success(`Processed: ${args.input}`)
    }
    return this.error(`Unknown tool: ${toolName}`)
  }
}

describe('MCPServerBase', () => {
  it('应该创建子类实例', () => {
    const server = new TestMCPServer({ name: 'test-server', version: '1.0.0' })
    expect(server).toBeDefined()
  })

  it('应该返回工具列表', () => {
    const server = new TestMCPServer({ name: 'test-server', version: '1.0.0' })
    const tools = server.getTools()
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('test_tool')
  })

  it('应该执行工具调用', async () => {
    const server = new TestMCPServer({ name: 'test-server', version: '1.0.0' })
    const result = await server.callTool('test_tool', { input: 'hello' })
    expect(result.isError).toBeFalsy()
    expect(result.content[0].text).toBe('Processed: hello')
  })

  it('应该处理未知工具', async () => {
    const server = new TestMCPServer({ name: 'test-server', version: '1.0.0' })
    const result = await server.callTool('unknown_tool', {})
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Unknown tool')
  })

  it('应该返回默认能力', () => {
    const server = new TestMCPServer({ name: 'test-server', version: '1.0.0' })
    const caps = server.getCapabilities()
    expect(caps.tools).toBeDefined()
    expect(caps.tools?.listChanged).toBe(false)
  })

  it('success helper 应返回正确结构', async () => {
    const server = new TestMCPServer({ name: 'test-server', version: '1.0.0' })
    const result = await server.callTool('test_tool', { input: 'test' })
    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('text')
  })

  it('应该正确处理 stop', () => {
    const server = new TestMCPServer({ name: 'test-server', version: '1.0.0' })
    server.stop()
    expect(server).toBeDefined()
  })
})
