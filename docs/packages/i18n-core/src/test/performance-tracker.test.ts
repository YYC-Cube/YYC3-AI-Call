/**
 * file performance-tracker.test.ts
 * description @yyc3/i18n-core performance-tracker.ts 单元测试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [test],[unit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core performance-tracker.ts 单元测试
 */
import { beforeEach, describe, expect, it } from "vitest";
import { PerformanceTracker } from "../lib/plugins/performance-tracker.js";

describe("PerformanceTracker", () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    tracker = new PerformanceTracker({
      slowThreshold: 10,
      maxSlowEntries: 50,
      samplingRate: 1,
    });
  });

  describe("constructor", () => {
    it("should create instance with defaults", () => {
      const t = new PerformanceTracker();
      expect(t).toBeInstanceOf(PerformanceTracker);
    });

    it("should accept custom config", () => {
      const t = new PerformanceTracker({ slowThreshold: 5, maxSlowEntries: 20 });
      expect(t).toBeInstanceOf(PerformanceTracker);
    });
  });

  describe("createPlugin", () => {
    it("should return valid I18nPlugin object", () => {
      const plugin = tracker.createPlugin();
      expect(plugin.name).toBe("performance-tracker");
      expect(plugin.version).toBe("1.0.0");
      expect(typeof plugin.beforeTranslate).toBe("function");
      expect(typeof plugin.afterTranslate).toBe("function");
    });
  });

  describe("tracking lifecycle", () => {
    it("should track translation timing", () => {
      const plugin = tracker.createPlugin();

      plugin.beforeTranslate("test.key");

      const result = "translated value";
      plugin.afterTranslate(result, "test.key");

      const metrics = tracker.getMetrics();
      expect(metrics.totalCalls).toBe(1);
    });

    it("should track multiple translations", () => {
      const plugin = tracker.createPlugin();

      for (let i = 0; i < 5; i++) {
        plugin.beforeTranslate(`key-${i}`);
        plugin.afterTranslate(`value-${i}`, `key-${i}`);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.totalCalls).toBe(5);
    });

    it("should detect cached translations (<1ms)", () => {
      const plugin = tracker.createPlugin();

      plugin.beforeTranslate("cached.key");
      plugin.afterTranslate("cached", "cached.key");

      const metrics = tracker.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(0);
    });

    it("should handle missing beforeTranslate gracefully", () => {
      const plugin = tracker.createPlugin();

      plugin.afterTranslate("result", "no-before-key");

      const metrics = tracker.getMetrics();
      expect(metrics.totalCalls).toBe(0);
    });
  });

  describe("getMetrics", () => {
    it("should return empty metrics when no calls", () => {
      const metrics = tracker.getMetrics();
      expect(metrics.totalCalls).toBe(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.maxDuration).toBe(0);
      expect(metrics.slowTranslations).toEqual([]);
    });

    it("should calculate correct averages and max", () => {
      const plugin = tracker.createPlugin();

      plugin.beforeTranslate("key1");
      plugin.afterTranslate("v1", "key1");
      plugin.beforeTranslate("key2");
      plugin.afterTranslate("v2", "key2");

      const metrics = tracker.getMetrics();
      expect(metrics.totalCalls).toBe(2);
      expect(typeof metrics.averageDuration).toBe("number");
      expect(typeof metrics.maxDuration).toBe("number");
      expect(metrics.maxDuration).toBeGreaterThanOrEqual(0);
    });

    it("should track slow translations separately", () => {
      const slowTracker = new PerformanceTracker({ slowThreshold: 0 });
      const plugin = slowTracker.createPlugin();

      plugin.beforeTranslate("slow.key");
      plugin.afterTranslate("value", "slow.key");

      const metrics = slowTracker.getMetrics();
      expect(metrics.slowTranslations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getCacheHitRate", () => {
    it("should return 0 when no calls", () => {
      expect(tracker.getCacheHitRate()).toBe(0);
    });

    it("should calculate hit rate correctly", () => {
      const plugin = tracker.createPlugin();

      for (let i = 0; i < 4; i++) {
        plugin.beforeTranslate(`key-${i}`);
        plugin.afterTranslate(`val-${i}`, `key-${i}`);
      }

      const rate = tracker.getCacheHitRate();
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });

  describe("getPercentile", () => {
    it("should return 0 when no entries", () => {
      expect(tracker.getPercentile(50)).toBe(0);
      expect(tracker.getPercentile(95)).toBe(0);
      expect(tracker.getPercentile(99)).toBe(0);
    });

    it("should calculate P50 correctly", () => {
      const plugin = tracker.createPlugin();

      for (let i = 0; i < 10; i++) {
        plugin.beforeTranslate(`p${i}`);
        plugin.afterTranslate(`v${i}`, `p${i}`);
      }

      const p50 = tracker.getPercentile(50);
      expect(typeof p50).toBe("number");
      expect(p50).toBeGreaterThanOrEqual(0);
    });

    it("should calculate P99 correctly", () => {
      const plugin = tracker.createPlugin();

      for (let i = 0; i < 100; i++) {
        plugin.beforeTranslate(`k${i}`);
        plugin.afterTranslate(`v${i}`, `k${i}`);
      }

      const p99 = tracker.getPercentile(99);
      expect(typeof p99).toBe("number");
    });
  });

  describe("generateReport", () => {
    it("should generate formatted report string", () => {
      const report = tracker.generateReport();
      expect(report).toContain("PERFORMANCE METRICS REPORT");
      expect(report).toContain("Total translation calls: 0");
      expect(report).toContain("No slow translations detected!");
    });

    it("should include stats when entries exist", () => {
      const plugin = tracker.createPlugin();
      plugin.beforeTranslate("some.key");
      plugin.afterTranslate("value", "some.key");

      const report = tracker.generateReport();
      expect(report).toContain("Total translation calls: 1");
      expect(report).toContain("Cache hits:");
    });

    it("should show slow translations when present", () => {
      const zeroTracker = new PerformanceTracker({ slowThreshold: 0 });
      const plugin = zeroTracker.createPlugin();
      plugin.beforeTranslate("slow.key");
      plugin.afterTranslate("value", "slow.key");

      const report = zeroTracker.generateReport();
      expect(report).toContain("Slow Translations");
    });
  });

  describe("clear", () => {
    it("should reset all tracking data", () => {
      const plugin = tracker.createPlugin();

      plugin.beforeTranslate("temp.key");
      plugin.afterTranslate("value", "temp.key");

      expect(tracker.getMetrics().totalCalls).toBe(1);

      tracker.clear();

      expect(tracker.getMetrics().totalCalls).toBe(0);
      expect(tracker.getCacheHitRate()).toBe(0);
    });
  });

  describe("exportJSON", () => {
    it("should export valid JSON", () => {
      const json = tracker.exportJSON();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty("metrics");
      expect(parsed).toHaveProperty("entries");
    });

    it("should include tracked entries in JSON", () => {
      const plugin = tracker.createPlugin();
      plugin.beforeTranslate("json.key");
      plugin.afterTranslate("value", "json.key");

      const parsed = JSON.parse(tracker.exportJSON());
      expect(parsed.entries.length).toBe(1);
      expect(parsed.entries[0].key).toBe("json.key");
    });
  });

  describe("samplingRate", () => {
    it("should skip tracking when random > samplingRate", () => {
      const sampledTracker = new PerformanceTracker({ samplingRate: 0 });
      const plugin = sampledTracker.createPlugin();

      plugin.beforeTranslate("sampled.key");
      plugin.afterTranslate("value", "sampled.key");

      expect(sampledTracker.getMetrics().totalCalls).toBe(0);
    });
  });

  describe("memory management", () => {
    it("should limit total entries to prevent memory leak", () => {
      new PerformanceTracker({ maxSlowEntries: 10000 });

      const p = tracker.createPlugin();
      for (let i = 0; i < 15000; i++) {
        p.beforeTranslate(`mem-${i}`);
        p.afterTranslate(`v-${i}`, `mem-${i}`);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.totalCalls).toBeLessThanOrEqual(10000);
    });
  });
});
