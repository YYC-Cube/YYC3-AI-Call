/**
 * file index.ts
 * description @yyc3/plugins 模块入口
 * module @yyc3/plugins
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.1.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[content]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/plugins 模块入口
 */
interface ContentPluginConfig {
    id: string;
    name: string;
    displayName: string;
    package: string;
    description: string;
    capabilities: string[];
    version: string;
    installation: {
        command: string;
        args?: string[];
    };
    configuration: Record<string, unknown>;
}
declare const EmmetPlugin: ContentPluginConfig;
declare const MarkedPlugin: ContentPluginConfig;
declare const HandlebarsPlugin: ContentPluginConfig;
declare const IonicPlugin: ContentPluginConfig;
declare const ContentPluginDefinitions: {
    emmet: ContentPluginConfig;
    marked: ContentPluginConfig;
    handlebars: ContentPluginConfig;
    ionic: ContentPluginConfig;
};
declare function getAllContentPlugins(): ContentPluginConfig[];
declare function getContentPluginByName(name: string): ContentPluginConfig | undefined;

export { type ContentPluginConfig, ContentPluginDefinitions, EmmetPlugin, HandlebarsPlugin, IonicPlugin, MarkedPlugin, getAllContentPlugins, getContentPluginByName };
