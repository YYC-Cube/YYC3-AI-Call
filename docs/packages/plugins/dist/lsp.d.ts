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
interface LSPPluginConfig {
    id: string;
    name: string;
    displayName: string;
    language: string;
    server: string;
    package: string;
    description: string;
    capabilities: string[];
    installation: {
        command: string;
        args?: string[];
    };
    configuration: Record<string, unknown>;
}
declare const PythonLSPPlugin: LSPPluginConfig;
declare const RubyLSPPlugin: LSPPluginConfig;
declare const RustLSPPlugin: LSPPluginConfig;
declare const SwiftLSPPlugin: LSPPluginConfig;
declare const LSPPluginDefinitions: {
    python: LSPPluginConfig;
    ruby: LSPPluginConfig;
    rust: LSPPluginConfig;
    swift: LSPPluginConfig;
};
declare function getAllLSPPlugins(): LSPPluginConfig[];
declare function getLSPPluginByLanguage(language: string): LSPPluginConfig | undefined;

export { type LSPPluginConfig, LSPPluginDefinitions, PythonLSPPlugin, RubyLSPPlugin, RustLSPPlugin, SwiftLSPPlugin, getAllLSPPlugins, getLSPPluginByLanguage };
