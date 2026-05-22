/**
 * file missing-key-reporter.ts
 * description 缺失 Key 上报插件
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
 * brief 缺失 Key 上报插件
 */
import { logger } from "../infra/logger.js";
import type { I18nPlugin } from "../plugins.js";
import type { Locale } from "../types.js";

interface MissingKeyEntry {
  key: string;
  locale: Locale;
  timestamp: number;
  count: number;
}

export interface MissingKeyReporterConfig {
  maxEntries?: number;
  autoExport?: boolean;
  exportInterval?: number; // ms
  onReport?: (entries: MissingKeyEntry[]) => void;
}

export class MissingKeyReporter {
  private entries = new Map<string, MissingKeyEntry>();
  private config: Required<MissingKeyReporterConfig>;
  private exportTimer?: ReturnType<typeof setInterval>;

  constructor(config: MissingKeyReporterConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      autoExport: config.autoExport ?? false,
      exportInterval: config.exportInterval ?? 60 * 1000, // 1 minute
      onReport: config.onReport ?? (() => { }),
    };

    if (this.config.autoExport) {
      this.startAutoExport();
    }
  }

  createPlugin(): I18nPlugin {
    const self = this; // Preserve context

    return {
      name: "missing-key-reporter",
      version: "1.0.0",

      onMissingKey(key: string, locale: Locale): string | undefined {
        const entryKey = `${locale}:${key}`;

        if (self.entries.has(entryKey)) {
          const existing = self.entries.get(entryKey)!;
          existing.count++;
          existing.timestamp = Date.now();
        } else {
          if (self.entries.size >= self.config.maxEntries) {
            let oldestKey = "";
            let oldestTime = Infinity;

            for (const [k, v] of self.entries) {
              if (v.timestamp < oldestTime) {
                oldestTime = v.timestamp;
                oldestKey = k;
              }
            }

            if (oldestKey) {
              self.entries.delete(oldestKey);
            }
          }

          self.entries.set(entryKey, {
            key,
            locale,
            timestamp: Date.now(),
            count: 1,
          });
        }

        return undefined;
      },
    };
  }

  getMissingKeys(): MissingKeyEntry[] {
    return Array.from(this.entries.values()).sort((a, b) => b.count - a.count);
  }

  getUniqueMissingCount(): number {
    return this.entries.size;
  }

  getTotalMisses(): number {
    let total = 0;
    for (const entry of this.entries.values()) {
      total += entry.count;
    }
    return total;
  }

  getByLocale(locale: Locale): MissingKeyEntry[] {
    return this.getMissingKeys().filter((e) => e.locale === locale);
  }

  generateReport(): string {
    const entries = this.getMissingKeys();
    const uniqueCount = entries.length;
    const totalMisses = this.getTotalMisses();

    let output = `\n${"=".repeat(80)}\n`;
    output += `📊 MISSING TRANSLATION KEYS REPORT\n`;
    output += `${"=".repeat(80)}\n\n`;
    output += `Summary:\n`;
    output += `  • Unique missing keys: ${uniqueCount}\n`;
    output += `  • Total misses: ${totalMisses}\n`;
    output += `  • Report time: ${new Date().toISOString()}\n\n`;

    if (entries.length > 0) {
      output += `Top Missing Keys (by frequency):\n`;
      output += `${"-".repeat(80)}\n\n`;

      const topEntries = entries.slice(0, 20);
      for (const entry of topEntries) {
        output += `  ❌ [${entry.locale}] "${entry.key}" (${entry.count}x)\n`;
      }

      if (entries.length > 20) {
        output += `\n  ... and ${entries.length - 20} more\n`;
      }
    } else {
      output += `✅ No missing keys detected!\n`;
    }

    output += `${"=".repeat(80)}\n`;

    return output;
  }

  clear(): void {
    this.entries.clear();
  }

  exportJSON(): string {
    return JSON.stringify(this.getMissingKeys(), null, 2);
  }

  private startAutoExport(): void {
    this.exportTimer = setInterval(() => {
      const report = this.generateReport();
      logger.info(report);
      this.config.onReport(this.getMissingKeys());
    }, this.config.exportInterval);
  }

  stopAutoExport(): void {
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = undefined;
    }
  }

  destroy(): void {
    this.stopAutoExport();
    this.clear();
  }
}
