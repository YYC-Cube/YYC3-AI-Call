/**
 * file performance-tracker.ts
 * description 性能追踪插件
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[plugin]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 性能追踪插件
 */
import type { I18nPlugin } from "../plugins.js";

interface PerformanceEntry {
  key: string;
  duration: number; // ms
  timestamp: number;
  cached: boolean;
}

export interface PerformanceMetrics {
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageDuration: number;
  maxDuration: number;
  slowTranslations: PerformanceEntry[];
}

export interface PerformanceTrackerConfig {
  slowThreshold?: number; // ms (default: 10ms)
  maxSlowEntries?: number;
  samplingRate?: number; // 0-1 (1 = track all)
}

export class PerformanceTracker {
  private entries: PerformanceEntry[] = [];
  private config: Required<PerformanceTrackerConfig>;
  private timingMap = new Map<string, number>();

  constructor(config: PerformanceTrackerConfig = {}) {
    this.config = {
      slowThreshold: config.slowThreshold ?? 10,
      maxSlowEntries: config.maxSlowEntries ?? 100,
      samplingRate: config.samplingRate ?? 1,
    };
  }

  createPlugin(): I18nPlugin {
    const self = this; // Preserve context

    return {
      name: "performance-tracker",
      version: "1.0.0",

      beforeTranslate(key: string) {
        if (Math.random() <= self.config.samplingRate) {
          self.timingMap.set(key, performance.now());
        }
      },

      afterTranslate(_result: string, key: string): string | undefined {
        const startTime = self.timingMap.get(key);
        
        if (startTime !== undefined) {
          const duration = performance.now() - startTime;
          self.timingMap.delete(key);

          const entry: PerformanceEntry = {
            key,
            duration,
            timestamp: Date.now(),
            cached: duration < 1, // Assume <1ms means cached
          };

          self.entries.push(entry);

          // Track slow translations
          if (duration > self.config.slowThreshold) {
            self.trackSlowTranslation(entry);
          }

          // Limit total entries to prevent memory leak
          if (self.entries.length > 10000) {
            self.entries = self.entries.slice(-5000); // Keep last half
          }
        }

        return undefined; // Don't modify result
      },
    };
  }

  private trackSlowTranslation(entry: PerformanceEntry): void {
    const slowEntries = this.getMetrics().slowTranslations;

    if (slowEntries.length >= this.config.maxSlowEntries) {
      slowEntries.shift();
    }

    slowEntries.push(entry);
    slowEntries.sort((a, b) => b.duration - a.duration);
  }

  getMetrics(): PerformanceMetrics {
    const totalCalls = this.entries.length;
    
    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageDuration: 0,
        maxDuration: 0,
        slowTranslations: [],
      };
    }

    const cacheHits = this.entries.filter((e) => e.cached).length;
    const cacheMisses = totalCalls - cacheHits;
    const totalDuration = this.entries.reduce((sum, e) => sum + e.duration, 0);
    const averageDuration = totalDuration / totalCalls;
    const maxDuration = Math.max(...this.entries.map((e) => e.duration));
    const slowTranslations = this.entries
      .filter((e) => e.duration > this.config.slowThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, this.config.maxSlowEntries);

    return {
      totalCalls,
      cacheHits,
      cacheMisses,
      averageDuration,
      maxDuration,
      slowTranslations,
    };
  }

  getCacheHitRate(): number {
    const metrics = this.getMetrics();
    return metrics.totalCalls > 0 
      ? (metrics.cacheHits / metrics.totalCalls) * 100 
      : 0;
  }

  getPercentile(percentile: number): number {
    if (this.entries.length === 0) return 0;

    const sorted = [...this.entries].sort((a, b) => a.duration - b.duration);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)]?.duration ?? 0;
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const hitRate = this.getCacheHitRate();

    let output = `\n${"=".repeat(80)}\n`;
    output += `⚡ PERFORMANCE METRICS REPORT\n`;
    output += `${"=".repeat(80)}\n\n`;

    output += `Overview:\n`;
    output += `  • Total translation calls: ${metrics.totalCalls}\n`;
    output += `  • Cache hits: ${metrics.cacheHits} (${hitRate.toFixed(1)}%)\n`;
    output += `  • Cache misses: ${metrics.cacheMisses}\n`;
    output += `  • Average duration: ${metrics.averageDuration.toFixed(3)}ms\n`;
    output += `  • Max duration: ${metrics.maxDuration.toFixed(3)}ms\n`;
    output += `  • P50 (median): ${this.getPercentile(50).toFixed(3)}ms\n`;
    output += `  • P95: ${this.getPercentile(95).toFixed(3)}ms\n`;
    output += `  • P99: ${this.getPercentile(99).toFixed(3)}ms\n\n`;

    if (metrics.slowTranslations.length > 0) {
      output += `Slow Translations (>${this.config.slowThreshold}ms):\n`;
      output += `${"-".repeat(80)}\n\n`;

      for (const entry of metrics.slowTranslations.slice(0, 10)) {
        output += `  ⚠️ "${entry.key}" - ${entry.duration.toFixed(2)}ms\n`;
      }

      if (metrics.slowTranslations.length > 10) {
        output += `\n  ... and ${metrics.slowTranslations.length - 10} more\n`;
      }
    } else {
      output += `✅ No slow translations detected!\n`;
    }

    output += `${"=".repeat(80)}\n`;

    return output;
  }

  clear(): void {
    this.entries = [];
    this.timingMap.clear();
  }

  exportJSON(): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      entries: this.entries,
    }, null, 2);
  }
}
