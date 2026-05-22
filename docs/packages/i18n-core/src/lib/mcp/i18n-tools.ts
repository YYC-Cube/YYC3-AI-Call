/**
 * file i18n-tools.ts
 * description MCP i18n 工具集
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP i18n 工具集
 */
import type { I18nEngine } from "../engine.js";
import type { MCPServer } from "./server.js";
import type { MCPTool, MCPToolResult } from "./types.js";

function flattenTranslations(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

export function registerI18nTools(server: MCPServer, engine: I18nEngine): void {
  const tools: Array<{ tool: MCPTool; handler: (args: Record<string, unknown>) => Promise<MCPToolResult> }> = [
    {
      tool: {
        name: "search_translations",
        description: "Fuzzy search translation keys across all locales",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query (key or value)" },
            locale: { type: "string", description: "Optional locale filter" },
          },
          required: ["query"],
        },
      },
      handler: async (args) => {
        const query = String(args.query).toLowerCase();
        const stats = engine.getStats();
        const matches: Array<{ key: string; value: string; locale: string }> = [];

        for (const loadedLocale of stats.loadedLocales) {
          if (args.locale && loadedLocale !== String(args.locale)) continue;
          const translations = engine.getTranslations(loadedLocale as never);
          if (!translations) continue;
          const flat = flattenTranslations(translations as Record<string, unknown>);
          for (const [key, value] of Object.entries(flat)) {
            if (key.toLowerCase().includes(query) || value.toLowerCase().includes(query)) {
              matches.push({ key, value, locale: loadedLocale });
            }
          }
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ query, matches, count: matches.length }, null, 2),
          }],
        };
      },
    },
    {
      tool: {
        name: "add_translation_key",
        description: "Add a new translation key with value",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string", description: "Translation key" },
            value: { type: "string", description: "Translation value" },
            locale: { type: "string", description: "Target locale" },
          },
          required: ["key", "value", "locale"],
        },
      },
      handler: async (args) => {
        const key = String(args.key);
        const value = String(args.value);
        const locale = String(args.locale);

        engine.registerTranslation(locale as never, { [key]: value });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, key, value, locale }),
          }],
        };
      },
    },
    {
      tool: {
        name: "translate_key",
        description: "Get translation for a specific key",
        inputSchema: {
          type: "object",
          properties: {
            key: { type: "string", description: "Translation key" },
            locale: { type: "string", description: "Target locale" },
            params: { type: "object", description: "Interpolation parameters" },
          },
          required: ["key"],
        },
      },
      handler: async (args) => {
        const key = String(args.key);
        const params = args.params as Record<string, string> | undefined;
        const result = engine.t(key, params);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ key, value: result, locale: engine.getLocale() }),
          }],
        };
      },
    },
    {
      tool: {
        name: "check_missing_keys",
        description: "Check for missing translation keys across locales",
        inputSchema: {
          type: "object",
          properties: {
            locale: { type: "string", description: "Locale to check" },
          },
          required: ["locale"],
        },
      },
      handler: async (args) => {
        const targetLocale = String(args.locale);
        const stats = engine.getStats();
        const missingKeys: Array<{ key: string; inLocale: string; missingIn: string }> = [];

        const sourceTranslations = engine.getTranslations(stats.locale as never);
        const targetTranslations = engine.getTranslations(targetLocale as never);

        if (sourceTranslations && targetTranslations) {
          const flatSource = flattenTranslations(sourceTranslations);
          const flatTarget = flattenTranslations(targetTranslations);
          for (const key of Object.keys(flatSource)) {
            if (!(key in flatTarget)) {
              missingKeys.push({ key, inLocale: stats.locale, missingIn: targetLocale });
            }
          }
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              sourceLocale: stats.locale,
              targetLocale,
              loadedLocales: stats.loadedLocales,
              missingKeys,
              missingCount: missingKeys.length,
            }),
          }],
        };
      },
    },
    {
      tool: {
        name: "get_locale_stats",
        description: "Get translation statistics for all locales",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      handler: async () => {
        const stats = engine.getStats();

        return {
          content: [{
            type: "text",
            text: JSON.stringify(stats, null, 2),
          }],
        };
      },
    },
    {
      tool: {
        name: "set_locale",
        description: "Change the active locale",
        inputSchema: {
          type: "object",
          properties: {
            locale: { type: "string", description: "New locale to set" },
          },
          required: ["locale"],
        },
      },
      handler: async (args) => {
        const locale = String(args.locale);
        const oldLocale = engine.getLocale();
        await engine.setLocale(locale as never);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ previousLocale: oldLocale, currentLocale: engine.getLocale() }),
          }],
        };
      },
    },
    {
      tool: {
        name: "quality_report",
        description: "Generate translation quality report",
        inputSchema: {
          type: "object",
          properties: {
            keys: {
              type: "string",
              description: "JSON array of keys to check",
            },
          },
        },
      },
      handler: async (args) => {
        const keys = (args.keys as string[]) ?? [];
        const results = keys.map((key) => ({
          key,
          value: engine.t(key),
          locale: engine.getLocale(),
          hasFallback: engine.t(key) === key,
        }));

        const missingCount = results.filter((r) => r.hasFallback).length;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              total: results.length,
              missing: missingCount,
              coverage: results.length > 0 ? ((1 - missingCount / results.length) * 100).toFixed(1) + "%" : "N/A",
              results,
            }, null, 2),
          }],
        };
      },
    },
  ];

  for (const { tool, handler } of tools) {
    server.registerTool(tool, handler);
  }
}
