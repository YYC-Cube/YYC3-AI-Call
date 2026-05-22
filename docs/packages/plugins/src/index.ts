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
export {
  LSPPluginDefinitions,
  getAllLSPPlugins,
  getLSPPluginByLanguage,
  PythonLSPPlugin,
  RubyLSPPlugin,
  RustLSPPlugin,
  SwiftLSPPlugin,
} from './lsp/index.js'

export type { LSPPluginConfig } from './lsp/index.js'

export {
  ContentPluginDefinitions,
  getAllContentPlugins,
  getContentPluginByName,
  EmmetPlugin,
  MarkedPlugin,
  HandlebarsPlugin,
  IonicPlugin,
} from './content/index.js'

export type { ContentPluginConfig } from './content/index.js'

export {
  PluginEngine,
} from './plugin-engine.js'

export type {
  PluginManifest,
  PluginContext,
  PluginLogger,
  PluginAPI,
  PluginInstance,
  PluginStatus,
  PluginEngineEvents,
} from './plugin-engine.js'

export const PLUGIN_VERSION = '1.4.0'
export const PLUGIN_NAME = '@yyc3/plugins'
