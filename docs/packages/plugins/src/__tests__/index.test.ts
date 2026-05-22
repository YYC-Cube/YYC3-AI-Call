/**
 * file index.test.ts
 * description @yyc3/plugins index.ts 单元测试
 * module @yyc3/plugins
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/plugins index.ts 单元测试
 */
import { describe, it, expect } from 'vitest'

describe('Content 模块', () => {
  it('应该导出内容处理函数', async () => {
    const content = await import('../content/index')
    
    expect(content).toBeDefined()
    expect(typeof content).toBe('object')
  })

  it('内容模块应该包含必要的方法', async () => {
    const content = await import('../content/index')
    
    const methods = Object.keys(content)
    expect(methods.length).toBeGreaterThan(0)
  })
})

describe('LSP 模块', () => {
  it('应该导出 LSP 相关功能', async () => {
    const lsp = await import('../lsp/index')
    
    expect(lsp).toBeDefined()
    expect(typeof lsp).toBe('object')
  })

  it('LSP 模块应该包含插件定义', async () => {
    const lsp = await import('../lsp/index')
    
    expect(lsp.LSPPluginDefinitions).toBeDefined()
    expect(typeof lsp.getAllLSPPlugins).toBe('function')
    expect(typeof lsp.getLSPPluginByLanguage).toBe('function')
    expect(lsp.PythonLSPPlugin).toBeDefined()
    expect(lsp.PythonLSPPlugin.language).toBe('python')
  })
})

describe('Plugins 主入口', () => {
  it('应该正确导出所有子模块', async () => {
    const plugins = await import('../index')
    
    expect(plugins).toBeDefined()
    expect(Object.keys(plugins).length).toBeGreaterThan(0)
  })
})
