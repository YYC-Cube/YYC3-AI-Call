/**
 * file registry.ts
 * description @yyc3/i18n-core lib/registry.ts 模块
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
 * brief @yyc3/i18n-core lib/registry.ts 模块
 */
import type { Locale, TranslationMap } from "./types.js";

type LazyLocale = Exclude<Locale, "en">;
type LocaleModule = Record<string, TranslationMap>;

type LazyLocaleRegistration = {
  exportName: string;
  loader: () => Promise<LocaleModule>;
};

export const DEFAULT_LOCALE: Locale = "en";

const LAZY_LOCALES: readonly LazyLocale[] = [
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "fr",
  "de",
  "es",
  "pt-BR",
  "ar",
];

const LAZY_LOCALE_REGISTRY: Record<LazyLocale, LazyLocaleRegistration> = {
  "zh-CN": {
    exportName: "zh_CN",
    loader: () => import("../locales/zh-CN.js"),
  },
  "zh-TW": {
    exportName: "zh_TW",
    loader: () => import("../locales/zh-TW.js"),
  },
  ja: {
    exportName: "ja",
    loader: () => import("../locales/ja.js"),
  },
  ko: {
    exportName: "ko",
    loader: () => import("../locales/ko.js"),
  },
  fr: {
    exportName: "fr",
    loader: () => import("../locales/fr.js"),
  },
  de: {
    exportName: "de",
    loader: () => import("../locales/de.js"),
  },
  es: {
    exportName: "es",
    loader: () => import("../locales/es.js"),
  },
  "pt-BR": {
    exportName: "pt_BR",
    loader: () => import("../locales/pt-BR.js"),
  },
  ar: {
    exportName: "ar",
    loader: () => import("../locales/ar.js"),
  },
};

export const SUPPORTED_LOCALES: ReadonlyArray<Locale> = [DEFAULT_LOCALE, ...LAZY_LOCALES];

export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export async function loadLazyLocaleTranslation(locale: LazyLocale): Promise<TranslationMap> {
  const registration = LAZY_LOCALE_REGISTRY[locale];

  if (!registration) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const module = await registration.loader();
  return module[registration.exportName] as TranslationMap;
}

export function resolveNavigatorLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null;

  const browserLocales = navigator.languages || [navigator.language];

  for (const locale of browserLocales) {
    if (isSupportedLocale(locale)) {
      return locale;
    }

    // Try base language (e.g., "zh" from "zh-CN")
    const baseLang = locale.split('-')[0];
    if (baseLang && isSupportedLocale(baseLang as Locale)) {
      return baseLang as Locale;
    }
  }

  return null;
}
