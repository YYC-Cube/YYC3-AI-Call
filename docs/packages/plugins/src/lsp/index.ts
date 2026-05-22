/**
 * file index.ts
 * description @yyc3/plugins 模块入口
 * module @yyc3/plugins
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[lsp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/plugins 模块入口
 */
export interface LSPPluginConfig {
  id: string
  name: string
  displayName: string
  language: string
  server: string
  package: string
  description: string
  capabilities: string[]
  installation: {
    command: string
    args?: string[]
  }
  configuration: Record<string, unknown>
}

export const PythonLSPPlugin: LSPPluginConfig = {
  id: 'lsp-python',
  name: 'PythonLSP',
  displayName: 'Python Language Server',
  language: 'python',
  server: 'pyright',
  package: '@yyc3/lsp-python',
  description: 'Python语言服务器，提供智能补全、类型检查、重构等功能',
  capabilities: [
    '智能代码补全',
    '类型检查和推断',
    '函数签名提示',
    '代码重构',
    '查找引用',
    '跳转定义',
    '错误诊断',
  ],
  installation: {
    command: 'npm',
    args: ['install', '@yyc3/lsp-python'],
  },
  configuration: {
    typeCheckingMode: 'basic',
    pythonPath: '/usr/bin/python3',
    venvPath: '${workspaceFolder}/.venv',
    analysis: {
      autoSearchPaths: true,
      diagnosticMode: 'workspace',
      useLibraryCodeForTypes: true,
    },
  },
}

export const RubyLSPPlugin: LSPPluginConfig = {
  id: 'lsp-ruby',
  name: 'RubyLSP',
  displayName: 'Ruby Language Server',
  language: 'ruby',
  server: 'ruby-lsp',
  package: '@yyc3/lsp-ruby',
  description: 'Ruby语言服务器，提供智能补全、代码导航、重构等功能',
  capabilities: [
    '智能代码补全',
    '代码导航',
    '重构支持',
    '文档高亮',
    '诊断信息',
    '格式化',
    '语义高亮',
  ],
  installation: {
    command: 'gem',
    args: ['install', 'ruby-lsp'],
  },
  configuration: {
    rubyVersionManager: 'rbenv',
    formatter: 'rubocop',
    linters: ['rubocop', 'standard'],
    solargraph: {
      diagnostics: true,
      formatting: true,
    },
  },
}

export const RustLSPPlugin: LSPPluginConfig = {
  id: 'lsp-rust',
  name: 'RustLSP',
  displayName: 'Rust Language Server',
  language: 'rust',
  server: 'rust-analyzer',
  package: '@yyc3/lsp-rust',
  description: 'Rust语言服务器，提供智能补全、类型推断、重构等功能',
  capabilities: [
    '智能代码补全',
    '类型推断',
    '代码重构',
    '内联提示',
    '宏展开',
    'Cargo集成',
    '测试运行器',
    '调试支持',
  ],
  installation: {
    command: 'rustup',
    args: ['component', 'add', 'rust-analyzer'],
  },
  configuration: {
    cargo: { autoreload: true, buildScripts: { enable: true } },
    procMacro: { enable: true },
    checkOnSave: { command: 'clippy' },
    inlayHints: {
      chainingHints: { enable: true },
      parameterHints: { enable: true },
    },
  },
}

export const SwiftLSPPlugin: LSPPluginConfig = {
  id: 'lsp-swift',
  name: 'SwiftLSP',
  displayName: 'Swift Language Server',
  language: 'swift',
  server: 'sourcekit-lsp',
  package: '@yyc3/lsp-swift',
  description: 'Swift语言服务器，提供智能补全、代码导航、重构等功能',
  capabilities: [
    '智能代码补全',
    '代码导航',
    '重构支持',
    'SwiftPM集成',
    '调试支持',
    '语义高亮',
    '文档生成',
  ],
  installation: {
    command: 'xcode-select',
    args: ['--install'],
  },
  configuration: {
    swiftPath: '/usr/bin/swift',
    sourcekitdPath: '/usr/lib/sourcekitd.framework/sourcekitd',
    buildSystem: 'swiftPM',
    diagnostics: { enable: true },
    indexing: { enable: true },
  },
}

export const LSPPluginDefinitions = {
  python: PythonLSPPlugin,
  ruby: RubyLSPPlugin,
  rust: RustLSPPlugin,
  swift: SwiftLSPPlugin,
}

export function getAllLSPPlugins(): LSPPluginConfig[] {
  return Object.values(LSPPluginDefinitions)
}

export function getLSPPluginByLanguage(language: string): LSPPluginConfig | undefined {
  const pluginMap: Record<string, LSPPluginConfig> = {
    python: PythonLSPPlugin,
    ruby: RubyLSPPlugin,
    rust: RustLSPPlugin,
    swift: SwiftLSPPlugin,
  }
  return pluginMap[language.toLowerCase()]
}
