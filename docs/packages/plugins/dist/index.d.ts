export { LSPPluginConfig, LSPPluginDefinitions, PythonLSPPlugin, RubyLSPPlugin, RustLSPPlugin, SwiftLSPPlugin, getAllLSPPlugins, getLSPPluginByLanguage } from './lsp.js';
export { ContentPluginConfig, ContentPluginDefinitions, EmmetPlugin, HandlebarsPlugin, IonicPlugin, MarkedPlugin, getAllContentPlugins, getContentPluginByName } from './content.js';
import EventEmitter from 'eventemitter3';

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

type PluginStatus = 'registered' | 'loaded' | 'active' | 'error' | 'unloaded';
interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    category: 'lsp' | 'content' | 'theme' | 'custom';
    entryPoint?: string;
    dependencies?: string[];
    config?: Record<string, unknown>;
}
interface PluginContext {
    pluginId: string;
    logger: PluginLogger;
    config: Record<string, unknown>;
    api: PluginAPI;
}
interface PluginLogger {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
interface PluginAPI {
    getPlugin(id: string): PluginInstance | undefined;
    getConfig(key: string): unknown;
    on(event: string, handler: (...args: unknown[]) => void): () => void;
    emit(event: string, ...args: unknown[]): void;
}
interface PluginInstance {
    manifest: PluginManifest;
    status: PluginStatus;
    context?: PluginContext;
    activate?(context: PluginContext): Promise<void>;
    deactivate?(): Promise<void>;
}
interface PluginEngineEvents {
    'plugin:registered': (id: string) => void;
    'plugin:loaded': (id: string) => void;
    'plugin:activated': (id: string) => void;
    'plugin:deactivated': (id: string) => void;
    'plugin:error': (id: string, error: Error) => void;
    'plugin:unloaded': (id: string) => void;
}
declare class PluginEngine extends EventEmitter<PluginEngineEvents> {
    private plugins;
    private globalConfig;
    register(manifest: PluginManifest): void;
    load(id: string): Promise<void>;
    activate(id: string): Promise<void>;
    deactivate(id: string): Promise<void>;
    unload(id: string): Promise<void>;
    deactivateAll(): Promise<void>;
    getPlugin(id: string): PluginInstance | undefined;
    getAllPlugins(): PluginInstance[];
    getPluginsByStatus(status: PluginStatus): PluginInstance[];
    getPluginsByCategory(category: PluginManifest['category']): PluginInstance[];
    setGlobalConfig(config: Record<string, unknown>): void;
    get size(): number;
    private createContext;
}

/**
 * file index.ts
 * description @yyc3/plugins 模块入口
 * module @yyc3/plugins
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/plugins 模块入口
 */

declare const PLUGIN_VERSION = "1.4.0";
declare const PLUGIN_NAME = "@yyc3/plugins";

export { PLUGIN_NAME, PLUGIN_VERSION, type PluginAPI, type PluginContext, PluginEngine, type PluginEngineEvents, type PluginInstance, type PluginLogger, type PluginManifest, type PluginStatus };
