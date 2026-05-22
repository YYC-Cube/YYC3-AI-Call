/**
 * file plugin-engine.ts
 * description 插件运行时引擎 — 生命周期管理、注册表、事件钩子
 * module @yyc3/plugins
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.4.0
 * created 2026-04-27
 * updated 2026-04-27
 * status active
 * tags [module],[plugin]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 插件运行时引擎
 */
import EventEmitter from 'eventemitter3'

export type PluginStatus = 'registered' | 'loaded' | 'active' | 'error' | 'unloaded'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  category: 'lsp' | 'content' | 'theme' | 'custom'
  entryPoint?: string
  dependencies?: string[]
  config?: Record<string, unknown>
}

export interface PluginContext {
  pluginId: string
  logger: PluginLogger
  config: Record<string, unknown>
  api: PluginAPI
}

export interface PluginLogger {
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

export interface PluginAPI {
  getPlugin(id: string): PluginInstance | undefined
  getConfig(key: string): unknown
  on(event: string, handler: (...args: unknown[]) => void): () => void
  emit(event: string, ...args: unknown[]): void
}

export interface PluginInstance {
  manifest: PluginManifest
  status: PluginStatus
  context?: PluginContext
  activate?(context: PluginContext): Promise<void>
  deactivate?(): Promise<void>
}

export interface PluginEngineEvents {
  'plugin:registered': (id: string) => void
  'plugin:loaded': (id: string) => void
  'plugin:activated': (id: string) => void
  'plugin:deactivated': (id: string) => void
  'plugin:error': (id: string, error: Error) => void
  'plugin:unloaded': (id: string) => void
}

export class PluginEngine extends EventEmitter<PluginEngineEvents> {
  private plugins: Map<string, PluginInstance> = new Map()
  private globalConfig: Record<string, unknown> = {}

  register(manifest: PluginManifest): void {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} already registered`)
    }

    this.plugins.set(manifest.id, {
      manifest,
      status: 'registered',
    })

    this.emit('plugin:registered', manifest.id)
  }

  async load(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    if (!plugin) throw new Error(`Plugin ${id} not found`)
    if (plugin.status === 'active' || plugin.status === 'loaded') return

    try {
      if (plugin.manifest.dependencies) {
        for (const dep of plugin.manifest.dependencies) {
          const depPlugin = this.plugins.get(dep)
          if (!depPlugin || (depPlugin.status !== 'active' && depPlugin.status !== 'loaded')) {
            throw new Error(`Dependency ${dep} not loaded`)
          }
        }
      }

      plugin.context = this.createContext(plugin)
      plugin.status = 'loaded'
      this.emit('plugin:loaded', id)
    } catch (error) {
      plugin.status = 'error'
      this.emit('plugin:error', id, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async activate(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    if (!plugin) throw new Error(`Plugin ${id} not found`)
    if (plugin.status === 'active') return
    if (plugin.status === 'registered') {
      await this.load(id)
    }

    try {
      if (plugin.activate) {
        await plugin.activate(plugin.context!)
      }
      plugin.status = 'active'
      this.emit('plugin:activated', id)
    } catch (error) {
      plugin.status = 'error'
      this.emit('plugin:error', id, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async deactivate(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    if (!plugin || plugin.status !== 'active') return

    try {
      if (plugin.deactivate) {
        await plugin.deactivate()
      }
      plugin.status = 'loaded'
      this.emit('plugin:deactivated', id)
    } catch (error) {
      plugin.status = 'error'
      this.emit('plugin:error', id, error instanceof Error ? error : new Error(String(error)))
    }
  }

  async unload(id: string): Promise<void> {
    const plugin = this.plugins.get(id)
    if (!plugin) return

    if (plugin.status === 'active') {
      await this.deactivate(id)
    }

    plugin.status = 'unloaded'
    plugin.context = undefined
    this.emit('plugin:unloaded', id)
  }

  async deactivateAll(): Promise<void> {
    const activePlugins = Array.from(this.plugins.values())
      .filter(p => p.status === 'active')

    await Promise.allSettled(
      activePlugins.map(p => this.deactivate(p.manifest.id))
    )
  }

  getPlugin(id: string): PluginInstance | undefined {
    return this.plugins.get(id)
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  getPluginsByStatus(status: PluginStatus): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(p => p.status === status)
  }

  getPluginsByCategory(category: PluginManifest['category']): PluginInstance[] {
    return Array.from(this.plugins.values())
      .filter(p => p.manifest.category === category)
  }

  setGlobalConfig(config: Record<string, unknown>): void {
    this.globalConfig = { ...this.globalConfig, ...config }
  }

  get size(): number {
    return this.plugins.size
  }

  private createContext(plugin: PluginInstance): PluginContext {
    const engine = this
    const pluginId = plugin.manifest.id

    const logger: PluginLogger = {
      info: (message, ...args) => console.log(`[${plugin.manifest.name}] ${message}`, ...args),
      warn: (message, ...args) => console.warn(`[${plugin.manifest.name}] ${message}`, ...args),
      error: (message, ...args) => console.error(`[${plugin.manifest.name}] ${message}`, ...args),
    }

    const api: PluginAPI = {
      getPlugin: (id) => engine.getPlugin(id),
      getConfig: (key) => engine.globalConfig[key],
      on: (event, handler) => {
        engine.on(event as any, handler as any)
        return () => engine.off(event as any, handler as any)
      },
      emit: (event, ...args) => engine.emit(event as any, ...(args as [any])),
    }

    return {
      pluginId,
      logger,
      config: plugin.manifest.config || {},
      api,
    }
  }
}
