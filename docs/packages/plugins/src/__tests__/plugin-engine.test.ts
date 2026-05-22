import { describe, expect, it } from 'vitest'
import type { PluginManifest } from '../plugin-engine.js'
import { PluginEngine } from '../plugin-engine.js'

const createManifest = (id: string, overrides?: Partial<PluginManifest>): PluginManifest => ({
  id,
  name: id,
  version: '1.0.0',
  description: `Test plugin ${id}`,
  category: 'custom',
  ...overrides,
})

describe('PluginEngine', () => {
  it('应该创建引擎实例', () => {
    const engine = new PluginEngine()
    expect(engine).toBeDefined()
    expect(engine.size).toBe(0)
  })

  it('应该注册插件', () => {
    const engine = new PluginEngine()
    engine.register(createManifest('test-plugin'))
    expect(engine.size).toBe(1)
  })

  it('应该防止重复注册', () => {
    const engine = new PluginEngine()
    engine.register(createManifest('test-plugin'))
    expect(() => engine.register(createManifest('test-plugin'))).toThrow('already registered')
  })

  it('应该加载插件', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('test-plugin'))
    await engine.load('test-plugin')
    const plugin = engine.getPlugin('test-plugin')
    expect(plugin?.status).toBe('loaded')
  })

  it('应该激活插件', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('test-plugin'))
    await engine.activate('test-plugin')
    const plugin = engine.getPlugin('test-plugin')
    expect(plugin?.status).toBe('active')
  })

  it('应该停用插件', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('test-plugin'))
    await engine.activate('test-plugin')
    await engine.deactivate('test-plugin')
    const plugin = engine.getPlugin('test-plugin')
    expect(plugin?.status).toBe('loaded')
  })

  it('应该卸载插件', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('test-plugin'))
    await engine.activate('test-plugin')
    await engine.unload('test-plugin')
    const plugin = engine.getPlugin('test-plugin')
    expect(plugin?.status).toBe('unloaded')
  })

  it('应该按状态筛选插件', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('plugin-a'))
    engine.register(createManifest('plugin-b'))
    await engine.activate('plugin-a')
    const active = engine.getPluginsByStatus('active')
    const registered = engine.getPluginsByStatus('registered')
    expect(active).toHaveLength(1)
    expect(registered).toHaveLength(1)
  })

  it('应该按类别筛选插件', () => {
    const engine = new PluginEngine()
    engine.register(createManifest('lsp-1', { category: 'lsp' }))
    engine.register(createManifest('content-1', { category: 'content' }))
    const lspPlugins = engine.getPluginsByCategory('lsp')
    expect(lspPlugins).toHaveLength(1)
    expect(lspPlugins[0].manifest.category).toBe('lsp')
  })

  it('应该获取所有插件', () => {
    const engine = new PluginEngine()
    engine.register(createManifest('a'))
    engine.register(createManifest('b'))
    engine.register(createManifest('c'))
    expect(engine.getAllPlugins()).toHaveLength(3)
  })

  it('加载不存在的插件应该抛出错误', async () => {
    const engine = new PluginEngine()
    await expect(engine.load('nonexistent')).rejects.toThrow('not found')
  })

  it('应该支持全局配置', () => {
    const engine = new PluginEngine()
    engine.setGlobalConfig({ theme: 'dark' })
    expect(engine).toBeDefined()
  })

  it('应该停用所有插件', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('a'))
    engine.register(createManifest('b'))
    await engine.activate('a')
    await engine.activate('b')
    await engine.deactivateAll()
    const active = engine.getPluginsByStatus('active')
    expect(active).toHaveLength(0)
  })

  it('应该支持自定义 activate 钩子', async () => {
    const engine = new PluginEngine()
    let activated = false
    engine.register({
      ...createManifest('hook-plugin'),
    })
    const plugin = engine.getPlugin('hook-plugin')!
    plugin.activate = async () => { activated = true }
    await engine.activate('hook-plugin')
    expect(activated).toBe(true)
  })

  it('应该支持依赖检查', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('dep-plugin'))
    engine.register(createManifest('main-plugin', { dependencies: ['dep-plugin'] }))
    await engine.load('dep-plugin')
    await engine.load('main-plugin')
    const plugin = engine.getPlugin('main-plugin')
    expect(plugin?.status).toBe('loaded')
  })

  it('未加载依赖时应该报错', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('main-plugin', { dependencies: ['missing-dep'] }))
    await expect(engine.load('main-plugin')).rejects.toThrow('Dependency')
  })

  it('activate 失败应该设置 error 状态', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('error-plugin'))
    await engine.load('error-plugin')
    const plugin = engine.getPlugin('error-plugin')!
    plugin.activate = async () => { throw new Error('activate failed') }
    await expect(engine.activate('error-plugin')).rejects.toThrow('activate failed')
    expect(plugin.status).toBe('error')
  })

  it('deactivate 失败应该设置 error 状态', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('deact-error'))
    await engine.load('deact-error')
    const plugin = engine.getPlugin('deact-error')!
    plugin.activate = async () => { }
    await engine.activate('deact-error')
    plugin.deactivate = async () => { throw new Error('deactivate failed') }
    await engine.deactivate('deact-error')
    expect(plugin.status).toBe('error')
  })

  it('load 已 loaded 的插件应该是幂等的', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('idempotent'))
    await engine.load('idempotent')
    await engine.load('idempotent')
    const plugin = engine.getPlugin('idempotent')
    expect(plugin?.status).toBe('loaded')
  })

  it('activate 已 active 的插件应该是幂等的', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('idempotent-act'))
    await engine.activate('idempotent-act')
    await engine.activate('idempotent-act')
    const plugin = engine.getPlugin('idempotent-act')
    expect(plugin?.status).toBe('active')
  })

  it('getPluginsByStatus 应该返回空数组如果无匹配', () => {
    const engine = new PluginEngine()
    expect(engine.getPluginsByStatus('active')).toEqual([])
  })

  it('getPluginsByCategory 应该返回空数组如果无匹配', () => {
    const engine = new PluginEngine()
    expect(engine.getPluginsByCategory('lsp' as any)).toEqual([])
  })

  it('unload 应该跳过不存在的插件', async () => {
    const engine = new PluginEngine()
    await engine.unload('nonexistent')
    expect(engine.size).toBe(0)
  })

  it('deactivate 应该跳过未激活的插件', async () => {
    const engine = new PluginEngine()
    engine.register(createManifest('skip-deact'))
    await engine.deactivate('skip-deact')
    const plugin = engine.getPlugin('skip-deact')
    expect(plugin?.status).toBe('registered')
  })
})
