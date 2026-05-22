/**
 * file console-logger.ts
 * description 控制台日志插件
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
 * brief 控制台日志插件
 */
import type { I18nPlugin, I18nContext } from "../plugins.js";
import type { Locale } from "../types.js";

export interface ConsoleLoggerConfig {
  logTranslations?: boolean;
  logMissingKeys?: boolean;
  logLocaleChanges?: boolean;
  logPerformance?: boolean;
  colors?: {
    translate?: string;
    missing?: string;
    localeChange?: string;
    performance?: string;
  };
}

export function createConsoleLogger(config: ConsoleLoggerConfig = {}): I18nPlugin {
  const {
    logTranslations = false,
    logMissingKeys = true,
    logLocaleChanges = true,
    logPerformance = true,
    colors = {
      translate: "#0099ff",
      missing: "#ff9900",
      localeChange: "#00ff00",
      performance: "#9966ff",
    },
  } = config;

  const timingMap = new Map<string, number>();

  return {
    name: "console-logger",
    version: "1.0.0",

    beforeTranslate(key: string) {
      if (logPerformance) {
        timingMap.set(key, performance.now());
      }

      if (logTranslations) {
        console.log(
          `%c[i18n] → Translating: "${key}"`,
          `color: ${colors.translate};`
        );
      }
    },

    afterTranslate(_result: string, key: string) {
      if (logPerformance && timingMap.has(key)) {
        const start = timingMap.get(key)!;
        const duration = performance.now() - start;

        if (duration > 10) { // Only log slow translations (>10ms)
          console.log(
            `%c⚠️ Slow translation (${duration.toFixed(2)}ms): "${key}"`,
            `color: ${colors.performance}; font-weight: bold;`
          );
        }

        timingMap.delete(key);
      }
    },

    onLocaleChange(newLocale: Locale, oldLocale: Locale) {
      if (logLocaleChanges) {
        console.log(
          `%c🌍 Locale changed: ${oldLocale} → ${newLocale}`,
          `color: ${colors.localeChange}; font-weight: bold;`
        );
      }
    },

    onMissingKey(key: string, locale: Locale) {
      if (logMissingKeys) {
        console.warn(
          `%c❌ Missing translation [${locale}]: "${key}"`,
          `color: ${colors.missing}; font-weight: bold;`
        );
      }

      return undefined; // Don't modify behavior, just log
    },

    onError(error: Error, context: I18nContext) {
      console.error(
        `%c💥 Translation error: ${error.message}`,
        `color: #ff0000; font-weight: bold;`,
        context
      );
    },
  };
}
