/**
 * file detector.ts
 * description 语言自动检测
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 语言自动检测
 */
import type { Locale } from "./types.js";

const LOCALE_ALIASES: Record<string, Locale> = {
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  zh_cn: "zh-CN",
  "zh-hans": "zh-CN",
  "zh-hans-cn": "zh-CN",
  "zh-tw": "zh-TW",
  zh_hk: "zh-TW",
  "zh-hant": "zh-TW",
  en: "en",
  "en-us": "en",
  en_gb: "en",
  ja: "ja",
  "ja-jp": "ja",
  ko: "ko",
  "ko-kr": "ko",
  fr: "fr",
  "fr-fr": "fr",
  de: "de",
  de_de: "de",
  es: "es",
  "es-es": "es",
  pt: "pt-BR",
  "pt-br": "pt-BR",
  ar: "ar",
  "ar-sa": "ar",
};

export interface LocaleDetectionResult {
  locale: Locale;
  source: "env" | "system" | "storage" | "default";
  confidence: number;
}

export function detectSystemLocale(storedLocale?: string | null): LocaleDetectionResult {
  const envResult = detectFromEnvironment();
  if (envResult && envResult.confidence > 0.8) {
    return envResult;
  }

  if (storedLocale) {
    const normalized = normalizeLocale(storedLocale);
    if (normalized) {
      return { locale: normalized, source: "storage", confidence: 0.95 };
    }
  }

  const systemResult = detectFromSystem();
  if (systemResult) {
    return systemResult;
  }

  return { locale: "en", source: "default", confidence: 0.5 };
}

function detectFromEnvironment(): LocaleDetectionResult | null {
  const envVars = [
    process.env?.LANGUAGE,
    process.env?.LANG,
    process.env?.LC_ALL,
    process.env?.LC_MESSAGES,
  ].filter(Boolean);

  for (const envVar of envVars) {
    const normalized = normalizeLocale(envVar!);
    if (normalized) {
      return { locale: normalized, source: "env", confidence: 0.95 };
    }
  }

  return null;
}

function detectFromSystem(): LocaleDetectionResult | null {
  try {
    if (typeof Intl !== "undefined" && typeof navigator !== "undefined") {
      const languages = (Intl.getCanonicalLocales?.(navigator.languages || [])) as string[];

      for (const lang of languages) {
        const normalized = normalizeLocale(lang);
        if (normalized) {
          return { locale: normalized, source: "system", confidence: 0.85 };
        }
      }

      if (navigator.language) {
        const normalized = normalizeLocale(navigator.language);
        if (normalized) {
          return { locale: normalized, source: "system", confidence: 0.8 };
        }
      }
    }
  } catch {
    // Intl/navigator unavailable
  }

  return null;
}

export function normalizeLocale(locale: string): Locale | null {
  const lower = locale.toLowerCase().trim();

  if (lower in LOCALE_ALIASES) {
    return LOCALE_ALIASES[lower] ?? null;
  }

  const parts = lower.split(".");
  const firstPart = parts.length > 0 ? parts[0] : "";
  if (!firstPart) return null;

  const withoutEncoding = firstPart.replace("-", "_");
  if (withoutEncoding in LOCALE_ALIASES) {
    return LOCALE_ALIASES[withoutEncoding] ?? null;
  }

  const langParts = lower.split(/[-_]/);
  const primaryLang = langParts.length > 0 ? langParts[0] : "";
  if (!primaryLang) return null;

  const aliasMap: Record<string, Locale> = {
    zh: "zh-CN",
    en: "en",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    pt: "pt-BR",
    ar: "ar",
  };

  return aliasMap[primaryLang] ?? null;
}

export function isChineseLocale(locale: Locale): boolean {
  return locale.startsWith("zh");
}
