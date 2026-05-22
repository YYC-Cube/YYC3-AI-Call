/**
 * file i18n-audit.ts
 * description 翻译审计系统
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[i18n]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 翻译审计系统
 */
import { t } from "./engine.js";
import { logger } from "./infra/logger.js";

interface I18nAuditEntry {
  key: string;
  fallback: string;
  location: string;
  timestamp: number;
}

class I18nAuditLogger {
  private entries: I18nAuditEntry[] = [];
  private enabled = false;

  enable() {
    this.enabled = true;
    this.entries = [];
    logger.info("✅ Translation audit ENABLED");
  }

  disable() {
    this.enabled = false;
    logger.info(`❌ Translation audit DISABLED (${this.entries.length} entries)`);
  }

  log(key: string, fallback: string, location: string) {
    if (!this.enabled) return;

    const entry: I18nAuditEntry = {
      key,
      fallback,
      location,
      timestamp: Date.now(),
    };

    this.entries.push(entry);

    logger.warn(
      `Missing translation:\n` +
      `  🔑 Key: ${key}\n` +
      `  📝 Fallback: "${fallback}"\n` +
      `  📍 Location: ${location}`
    );
  }

  getReport(): { total: number; uniqueKeys: Set<string>; entries: I18nAuditEntry[] } {
    const uniqueKeys = new Set(this.entries.map(e => e.key));
    return {
      total: this.entries.length,
      uniqueKeys,
      entries: this.entries,
    };
  }

  exportReport(): string {
    const report = this.getReport();

    let output = `\n${"=".repeat(80)}\n`;
    output += `📊 I18N AUDIT REPORT\n`;
    output += `${"=".repeat(80)}\n\n`;
    output += `Total missing translations: ${report.total}\n`;
    output += `Unique keys missing: ${report.uniqueKeys.size}\n\n`;

    output += `📋 MISSING TRANSLATION KEYS:\n`;
    output += `${"-".repeat(80)}\n\n`;

    for (const key of Array.from(report.uniqueKeys).sort()) {
      const examples = report.entries.filter(e => e.key === key).slice(0, 3);
      output += `❌ ${key}\n`;
      if (examples.length > 0) {
        output += `   Example fallback: "${examples[0]?.fallback}"\n`;
        output += `   Found in: ${examples[0]?.location}\n\n`;
      }
    }

    output += `${"=".repeat(80)}\n\n`;

    return output;
  }

  clear() {
    this.entries = [];
  }
}

export const i18nAudit = new I18nAuditLogger();

export function createAuditedT(location: string) {
  return (key: string, params?: Record<string, string>): string => {
    const result = t(key, params);

    if (result === key && !key.startsWith("{") && !key.startsWith("config.")) {
      i18nAudit.log(key, key, location);
    } else if (result === `${key}.label` || result === `${key}.help`) {
      i18nAudit.log(key, result.replace(`${key}.`, ""), location);
    }

    return result;
  };
}
