/**
 * file plugins.test.ts
 * description @yyc3/i18n-core plugins.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[plugin],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core plugins.ts 单元测试
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createConsoleLogger, type ConsoleLoggerConfig } from "../lib/plugins/console-logger.js";
import { MissingKeyReporter } from "../lib/plugins/missing-key-reporter.js";
import type { Locale } from "../lib/types.js";

describe("Console Logger Plugin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should create plugin with default config", () => {
    const plugin = createConsoleLogger();
    expect(plugin.name).toBe("console-logger");
    expect(plugin.version).toBe("1.0.0");
  });

  it("should create plugin with custom config", () => {
    const config: ConsoleLoggerConfig = {
      logTranslations: true,
      logMissingKeys: false,
      logLocaleChanges: false,
      logPerformance: false,
    };
    const plugin = createConsoleLogger(config);
    expect(plugin.name).toBe("console-logger");
  });

  it("should have beforeTranslate method", () => {
    const plugin = createConsoleLogger();
    expect(typeof plugin.beforeTranslate).toBe("function");
  });

  it("should have afterTranslate method", () => {
    const plugin = createConsoleLogger();
    expect(typeof plugin.afterTranslate).toBe("function");
  });

  it("should have onLocaleChange method", () => {
    const plugin = createConsoleLogger();
    expect(typeof plugin.onLocaleChange).toBe("function");
  });

  it("should have onMissingKey method", () => {
    const plugin = createConsoleLogger();
    expect(typeof plugin.onMissingKey).toBe("function");
  });

  it("should have onError method", () => {
    const plugin = createConsoleLogger();
    expect(typeof plugin.onError).toBe("function");
  });

  describe("beforeTranslate", () => {
    it("should log translation when enabled", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      const plugin = createConsoleLogger({ logTranslations: true });
      plugin.beforeTranslate("test.key");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Translating: "test.key"'),
        expect.any(String)
      );
      spy.mockRestore();
    });

    it("should not log when disabled", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      const plugin = createConsoleLogger({ logTranslations: false });
      plugin.beforeTranslate("test.key");
      expect(spy).not.toHaveBeenCalledWith(
        expect.stringContaining("Translating")
      );
      spy.mockRestore();
    });
  });

  describe("afterTranslate", () => {
    it("should not log fast translations", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      const plugin = createConsoleLogger({ logPerformance: true });
      plugin.beforeTranslate("fast.key");
      plugin.afterTranslate("result", "fast.key");
      expect(spy).not.toHaveBeenCalledWith(
        expect.stringContaining("Slow")
      );
      spy.mockRestore();
    });
  });

  describe("onLocaleChange", () => {
    it("should log locale change when enabled", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      const plugin = createConsoleLogger({ logLocaleChanges: true });
      plugin.onLocaleChange("zh-CN", "en");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("Locale changed"),
        expect.any(String)
      );
      spy.mockRestore();
    });

    it("should not log when disabled", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => { });
      const plugin = createConsoleLogger({ logLocaleChanges: false });
      plugin.onLocaleChange("zh-CN", "en");
      expect(spy).not.toHaveBeenCalledWith(
        expect.stringContaining("Locale changed")
      );
      spy.mockRestore();
    });
  });

  describe("onMissingKey", () => {
    it("should warn about missing keys when enabled", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
      const plugin = createConsoleLogger({ logMissingKeys: true });
      const result = plugin.onMissingKey("missing.key", "en");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("Missing translation"),
        expect.any(String)
      );
      expect(result).toBeUndefined();
      spy.mockRestore();
    });

    it("should not warn when disabled", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
      const plugin = createConsoleLogger({ logMissingKeys: false });
      plugin.onMissingKey("missing.key", "en");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("onError", () => {
    it("should log errors with context", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => { });
      const plugin = createConsoleLogger();
      plugin.onError(new Error("test error"), { key: "test", locale: "en" as Locale });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("Translation error"),
        expect.any(String),
        expect.any(Object)
      );
      spy.mockRestore();
    });
  });
});

describe("Missing Key Reporter Plugin", () => {
  let reporter: MissingKeyReporter;

  beforeEach(() => {
    reporter = new MissingKeyReporter({
      maxEntries: 100,
      autoExport: false,
    });
  });

  it("should create instance with defaults", () => {
    const r = new MissingKeyReporter();
    expect(r).toBeInstanceOf(MissingKeyReporter);
  });

  it("should create plugin via createPlugin", () => {
    const plugin = reporter.createPlugin();
    expect(plugin.name).toBe("missing-key-reporter");
    expect(plugin.version).toBe("1.0.0");
  });

  it("should track missing keys", () => {
    const plugin = reporter.createPlugin();

    plugin.onMissingKey("key1", "en" as Locale);
    plugin.onMissingKey("key2", "zh-CN" as Locale);

    const report = reporter.getMissingKeys();
    expect(report.length).toBe(2);
  });

  it("should increment count for duplicate keys", () => {
    const plugin = reporter.createPlugin();

    plugin.onMissingKey("duplicate.key", "en" as Locale);
    plugin.onMissingKey("duplicate.key", "en" as Locale);
    plugin.onMissingKey("duplicate.key", "en" as Locale);

    const report = reporter.getMissingKeys();
    const entry = report.find((e) => e.key === "duplicate.key");
    expect(entry?.count).toBe(3);
  });

  it("should enforce max entries limit", () => {
    const limitedReporter = new MissingKeyReporter({ maxEntries: 3 });
    const plugin = limitedReporter.createPlugin();

    for (let i = 0; i < 5; i++) {
      plugin.onMissingKey(`key-${i}`, "en" as Locale);
    }

    const report = limitedReporter.getMissingKeys();
    expect(report.length).toBeLessThanOrEqual(3);
  });

  it("should clear entries", () => {
    const plugin = reporter.createPlugin();
    plugin.onMissingKey("temp.key", "en" as Locale);

    reporter.clear();
    expect(reporter.getMissingKeys().length).toBe(0);
  });

  it("should export report as string", () => {
    const plugin = reporter.createPlugin();
    plugin.onMissingKey("export.key", "en" as Locale);

    const exported = reporter.generateReport();
    expect(exported).toContain("MISSING TRANSLATION KEYS REPORT");
    expect(exported).toContain("export.key");
  });

  it("should provide utility methods", () => {
    const plugin = reporter.createPlugin();
    plugin.onMissingKey("key1", "en" as Locale);
    plugin.onMissingKey("key2", "en" as Locale);
    plugin.onMissingKey("key3", "zh-CN" as Locale);

    expect(reporter.getUniqueMissingCount()).toBe(3);
    expect(reporter.getTotalMisses()).toBe(3);

    const enKeys = reporter.getByLocale("en" as Locale);
    expect(enKeys.length).toBe(2);
  });

  it("should export JSON format", () => {
    const plugin = reporter.createPlugin();
    plugin.onMissingKey("json.key", "en" as Locale);

    const json = reporter.exportJSON();
    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("json.key");
  });

  it("should handle destroy correctly", () => {
    const plugin = reporter.createPlugin();
    plugin.onMissingKey("destroy.key", "en" as Locale);

    expect(reporter.getUniqueMissingCount()).toBe(1);

    reporter.destroy();
    expect(reporter.getUniqueMissingCount()).toBe(0);
  });

  it("should handle empty generateReport gracefully", () => {
    const emptyReporter = new MissingKeyReporter();
    const report = emptyReporter.generateReport();
    expect(report).toContain("No missing keys detected!");
  });

  it("should sort entries by count in getMissingKeys", () => {
    const plugin = reporter.createPlugin();
    plugin.onMissingKey("rare.key", "en" as Locale);
    plugin.onMissingKey("common.key", "en" as Locale);
    plugin.onMissingKey("common.key", "en" as Locale);
    plugin.onMissingKey("common.key", "en" as Locale);

    const sorted = reporter.getMissingKeys();
    expect(sorted[0].key).toBe("common.key");
    expect(sorted[0].count).toBe(3);
  });
});
